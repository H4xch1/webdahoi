<a name="top"></a>

<p align="center">
  <img src="docs/readme-assets/rinascita-banner.svg" alt="Webdahoi — a considered space for learning, in navy and gold" width="100%" />
</p>

<h1 align="center">Webdahoi</h1>
<p align="center">A considered space for learning.</p>
<p align="center">Materi · Tugas · Ujian · Pengelolaan sekolah</p>
<p align="center">
  <a href="#explore">Explore</a> ·
  <a href="#quick-start">Quick start</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#design">Design</a> ·
  <a href="#field-guide">Field guide</a>
</p>

---

> **Project baseline: complete.** Webdahoi is documented as a completed project, with ongoing maintenance and visual refinements. Completion is the maintainer-declared project state—not an automated claim that every environment has passed a build, security audit, or deployment check.

Webdahoi is a role-based school portal built with **Next.js, TypeScript, Express, Prisma, and Neon PostgreSQL**. It brings learning materials, assignments, examinations, and school administration into distinct workspaces for the people who use them.

The interface follows **Rinascita**: deep navy, warm ivory, restrained gold, and purposeful movement. Content stays readable; decoration supports the work.

<a name="explore"></a>
## Explore

| Workspace | Purpose | Entry |
| :--- | :--- | :--- |
| Siswa / Murid | Materials, assignments, exams, and personal profile | `/murid` |
| Guru | Teaching content, assessment, and attendance | `/guru` |
| Kurikulum | Guru/Siswa accounts, assignments, and read-only teacher activity monitoring | `/kurikulum` |
| Kepala Sekolah | School summaries within the account's access | `/kepsek` |
| Administrator | User accounts and academic structure | `/admin` |

All workspaces use the existing login flow. A public page or a hidden menu is not the authorization boundary; protected API actions still enforce access rules.

<details>
<summary>Learning experience</summary>

- Materials and shared resources for the signed-in learner.
- Assignment instructions, submissions, and feedback through the existing workflows.
- Exam schedules, question flows, and results where the account has access.
- A responsive public landing page with hover shadows and once-on-entry scroll reveals.

</details>

<details>
<summary>Administration and monitoring</summary>

- Separate account-management areas for school roles.
- Kurikulum management of Guru/Siswa identity, placement, and teaching assignments.
- Read-only monitoring of teacher-created materials, assignments, exams, and related submissions.
- Existing academic-history protections remain part of the management flow.

</details>

<details>
<summary>Motion without getting in the way</summary>

- Directional dashboard entrances, bounded card reveals, and a gold sweep.
- Guru's existing native snapshot transition where the browser and navigation path support it.
- A bundled animated background loop in the Guru motion add-on; it is not a rigged Live2D model.
- Reduced-motion handling and visible fallback content.
- Query/hash-only changes do not trigger the pathname-based entrance layer.

Motion is progressive enhancement, not a prerequisite for navigation, authentication, or learning actions.

</details>

<a name="quick-start"></a>
## Quick start

Use a Node.js runtime supported by the installed Next.js version, npm, and a PostgreSQL/Neon database. Match the runtime selected for deployment.

```bash
git clone https://github.com/H4xch1/webdahoi.git
cd webdahoi
```

Create your environment files before installing dependencies. The backend runs `prisma generate` during `postinstall`.

<details open>
<summary>1 · Configure your environment</summary>

Create `backend/.env` with your own values:

```dotenv
DATABASE_URL="postgresql://USER:PASSWORD@POOLED_HOST/DATABASE?sslmode=require"
DIRECT_URL="postgresql://USER:PASSWORD@DIRECT_HOST/DATABASE?sslmode=require"
JWT_SECRET="REPLACE_WITH_A_LONG_RANDOM_SECRET"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:3000"
PORT="4000"
```

`DATABASE_URL` is the pooled runtime connection; `DIRECT_URL` is the direct connection configured in Prisma for database tooling. Copy actual connection strings from your own Neon project rather than using the placeholders above.

