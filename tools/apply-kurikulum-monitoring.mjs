import fs from "node:fs";
import path from "node:path";

const backendPath = path.resolve("backend/src/routes/kurikulum.ts");
const sidebarPath = path.resolve("frontend/src/components/layout/Sidebar.tsx");
for (const file of [backendPath, sidebarPath, path.resolve("backend/src/routes/kurikulum-monitoring.ts")]) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Extract into the existing repository root first.`);
}
const backend = fs.readFileSync(backendPath, "utf8");
const sidebar = fs.readFileSync(sidebarPath, "utf8");
if (!/router\.get\(\s*["']\/users["']/.test(backend) || !/router\.put\(\s*["']\/users\/:id["']/.test(backend)) {
  throw new Error("Install the previous Kurikulum Guru/Siswa management package first. The GitHub legacy router is not a supported base. No existing files changed.");
}
if (!fs.existsSync("frontend/src/lib/kurikulumApi.ts") ||
    !fs.existsSync("frontend/src/app/(dashboard)/kurikulum/siswa/page.tsx")) {
  throw new Error("The previous Kurikulum frontend package is missing. No existing files changed.");
}
let nextBackend = backend;
const importLine = 'import kurikulumMonitoringRouter from "./kurikulum-monitoring.js";';
const mountLine = 'router.use("/monitoring", kurikulumMonitoringRouter);';
const hasImport = backend.includes(importLine);
const hasMount = backend.includes(mountLine);
if (hasImport !== hasMount) throw new Error("Partially installed backend patch detected. Review existing import/mount manually. No files changed.");
if (!hasMount) {
  if ((backend.match(/export default router;/g) ?? []).length !== 1) {
    throw new Error("Expected one export default router; in backend. No files changed.");
  }
  nextBackend = `${importLine}\n${backend.replace('export default router;', `${mountLine}\n\nexport default router;`)}`;
}
const pattern = /^([ \t]*)kurikulum:\s*\[[\s\S]*?^\1\],?/gm;
const matches = [...sidebar.matchAll(pattern)];
if (matches.length !== 1) throw new Error("Cannot safely locate one Kurikulum menu array. No existing files changed.");
const importBlock = sidebar.match(/import\s*\{[^}]*\}\s*from\s*["']lucide-react["']/s)?.[0] ?? "";
if (!/\bHome\b/.test(importBlock) || !/\bUsers\b/.test(importBlock)) {
  throw new Error("Sidebar must already import Home and Users. No files changed.");
}
const indent = matches[0][1];
const menu = `${indent}kurikulum: [
${indent}  { label: "Home", href: "/kurikulum", icon: <Home size={18} />, exact: true },
${indent}  { label: "Guru", href: "/kurikulum/guru", icon: <Users size={18} /> },
${indent}  { label: "Siswa", href: "/kurikulum/siswa", icon: <Users size={18} /> },
${indent}  { label: "Aktivitas Guru", href: "/kurikulum/monitoring", icon: <Users size={18} /> },
${indent}],`;
const nextSidebar = sidebar.replace(pattern, menu);
const changes = [[backendPath, backend, nextBackend], [sidebarPath, sidebar, nextSidebar]];
const stamp = Date.now();
for (const [file, before, after] of changes) {
  if (before === after) continue;
  fs.copyFileSync(file, `${file}.monitoring-backup-${stamp}`, fs.constants.COPYFILE_EXCL);
}
for (const [file, before, after] of changes) {
  if (before !== after) fs.writeFileSync(file, after);
}
console.log("Monitoring router registered; Kurikulum menu updated. Existing user editing and other role menus retained.");
console.log("No migration or dependency reinstall required. Run TypeScript/build checks, then deploy both projects.");
