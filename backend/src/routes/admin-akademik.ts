import {
  Router,
  type Request,
  type RequestHandler,
} from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";

const router = Router();

router.use(authMiddleware, authorize("ADMIN_UTAMA"));

type Entity = "jurusan" | "tingkat" | "kelas";

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function entityOf(value: unknown): Entity {
  if (
    value === "jurusan" ||
    value === "tingkat" ||
    value === "kelas"
  ) {
    return value;
  }

  throw new HttpError(404, "Jenis data tidak ditemukan.");
}

function requiredText(value: unknown, label: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new HttpError(400, `${label} wajib diisi.`);
  }

  const result = value.trim();

  if (result.length > 120) {
    throw new HttpError(
      400,
      `${label} maksimal 120 karakter.`,
    );
  }

  return result;
}

function bodyOf(value: unknown): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new HttpError(400, "Data permintaan tidak valid.");
  }

  return value as Record<string, unknown>;
}

function endpoint(
  work: (req: Request) => Promise<unknown>,
  status = 200,
): RequestHandler {
  return async (req, res) => {
    try {
      const result = await work(req);
      res.status(status).json(result);
    } catch (error) {
        console.error("[GET /api/admin/akademik]", error);

      if (error instanceof HttpError) {
        res.status(error.status).json({
          message: error.message,
        });
        return;
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case "P2002":
            res.status(409).json({
              message:
                "Nama sudah digunakan. Untuk kelas, gunakan nama lengkap seperti X PPLG 1.",
            });
            return;

          case "P2003":
            res.status(409).json({
              message:
                "Data masih digunakan atau pilihan jurusan/tingkat sudah tidak tersedia.",
            });
            return;

          case "P2025":
            res.status(404).json({
              message: "Data tidak ditemukan. Muat ulang halaman.",
            });
            return;

          case "P2034":
            res.status(409).json({
              message:
                "Data sedang berubah. Muat ulang lalu coba kembali.",
            });
            return;
        }
      }

      console.error("Admin akademik error:", error);

      res.status(500).json({
        message: "Gagal memproses data akademik.",
      });
    }
  };
}

router.get(
  "/",
  endpoint(async () => {
    const [jurusan, tingkat, kelas] = await prisma.$transaction([
      prisma.jurusan.findMany({
        orderBy: { nama: "asc" },
      }),
      prisma.tingkat.findMany({
        orderBy: { nama: "asc" },
      }),
      prisma.kelas.findMany({
        include: {
          jurusan: true,
          tingkat: true,
          _count: {
            select: { siswa: true },
          },
        },
        orderBy: { nama: "asc" },
      }),
    ]);

    return { jurusan, tingkat, kelas };
  }),
);

router.post(
  "/:entity",
  endpoint(async (req) => {
    const entity = entityOf(req.params.entity);
    const body = bodyOf(req.body);
    const nama = requiredText(body.nama, "Nama");

    if (entity === "jurusan") {
      return prisma.jurusan.create({
        data: { nama },
      });
    }

    if (entity === "tingkat") {
      return prisma.tingkat.create({
        data: { nama },
      });
    }

    const jurusanId = requiredText(body.jurusanId, "Jurusan");
    const tingkatId = requiredText(body.tingkatId, "Tingkat");

    return prisma.kelas.create({
      data: { nama, jurusanId, tingkatId },
    });
  }, 201),
);

router.put(
  "/:entity/:id",
  endpoint(async (req) => {
    const entity = entityOf(req.params.entity);
    const id = requiredText(req.params.id, "ID");
    const body = bodyOf(req.body);
    const nama = requiredText(body.nama, "Nama");

    if (entity === "jurusan") {
      return prisma.jurusan.update({
        where: { id },
        data: { nama },
      });
    }

    if (entity === "tingkat") {
      return prisma.tingkat.update({
        where: { id },
        data: { nama },
      });
    }

    const jurusanId = requiredText(body.jurusanId, "Jurusan");
    const tingkatId = requiredText(body.tingkatId, "Tingkat");

    return prisma.kelas.update({
      where: { id },
      data: { nama, jurusanId, tingkatId },
    });
  }),
);

router.delete(
  "/:entity/:id",
  endpoint(async (req) => {
    const entity = entityOf(req.params.entity);
    const id = requiredText(req.params.id, "ID");

    await prisma.$transaction(
      async (tx) => {
        if (entity === "jurusan") {
          const count = await tx.kelas.count({
            where: { jurusanId: id },
          });

          if (count > 0) {
            throw new HttpError(
              409,
              "Jurusan masih digunakan oleh kelas. Ubah atau hapus kelas terkait terlebih dahulu.",
            );
          }

          await tx.jurusan.delete({ where: { id } });
          return;
        }

        if (entity === "tingkat") {
          const count = await tx.kelas.count({
            where: { tingkatId: id },
          });

          if (count > 0) {
            throw new HttpError(
              409,
              "Tingkat masih digunakan oleh kelas. Ubah tingkat kelas terkait terlebih dahulu.",
            );
          }

          await tx.tingkat.delete({ where: { id } });
          return;
        }

        const kelas = await tx.kelas.findUnique({
          where: { id },
          select: {
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

        const isUsed = Object.values(kelas._count).some(
          (count) => count > 0,
        );

        if (isUsed) {
          throw new HttpError(
            409,
            "Kelas masih memiliki siswa, mapel, materi, tugas, ujian, atau absensi. Kelas tidak dihapus untuk menjaga data.",
          );
        }

        await tx.kelas.delete({ where: { id } });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    return { message: "Data berhasil dihapus." };
  }),
);

export default router;
