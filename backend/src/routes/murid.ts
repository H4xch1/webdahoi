import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authMiddleware, authorize("MURID"));

router.get("/tugas", async (req: AuthRequest, res) => {
  const tugas = await prisma.tugas.findMany({
    where: { kelasId: req.user!.id },
  });
  res.json({ tugas });
});

router.get("/tugas/:id", async (req, res) => {
  const tugas = await prisma.tugas.findUnique({ where: { id: req.params.id } });
  if (!tugas) return res.status(404).json({ message: "Tugas tidak ditemukan" });
  res.json({ tugas });
});

router.post("/tugas/:id/submit", async (req: AuthRequest, res) => {
  const { fileUrl } = req.body;
  const submission = await prisma.nilai.create({
    data: {
      tugasId: req.params.id,
      userId: req.user!.id,
      fileUrl,
    },
  });
  res.status(201).json({ submission });
});

router.get("/nilai", async (req: AuthRequest, res) => {
  const nilai = await prisma.nilai.findMany({ where: { userId: req.user!.id } });
  res.json({ nilai });
});

export default router;
