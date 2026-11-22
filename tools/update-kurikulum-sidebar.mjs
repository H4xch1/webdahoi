import fs from "node:fs";
import path from "node:path";

const file = path.resolve("frontend/src/components/layout/Sidebar.tsx");
if (!fs.existsSync(file)) throw new Error("Run this script from the Webdahoi repository root.");
const source = fs.readFileSync(file, "utf8");
// Match only the top-level role navigation array, not ROLE_LABELS.
const pattern = /^([ \t]*)kurikulum:\s*\[[\s\S]*?^\1\],?/gm;
const matches = [...source.matchAll(pattern)];
if (matches.length !== 1) {
  throw new Error("Expected exactly one kurikulum navigation array. No file changed. See README for the manual replacement.");
}
const indent = matches[0][1];
const replacement = `${indent}kurikulum: [
${indent}  { label: "Home", href: "/kurikulum", icon: <Home size={18} />, exact: true },
${indent}  { label: "Guru", href: "/kurikulum/guru", icon: <Users size={18} /> },
${indent}  { label: "Siswa", href: "/kurikulum/siswa", icon: <Users size={18} /> },
${indent}],`;
// Both symbols are already imported by the inspected Sidebar.tsx versions.
const importBlock = source.match(/import\s*\{[^}]*\}\s*from\s*["']lucide-react["']/s)?.[0] ?? "";
if (!/\bHome\b/.test(importBlock) || !/\bUsers\b/.test(importBlock)) {
  throw new Error("Sidebar must import Home and Users from lucide-react. No file changed.");
}
const backup = `${file}.kurikulum-backup-${Date.now()}`;
fs.copyFileSync(file, backup, fs.constants.COPYFILE_EXCL);
fs.writeFileSync(file, source.replace(pattern, replacement));
console.log("Updated only the Kurikulum navigation array. Existing Murid Profile and other menus preserved.");
console.log(`Backup: ${backup}`);
