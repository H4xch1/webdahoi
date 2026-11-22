// frontend/src/lib/guruApi.ts

/**
 * Always call the existing Next.js same-origin proxy.
 * Backend routing is configured in next.config.ts.
 */
const API_URL = "/backend-api";

export type AttendanceStatus = "HADIR" | "IZIN" | "SAKIT" | "ALPA";

export interface SubjectOption {
  id: string;
  nama: string;
}

export interface ClassOption {
  id: string;
  nama: string;
  jurusan: { nama: string };
  mapel: SubjectOption[];
}

export interface GuruOptions {
  teacher: {
    id: string;
    name: string;
  };
  kelas: ClassOption[];
}

interface ContentBase {
  id: string;
  judul: string;
  deskripsi: string | null;
  kelas: { nama: string };
  mapel: { nama: string };
}

export interface MateriSummary extends ContentBase {
  fileUrl: string | null;
  createdAt: string;
}

export interface TugasSummary extends ContentBase {
  deadline: string;
  _count: { submissions: number };
}

export interface UjianSummary extends ContentBase {
  tanggal: string;
  durasiMenit: number | null;
  _count: { soal: number };
}

export interface GuruOverview {
  counts: {
    kelas: number;
    materi: number;
    tugas: number;
    ujian: number;
    belumDinilai: number;
  };
  materi: MateriSummary[];
  tugas: TugasSummary[];
  ujian: UjianSummary[];
}

export interface LearningInput {
  judul: string;
  deskripsi: string;
  kelasId: string;
  mapelId: string;
}

export interface QuestionInput {
  pertanyaan: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  jawabanBenar: "A" | "B" | "C" | "D";
  bobot: number;
}

export interface AttendanceStudent {
  id: string;
  name: string;
  nis: string | null;
  status: AttendanceStatus | null;
  keterangan: string;
}

export interface AttendanceQuery {
  kelasId: string;
  mapelId: string;
  tanggal: string;
}

export interface AttendanceEntry {
  siswaId: string;
  status: AttendanceStatus;
  keterangan: string;
}

export interface Submission {
  id: string;
  fileUrl: string | null;
  catatan: string | null;
  nilai: number | null;
  feedback: string | null;
  gradedAt: string | null;
  createdAt: string;
  updatedAt: string;
  siswa: {
    id: string;
    name: string;
    nis: string | null;
  };
}

export interface SubmissionsResponse {
  tugas: ContentBase & {
    deadline: string;
    kelasId: string;
    mapelId: string;
  };
  submissions: Submission[];
}

export interface GradeUpdate {
  id: string;
  nilai: number | null;
  feedback: string | null;
  gradedAt: string | null;
  updatedAt: string;
}

function hasMessage(value: unknown): value is { message: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  headers.set("Accept", "application/json");

  if (typeof options.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}/guru${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch (error: unknown) {
    if (options.signal?.aborted || isAbortError(error)) {
      throw error;
    }

    throw new Error(
      "Tidak dapat terhubung ke server. Periksa koneksi internet dan konfigurasi backend.",
    );
  }

  const text = await response.text();

  let body: unknown = null;
  let validJson = false;

  if (text.trim()) {
    try {
      body = JSON.parse(text) as unknown;
      validJson = true;
    } catch {
      validJson = false;
    }
  }

  if (!response.ok) {
    let fallback = `Permintaan gagal (${response.status}). Silakan coba lagi.`;

    if (response.status === 401) {
      fallback = "Sesi berakhir. Silakan masuk kembali.";
    } else if (response.status === 403) {
      fallback = "Anda tidak memiliki akses ke data ini.";
    } else if (response.status === 404) {
      fallback =
        "Endpoint Guru tidak ditemukan. Periksa URL backend dan deployment API.";
    } else if (response.status >= 500) {
      fallback =
        "Server mengalami gangguan. Periksa deployment backend dan log server.";
    }

    throw new Error(hasMessage(body) ? body.message : fallback);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  if (!validJson) {
    throw new Error(
      "Respons server bukan JSON. Periksa konfigurasi proxy /backend-api dan URL backend.",
    );
  }

  return body as T;
}

function post<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export const guruApi = {
  options: (signal?: AbortSignal) =>
    request<GuruOptions>("/options", { signal }),

  overview: (signal?: AbortSignal) =>
    request<GuruOverview>("/overview", { signal }),

  createMateri: (input: LearningInput & { fileUrl: string }) =>
    post<{ materi: { id: string; judul: string } }>("/materi", input),

  createTugas: (input: LearningInput & { deadline: string }) =>
    post<{ tugas: { id: string; judul: string } }>("/tugas", input),

  createUjian: (
    input: LearningInput & {
      tanggal: string;
      durasiMenit: number;
      soal: QuestionInput[];
    },
  ) => post<{ ujian: { id: string; judul: string } }>("/ujian", input),

  attendance: (query: AttendanceQuery, signal?: AbortSignal) => {
    const params = new URLSearchParams({ ...query });

    return request<{ siswa: AttendanceStudent[] }>(
      `/absen?${params.toString()}`,
      { signal },
    );
  },

  saveAttendance: (
    input: AttendanceQuery & { entries: AttendanceEntry[] },
  ) => post<{ message: string }>("/absen", input),

  submissions: (tugasId: string, signal?: AbortSignal) =>
    request<SubmissionsResponse>(
      `/tugas/${encodeURIComponent(tugasId)}/submissions`,
      { signal },
    ),

  grade: (
    submissionId: string,
    input: {
      nilai: number;
      feedback: string;
      updatedAt: string;
    },
  ) =>
    post<{ updated: GradeUpdate }>(
      `/nilai/${encodeURIComponent(submissionId)}`,
      input,
    ),
};

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Terjadi kesalahan. Silakan coba lagi.";
}

export function formatDateTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function localDateString(): string {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export function safeResourceUrl(value: string | null): string | null {
  if (!value) return null;

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:"
      ? url.href
      : null;
  } catch {
    return null;
  }
}
