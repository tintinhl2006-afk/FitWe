const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
const defaultResolve = config.resolver.resolveRequest;

// expo-secure-store has no web implementation; alias it to a localStorage shim for browser previews.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'expo-secure-store') {
    return { type: 'sourceFile', filePath: path.resolve(__dirname, 'src/lib/secureStore.web.ts') };
  }
  return (defaultResolve ?? context.resolveRequest)(context, moduleName, platform);
};

// Browser preview only: forward /api/* to the local Next server so the web build is same-origin
// (the Next API sends no CORS headers). Native builds ignore this and use EXPO_PUBLIC_API_URL.
const http = require('http');
config.server.enhanceMiddleware = (metroMiddleware) => (req, res, next) => {
  if (!req.url.startsWith('/api/')) return metroMiddleware(req, res, next);
  const upstream = http.request(
    { host: 'localhost', port: 3000, path: req.url, method: req.method, headers: { ...req.headers, host: 'localhost:3000' } },
    (r) => {
      res.writeHead(r.statusCode ?? 502, r.headers);
      r.pipe(res);
    }
  );
  upstream.on('error', () => {
    res.writeHead(502);
    res.end('Local API (localhost:3000) is not reachable');
  });
  req.pipe(upstream);
};

module.exports = config;
