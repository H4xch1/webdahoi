-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_kelasId_fkey";

-- AlterTable
ALTER TABLE "Kelas" ADD COLUMN     "tingkatId" TEXT;

-- CreateTable
CREATE TABLE "Tingkat" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "Tingkat_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tingkat_nama_key" ON "Tingkat"("nama");

-- CreateIndex
CREATE INDEX "Kelas_tingkatId_idx" ON "Kelas"("tingkatId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_kelasId_fkey" FOREIGN KEY ("kelasId") REFERENCES "Kelas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kelas" ADD CONSTRAINT "Kelas_tingkatId_fkey" FOREIGN KEY ("tingkatId") REFERENCES "Tingkat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
