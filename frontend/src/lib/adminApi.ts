const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}/admin${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message ?? "Request gagal");
  }
  return res.json();
}

export type Role = "ADMIN_UTAMA" | "GURU" | "MURID" | "KEPSEK" | "KURIKULUM";

export type AdminUser = {
  id: string;
  name: string;
  email: string | null;
  nik: string | null;
  nis: string | null;
  nip: string | null;
  role: Role;
  kelasId: string | null;
};

export type Jurusan = { id: string; nama: string };
export type Kelas = { id: string; nama: string; jurusanId: string; jurusan?: Jurusan };

export const adminApi = {
  listUsers: (role?: Role) =>
    request<AdminUser[]>(`/users${role ? `?role=${role}` : ""}`),
  createUser: (data: Record<string, unknown>) =>
    request<AdminUser>("/users", { method: "POST", body: JSON.stringify(data) }),
  deleteUser: (id: string) => request<{ message: string }>(`/users/${id}`, { method: "DELETE" }),

  listKelas: (q?: string) =>
    request<Kelas[]>(`/kelas${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  createKelas: (data: { nama: string; jurusanId: string }) =>
    request<Kelas>("/kelas", { method: "POST", body: JSON.stringify(data) }),
  deleteKelas: (id: string) => request<{ message: string }>(`/kelas/${id}`, { method: "DELETE" }),

  listJurusan: () => request<Jurusan[]>("/jurusan"),
};
