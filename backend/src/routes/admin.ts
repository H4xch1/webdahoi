import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";

import { Prisma, Role } from "@prisma/client";

import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { hashPassword } from "../utils/password.js";

import adminAkademikRouter from "./admin-akademik.js";

const router = Router();

// All routes in this file require ADMIN_UTAMA access.
router.use(authMiddleware, authorize("ADMIN_UTAMA"));

// Keep the existing academic-management routes.
router.use("/akademik", adminAkademikRouter);

// Never select password or other authentication secrets.
const userSelect = {
  id: true,
  name: true,
  email: true,
  nik: true,
  nis: true,
  nip: true,
  role: true,
  kelasId: true,

  kelasDiajar: {
    select: {
      id: true,
      nama: true,
    },
  },

  guruMapel: {
    select: {
      mapel: {
        select: {
          id: true,
          nama: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

type SelectedUser = Prisma.UserGetPayload<{
  select: typeof userSelect;
}>;

/**
 * Convert Prisma's subject join relation into the shape
 * expected by adminApi and EditUserModal.
 *
 * An existing teacher with no subjects gets mapelDiajar: [].
 * Missing relation data is not silently treated as empty.
 */
function toAdminUser(user: SelectedUser) {
  const { guruMapel, ...account } = user;

  return {
    ...account,
    mapelDiajar: guruMapel.map(({ mapel }) => ({
      id: mapel.id,
      nama: mapel.nama,
    })),
  };
}

class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction,
) => Promise<void>;

/**
 * Forward async errors for compatibility with Express 4 and 5.
 */
function asyncHandler(handler: AsyncHandler) {
  return (
    req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    void handler(req, res, next).catch(next);
  };
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function readBody(value: unknown): Record<string, unknown> {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value)
  ) {
    throw new HttpError(400, "Format data tidak valid.");
  }

  return value as Record<string, unknown>;
}

function readId(req: Request): string {
  const id = text(req.params.id);

  if (!id) {
    throw new HttpError(400, "ID tidak valid.");
  }

  return id;
}

function readRole(value: unknown): Role {
  switch (value) {
    case Role.MURID:
      return Role.MURID;

    case Role.GURU:
      return Role.GURU;

    case Role.KEPSEK:
      return Role.KEPSEK;

    case Role.KURIKULUM:
      return Role.KURIKULUM;

    case Role.ADMIN_UTAMA:
      return Role.ADMIN_UTAMA;

    default:
      throw new HttpError(400, "Role tidak valid.");
  }
}

/**
 * Read and deduplicate assignment IDs.
 *
 * During teacher editing, required=true prevents an omitted
 * field from accidentally clearing existing assignments.
 */
function readIds(
  value: unknown,
  label: string,
  required: boolean,
): string[] {
  if (value === undefined && !required) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new HttpError(
      400,
      `${label} harus berupa array dan wajib disertakan.`,
    );
  }

  const ids: string[] = [];

  for (const item of value) {
    if (typeof item !== "string" || !item.trim()) {
      throw new HttpError(
        400,
        `${label} berisi ID yang tidak valid.`,
      );
    }

    ids.push(item.trim());
  }

  return Array.from(new Set(ids));
}

function readAccountFields(
  body: Record<string, unknown>,
  role: Role,
) {
  // Support the current frontend's "name" and older "nama".
  const name = text(body.name) || text(body.nama);
  const email = text(body.email);
  const nik = text(body.nik);
  const nis = text(body.nis);
  const nip = text(body.nip);

  if (!name || !email || !nik) {
    throw new HttpError(
      400,
      "Nama, email, dan NIK wajib diisi.",
    );
  }

  if (role === Role.MURID && !nis) {
    throw new HttpError(
      400,
      "NIS wajib diisi untuk murid.",
    );
  }

  if (role === Role.GURU && !nip) {
    throw new HttpError(
      400,
      "NIP wajib diisi untuk guru.",
    );
  }

  return {
    name,
    email,
    nik,
    nis: role === Role.MURID ? nis : null,
    nip: role === Role.MURID ? null : nip || null,
  };
}

function readPassword(
  value: unknown,
  required: boolean,
): string | undefined {
  if (value === undefined || value === "") {
    if (required) {
      throw new HttpError(
        400,
        "Password wajib diisi.",
      );
    }

    return undefined;
  }

  if (typeof value !== "string") {
    throw new HttpError(
      400,
      "Password harus berupa teks.",
    );
  }

  // Do not trim passwords.
  if (value.length < 6) {
    throw new HttpError(
      400,
      "Password minimal 6 karakter.",
    );
  }

  return value;
}

async function ensureClassExists(id: string): Promise<void> {
  const kelas = await prisma.kelas.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!kelas) {
    throw new HttpError(
      400,
      "Kelas yang dipilih tidak ditemukan.",
    );
  }
}

async function ensureTeacherAssignmentsExist(
  kelasIds: string[],
  mapelIds: string[],
): Promise<void> {
  const [kelasCount, mapelCount] = await Promise.all([
    prisma.kelas.count({
      where: {
        id: { in: kelasIds },
      },
    }),

    prisma.mapel.count({
      where: {
        id: { in: mapelIds },
      },
    }),
  ]);

  if (kelasCount !== kelasIds.length) {
    throw new HttpError(
      400,
      "Satu atau beberapa kelas yang dipilih tidak ditemukan.",
    );
  }

  if (mapelCount !== mapelIds.length) {
    throw new HttpError(
      400,
      "Satu atau beberapa mata pelajaran yang dipilih tidak ditemukan.",
    );
  }
}

// ======================================================
// USERS: LIST
// GET /api/admin/users
// Optional: ?role=GURU&q=nama
// ======================================================

router.get(
  "/users",
  asyncHandler(async (req, res) => {
    const roleQuery = text(req.query.role);
    const search = text(req.query.q);

    const where: Prisma.UserWhereInput = {};

    if (roleQuery) {
      where.role = readRole(roleQuery);
    }

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          nik: {
            contains: search,
          },
        },
        {
          nis: {
            contains: search,
          },
        },
        {
          nip: {
            contains: search,
          },
        },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: userSelect,
      orderBy: {
        name: "asc",
      },
    });

    res.json({
      users: users.map(toAdminUser),
    });
  }),
);

