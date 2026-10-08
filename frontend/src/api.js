const BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function api(path, options = {}) {
  // Only send Content-Type when there is a body; avoids needless CORS preflights on GETs.
  const headers = options.body ? { "Content-Type": "application/json" } : {};
  const response = await fetch(`${BASE}${path}`, { ...options, headers });

  let body = null;
  try {
    body = await response.json();
  } catch {
    // non-JSON response
  }

  if (!response.ok || !body?.success) {
    throw new Error(body?.message || `Request failed (${response.status})`);
  }
  return body.data;
}
