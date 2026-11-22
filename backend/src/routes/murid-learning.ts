import { Router, type Response } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware, type AuthRequest } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();
router.use(authMiddleware, authorize("MURID"));

class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

function route(handler: (req: AuthRequest, res: Response) => Promise<unknown>) {
  return (req: AuthRequest, res: Response) => {
    void handler(req, res).catch((error: unknown) => {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: error.issues[0]?.message ?? "Data tidak valid." });
        return;
      }
      if (error instanceof HttpError) {
        res.status(error.status).json({ message: error.message });
        return;
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError &&
          (error.code === "P2034" || error.code === "P2002")) {
        res.status(409).json({ message: "Permintaan sedang diproses. Muat ulang untuk memeriksa hasil sebelum mencoba lagi." });
        return;
      }
      console.error("[murid-learning]", error);
      res.status(500).json({ message: "Terjadi kesalahan pada server." });
    });
  };
}

const idSchema = z.string().uuid("ID ujian tidak valid.");
const listSchema = z.object({
  page: z.coerce.number().int().min(1).max(100000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().trim().max(200).default(""),
});
const submitSchema = z.object({
  answers: z.array(z.object({
    soalId: idSchema,
    pilihan: z.enum(["A", "B", "C", "D"]),
  })).max(100),
});

async function getStudent(userId: string) {
  const student = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, kelasId: true },
  });
  if (!student?.kelasId) {
    throw new HttpError(400, "Anda belum terdaftar di kelas. Hubungi admin.");
  }
  return { id: student.id, kelasId: student.kelasId };
}

function pagination(page: number, limit: number, total: number) {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}

function searchWhere(search: string) {
  return search ? {
    OR: [
      { judul: { contains: search, mode: "insensitive" as const } },
      { deskripsi: { contains: search, mode: "insensitive" as const } },
      { mapel: { nama: { contains: search, mode: "insensitive" as const } } },
    ],
  } : {};
}

const relations = {
  kelas: { select: { nama: true } },
  mapel: { select: { nama: true } },
  createdBy: { select: { name: true } },
} as const;

router.get("/materi", route(async (req, res) => {
  const student = await getStudent(req.user!.id);
  const query = listSchema.parse(req.query);
  const where: Prisma.MateriWhereInput = {
    kelasId: student.kelasId,
    ...searchWhere(query.search),
  };
  const [total, items] = await prisma.$transaction([
    prisma.materi.count({ where }),
    prisma.materi.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      select: {
        id: true, judul: true, deskripsi: true, fileUrl: true,
        createdAt: true, ...relations,
      },
    }),
  ]);
  res.json({ items, pagination: pagination(query.page, query.limit, total) });
}));

router.get("/ujian", route(async (req, res) => {
  const student = await getStudent(req.user!.id);
  const query = listSchema.parse(req.query);
  const where: Prisma.UjianWhereInput = {
    kelasId: student.kelasId,
    ...searchWhere(query.search),
  };
  const [total, exams] = await prisma.$transaction([
    prisma.ujian.count({ where }),
    prisma.ujian.findMany({
      where,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
      orderBy: [{ tanggal: "desc" }, { id: "desc" }],
      select: {
        id: true, judul: true, deskripsi: true, tanggal: true,
        durasiMenit: true, createdAt: true, ...relations,
        _count: { select: { soal: true } },
        nilai: {
          where: { siswaId: student.id },
          orderBy: { createdAt: "asc" },
          take: 1,
          select: { nilai: true, createdAt: true },
        },
      },
    }),
  ]);
  const items = exams.map(({ nilai, _count, ...exam }) => ({
    ...exam,
    questionCount: _count.soal,
    result: nilai[0] ?? null,
  }));
  res.json({
    items,
    serverNow: new Date().toISOString(),
    pagination: pagination(query.page, query.limit, total),
  });
}));

