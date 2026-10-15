const BASE =
  typeof window === "undefined"
    ? (
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:4000/api"
      ).replace(/\/+$/, "")
    : "/backend-api";

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

export type Mapel = {
  id: string;
  nama: string;
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
  kelasDiajar: {
    id: string;
  }[];
  mapelDiajar?: {
    id: string;
    nama?: string;
  }[];
};

export type CreateUserInput = {
  name: string;
  email?: string;
  nik?: string;
  nis?: string;
  nip?: string;
  password: string;
  role: Role;
  kelasId?: string | null;
  kelasIds?: string[];
  mapelIds?: string[];
};

export type UpdateUserInput = {
  name: string;
  email: string;
  nik: string;
  nis?: string;
  nip?: string;
  kelasId?: string | null;
  kelasIds?: string[];
  mapelIds?: string[];
  password?: string;
};

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (!headers.has("Content-Type")) {
    headers.set(
      "Content-Type",
      "application/json",
    );
  }

  const response = await fetch(
    `${BASE}/admin${path}`,
    {
      ...options,
      credentials: "include",
      cache: "no-store",
      headers,
    },
  );

  if (!response.ok) {
    let message =
      `Request gagal (${response.status})`;

    try {
      const error = await response.json();

      if (typeof error?.message === "string") {
        message = error.message;
      }
    } catch {
      // Response bukan JSON.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

function normalizeMapelResponse(
  payload: unknown,
): Mapel[] {
  if (Array.isArray(payload)) {
    return payload as Mapel[];
  }

  if (
    payload &&
    typeof payload === "object" &&
    "data" in payload &&
    Array.isArray(
      (payload as { data: unknown }).data,
    )
  ) {
    return (payload as { data: Mapel[] }).data;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "mapel" in payload &&
    Array.isArray(
      (payload as { mapel: unknown }).mapel,
    )
  ) {
    return (payload as { mapel: Mapel[] }).mapel;
  }

  return [];
}

export const adminApi = {
  async listUsers(
    role?: Role,
  ): Promise<AdminUser[]> {
    const result = await request<{
      users: AdminUser[];
    }>("/users");

    return role
      ? result.users.filter(
          (user) => user.role === role,
        )
      : result.users;
  },

  async getUser(
    id: string,
  ): Promise<AdminUser> {
    const result = await request<{
      user: AdminUser;
    }>(
      `/users/${encodeURIComponent(id)}`,
    );

    return result.user;
  },

  async createUser(
    data: CreateUserInput,
  ): Promise<AdminUser> {
    const result = await request<{
      user: AdminUser;
    }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });

    return result.user;
  },

  async updateUser(
    id: string,
    data: UpdateUserInput,
  ): Promise<AdminUser> {
    const result = await request<{
      user: AdminUser;
    }>(
      `/users/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      },
    );

    return result.user;
  },

  async deleteUser(
    id: string,
  ): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/users/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  },

  async listKelas(
    q?: string,
  ): Promise<Kelas[]> {
    const query = q
      ? `?q=${encodeURIComponent(q)}`
      : "";

    const result = await request<
      Kelas[] | { data: Kelas[] }
    >(`/kelas${query}`);

    if (Array.isArray(result)) {
      return result;
    }

    return result.data ?? [];
  },

  async createKelas(data: {
    nama: string;
    jurusanId: string;
  }): Promise<Kelas> {
    const result = await request<{
      kelas: Kelas;
    }>("/kelas", {
      method: "POST",
      body: JSON.stringify(data),
    });

    return result.kelas;
  },

  async deleteKelas(
    id: string,
  ): Promise<{ message: string }> {
    return request<{ message: string }>(
      `/kelas/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    );
  },

  async listJurusan(): Promise<Jurusan[]> {
    return request<Jurusan[]>("/jurusan");
  },

  async listMapel(): Promise<Mapel[]> {
    const result =
      await request<unknown>("/mapel");

    return normalizeMapelResponse(result);
  },
};
