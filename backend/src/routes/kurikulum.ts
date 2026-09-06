import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authMiddleware, authorize("KURIKULUM"));

router.get("/guru", async (req, res) => {
  const guru = await prisma.user.findMany({ where: { role: "GURU" } });
  res.json({ guru });
});

router.get("/materi", async (req, res) => {
  const materi = await prisma.materi.findMany();
  res.json({ materi });
});

router.get("/tugas", async (req, res) => {
  const tugas = await prisma.tugas.findMany();
  res.json({ tugas });
});

router.get("/penilaian", async (req, res) => {
  const nilai = await prisma.nilai.findMany();
  res.json({ nilai });
});

export default router;
