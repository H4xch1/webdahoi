import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
const root=process.cwd();
const target="frontend/src/app/page.tsx";
const template="landing-refresh/page.tsx";
for(const file of [target,template,"frontend/src/components/landing-rinascita/LandingReveal.tsx","frontend/src/components/landing-rinascita/landing.module.css","frontend/public/themes/landing-rinascita/academy.svg"]){
  if(!fs.existsSync(file))throw Error(`Missing ${file}. Extract into existing repository and run from its root.`);
}
const before=fs.readFileSync(target,"utf8"),after=fs.readFileSync(template,"utf8");
if(process.argv.includes("--dry-run")){console.log(JSON.stringify({changes:before===after?[]:[target],note:"Only the public home page is replaced. Existing root layout/CSS, login, dashboards and backend are untouched."},null,2));process.exit(0);}
if(before===after){console.log("Landing page already installed.");process.exit(0);}
const backup=path.join(root,".landing-refresh-backups",`${Date.now()}`);
fs.mkdirSync(backup,{recursive:true});fs.writeFileSync(path.join(backup,"page.tsx"),before);
const hash=(s)=>crypto.createHash("sha256").update(s).digest("hex");
fs.writeFileSync(path.join(backup,"manifest.json"),JSON.stringify({target,before:hash(before),after:hash(after)},null,2));
fs.writeFileSync(target,after);
console.log(`Landing installed. Backup: ${path.relative(root,backup)}`);