Create `frontend/.env.development.local`:

```dotenv
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000/api
```

For provider-specific authentication settings, retain the values required by your existing auth configuration. Do not replace a working `.env` file wholesale with this minimal example.

Never commit database credentials, JWT secrets, provider secrets, tokens, or real student data. `NEXT_PUBLIC_` values must not contain secrets.

</details>

<details>
<summary>2 · Install and prepare the database</summary>

Backend terminal:

```bash
cd backend
npm ci
npx prisma generate
```

For a fresh development database, apply the repository's existing migrations:

```bash
npx prisma migrate deploy
```

Use `prisma migrate dev` only when intentionally developing a schema change against a development database. Do not reset an existing school database as a routine setup or troubleshooting step.

Seeding is optional and changes database records. Review `backend/prisma/seed.ts` before choosing to run:

```bash
npm run seed
```

Frontend terminal, from the repository root:

```bash
cd frontend
npm ci
```

These commands assume the package lockfiles included with your working project are present and consistent.

</details>

<details>
<summary>3 · Run locally</summary>

Backend:

```bash
cd backend
npm run dev
```

Frontend, in a second terminal:

```bash
cd frontend
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:4000/api`
- Browser API requests use the existing `/backend-api` rewrite.

Use an account provisioned for your environment. No public demo password is published here.

</details>

<a name="deployment"></a>
## Deployment

The frontend and backend are deployed separately. Keep their environment settings separate too.

| Environment | Setting |
| :--- | :--- |
| Frontend production | `NEXT_PUBLIC_BACKEND_URL=https://YOUR_BACKEND_DOMAIN/api` |
| Backend production | Real database connections, `JWT_SECRET`, and `FRONTEND_URL` set for the frontend origin |
| Database | Existing migrations applied through a controlled deployment step |

The frontend configuration requires an absolute HTTPS backend URL ending in `/api` for production. It rejects localhost and loopback addresses—including during a local `next build`. Keep that guard.

<details>
<summary>Build locally without the localhost URL error</summary>

Create `frontend/.env.production.local`:

```dotenv
NEXT_PUBLIC_BACKEND_URL=https://YOUR_BACKEND_DOMAIN/api
```

Replace the example domain with the backend you actually deployed. The backend used during this project's setup was `https://webdahoi-beken.vercel.app/api`; confirm its ownership and availability before reusing it.

PowerShell session override, if needed:

```powershell
$env:NEXT_PUBLIC_BACKEND_URL = "https://YOUR_BACKEND_DOMAIN/api"
npm run build
```

A process-level variable overrides environment files. Remove an old override with:

```powershell
Remove-Item Env:NEXT_PUBLIC_BACKEND_URL -ErrorAction SilentlyContinue
```

Do not remove the production URL validation or edit generated `next.config.compiled.js` files to bypass the check.

</details>

<details>
<summary>Validation commands</summary>

Run separately in the appropriate directory:

```bash
# backend
npx tsc --noEmit
npm run build

# frontend
npx tsc --noEmit
npm run build
```

After deployment, check login/logout, role access, data loading, the `/backend-api` rewrite, and essential learning/management actions in your own environment. A successful compile alone does not validate live sessions or database access.

</details>

<a name="design"></a>
## Design

<p>
  <img src="docs/readme-assets/rinascita-palette.svg" alt="Rinascita palette: navy #0b1220, soft navy #101a30, panel #16223d, gold #d4af37, soft gold #e8cf7a, ivory #f3ecd8" width="100%" />
</p>

| Token | Hex | Use |
| :--- | :--- | :--- |
| `rinas-bg` | `#0b1220` | Page background |
| `rinas-bg-soft` | `#101a30` | Secondary surfaces |
| `rinas-panel` | `#16223d` | Panels and cards |
| `rinas-gold` | `#d4af37` | Primary accent |
| `rinas-gold-soft` | `#e8cf7a` | Highlights |
| `rinas-text` | `#f3ecd8` | Warm foreground |

