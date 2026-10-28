const { describe, it, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness, nextServerStub } = require("./helpers/harness.cjs");

process.env.NEXTAUTH_SECRET = "test-secret-for-unit-tests-only";

const state = { prisma: null, session: null };
const h = createHarness({
  "@/lib/prisma": { prisma: new Proxy({}, { get: (_, k) => state.prisma[k] }) },
  "@/lib/auth": { authOptions: {} },
  "next-auth": { getServerSession: async () => state.session },
  "next/server": nextServerStub,
});
const employees = h.load("app/api/admin-gym/employees/route.ts");

const del = (id) => employees.DELETE(new Request(`http://x/api/admin-gym/employees?id=${id}`, { method: "DELETE" }));

describe("deleting an employee", () => {
  let calls;

  beforeEach(() => {
    calls = [];
    state.session = { user: { id: "gym1", role: "GYM" } };
    state.prisma = {
      user: { findFirst: async () => ({ id: "e1" }) },
      $transaction: async (fn) =>
        fn({
          classBooking: { deleteMany: async () => calls.push("classBooking.deleteMany") },
          user: { delete: async () => calls.push("user.delete") },
        }),
    };
  });

  it("removes the employee's bookings and the employee together", async () => {
    const r = await del("e1");
    assert.equal(r.status, 200);
    assert.deepEqual(calls, ["classBooking.deleteMany", "user.delete"]);
  });

  it("explains the conflict instead of a generic server error when something must be kept", async () => {
    state.prisma.$transaction = async () => {
      throw Object.assign(new Error("fk"), { code: "P2003" });
    };
    const r = await del("e1");
    assert.equal(r.status, 409);
    assert.match(r.body.message, /no puede eliminarse/);
  });

  it("only the owning gym can delete its employees", async () => {
    state.prisma.user.findFirst = async () => null;
    assert.equal((await del("someone-elses")).status, 404);
    state.session = { user: { id: "u1", role: "USER" } };
    assert.equal((await del("e1")).status, 401);
  });
});