// ======================================================
// USERS: DETAIL
// GET /api/admin/users/:id
// ======================================================

router.get(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const id = readId(req);

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new HttpError(
        404,
        "Pengguna tidak ditemukan.",
      );
    }

    res.json({
      user: toAdminUser(user),
    });
  }),
);

// ======================================================
// USERS: CREATE
// POST /api/admin/users
// ======================================================

router.post(
  "/users",
  asyncHandler(async (req, res) => {
    const body = readBody(req.body);
    const role = readRole(body.role);
    const fields = readAccountFields(body, role);
    const password = readPassword(body.password, true);

    if (password === undefined) {
      throw new HttpError(
        400,
        "Password wajib diisi.",
      );
    }

    const kelasId =
      role === Role.MURID
        ? text(body.kelasId)
        : "";

    const kelasIds =
      role === Role.GURU
        ? readIds(body.kelasIds, "kelasIds", false)
        : [];

    const mapelIds =
      role === Role.GURU
        ? readIds(body.mapelIds, "mapelIds", false)
        : [];

    if (kelasId) {
      await ensureClassExists(kelasId);
    }

    if (role === Role.GURU) {
      await ensureTeacherAssignmentsExist(
        kelasIds,
        mapelIds,
      );
    }

    const data: Prisma.UserCreateInput = {
      ...fields,
      role,
      password: await hashPassword(password),
    };

    if (role === Role.MURID && kelasId) {
      data.kelas = {
        connect: { id: kelasId },
      };
    }

    if (role === Role.GURU) {
      data.kelasDiajar = {
        connect: kelasIds.map((id) => ({ id })),
      };

      data.guruMapel = {
        create: mapelIds.map((id) => ({
          mapel: {
            connect: { id },
          },
        })),
      };
    }

    const user = await prisma.user.create({
      data,
      select: userSelect,
    });

    res.status(201).json({
      user: toAdminUser(user),
    });
  }),
);

// ======================================================
// USERS: UPDATE
// PUT /api/admin/users/:id
// ======================================================

router.put(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const id = readId(req);
    const body = readBody(req.body);

    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existing) {
      throw new HttpError(
        404,
        "Pengguna tidak ditemukan.",
      );
    }

    // The edit modal does not change account roles.
    if (
      body.role !== undefined &&
      body.role !== existing.role
    ) {
      throw new HttpError(
        400,
        "Role pengguna tidak dapat diubah melalui form ini.",
      );
    }

    const role = existing.role;
    const fields = readAccountFields(body, role);
    const password = readPassword(body.password, false);

    const kelasId =
      role === Role.MURID
        ? text(body.kelasId)
        : "";

    // Required on teacher updates, even if intentionally [].
    const kelasIds =
      role === Role.GURU
        ? readIds(body.kelasIds, "kelasIds", true)
        : [];

    const mapelIds =
      role === Role.GURU
        ? readIds(body.mapelIds, "mapelIds", true)
        : [];

    if (kelasId) {
      await ensureClassExists(kelasId);
    }

    if (role === Role.GURU) {
      await ensureTeacherAssignmentsExist(
        kelasIds,
        mapelIds,
      );
    }

    const data: Prisma.UserUpdateInput = {
      ...fields,
    };

    if (password !== undefined) {
      data.password = await hashPassword(password);
    }

    if (role === Role.MURID) {
      data.kelas = kelasId
        ? {
            connect: { id: kelasId },
          }
        : {
            disconnect: true,
          };
    }

    if (role === Role.GURU) {
      // Replace the teacher's class selection.
      data.kelasDiajar = {
        set: kelasIds.map((kelasId) => ({
          id: kelasId,
        })),
      };

      // Replace subject join rows atomically within this update.
      data.guruMapel = {
        deleteMany: {},
        create: mapelIds.map((mapelId) => ({
          mapel: {
            connect: { id: mapelId },
          },
        })),
      };
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    res.json({
      user: toAdminUser(user),
    });
  }),
);

