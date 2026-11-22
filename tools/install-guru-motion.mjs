import fs from "node:fs";
import path from "node:path";

const layoutPath = "frontend/src/app/(dashboard)/layout.tsx";
const sidebarPath = "frontend/src/components/layout/Sidebar.tsx";
const guruRoot = "frontend/src/app/(dashboard)/guru";
const boundaryImport = 'import GuruMotionBoundary from "@/components/guru-motion/GuruMotionBoundary";';
const wrapper = '<GuruMotionBoundary enabled={role === "guru"}>';
const pageAttribute = 'data-guru-motion-page={role === "guru" ? "" : undefined}';
const linkImport = 'import $1 from "@/components/guru-motion/GuruMotionLink";';
for (const file of [layoutPath, sidebarPath, "frontend/src/components/guru-motion/GuruMotionBoundary.tsx", "frontend/public/themes/guru-motion/academy-loop.webp"]) {
  if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Extract the package into the existing repository root first.`);
}
const changes = [];
const source = fs.readFileSync(layoutPath, "utf8");
let next = source;
if (source.includes(boundaryImport) || source.includes(wrapper) || source.includes(pageAttribute)) {
  if (![boundaryImport, wrapper, pageAttribute].every((marker) => source.includes(marker))) {
    throw new Error("Partial Guru motion layout install detected. Review/restore the layout backup before retrying. No files changed.");
  }
} else {
  const shell = '<div className={styles.shell}>';
  const main = '<main className={styles.content}>';
  const end = /([ \t]*)<\/div>(\r?\n[ \t]*\);[\s\S]*?\}\s*)$/;
  if (!source.includes('const role =') || source.split(shell).length !== 2 ||
      source.split(main).length !== 2 || !end.test(source)) {
    throw new Error("Dashboard layout structure differs from the inspected version. No files changed; use the README manual integration.");
  }
  next = next.replace(end, '$1</div>\n$1</GuruMotionBoundary>$2');
  next = next.replace(shell, `${wrapper}\n    ${shell}`);
  next = next.replace(main, `<main className={styles.content} ${pageAttribute}>`);
  next = `${boundaryImport}\n${next}`;
}
changes.push([layoutPath, source, next]);
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : file.endsWith(".tsx") ? [file] : [];
  });
}
let enhancedCount = 0;
for (const file of [sidebarPath, ...walk(guruRoot)]) {
  const before = fs.readFileSync(file, "utf8");
  const pattern = /^import\s+([A-Za-z_$][\w$]*)\s+from\s+["']next\/link["'];?[ \t]*$/gm;
  const after = before.replace(pattern, linkImport);
  if (after !== before) enhancedCount += 1;
  changes.push([file, before, after]);
}
const sidebarAfter = changes.find(([file]) => file === sidebarPath)?.[2];
if (!sidebarAfter?.includes('@/components/guru-motion/GuruMotionLink')) {
  throw new Error("Expected a default Next Link import in Sidebar.tsx. No files changed; review manual integration.");
}
const stamp = Date.now();
const changed = changes.filter(([, before, after]) => before !== after);
for (const [file] of changed) fs.copyFileSync(file, `${file}.guru-motion-backup-${stamp}`, fs.constants.COPYFILE_EXCL);
for (const [file, , after] of changed) fs.writeFileSync(file, after);
console.log(`Guru motion installed. ${changed.length} files updated; ${enhancedCount} Link imports enhanced.`);
console.log("No menu items, authorization, logout logic, or existing theme CSS was replaced.");
console.log("Next: run frontend TypeScript/build checks and test Guru navigation on your browser.");
