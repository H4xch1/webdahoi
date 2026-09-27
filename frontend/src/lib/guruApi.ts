const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api"
).replace(/\/$/, "");

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

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_URL}/guru${path}`, {
    ...options,
    headers,
    credentials: "include",
    cache: "no-store",
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const fallback =
      response.status === 401
        ? "Sesi berakhir. Silakan masuk kembali."
        : response.status === 403
          ? "Anda tidak memiliki akses ke data ini."
          : "Permintaan gagal. Silakan coba lagi.";

    throw new Error(hasMessage(body) ? body.message : fallback);
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
