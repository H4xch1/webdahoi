import fs from "node:fs";import path from "node:path";import crypto from "node:crypto";
const root=process.cwd(),arg=process.argv[2];if(!arg)throw Error("Pass the printed .landing-refresh-backups/<timestamp> directory.");
const backup=path.resolve(root,arg);if(!backup.startsWith(path.join(root,".landing-refresh-backups")+path.sep))throw Error("Invalid backup directory.");
const m=JSON.parse(fs.readFileSync(path.join(backup,"manifest.json"),"utf8"));if(m.target!=="frontend/src/app/page.tsx")throw Error("Unexpected target.");
const hash=x=>crypto.createHash("sha256").update(x).digest("hex");const before=fs.readFileSync(path.join(backup,"page.tsx"));
if(hash(before)!==m.before||hash(fs.readFileSync(m.target))!==m.after)throw Error("Backup mismatch or later edits detected. Review and restore manually.");
fs.writeFileSync(m.target,before);console.log("Previous public landing restored. Other pages were not changed.");
