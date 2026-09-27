import Link from "next/link";

import CreateLearningForm from "../../_components/CreateLearningForm";

import shared from "../../guru-shared.module.css";
import styles from "./buat-ujian.module.css";

export default function BuatUjianPage() {
  return (
    <main className={`${shared.page} ${styles.page}`}>
      <header className={shared.header}>
        <div>
          <p className={shared.eyebrow}>Penilaian / Ujian</p>
          <h1 className={shared.title}>Buat Ujian</h1>
          <p className={shared.subtitle}>
            Atur jadwal, durasi, soal pilihan ganda, dan kunci jawaban.
          </p>
        </div>

        <Link href="/guru" className={shared.secondary}>
          ← Dashboard
        </Link>
      </header>

      <CreateLearningForm kind="ujian" />
    </main>
  );
}
