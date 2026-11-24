import fs from 'node:fs';import path from 'node:path';
const layout='frontend/src/app/(dashboard)/layout.tsx';
const motion='frontend/src/components/guru-motion/GuruMotionBoundary.tsx';
const line='import RouteMotion from "@/components/route-motion/RouteMotion";';
if(!fs.existsSync(layout)||!fs.existsSync('frontend/src/components/route-motion/RouteMotion.tsx'))throw Error('Extract into repository and run from its root.');
const changes=[];const before=fs.readFileSync(layout,'utf8');let after=before;
if(after.includes(line)!==after.includes('<RouteMotion>{children}</RouteMotion>'))throw Error('Partial installation detected. Restore/review layout; no writes made.');
if(!after.includes(line)){
 const main=/(<main\b[^>]*>)\s*\{children\}\s*(<\/main>)/g;
 if([...after.matchAll(main)].length!==1)throw Error('Unexpected main layout. No writes made. See manual integration in README.');
 after=after.replace(main,'$1<RouteMotion>{children}</RouteMotion>$2');
 after=line+'\n'+after;
}changes.push([layout,before,after]);
if(fs.existsSync(motion)){
 const old=fs.readFileSync(motion,'utf8');let next=old;
 const original='if (!page || isReduced() || typeof page.animate !== "function") return;';
 const guard='if (document.documentElement.hasAttribute("data-route-motion-active") || !page || isReduced() || typeof page.animate !== "function") return;';
 if(!next.includes(guard)){
   if(!next.includes(original))throw Error('Customized Guru fallback detected. No writes made: integrate its duplicate-animation guard manually.');
   next=next.replace(original,guard);
 }changes.push([motion,old,next]);
}
const changed=changes.filter(([,a,b])=>a!==b);
if(process.argv.includes('--dry-run')){console.log(JSON.stringify(changed.map(([file])=>file),null,2));process.exit(0);}
if(!changed.length){console.log('Already installed.');process.exit(0);}
const stamp=Date.now();for(const [file] of changed)fs.copyFileSync(file,`${file}.route-motion-backup-${stamp}`,fs.constants.COPYFILE_EXCL);
for(const [file,,content] of changed)fs.writeFileSync(file,content);
console.log(`Updated ${changed.length} files with timestamped backups. Existing authentication, native Guru transitions and backgrounds retained.`);
