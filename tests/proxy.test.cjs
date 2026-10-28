const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, nextServerStub } = require("./helpers/harness.cjs");

process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests-only";

const state = { token: null };
const h = createHarness({
  "next/server": nextServerStub,
  "next-auth/jwt": { getToken: async () => state.token },
});
const { proxy } = h.load("proxy.ts");
const { signMockLink } = h.load("lib/mockLink.ts");

const reqFor = (pathAndQuery) => {
  const url = new URL("https://app.example" + pathAndQuery);
  return { url: url.href, nextUrl: { pathname: url.pathname, searchParams: url.searchParams } };
};
const setEnv = (v) => { process.env.NODE_ENV = v; };

describe("simulated payment terminals (FW-027)", () => {
  beforeEach(() => { state.token = null; });

  describe("in production, for an anonymous visitor", () => {
    beforeEach(() => setEnv("production"));

    it("shows the Redsys terminal only with a signed link", async () => {
      const l = await signMockLink("49.99", "plan-1");
      const good = `/dashboard/pago/redsys-mock?amount=49.99&planId=plan-1&exp=${l.exp}&sig=${l.sig}`;
      assert.deepEqual(await proxy(reqFor(good)), { kind: "next" });
    });
    it("redirects an unsigned link, a changed amount, another plan or an expired link", async () => {
      const l = await signMockLink("49.99", "plan-1");
      const good = `/dashboard/pago/redsys-mock?amount=49.99&planId=plan-1&exp=${l.exp}&sig=${l.sig}`;
      const login = { kind: "redirect", to: "/login" };
      assert.deepEqual(await proxy(reqFor("/dashboard/pago/redsys-mock?amount=199.99")), login);
      assert.deepEqual(await proxy(reqFor(good.replace("amount=49.99", "amount=0.01"))), login);
      assert.deepEqual(await proxy(reqFor(good.replace("plan-1", "plan-9"))), login);
      const old = await signMockLink("49.99", "plan-1", -5000);
      assert.deepEqual(await proxy(reqFor(`/dashboard/pago/redsys-mock?amount=49.99&planId=plan-1&exp=${old.exp}&sig=${old.sig}`)), login);
    });
    it("never serves the simulated Stripe terminal", async () => {
      assert.deepEqual(await proxy(reqFor("/dashboard/pago/stripe-mock?amount=10")), { kind: "redirect", to: "/login" });
    });
    it("keeps the gateway return page and the plan list reachable without a cookie", async () => {
      assert.deepEqual(await proxy(reqFor("/dashboard/pago/success?order=123")), { kind: "next" });
      assert.deepEqual(await proxy(reqFor("/dashboard/pago")), { kind: "next" });
    });
  });

  describe("in development", () => {
    beforeEach(() => setEnv("development"));
    it("leaves both simulated terminals usable", async () => {
      assert.deepEqual(await proxy(reqFor("/dashboard/pago/redsys-mock?amount=49.99")), { kind: "next" });
      assert.deepEqual(await proxy(reqFor("/dashboard/pago/stripe-mock?amount=10")), { kind: "next" });
    });
  });
});

describe("route protection is unchanged", () => {
  beforeEach(() => setEnv("production"));

  it("sends anonymous visitors to the login", async () => {
    state.token = null;
    assert.deepEqual(await proxy(reqFor("/dashboard")), { kind: "redirect", to: "/login" });
    assert.deepEqual(await proxy(reqFor("/admin-gym")), { kind: "redirect", to: "/login" });
  });
  it("keeps members out of the gym panel", async () => {
    state.token = { role: "USER", mustChangePassword: false };
    assert.deepEqual(await proxy(reqFor("/admin-gym")), { kind: "redirect", to: "/dashboard" });
  });
  it("forces a provisional password to be replaced", async () => {
    state.token = { role: "USER", mustChangePassword: true };
    assert.deepEqual(await proxy(reqFor("/dashboard")), { kind: "redirect", to: "/establecer-contrasena" });
  });
  it("confines employees to the classes area", async () => {
    state.token = { role: "EMPLOYEE", mustChangePassword: false };
    assert.deepEqual(await proxy(reqFor("/admin-gym/clientes")), { kind: "redirect", to: "/admin-gym/clases" });
  });
});
