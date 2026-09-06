import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { authorize } from "../middleware/authorize";

const router = Router();

router.use(authMiddleware, authorize("KEPSEK"));

router.get("/summary", async (req, res) => {
  const totalMurid = await prisma.user.count({ where: { role: "MURID" } });
  const totalGuru = await prisma.user.count({ where: { role: "GURU" } });
  res.json({ totalMurid, totalGuru });
});

router.get("/nilai/min-max", async (req, res) => {
  const nilai = await prisma.nilai.findMany({
    orderBy: { nilai: "desc" },
  });
  res.json({
    max: nilai[0] || null,
    min: nilai[nilai.length - 1] || null,
  });
});

router.get("/guru", async (req, res) => {
  const guru = await prisma.user.findMany({ where: { role: "GURU" } });
  res.json({ guru });
});

export default router;
