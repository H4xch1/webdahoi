import { Router, type Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";

const router = Router();
router.use(authMiddleware);
class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function route(handler: (req: AuthRequest, res: Response) => Promise<unknown>) {
  return (req: AuthRequest, res: Response) => {
    void (async () => {
      res.setHeader("Cache-Control", "private, no-store");
      if (!req.user?.id) throw new HttpError(401, "Silakan masuk kembali.");
      const actor = await prisma.user.findUnique({ where: { id: req.user.id }, select: { role: true } });
      if (actor?.role !== "KURIKULUM") throw new HttpError(403, "Fitur ini hanya untuk Kurikulum.");
      return handler(req, res);
    })().catch((error: unknown) => {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.issues[0]?.message ?? "Filter tidak valid." }); return;
      }
      if (error instanceof HttpError) {
        res.status(error.status).json({ message: error.message }); return;
      }
      console.error("[kurikulum-monitoring]", error);
      res.status(500).json({ message: "Gagal mengambil aktivitas guru." });
    });
  };
}
const idSchema = z.string().uuid("ID tidak valid.");
const kindSchema = z.enum(["materi", "tugas", "ujian"]);
const filterSchema = z.object({
  guruId: idSchema.optional(), kelasId: idSchema.optional(), mapelId: idSchema.optional(),
  q: z.string().trim().max(200).default(""),
});
const listSchema = filterSchema.extend({
  kind: kindSchema.default("materi"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});
const pageSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  q: z.string().trim().max(200).default(""),
});
function scope(filter: z.infer<typeof filterSchema>) {
  return {
    createdBy: { role: "GURU" as const },
    ...(filter.guruId ? { createdById: filter.guruId } : {}),
    ...(filter.kelasId ? { kelasId: filter.kelasId } : {}),
    ...(filter.mapelId ? { mapelId: filter.mapelId } : {}),
    ...(filter.q ? { OR: [
      { judul: { contains: filter.q, mode: "insensitive" as const } },
      { deskripsi: { contains: filter.q, mode: "insensitive" as const } },
    ] } : {}),
  };
}
const common = {
  id: true, judul: true, deskripsi: true, createdAt: true,
  createdBy: { select: { id: true, name: true } },
  kelas: { select: { id: true, nama: true } },
  mapel: { select: { id: true, nama: true } },
} as const;
function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

