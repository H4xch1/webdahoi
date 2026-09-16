import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authMiddleware, authorize("GURU"));

router.post("/materi", async (req: AuthRequest, res) => {
  const { judul, deskripsi, fileUrl, mapelId, kelasId } = req.body;

  if (!judul || !mapelId || !kelasId) {
    return res.status(400).json({ message: "Judul, mapel, dan kelas wajib diisi" });
  }

  const materi = await prisma.materi.create({
    data: {
      judul: judul,
      deskripsi: deskripsi ?? null,
      fileUrl: fileUrl ?? null,
      mapelId: mapelId,
      kelasId: kelasId,
      createdById: req.user!.id,
    },
  });

  res.status(201).json({ materi });
});

router.post("/tugas", async (req: AuthRequest, res) => {
  const { judul, deskripsi, deadline, mapelId, kelasId } = req.body;

  if (!judul || !deadline || !mapelId || !kelasId) {
    return res.status(400).json({ message: "Judul, deadline, mapel, dan kelas wajib diisi" });
  }

  const tugas = await prisma.tugas.create({
    data: {
      judul: judul,
      deskripsi: deskripsi ?? null,
      deadline: new Date(deadline),
      mapelId: mapelId,
      kelasId: kelasId,
      createdById: req.user!.id,
    },
  });

  res.status(201).json({ tugas });
});

router.post("/ujian", async (req: AuthRequest, res) => {
  const { judul, deskripsi, tanggal, durasiMenit, mapelId, kelasId, soal } = req.body;

  if (!judul || !tanggal || !mapelId || !kelasId) {
    return res.status(400).json({ message: "Judul, tanggal, mapel, dan kelas wajib diisi" });
  }

  const ujian = await prisma.ujian.create({
    data: {
      judul: judul,
      deskripsi: deskripsi ?? null,
      tanggal: new Date(tanggal),
      durasiMenit: durasiMenit ?? null,
      mapelId: mapelId,
      kelasId: kelasId,
      createdById: req.user!.id,
      soal: Array.isArray(soal)
        ? {
            create: soal.map((s: any, i: number) => ({
              pertanyaan: s.pertanyaan,
              opsiA: s.opsiA,
              opsiB: s.opsiB,
              opsiC: s.opsiC,
              opsiD: s.opsiD,
              jawabanBenar: s.jawabanBenar,
              bobot: s.bobot ?? 1,
              urutan: s.urutan ?? i,
            })),
          }
        : undefined,
    },
    include: { soal: true },
  });

  res.status(201).json({ ujian });
});

router.post("/nilai/:submissionId", async (req: AuthRequest, res) => {
  const { nilai, feedback } = req.body;

  if (typeof nilai !== "number") {
    return res.status(400).json({ message: "Nilai wajib berupa angka" });
  }

  const updated = await prisma.submission.update({
    where: { id: req.params.submissionId },
    data: {
      nilai: nilai,
      feedback: feedback ?? null,
      gradedAt: new Date(),
    },
  });

  res.json({ updated });
});

export default router;
