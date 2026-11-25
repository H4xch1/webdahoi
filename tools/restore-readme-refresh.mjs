import fs from "node:fs";import path from "node:path";import crypto from "node:crypto";
const root=process.cwd(),arg=process.argv[2];if(!arg)throw new Error("Pass .readme-refresh-backups/<timestamp>.");
const dir=path.resolve(root,arg);if(!dir.startsWith(path.join(root,".readme-refresh-backups")+path.sep))throw new Error("Invalid backup path.");
const m=JSON.parse(fs.readFileSync(path.join(dir,"manifest.json"),"utf8"));
const sha=x=>crypto.createHash("sha256").update(x).digest("hex");
if(sha(fs.readFileSync("README.md"))!==m.after)throw new Error("README was edited after installation. Restore manually after reviewing your changes.");
if(m.created)fs.unlinkSync("README.md");else{const old=fs.readFileSync(path.join(dir,"README.md"));if(sha(old)!==m.before)throw new Error("Backup checksum mismatch.");fs.writeFileSync("README.md",old);}
console.log("Previous README state restored. Additive documentation files remain.");
