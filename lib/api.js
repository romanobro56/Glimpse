// Small client-side fetch helper that never throws "Unexpected end of JSON".
// It reads the body as text first, parses it only if present, and surfaces a
// readable error (the server's { error } message when available) on failure.
export async function fetchJson(url, opts) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // Non-JSON body (e.g. an HTML error page).
    }
  }
  if (!res.ok) {
    throw new Error(
      (data && data.error) || text?.slice(0, 200) || `Request failed (${res.status})`
    );
  }
  return data ?? {};
}
