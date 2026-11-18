const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, jsonRequest, nextServerStub } = require("./helpers/harness.cjs");

process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests-only";

const realBcrypt = require("bcryptjs");

const state = {
  prisma: null,
  userId: null,
  session: null,
  allowed: true,
  rateKeys: [],
  reissued: null,
};

const h = createHarness({
  "@/lib/prisma": { prisma: new Proxy({}, { get: (_, k) => state.prisma[k] }) },
  "@/lib/auth": { authOptions: {} },
  "next-auth": { getServerSession: async () => state.session },
  "next-auth/jwt": { encode: async () => "signed-token" },
  "@/lib/apiAuth": {
    getRequestUserId: async () => state.userId,
    getRequestAuth: async () =>
      state.session?.user
        ? { id: state.session.user.id, role: state.session.user.role }
        : state.userId
          ? { id: state.userId, role: "USER" }
          : null,
    reissueBearerToken: async () => state.reissued,
  },
  "@/lib/rateLimit": {
    checkRateLimit: async (key) => {
      state.rateKeys.push(key);
      return { allowed: state.allowed };
    },
    getClientIp: () => "1.1.1.1",
  },
  "@/lib/timeUtils": { getNow: async () => new Date() },
  "@/lib/logger": { logger: { info() {}, warn() {}, error() {} } },
  "@/lib/email": { sendVerificationEmail: async () => {}, getAppBaseUrl: () => "http://localhost" },
  "next/server": nextServerStub,
});

const { generateAccessCode } = h.load("lib/cryptoUtils.ts");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

beforeEach(() => {
  state.allowed = true;
  state.rateKeys = [];
  state.reissued = null;
  state.session = null;
  state.userId = null;
});

// ───────────────────────── single-use QR (FW-019) ─────────────────────────
describe("gym access: a QR code can be used once (FW-019)", () => {
  const access = h.load("app/api/admin-gym/access/route.ts");

  function makeDb(credits) {
    const clients = {
      m1: {
        id: "m1", gymId: "gym1", name: "Ana", email: "a@x", image: null, subscriptionStatus: "ACTIVE",
        subscriptionEndDate: null, creditsRemaining: credits,
        plan: { name: "Bono", price: 10, billingType: "CREDITS" },
      },
    };
    const logs = [];
    return {
      clients,
      logs,
      user: {
        findUnique: async ({ where }) => (clients[where.id] ? { ...clients[where.id] } : null),
        findFirst: async () => ({ id: "m1" }),
        updateMany: async ({ where, data }) => {
          const c = clients[where.id];
          if (c && c.creditsRemaining > 0) {
            c.creditsRemaining -= data.creditsRemaining.decrement;
            return { count: 1 };
          }
          return { count: 0 };
        },
      },
      accessLog: {
        findFirst: async ({ where }) =>
          logs.find((l) => l.userId === where.userId && l.gymId === where.gymId && l.status === where.status && l.createdAt >= where.createdAt.gte) || null,
        create: async ({ data }) => {
          logs.push({ ...data, createdAt: new Date() });
          return data;
        },
      },
    };
  }

  beforeEach(() => {
    state.session = { user: { id: "gym1", role: "GYM" } };
  });

  it("admits on the first scan and charges one credit", async () => {
    state.prisma = makeDb(2);
    const r = await access.POST(jsonRequest({ token: generateAccessCode("m1") }));
    assert.equal(r.body.status, "GRANTED");
    assert.equal(state.prisma.clients.m1.creditsRemaining, 1);
  });

  it("denies the same code again (a screenshot) without charging again", async () => {
    state.prisma = makeDb(2);
    const T = generateAccessCode("m1");
    await access.POST(jsonRequest({ token: T }));
    for (let i = 0; i < 2; i++) {
      const r = await access.POST(jsonRequest({ token: T }));
      assert.deepEqual([r.body.status, r.body.reason], ["DENIED", "ALREADY_USED"]);
    }
    assert.equal(state.prisma.clients.m1.creditsRemaining, 1);
  });

  it("admits a code issued after the previous scan", async () => {
    state.prisma = makeDb(2);
    await access.POST(jsonRequest({ token: generateAccessCode("m1") }));
    await sleep(15);
    const r = await access.POST(jsonRequest({ token: generateAccessCode("m1") }));
    assert.equal(r.body.status, "GRANTED");
    assert.equal(state.prisma.clients.m1.creditsRemaining, 0);
  });

  it("still denies for lack of credits on a fresh code", async () => {
    state.prisma = makeDb(1);
    await access.POST(jsonRequest({ token: generateAccessCode("m1") }));
    await sleep(15);
    const r = await access.POST(jsonRequest({ token: generateAccessCode("m1") }));
    assert.equal(r.body.reason, "NO_CREDITS");
  });

  it("the same code cannot be reused to register the exit", async () => {
    state.prisma = makeDb(5);
    const T = generateAccessCode("m1");
    assert.equal((await access.POST(jsonRequest({ token: T, type: "entry" }))).body.status, "GRANTED");
    assert.equal((await access.POST(jsonRequest({ token: T, type: "exit" }))).body.reason, "ALREADY_USED");
  });

  it("manual entry by staff is not subject to the rule", async () => {
    state.prisma = makeDb(5);
    const a = await access.POST(jsonRequest({ manualInput: "a@x" }));
    const b = await access.POST(jsonRequest({ manualInput: "a@x" }));
    assert.deepEqual([a.body.status, b.body.status], ["GRANTED", "GRANTED"]);
  });

  it("a forged code is still rejected for its signature", async () => {
    state.prisma = makeDb(5);
    const forged = Buffer.from("m1:" + Date.now() + ":" + "ab".repeat(32)).toString("base64");
    assert.equal((await access.POST(jsonRequest({ token: forged }))).body.reason, "INVALID_SIGNATURE");
  });
});

