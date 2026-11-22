import {
  Router,
  type Response,
} from "express";

import { Prisma } from "@prisma/client";
import { OAuth2Client } from "google-auth-library";

import { prisma } from "../lib/prisma.js";

import { comparePassword } from "../utils/password.js";
import { signToken } from "../utils/jwt.js";

import { validate } from "../middleware/validate.js";

import {
  loginSchema,
  googleLoginSchema,
} from "../schemas/auth.schema.js";

import {
  authMiddleware,
  type AuthRequest,
} from "../middleware/auth.js";

const router = Router();

const googleClient = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
);

// ---------------------------------------------
// Cookie configuration
// ---------------------------------------------

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
};

const SESSION_MAX_AGE =
  7 * 24 * 60 * 60 * 1000;

// ---------------------------------------------
// Safe user fields
// Requires User.nisn in schema.prisma.
// ---------------------------------------------

const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,

  nik: true,
  nis: true,
  nisn: true,
  nip: true,

  role: true,
  kelasId: true,
  avatarUrl: true,
  createdAt: true,

  kelas: {
    select: {
      id: true,
      nama: true,

      jurusan: {
        select: {
          id: true,
          nama: true,
        },
      },

      tingkat: {
        select: {
          id: true,
          nama: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

// ---------------------------------------------
// Async error handling
// ---------------------------------------------

type AuthHandler = (
  req: AuthRequest,
  res: Response,
) => Promise<unknown>;

function route(handler: AuthHandler) {
  return (
    req: AuthRequest,
    res: Response,
  ) => {
    void handler(req, res).catch(
      (error: unknown) => {
        console.error("[auth]", error);

        res.status(500).json({
          message:
            "Terjadi kesalahan pada server. Silakan coba lagi.",
        });
      },
    );
  };
}

// ---------------------------------------------
// Password login
// POST /api/auth/login
// ---------------------------------------------

router.post(
  "/login",
  validate(loginSchema),

  route(async (req, res) => {
    const {
      identifier,
      password,
    } = req.body as {
      identifier: string;
      password: string;
    };

    const normalizedIdentifier =
      identifier.trim();

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          {
            email: {
              equals: normalizedIdentifier,
              mode: "insensitive",
            },
          },
          {
            nik: normalizedIdentifier,
          },
          {
            nis: normalizedIdentifier,
          },
          {
            nisn: normalizedIdentifier,
          },
          {
            nip: normalizedIdentifier,
          },
        ],
      },

      select: {
        ...PUBLIC_USER_SELECT,
        password: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        message:
          "Identitas login atau password salah.",
      });
    }

    if (!user.password) {
      return res.status(401).json({
        message:
          "Akun ini menggunakan Google. Silakan login dengan Google.",
        code: "GOOGLE_ONLY",
      });
    }

    const validPassword =
      await comparePassword(
        password,
        user.password,
      );

    if (!validPassword) {
      return res.status(401).json({
        message:
          "Identitas login atau password salah.",
      });
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      name: user.name,
    });

    res.cookie("token", token, {
      ...COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE,
    });

    const {
      password: _password,
      ...publicUser
    } = user;

    return res.json({
      message: "Login berhasil",
      token,
      user: publicUser,
    });
  }),
);

// ---------------------------------------------
// Google login
// POST /api/auth/google
// ---------------------------------------------

router.post(
  "/google",
  validate(googleLoginSchema),

  route(async (req, res) => {
    const { idToken } = req.body as {
      idToken: string;
    };

    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    if (!clientId) {
      return res.status(503).json({
        message:
          "Login Google belum dikonfigurasi. Hubungi administrator.",
      });
    }

    const payload = await googleClient
      .verifyIdToken({
        idToken,
        audience: clientId,
      })
      .then((ticket) => ticket.getPayload())
      .catch(() => null);

    if (!payload?.email || !payload.sub) {
      return res.status(401).json({
        message: "Token Google tidak valid.",
      });
    }

    if (!payload.email_verified) {
      return res.status(401).json({
        message:
          "Email Google belum terverifikasi.",
      });
    }

    const existingUser =
      await prisma.user.findFirst({
        where: {
          email: {
            equals: payload.email,
            mode: "insensitive",
          },
        },

        select: {
          id: true,
          googleId: true,
          avatarUrl: true,
        },
      });

    if (!existingUser) {
      return res.status(403).json({
        message:
          "Email belum terdaftar. Hubungi admin sekolah.",
        code: "NOT_REGISTERED",
      });
    }

    if (
      existingUser.googleId &&
      existingUser.googleId !== payload.sub
    ) {
      return res.status(401).json({
        message: "Akun Google tidak cocok.",
      });
    }

    if (!existingUser.googleId) {
      // Link only if the account is still unlinked.
      const linked = await prisma.user.updateMany({
        where: {
          id: existingUser.id,
          googleId: null,
        },

        data: {
          googleId: payload.sub,

          avatarUrl:
            existingUser.avatarUrl ??
            payload.picture ??
            null,
        },
      });

      if (linked.count !== 1) {
        return res.status(409).json({
          message:
            "Status akun berubah. Silakan ulangi login Google.",
        });
      }
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: existingUser.id,
        },

        select: PUBLIC_USER_SELECT,
      });

    if (!user) {
      return res.status(404).json({
        message: "Akun tidak ditemukan.",
      });
    }

    const token = signToken({
      id: user.id,
      role: user.role,
      name: user.name,
    });

    res.cookie("token", token, {
      ...COOKIE_OPTIONS,
      maxAge: SESSION_MAX_AGE,
    });

    return res.json({
      message: "Login berhasil",
      token,
      user,
    });
  }),
);

// ---------------------------------------------
// Current authenticated user
// GET /api/auth/me
// ---------------------------------------------

router.get(
  "/me",
  authMiddleware,

  route(async (req, res) => {
    res.setHeader(
      "Cache-Control",
      "private, no-store",
    );

    if (!req.user?.id) {
      return res.status(401).json({
        message:
          "Sesi tidak valid. Silakan masuk kembali.",
      });
    }

    const user =
      await prisma.user.findUnique({
        where: {
          id: req.user.id,
        },

        select: PUBLIC_USER_SELECT,
      });

    if (!user) {
      return res.status(404).json({
        message: "Akun tidak ditemukan.",
      });
    }

    return res.json({
      user,
    });
  }),
);

// ---------------------------------------------
// Logout
// POST /api/auth/logout
// ---------------------------------------------

router.post(
  "/logout",
  (_req, res) => {
    res.clearCookie(
      "token",
      COOKIE_OPTIONS,
    );

    return res.json({
      message: "Logout berhasil",
    });
  },
);

export default router;
