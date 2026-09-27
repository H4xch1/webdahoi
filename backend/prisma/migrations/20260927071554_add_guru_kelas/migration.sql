-- CreateTable
CREATE TABLE "_GuruKelas" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GuruKelas_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_GuruKelas_B_index" ON "_GuruKelas"("B");

-- AddForeignKey
ALTER TABLE "_GuruKelas" ADD CONSTRAINT "_GuruKelas_A_fkey" FOREIGN KEY ("A") REFERENCES "Kelas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuruKelas" ADD CONSTRAINT "_GuruKelas_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
