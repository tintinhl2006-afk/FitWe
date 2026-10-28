const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/harness.cjs");

process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests-only";

const realBcrypt = require("bcryptjs");
const state = { user: null, allowed: true, compares: 0 };

// bcryptjs is real; only the number of comparisons is counted.
const countingBcrypt = {
  hash: (...a) => realBcrypt.hash(...a),
  compare: async (...a) => {
    state.compares++;
    return realBcrypt.compare(...a);
  },
};

const h = createHarness({
  "@auth/prisma-adapter": { PrismaAdapter: () => ({}) },
  "next-auth/providers/credentials": (options) => options,
  "@/lib/prisma": { prisma: { user: { findUnique: async () => state.user } } },
  "@/lib/rateLimit": { checkRateLimit: async () => ({ allowed: state.allowed }), pickClientIp: () => "1.2.3.4" },
  "@/lib/timeUtils": { getNow: async () => new Date("2026-10-16T10:00:00Z") },
  bcryptjs: countingBcrypt,
});

const { authOptions } = h.load("lib/auth.ts");
const authorize = authOptions.providers[0].authorize;
const attempt = (email, password) => authorize({ email, password }, { headers: {} });

describe("web login does not reveal which emails exist", () => {
  let hash;
  beforeEach(async () => {
    hash = await realBcrypt.hash("right-password", 10);
    state.compares = 0;
    state.allowed = true;
    state.user = null;
  });

  it("an unknown email and a wrong password give the same message", async () => {
    state.user = null;
    const unknown = await attempt("nobody@x.com", "whatever").catch((e) => e.message);

    state.user = { id: "u1", email: "a@x.com", name: "A", role: "USER", password: hash, subscriptionStatus: "ACTIVE" };
    const wrong = await attempt("a@x.com", "wrong-password").catch((e) => e.message);

    assert.equal(unknown, "Credenciales inválidas");
    assert.equal(wrong, "Credenciales inválidas");
    assert.equal(unknown, wrong);
  });

  it("an unknown email still performs a full password comparison (no timing leak)", async () => {
    state.user = null;
    await attempt("nobody@x.com", "whatever").catch(() => {});
    assert.equal(state.compares, 1);

    state.compares = 0;
    state.user = { id: "u1", email: "a@x.com", name: "A", role: "USER", password: hash };
    await attempt("a@x.com", "wrong").catch(() => {});
    assert.equal(state.compares, 1);
  });

  it("an account without a password behaves like an unknown one", async () => {
    state.user = { id: "u1", email: "a@x.com", password: null };
    const msg = await attempt("a@x.com", "x").catch((e) => e.message);
    assert.equal(msg, "Credenciales inválidas");
    assert.equal(state.compares, 1);
  });

  it("the right password signs in", async () => {
    state.user = {
      id: "u1", email: "a@x.com", name: "Ana", role: "USER", password: hash, subscriptionStatus: "ACTIVE",
      subscriptionEndDate: null, monthlyFee: 10, gymId: null, gym: null, mustChangePassword: false, sessionVersion: 2,
    };
    const result = await attempt("A@X.com ", "right-password");
    assert.equal(result.id, "u1");
    assert.equal(result.sessionVersion, 2);
  });

  it("rate limiting is checked before any password work", async () => {
    state.allowed = false;
    const msg = await attempt("a@x.com", "x").catch((e) => e.message);
    assert.match(msg, /Demasiados intentos/);
    assert.equal(state.compares, 0);
  });
});
