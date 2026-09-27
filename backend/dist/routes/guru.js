import { Router } from "express";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
const router = Router();
router.use(authMiddleware, authorize("GURU"));
class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
    }
}
function route(handler) {
    return (req, res, _next) => {
        void handler(req, res).catch((error) => {
            if (error instanceof z.ZodError) {
                res.status(400).json({
                    message: error.issues[0]?.message ?? "Data tidak valid.",
                });
                return;
            }
            if (error instanceof HttpError) {
                res.status(error.status).json({ message: error.message });
                return;
            }
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
                if (error.code === "P2025") {
                    res.status(404).json({ message: "Data tidak ditemukan." });
                    return;
                }
                if (error.code === "P2002" || error.code === "P2034") {
                    res.status(409).json({
                        message: "Data berubah saat disimpan. Muat ulang dan coba lagi.",
                    });
                    return;
                }
                if (error.code === "P2003") {
                    res.status(409).json({
                        message: "Data terkait telah berubah. Muat ulang halaman.",
                    });
                    return;
                }
            }
            console.error("[guru]", error);
            res.status(500).json({
                message: "Terjadi kesalahan pada server.",
            });
        });
    };
}
const idSchema = z.string().uuid("ID tidak valid.");
const optionalText = (max) => z.string().trim().max(max).optional().default("");
const dateTimeSchema = z
    .string()
    .datetime({ offset: true, message: "Tanggal dan waktu tidak valid." });
const dateOnlySchema = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus YYYY-MM-DD.")
    .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (!Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value);
}, "Tanggal tidak valid.");
const statusSchema = z.enum(["HADIR", "IZIN", "SAKIT", "ALPA"]);
const resourceUrlSchema = z
    .string()
    .trim()
    .max(2048)
    .refine((value) => {
    if (!value)
        return true;
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    }
    catch {
        return false;
    }
}, "Tautan harus menggunakan http:// atau https://.")
    .optional()
    .default("");
