#!/usr/bin/env node
const { loadConfig } = require("./config");
const { createFitweClient } = require("./fitwe");
const { createHikvisionClient } = require("./hikvision");
const { createBridge } = require("./bridge");
const { openReader, listPorts } = require("./serial");

const stamp = () => new Date().toLocaleString("es-ES");
const log = {
  info: (m) => console.log(`${stamp()}  ${m}`),
  warn: (m) => console.warn(`${stamp()}  AVISO ${m}`),
  error: (m) => console.error(`${stamp()}  ERROR ${m}`),
};

/** Comprobación para el día de la instalación: sesión en FitWe, controladora y puertos serie. */
async function check(cfg, fitwe, controller) {
  let ok = true;
  const step = async (name, fn) => {
    try {
      const detail = await fn();
      console.log(`  ✔ ${name}${detail ? ": " + detail : ""}`);
    } catch (err) {
      ok = false;
      console.log(`  ✘ ${name}: ${err.message}`);
    }
  };
  console.log("Comprobando…");
  await step("Sesión en FitWe", async () => {
    await fitwe.login();
  });
  await step("Controladora Hikvision", async () => `modelo ${(await controller.deviceInfo()).model}`);

  let ports = [];
  await step("Puertos serie del PC", async () => {
    ports = await listPorts();
    return ports.length ? ports.map((p) => p.path).join(", ") : "ninguno detectado";
  });
  for (const r of cfg.readers) {
    const found = ports.some((p) => p.path.toLowerCase() === r.port.toLowerCase());
    console.log(`  ${found ? "✔" : "✘"} Lector "${r.name}" en ${r.port}${found ? "" : " (no aparece entre los puertos)"}`);
    if (!found) ok = false;
  }
  console.log(ok ? "Todo correcto." : "Hay cosas por corregir.");
  return ok;
}

async function main() {
  const cfg = loadConfig();
  const fitwe = createFitweClient(cfg.fitwe);
  const controller = createHikvisionClient(cfg.controller);

  if (process.argv.includes("--check")) {
    process.exit((await check(cfg, fitwe, controller)) ? 0 : 1);
  }

  const bridge = createBridge({ fitwe, controller, log });
  // Un escaneo a la vez por lector, para que dos lecturas seguidas no se pisen.
  const handles = cfg.readers.map((reader) => {
    let chain = Promise.resolve();
    return openReader(
      reader,
      (line) => {
        chain = chain.then(() => bridge.handleScan(reader, line)).catch((err) => log.error(err.message));
      },
      log
    );
  });

  const stop = () => {
    handles.forEach((h) => h.close());
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  log.info("FitWe bridge en marcha. Ctrl+C para parar.");
}

main().catch((err) => {
  log.error(err.message);
  process.exit(1);
});