router.get("/ujian/:id", route(async (req, res) => {
  const student = await getStudent(req.user!.id);
  const id = idSchema.parse(req.params.id);
  const exam = await prisma.ujian.findFirst({
    where: { id, kelasId: student.kelasId },
    select: {
      id: true, judul: true, deskripsi: true, tanggal: true,
      durasiMenit: true, ...relations,
      _count: { select: { soal: true } },
      nilai: {
        where: { siswaId: student.id },
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { nilai: true, createdAt: true },
      },
    },
  });
  if (!exam) throw new HttpError(404, "Ujian tidak ditemukan untuk kelas Anda.");
  const now = new Date();
  const start = exam.tanggal.getTime();
  const endsAt = exam.durasiMenit && exam.durasiMenit > 0
    ? new Date(start + exam.durasiMenit * 60000)
    : null;
  const result = exam.nilai[0] ?? null;
  const state = result ? "COMPLETED"
    : !endsAt || exam._count.soal === 0 ? "UNAVAILABLE"
    : now.getTime() < start ? "UPCOMING"
    : now.getTime() >= endsAt.getTime() ? "CLOSED" : "OPEN";

  // Never select answer keys or correctness flags for a student response.
  const questions = state === "OPEN" ? await prisma.soal.findMany({
    where: { ujianId: id },
    orderBy: [{ urutan: "asc" }, { id: "asc" }],
    select: {
      id: true, pertanyaan: true, opsiA: true, opsiB: true,
      opsiC: true, opsiD: true, bobot: true,
    },
  }) : [];
  const { nilai: _nilai, _count, ...publicExam } = exam;
  res.json({
    studentId: student.id,
    exam: { ...publicExam, questionCount: _count.soal },
    questions, result, state,
    endsAt: endsAt?.toISOString() ?? null,
    serverNow: now.toISOString(),
  });
}));

router.post("/ujian/:id/submit", route(async (req, res) => {
  const id = idSchema.parse(req.params.id);
  const input = submitSchema.parse(req.body);
  const siswaId = req.user!.id;
  const ids = input.answers.map((answer) => answer.soalId);
  if (new Set(ids).size !== ids.length) {
    throw new HttpError(400, "Jawaban soal tidak boleh dikirim dua kali.");
  }

  const result = await prisma.$transaction(async (tx) => {
    const student = await tx.user.findUnique({
      where: { id: siswaId }, select: { kelasId: true },
    });
    if (!student?.kelasId) throw new HttpError(400, "Anda belum terdaftar di kelas.");
    const exam = await tx.ujian.findFirst({
      where: { id, kelasId: student.kelasId },
      select: {
        tanggal: true, durasiMenit: true,
        soal: { select: { id: true, jawabanBenar: true, bobot: true } },
      },
    });
    if (!exam) throw new HttpError(404, "Ujian tidak ditemukan untuk kelas Anda.");

    const existing = await tx.nilai.findFirst({
      where: { ujianId: id, siswaId },
      orderBy: { createdAt: "asc" },
      select: { nilai: true, createdAt: true },
    });
    if (existing) return existing;

    if (!exam.durasiMenit || exam.durasiMenit <= 0 || exam.soal.length === 0) {
      throw new HttpError(400, "Ujian belum siap. Hubungi guru.");
    }
    const now = Date.now();
    const startsAt = exam.tanggal.getTime();
    const endsAt = startsAt + exam.durasiMenit * 60000;
    if (now < startsAt) throw new HttpError(403, "Ujian belum dimulai.");
    if (now >= endsAt) throw new HttpError(403, "Waktu ujian telah berakhir.");

    const allowedIds = new Set(exam.soal.map((question) => question.id));
    if (ids.some((questionId) => !allowedIds.has(questionId))) {
      throw new HttpError(400, "Terdapat soal yang bukan bagian dari ujian ini.");
    }
    const answers = new Map(input.answers.map((answer) => [answer.soalId, answer.pilihan]));
    const totalWeight = exam.soal.reduce((sum, question) => sum + question.bobot, 0);
    if (totalWeight <= 0 || exam.soal.some((question) => question.bobot <= 0)) {
      throw new HttpError(400, "Bobot soal ujian tidak valid. Hubungi guru.");
    }
    const earnedWeight = exam.soal.reduce((sum, question) =>
      sum + (answers.get(question.id) === question.jawabanBenar ? question.bobot : 0), 0);

    await tx.jawabanUjian.createMany({
      data: exam.soal.map((question) => ({
        ujianId: id, siswaId, soalId: question.id,
        pilihan: answers.get(question.id) ?? "",
        benar: answers.get(question.id) === question.jawabanBenar,
      })),
    });
    return tx.nilai.create({
      data: { siswaId, ujianId: id, nilai: Math.round(earnedWeight / totalWeight * 10000) / 100 },
      select: { nilai: true, createdAt: true },
    });
  }, {
    isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    maxWait: 5000,
    timeout: 15000,
  });
  res.json({ result, message: "Jawaban berhasil dikumpulkan." });
}));

export default router;
