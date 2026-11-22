import fs from "node:fs";

const schemaPath = "backend/prisma/schema.prisma";
if (!fs.existsSync(schemaPath)) throw new Error("Run from repository root.");
const schema = fs.readFileSync(schemaPath, "utf8");
const user = schema.match(/model\s+User\s*\{([\s\S]*?)\n\}/)?.[1] ?? "";
if (!/^\s*nisn\s+String\?/m.test(user)) {
  throw new Error("User.nisn String? is required. Keep/apply your existing add_user_nisn migration; do not replace the whole schema.");
}
const required = [
  "backend/src/routes/kurikulum.ts",
  "frontend/src/lib/kurikulumApi.ts",
  "frontend/src/app/(dashboard)/kurikulum/management.module.css",
  "frontend/src/app/(dashboard)/kurikulum/_components/UserManagement.tsx",
  "frontend/src/app/(dashboard)/kurikulum/_components/UserForm.tsx",
];
for (const file of required) if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
const index = fs.readFileSync("backend/src/routes/index.ts", "utf8");
if (!/kurikulumRoutes/.test(index) || !/router\.use\(["']\/kurikulum["']/.test(index)) {
  throw new Error("Verify backend routes/index.ts imports and mounts kurikulumRoutes at /kurikulum.");
}
console.log("Preflight passed. This is not a TypeScript compile or database migration check.");
