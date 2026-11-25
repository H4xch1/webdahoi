import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root=process.cwd();
const template="readme-refresh/README.md";
if(!fs.existsSync("frontend/package.json")||!fs.existsSync("backend/package.json")||!fs.existsSync(template)) {
  throw new Error("Extract into Webdahoi and run from the repository root.");
}
for(const asset of ["docs/readme-assets/rinascita-banner.svg","docs/readme-assets/rinascita-palette.svg","docs/index.html","docs/guide.css","docs/guide.js","docs/PROJECT-STATUS.md","readme-refresh/INSTALL.md"]){
  if(!fs.existsSync(asset)) throw new Error(`Missing ${asset}. Nothing changed.`);
}
const after=fs.readFileSync(template,"utf8");
const before=fs.existsSync("README.md")?fs.readFileSync("README.md","utf8"):null;
if(process.argv.includes("--dry-run")){
  console.log(JSON.stringify({changes:before===after?[]:["README.md"],scope:"Documentation only. No app source, CSS runtime, configuration, dependencies, or database changes."},null,2));
  process.exit(0);
}
if(before===after){console.log("README is already current. Nothing changed.");process.exit(0);}
const backup=path.join(root,".readme-refresh-backups",String(Date.now()));
fs.mkdirSync(backup,{recursive:true});
if(before!==null)fs.writeFileSync(path.join(backup,"README.md"),before);
const sha=x=>crypto.createHash("sha256").update(x).digest("hex");
fs.writeFileSync(path.join(backup,"manifest.json"),JSON.stringify({created:before===null,before:before===null?null:sha(before),after:sha(after)},null,2));
fs.writeFileSync("README.md",after);
console.log(`README refreshed. Backup: ${path.relative(root,backup)}`);
console.log("Open docs/index.html locally for the optional interactive guide. No app rebuild is required.");
