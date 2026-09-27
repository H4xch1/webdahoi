const BASE_URL =
  typeof window === "undefined"
    ? (
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:4000/api"
      ).replace(/\/+$/, "")
    : "/backend-api";

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiClient<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  console.log("API request:", {
  base: BASE_URL,
  path,
  url: `${BASE_URL}${path}`,
});

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Cookie: `token=${token}` } : {}),
      ...(headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => apiClient<T>(path, { method: "GET" }),
  post: <T>(path: string, data?: unknown) =>
    apiClient<T>(path, { method: "POST", body: JSON.stringify(data) }),
  patch: <T>(path: string, data?: unknown) =>
    apiClient<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => apiClient<T>(path, { method: "DELETE" }),
};
