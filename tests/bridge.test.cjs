/**
 * Pruebas del programa local de recepción (bridge/). Usan servidores HTTP falsos de FitWe y de la
 * controladora Hikvision (con autenticación digest de verdad); no tocan red externa ni hardware.
 */
const { describe, it, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const { normalizeToken, createLineSplitter, createDeduper } = require("../bridge/src/scanner");
const { createHikvisionClient } = require("../bridge/src/hikvision");
const { createFitweClient } = require("../bridge/src/fitwe");
const { createBridge } = require("../bridge/src/bridge");
const { loadConfig } = require("../bridge/src/config");

// Token real de acceso (base64 de "userId:timestamp:firma").
const TOKEN =
  "MWZmZmUyODMtOWY4Yy00YmNhLWI4ODQtZmUyN2EzMzkyYWNjOjE3OTQ5OTkyOTY4MDU6N2Q1ZGI2MjE1YTc3ODMyZjlhMmViYjc5NWE5NWJmM2JhMWNhMzY5MjI0NjQzYmM2Y2NkZDUzNjMwNzdjZDc3NQ==";

const silent = { info() {}, warn() {}, error() {} };
const md5 = (s) => crypto.createHash("md5").update(s).digest("hex");

function listen(handler) {
  return new Promise((resolve) => {
    const server = http.createServer(handler);
    server.listen(0, "127.0.0.1", () => resolve({ server, url: `http://127.0.0.1:${server.address().port}` }));
  });
}
const readBody = (req) =>
  new Promise((resolve) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => resolve(b));
  });

// ───────────────────────── scanner ─────────────────────────
describe("bridge scanner", () => {
  it("acepta un token y convierte ¡¡ en ==", () => {
    assert.equal(normalizeToken(TOKEN.replace(/==$/, "¡¡")), TOKEN);
    assert.equal(normalizeToken(`  ${TOKEN}\r\n`), TOKEN);
  });

  it("descarta lecturas cortas o que no son base64", () => {
    assert.equal(normalizeToken("0287484603"), null);
    assert.equal(normalizeToken("esto no es un código de acceso de FitWe, ni de lejos"), null);
  });

  it("trocea el flujo serie en líneas aunque lleguen partidas", () => {
    const lines = [];
    const feed = createLineSplitter((l) => lines.push(l));
    feed(Buffer.from("AAAA\r\nBB"));
    feed(Buffer.from("BB\r\n\r\nCC"));
    feed(Buffer.from("CC\n"));
    assert.deepEqual(lines, ["AAAA", "BBBB", "CCCC"]);
  });

  it("ignora el mismo código repetido dentro de la ventana", () => {
    let t = 1000;
    const dup = createDeduper(5000, () => t);
    assert.equal(dup("x"), false);
    t += 1000;
    assert.equal(dup("x"), true);
    t += 5000;
    assert.equal(dup("x"), false);
    assert.equal(dup("y"), false);
  });
});

