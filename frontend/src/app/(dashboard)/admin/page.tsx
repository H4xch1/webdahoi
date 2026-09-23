"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminApi, type AdminUser } from "@/lib/adminApi";
import { exportExcel } from "@/lib/exportExcel";
import styles from "./page.module.css";

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi
      .listUsers()
      .then(setUsers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const guru = users.filter((u) => u.role === "GURU");
  const siswa = users.filter((u) => u.role === "MURID");
  const admin = users.filter((u) => u.role === "ADMIN_UTAMA");

  const blocks = [
    { title: "Data Guru", rows: guru, href: "/admin/guru", file: "data-guru" },
    { title: "Data Siswa", rows: siswa, href: "/admin/murid", file: "data-siswa" },
    { title: "Data Admin", rows: admin, href: "/admin/admin", file: "data-admin" },
  ];

  return (
    <main className={styles.page}>
      <section className={styles.greeting}>
        <h1 className={styles.title}>Halo, Admin</h1>
        <p className={styles.subtitle}>Kelola data pengguna dan kelas di sini.</p>
      </section>

      {loading ? (
        <p className={styles.loading}>Memuat data...</p>
      ) : (
        <section className={styles.grid}>
          {blocks.map((b) => (
            <article key={b.title} className={styles.card}>
              <h2 className={styles.cardTitle}>{b.title}</h2>
              <p className={styles.count}>{b.rows.length}</p>
              <div className={styles.actions}>
                <Link className={styles.link} href={b.href}>Kelola</Link>
                <button
                  className={styles.export}
                  onClick={() =>
                    exportExcel(
                      b.file,
                      b.rows.map((u) => ({
                        NIK: u.nik ?? u.nis ?? u.nip ?? "",
                        Nama: u.name,
                        Role: u.role,
                      }))
                    )
                  }
                >
                  Export Excel
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
