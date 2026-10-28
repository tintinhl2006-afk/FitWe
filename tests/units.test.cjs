const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, nextServerStub } = require("./helpers/harness.cjs");

process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests-only";

const h = createHarness({
  "@/lib/prisma": { prisma: {} },
  "next/server": nextServerStub,
});

describe("trainingLimits (FW-024: unbounded sets)", () => {
  const L = h.load("lib/trainingLimits.ts");

  it("accepts ordinary values, also as numeric text", () => {
    assert.equal(L.boundedInt(4, 1, L.MAX_SETS), 4);
    assert.equal(L.boundedInt("5", 1, L.MAX_SETS), 5);
  });
  it("rejects the attack value and anything out of range", () => {
    assert.equal(L.boundedInt(2000000000, 1, L.MAX_SETS), null);
    assert.equal(L.boundedInt(0, 1, L.MAX_SETS), null);
    assert.equal(L.boundedInt(L.MAX_SETS + 1, 1, L.MAX_SETS), null);
    assert.equal(L.boundedInt(L.MAX_SETS, 1, L.MAX_SETS), L.MAX_SETS);
  });
  it("rejects decimals, NaN, text and missing values", () => {
    for (const bad of [2.5, NaN, "abc", "", undefined, null]) assert.equal(L.boundedInt(bad, 1, 50), null);
  });
  it("bounds weights as finite numbers", () => {
    assert.equal(L.boundedNumber(82.5, 0, L.MAX_WEIGHT), 82.5);
    assert.equal(L.boundedNumber(Infinity, 0, 5000), null);
    assert.equal(L.boundedNumber(-1, 0, 5000), null);
  });
});

describe("readPageParams (pagination)", () => {
  const { readPageParams } = h.load("lib/pagination.ts");
  const opts = { defaultSize: 50, maxSize: 100 };

  it("defaults to the first page", () => {
    assert.deepEqual(readPageParams("http://x/", opts), { page: 1, pageSize: 50, skip: 0, take: 50 });
  });
  it("honours page and pageSize", () => {
    assert.deepEqual(readPageParams("http://x/?page=3&pageSize=20", opts), { page: 3, pageSize: 20, skip: 40, take: 20 });
  });
  it("caps pageSize and ignores nonsense", () => {
    assert.equal(readPageParams("http://x/?pageSize=100000", opts).pageSize, 100);
    assert.equal(readPageParams("http://x/?pageSize=-5", opts).pageSize, 50);
    assert.equal(readPageParams("http://x/?page=0", opts).page, 1);
    assert.equal(readPageParams("http://x/?page=abc&pageSize=xyz", opts).skip, 0);
  });
});

describe("generateGymCode (gym code from a cryptographic generator)", () => {
  const { generateGymCode } = h.load("lib/gymCode.ts");

  it("is 6 characters from an unambiguous uppercase alphabet", () => {
    for (let i = 0; i < 200; i++) assert.match(generateGymCode(), /^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/);
  });
  it("does not repeat in a large sample", () => {
    const seen = new Set();
    for (let i = 0; i < 5000; i++) seen.add(generateGymCode());
    assert.ok(seen.size > 4990, `only ${seen.size} distinct codes in 5000`);
  });
});

describe("password helpers (one cost, no account enumeration by timing)", () => {
  const P = h.load("lib/password.ts");

  it("hashes with the shared cost and verifies", async () => {
    const hash = await P.hashPassword("correct horse");
    assert.match(hash, new RegExp(`^\\$2[aby]\\$${P.BCRYPT_ROUNDS}\\$`));
    assert.equal(await P.verifyPassword("correct horse", hash), true);
    assert.equal(await P.verifyPassword("wrong", hash), false);
  });
  it("an unknown account still takes a full comparison and returns false", async () => {
    const hash = await P.hashPassword("x");
    const timeOf = async (fn) => {
      const t = process.hrtime.bigint();
      await fn();
      return Number(process.hrtime.bigint() - t) / 1e6;
    };
    await P.verifyPassword("warm-up", null); // generates the dummy hash once
    const real = await timeOf(() => P.verifyPassword("wrong", hash));
    const unknown = await timeOf(() => P.verifyPassword("wrong", null));
    assert.equal(await P.verifyPassword("anything", null), false);
    assert.equal(await P.verifyPassword("anything", undefined), false);
    // Same order of magnitude: a skipped comparison would be 50-100x faster.
    assert.ok(unknown > real / 4, `unknown ${unknown.toFixed(1)}ms vs real ${real.toFixed(1)}ms`);
  });
});

