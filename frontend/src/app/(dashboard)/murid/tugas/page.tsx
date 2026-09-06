import Link from "next/link";
import { cookies } from "next/headers";
import styles from "./tugas.module.css";

async function getTugas() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/murid/tugas`, {
    headers: { Cookie: `token=${token}` },
    cache: "no-store",
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.tugas || [];
}

export default async function MuridTugasPage() {
  const tugas = await getTugas();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Daftar Tugas</h1>
      <div className={styles.grid}>
        {tugas.map((t: any) => (
          <Link key={t.id} href={`/murid/tugas/${t.id}`} className={styles.card}>
            <h3>{t.judul}</h3>
            <p>{t.deskripsi}</p>
            <span className={styles.deadline}>
              Deadline: {new Date(t.deadline).toLocaleDateString("id-ID")}
            </span>
          </Link>
        ))}
        {tugas.length === 0 && <p className={styles.empty}>Belum ada tugas.</p>}
      </div>
    </div>
  );
}
