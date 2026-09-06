export type Role = "MURID" | "GURU" | "KEPSEK" | "KURIKULUM" | "ADMIN_UTAMA";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  kelasId?: string | null;
}

export interface Tugas {
  id: string;
  judul: string;
  deskripsi?: string;
  deadline: string;
  mapelId: string;
  kelasId: string;
  createdAt: string;
}

export interface Ujian {
  id: string;
  judul: string;
  deskripsi?: string;
  tanggal: string;
  mapelId: string;
  kelasId: string;
}

export interface Materi {
  id: string;
  judul: string;
  deskripsi?: string;
  fileUrl?: string;
  mapelId: string;
  kelasId: string;
}

export interface Nilai {
  id: string;
  siswaId: string;
  tugasId?: string;
  ujianId?: string;
  nilai: number;
}
