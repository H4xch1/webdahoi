import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middleware/auth";
import { authorize } from "../middleware/authorize";
import { hashPassword } from "../utils/password";

const router = Router();

router.use(authMiddleware, authorize("ADMIN_UTAMA"));

const userSelect = {
  id: true,
  name: true,
  email: true,
  nik: true,
  nis: true,
  nip: true,
  role: true,
  kelasId: true,
} as const;

router.get("/users", async (req, res) => {
  const users = await prisma.user.findMany({ select: userSelect });
  res.json({ users });
});

router.post("/users", async (req, res) => {
  const { name, email, nik, nis, nip, password, role, kelasId } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: "Nama, email, dan role wajib diisi" });
  }

  const hashed = password ? await hashPassword(password) : null;

  const user = await prisma.user.create({
    data: {
      name: name,
      email: email,
      nik: nik ?? null,
      nis: nis ?? null,
      nip: nip ?? null,
      password: hashed,
      role: role,
      kelasId: kelasId ?? null,
    },
    select: userSelect,
  });

  res.status(201).json({ user });
});

router.delete("/users/:id", async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: "User dihapus" });
});

router.post("/kelas", async (req, res) => {
  const { nama, jurusanId } = req.body;

  if (!nama || !jurusanId) {
    return res.status(400).json({ message: "Nama kelas dan jurusan wajib diisi" });
  }

  const kelas = await prisma.kelas.create({ data: { nama: nama, jurusanId: jurusanId } });
  res.status(201).json({ kelas });
});

router.delete("/tugas/:id", async (req, res) => {
  await prisma.tugas.delete({ where: { id: req.params.id } });
  res.json({ message: "Tugas dihapus" });
});

export default router;
