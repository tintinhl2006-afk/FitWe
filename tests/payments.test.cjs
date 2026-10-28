const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, nextServerStub } = require("./helpers/harness.cjs");

process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests-only";

const state = { prisma: null, userId: null, created: [], updates: [] };

const h = createHarness({
  "@/lib/prisma": { prisma: new Proxy({}, { get: (_, k) => state.prisma[k] }) },
  "@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
  "@/lib/apiAuth": { getRequestUserId: async () => state.userId },
  "@/lib/invoiceUtils": {
    getActiveGymPaymentMethod: async () => null,
    sendInvoiceEmailForPayment: async () => {},
    generateNextInvoiceNumber: async () => "GI-2026-00001",
  },
  "@/lib/encryption": { decryptSecret: (v) => v ?? "" },
  "@/lib/paymentDedup": { isDuplicateProviderRefViolation: () => false },
  stripe: class Stripe {},
  "next/server": nextServerStub,
});

const verify = h.load("app/api/user/payment/verify/route.ts");
const webhook = h.load("app/api/user/payment/redsys-webhook/route.ts");
const { signPaymentBinding } = h.load("lib/paymentBinding.ts");
const { generateMerchantSignature } = h.load("lib/redsys.ts");

const setEnv = (v) => { process.env.NODE_ENV = v; };

/** An in-memory database for the payment routes. */
function makeDb({ method = null, orders = {}, members = {}, plans = {} } = {}) {
  state.created = [];
  state.updates = [];
  const tx = {
    paymentRecord: {
      create: async ({ data }) => {
        const rec = { id: "pay" + (state.created.length + 1), date: new Date("2026-10-16T10:00:00Z"), amount: data.amount, invoiceNumber: data.invoiceNumber, ...data };
        state.created.push(rec);
        return rec;
      },
    },
    user: { update: async (args) => (state.updates.push(args), args) },
  };
  return {
    user: {
      findUnique: async ({ where }) => members[where.id] || { name: "Gimnasio Test", id: where.id },
      findFirst: async ({ where }) => {
        const u = members[where.id];
        return u && u.gymId === where.gymId ? u : null;
      },
    },
    gymPaymentMethod: {
      findFirst: async () => method,
      findUnique: async ({ where }) => (method && method.id === where.id ? method : null),
    },
    subscriptionPlan: {
      findUnique: async ({ where }) => plans[where.id] || null,
      findFirst: async ({ where }) => {
        const p = plans[where.id];
        return p && p.gymId === where.gymId ? p : null;
      },
    },
    paymentRecord: {
      findUnique: async ({ where }) => orders[where.providerRef] || null,
    },
    $transaction: async (fn) => fn(tx),
  };
}

const PLAN = { id: "p1", gymId: "g1", name: "Mensual", price: 49.99, durationDays: 30, isActive: true, billingType: "DURATION" };
const MEMBER = { id: "u1", gymId: "g1", subscriptionStatus: "INACTIVE", subscriptionEndDate: null, creditsRemaining: null };
const demoMethod = { id: "m1", gymId: "g1", gateway: "REDSYS", redsysFuc: "999008881", redsysClave: "mock", vatRate: 21, billingName: "Gimnasio Test" };
const realRedsys = { ...demoMethod, redsysFuc: "123456789", redsysClave: Buffer.from("0123456789abcdef01234567").toString("base64") };
const stripeMethod = { id: "m2", gymId: "g1", gateway: "STRIPE", vatRate: 21, billingName: "Gimnasio Test" };

const get = (query) => verify.GET(new Request(`http://x/api/user/payment/verify?${query}`));

