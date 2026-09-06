import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/:id", async (req, res) => {
  const ujian = await prisma.ujian.findUnique({ where: { id: req.params.id } });
  if (!ujian) return res.status(404).json({ message: "Tidak ditemukan" });
  res.json({ ujian });
});

export default router;
