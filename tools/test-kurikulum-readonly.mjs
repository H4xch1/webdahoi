// Node 20+; no data creation, editing, or deletion.
const base = (process.env.KURIKULUM_API_BASE ?? "http://localhost:4000/api").replace(/\/+$/, "");
const token = process.env.KURIKULUM_TOKEN;
if (!token) throw new Error("Set KURIKULUM_TOKEN to a test Kurikulum user's JWT. Do not commit the token.");
function assert(value, message) { if (!value) throw new Error(message); }
async function call(path, credential) {
  const response = await fetch(`${base}/kurikulum${path}`, {
    headers: credential ? { Authorization: `Bearer ${credential}` } : {},
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}
function noSecrets(value) {
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    assert(!["password", "googleId", "token"].includes(key), `Secret field exposed: ${key}`);
    noSecrets(item);
  }
}
const anonymous = await call("/overview");
assert(anonymous.status === 401, "Anonymous request should return 401.");
for (const endpoint of ["/overview", "/options", "/users?role=GURU", "/users?role=MURID"]) {
  const result = await call(endpoint, token);
  assert(result.status === 200, `Expected 200 at ${endpoint}, received ${result.status}`);
  noSecrets(result.body);
  if (result.body?.users) {
    const expected = endpoint.includes("GURU") ? "GURU" : "MURID";
    assert(result.body.users.every((user) => user.role === expected), "Unexpected role exposed.");
  }
  console.log(`PASS ${endpoint}`);
}
const forbiddenRole = await call("/users?role=ADMIN_UTAMA", token);
assert(forbiddenRole.status === 400, "Admin role filter must be rejected.");
for (const legacy of ["/materi", "/tugas", "/penilaian"]) {
  const result = await call(legacy, token);
  assert(result.status === 404, `Legacy ${legacy} must not remain accessible.`);
}
if (process.env.NON_KURIKULUM_TOKEN) {
  const result = await call("/overview", process.env.NON_KURIKULUM_TOKEN);
  assert(result.status === 403, "A non-Kurikulum account must receive 403.");
}
if (process.env.STAFF_USER_ID) {
  const result = await call(`/users/${encodeURIComponent(process.env.STAFF_USER_ID)}`, token);
  assert(result.status === 404, "Staff/Admin detail must not be exposed.");
}
console.log("Read-only checks passed. Manually test CRUD on disposable accounts in a non-production database.");
