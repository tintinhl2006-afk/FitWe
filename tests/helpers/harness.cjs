/**
 * Test harness: loads the REAL TypeScript modules from src/ (transpiled in memory with the
 * TypeScript compiler the project already depends on) and replaces heavy dependencies — the
 * database, NextAuth, the mail provider — with in-memory stubs.
 *
 * Nothing here touches a database, the network or the .env file, so the suite is safe to run
 * anywhere. No test framework is installed: it uses Node's built-in runner (node --test).
 */
const fs = require("fs");
const path = require("path");
const Module = require("module");

const ROOT = path.resolve(__dirname, "..", "..");
const SRC = path.join(ROOT, "src");
const ts = require(path.join(ROOT, "node_modules", "typescript"));

/** Minimal stand-in for next/server: just enough for route handlers that call NextResponse.json. */
const nextServerStub = {
  NextResponse: {
    json: (body, init) => ({ body, status: (init && init.status) || 200, headers: (init && init.headers) || {} }),
    next: () => ({ kind: "next" }),
    redirect: (u) => ({ kind: "redirect", to: new URL(u).pathname }),
  },
};

function createHarness(stubs = {}) {
  const origResolve = Module._resolveFilename;
  const origLoad = Module._load;

  Module._resolveFilename = function (request, ...rest) {
    if (request.startsWith("@/") && !Object.prototype.hasOwnProperty.call(stubs, request)) {
      const base = path.join(SRC, request.slice(2));
      for (const ext of [".ts", ".tsx", "/index.ts"]) {
        if (fs.existsSync(base + ext)) return base + ext;
      }
    }
    return origResolve.call(this, request, ...rest);
  };

  Module._load = function (request, ...rest) {
    if (Object.prototype.hasOwnProperty.call(stubs, request)) return stubs[request];
    return origLoad.call(this, request, ...rest);
  };

  require.extensions[".ts"] = function (module, filename) {
    const out = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
        esModuleInterop: true,
      },
    }).outputText;
    module._compile(out, filename);
  };

  return {
    /** Loads a module under src/, e.g. load("lib/password.ts"). */
    load: (rel) => require(path.join(SRC, rel)),
    /** Reads a file from the repository as text. */
    read: (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8"),
    ts,
    ROOT,
  };
}

/** A POST/GET Request with a JSON body. */
function jsonRequest(body, { method = "POST", headers = {}, url = "http://localhost/" } = {}) {
  return new Request(url, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
    headers: { "content-type": "application/json", ...headers },
  });
}

module.exports = { createHarness, jsonRequest, nextServerStub, ROOT };
