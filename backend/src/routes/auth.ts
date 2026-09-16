import { Router } from "express";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/prisma";
import { comparePassword } from "../utils/password";
import { signToken } from "../utils/jwt";
import { validate } from "../middleware/validate";
import { loginSchema, googleLoginSchema } from "../schemas/auth.schema";
import { authMiddleware, AuthRequest } from "../middleware/auth";

const router = Router();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

router.post("/login", validate(loginSchema), async (req, res) => {
  const { identifier, password } = req.body;

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { nik: identifier },
        { nis: identifier },
        { nip: identifier },
      ],
    },
  });

  if (!user) {
    return res.status(401).json({ message: "Akun tidak ditemukan" });
  }

  if (!user.password) {
    return res.status(401).json({
      message: "Akun ini terdaftar via Google. Silakan login dengan Google.",
      code: "GOOGLE_ONLY",
    });
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: "Password salah" });
  }

  const token = signToken({ id: user.id, role: user.role, name: user.name });
  res.cookie("token", token, COOKIE_OPTIONS);

  return res.json({
    message: "Login berhasil",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      nik: user.nik,
      nis: user.nis,
      nip: user.nip,
      role: user.role,
      kelasId: user.kelasId,
      avatarUrl: user.avatarUrl,
    },
  });
});

router.post("/google", validate(googleLoginSchema), async (req, res) => {
  const { idToken } = req.body;

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    payload = ticket.getPayload();
  } catch {
    return res.status(401).json({ message: "Token Google tidak valid" });
  }

  if (!payload?.email || !payload.email_verified) {
    return res.status(401).json({ message: "Email Google tidak terverifikasi" });
  }

  const user = await prisma.user.findUnique({
    where: { email: payload.email },
  });

  if (!user) {
    return res.status(403).json({
      message: "Email belum terdaftar. Hubungi admin sekolah.",
      code: "NOT_REGISTERED",
    });
  }

  if (!user.googleId) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId: payload.sub,
        avatarUrl: user.avatarUrl ?? payload.picture ?? null,
      },
    });
  } else if (user.googleId !== payload.sub) {
    return res.status(401).json({ message: "Akun Google tidak cocok" });
  }

  const token = signToken({ id: user.id, role: user.role, name: user.name });
  res.cookie("token", token, COOKIE_OPTIONS);

  return res.json({
    message: "Login berhasil",
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      nik: user.nik,
      nis: user.nis,
      nip: user.nip,
      role: user.role,
      kelasId: user.kelasId,
      avatarUrl: user.avatarUrl ?? payload.picture ?? null,
    },
  });
});

router.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      name: true,
      email: true,
      nik: true,
      nis: true,
      nip: true,
      role: true,
      kelasId: true,
      avatarUrl: true,
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User tidak ditemukan" });
  }

  return res.json({ user });
});

router.post("/logout", (_req, res) => {
  res.clearCookie("token", { ...COOKIE_OPTIONS, maxAge: undefined });
  return res.json({ message: "Logout berhasil" });
});

export default router;
