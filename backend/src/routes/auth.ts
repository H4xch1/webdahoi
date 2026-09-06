import { Router } from "express";
import { prisma } from "../lib/prisma";
import { comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { validate } from "../middleware/validate";
import { loginSchema } from "../schemas/auth.schema";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();

router.post("/login", validate(loginSchema), async (req, res) => {
  const { identifier, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: identifier }, { nis: identifier }],
    },
  });

  if (!user) {
    return res.status(401).json({ message: "Akun tidak ditemukan" });
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Password salah" });
  }

  const token = signToken({ id: user.id, role: user.role, nama: user.nama });

  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    message: "Login berhasil",
    token,
    user: { id: user.id, nama: user.nama, role: user.role },
  });
});

router.get("/me", authMiddleware, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

router.post("/logout", (req, res) => {
  res.clearCookie("token");
  res.json({ message: "Logout berhasil" });
});

export default router;