router.get("/options", route(async (_req, res) => {
  const [guru, kelas, mapel] = await Promise.all([
    prisma.user.findMany({ where: { role: "GURU" }, orderBy: { name: "asc" }, select: {
      id: true, name: true,
      kelasDiajar: { select: { id: true, nama: true } },
      guruMapel: { select: { mapel: { select: { id: true, nama: true } } } },
    } }),
    prisma.kelas.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true, jurusan: { select: { nama: true } } } }),
    prisma.mapel.findMany({ orderBy: { nama: "asc" }, select: { id: true, nama: true } }),
  ]);
  res.json({ guru: guru.map(({ guruMapel, ...teacher }) => ({
    ...teacher, mapelDiajar: guruMapel.map((item) => item.mapel),
  })), kelas, mapel });
}));
router.get("/overview", route(async (req, res) => {
  const where = scope(filterSchema.parse(req.query));
  const [materi, tugas, ujian, pengumpulan, belumDinilai] = await Promise.all([
    prisma.materi.count({ where }), prisma.tugas.count({ where }), prisma.ujian.count({ where }),
    prisma.submission.count({ where: { tugas: where } }),
    prisma.submission.count({ where: { tugas: where, nilai: null } }),
  ]);
  res.json({ counts: { materi, tugas, ujian, pengumpulan, belumDinilai } });
}));
router.get("/items", route(async (req, res) => {
  const query = listSchema.parse(req.query);
  const where = scope(query);
  const paging = { skip: (query.page - 1) * query.limit, take: query.limit };
  const orderBy = [{ createdAt: "desc" as const }, { id: "desc" as const }];
  if (query.kind === "materi") {
    const [total, items] = await prisma.$transaction([
      prisma.materi.count({ where }),
      prisma.materi.findMany({ where, ...paging, orderBy, select: { ...common, fileUrl: true } }),
    ]);
    res.json({ items, pagination: pagination(query.page, query.limit, total) }); return;
  }
  if (query.kind === "tugas") {
    const [total, items] = await prisma.$transaction([
      prisma.tugas.count({ where }),
      prisma.tugas.findMany({ where, ...paging, orderBy, select: {
        ...common, deadline: true, _count: { select: { submissions: true } },
      } }),
    ]);
    res.json({ items, pagination: pagination(query.page, query.limit, total) }); return;
  }
  const [total, items] = await prisma.$transaction([
    prisma.ujian.count({ where }),
    prisma.ujian.findMany({ where, ...paging, orderBy, select: {
      ...common, tanggal: true, durasiMenit: true,
      _count: { select: { soal: true, jawaban: true, nilai: true } },
    } }),
  ]);
  res.json({ items, pagination: pagination(query.page, query.limit, total) });
}));
router.get("/items/:kind/:id", route(async (req, res) => {
  const kind = kindSchema.parse(req.params.kind);
  const id = idSchema.parse(req.params.id);
  const where = { id, createdBy: { role: "GURU" as const } };
  if (kind === "materi") {
    const item = await prisma.materi.findFirst({ where, select: { ...common, fileUrl: true } });
    if (!item) throw new HttpError(404, "Materi tidak ditemukan.");
    res.json({ kind, item }); return;
  }
  if (kind === "tugas") {
    const item = await prisma.tugas.findFirst({ where, select: {
      ...common, deadline: true, _count: { select: { submissions: true } },
    } });
    if (!item) throw new HttpError(404, "Tugas tidak ditemukan.");
    const belumDinilai = await prisma.submission.count({ where: { tugasId: id, nilai: null } });
    res.json({ kind, item, belumDinilai }); return;
  }
  const item = await prisma.ujian.findFirst({ where, select: {
    ...common, tanggal: true, durasiMenit: true,
    _count: { select: { soal: true, jawaban: true, nilai: true } },
  } });
  if (!item) throw new HttpError(404, "Ujian tidak ditemukan.");
  res.json({ kind, item });
}));
router.get("/tugas/:id/submissions", route(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const query = pageSchema.parse(req.query);
  const task = await prisma.tugas.findFirst({ where: { id, createdBy: { role: "GURU" } }, select: { id: true } });
  if (!task) throw new HttpError(404, "Tugas tidak ditemukan.");
  const where: Prisma.SubmissionWhereInput = {
    tugasId: id,
    ...(query.q ? { siswa: { OR: [
      { name: { contains: query.q, mode: "insensitive" } }, { nis: { contains: query.q } },
    ] } } : {}),
  };
  const [total, items] = await prisma.$transaction([
    prisma.submission.count({ where }),
    prisma.submission.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }], select: {
        id: true, fileUrl: true, catatan: true, nilai: true, feedback: true,
        gradedAt: true, createdAt: true, updatedAt: true,
        siswa: { select: { name: true, nis: true } },
      } }),
  ]);
  res.json({ items, pagination: pagination(query.page, query.limit, total) });
}));
router.get("/ujian/:id/questions", route(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const query = pageSchema.parse(req.query);
  const exam = await prisma.ujian.findFirst({ where: { id, createdBy: { role: "GURU" } }, select: { id: true } });
  if (!exam) throw new HttpError(404, "Ujian tidak ditemukan.");
  const where: Prisma.SoalWhereInput = { ujianId: id, ...(query.q ? {
    pertanyaan: { contains: query.q, mode: "insensitive" },
  } : {}) };
  const [total, items] = await prisma.$transaction([
    prisma.soal.count({ where }),
    prisma.soal.findMany({ where, skip: (query.page - 1) * query.limit, take: query.limit,
      orderBy: [{ urutan: "asc" }, { id: "asc" }], select: {
        id: true, pertanyaan: true, opsiA: true, opsiB: true, opsiC: true, opsiD: true,
        bobot: true, urutan: true,
      } }),
  ]);
  // Answer keys are intentionally not selected for monitoring.
  res.json({ items, pagination: pagination(query.page, query.limit, total) });
}));

// Read-only router: no POST, PUT, PATCH, or DELETE handlers.
export default router;
