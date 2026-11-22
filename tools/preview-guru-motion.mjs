import http from "node:http";
import fs from "node:fs";
const table = new Map([
  ["/", ["preview-guru-motion/index.html", "text/html; charset=utf-8"]],
  ["/demo.css", ["preview-guru-motion/demo.css", "text/css; charset=utf-8"]],
  ["/demo.js", ["preview-guru-motion/demo.js", "text/javascript; charset=utf-8"]],
  ["/guru-motion.css", ["frontend/src/components/guru-motion/guru-motion.css", "text/css; charset=utf-8"]],
  ["/themes/guru-motion/academy-loop.webp", ["frontend/public/themes/guru-motion/academy-loop.webp", "image/webp"]],
  ["/themes/guru-motion/academy-poster.webp", ["frontend/public/themes/guru-motion/academy-poster.webp", "image/webp"]],
]);
for (const [, [file]] of table) if (!fs.existsSync(file)) throw new Error(`Missing ${file}. Run from package/repository root.`);
const server = http.createServer((req, res) => {
  const entry = table.get(new URL(req.url ?? "/", "http://localhost").pathname);
  if (!entry) { res.writeHead(404); res.end("Not found"); return; }
  res.writeHead(200, { "Content-Type": entry[1], "Cache-Control": "no-store" });
  fs.createReadStream(entry[0]).pipe(res);
});
server.listen(4174, "127.0.0.1", () => console.log("Static motion demo: http://127.0.0.1:4174 — no school data. Ctrl+C to stop."));
server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
