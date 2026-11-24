import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
const root=process.cwd();
if(!fs.existsSync(path.join(root,'frontend/package.json'))) throw Error('Run from Webdahoi repository root.');
const dry=process.argv.includes('--dry-run');
const skip=new Set(['node_modules','.git','.next','.vercel','.turbo','dist','build','out','coverage','output','vendor','vendors','third_party','mobile-responsive-patch','.mobile-css-backups']);
const found=[];
function walk(dir){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isSymbolicLink())continue;if(e.isDirectory()){if(!skip.has(e.name)&&!/backup/i.test(e.name))walk(p);}else if(e.isFile()&&e.name.endsWith('.css'))found.push(p);}}
walk(root);
const START='/* WEBDAHOI MOBILE ALL V1 START */',END='/* WEBDAHOI MOBILE ALL V1 END */';
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
// A small lexical scanner: braces in quoted strings/comments are ignored.
function mask(s){let a=s.split('');for(let i=0;i<s.length;i++){if(s[i]==='/'&&s[i+1]==='*'){const j=s.indexOf('*/',i+2);if(j<0)throw Error('Unclosed comment');for(let k=i;k<j+2;k++)a[k]=' ';i=j+1;}else if(s[i]==='"'||s[i]==="'"){const q=s[i];a[i]=' ';let j=i+1;for(;j<s.length;j++){a[j]=' ';if(s[j]==='\\'){if(j+1<s.length)a[++j]=' ';continue;}if(s[j]===q)break;}if(j===s.length)throw Error('Unclosed string');i=j;}else if(s[i]==='\\'){a[i]=' ';if(i+1<s.length)a[++i]=' ';}}return a.join('');}
function split(s,sep){const m=mask(s),out=[];let n=0,p=0,b=0,c=0;for(let i=0;i<m.length;i++){if(m[i]==='(')p++;if(m[i]===')')p--;if(m[i]==='[')b++;if(m[i]===']')b--;if(m[i]==='{')c++;if(m[i]==='}')c--;if(m[i]===sep&&!p&&!b&&!c){out.push(s.slice(n,i));n=i+1;}}out.push(s.slice(n));return out;}
function rules(s){const m=mask(s),out=[];let level=0,p=0,b=0;for(const c of m){if(c==='{')level++;if(c==='}')level--;if(c==='(')p++;if(c===')')p--;if(c==='[')b++;if(c===']')b--;if(level<0||p<0||b<0)throw Error('Unbalanced CSS');}if(level||p||b)throw Error('Unbalanced CSS');let n=0;p=0;b=0;for(let i=0;i<m.length;i++){const c=m[i];if(c==='(')p++;if(c===')')p--;if(c==='[')b++;if(c===']')b--;if(p||b)continue;if(c===';'){n=i+1;continue;}if(c!=='{')continue;let j=i+1,d=1;for(;j<m.length&&d;j++){if(m[j]==='{')d++;if(m[j]==='}')d--;}const head=s.slice(n,i).replace(/\/\*[\s\S]*?\*\//g,' ').trim(),body=s.slice(i+1,j-1);if(head&&!head.startsWith('@')&&!mask(body).includes('{')){const v=new Map();for(const part of split(body,';')){const k=part.indexOf(':');if(k>0)v.set(part.slice(0,k).replace(/\/\*[\s\S]*?\*\//g,' ').trim().toLowerCase(),part.slice(k+1).trim());}for(const sel of split(head,','))out.push({s:sel.trim(),v});}i=j-1;n=j;}return out;}
const specialDir=path.join(root,'mobile-responsive-patch/profiles');
const plan=[];
for(const file of found){const rel=path.relative(root,file).split(path.sep).join('/'),original=fs.readFileSync(file,'utf8');let base=original;const a=base.indexOf(START),z=base.indexOf(END);if(a>=0||z>=0){if(a<0||z<a||base.indexOf(START,a+START.length)>=0)throw Error(`Broken patch markers: ${rel}`);base=base.slice(0,a>0&&base[a-1]==='\n'?a-1:a)+base.slice(z+END.length).replace(/^\r?\n/,'');}
 const parsed=rules(base),bucket=new Map(),warnings=[];
 function add(bp,s,v){const key=bp+'|'+s;if(!bucket.has(key))bucket.set(key,{bp,s,v:{}});Object.assign(bucket.get(key).v,v);}
 for(const {s,v} of parsed){if(!s.startsWith('.')||/::|:(hover|focus|active|disabled|checked|has|global|not)\b/.test(s))continue;const name=[...s.matchAll(/\.([A-Za-z_][\w-]*)/g)].at(-1)?.[1]?.toLowerCase()??'';
 const layout=/^(page|container|wrapper|content|main|shell|hero|header|panel|card|stat|form|banner|record|teacher|profilehero|formside|infocard|contentcard)$/.test(name);
 const stats=/^(stats|metrics|statsgrid|summarygrid)$/.test(name),semantic=/calendar|timetable|heatmap|board/.test(name);
 if(layout)add(768,s,{'min-width':'0','max-width':'100%'});
 if(v.get('display')?.includes('grid')&&v.has('grid-template-columns')){if(semantic||v.has('grid-template-areas'))warnings.push(`Check semantic/named-area grid manually: ${s}`);else if(stats){add(768,s,{'grid-template-columns':'repeat(2, minmax(0, 1fr))',gap:'12px'});add(359,s,{'grid-template-columns':'minmax(0, 1fr)'});}else{if(/form|assignment|info|columns/i.test(name))add(1024,s,{'grid-template-columns':'minmax(0, 1fr)'});add(768,s,{'grid-template-columns':'minmax(0, 1fr)'});}}
 if(v.get('display')?.includes('flex')&&/^(header|hero|toolbar|filterbar|searchcontrols|actions|rowactions|loadactions|pagination|tabs|shell)$/.test(name)){add(768,s,{'flex-wrap':'wrap',gap:'10px'});if(/^(header|hero|toolbar|filterbar|shell)$/.test(name))add(768,s,{'flex-direction':'column','align-items':'stretch'});}
 if(/table(wrap|wrapper|container|scroll)/i.test(name))add(768,s,{'width':'100%','min-width':'0','overflow-x':'auto','overscroll-behavior-inline':'contain'});
 if(!/check|radio|toggle|switch|range/.test(s.toLowerCase())&&(/^(input|select|textarea|searchinput|filterselect)$/.test(name)||/\s(input|select|textarea)$/.test(s)))add(768,s,{'min-width':'0','max-width':'100%','font-size':'16px','min-height':'44px'});
 if(/button$|btn$|^(primary|secondary|danger|submit|delete|reload|tab|activetab)$/.test(name))add(768,s,{'min-height':'44px','max-width':'100%','white-space':'normal','overflow-wrap':'anywhere'});
 if(layout){const pad=v.get('padding')??'';if(/^(\d*\.?\d+(px|rem)\s*){1,4}$/.test(pad)&&[...pad.matchAll(/(\d*\.?\d+)(px|rem)/g)].some(m=>Number(m[1])*(m[2]==='rem'?16:1)>20))add(768,s,{padding:/page|content/.test(name)?'16px 12px':'20px 16px'});if(/^\d+(?:\.\d+)?(?:px|rem)$/.test(v.get('width')??'')){const m=v.get('width').match(/([\d.]+)(px|rem)/);if(Number(m[1])*(m[2]==='rem'?16:1)>=220)add(768,s,{width:`min(100%, ${v.get('width')})`,'min-width':'0'});}}
 if(/^(modal|modalcard|dialog)$/.test(name))add(768,s,{'max-width':'calc(100vw - 24px)','max-height':'calc(100dvh - 24px)','overflow-y':'auto'});
 if(/span\s+[2-9]|^[2-9]/.test(v.get('grid-column')??''))warnings.push(`Check explicit grid span: ${s}`);
 }
 let profile=null;
 if(rel.endsWith('frontend/src/app/(dashboard)/dashboard.module.css'))profile='dashboard';
 if(rel.endsWith('frontend/src/components/layout/Sidebar.module.css'))profile='sidebar';
 if(/frontend\/src\/app\/globals?\.css$/.test(rel))profile='global';
 if(rel.endsWith('frontend/src/app/landing.module.css'))profile='landing';
 if(rel.endsWith('frontend/src/app/(auth)/login/login.module.css'))profile='login';
 if(rel.endsWith('frontend/src/app/guru-cinematic.css'))profile='cinematic';
 if(rel.endsWith('frontend/src/components/guru-motion/guru-motion.css'))profile='motion';
 if(rel.endsWith('frontend/src/components/admin/UserTable.module.css'))profile='table';
 let patch='';for(const bp of [1024,768,480,359]){const vals=[...bucket.values()].filter(x=>x.bp===bp);if(vals.length)patch+=`@media screen and (max-width: ${bp}px) {\n${vals.map(x=>`  ${x.s} { ${Object.entries(x.v).map(([k,v])=>`${k}: ${v};`).join(' ')} }`).join('\n')}\n}\n`;}
 if(profile)patch+=fs.readFileSync(path.join(specialDir,profile+'.css'),'utf8');
 if(/@(layer|scope|container|supports)\b/.test(base))warnings.push('Rules within layer/scope/container/supports are preserved; check these manually.');
 const output=patch?`${base}\n${START}\n${patch}${END}\n`:base;rules(output);
 plan.push({rel,file,original,output,profile,warnings,changed:original!==output});
}
const report={scanned:plan.length,changed:plan.filter(x=>x.changed).length,files:plan.map(x=>({path:x.rel,status:x.changed?'patch':x.output.includes(START)?'already-patched':'audited-no-generated-layout-rules',profile:x.profile,warnings:x.warnings}))};
if(dry){console.log(JSON.stringify(report,null,2));process.exit(0);}
const changed=plan.filter(x=>x.changed);if(!changed.length){console.log(JSON.stringify(report,null,2));process.exit(0);}
const backup=path.join(root,'.mobile-css-backups',new Date().toISOString().replace(/[:.]/g,'-'));
fs.mkdirSync(backup,{recursive:true});
for(const x of changed){const p=path.join(backup,x.rel);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,x.original,{flag:'wx'});}
fs.writeFileSync(path.join(backup,'manifest.json'),JSON.stringify({files:changed.map(x=>({path:x.rel,before:hash(x.original),after:hash(x.output)}))},null,2));
const written=[];try{for(const x of changed){if(hash(fs.readFileSync(x.file))!==hash(x.original))throw Error(`File edited during install: ${x.rel}`);fs.writeFileSync(x.file,x.output);written.push(x);}}catch(e){for(const x of written)fs.writeFileSync(x.file,x.original);throw e;}
fs.writeFileSync(path.join(backup,'report.json'),JSON.stringify(report,null,2));
console.log(`Scanned ${plan.length} first-party CSS files; updated ${changed.length}.`);
console.log(`Backup/report: ${path.relative(root,backup)}`);
console.log('Run the frontend build and inspect mobile screens. Report warnings require manual review.');
