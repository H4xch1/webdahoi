import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { hashPassword } from "../utils/password";

const router = Router();

router.use(authMiddleware, authorize("ADMIN_UTAMA"));

router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({
    select: { id: true, nama: true, email: true, nis: true, role: true, kelasId: true },
  });
  res.json({ users });
});

router.post("/users", async (req, res) => {
  const { nama, email, nis, password, role, kelasId, jurusanId } = req.body;
  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { nama, email, nis, password: hashed, role, kelasId, jurusanId },
  });
  res.status(201).json({ user });
});

router.delete("/users/:id", async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: "User dihapus" });
});

router.post("/kelas", async (req, res) => {
  const { nama, jurusanId } = req.body;
  const kelas = await prisma.kelas.create({ data: { nama, jurusanId } });
  res.status(201).json({ kelas });
});

router.delete("/tugas/:id", async (req, res) => {
  await prisma.tugas.delete({ where: { id: req.params.id } });
  res.json({ message: "Tugas dihapus" });
});

export default router;