// ======================================================
// USERS: DELETE
// DELETE /api/admin/users/:id
// ======================================================

router.delete(
  "/users/:id",
  asyncHandler(async (req, res) => {
    const id = readId(req);

    const existing = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existing) {
      throw new HttpError(
        404,
        "Pengguna tidak ditemukan.",
      );
    }

    if (existing.role === Role.ADMIN_UTAMA) {
      throw new HttpError(
        403,
        "Akun Admin Utama tidak dapat dihapus.",
      );
    }

    await prisma.user.delete({
      where: { id },
    });

    res.json({
      message: "Pengguna berhasil dihapus.",
    });
  }),
);

// ======================================================
// CLASS OPTIONS
// GET /api/admin/kelas
// ======================================================

router.get(
  "/kelas",
  asyncHandler(async (_req, res) => {
    const kelas = await prisma.kelas.findMany({
      select: {
        id: true,
        nama: true,
        jurusanId: true,
        tingkatId: true,

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
      orderBy: {
        nama: "asc",
      },
    });

    // adminApi.listKelas() accepts a raw array.
    res.json(kelas);
  }),
);

// ======================================================
// SUBJECT OPTIONS
// GET /api/admin/mapel
// ======================================================

router.get(
  "/mapel",
  asyncHandler(async (_req, res) => {
    const mapel = await prisma.mapel.findMany({
      select: {
        id: true,
        nama: true,
      },
      orderBy: {
        nama: "asc",
      },
    });

    // adminApi.listMapel() accepts a raw array.
    res.json(mapel);
  }),
);

// ======================================================
// LEGACY CLASS CREATION
// POST /api/admin/kelas
//
// Academic CRUD remains available through /akademik.
// ======================================================

router.post(
  "/kelas",
  asyncHandler(async (req, res) => {
    const body = readBody(req.body);

    const nama = text(body.nama);
    const jurusanId = text(body.jurusanId);
    const tingkatId = text(body.tingkatId);

    if (!nama || !jurusanId) {
      throw new HttpError(
        400,
        "Nama kelas dan jurusan wajib diisi.",
      );
    }

    const jurusan = await prisma.jurusan.findUnique({
      where: { id: jurusanId },
      select: { id: true },
    });

    if (!jurusan) {
      throw new HttpError(
        400,
        "Jurusan tidak ditemukan.",
      );
    }

    if (tingkatId) {
      const tingkat = await prisma.tingkat.findUnique({
        where: { id: tingkatId },
        select: { id: true },
      });

      if (!tingkat) {
        throw new HttpError(
          400,
          "Tingkat tidak ditemukan.",
        );
      }
    }

    const kelas = await prisma.kelas.create({
      data: {
        nama,
        jurusanId,
        tingkatId: tingkatId || null,
      },
      include: {
        jurusan: true,
        tingkat: true,
      },
    });

    res.status(201).json({
      kelas,
    });
  }),
);

// ======================================================
// TASK DELETION
// DELETE /api/admin/tugas/:id
// ======================================================

router.delete(
  "/tugas/:id",
  asyncHandler(async (req, res) => {
    const id = readId(req);

    await prisma.tugas.delete({
      where: { id },
    });

    res.json({
      message: "Tugas berhasil dihapus.",
    });
  }),
);

// ======================================================
// ROUTER ERROR HANDLER
// ======================================================

router.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (res.headersSent) {
      next(error);
      return;
    }

    if (error instanceof HttpError) {
      res.status(error.status).json({
        message: error.message,
      });
      return;
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          res.status(409).json({
            message:
              "Data sudah digunakan. Periksa email, NIK, NIS, NIP, atau data unik lainnya.",
          });
          return;

        case "P2003":
          res.status(409).json({
            message:
              "Operasi tidak dapat dilakukan karena data masih digunakan atau relasi tidak valid.",
          });
          return;

        case "P2025":
          res.status(404).json({
            message:
              "Data yang diminta atau data terkait tidak ditemukan.",
          });
          return;

        case "P2034":
          res.status(409).json({
            message:
              "Data sedang diperbarui oleh proses lain. Silakan coba lagi.",
          });
          return;
      }
    }

    console.error("[admin routes]", error);

    res.status(500).json({
      message:
        "Terjadi kesalahan pada server. Silakan coba lagi.",
    });
  },
);

export default router;
