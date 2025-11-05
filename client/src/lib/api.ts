const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function api(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
    },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw data;
  return data;
}
