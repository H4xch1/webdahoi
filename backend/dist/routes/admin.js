import { Router } from "express";
import { Prisma, Role } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { authMiddleware } from "../middleware/auth.js";
import { authorize } from "../middleware/authorize.js";
import { hashPassword } from "../utils/password.js";
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
    kelasDiajar: {
        select: {
            id: true,
        },
    },
};
class InputError extends Error {
    status;
    constructor(message, status = 400) {
        super(message);
        this.status = status;
        this.name = "InputError";
    }
}
function text(value) {
    return typeof value === "string" ? value.trim() : "";
}
function bodyObject(value) {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        throw new InputError("Body permintaan tidak valid.");
    }
    return value;
}
function isRole(value) {
    return (typeof value === "string" &&
        Object.values(Role).includes(value));
}
function handleError(res, error, fallback) {
    if (error instanceof InputError) {
        res.status(error.status).json({ message: error.message });
        return;
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
            res.status(409).json({
                message: "Data unik sudah digunakan. Periksa email, NIK, NIS, NIP, atau nama kelas.",
            });
            return;
        }
        if (error.code === "P2025") {
            res.status(404).json({
                message: "Data atau relasi yang dipilih tidak ditemukan.",
            });
            return;
        }
        if (error.code === "P2003") {
            res.status(409).json({
                message: "Relasi data tidak valid atau data masih digunakan oleh data lain.",
            });
            return;
        }
    }
    console.error(fallback, error instanceof Error ? error.name : "UnknownError");
    res.status(500).json({ message: fallback });
}
async function validateUserForm(body, role, creating) {
    const name = text(body.name) || text(body.nama);
    const email = text(body.email);
    const nik = text(body.nik);
    const nis = text(body.nis);
    const nip = text(body.nip);
    const kelasId = text(body.kelasId);
    if (body.password !== undefined &&
        typeof body.password !== "string") {
        throw new InputError("Password harus berupa teks.");
    }
    // Do not trim passwords.
    const password = typeof body.password === "string" ? body.password : "";
    if (!name || !email || !nik) {
        throw new InputError("Nama, email, dan NIK wajib diisi.");
    }
    if (creating && !password) {
        throw new InputError("Password wajib diisi.");
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new InputError("Format email tidak valid.");
    }
    if (role === Role.MURID && !nis) {
        throw new InputError("NIS wajib diisi untuk murid.");
    }
    if (role === Role.MURID &&
        body.kelasId !== undefined &&
        body.kelasId !== null &&
        typeof body.kelasId !== "string") {
        throw new InputError("ID kelas tidak valid.");
    }
    let kelasIds = [];
    if (role === Role.GURU) {
        // On editing, require the full selection to avoid silently
        // clearing assignments when the field is accidentally omitted.
        const suppliedIds = creating && body.kelasIds === undefined
            ? []
            : body.kelasIds;
        if (!Array.isArray(suppliedIds)) {
            throw new InputError("kelasIds harus berupa daftar ID kelas.");
        }
        for (const id of suppliedIds) {
            if (typeof id !== "string" || !id.trim()) {
                throw new InputError("ID kelas tidak valid.");
            }
            kelasIds.push(id.trim());
        }
        kelasIds = [...new Set(kelasIds)];
        if (kelasIds.length > 0) {
            const count = await prisma.kelas.count({
                where: { id: { in: kelasIds } },
            });
            if (count !== kelasIds.length) {
                throw new InputError("Satu atau beberapa kelas tidak ditemukan.");
            }
        }
    }
    if (role === Role.MURID && kelasId) {
        const kelas = await prisma.kelas.findUnique({
            where: { id: kelasId },
            select: { id: true },
        });
        if (!kelas) {
            throw new InputError("Kelas murid tidak ditemukan.");
        }
    }
    return {
        name,
        email,
        nik,
        nis,
        nip,
        kelasId,
        kelasIds,
        password,
    };
}
// USERS
router.get("/users", async (_req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: userSelect,
            orderBy: { name: "asc" },
        });
        res.json({ users });
    }
    catch (error) {
        handleError(res, error, "Gagal memuat daftar pengguna.");
    }
});
router.get("/users/:id", async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: userSelect,
        });
        if (!user) {
            throw new InputError("Pengguna tidak ditemukan.", 404);
        }
        res.json({ user });
    }
    catch (error) {
        handleError(res, error, "Gagal memuat pengguna.");
    }
});
router.post("/users", async (req, res) => {
    try {
        const body = bodyObject(req.body);
        const role = body.role;
        if (!isRole(role)) {
            throw new InputError("Role pengguna tidak valid.");
        }
        const form = await validateUserForm(body, role, true);
        const hashed = await hashPassword(form.password);
        const user = await prisma.user.create({
            data: {
                name: form.name,
                email: form.email,
                nik: form.nik,
                password: hashed,
                role,
                nis: role === Role.MURID ? form.nis : null,
                nip: role !== Role.MURID ? form.nip || null : null,
                ...(role === Role.MURID && form.kelasId
                    ? {
                        kelas: {
                            connect: { id: form.kelasId },
                        },
                    }
                    : {}),
                ...(role === Role.GURU && form.kelasIds.length > 0
                    ? {
                        kelasDiajar: {
                            connect: form.kelasIds.map((id) => ({ id })),
                        },
                    }
                    : {}),
            },
            select: userSelect,
        });
        res.status(201).json({ user });
    }
    catch (error) {
        handleError(res, error, "Gagal membuat pengguna.");
    }
});
router.put("/users/:id", async (req, res) => {
    try {
        const body = bodyObject(req.body);
        const existing = await prisma.user.findUnique({
            where: { id: req.params.id },
            select: {
                id: true,
                role: true,
            },
        });
        if (!existing) {
            throw new InputError("Pengguna tidak ditemukan.", 404);
        }
        // Editing account information does not change its role.
        // Enforce this on the backend, not just in the form.
        if (body.role !== undefined &&
            body.role !== existing.role) {
            throw new InputError("Perubahan role tidak tersedia melalui form ini.");
        }
        const form = await validateUserForm(body, existing.role, false);
        const data = {
            name: form.name,
            email: form.email,
            nik: form.nik,
        };
        // Empty/omitted password leaves the current hash unchanged.
        if (form.password !== "") {
            data.password = await hashPassword(form.password);
        }
        if (existing.role === Role.MURID) {
            data.nis = form.nis;
            data.kelas = form.kelasId
                ? { connect: { id: form.kelasId } }
                : { disconnect: true };
        }
        else {
            data.nip = form.nip || null;
        }
        if (existing.role === Role.GURU) {
            data.kelasDiajar = {
                set: form.kelasIds.map((id) => ({ id })),
            };
        }
        const user = await prisma.user.update({
            where: { id: existing.id },
            data,
            select: userSelect,
        });
        res.json({ user });
    }
    catch (error) {
        handleError(res, error, "Gagal menyimpan perubahan pengguna.");
    }
});
router.delete("/users/:id", async (req, res) => {
    try {
        // Prevent admin deletion even if someone calls the API directly.
        const result = await prisma.user.deleteMany({
            where: {
                id: req.params.id,
                role: { not: Role.ADMIN_UTAMA },
            },
        });
        if (result.count === 0) {
            const existing = await prisma.user.findUnique({
                where: { id: req.params.id },
                select: { id: true },
            });
            if (existing) {
                throw new InputError("Penghapusan akun Admin Utama dinonaktifkan.", 403);
            }
            throw new InputError("Pengguna tidak ditemukan.", 404);
        }
        res.json({ message: "User dihapus" });
    }
    catch (error) {
        handleError(res, error, "Gagal menghapus pengguna.");
    }
});
// KELAS
router.get("/kelas", async (req, res) => {
    try {
        const q = text(req.query.q);
        const kelas = await prisma.kelas.findMany({
            where: q
                ? {
                    nama: {
                        contains: q,
                        mode: "insensitive",
                    },
                }
                : undefined,
            include: {
                jurusan: {
                    select: {
                        id: true,
                        nama: true,
                    },
                },
            },
            orderBy: { nama: "asc" },
        });
        res.json(kelas);
    }
    catch (error) {
        handleError(res, error, "Gagal memuat daftar kelas.");
    }
});
router.post("/kelas", async (req, res) => {
    try {
        const nama = text(req.body?.nama);
        const jurusanId = text(req.body?.jurusanId);
        if (!nama || !jurusanId) {
            throw new InputError("Nama kelas dan jurusan wajib diisi.");
        }
        const kelas = await prisma.kelas.create({
            data: { nama, jurusanId },
        });
        res.status(201).json({ kelas });
    }
    catch (error) {
        handleError(res, error, "Gagal membuat kelas.");
    }
});
// TUGAS
router.delete("/tugas/:id", async (req, res) => {
    try {
        await prisma.tugas.delete({
            where: { id: req.params.id },
        });
        res.json({ message: "Tugas dihapus" });
    }
    catch (error) {
        handleError(res, error, "Gagal menghapus tugas.");
    }
});
export default router;
