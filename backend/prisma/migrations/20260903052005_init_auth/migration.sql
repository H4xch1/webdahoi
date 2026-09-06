-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MURID', 'GURU', 'ADMIN_UTAMA', 'KEPSEK', 'KURIKULUM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "namaLengkap" TEXT NOT NULL,
    "email" TEXT,
    "passwordHash" TEXT,
    "nis" TEXT,
    "nik" TEXT,
    "googleSub" TEXT,
    "role" "Role" NOT NULL,
    "fotoUrl" TEXT,
    "aktif" BOOLEAN NOT NULL DEFAULT true,
    "kelasId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Jurusan" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Jurusan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Kelas" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "jurusanId" TEXT NOT NULL,
    "waliGuruId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Kelas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mapel" (
    "id" TEXT NOT NULL,
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Mapel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuruMapel" (
    "guruId" TEXT NOT NULL,
    "mapelId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuruMapel_pkey" PRIMARY KEY ("guruId","mapelId")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_nis_key" ON "User"("nis");

-- CreateIndex
CREATE UNIQUE INDEX "User_nik_key" ON "User"("nik");

-- CreateIndex
CREATE UNIQUE INDEX "User_googleSub_key" ON "User"("googleSub");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_kelasId_idx" ON "User"("kelasId");

-- CreateIndex
CREATE UNIQUE INDEX "Jurusan_kode_key" ON "Jurusan"("kode");

-- CreateIndex
CREATE UNIQUE INDEX "Kelas_waliGuruId_key" ON "Kelas"("waliGuruId");

-- CreateIndex
CREATE INDEX "Kelas_jurusanId_idx" ON "Kelas"("jurusanId");

-- CreateIndex
CREATE UNIQUE INDEX "Mapel_kode_key" ON "Mapel"("kode");

-- CreateIndex
CREATE INDEX "GuruMapel_mapelId_idx" ON "GuruMapel"("mapelId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_jurusanId_fkey" FOREIGN KEY ("jurusanId") REFERENCES "Jurusan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_waliGuruId_fkey" FOREIGN KEY ("waliGuruId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruMapel" ADD CONSTRAINT "GuruMapel_guruId_fkey" FOREIGN KEY ("guruId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuruMapel" ADD CONSTRAINT "GuruMapel_mapelId_fkey" FOREIGN KEY ("mapelId") REFERENCES "Mapel"("id") ON DELETE CASCADE ON UPDATE CASCADE;
