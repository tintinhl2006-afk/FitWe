// Cross-platform Base64 and Crypto helpers for React Native & Web
const SECRET = "fitwe_secure_access_token_secret";

function btoaPolyfill(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  for (let block = 0, charCode, i = 0, map = chars;
       str.charAt(i | 0) || (map = '=', i % 1);
       output += map.charAt(63 & block >> 8 - i % 1 * 8)) {
    charCode = str.charCodeAt(i += 3/4);
    if (charCode > 255) {
      throw new Error("'btoa' failed: The string to be encoded contains characters outside of the Latin1 range.");
    }
    block = block << 8 | charCode;
  }
  return output;
}

function atobPolyfill(input: string): string {
  const str = String(input).replace(/=+$/, '');
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  if (str.length % 4 === 1) {
    throw new Error("'atob' failed: The string to be decoded is not correctly encoded.");
  }
  for (let bc = 0, bs = 0, buffer, idx = 0;
       buffer = str.charAt(idx++);
       ~buffer && (bs = bc % 4 ? bs * 64 + buffer : buffer,
         bc++ % 4) ? output += String.fromCharCode(255 & bs >> (-2 * bc & 6)) : 0) {
    buffer = chars.indexOf(buffer);
  }
  return output;
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function generateAccessCode(userId: string): string {
  const timestamp = Date.now();
  const payload = `${userId}:${timestamp}`;
  const signature = simpleHash(`${payload}:${SECRET}`);
  return btoaPolyfill(`${payload}:${signature}`);
}

export function verifyAccessCode(token: string): { userId: string; timestamp: number } | null {
  try {
    const decoded = atobPolyfill(token);
    const parts = decoded.split(":");
    
    if (parts.length !== 3) {
      return null;
    }
    
    const [userId, timestampStr, signature] = parts;
    const timestamp = parseInt(timestampStr, 10);
    
    if (isNaN(timestamp)) {
      return null;
    }
    
    const payload = `${userId}:${timestamp}`;
    const expectedSignature = simpleHash(`${payload}:${SECRET}`);
    
    if (signature !== expectedSignature) {
      return null;
    }
    
    return { userId, timestamp };
  } catch (error) {
    return null;
  }
}
