### webdahoi
ketika dunia adalah menjadi benar adanya maka adalah ketika mengapa adalah apabila berujibajeo

# structures
```
D:\webdahoi
├── package.json ⬜ workspace root
├── README.md ⬜
│
├── backend
│ ├── .env ✅ DATABASE_URL, JWT_SECRET
│ ├── .env.example ⬜
│ ├── vercel.json ⬜
│ ├── prisma
│ │ ├── schema.prisma 🆕 +nik, +nip, +googleId, password nullable,
│ │ │ +Submission, +Soal, +JawabanUjian
│ │ ├── seed.ts ⬜ admin utama + jurusan + kelas
│ │ └── migrations\ 🆕
│ └── src
│ ├── index.ts ✅
│ ├── lib\prisma.ts ✅
│ ├── middleware
│ │ ├── auth.ts ✅
│ │ ├── authorize.ts ✅
│ │ └── validate.ts ✅
│ ├── utils
│ │ ├── jwt.ts 🔧 Role: ADMIN_UTAMA (fix)
│ │ └── password.ts ✅
│ ├── schemas
│ │ ├── auth.schema.ts 🔧 identifier → email
│ │ ├── tugas.schema.ts ⬜
│ │ └── ujian.schema.ts ⬜
│ └── routes
│ ├── auth.ts 🔧 login email + 🆕 POST /auth/google
│ ├── admin.ts 🔧 name/nik/nip
│ ├── guru.ts 🔧 createdById + submissions + nilai
│ ├── murid.ts 🔧 submissions + auto-grade ujian
│ ├── kepsek.ts ✅
│ └── kurikulum.ts ✅
│
└── frontend
├── .env.local 🆕 NEXTAUTH_SECRET, NEXTAUTH_URL,
│ GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
│ NEXT_PUBLIC_API_URL
├── package.json ✅
├── next.config.ts ✅
├── tsconfig.json ✅
├── postcss.config.mjs ✅
├── middleware.ts 🔧 pakai NextAuth token, bukan cookie manual
└── src
├── types
│ ├── index.ts 🔧 name/nik/nip, +Submission, +Soal
│ └── next-auth.d.ts 🆕 augment Session: role, kelasId, accessToken
├── lib
│ ├── utils.ts ✅
│ ├── api-client.ts 🔧 inject token dari session
│ └── auth.ts 🆕 NextAuth config (Credentials + Google)
├── components
│ ├── layout
│ │ ├── Sidebar.tsx + Sidebar.module.css ✅ (fix casing)
│ │ ├── topbar.tsx + topbar.module.css ⬜
│ │ └── welcome-username.tsx ⬜
│ ├── providers\SessionProvider.tsx 🆕
│ └── ui\ ✅ shadcn
└── app
├── layout.tsx 🔧 wrap SessionProvider
├── page.tsx + landing.module.css ✅
├── api\auth[...nextauth]\route.ts 🆕
├── (auth)
│ └── login\page.tsx + login.module.css 🔧 email + tombol Google
└── (dashboard)
├── layout.tsx + dashboard.module.css ✅
├── murid
│ ├── page.tsx ✅
│ ├── tugas\page.tsx | [id]\page.tsx ✅
│ ├── ujian\page.tsx | [id]\page.tsx ✅
│ └── materi\page.tsx ✅
├── guru
│ ├── page.tsx ✅
│ ├── absen\page.tsx ✅
│ ├── tugas\buat\page.tsx ✅
│ ├── tugas[id]\nilai\page.tsx ⬜ beri nilai submission
│ ├── ujian\buat\page.tsx ⬜ + builder soal PG
│ └── materi\buat\page.tsx ⬜
├── kepsek
│ ├── page.tsx | summary\page.tsx ✅
├── kurikulum
│ ├── page.tsx ✅
│ ├── guru\page.tsx ⬜
│ ├── materi\page.tsx ⬜
│ ├── tugas\page.tsx ⬜
│ ├── assessment\page.tsx ⬜
│ └── penilaian\page.tsx ⬜
└── admin
├── page.tsx ✅
├── murid\page.tsx ✅
├── guru\page.tsx ⬜
├── kepsek\page.tsx ⬜
├── kurikulum\page.tsx ⬜
└── register\page.tsx ⬜
```