import Link from "next/link";

import CreateLearningForm from "../../_components/CreateLearningForm";

import shared from "../../guru-shared.module.css";
import styles from "./buat-materi.module.css";

export default function BuatMateriPage() {
  return (
    <main className={`${shared.page} ${styles.page}`}>
      <header className={shared.header}>
        <div>
          <p className={shared.eyebrow}>Pembelajaran / Materi</p>
          <h1 className={shared.title}>Buat Materi</h1>
          <p className={shared.subtitle}>
            Bagikan penjelasan dan bahan belajar untuk kelas Anda.
          </p>
        </div>

        <Link href="/guru" className={shared.secondary}>
          ← Dashboard
        </Link>
      </header>

      <CreateLearningForm kind="materi" />
    </main>
  );
}
