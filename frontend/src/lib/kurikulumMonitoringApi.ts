export type ActivityKind = "materi" | "tugas" | "ujian";
export interface Named { id: string; nama: string }
export interface TeacherOption {
  id: string; name: string; kelasDiajar: Named[]; mapelDiajar: Named[];
}
export interface MonitoringOptions {
  guru: TeacherOption[];
  kelas: (Named & { jurusan: { nama: string } })[];
  mapel: Named[];
}
export interface Filters { guruId: string; kelasId: string; mapelId: string; q: string }
export interface Activity {
  id: string; judul: string; deskripsi: string | null; createdAt: string;
  createdBy: { id: string; name: string }; kelas: Named; mapel: Named;
  fileUrl?: string | null; deadline?: string; tanggal?: string; durasiMenit?: number | null;
  _count?: { submissions?: number; soal?: number; jawaban?: number; nilai?: number };
}
export interface PageData<T> {
  items: T[]; pagination: { page: number; limit: number; total: number; totalPages: number };
}
export interface Overview { counts: { materi: number; tugas: number; ujian: number; pengumpulan: number; belumDinilai: number } }
export interface Detail { kind: ActivityKind; item: Activity; belumDinilai?: number }
export interface Submission {
  id: string; fileUrl: string | null; catatan: string | null; nilai: number | null;
  feedback: string | null; gradedAt: string | null; createdAt: string; updatedAt: string;
  siswa: { name: string; nis: string | null };
}
export interface Question {
  id: string; pertanyaan: string; opsiA: string; opsiB: string; opsiC: string; opsiD: string;
  bobot: number; urutan: number;
}
async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`/backend-api/kurikulum/monitoring${path}`, {
    method: "GET", credentials: "include", cache: "no-store", signal,
    headers: { Accept: "application/json" },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof body === "object" && body !== null && "message" in body &&
      typeof body.message === "string" ? body.message : null;
    throw new Error(message ?? `Gagal mengambil aktivitas (${response.status}). Pastikan patch backend sudah dipasang.`);
  }
  if (!body || typeof body !== "object") throw new Error("Respons server tidak valid.");
  return body as T;
}
function params(filters: Partial<Filters>, page?: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) query.set(key, value);
  if (page !== undefined) { query.set("page", String(page)); query.set("limit", "12"); }
  return query;
}
export const monitoringApi = {
  options: (signal?: AbortSignal) => request<MonitoringOptions>("/options", signal),
  overview: (filters: Filters, signal?: AbortSignal) => request<Overview>(`/overview?${params(filters)}`, signal),
  list: (kind: ActivityKind, filters: Filters, page: number, signal?: AbortSignal) => {
    const query = params(filters, page); query.set("kind", kind);
    return request<PageData<Activity>>(`/items?${query}`, signal);
  },
  detail: (kind: ActivityKind, id: string, signal?: AbortSignal) =>
    request<Detail>(`/items/${kind}/${encodeURIComponent(id)}`, signal),
  submissions: (id: string, page: number, q: string, signal?: AbortSignal) =>
    request<PageData<Submission>>(`/tugas/${encodeURIComponent(id)}/submissions?${params({ q }, page)}`, signal),
  questions: (id: string, page: number, q: string, signal?: AbortSignal) =>
    request<PageData<Question>>(`/ujian/${encodeURIComponent(id)}/questions?${params({ q }, page)}`, signal),
};
export function monitorError(error: unknown) {
  return error instanceof TypeError ? "Tidak dapat terhubung ke server. Periksa koneksi internet."
    : error instanceof Error ? error.message : "Terjadi kesalahan.";
}
export function monitorDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium", timeStyle: "short",
  }).format(date);
}
export function monitorUrl(value?: string | null) {
  if (!value) return null;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; }
  catch { return null; }
}
export function isActivityKind(value: string): value is ActivityKind {
  return value === "materi" || value === "tugas" || value === "ujian";
}