describe("payment verification cannot be used to obtain a plan for free (FW-020)", () => {
  beforeEach(() => {
    state.userId = "u1";
    setEnv("production");
  });

  it("in production a gym with no payment method cannot grant a simulated payment", async () => {
    state.prisma = makeDb({ method: null, members: { u1: MEMBER }, plans: { p1: PLAN } });
    const r = await get("mock=true&planId=p1&order=abc");
    assert.equal(r.status, 403);
    assert.equal(state.created.length, 0);
    assert.equal(state.updates.length, 0);
  });

  it("a simulated payment needs a reference (a NULL one could be repeated forever)", async () => {
    state.prisma = makeDb({ method: demoMethod, members: { u1: MEMBER }, plans: { p1: PLAN } });
    const r = await get("mock=true&planId=p1");
    assert.equal(r.status, 400);
    assert.equal(state.created.length, 0);
  });

  it("a demo gym can still run a simulated payment, stored under a namespaced reference", async () => {
    state.prisma = makeDb({ method: demoMethod, members: { u1: MEMBER }, plans: { p1: PLAN } });
    const r = await get("mock=true&planId=p1&order=abc123");
    assert.equal(r.status, 200);
    assert.equal(state.created.length, 1);
    assert.equal(state.created[0].providerRef, "mock:abc123");
    assert.equal(state.updates[0].data.subscriptionStatus, "ACTIVE");
  });

  it("a gym with real Redsys credentials refuses simulated payments in production", async () => {
    state.prisma = makeDb({ method: realRedsys, members: { u1: MEMBER }, plans: { p1: PLAN } });
    assert.equal((await get("mock=true&planId=p1&order=abc")).status, 400);
    assert.equal(state.created.length, 0);
  });

  it("a Stripe gym refuses simulated payments in production", async () => {
    state.prisma = makeDb({ method: stripeMethod, members: { u1: MEMBER }, plans: { p1: PLAN } });
    assert.equal((await get("mock=true&planId=p1&order=abc")).status, 503);
    assert.equal(state.created.length, 0);
  });

  it("the old real-gateway return flag (mock_redsys) no longer opens the simulated branch", async () => {
    state.prisma = makeDb({ method: realRedsys, members: { u1: MEMBER }, plans: { p1: PLAN } });
    const r = await get("mock_redsys=true&planId=p1&order=999");
    assert.equal(r.status, 409, "it is treated as a real return and waits for the webhook");
    assert.equal(r.body.pending, true);
    assert.equal(state.created.length, 0);
    assert.equal(state.updates.length, 0);
  });

  it("outside production the development flag still works", async () => {
    setEnv("development");
    state.prisma = makeDb({ method: realRedsys, members: { u1: MEMBER }, plans: { p1: PLAN } });
    const r = await get("mock_redsys=true&planId=p1&order=dev1");
    assert.equal(r.status, 200);
    assert.equal(state.created[0].providerRef, "mock:dev1");
  });
});

describe("a real Redsys return only reports what the signed webhook recorded (FW-020)", () => {
  beforeEach(() => {
    state.userId = "u1";
    setEnv("production");
  });
  const recorded = (userId) => ({
    id: "pay9", userId, amount: 49.99, date: new Date("2026-10-16T10:00:00Z"), invoiceNumber: "GI-2026-00007", plan: { name: "Mensual" },
  });

  it("reports the member's own payment once the webhook has recorded it", async () => {
    state.prisma = makeDb({ method: realRedsys, members: { u1: MEMBER }, orders: { ORDER1: recorded("u1") } });
    const r = await get("order=ORDER1");
    assert.equal(r.status, 200);
    assert.equal(r.body.payment.invoiceNumber, "GI-2026-00007");
    assert.equal(state.created.length, 0, "verifying must never create a payment");
    assert.equal(state.updates.length, 0, "verifying must never grant anything");
  });

  it("asks the client to wait while the webhook has not arrived yet", async () => {
    state.prisma = makeDb({ method: realRedsys, members: { u1: MEMBER } });
    const r = await get("order=NOT-YET");
    assert.deepEqual([r.status, r.body.pending], [409, true]);
  });

  it("does not reveal another member's payment", async () => {
    state.prisma = makeDb({ method: realRedsys, members: { u1: MEMBER }, orders: { ORDER2: recorded("someone-else") } });
    const r = await get("order=ORDER2");
    assert.equal(r.status, 409);
    assert.equal(r.body.payment, undefined);
  });

  it("requires a session", async () => {
    state.userId = null;
    state.prisma = makeDb({});
    assert.equal((await get("order=ORDER1")).status, 401);
  });
});

