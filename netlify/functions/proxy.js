// Netlify Function: Secure proxy to backend API
// - Restricts forwarding to configured backend base URL
// - Adds X-API-Key from env to every request
// - Forwards method, path, query, headers, and body
// - Handles CORS and OPTIONS preflight

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type,Authorization"
};

const hopByHopHeaderList = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
  "host",
  "accept-encoding"
]);

const normalizeBase = (url) => (url || "").replace(/\/$/, "");

exports.handler = async (event) => {
  try {
    const method = event.httpMethod || "GET";

    // CORS preflight
    if (method === "OPTIONS") {
      return { statusCode: 200, headers: CORS_HEADERS, body: "" };
    }

    const backendBase =
      normalizeBase(process.env.BACKEND_BASE_URL || process.env.API_BASE_URL || process.env.VITE_API_BASE_URL);
    const apiKey = process.env.MY_API_KEY || process.env.API_KEY || process.env.BACKEND_API_KEY;

    if (!backendBase) {
      return {
        statusCode: 500,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Backend base URL is not configured" })
      };
    }

    // Construct target URL from function path by trimming the function prefix
    const functionPrefix = "/.netlify/functions/proxy";
    const rawPath = event.path || functionPrefix;
    const subPath = rawPath.startsWith(functionPrefix)
      ? rawPath.slice(functionPrefix.length) || "/"
      : "/";

    // Disallow protocol-like patterns in subPath for safety
    if (/^https?:/i.test(subPath)) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: "Absolute URLs are not allowed" })
      };
    }

    const query = event.rawQuery ? `?${event.rawQuery}` : "";
    const targetUrl = `${backendBase}${subPath}${query}`;

    // Prepare headers for backend request: forward most headers, set X-API-Key
    const incomingHeaders = event.headers || {};
    const outgoingHeaders = {};
    for (const [k, v] of Object.entries(incomingHeaders)) {
      const key = k.toLowerCase();
      if (!hopByHopHeaderList.has(key)) {
        outgoingHeaders[key] = v;
      }
    }
    if (apiKey) {
      outgoingHeaders["x-api-key"] = apiKey;
    }

    // Prepare body
    let body;
    if (!["GET", "HEAD"].includes(method)) {
      if (event.body) {
        body = event.isBase64Encoded ? Buffer.from(event.body, "base64") : event.body;
      }
    }

    const backendResponse = await fetch(targetUrl, {
      method,
      headers: outgoingHeaders,
      body
    });

    const text = await backendResponse.text();

    // Build response headers: propagate content-type, add CORS
    const respHeaders = { ...CORS_HEADERS };
    const contentType = backendResponse.headers.get("content-type");
    if (contentType) respHeaders["Content-Type"] = contentType;

    return {
      statusCode: backendResponse.status,
      headers: respHeaders,
      body: text
    };
  } catch (err) {
    return {
      statusCode: 502,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: "Proxy error", message: err.message })
    };
  }
};
