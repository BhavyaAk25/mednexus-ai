export async function requestJson<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...options,
    cache: "no-store",
    headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(payload.error || "The request could not be completed.", response.status);
  return payload as T;
}
export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}
