import { Router } from "express";
import authRoutes from "./auth";
import adminRoutes from "./admin";
import muridRoutes from "./murid";
import guruRoutes from "./guru";
import kepsekRoutes from "./kepsek";
import kurikulumRoutes from "./kurikulum";
import tugasRoutes from "./tugas";
import ujianRoutes from "./ujian";
import materiRoutes from "./materi";
import absenRoutes from "./absen";

const router = Router();

router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
router.use("/murid", muridRoutes);
router.use("/guru", guruRoutes);
router.use("/kepsek", kepsekRoutes);
router.use("/kurikulum", kurikulumRoutes);
router.use("/tugas", tugasRoutes);
router.use("/ujian", ujianRoutes);
router.use("/materi", materiRoutes);
router.use("/absen", absenRoutes);

export default router;
