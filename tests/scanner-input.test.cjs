const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const { createHarness } = require("./helpers/harness.cjs");

const h = createHarness({});
const { normalizeScannerToken, createScannerBuffer } = h.load("lib/scannerInput.ts");

// Token real de acceso (base64 de "userId:timestamp:firma"), tal como lo escribe el lector con
// distribución de teclado española: el relleno "==" llega como "¡¡".
const RAW =
  "MWZmZmUyODMtOWY4Yy00YmNhLWI4ODQtZmUyN2EzMzkyYWNjOjE3OTQ5OTkyOTY4MDU6N2Q1ZGI2MjE1YTc3ODMyZjlhMmViYjc5NWE5NWJmM2JhMWNhMzY5MjI0NjQzYmM2Y2NkZDUzNjMwNzdjZDc3NQ";

describe("normalizeScannerToken", () => {
  it("convierte el relleno ¡¡ del teclado español en ==", () => {
    assert.equal(normalizeScannerToken(RAW + "¡¡"), RAW + "==");
  });

  it("deja intacto un token que ya llega con ==", () => {
    assert.equal(normalizeScannerToken(RAW + "=="), RAW + "==");
  });

  it("ignora espacios y saltos de línea alrededor", () => {
    assert.equal(normalizeScannerToken(`  ${RAW}¡¡\r\n`), RAW + "==");
  });

  it("descarta ráfagas cortas, como el número de una tarjeta MIFARE", () => {
    assert.equal(normalizeScannerToken("0287484603"), null);
  });

  it("descarta texto que no es base64", () => {
    assert.equal(normalizeScannerToken("hola, esto no es un código QR de acceso válido!!"), null);
  });
});

describe("createScannerBuffer", () => {
  const type = (buf, text, startAt, gap) => {
    let at = startAt;
    for (const ch of text) {
      buf.push(ch, at);
      at += gap;
    }
    return at;
  };

  it("entrega la ráfaga al llegar Enter", () => {
    const buf = createScannerBuffer();
    const end = type(buf, "abc123", 1000, 5);
    assert.equal(buf.push("Enter", end), "abc123");
  });

  it("descarta lo tecleado antes de una pausa larga", () => {
    const buf = createScannerBuffer();
    type(buf, "tecleo humano", 1000, 5);
    // Pausa de 2 s y empieza el escaneo.
    const end = type(buf, "QR456", 3000, 5);
    assert.equal(buf.push("Enter", end), "QR456");
  });

  it("no acumula teclas especiales", () => {
    const buf = createScannerBuffer();
    buf.push("a", 1000);
    buf.push("Shift", 1005);
    buf.push("b", 1010);
    assert.equal(buf.push("Enter", 1015), "ab");
  });

  it("vacía el buffer tras cada Enter", () => {
    const buf = createScannerBuffer();
    buf.push("x", 1000);
    buf.push("Enter", 1005);
    assert.equal(buf.push("Enter", 1010), "");
  });
});
