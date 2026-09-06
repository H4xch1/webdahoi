import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authMiddleware, authorize("GURU"));

router.post("/materi", async (req: AuthRequest, res) => {
  const { judul, konten, mapelId } = req.body;
  const materi = await prisma.materi.create({
    data: { judul, konten, mapelId, guruId: req.user!.id },
  });
  res.status(201).json({ materi });
});

router.post("/tugas", async (req: AuthRequest, res) => {
  const { judul, deskripsi, deadline, mapelId, kelasId } = req.body;
  const tugas = await prisma.tugas.create({
    data: { judul, deskripsi, deadline, mapelId, kelasId, guruId: req.user!.id },
  });
  res.status(201).json({ tugas });
});

router.post("/ujian", async (req: AuthRequest, res) => {
  const { judul, mapelId, kelasId, soal } = req.body;
  const ujian = await prisma.ujian.create({
    data: { judul, mapelId, kelasId, guruId: req.user!.id, soal },
  });
  res.status(201).json({ ujian });
});

router.post("/nilai/:submissionId", async (req, res) => {
  const { nilai } = req.body;
  const updated = await prisma.nilai.update({
    where: { id: req.params.submissionId },
    data: { nilai },
  });
  res.json({ updated });
});

export default router;
