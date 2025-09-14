export async function getJSON<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const r = await fetch(input, init);
  const text = await r.text();
  if (!r.ok) throw new Error(text || `HTTP ${r.status}`);
  if (!text) throw new Error("Respuesta vacía");
  const ct = r.headers.get("content-type") ?? "";
  if (!/application\/json/i.test(ct)) throw new Error(`No JSON: ${ct} -> ${text.slice(0,200)}`);
  return JSON.parse(text) as T;
}
