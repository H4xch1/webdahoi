export interface ExamResult {
  nilai: number;
  createdAt: string;
}
export interface LearningItem {
  id: string;
  judul: string;
  deskripsi: string | null;
  createdAt: string;
  kelas: { nama: string };
  mapel: { nama: string };
  createdBy: { name: string };
  fileUrl?: string | null;
  tanggal?: string;
  durasiMenit?: number | null;
  questionCount?: number;
  result?: ExamResult | null;
}
export interface LearningList {
  items: LearningItem[];
  serverNow?: string;
  pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface Question {
  id: string;
  pertanyaan: string;
  opsiA: string;
  opsiB: string;
  opsiC: string;
  opsiD: string;
  bobot: number;
}
export type Choice = "A" | "B" | "C" | "D";
export interface ExamDetail {
  studentId: string;
  exam: LearningItem & { tanggal: string; durasiMenit: number | null; questionCount: number };
  questions: Question[];
  result: ExamResult | null;
  state: "UPCOMING" | "OPEN" | "CLOSED" | "COMPLETED" | "UNAVAILABLE";
  endsAt: string | null;
  serverNow: string;
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");
  if (options.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`/backend-api/murid${path}`, {
    ...options, headers, credentials: "include", cache: "no-store",
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body === "object" && body !== null &&
      "message" in body && typeof body.message === "string" ? body.message : null;
    throw new Error(message ?? (response.status === 401
      ? "Sesi berakhir. Silakan masuk kembali."
      : `Permintaan gagal (${response.status}). Periksa deployment backend.`));
  }
  if (!body || typeof body !== "object") throw new Error("Respons server tidak valid.");
  return body as T;
}
export const muridLearningApi = {
  list: (kind: "materi" | "ujian", page: number, search: string, signal?: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), limit: "12", search });
    return request<LearningList>(`/${kind}?${params}`, { signal });
  },
  exam: (id: string, signal?: AbortSignal) =>
    request<ExamDetail>(`/ujian/${encodeURIComponent(id)}`, { signal }),
  submit: (id: string, answers: { soalId: string; pilihan: Choice }[]) =>
    request<{ result: ExamResult; message: string }>(`/ujian/${encodeURIComponent(id)}/submit`, {
      method: "POST", body: JSON.stringify({ answers }),
    }),
};
export function learningError(error: unknown) {
  return error instanceof TypeError ? "Tidak dapat terhubung ke server. Periksa koneksi internet."
    : error instanceof Error ? error.message : "Terjadi kesalahan.";
}
export function learningDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium", timeStyle: "short",
  }).format(date);
}
export function resourceUrl(value?: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}
