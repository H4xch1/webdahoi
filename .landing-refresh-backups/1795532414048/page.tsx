import Link from "next/link";
import styles from "./landing.module.css";

export default function LandingPage() {
  return (
    <main className={styles.landingRoot}>
      <div className={styles.overlay} />
      <nav className={styles.nav}>
        <span className={styles.logoText}>FIX</span>
        <Link href="/login" className={styles.loginBtn}>
          Login
        </Link>
      </nav>

      <section className={styles.hero}>
        <h1 className={styles.title}>Selamat Datang</h1>
        <p className={styles.subtitle}>Forum Informasi dan eXam</p>
        <Link href="/login" className={styles.ctaBtn}>
          Masuk Sekarang
        </Link>
      </section>

      <section className={styles.infoRow}>
        <div className={styles.infoCard}>
          <h3>Tugas &amp; Ujian</h3>
          <p>Kelola dan kerjakan tugas serta ujian secara digital.</p>
        </div>
        <div className={styles.infoCard}>
          <h3>Materi Belajar</h3>
          <p>Akses materi pelajaran dari guru mata pelajaran kamu.</p>
        </div>
        <div className={styles.infoCard}>
          <h3>Pantauan Nilai</h3>
          <p>Lihat perkembangan nilai secara transparan dan real-time.</p>
        </div>
      </section>

      <footer className={styles.footer}>
        © {new Date().getFullYear()} FIX — Haddy Setyo
      </footer>
    </main>
  );
}