// ───────────────────────── controladora (digest) ─────────────────────────
describe("bridge hikvision client", () => {
  let fake;
  const requests = [];
  const USER = "admin";
  const PASS = "secreta";
  const state = { openResponse: "ok" };

  before(async () => {
    const realm = "DS-K2602T";
    const nonce = "nonce-de-prueba";
    fake = await listen(async (req, res) => {
      const body = await readBody(req);
      const auth = req.headers.authorization;
      if (!auth) {
        res.writeHead(401, { "WWW-Authenticate": `Digest realm="${realm}", qop="auth", nonce="${nonce}", opaque="op"` });
        return res.end();
      }
      const f = {};
      for (const m of auth.replace(/^Digest /, "").matchAll(/(\w+)=(?:"([^"]*)"|([^\s,]+))/g)) f[m[1]] = m[2] ?? m[3];
      const expected = md5(
        `${md5(`${USER}:${realm}:${PASS}`)}:${nonce}:${f.nc}:${f.cnonce}:${f.qop}:${md5(`${req.method}:${f.uri}`)}`
      );
      if (f.username !== USER || f.response !== expected || f.uri !== req.url) {
        res.writeHead(401, { "WWW-Authenticate": `Digest realm="${realm}", qop="auth", nonce="${nonce}"` });
        return res.end();
      }
      requests.push({ method: req.method, url: req.url, body });
      if (req.url === "/ISAPI/System/deviceInfo") {
        res.writeHead(200, { "Content-Type": "application/xml" });
        return res.end("<DeviceInfo><model>DS-K2602T</model></DeviceInfo>");
      }
      if (state.openResponse === "http500") {
        res.writeHead(500);
        return res.end();
      }
      res.writeHead(200, { "Content-Type": "application/xml" });
      res.end(
        state.openResponse === "ok"
          ? "<ResponseStatus><statusCode>1</statusCode><statusString>OK</statusString></ResponseStatus>"
          : "<ResponseStatus><statusCode>4</statusCode><statusString>Invalid Operation</statusString></ResponseStatus>"
      );
    });
  });
  after(() => fake.server.close());
  beforeEach(() => {
    requests.length = 0;
    state.openResponse = "ok";
  });

  it("abre la puerta autenticándose con digest", async () => {
    const c = createHikvisionClient({ url: fake.url, user: USER, password: PASS });
    await c.openDoor(2);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "PUT");
    assert.equal(requests[0].url, "/ISAPI/AccessControl/RemoteControl/door/2");
    assert.match(requests[0].body, /<cmd>open<\/cmd>/);
  });

  it("falla con un mensaje claro si la contraseña es incorrecta", async () => {
    const c = createHikvisionClient({ url: fake.url, user: USER, password: "mala" });
    await assert.rejects(() => c.openDoor(1), /usuario o la contraseña/);
  });

  it("falla si la controladora responde con un statusCode de error", async () => {
    state.openResponse = "error";
    const c = createHikvisionClient({ url: fake.url, user: USER, password: PASS });
    await assert.rejects(() => c.openDoor(1), /Invalid Operation/);
  });

  it("falla si la controladora responde con un error HTTP", async () => {
    state.openResponse = "http500";
    const c = createHikvisionClient({ url: fake.url, user: USER, password: PASS });
    await assert.rejects(() => c.openDoor(1), /HTTP 500/);
  });

  it("deviceInfo devuelve el modelo", async () => {
    const c = createHikvisionClient({ url: fake.url, user: USER, password: PASS });
    assert.deepEqual(await c.deviceInfo(), { model: "DS-K2602T" });
  });

  it("falla con rapidez si la controladora no responde", async () => {
    const closed = await listen(() => {});
    const url = closed.url;
    closed.server.close();
    const c = createHikvisionClient({ url, user: USER, password: PASS, timeoutMs: 500 });
    await assert.rejects(() => c.openDoor(1));
  });
});

// ───────────────────────── FitWe ─────────────────────────
describe("bridge fitwe client", () => {
  let fake;
  const calls = [];
  const state = { answer: null, validToken: "T1", loginOk: true, loginRole: "GYM" };

  before(async () => {
    fake = await listen(async (req, res) => {
      const body = JSON.parse((await readBody(req)) || "{}");
      calls.push({ url: req.url, auth: req.headers.authorization, body });
      res.setHeader("Content-Type", "application/json");
      if (req.url === "/api/auth/mobile-login") {
        if (!state.loginOk || body.password !== "pw") {
          res.writeHead(401);
          return res.end(JSON.stringify({ message: "Credenciales inválidas" }));
        }
        return res.end(JSON.stringify({ token: state.validToken, user: { role: state.loginRole } }));
      }
      if (req.url === "/api/admin-gym/access") {
        if (req.headers.authorization !== `Bearer ${state.validToken}`) {
          res.writeHead(401);
          return res.end(JSON.stringify({ message: "No autorizado" }));
        }
        return res.end(JSON.stringify(state.answer));
      }
      res.writeHead(404);
      res.end();
    });
  });
  after(() => fake.server.close());
  beforeEach(() => {
    calls.length = 0;
    Object.assign(state, { answer: { status: "GRANTED", message: "Acceso Permitido", client: { name: "Ana" } }, validToken: "T1", loginOk: true, loginRole: "GYM" });
  });

  const make = (password = "pw") => createFitweClient({ url: fake.url, email: "g@x.com", password });

  it("inicia sesión y envía el token con la dirección", async () => {
    const r = await make().validate(TOKEN, "exit");
    assert.equal(r.status, "GRANTED");
    const access = calls.find((c) => c.url === "/api/admin-gym/access");
    assert.equal(access.auth, "Bearer T1");
    assert.deepEqual(access.body, { token: TOKEN, type: "exit" });
  });

  it("reutiliza la sesión entre escaneos", async () => {
    const c = make();
    await c.validate(TOKEN, "entry");
    await c.validate(TOKEN, "entry");
    assert.equal(calls.filter((x) => x.url === "/api/auth/mobile-login").length, 1);
  });

  it("renueva la sesión sola si el servidor la rechaza", async () => {
    const c = make();
    await c.validate(TOKEN, "entry");
    state.validToken = "T2"; // la sesión anterior deja de valer
    const r = await c.validate(TOKEN, "entry");
    assert.equal(r.status, "GRANTED");
    assert.equal(calls.filter((x) => x.url === "/api/auth/mobile-login").length, 2);
  });

  it("falla con un mensaje claro si las credenciales son incorrectas", async () => {
    await assert.rejects(() => make("otra").validate(TOKEN, "entry"), /correo y la contraseña/);
  });

  it("rechaza una cuenta que no es de gimnasio", async () => {
    state.loginRole = "USER";
    await assert.rejects(() => make().validate(TOKEN, "entry"), /no es de tipo gimnasio/);
  });
});

