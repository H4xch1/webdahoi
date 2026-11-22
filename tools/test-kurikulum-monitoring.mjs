// Node 20+. GET-only integration checks; no production data is changed.
const base = (process.env.KURIKULUM_API_BASE ?? "http://localhost:4000/api").replace(/\/+$/, "");
const token = process.env.KURIKULUM_TOKEN;
if (!token) throw new Error("Set KURIKULUM_TOKEN for a test Kurikulum account. Never commit JWTs.");
function assert(value, message) { if (!value) throw new Error(message); }
function checkFields(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, child] of Object.entries(value)) {
    assert(!["password", "googleId", "token", "jawabanBenar"].includes(key), `Unexpected field: ${key}`);
    checkFields(child);
  }
}
async function call(suffix, jwt = token) {
  const response = await fetch(`${base}/kurikulum${suffix}`, {
    headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}
assert((await call("/monitoring/options", "")).status === 401, "Anonymous access must be rejected.");
for (const endpoint of ["/monitoring/options", "/monitoring/overview", "/users?role=GURU", "/users?role=MURID"]) {
  const result = await call(endpoint);
  assert(result.status === 200, `Expected 200: ${endpoint}, got ${result.status}`);
  checkFields(result.body);
  console.log(`PASS ${endpoint}`);
}
for (const kind of ["materi", "tugas", "ujian"]) {
  const list = await call(`/monitoring/items?kind=${kind}&page=1&limit=12`);
  assert(list.status === 200 && Array.isArray(list.body?.items), `Invalid ${kind} list`);
  checkFields(list.body);
  if (list.body.items[0]) {
    const id = encodeURIComponent(list.body.items[0].id);
    const detail = await call(`/monitoring/items/${kind}/${id}`);
    assert(detail.status === 200, `Invalid ${kind} detail`); checkFields(detail.body);
    if (kind !== "materi") {
      const related = await call(`/monitoring/${kind}/${id}/${kind === "tugas" ? "submissions" : "questions"}`);
      assert(related.status === 200, `Invalid ${kind} related data`); checkFields(related.body);
    }
  }
  console.log(`PASS ${kind} list and available detail`);
}
if (process.env.NON_KURIKULUM_TOKEN) {
  const result = await call("/monitoring/overview", process.env.NON_KURIKULUM_TOKEN);
  assert(result.status === 403, "Non-Kurikulum account must be denied.");
}
console.log("GET-only checks passed. Empty lists skip detail checks. CRUD permissions remain a separate test.");
