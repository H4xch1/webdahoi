/*
  Warnings:

  - A unique constraint covering the columns `[guruId,mapelId]` on the table `GuruMapel` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nama,jurusanId]` on the table `Kelas` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googleId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nik]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nis]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[nip]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "StatusAbsen" AS ENUM ('HADIR', 'IZIN', 'SAKIT', 'ALPA');

-- DropForeignKey
ALTER TABLE "GuruMapel" DROP CONSTRAINT "GuruMapel_guruId_fkey";

-- DropForeignKey
ALTER TABLE "GuruMapel" DROP CONSTRAINT "GuruMapel_mapelId_fkey";

-- DropForeignKey
ALTER TABLE "Nilai" DROP CONSTRAINT "Nilai_siswaId_fkey";

-- AlterTable
ALTER TABLE "Ujian" ADD COLUMN     "durasiMenit" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "avatarUrl" TEXT,
ADD COLUMN     "googleId" TEXT,
ADD COLUMN     "nik" TEXT,
ADD COLUMN     "nip" TEXT,
ADD COLUMN     "nis" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "tugasId" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "fileUrl" TEXT,
    "catatan" TEXT,
    "nilai" DOUBLE PRECISION,
    "feedback" TEXT,
    "gradedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Soal" (
    "id" TEXT NOT NULL,
    "ujianId" TEXT NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "opsiA" TEXT NOT NULL,
    "opsiB" TEXT NOT NULL,
    "opsiC" TEXT NOT NULL,
    "opsiD" TEXT NOT NULL,
    "jawabanBenar" TEXT NOT NULL,
    "bobot" INTEGER NOT NULL DEFAULT 1,
    "urutan" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "Soal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JawabanUjian" (
    "id" TEXT NOT NULL,
    "ujianId" TEXT NOT NULL,
    "soalId" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "pilihan" TEXT NOT NULL,
    "benar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JawabanUjian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absensi" (
    "id" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "status" "StatusAbsen" NOT NULL DEFAULT 'HADIR',
    "keterangan" TEXT,
    "siswaId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "mapelId" TEXT,
    "dicatatById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Absensi_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Submission_tugasId_siswaId_key" ON "Submission"("tugasId", "siswaId");

-- CreateIndex
CREATE INDEX "Soal_ujianId_idx" ON "Soal"("ujianId");

-- CreateIndex
CREATE INDEX "JawabanUjian_ujianId_siswaId_idx" ON "JawabanUjian"("ujianId", "siswaId");

-- CreateIndex
CREATE UNIQUE INDEX "JawabanUjian_soalId_siswaId_key" ON "JawabanUjian"("soalId", "siswaId");

-- CreateIndex
CREATE INDEX "Absensi_kelasId_tanggal_idx" ON "Absensi"("kelasId", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "Absensi_siswaId_tanggal_mapelId_key" ON "Absensi"("siswaId", "tanggal", "mapelId");

-- CreateIndex
CREATE UNIQUE INDEX "GuruMapel_guruId_mapelId_key" ON "GuruMapel"("guruId", "mapelId");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_nama_jurusanId_key" ON "Kelas"("nama", "jurusanId");

-- CreateIndex
CREATE INDEX "Nilai_siswaId_idx" ON "Nilai"("siswaId");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleId_key" ON "User"("googleId");

-- CreateIndex
CREATE UNIQUE INDEX "User_nik_key" ON "User"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "User_nis_key" ON "User"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "User_nip_key" ON "User"("nip");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_kelasId_idx" ON "User"("kelasId");

-- AddForeignKey
ALTER TABLE "GuruMapel" ADD CONSTRAINT "GuruMapel_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruMapel" ADD CONSTRAINT "GuruMapel_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "Mapel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_tugasId_fkey" FOREIGN KEY ("tugasId") REFERENCES "Tugas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Soal" ADD CONSTRAINT "Soal_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "Ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JawabanUjian" ADD CONSTRAINT "JawabanUjian_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "Ujian"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JawabanUjian" ADD CONSTRAINT "JawabanUjian_soalId_fkey" FOREIGN KEY ("soalId") REFERENCES "Soal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JawabanUjian" ADD CONSTRAINT "JawabanUjian_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "Mapel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absensi" ADD CONSTRAINT "Absensi_dicatatById_fkey" FOREIGN KEY ("dicatatById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
