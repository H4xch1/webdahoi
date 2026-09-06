import styles from "./kepsek.module.css";

const CARDS = [
  { title: "Data Guru", accent: "gold" },
  { title: "Data Siswa", accent: "green" },
  { title: "Data Admin", accent: "red" },
];

export default function KepsekHome() {
  return (
    <div className={styles.page}>
      <div className={styles.banner}>
        <h1>Selamat Pagi, Kepala Sekolah</h1>
      </div>

      <div className={styles.cardRow}>
        {CARDS.map((c) => (
          <div key={c.title} className={styles.card}>
            <div className={`${styles.cardTop} ${styles[c.accent]}`} />
            <div className={styles.cardBody}>
              <h3>{c.title}</h3>
              <button className={styles.exportBtn}>Export Excel</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
