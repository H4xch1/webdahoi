/*
  Warnings:

  - The primary key for the `GuruMapel` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `GuruMapel` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Jurusan` table. All the data in the column will be lost.
  - You are about to drop the column `kode` on the `Jurusan` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Kelas` table. All the data in the column will be lost.
  - You are about to drop the column `waliGuruId` on the `Kelas` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Mapel` table. All the data in the column will be lost.
  - You are about to drop the column `kode` on the `Mapel` table. All the data in the column will be lost.
  - You are about to drop the column `aktif` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fotoUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `googleSub` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `namaLengkap` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nik` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nis` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nama]` on the table `Jurusan` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `GuruMapel` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.
  - Made the column `email` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "GuruMapel" DROP CONSTRAINT "GuruMapel_guruId_fkey";

-- DropForeignKey
ALTER TABLE "GuruMapel" DROP CONSTRAINT "GuruMapel_mapelId_fkey";

-- DropForeignKey
ALTER TABLE "Kelas" DROP CONSTRAINT "Kelas_waliGuruId_fkey";

-- DropIndex
DROP INDEX "GuruMapel_mapelId_idx";

-- DropIndex
DROP INDEX "Jurusan_kode_key";

-- DropIndex
DROP INDEX "Kelas_jurusanId_idx";

-- DropIndex
DROP INDEX "Kelas_waliGuruId_key";

-- DropIndex
DROP INDEX "Mapel_kode_key";

-- DropIndex
DROP INDEX "User_googleSub_key";

-- DropIndex
DROP INDEX "User_kelasId_idx";

-- DropIndex
DROP INDEX "User_nik_key";

-- DropIndex
DROP INDEX "User_nis_key";

-- DropIndex
DROP INDEX "User_role_idx";

-- AlterTable
ALTER TABLE "GuruMapel" DROP CONSTRAINT "GuruMapel_pkey",
DROP COLUMN "createdAt",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "GuruMapel_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Jurusan" DROP COLUMN "createdAt",
DROP COLUMN "kode";

-- AlterTable
ALTER TABLE "Kelas" DROP COLUMN "createdAt",
DROP COLUMN "waliGuruId";

-- AlterTable
ALTER TABLE "Mapel" DROP COLUMN "createdAt",
DROP COLUMN "kode";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "aktif",
DROP COLUMN "fotoUrl",
DROP COLUMN "googleSub",
DROP COLUMN "namaLengkap",
DROP COLUMN "nik",
DROP COLUMN "nis",
DROP COLUMN "passwordHash",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "password" TEXT NOT NULL,
ALTER COLUMN "email" SET NOT NULL;

-- CreateTable
CREATE TABLE "Materi" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "fileUrl" TEXT,
    "mapelId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Materi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tugas" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "deadline" TIMESTAMP(3) NOT NULL,
    "mapelId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tugas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ujian" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "deskripsi" TEXT,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "mapelId" TEXT NOT NULL,
    "kelasId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Ujian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Nilai" (
    "id" TEXT NOT NULL,
    "siswaId" TEXT NOT NULL,
    "tugasId" TEXT,
    "ujianId" TEXT,
    "nilai" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Nilai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_KelasToMapel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_KelasToMapel_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_KelasToMapel_B_index" ON "_KelasToMapel"("B");

-- CreateIndex
CREATE UNIQUE INDEX "Jurusan_nama_key" ON "Jurusan"("nama");

-- AddForeignKey
ALTER TABLE "GuruMapel" ADD CONSTRAINT "GuruMapel_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruMapel" ADD CONSTRAINT "GuruMapel_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "Mapel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materi" ADD CONSTRAINT "Materi_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "Mapel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materi" ADD CONSTRAINT "Materi_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Materi" ADD CONSTRAINT "Materi_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tugas" ADD CONSTRAINT "Tugas_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "Mapel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tugas" ADD CONSTRAINT "Tugas_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tugas" ADD CONSTRAINT "Tugas_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ujian" ADD CONSTRAINT "Ujian_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "Mapel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ujian" ADD CONSTRAINT "Ujian_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ujian" ADD CONSTRAINT "Ujian_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_siswaId_fkey" FOREIGN KEY ("siswaId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_tugasId_fkey" FOREIGN KEY ("tugasId") REFERENCES "Tugas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Nilai" ADD CONSTRAINT "Nilai_ujianId_fkey" FOREIGN KEY ("ujianId") REFERENCES "Ujian"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KelasToMapel" ADD CONSTRAINT "_KelasToMapel_A_fkey" FOREIGN KEY ("A") REFERENCES "Kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_KelasToMapel" ADD CONSTRAINT "_KelasToMapel_B_fkey" FOREIGN KEY ("B") REFERENCES "Mapel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