describe("cron secret (FW-016)", () => {
  const C = h.load("lib/cronAuth.ts");
  const req = (value) => new Request("http://x/", { headers: value == null ? {} : { authorization: value } });

  it("accepts the right secret only", () => {
    process.env.CRON_SECRET = "s3cret-value-1234567890";
    assert.equal(C.isValidCronRequest(req("Bearer s3cret-value-1234567890")), true);
    assert.equal(C.isValidCronRequest(req("Bearer s3cret-value-1234567891")), false);
    assert.equal(C.isValidCronRequest(req("Bearer s3cret")), false);
    assert.equal(C.isValidCronRequest(req("s3cret-value-1234567890")), false);
    assert.equal(C.isValidCronRequest(req(null)), false);
  });
  it("fails closed when the secret is not configured", () => {
    delete process.env.CRON_SECRET;
    assert.equal(C.isValidCronRequest(req("Bearer ")), false);
    assert.equal(C.isValidCronRequest(req("")), false);
  });
});

describe("payment binding (FW-009: webhook trusts nothing it did not issue)", () => {
  const PB = h.load("lib/paymentBinding.ts");
  const b = { userId: "u1", planId: "p1", gymId: "g1", paymentMethodId: "m1", order: "123456789012" };

  it("verifies its own MAC", () => {
    assert.equal(PB.verifyPaymentBinding(b, PB.signPaymentBinding(b)), true);
  });
  it("changing any bound field invalidates the MAC", () => {
    const mac = PB.signPaymentBinding(b);
    for (const f of Object.keys(b)) assert.equal(PB.verifyPaymentBinding({ ...b, [f]: b[f] + "x" }, mac), false, f);
  });
  it("rejects missing, malformed and foreign MACs", () => {
    const mac = PB.signPaymentBinding(b);
    assert.equal(PB.verifyPaymentBinding(b, undefined), false);
    assert.equal(PB.verifyPaymentBinding(b, "z".repeat(64)), false);
    assert.equal(PB.verifyPaymentBinding(b, mac.slice(0, 60)), false);
    assert.equal(PB.verifyPaymentBinding(b, PB.signPaymentBinding({ ...b, userId: "u2" })), false);
  });
  it("a MAC from another secret does not verify", () => {
    const mac = PB.signPaymentBinding(b);
    process.env.NEXTAUTH_SECRET = "a-different-secret";
    assert.equal(PB.verifyPaymentBinding(b, mac), false);
    process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests-only";
  });
});

describe("signed mock-terminal link (FW-027)", () => {
  const M = h.load("lib/mockLink.ts");

  it("verifies a link it issued", async () => {
    const l = await M.signMockLink("49.99", "plan-1");
    assert.equal(await M.verifyMockLink("49.99", "plan-1", l.exp, l.sig), true);
  });
  it("rejects a changed amount or plan (the phishing case)", async () => {
    const l = await M.signMockLink("49.99", "plan-1");
    assert.equal(await M.verifyMockLink("0.01", "plan-1", l.exp, l.sig), false);
    assert.equal(await M.verifyMockLink("49.99", "plan-2", l.exp, l.sig), false);
  });
  it("rejects missing, truncated, expired and re-dated links", async () => {
    const l = await M.signMockLink("49.99", "plan-1");
    assert.equal(await M.verifyMockLink("49.99", "plan-1", l.exp, null), false);
    assert.equal(await M.verifyMockLink("49.99", "plan-1", null, l.sig), false);
    assert.equal(await M.verifyMockLink("49.99", "plan-1", l.exp, l.sig.slice(0, 20)), false);
    const old = await M.signMockLink("49.99", "plan-1", -1000);
    assert.equal(await M.verifyMockLink("49.99", "plan-1", old.exp, old.sig), false);
    assert.equal(await M.verifyMockLink("49.99", "plan-1", String(Date.now() + 9e9), l.sig), false);
  });
  it("handles a link without a plan", async () => {
    const l = await M.signMockLink("10", "");
    assert.equal(await M.verifyMockLink("10", null, l.exp, l.sig), true);
  });
});

