import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);

  await prisma.user.upsert({
    where: { email: "admin@webdahoi.sch.id" },
    update: {},
    create: {
      name: "Admin Utama",
      email: "admin@webdahoi.sch.id",
      password,
      role: "ADMIN_UTAMA",
    },
  });

  console.log("Seed selesai. Login admin: admin@webdahoi.sch.id / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
