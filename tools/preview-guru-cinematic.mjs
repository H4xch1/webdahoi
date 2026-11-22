import http from "node:http";
import fs from "node:fs";
import path from "node:path";
const files = new Map([
  ["/", ["preview/guru-theme.html", "text/html; charset=utf-8"]],
  ["/preview-base.css", ["preview/preview-base.css", "text/css; charset=utf-8"]],
  ["/guru-cinematic.css", ["frontend/src/app/guru-cinematic.css", "text/css; charset=utf-8"]],
]);
const assetDirectory = "frontend/public/themes/guru-cinematic";
if (!fs.existsSync(assetDirectory)) throw new Error("Run from the extracted package or Webdahoi repository root.");
for (const name of fs.readdirSync(assetDirectory)) {
  if (!/^[a-z0-9-]+\.(svg|png)$/.test(name)) continue;
  files.set(`/themes/guru-cinematic/${name}`, [`${assetDirectory}/${name}`, name.endsWith(".svg") ? "image/svg+xml" : "image/png"]);
}
const server = http.createServer((req, res) => {
  const pathname = new URL(req.url ?? "/", "http://localhost").pathname;
  const entry = files.get(pathname);
  if (!entry) { res.writeHead(404); res.end("Static preview: this route is not functional."); return; }
  const [file, type] = entry;
  res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" });
  fs.createReadStream(path.resolve(file)).pipe(res);
});
server.listen(4173, "127.0.0.1", () => console.log("Open http://127.0.0.1:4173 — static design preview, not your school data. Ctrl+C stops it."));
server.on("error", (error) => { console.error(error.message); process.exitCode = 1; });