// ───────────────────────── account closure (FW-015) ─────────────────────────
describe("account closure (FW-015)", () => {
  const del = h.load("app/api/settings/delete-account/route.ts");

  function makeDb({ role = "USER", invoices = 0 }) {
    const ops = [];
    const topLevel = [];
    const tx = new Proxy({}, {
      get: (_, model) =>
        new Proxy({}, {
          get: (_, op) => async (args) => {
            ops.push({ model, op, args });
            if (model === "workoutSession" && op === "findMany") return [{ id: "s1" }];
            if (model === "routine" && op === "findMany") return [{ id: "r1" }];
            if (model === "paymentRecord" && op === "count") return invoices;
            return { count: 0 };
          },
        }),
    });
    return {
      ops,
      topLevel,
      user: { findUnique: async () => ({ role }), update: async () => topLevel.push("user.update"), delete: async () => topLevel.push("user.delete") },
      // Only the transaction may do the work; anything else at top level is recorded.
      $transaction: async (fn) => fn(tx),
    };
  }
  const names = (db) => db.ops.map((o) => `${o.model}.${o.op}`);

  beforeEach(() => { state.userId = "u1"; });

  it("deletes a member without invoices, atomically, data first and the user last", async () => {
    const db = (state.prisma = makeDb({ invoices: 0 }));
    const r = await del.POST(jsonRequest({}));
    assert.deepEqual([r.status, r.body.outcome], [200, "deleted"]);
    assert.deepEqual(db.topLevel, [], "nothing may happen outside the transaction");
    const order = names(db);
    assert.ok(order.indexOf("workoutSet.deleteMany") < order.indexOf("user.delete"));
    for (const n of ["classBooking.deleteMany", "accessLog.deleteMany", "mealEntry.deleteMany", "savedDiet.deleteMany", "nutritionProfile.deleteMany", "foodItem.deleteMany", "exercise.deleteMany"]) {
      assert.ok(order.includes(n), n);
    }
  });

  it("closes (does not delete) a member with invoices: erases personal data, keeps what an invoice needs", async () => {
    const db = (state.prisma = makeDb({ invoices: 3 }));
    const r = await del.POST(jsonRequest({}));
    assert.deepEqual([r.status, r.body.outcome], [200, "anonymised"]);
    assert.equal(names(db).includes("user.delete"), false);
    const upd = db.ops.find((o) => o.model === "user" && o.op === "update").args.data;
    assert.equal(upd.email, "deleted-u1@deleted.invalid");
    assert.match(upd.password, /^\$2/);
    assert.deepEqual(upd.sessionVersion, { increment: 1 });
    for (const f of ["phone", "landline", "birthDate", "civilStatus", "gender", "weight", "height", "image", "bio", "link", "location", "referralSource"]) {
      assert.equal(upd[f], null, f);
    }
    for (const f of ["name", "lastName", "documentType", "documentNumber", "documentLetter", "address", "postalCode", "province", "locality", "gymId"]) {
      assert.equal(f in upd, false, `${f} must be kept`);
    }
  });

  it("refuses to close a gym account, and does nothing", async () => {
    const db = (state.prisma = makeDb({ role: "GYM" }));
    assert.equal((await del.POST(jsonRequest({}))).status, 403);
    assert.equal(db.ops.length, 0);
  });

  it("requires a session", async () => {
    state.prisma = makeDb({});
    state.userId = null;
    assert.equal((await del.POST(jsonRequest({}))).status, 401);
  });
});

