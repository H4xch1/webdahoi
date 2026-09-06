import styles from "./kurikulum.module.css";

export default function KurikulumHome() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Selamat Pagi, Tim Kurikulum</h1>
      <p className={styles.note}>
        Anda memiliki akses lihat-saja (read-only) untuk memantau aktivitas guru,
        materi, tugas, dan penilaian di seluruh kelas.
      </p>
    </div>
  );
}
