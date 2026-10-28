const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/harness.cjs");

process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests-only";

const state = { dbUser: null, jwt: new Map(), cookieSession: null };

const h = createHarness({
  "@/lib/prisma": { prisma: { user: { findUnique: async () => state.dbUser } } },
  "@/lib/auth": { authOptions: {} },
  "next-auth": { getServerSession: async () => state.cookieSession },
  "next-auth/jwt": {
    decode: async ({ token }) => {
      if (!state.jwt.has(token)) throw new Error("bad token");
      return state.jwt.get(token);
    },
    encode: async ({ token }) => {
      const t = "issued-" + Math.random().toString(36).slice(2);
      state.jwt.set(t, token);
      return t;
    },
  },
});
const A = h.load("lib/apiAuth.ts");
const bearer = (t) => new Request("http://x/", { headers: { authorization: `Bearer ${t}` } });

describe("mobile bearer tokens honour revocation (FW-002)", () => {
  beforeEach(() => {
    state.jwt.clear();
    state.cookieSession = null;
  });

  it("a current token yields the identity", async () => {
    state.jwt.set("t", { id: "u1", role: "USER", sessionVersion: 3 });
    state.dbUser = { sessionVersion: 3, role: "USER" };
    assert.deepEqual(await A.getRequestAuth(bearer("t")), { id: "u1", role: "USER" });
  });

  it("is rejected once sessionVersion has moved on (deactivation, refund, password change)", async () => {
    state.jwt.set("t", { id: "u1", role: "USER", sessionVersion: 3 });
    state.dbUser = { sessionVersion: 4, role: "USER" };
    assert.equal(await A.getRequestAuth(bearer("t")), null);
  });

  it("is rejected when the user no longer exists", async () => {
    state.jwt.set("t", { id: "u1", role: "USER", sessionVersion: 3 });
    state.dbUser = null;
    assert.equal(await A.getRequestAuth(bearer("t")), null);
  });

  it("a token without sessionVersion cannot be verified and is rejected", async () => {
    state.jwt.set("t", { id: "u1", role: "USER" });
    state.dbUser = { sessionVersion: 0, role: "USER" };
    assert.equal(await A.getRequestAuth(bearer("t")), null);
  });

  it("the role comes from the database, never from the token", async () => {
    state.jwt.set("t", { id: "u1", role: "GYM", sessionVersion: 0 });
    state.dbUser = { sessionVersion: 0, role: "USER" };
    assert.deepEqual(await A.getRequestAuth(bearer("t")), { id: "u1", role: "USER" });
  });

  it("an unreadable token falls back to the cookie session, if any", async () => {
    assert.equal(await A.getRequestAuth(bearer("garbage")), null);
    state.cookieSession = { user: { id: "cookie-user", role: "GYM" } };
    assert.deepEqual(await A.getRequestAuth(bearer("garbage")), { id: "cookie-user", role: "GYM" });
  });

  it("a password change reissues the caller's own token with the new version", async () => {
    state.jwt.set("old", { id: "u1", role: "USER", sessionVersion: 3, email: "a@b.c" });
    const fresh = await A.reissueBearerToken(bearer("old"), 4);
    assert.ok(typeof fresh === "string" && fresh !== "old");
    assert.equal(state.jwt.get(fresh).sessionVersion, 4);
    assert.equal(state.jwt.get(fresh).email, "a@b.c");
    state.dbUser = { sessionVersion: 4, role: "USER" };
    assert.deepEqual(await A.getRequestAuth(bearer(fresh)), { id: "u1", role: "USER" });
    assert.equal(await A.getRequestAuth(bearer("old")), null);
  });

  it("web callers get no reissued token (they re-sync through update())", async () => {
    assert.equal(await A.reissueBearerToken(new Request("http://x/"), 4), null);
  });
});
