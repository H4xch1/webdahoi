import Link from "next/link";

import CreateLearningForm from "../../_components/CreateLearningForm";

import shared from "../../guru-shared.module.css";
import styles from "./buat-tugas.module.css";

export default function BuatTugasPage() {
  return (
    <main className={`${shared.page} ${styles.page}`}>
      <header className={shared.header}>
        <div>
          <p className={shared.eyebrow}>Pembelajaran / Tugas</p>
          <h1 className={shared.title}>Buat Tugas</h1>
          <p className={shared.subtitle}>
            Tulis instruksi yang jelas dan tentukan tenggat pengumpulan.
          </p>
        </div>

        <Link href="/guru" className={shared.secondary}>
          ← Dashboard
        </Link>
      </header>

      <CreateLearningForm kind="tugas" />
    </main>
  );
}
