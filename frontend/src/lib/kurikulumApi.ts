export type ManagedRole = "GURU" | "MURID";
export interface NamedOption { id: string; nama: string }
export interface ClassOption extends NamedOption {
  jurusan: { nama: string };
  tingkat: { nama: string } | null;
  mapel: NamedOption[];
}
export interface ManagementOptions { kelas: ClassOption[]; mapel: NamedOption[] }
export interface ManagedUser {
  id: string; name: string; email: string; nik: string;
  nis: string | null; nisn: string | null; nip: string | null;
  role: ManagedRole; kelasId: string | null; avatarUrl: string | null;
  createdAt: string; updatedAt: string;
  kelas: (NamedOption & { jurusan: { nama: string } }) | null;
  kelasDiajar: NamedOption[]; mapelDiajar: NamedOption[];
}
export interface UserInput {
  name: string; email: string; nik: string; nis: string; nisn: string; nip: string;
  avatarUrl: string; password: string; kelasId: string | null;
  kelasIds: string[]; mapelIds: string[];
}
export interface UserList {
  users: ManagedUser[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface Overview { counts: { guru: number; siswa: number; kelas: number; mapel: number; tanpaKelas: number } }
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`/backend-api/kurikulum${path}`, {
    ...options, headers, credentials: "include", cache: "no-store",
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "message" in body &&
      typeof body.message === "string" ? body.message : null;
    throw new Error(message ?? (response.status === 401 ? "Sesi berakhir. Silakan masuk kembali."
      : `Permintaan gagal (${response.status}). Periksa deployment backend.`));
  }
  if (!body || typeof body !== "object") throw new Error("Respons server tidak valid.");
  return body as T;
}
export const kurikulumApi = {
  overview: (signal?: AbortSignal) => request<Overview>("/overview", { signal }),
  options: (signal?: AbortSignal) => request<ManagementOptions>("/options", { signal }),
  list: (role: ManagedRole, page: number, q: string, kelasId: string, signal?: AbortSignal) => {
    const params = new URLSearchParams({ role, page: String(page), limit: "12", q });
    if (kelasId) params.set("kelasId", kelasId);
    return request<UserList>(`/users?${params}`, { signal });
  },
  get: (id: string, signal?: AbortSignal) => request<{ user: ManagedUser }>(`/users/${encodeURIComponent(id)}`, { signal }),
  create: (role: ManagedRole, input: UserInput) => request<{ user: ManagedUser; message: string }>("/users", {
    method: "POST", body: JSON.stringify({ ...input, role }),
  }),
  update: (id: string, input: UserInput, updatedAt: string) => request<{ user: ManagedUser; message: string }>(
    `/users/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ ...input, updatedAt }) }),
  remove: (user: ManagedUser) => request<{ message: string }>(`/users/${encodeURIComponent(user.id)}`, {
    method: "DELETE", body: JSON.stringify({ updatedAt: user.updatedAt, confirmation: "DELETE" }),
  }),
};
export function managementError(error: unknown) {
  return error instanceof TypeError ? "Tidak dapat terhubung ke server. Periksa koneksi internet."
    : error instanceof Error ? error.message : "Terjadi kesalahan.";
}
export function managementDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium", timeStyle: "short",
  }).format(date);
}
