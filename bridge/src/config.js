const fs = require("fs");
const path = require("path");

const DEFAULT_FILE = path.join(__dirname, "..", "config.json");

/** Lee config.json (y deja que las variables de entorno lo sustituyan) y valida lo imprescindible. */
function loadConfig({ file = DEFAULT_FILE, env = process.env } = {}) {
  let cfg = {};
  if (fs.existsSync(file)) {
    try {
      cfg = JSON.parse(fs.readFileSync(file, "utf8"));
    } catch (err) {
      throw new Error(`config.json no es un JSON válido: ${err.message}`);
    }
  }
  cfg.fitwe = { ...cfg.fitwe };
  cfg.controller = { ...cfg.controller };
  if (env.FITWE_URL) cfg.fitwe.url = env.FITWE_URL;
  if (env.FITWE_EMAIL) cfg.fitwe.email = env.FITWE_EMAIL;
  if (env.FITWE_PASSWORD) cfg.fitwe.password = env.FITWE_PASSWORD;
  if (env.CONTROLLER_URL) cfg.controller.url = env.CONTROLLER_URL;
  if (env.CONTROLLER_USER) cfg.controller.user = env.CONTROLLER_USER;
  if (env.CONTROLLER_PASSWORD) cfg.controller.password = env.CONTROLLER_PASSWORD;

  const missing = [];
  for (const k of ["url", "email", "password"]) if (!cfg.fitwe[k]) missing.push(`fitwe.${k}`);
  for (const k of ["url", "user", "password"]) if (!cfg.controller[k]) missing.push(`controller.${k}`);
  if (!Array.isArray(cfg.readers) || cfg.readers.length === 0) missing.push("readers (al menos uno)");
  if (missing.length) throw new Error(`Falta en la configuración: ${missing.join(", ")}`);

  cfg.readers = cfg.readers.map((r, i) => {
    if (!r.port) throw new Error(`readers[${i}] necesita "port" (por ejemplo COM3)`);
    if (r.direction !== "entry" && r.direction !== "exit") throw new Error(`readers[${i}].direction debe ser "entry" o "exit"`);
    if (!Number.isInteger(r.door) || r.door < 1) throw new Error(`readers[${i}].door debe ser un número de puerta (1, 2...)`);
    return { name: r.name || `lector${i + 1}`, baudRate: 9600, ...r };
  });
  return cfg;
}

module.exports = { loadConfig };