Palette values originate in [`frontend/src/app/global.css`](frontend/src/app/global.css). Cinematic layers may use compatible local variations.

**Project conventions**

- Keep reusable CSS separate from TSX.
- Preserve mobile layouts, focus visibility, and reduced-motion behavior.
- Keep real loading/error states; do not substitute mock counts for failed requests.
- Treat hover glow, reveal effects, and transitions as supporting details.
- Preserve role permissions, submissions, grading, and historical data when making visual changes.

<a name="architecture"></a>
## Architecture

```text
Browser
  └─ Next.js frontend
      └─ /backend-api rewrite
          └─ Express API (/api)
              └─ Prisma
                  └─ Neon PostgreSQL
```

```text
webdahoi/
├─ backend/
│  ├─ prisma/          Schema, migrations, and seed
│  └─ src/             API, middleware, and server entrypoints
├─ frontend/
│  └─ src/
│     ├─ app/          Public pages, login, and role routes
│     ├─ components/   Reusable UI, dashboard, and motion layers
│     ├─ lib/          API helpers and application utilities
│     └─ styles/       Shared style tokens
└─ docs/               Maintainer guide and README artwork
```

<details>
<summary>Everyday commands</summary>

| Directory | Command | Purpose |
| :--- | :--- | :--- |
| `frontend` | `npm run dev` | Local Next.js server |
| `frontend` | `npm run build` | Production frontend build |
| `frontend` | `npm start` | Start the built frontend |
| `backend` | `npm run dev` | Watch `src/server.ts` with tsx |
| `backend` | `npm run build` | Compile backend TypeScript |
| `backend` | `npm start` | Run `dist/server.js` |
| `backend` | `npm run prisma:generate` | Generate Prisma Client |
| `backend` | `npm run prisma:studio` | Open database inspection UI |

Prisma Studio can expose/edit real records. Use it only against the intended database.

</details>

<a name="field-guide"></a>
## Field guide

<details>
<summary>Windows EPERM while generating/installing Prisma</summary>

Stop the relevant backend watcher or Prisma Studio process before retrying. Inspect process command lines rather than stopping all Node processes indiscriminately.

```powershell
Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" |
  Select-Object ProcessId, CommandLine |
  Format-List
```

Close the owning process normally. A locked `query_engine-windows.dll.node` is a local file-lock issue—not a reason to reset Neon or rerun migrations blindly.

</details>

<details>
<summary>Motion appears subtle or absent</summary>

Check the device's reduced-motion preference, route type, and browser support. Some paths use an entrance fallback rather than outgoing/incoming native snapshots. Query-only changes intentionally do not replay a whole page entrance.

The landing page reveals initially off-screen content once; content already visible at hydration is not hidden just to manufacture an entrance.

</details>

<details>
<summary>Working with the completed baseline</summary>

Commit the working baseline before applying a visual/documentation package. Inspect its dry run and backups where available. Review generated mobile overrides before treating them as a bespoke layout fix.

Keep secrets, exported student records, database dumps, `node_modules`, `.next`, and source backup folders out of public commits.

The supplied visual packages do not replace the project's business authorization checks.

</details>

## Documentation

- [Interactive local guide](docs/index.html) — open the HTML file after cloning/extracting. A repository file link is not a live hosted website.
- [Completed baseline and verification boundaries](docs/PROJECT-STATUS.md)
- [Documentation package installation](readme-refresh/INSTALL.md)

The GitHub README uses expandable sections and normal links. It does not rely on JavaScript, custom stylesheets, remote badge services, or a public deployment being online.

## Credits

Webdahoi · Haddy Setyo

Third-party dependencies and separately sourced assets retain their own notices. This README does not assign a new license to the application.

<p align="right"><a href="#top">Back to top</a></p>
