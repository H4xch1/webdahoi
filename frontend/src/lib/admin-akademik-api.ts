const BASE =
  typeof window === "undefined"
    ? (
        process.env.NEXT_PUBLIC_BACKEND_URL ||
        "http://localhost:4000/api"
      ).replace(/\/+$/, "")
    : "/backend-api";

export type AcademicEntity =
  | "jurusan"
  | "tingkat"
  | "kelas"
  | "mapel";

export interface AcademicOption {
  id: string;
  nama: string;
}

export interface AcademicClass extends AcademicOption {
  jurusanId: string;
  tingkatId: string | null;
  jurusan: AcademicOption;
  tingkat: AcademicOption | null;
  mapel: AcademicOption[];
  _count: {
    siswa: number;
    mapel?: number;
    materi?: number;
    tugas?: number;
    ujian?: number;
    absensi?: number;
  };
}

export interface AcademicMapel extends AcademicOption {
  _count?: Record<string, number>;
}

export interface AcademicData {
  jurusan: AcademicOption[];
  tingkat: AcademicOption[];
  kelas: AcademicClass[];
  mapel: AcademicMapel[];
}

export interface AcademicInput {
  nama: string;
  jurusanId?: string;
  tingkatId?: string;
  mapelIds?: string[];
}

function hasMessage(
  value: unknown,
): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(
    `${BASE}/admin/akademik${path}`,
    {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    },
  );

  const body: unknown = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const fallback =
      response.status === 401
        ? "Sesi berakhir. Silakan masuk kembali."
        : response.status === 403
          ? "Anda tidak memiliki akses."
          : "Permintaan gagal.";

    throw new Error(
      hasMessage(body) ? body.message : fallback,
    );
  }

  return body as T;
}

export const adminAkademikApi = {
  async list(): Promise<AcademicData> {
    const data = await request<
      Partial<AcademicData>
    >("");

    return {
      jurusan: Array.isArray(data.jurusan)
        ? data.jurusan
        : [],
      tingkat: Array.isArray(data.tingkat)
        ? data.tingkat
        : [],
      kelas: Array.isArray(data.kelas)
        ? data.kelas
        : [],
      mapel: Array.isArray(data.mapel)
        ? data.mapel
        : [],
    };
  },

  create: (
    entity: AcademicEntity,
    input: AcademicInput,
  ) =>
    request<AcademicOption>(`/${entity}`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  update: (
    entity: AcademicEntity,
    id: string,
    input: AcademicInput,
  ) =>
    request<AcademicOption>(
      `/${entity}/${encodeURIComponent(id)}`,
      {
        method: "PUT",
        body: JSON.stringify(input),
      },
    ),

  remove: (
    entity: AcademicEntity,
    id: string,
  ) =>
    request<{ message: string }>(
      `/${entity}/${encodeURIComponent(id)}`,
      {
        method: "DELETE",
      },
    ),
};
