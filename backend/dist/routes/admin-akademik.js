import { Router, } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
const router = Router();
router.use(authMiddleware, authorize("ADMIN_UTAMA"));
class HttpError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = "HttpError";
    }
}
function entityOf(value) {
    if (value === "jurusan" ||
        value === "tingkat" ||
        value === "kelas" ||
        value === "mapel") {
        return value;
    }
    throw new HttpError(404, "Jenis data tidak ditemukan.");
}
function requiredText(value, label) {
    if (typeof value !== "string" ||
        value.trim().length === 0) {
        throw new HttpError(400, `${label} wajib diisi.`);
    }
    const result = value.trim();
    if (result.length > 120) {
        throw new HttpError(400, `${label} maksimal 120 karakter.`);
    }
    return result;
}
function bodyOf(value) {
    if (typeof value !== "object" ||
        value === null ||
        Array.isArray(value)) {
        throw new HttpError(400, "Data permintaan tidak valid.");
    }
    return value;
}
function endpoint(work, status = 200) {
    return async (req, res) => {
        try {
            const result = await work(req);
            res.status(status).json(result);
        }
        catch (error) {
            if (error instanceof HttpError) {
                res.status(error.status).json({
                    message: error.message,
                });
                return;
            }
            console.error(`[Admin Akademik] ${req.method} ${req.originalUrl}`, error);
            if (error instanceof
                Prisma.PrismaClientKnownRequestError) {
                switch (error.code) {
                    case "P2002": {
                        const entity = req.params.entity;
                        const message = entity === "jurusan"
                            ? "Nama jurusan sudah digunakan."
                            : entity === "tingkat"
                                ? "Nama tingkat sudah digunakan."
                                : entity === "kelas"
                                    ? "Kombinasi nama kelas dan jurusan sudah digunakan."
                                    : "Data sudah digunakan.";
                        res.status(409).json({
                            message,
                            code: error.code,
                        });
                        return;
                    }
                    case "P2003":
                        res.status(409).json({
                            message: "Data masih digunakan atau relasi yang dipilih tidak valid.",
                            code: error.code,
                        });
                        return;
                    case "P2025":
                        res.status(404).json({
                            message: "Data tidak ditemukan. Muat ulang halaman.",
                            code: error.code,
                        });
                        return;
                    case "P2034":
                        res.status(409).json({
                            message: "Data sedang berubah. Muat ulang lalu coba kembali.",
                            code: error.code,
                        });
                        return;
                    default:
                        res.status(500).json({
                            message: "Gagal memproses data akademik.",
                            code: error.code,
                        });
                        return;
                }
            }
            res.status(500).json({
                message: "Gagal memproses data akademik.",
                code: "INTERNAL_ERROR",
            });
        }
    };
}
/*
|--------------------------------------------------------------------------
| GET ALL ACADEMIC DATA
|--------------------------------------------------------------------------
|
| GET /api/admin/akademik
|
*/
router.get("/", endpoint(async () => {
    const [jurusan, tingkat, kelas, mapel,] = await prisma.$transaction([
        prisma.jurusan.findMany({
            orderBy: {
                nama: "asc",
            },
        }),
        prisma.tingkat.findMany({
            orderBy: {
                nama: "asc",
            },
        }),
        prisma.kelas.findMany({
            include: {
                jurusan: true,
                tingkat: true,
                _count: {
                    select: {
                        siswa: true,
                        mapel: true,
                        materi: true,
                        tugas: true,
                        ujian: true,
                        absensi: true,
                    },
                },
            },
            orderBy: {
                nama: "asc",
            },
        }),
        prisma.mapel.findMany({
            select: {
                id: true,
                nama: true,
                _count: {
                    select: {
                        kelas: true,
                        guruMapel: true,
                        tugas: true,
                        ujian: true,
                        materi: true,
                        absensi: true,
                    },
                },
            },
            orderBy: {
                nama: "asc",
            },
        }),
    ]);
    return {
        jurusan,
        tingkat,
        kelas,
        mapel,
    };
}));
/*
|--------------------------------------------------------------------------
| GET MAPEL
|--------------------------------------------------------------------------
|
| GET /api/admin/akademik/mapel
|
*/
router.get("/mapel", endpoint(async () => {
    return prisma.mapel.findMany({
        select: {
            id: true,
            nama: true,
            _count: {
                select: {
                    kelas: true,
                    guruMapel: true,
                    tugas: true,
                    ujian: true,
                    materi: true,
                    absensi: true,
                },
            },
        },
        orderBy: {
            nama: "asc",
        },
    });
}));
/*
|--------------------------------------------------------------------------
| CREATE
|--------------------------------------------------------------------------
*/
router.post("/:entity", endpoint(async (req) => {
    const entity = entityOf(req.params.entity);
    const body = bodyOf(req.body);
    const nama = requiredText(body.nama, entity === "mapel"
        ? "Nama mata pelajaran"
        : "Nama");
    if (entity === "jurusan") {
        return prisma.jurusan.create({
            data: {
                nama,
            },
        });
    }
    if (entity === "tingkat") {
        return prisma.tingkat.create({
            data: {
                nama,
            },
        });
    }
    if (entity === "mapel") {
        return prisma.mapel.create({
            data: {
                nama,
            },
            select: {
                id: true,
                nama: true,
            },
        });
    }
    const jurusanId = requiredText(body.jurusanId, "Jurusan");
    const tingkatId = requiredText(body.tingkatId, "Tingkat");
    return prisma.kelas.create({
        data: {
            nama,
            jurusanId,
            tingkatId,
        },
        include: {
            jurusan: true,
            tingkat: true,
        },
    });
}, 201));
/*
|--------------------------------------------------------------------------
| UPDATE
|--------------------------------------------------------------------------
*/
router.put("/:entity/:id", endpoint(async (req) => {
    const entity = entityOf(req.params.entity);
    const id = requiredText(req.params.id, "ID");
    const body = bodyOf(req.body);
    const nama = requiredText(body.nama, entity === "mapel"
        ? "Nama mata pelajaran"
        : "Nama");
    if (entity === "jurusan") {
        return prisma.jurusan.update({
            where: {
                id,
            },
            data: {
                nama,
            },
        });
    }
    if (entity === "tingkat") {
        return prisma.tingkat.update({
            where: {
                id,
            },
            data: {
                nama,
            },
        });
    }
    if (entity === "mapel") {
        return prisma.mapel.update({
            where: {
                id,
            },
            data: {
                nama,
            },
            select: {
                id: true,
                nama: true,
            },
        });
    }
    const jurusanId = requiredText(body.jurusanId, "Jurusan");
    const tingkatId = requiredText(body.tingkatId, "Tingkat");
    return prisma.kelas.update({
        where: {
            id,
        },
        data: {
            nama,
            jurusanId,
            tingkatId,
        },
        include: {
            jurusan: true,
            tingkat: true,
        },
    });
}));
/*
|--------------------------------------------------------------------------
| DELETE
|--------------------------------------------------------------------------
*/
router.delete("/:entity/:id", endpoint(async (req) => {
    const entity = entityOf(req.params.entity);
    const id = requiredText(req.params.id, "ID");
    await prisma.$transaction(async (tx) => {
        if (entity === "jurusan") {
            const count = await tx.kelas.count({
                where: {
                    jurusanId: id,
                },
            });
            if (count > 0) {
                throw new HttpError(409, "Jurusan masih digunakan oleh kelas. Ubah atau hapus kelas terkait terlebih dahulu.");
            }
            await tx.jurusan.delete({
                where: {
                    id,
                },
            });
            return;
        }
        if (entity === "tingkat") {
            const count = await tx.kelas.count({
                where: {
                    tingkatId: id,
                },
            });
            if (count > 0) {
                throw new HttpError(409, "Tingkat masih digunakan oleh kelas. Ubah tingkat kelas terkait terlebih dahulu.");
            }
            await tx.tingkat.delete({
                where: {
                    id,
                },
            });
            return;
        }
        if (entity === "mapel") {
            const mapel = await tx.mapel.findUnique({
                where: {
                    id,
                },
                select: {
                    id: true,
                    _count: {
                        select: {
                            kelas: true,
                            guruMapel: true,
                            tugas: true,
                            ujian: true,
                            materi: true,
                            absensi: true,
                        },
                    },
                },
            });
            if (!mapel) {
                throw new HttpError(404, "Mata pelajaran tidak ditemukan.");
            }
            const isUsed = Object.values(mapel._count).some((count) => count > 0);
            if (isUsed) {
                throw new HttpError(409, "Mata pelajaran masih digunakan oleh kelas, guru, materi, tugas, ujian, atau absensi.");
            }
            await tx.mapel.delete({
                where: {
                    id,
                },
            });
            return;
        }
        const kelas = await tx.kelas.findUnique({
            where: {
                id,
            },
            select: {
                id: true,
                _count: {
                    select: {
                        siswa: true,
                        mapel: true,
                        materi: true,
                        tugas: true,
                        ujian: true,
                        absensi: true,
                    },
                },
            },
        });
        if (!kelas) {
            throw new HttpError(404, "Kelas tidak ditemukan.");
        }
        const isUsed = Object.values(kelas._count).some((count) => count > 0);
        if (isUsed) {
            throw new HttpError(409, "Kelas masih memiliki siswa, mapel, materi, tugas, ujian, atau absensi. Kelas tidak dihapus untuk menjaga data.");
        }
        await tx.kelas.delete({
            where: {
                id,
            },
        });
    }, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    });
    return {
        message: "Data berhasil dihapus.",
    };
}));
export default router;
