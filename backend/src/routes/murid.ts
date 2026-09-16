import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authMiddleware, authorize("MURID"));

async function getKelasId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { kelasId: true },
  });
  return user?.kelasId ?? null;
}

router.get("/tugas", async (req: AuthRequest, res) => {
  const kelasId = await getKelasId(req.user!.id);

  if (!kelasId) {
    return res.status(400).json({ message: "Kamu belum terdaftar di kelas manapun" });
  }

  const tugas = await prisma.tugas.findMany({
    where: { kelasId: kelasId },
    orderBy: { deadline: "asc" },
  });

  res.json({ tugas });
});

router.get("/tugas/:id", async (req, res) => {
  const tugas = await prisma.tugas.findUnique({ where: { id: req.params.id } });
  if (!tugas) return res.status(404).json({ message: "Tugas tidak ditemukan" });
  res.json({ tugas });
});

router.post("/tugas/:id/submit", async (req: AuthRequest, res) => {
  const { fileUrl, catatan } = req.body;

  const submission = await prisma.submission.upsert({
    where: {
      tugasId_siswaId: {
        tugasId: req.params.id,
        siswaId: req.user!.id,
      },
    },
    create: {
      tugasId: req.params.id,
      siswaId: req.user!.id,
      fileUrl: fileUrl ?? null,
      catatan: catatan ?? null,
    },
    update: {
      fileUrl: fileUrl ?? null,
      catatan: catatan ?? null,
    },
  });

  res.status(201).json({ submission });
});

router.get("/nilai", async (req: AuthRequest, res) => {
  const nilai = await prisma.nilai.findMany({
    where: { siswaId: req.user!.id },
    orderBy: { createdAt: "desc" },
  });

  res.json({ nilai });
});

export default router;
