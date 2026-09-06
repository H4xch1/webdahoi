import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use(authMiddleware);

router.get("/", async (req, res) => {
  const materi = await prisma.materi.findMany();
  res.json({ materi });
});

export default router;