describe("Redsys signature verification (FW-009)", () => {
  const R = h.load("lib/redsys.ts");
  const clave = Buffer.from("0123456789abcdef01234567").toString("base64");
  const order = "2610161234567";
  const { merchantParameters, signature } = R.generateMerchantSignature({
    params: { Ds_Merchant_Order: order, Ds_Merchant_Amount: "4999" },
    redsysClave: clave,
  });
  const verify = (over) =>
    R.verifyCallbackSignature({ merchantParametersB64: merchantParameters, signatureReceived: signature, order, redsysClave: clave, ...over });

  it("accepts a valid signature in base64 and base64url", () => {
    assert.equal(verify({}), true);
    assert.equal(verify({ signatureReceived: signature.replace(/\+/g, "-").replace(/\//g, "_") }), true);
  });
  it("rejects altered signature, altered parameters, wrong key, empty signature", () => {
    assert.equal(verify({ signatureReceived: (signature[0] === "A" ? "B" : "A") + signature.slice(1) }), false);
    assert.equal(verify({ merchantParametersB64: merchantParameters + "A" }), false);
    assert.equal(verify({ redsysClave: Buffer.from("ffffffffffffffffffffffff").toString("base64") }), false);
    assert.equal(verify({ signatureReceived: "" }), false);
  });
});

describe("pickClientIp (FW-018)", () => {
  const { pickClientIp } = h.load("lib/rateLimit.ts");
  const hdr = (o) => (n) => o[n];

  it("prefers the headers the platform sets itself", () => {
    assert.equal(pickClientIp(hdr({ "x-vercel-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2", "x-forwarded-for": "9.9.9.9" })), "1.1.1.1");
    assert.equal(pickClientIp(hdr({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "9.9.9.9" })), "2.2.2.2");
  });
  it("falls back to the first x-forwarded-for entry, then to unknown", () => {
    assert.equal(pickClientIp(hdr({ "x-forwarded-for": "3.3.3.3, 4.4.4.4" })), "3.3.3.3");
    assert.equal(pickClientIp(hdr({})), "unknown");
  });
  it("a spoofed x-forwarded-for does not beat the platform header", () => {
    assert.equal(pickClientIp(hdr({ "x-real-ip": "2.2.2.2", "x-forwarded-for": "6.6.6.6, 2.2.2.2" })), "2.2.2.2");
  });
});

describe("CSV escaping (FW-026 / FW-012)", () => {
  // csvEscape is private to the route module, so it is compiled from the route's own source.
  const src = h.read("src/app/api/admin-gym/invoices/route.ts");
  const fn = src.slice(src.indexOf("function csvEscape"), src.indexOf("const MAX_EXPORT_ROWS"));
  const csvEscape = new Function(h.ts.transpileModule(fn, { compilerOptions: { target: h.ts.ScriptTarget.ES2020 } }).outputText + "; return csvEscape;")();

  it("leaves ordinary text, dates and amounts alone, including negative amounts", () => {
    assert.equal(csvEscape("Juan Pérez"), "Juan Pérez");
    assert.equal(csvEscape("2026-10-16"), "2026-10-16");
    assert.equal(csvEscape("49.99"), "49.99");
    assert.equal(csvEscape("-12.50"), "-12.50");
  });
  it("neutralises formulas", () => {
    assert.equal(csvEscape("@SUM(A1)"), "'@SUM(A1)");
    assert.equal(csvEscape("+cmd|x"), "'+cmd|x");
    assert.equal(csvEscape("-2+3"), "'-2+3");
    assert.equal(csvEscape('=WEBSERVICE("http://x")'), `"'=WEBSERVICE(""http://x"")"`);
  });
  it("quotes separators and doubles quotes", () => {
    assert.equal(csvEscape('a"b'), '"a""b"');
    assert.equal(csvEscape("a,b"), '"a,b"');
  });
});
