const BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export type Role =
  | "ADMIN_UTAMA"
  | "GURU"
  | "MURID"
  | "KEPSEK"
  | "KURIKULUM";

export type Jurusan = {
  id: string;
  nama: string;
};

export type Kelas = {
  id: string;
  nama: string;
  jurusanId: string;
  jurusan?: Jurusan;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string | null;
  nik: string | null;
  nis: string | null;
  nip: string | null;
  kelasId: string | null;
  role: Role;
  kelasDiajar: { id: string }[];
};

export type UpdateUserInput = {
  name: string;
  email: string;
  nik: string;
  nis?: string;
  nip?: string;
  kelasId?: string | null;
  kelasIds?: string[];
  password?: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${BASE}/admin${path}`, {
    ...options,
    credentials: "include",
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    let message = `Request gagal (${res.status})`;

    try {
      const error: { message?: string } = await res.json();

      if (typeof error.message === "string") {
        message = error.message;
      }
    } catch {
      // Keep fallback when the response is not JSON.
    }

    throw new Error(message);
  }

  return res.json() as Promise<T>;
}

export const adminApi = {
  async listUsers(role?: Role): Promise<AdminUser[]> {
    const { users } = await request<{ users: AdminUser[] }>(
      "/users"
    );

    return role
      ? users.filter((user) => user.role === role)
      : users;
  },

  async getUser(id: string): Promise<AdminUser> {
    const { user } = await request<{ user: AdminUser }>(
      `/users/${encodeURIComponent(id)}`
    );

    return user;
  },

  async createUser(
    data: Record<string, unknown>
  ): Promise<AdminUser> {
    const { user } = await request<{ user: AdminUser }>(
      "/users",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    return user;
  },

  async updateUser(
    id: string,
    data: UpdateUserInput
  ): Promise<AdminUser> {
    const { user } = await request<{ user: AdminUser }>(
      `/users/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );

    return user;
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/users/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },

  async listKelas(q?: string): Promise<Kelas[]> {
    const query = q ? `?q=${encodeURIComponent(q)}` : "";
    return request<Kelas[]>(`/kelas${query}`);
  },

  async createKelas(data: {
    nama: string;
    jurusanId: string;
  }): Promise<Kelas> {
    const { kelas } = await request<{ kelas: Kelas }>(
      "/kelas",
      {
        method: "POST",
        body: JSON.stringify(data),
      }
    );

    return kelas;
  },

  async deleteKelas(id: string): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/kelas/${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
  },

  async listJurusan(): Promise<Jurusan[]> {
    return request<Jurusan[]>("/jurusan");
  },
};
