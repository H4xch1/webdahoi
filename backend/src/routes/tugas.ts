import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/:id", async (req, res) => {
  const tugas = await prisma.tugas.findUnique({ where: { id: req.params.id } });
  if (!tugas) return res.status(404).json({ message: "Tidak ditemukan" });
  res.json({ tugas });
});

export default router;