// ───────────────────────── exercises (FW-013) ─────────────────────────
describe("exercise ownership (FW-013)", () => {
  const ex = h.load("app/api/exercises/route.ts");
  let captured;
  const db = (gymId) => ({
    user: { findUnique: async () => ({ gymId }) },
    exercise: {
      findMany: async (args) => ((captured.findMany = args), []),
      create: async (args) => ((captured.create = args), { id: "e1", ...args.data }),
    },
  });

  beforeEach(() => {
    captured = {};
    state.userId = "member1";
  });

  it("a member sees the shared catalog, their own and their gym's", async () => {
    state.prisma = db("gymA");
    await ex.GET(new Request("http://x/"));
    assert.deepEqual(captured.findMany.where, { OR: [{ userId: null }, { userId: { in: ["member1", "gymA"] } }] });
  });
  it("without a gym only the shared catalog and their own", async () => {
    state.prisma = db(null);
    await ex.GET(new Request("http://x/"));
    assert.deepEqual(captured.findMany.where, { OR: [{ userId: null }, { userId: { in: ["member1"] } }] });
  });
  it("a new exercise belongs to whoever created it", async () => {
    state.prisma = db(null);
    const r = await ex.POST(jsonRequest({ name: "  Press  ", muscleGroup: "Pecho", description: "x" }));
    assert.deepEqual([r.status, captured.create.data.userId, captured.create.data.name], [201, "member1", "Press"]);
  });
  it("rejects an oversized name", async () => {
    state.prisma = db(null);
    assert.equal((await ex.POST(jsonRequest({ name: "x".repeat(101), muscleGroup: "Pecho" }))).status, 400);
  });
  it("requires a session to read the catalog", async () => {
    state.prisma = db(null);
    state.userId = null;
    assert.equal((await ex.GET(new Request("http://x/"))).status, 401);
  });
});

