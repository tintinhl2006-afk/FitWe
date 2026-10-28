const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/harness.cjs");

const h = createHarness({
  "@/lib/prisma": { prisma: {} },
  "@/lib/generateInvoicePdf": { generateInvoicePdf: () => null },
  "@/lib/email": { sendInvoiceEmail: () => null },
});
const { generateNextInvoiceNumber } = h.load("lib/invoiceUtils.ts");

/** In-memory transaction: payment-method counters, the per-gym fallback counter and issued invoices. */
function makeTx() {
  const methods = {};
  const sequences = {};
  const issued = [];
  return {
    issued,
    addMethod(id, start = 1) {
      methods[id] = { invoiceNextValue: start };
    },
    gymPaymentMethod: {
      update: async ({ where, data }) => {
        methods[where.id].invoiceNextValue += data.invoiceNextValue.increment;
        return { invoiceNextValue: methods[where.id].invoiceNextValue };
      },
    },
    gymInvoiceSequence: {
      upsert: async ({ where, create, update }) => {
        if (!sequences[where.gymId]) sequences[where.gymId] = { nextValue: create.nextValue };
        else sequences[where.gymId].nextValue += update.nextValue.increment;
        return { nextValue: sequences[where.gymId].nextValue };
      },
    },
    paymentRecord: {
      findFirst: async ({ where }) =>
        issued.find((r) => r.invoiceNumber === where.invoiceNumber && r.gymId === where.user.gymId) ? { id: "x" } : null,
    },
  };
}

const Y = new Date().getFullYear();
async function issue(tx, gym, method) {
  const n = await generateNextInvoiceNumber(tx, gym, method);
  tx.issued.push({ invoiceNumber: n, gymId: gym });
  return n;
}

describe("generateNextInvoiceNumber (FW-023)", () => {
  it("issues consecutive numbers for one payment method", async () => {
    const tx = makeTx();
    tx.addMethod("A");
    const A = { id: "A", billingName: "Gimnasio Centro" };
    assert.deepEqual(
      [await issue(tx, "g1", A), await issue(tx, "g1", A), await issue(tx, "g1", A)],
      [`GI-${Y}-00001`, `GI-${Y}-00002`, `GI-${Y}-00003`]
    );
  });

  it("never repeats a number when two methods of one gym share a prefix", async () => {
    // Stripe and Redsys under the same legal name share the two-letter prefix but have
    // independent counters; this used to produce [1,1,2,2,3].
    const tx = makeTx();
    tx.addMethod("A");
    tx.addMethod("B");
    const A = { id: "A", billingName: "Gimnasio Centro" };
    const B = { id: "B", billingName: "Gimnasio Norte" };
    const out = [await issue(tx, "g1", A), await issue(tx, "g1", A), await issue(tx, "g1", B), await issue(tx, "g1", A), await issue(tx, "g1", B)];
    assert.equal(new Set(out).size, out.length);
    assert.deepEqual(out.map((x) => Number(x.slice(-5))).sort((a, b) => a - b), [1, 2, 3, 4, 5]);
  });

  it("uniqueness is per gym: another gym starts at 00001", async () => {
    const tx = makeTx();
    tx.addMethod("A");
    tx.addMethod("Z");
    await issue(tx, "g1", { id: "A", billingName: "Gimnasio Centro" });
    assert.equal(await issue(tx, "g2", { id: "Z", billingName: "Gimnasio Sur" }), `GI-${Y}-00001`);
  });

  it("uses a gym-level FW series when there is no payment method", async () => {
    const tx = makeTx();
    assert.deepEqual([await issue(tx, "g1", null), await issue(tx, "g1", null)], [`FW-${Y}-00001`, `FW-${Y}-00002`]);
  });

  it("respects a counter that is already advanced", async () => {
    const tx = makeTx();
    tx.addMethod("A", 42);
    assert.equal(await issue(tx, "g1", { id: "A", billingName: "Gimnasio Centro" }), `GI-${Y}-00042`);
  });
});
