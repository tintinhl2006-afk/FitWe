const { describe, it, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/harness.cjs");

const h = createHarness({});
const email = h.load("lib/email.ts");

// Capture what would be sent to the mail provider instead of sending it.
const realFetch = global.fetch;
let sent;
process.env.RESEND_API_KEY = "re_test_key";
global.fetch = async (url, init) => {
  sent = { url, body: JSON.parse(init.body) };
  return { ok: true, text: async () => "" };
};
after(() => {
  global.fetch = realFetch;
});

const HOSTILE = `<img src=x onerror=alert(1)>"'&`;

describe("email bodies escape everything users can type", () => {
  beforeEach(() => {
    sent = null;
  });

  it("escapes the recipient name, class name and gym name in the booking confirmation", async () => {
    await email.sendClassBookingConfirmedEmail("a@x.com", HOSTILE, HOSTILE, HOSTILE, "lunes", "10:00");
    assert.ok(sent, "an email must be sent");
    assert.doesNotMatch(sent.body.html, /<img src=x/);
    assert.match(sent.body.html, /&lt;img src=x onerror=alert\(1\)&gt;&quot;&#39;&amp;/);
  });

  it("escapes the name in the verification and reset emails, and the links", async () => {
    await email.sendVerificationEmail("a@x.com", HOSTILE, 'https://app/verify?token=abc"onmouseover="x');
    assert.doesNotMatch(sent.body.html, /<img src=x/);
    assert.doesNotMatch(sent.body.html, /"onmouseover="/, "a quote in a link must not break out of the attribute");

    sent = null;
    await email.sendPasswordResetEmail("a@x.com", HOSTILE, "https://app/reset?token=abc");
    assert.doesNotMatch(sent.body.html, /<img src=x/);
  });

  it("escapes the invoice number and client name in the invoice email", async () => {
    await email.sendInvoiceEmail("a@x.com", HOSTILE, "GI-2026-00001<b>", new Uint8Array([1, 2, 3]));
    assert.doesNotMatch(sent.body.html, /<img src=x/);
    assert.doesNotMatch(sent.body.html, /00001<b>/);
  });

  it("keeps the subject as plain text (it is not HTML)", async () => {
    await email.sendClassBookingConfirmedEmail("a@x.com", "Ana", "Yoga & Pilates", "Gym", "lunes", "10:00");
    assert.equal(sent.body.subject, "Reserva confirmada: Yoga & Pilates");
    assert.match(sent.body.html, /Yoga &amp; Pilates/);
  });

  it("leaves ordinary text readable", async () => {
    await email.sendClassReminderEmail("a@x.com", "María José", "Spinning", "FitWe Centro", "18:30");
    assert.match(sent.body.html, /María José/);
    assert.match(sent.body.html, /Spinning/);
  });
});