// ───────────────────────── password routes (FW-003 / FW-007 / FW-021) ─────────────────────────
describe("password change requires the current password and revokes other sessions", () => {
  const settingsPassword = h.load("app/api/settings/password/route.ts");
  const userSettings = h.load("app/api/user/settings/route.ts");
  const provisional = h.load("app/api/auth/reset-provisional/route.ts");
  let hash;
  let updates;

  beforeEach(async () => {
    hash = await realBcrypt.hash("old-password", 10);
    updates = [];
    state.userId = "u1";
    state.session = { user: { id: "u1", role: "USER" } };
    state.prisma = {
      user: {
        findUnique: async (args) => ({ id: "u1", password: hash, mustChangePassword: false, role: "USER", ...(args && args.select ? {} : {}) }),
        update: async (args) => {
          updates.push(args.data);
          return { sessionVersion: 5 };
        },
      },
    };
  });

  it("settings/password: wrong current password changes nothing", async () => {
    const r = await settingsPassword.POST(jsonRequest({ current: "nope", newPass: "new-password" }));
    assert.equal(r.status, 400);
    assert.equal(updates.length, 0);
  });
  it("settings/password: rejects a weak or oversized new password", async () => {
    assert.equal((await settingsPassword.POST(jsonRequest({ current: "old-password", newPass: "123" }))).status, 400);
    assert.equal((await settingsPassword.POST(jsonRequest({ current: "old-password", newPass: "x".repeat(129) }))).status, 400);
    assert.equal(updates.length, 0);
  });
  it("settings/password: is rate limited per user before checking the password", async () => {
    state.allowed = false;
    const r = await settingsPassword.POST(jsonRequest({ current: "old-password", newPass: "new-password" }));
    assert.equal(r.status, 429);
    assert.deepEqual(state.rateKeys, ["pwchange:user:u1"]);
    assert.equal(updates.length, 0);
  });
  it("settings/password: success revokes other sessions and hands a mobile caller a fresh token", async () => {
    state.reissued = "fresh-token";
    const r = await settingsPassword.POST(jsonRequest({ current: "old-password", newPass: "new-password" }));
    assert.equal(r.status, 200);
    assert.equal(r.body.token, "fresh-token");
    assert.deepEqual(updates[0].sessionVersion, { increment: 1 });
    assert.equal(await realBcrypt.compare("new-password", updates[0].password), true);
  });
  it("settings/password: a web caller gets no token", async () => {
    const r = await settingsPassword.POST(jsonRequest({ current: "old-password", newPass: "new-password" }));
    assert.equal("token" in r.body, false);
  });

  it("user/settings: a new password needs the current one", async () => {
    const r = await userSettings.PATCH(jsonRequest({ newPassword: "new-password" }, { method: "PATCH" }));
    assert.equal(r.status, 400);
    assert.equal(updates.length, 0);
  });
  it("user/settings: with the current password it changes and revokes other sessions", async () => {
    const r = await userSettings.PATCH(jsonRequest({ newPassword: "new-password", currentPassword: "old-password" }, { method: "PATCH" }));
    assert.equal(r.status, 200);
    assert.deepEqual(updates[0].sessionVersion, { increment: 1 });
  });
  it("user/settings: a name change alone does not ask for a password", async () => {
    const r = await userSettings.PATCH(jsonRequest({ name: "Ana" }, { method: "PATCH" }));
    assert.equal(r.status, 200);
    assert.equal(updates[0].name, "Ana");
    assert.equal("password" in updates[0], false);
  });

  it("reset-provisional: refused for an account that is not in the provisional state", async () => {
    const r = await provisional.POST(jsonRequest({ password: "new-password" }));
    assert.equal(r.status, 403);
    assert.equal(updates.length, 0);
  });
  it("reset-provisional: works for a provisional account and ends its other sessions", async () => {
    state.prisma.user.findUnique = async () => ({ mustChangePassword: true });
    const r = await provisional.POST(jsonRequest({ password: "new-password" }));
    assert.equal(r.status, 200);
    assert.equal(updates[0].mustChangePassword, false);
    assert.deepEqual(updates[0].sessionVersion, { increment: 1 });
  });
});

// ───────────────────────── registration (mobile) ─────────────────────────
describe("mobile registration validates its input", () => {
  const register = h.load("app/api/auth/mobile-register/route.ts");
  const valid = { name: "Ana", email: "ana@example.com", password: "secret1", gymCode: "ABC234" };

  beforeEach(() => {
    state.prisma = {
      user: {
        findUnique: async () => null,
        findFirst: async () => ({ id: "gym1" }),
        create: async ({ data }) => ({ id: "u9", role: "USER", subscriptionStatus: "INACTIVE", sessionVersion: 0, subscriptionEndDate: null, ...data }),
      },
    };
  });

  it("accepts a valid registration and issues a token", async () => {
    const r = await register.POST(jsonRequest(valid));
    assert.equal(r.status, 200);
    assert.equal(r.body.token, "signed-token");
  });
  for (const [label, patch] of [
    ["an empty name", { name: "   " }],
    ["a name over 80 characters", { name: "x".repeat(81) }],
    ["a name that is not text", { name: { $gt: "" } }],
    ["a malformed email", { email: "not-an-email" }],
    ["a short password", { password: "123" }],
    ["an oversized password", { password: "x".repeat(129) }],
    ["a wrong-length gym code", { gymCode: "AB" }],
  ]) {
    it(`rejects ${label}`, async () => {
      const r = await register.POST(jsonRequest({ ...valid, ...patch }));
      assert.equal(r.status, 400);
    });
  }
  it("rejects a body that is not JSON", async () => {
    const r = await register.POST(new Request("http://x/", { method: "POST", body: "not json" }));
    assert.equal(r.status, 400);
  });
  it("never echoes an internal error message to the client", async () => {
    state.prisma.user.create = async () => {
      throw new Error("connect ECONNREFUSED 10.0.0.5:5432 secret-host");
    };
    const r = await register.POST(jsonRequest(valid));
    assert.equal(r.status, 500);
    assert.doesNotMatch(JSON.stringify(r.body), /ECONNREFUSED|secret-host/);
  });
});