// ───────────────────────── flujo completo ─────────────────────────
describe("bridge: de la lectura a la puerta", () => {
  const entry = { name: "entrada", direction: "entry", door: 1 };
  const exit = { name: "salida", direction: "exit", door: 2 };
  let opened, validations, answer, openError;

  const fitwe = {
    validate: async (token, direction) => {
      validations.push({ token, direction });
      if (answer instanceof Error) throw answer;
      return answer;
    },
  };
  const controller = {
    openDoor: async (door) => {
      if (openError) throw openError;
      opened.push(door);
    },
  };
  let bridge;

  beforeEach(() => {
    opened = [];
    validations = [];
    openError = null;
    answer = { status: "GRANTED", message: "Acceso Permitido", client: { name: "Ana" } };
    bridge = createBridge({ fitwe, controller, log: silent });
  });

  it("entrada permitida: valida y abre la puerta 1", async () => {
    const r = await bridge.handleScan(entry, TOKEN);
    assert.equal(r.outcome, "OPENED");
    assert.deepEqual(opened, [1]);
    assert.deepEqual(validations, [{ token: TOKEN, direction: "entry" }]);
  });

  it("salida permitida: abre la puerta 2", async () => {
    const r = await bridge.handleScan(exit, TOKEN);
    assert.equal(r.outcome, "OPENED");
    assert.deepEqual(opened, [2]);
  });

  it("denegado: no abre nada y devuelve el motivo", async () => {
    answer = { status: "DENIED", reason: "INACTIVE_SUBSCRIPTION", message: "Cuota inactiva", client: { name: "Ana" } };
    const r = await bridge.handleScan(entry, TOKEN);
    assert.deepEqual([r.outcome, r.reason], ["DENIED", "INACTIVE_SUBSCRIPTION"]);
    assert.deepEqual(opened, []);
  });

  it("permitido pero la controladora falla: lo avisa como caso aparte", async () => {
    openError = new Error("sin conexión");
    const r = await bridge.handleScan(entry, TOKEN);
    assert.equal(r.outcome, "GRANTED_NOT_OPENED");
    assert.match(r.error, /sin conexión/);
  });

  it("FitWe inaccesible: no abre y lo marca como error", async () => {
    answer = new Error("sin red");
    const r = await bridge.handleScan(entry, TOKEN);
    assert.equal(r.outcome, "ERROR");
    assert.deepEqual(opened, []);
  });

  it("ignora lecturas que no son un QR y el mismo código repetido", async () => {
    assert.equal((await bridge.handleScan(entry, "0287484603")).outcome, "IGNORED");
    assert.equal((await bridge.handleScan(entry, TOKEN)).outcome, "OPENED");
    const again = await bridge.handleScan(entry, TOKEN);
    assert.deepEqual([again.outcome, again.reason], ["IGNORED", "DUPLICATE"]);
    assert.equal(validations.length, 1);
    assert.deepEqual(opened, [1]);
  });
});

// ───────────────────────── configuración ─────────────────────────
describe("bridge config", () => {
  const valid = {
    fitwe: { url: "https://x", email: "g@x", password: "p" },
    controller: { url: "http://1.2.3.4", user: "admin", password: "p" },
    readers: [{ port: "COM3", direction: "entry", door: 1 }],
  };
  const write = (obj) => {
    const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), "bridge-")), "config.json");
    fs.writeFileSync(f, JSON.stringify(obj));
    return f;
  };

  it("completa valores por defecto de cada lector", () => {
    const cfg = loadConfig({ file: write(valid), env: {} });
    assert.equal(cfg.readers[0].baudRate, 9600);
    assert.equal(cfg.readers[0].name, "lector1");
  });

  it("las variables de entorno sustituyen al archivo", () => {
    const cfg = loadConfig({ file: write(valid), env: { FITWE_PASSWORD: "otra", CONTROLLER_URL: "http://9.9.9.9" } });
    assert.equal(cfg.fitwe.password, "otra");
    assert.equal(cfg.controller.url, "http://9.9.9.9");
  });

  it("indica qué falta", () => {
    assert.throws(() => loadConfig({ file: write({ ...valid, controller: {} }), env: {} }), /controller\.url, controller\.user, controller\.password/);
  });

  it("valida el sentido y la puerta de cada lector", () => {
    assert.throws(() => loadConfig({ file: write({ ...valid, readers: [{ port: "COM3", direction: "x", door: 1 }] }), env: {} }), /direction/);
    assert.throws(() => loadConfig({ file: write({ ...valid, readers: [{ port: "COM3", direction: "entry", door: 0 }] }), env: {} }), /door/);
  });
});
