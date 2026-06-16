import winston from "winston";

let logger: any;

if (typeof window === "undefined") {
  const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
  };

  const colors = {
    error: "red",
    warn: "yellow",
    info: "green",
    http: "magenta",
    debug: "white",
  };

  winston.addColors(colors);

  const format = winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss:ms" }),
    winston.format.colorize({ all: true }),
    winston.format.printf(
      (info) => `[${info.timestamp}] [${info.level.toUpperCase()}]: ${info.message}`
    )
  );

  logger = winston.createLogger({
    level: process.env.NODE_ENV === "development" ? "debug" : "info",
    levels,
    format,
    transports: [new winston.transports.Console()],
  });
} else {
  // Browser fallback
  logger = {
    error: (...args: any[]) => console.error("[ERROR]", ...args),
    warn: (...args: any[]) => console.warn("[WARN]", ...args),
    info: (...args: any[]) => console.info("[INFO]", ...args),
    http: (...args: any[]) => console.log("[HTTP]", ...args),
    debug: (...args: any[]) => console.log("[DEBUG]", ...args),
  };
}

export { logger };
