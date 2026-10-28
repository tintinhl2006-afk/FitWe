const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8").replace(/\r\n/g, "\n");

// These three files exist twice, once for the web app and once for the mobile app, because the
// two projects do not share a package. They are byte-for-byte copies today; if one is edited
// without the other, the web and the mobile app silently start computing different diets and
// workout plans. Copy the change across and this test passes again.
describe("files mirrored between the web and the mobile app stay identical", () => {
  for (const name of ["dietEngine", "workoutEngine", "nutritionUtils"]) {
    it(`${name}.ts`, () => {
      assert.equal(
        read(`src/lib/${name}.ts`),
        read(`mobile/src/lib/${name}.ts`),
        `src/lib/${name}.ts and mobile/src/lib/${name}.ts differ: apply the same change to both`
      );
    });
  }
});

// generateInvoicePdf is NOT a copy: the web builds PDF bytes with pdf-lib, the mobile app builds
// HTML for expo-print. What must match is which fields the invoice data has and which are
// optional. The types of the date fields legitimately differ: the web also accepts Date objects,
// while the mobile app only ever receives JSON strings.
describe("invoice data fields agree between the web and the mobile app", () => {
  const fields = (source, name) => {
    const start = source.indexOf(`export interface ${name} {`);
    assert.ok(start >= 0, `interface ${name} not found`);
    const end = source.indexOf("\n}", start);
    return source
      .slice(start, end)
      .split("\n")
      .map((line) => line.trim().match(/^(\w+)(\??):/))
      .filter(Boolean)
      .map((m) => `${m[1]}${m[2]}`)
      .sort();
  };
  const web = read("src/lib/generateInvoicePdf.ts");
  const mobile = read("mobile/src/lib/generateInvoicePdf.ts");

  for (const name of ["InvoicePayment", "InvoiceClient", "InvoiceGym"]) {
    it(name, () => {
      const w = fields(web, name);
      assert.ok(w.length > 0, `no fields found for ${name}`);
      assert.deepEqual(fields(mobile, name), w);
    });
  }
});
