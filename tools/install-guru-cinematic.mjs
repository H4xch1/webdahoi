import fs from "node:fs";
import path from "node:path";

const root = path.resolve("frontend/src/app/layout.tsx");
const css = path.resolve("frontend/src/app/guru-cinematic.css");
const sidebar = path.resolve("frontend/src/components/layout/Sidebar.tsx");
for (const file of [root, css, sidebar]) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Run from Webdahoi repository root after extracting the ZIP.`);
}
const sidebarSource = fs.readFileSync(sidebar, "utf8");
if (!/href:\s*["']\/guru["']/.test(sidebarSource)) {
  throw new Error("Expected the existing Guru Home link in Sidebar.tsx. No file changed; review theme scoping manually.");
}
const source = fs.readFileSync(root, "utf8");
if (source.includes('import "./guru-cinematic.css";') || source.includes("import './guru-cinematic.css';")) {
  console.log("Guru cinematic CSS already imported. Nothing changed.");
  process.exit(0);
}
const baseImport = /^import[ \t]+["']\.\/(?:global|globals)\.css["'];?[ \t]*$/m;
if (!baseImport.test(source)) {
  throw new Error("Cannot safely find the base global CSS import in root layout.tsx. No file changed. Add the import manually as described in README.");
}
const next = source.replace(baseImport, (line) => `${line.trimEnd()}\nimport "./guru-cinematic.css";`);
const backup = `${root}.guru-cinematic-backup-${Date.now()}`;
fs.copyFileSync(root, backup, fs.constants.COPYFILE_EXCL);
fs.writeFileSync(root, next);
console.log("Added one CSS import to root layout.tsx. Global CSS, business logic, backend, and other roles were not replaced.");
console.log(`Backup: ${backup}`);