const baseLearningSchema = z.object({
    judul: z.string().trim().min(1, "Judul wajib diisi.").max(200),
    deskripsi: optionalText(20000),
    kelasId: idSchema,
    mapelId: idSchema,
});
const materiSchema = baseLearningSchema.extend({
    fileUrl: resourceUrlSchema,
});
const tugasSchema = baseLearningSchema.extend({
    deadline: dateTimeSchema,
});
const soalSchema = z.object({
    pertanyaan: z.string().trim().min(1, "Pertanyaan wajib diisi.").max(10000),
    opsiA: z.string().trim().min(1, "Opsi A wajib diisi.").max(2000),
    opsiB: z.string().trim().min(1, "Opsi B wajib diisi.").max(2000),
    opsiC: z.string().trim().min(1, "Opsi C wajib diisi.").max(2000),
    opsiD: z.string().trim().min(1, "Opsi D wajib diisi.").max(2000),
    jawabanBenar: z.enum(["A", "B", "C", "D"]),
    bobot: z.number().int().min(1).max(100),
});
const ujianSchema = baseLearningSchema.extend({
    tanggal: dateTimeSchema,
    durasiMenit: z.number().int().min(1).max(600),
    soal: z.array(soalSchema).min(1, "Tambahkan minimal satu soal.").max(100),
});
const attendanceQuerySchema = z.object({
    kelasId: idSchema,
    mapelId: idSchema,
    tanggal: dateOnlySchema,
});
const attendanceSaveSchema = attendanceQuerySchema.extend({
    entries: z
        .array(z.object({
        siswaId: idSchema,
        status: statusSchema,
        keterangan: optionalText(500),
    }))
        .min(1, "Tidak ada murid untuk disimpan.")
        .max(500),
});
const gradeSchema = z.object({
    nilai: z.number().min(0).max(100),
    feedback: optionalText(5000),
    // Prevent grading an older submission version.
    updatedAt: dateTimeSchema,
});
async function assertTeachingAccess(db, guruId, kelasId, mapelId) {
    const [kelas, assignment] = await Promise.all([
        db.kelas.findFirst({
            where: {
                id: kelasId,
                guru: { some: { id: guruId } },
                mapel: { some: { id: mapelId } },
            },
            select: { id: true },
        }),
        db.guruMapel.findFirst({
            where: { guruId, mapelId },
            select: { id: true },
        }),
    ]);
    if (!kelas || !assignment) {
        throw new HttpError(403, "Anda tidak ditugaskan pada kelas dan mata pelajaran ini.");
    }
}
async function serializable(operation) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await prisma.$transaction(operation, {
                isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
            });
        }
        catch (error) {
            const retryable = error instanceof Prisma.PrismaClientKnownRequestError &&
                (error.code === "P2034" || error.code === "P2002");
            if (!retryable || attempt === 2)
                throw error;
        }
    }
    throw new HttpError(409, "Silakan coba simpan kembali.");
}
// ---------------------------------------------
// Class and subject options
// ---------------------------------------------
router.get("/options", route(async (req, res) => {
    const guruId = req.user.id;
    const teacher = await prisma.user.findUnique({
        where: { id: guruId },
        select: {
            id: true,
            name: true,
            kelasDiajar: {
                orderBy: { nama: "asc" },
                select: {
                    id: true,
                    nama: true,
                    jurusan: { select: { nama: true } },
                    mapel: {
                        where: {
                            guruMapel: { some: { guruId } },
                        },
                        orderBy: { nama: "asc" },
                        select: { id: true, nama: true },
                    },
                },
            },
        },
    });
    if (!teacher) {
        throw new HttpError(404, "Akun guru tidak ditemukan.");
    }
    res.json({
        teacher: { id: teacher.id, name: teacher.name },
        kelas: teacher.kelasDiajar,
    });
}));
// ---------------------------------------------
// Dashboard
// ---------------------------------------------
router.get("/overview", route(async (req, res) => {
    const guruId = req.user.id;
    const scope = {
        createdById: guruId,
        kelas: { guru: { some: { id: guruId } } },
        mapel: { guruMapel: { some: { guruId } } },
    };
    const [kelasCount, materiCount, tugasCount, ujianCount, belumDinilai, materi, tugas, ujian,] = await Promise.all([
        prisma.kelas.count({
            where: { guru: { some: { id: guruId } } },
        }),
        prisma.materi.count({ where: scope }),
        prisma.tugas.count({ where: scope }),
        prisma.ujian.count({ where: scope }),
        prisma.submission.count({
            where: {
                nilai: null,
                tugas: scope,
            },
        }),
        prisma.materi.findMany({
            where: scope,
            take: 20,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                judul: true,
                deskripsi: true,
                fileUrl: true,
                createdAt: true,
                kelas: { select: { nama: true } },
                mapel: { select: { nama: true } },
            },
        }),
        prisma.tugas.findMany({
            where: scope,
            take: 20,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                judul: true,
                deskripsi: true,
                deadline: true,
                kelas: { select: { nama: true } },
                mapel: { select: { nama: true } },
                _count: { select: { submissions: true } },
            },
        }),
        prisma.ujian.findMany({
            where: scope,
            take: 20,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                judul: true,
                deskripsi: true,
                tanggal: true,
                durasiMenit: true,
                kelas: { select: { nama: true } },
                mapel: { select: { nama: true } },
                _count: { select: { soal: true } },
            },
        }),
    ]);
    res.json({
        counts: {
            kelas: kelasCount,
            materi: materiCount,
            tugas: tugasCount,
            ujian: ujianCount,
            belumDinilai,
        },
        materi,
        tugas,
        ujian,
    });
}));
// ---------------------------------------------
// Create material / assignment / exam
// ---------------------------------------------
router.post("/materi", route(async (req, res) => {
    const input = materiSchema.parse(req.body);
    const guruId = req.user.id;
    const materi = await prisma.$transaction(async (tx) => {
        await assertTeachingAccess(tx, guruId, input.kelasId, input.mapelId);
        return tx.materi.create({
            data: {
                ...input,
                deskripsi: input.deskripsi || null,
                fileUrl: input.fileUrl || null,
                createdById: guruId,
            },
        });
    });
    res.status(201).json({ materi });
}));
router.post("/tugas", route(async (req, res) => {
    const input = tugasSchema.parse(req.body);
    const guruId = req.user.id;
    if (new Date(input.deadline).getTime() <= Date.now()) {
        throw new HttpError(400, "Tenggat harus berada di masa depan.");
    }
    const tugas = await prisma.$transaction(async (tx) => {
        await assertTeachingAccess(tx, guruId, input.kelasId, input.mapelId);
        return tx.tugas.create({
            data: {
                ...input,
                deadline: new Date(input.deadline),
                deskripsi: input.deskripsi || null,
                createdById: guruId,
            },
        });
    });
    res.status(201).json({ tugas });
}));
router.post("/ujian", route(async (req, res) => {
    const input = ujianSchema.parse(req.body);
    const guruId = req.user.id;
    if (new Date(input.tanggal).getTime() <= Date.now()) {
        throw new HttpError(400, "Jadwal ujian harus berada di masa depan.");
    }
    const ujian = await prisma.$transaction(async (tx) => {
        await assertTeachingAccess(tx, guruId, input.kelasId, input.mapelId);
        return tx.ujian.create({
            data: {
                judul: input.judul,
                deskripsi: input.deskripsi || null,
                kelasId: input.kelasId,
                mapelId: input.mapelId,
                tanggal: new Date(input.tanggal),
                durasiMenit: input.durasiMenit,
                createdById: guruId,
                soal: {
                    create: input.soal.map((soal, index) => ({
                        ...soal,
                        urutan: index,
                    })),
                },
            },
            select: { id: true, judul: true },
        });
    });
    res.status(201).json({ ujian });
}));
// ---------------------------------------------
// Attendance
// ---------------------------------------------
router.get("/absen", route(async (req, res) => {
    const input = attendanceQuerySchema.parse(req.query);
    await assertTeachingAccess(prisma, req.user.id, input.kelasId, input.mapelId);
    const tanggal = new Date(`${input.tanggal}T00:00:00.000Z`);
    const [siswa, records] = await Promise.all([
        prisma.user.findMany({
            where: { role: "MURID", kelasId: input.kelasId },
            orderBy: { name: "asc" },
            select: { id: true, name: true, nis: true },
        }),
        prisma.absensi.findMany({
            where: {
                kelasId: input.kelasId,
                mapelId: input.mapelId,
                tanggal,
            },
            select: {
                siswaId: true,
                status: true,
                keterangan: true,
            },
        }),
    ]);
    const byStudent = new Map(records.map((record) => [record.siswaId, record]));
    res.json({
        siswa: siswa.map((student) => {
            const record = byStudent.get(student.id);
            return {
                ...student,
                status: record?.status ?? null,
                keterangan: record?.keterangan ?? "",
            };
        }),
    });
}));
router.post("/absen", route(async (req, res) => {
    const input = attendanceSaveSchema.parse(req.body);
    const guruId = req.user.id;
    const tanggal = new Date(`${input.tanggal}T00:00:00.000Z`);
    const ids = input.entries.map((entry) => entry.siswaId);
    if (new Set(ids).size !== ids.length) {
        throw new HttpError(400, "Murid tidak boleh dikirim dua kali.");
    }
    await serializable(async (tx) => {
        await assertTeachingAccess(tx, guruId, input.kelasId, input.mapelId);
        const students = await tx.user.findMany({
            where: { role: "MURID", kelasId: input.kelasId },
            select: { id: true },
        });
        const allowedIds = new Set(students.map((student) => student.id));
        if (students.length !== ids.length ||
            ids.some((id) => !allowedIds.has(id))) {
            throw new HttpError(409, "Daftar murid berubah. Muat ulang daftar sebelum menyimpan.");
        }
        for (const entry of input.entries) {
            await tx.absensi.upsert({
                where: {
                    siswaId_tanggal_mapelId: {
                        siswaId: entry.siswaId,
                        tanggal,
                        mapelId: input.mapelId,
                    },
                },
                create: {
                    siswaId: entry.siswaId,
                    tanggal,
                    mapelId: input.mapelId,
                    kelasId: input.kelasId,
                    status: entry.status,
                    keterangan: entry.keterangan || null,
                    dicatatById: guruId,
                },
                update: {
                    kelasId: input.kelasId,
                    status: entry.status,
                    keterangan: entry.keterangan || null,
                    dicatatById: guruId,
                },
            });
        }
    });
    res.json({ message: "Absensi berhasil disimpan." });
}));
// ---------------------------------------------
// Assignment submissions and grading
// ---------------------------------------------
router.get("/tugas/:id/submissions", route(async (req, res) => {
    const id = idSchema.parse(req.params.id);
    const guruId = req.user.id;
    const tugas = await prisma.tugas.findFirst({
        where: { id, createdById: guruId },
        select: {
            id: true,
            judul: true,
            deskripsi: true,
            deadline: true,
            kelasId: true,
            mapelId: true,
            kelas: { select: { nama: true } },
            mapel: { select: { nama: true } },
        },
    });
    if (!tugas) {
        throw new HttpError(404, "Tugas tidak ditemukan.");
    }
    await assertTeachingAccess(prisma, guruId, tugas.kelasId, tugas.mapelId);
    const submissions = await prisma.submission.findMany({
        where: { tugasId: id },
        orderBy: { createdAt: "asc" },
        select: {
            id: true,
            fileUrl: true,
            catatan: true,
            nilai: true,
            feedback: true,
            gradedAt: true,
            createdAt: true,
            updatedAt: true,
            siswa: {
                select: { id: true, name: true, nis: true },
            },
        },
    });
    res.json({ tugas, submissions });
}));
router.post("/nilai/:submissionId", route(async (req, res) => {
    const submissionId = idSchema.parse(req.params.submissionId);
    const input = gradeSchema.parse(req.body);
    const guruId = req.user.id;
    const updated = await prisma.$transaction(async (tx) => {
        const submission = await tx.submission.findUnique({
            where: { id: submissionId },
            select: {
                id: true,
                tugas: {
                    select: {
                        createdById: true,
                        kelasId: true,
                        mapelId: true,
                    },
                },
            },
        });
        if (!submission || submission.tugas.createdById !== guruId) {
            throw new HttpError(404, "Pengumpulan tidak ditemukan.");
        }
        await assertTeachingAccess(tx, guruId, submission.tugas.kelasId, submission.tugas.mapelId);
        const result = await tx.submission.updateMany({
            where: {
                id: submissionId,
                updatedAt: new Date(input.updatedAt),
            },
            data: {
                nilai: input.nilai,
                feedback: input.feedback || null,
                gradedAt: new Date(),
            },
        });
        if (result.count !== 1) {
            throw new HttpError(409, "Pengumpulan atau nilai telah berubah. Muat ulang sebelum menilai.");
        }
        return tx.submission.findUniqueOrThrow({
            where: { id: submissionId },
            select: {
                id: true,
                nilai: true,
                feedback: true,
                gradedAt: true,
                updatedAt: true,
            },
        });
    });
    res.json({ updated });
}));
export default router;