describe("Redsys webhook only honours payments this server started (FW-009)", () => {
  const clave = Buffer.from("0123456789abcdef01234567").toString("base64");
  const method = { id: "m1", gymId: "g1", gateway: "REDSYS", redsysClave: clave, vatRate: 21 };
  const ORDER = "123456789012";

  /** Builds the form body Redsys would post, signed with `key`, carrying the given merchant data. */
  function callback({ data, key = clave, response = "0000" }) {
    const params = {
      Ds_Merchant_Order: ORDER, // used by the signing helper to derive the key
      Ds_Order: ORDER,
      Ds_Amount: "4999",
      Ds_Response: response,
      Ds_MerchantData: encodeURIComponent(JSON.stringify(data)),
    };
    const { merchantParameters, signature } = generateMerchantSignature({ params, redsysClave: key });
    return new Request("http://x/api/user/payment/redsys-webhook", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ Ds_MerchantParameters: merchantParameters, Ds_Signature: signature }).toString(),
    });
  }
  const bound = (over = {}) => {
    const f = { userId: "u1", planId: "p1", gymId: "g1", paymentMethodId: "m1", ...over };
    return { ...f, mac: signPaymentBinding({ ...f, order: ORDER }) };
  };
  const db = (extra = {}) => makeDb({ method, members: { u1: MEMBER }, plans: { p1: PLAN }, ...extra });

  beforeEach(() => {
    setEnv("production");
    state.prisma = db();
  });

  it("grants a payment the checkout endpoint issued and the bank signed", async () => {
    const r = await webhook.POST(callback({ data: bound() }));
    assert.equal(r.status, 200);
    assert.equal(state.created.length, 1);
    assert.equal(state.created[0].providerRef, ORDER);
    assert.equal(state.updates[0].data.subscriptionStatus, "ACTIVE");
  });

  it("rejects a callback with no binding even though the signature is valid", async () => {
    const unbound = bound();
    delete unbound.mac;
    const r = await webhook.POST(callback({ data: unbound }));
    assert.equal(r.status, 400);
    assert.equal(state.created.length, 0);
  });

  it("rejects a valid signature that names a different user than the checkout bound", async () => {
    const forged = { ...bound(), userId: "victim" };
    const r = await webhook.POST(callback({ data: forged }));
    assert.equal(r.status, 400);
    assert.equal(state.created.length, 0);
  });

  it("rejects a forged binding (guessed MAC)", async () => {
    const r = await webhook.POST(callback({ data: { ...bound(), mac: "0".repeat(64) } }));
    assert.equal(r.status, 400);
  });

  it("rejects a signature made with a key that is not the gym's", async () => {
    const other = Buffer.from("ffffffffffffffffffffffff").toString("base64");
    const r = await webhook.POST(callback({ data: bound(), key: other }));
    assert.equal(r.status, 400);
    assert.equal(state.created.length, 0);
  });

  it("refuses a plan that belongs to another gym even with a valid binding", async () => {
    state.prisma = db({ plans: { p1: { ...PLAN, gymId: "other-gym" } } });
    const r = await webhook.POST(callback({ data: bound() }));
    assert.equal(r.status, 400);
    assert.equal(state.created.length, 0);
  });

  it("refuses a member who does not belong to the gym that owns the payment method", async () => {
    state.prisma = db({ members: { u1: { ...MEMBER, gymId: "another-gym" } } });
    const r = await webhook.POST(callback({ data: bound() }));
    assert.notEqual(r.status, 200);
    assert.equal(state.created.length, 0);
  });

  it("acknowledges a payment the bank declined without granting anything", async () => {
    const r = await webhook.POST(callback({ data: bound(), response: "0190" }));
    assert.equal(r.status, 200);
    assert.equal(state.created.length, 0);
  });
});
