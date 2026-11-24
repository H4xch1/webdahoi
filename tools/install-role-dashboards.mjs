import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root = process.cwd();
const dry = process.argv.includes("--dry-run");
const themePath = "frontend/src/app/guru-cinematic.css";
const layoutPath = "frontend/src/app/layout.tsx";
const required = [themePath, layoutPath, "frontend/src/lib/adminApi.ts", "frontend/src/lib/kurikulumApi.ts", "frontend/src/lib/muridLearningApi.ts", "frontend/src/lib/exportExcel.ts", "frontend/src/components/role-dashboards/dashboards.module.css", "frontend/src/app/role-polish.css"];
for (const p of required) if (!fs.existsSync(p)) throw new Error(`Missing ${p}. Install/extract the prerequisite packages first. No existing files changed.`);
const originalTheme = fs.readFileSync(themePath, "utf8");
const href = /\[href\s*=\s*(["'])\/guru\1\]/g;
if (!href.test(originalTheme)) throw new Error("Cannot locate the Guru theme scope. No existing files changed.");
const roleSelector = ':is([href="/guru"],[href="/admin"],[href="/murid"],[href="/kurikulum"],[href="/kepsek"])';
const generated = '/* Generated from your CURRENT Guru skin. Do not replace Guru source CSS. */\n' + originalTheme.replace(href, roleSelector).replaceAll("WEBDAHOI MOBILE ALL V1", "INHERITED GURU MOBILE RULES");
// Verify every local media reference before activating the expanded theme.
for (const match of generated.matchAll(/url\(\s*["']?(\/[^"')\s]+)["']?\s*\)/g)) {
  if (match[1].startsWith("//")) continue;
  const asset = path.resolve("frontend/public", `.${match[1]}`);
  if (!asset.startsWith(path.resolve("frontend/public") + path.sep) || !fs.existsSync(asset)) throw new Error(`Theme asset missing: ${match[1]}. No existing files changed.`);
}
const changes = [];
function stage(file, after) { changes.push({ file, before: fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null, after }); }
stage("frontend/src/app/role-cinematic.css", generated);
let layout = fs.readFileSync(layoutPath, "utf8");
const markerStart = "// ROLE DASHBOARD SKIN START", markerEnd = "// ROLE DASHBOARD SKIN END";
const block = `${markerStart}\nimport "./role-cinematic.css";\nimport "./role-polish.css";\n${markerEnd}`;
const a = layout.indexOf(markerStart), b = layout.indexOf(markerEnd);
if ((a < 0) !== (b < 0) || (a >= 0 && b < a)) throw new Error("Partial role skin import block; review root layout. No existing files changed.");
if (a >= 0) layout = layout.slice(0,a) + block + layout.slice(b + markerEnd.length);
else {
  const imports = [...layout.matchAll(/^import[ \t]+["'][^"']+\.css["'];?[ \t]*$/gm)];
  if (!imports.length) throw new Error("No base CSS import found in root layout. No existing files changed.");
  const last = imports.at(-1); const end = last.index + last[0].length;
  layout = layout.slice(0,end) + "\n" + block + layout.slice(end);
}
stage(layoutPath, layout);
for (const role of ["admin", "murid", "kurikulum"]) {
  const target = `frontend/src/app/(dashboard)/${role}/page.tsx`;
  if (!fs.existsSync(target)) throw new Error(`Missing existing dashboard ${target}. No existing files changed.`);
  stage(target, fs.readFileSync(`role-unification/pages/${role}.tsx`, "utf8"));
}
const changed = changes.filter((x) => x.before !== x.after);
if (dry) { console.log(JSON.stringify({ updates: changed.map((x) => ({ path:x.file, action:x.before === null ? "create" : "replace-with-backup" })), note:"Only the three home pages are replaced. Review custom local changes before applying." },null,2)); process.exit(0); }
if (!changed.length) { console.log("Role dashboards and theme are already current. Nothing changed."); process.exit(0); }
const sha = (x) => crypto.createHash("sha256").update(x).digest("hex");
const backup = path.join(root,".role-dashboard-backups",new Date().toISOString().replace(/[:.]/g,"-")+"-"+process.pid);
fs.mkdirSync(backup,{recursive:true});
for (const x of changed) if (x.before !== null) { const p = path.join(backup,x.file); fs.mkdirSync(path.dirname(p),{recursive:true}); fs.writeFileSync(p,x.before,{flag:"wx"}); }
fs.writeFileSync(path.join(backup,"manifest.json"),JSON.stringify({files:changed.map((x)=>({path:x.file,created:x.before===null,before:x.before===null?null:sha(x.before),after:sha(x.after)}))},null,2));
const written=[];
try {
  for (const x of changed) {
    if (x.before !== null && sha(fs.readFileSync(x.file)) !== sha(x.before)) throw new Error(`Concurrent edit: ${x.file}`);
    fs.mkdirSync(path.dirname(x.file),{recursive:true}); fs.writeFileSync(x.file,x.after); written.push(x);
  }
} catch(error) { for(const x of written) { if(x.before===null) fs.unlinkSync(x.file); else fs.writeFileSync(x.file,x.before); } throw error; }
console.log(`Installed ${changed.length} changes. Backup: ${path.relative(root,backup)}`);
console.log("No backend, route protection, database schema, sidebar menu items, or Guru motion runtime changed.");
