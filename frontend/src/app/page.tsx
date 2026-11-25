import Link from "next/link";
import type { Metadata } from "next";
import { ArrowUpRight, BookOpen, ClipboardList, FileText, Users, ShieldCheck, GraduationCap } from "lucide-react";
import LandingReveal from "@/components/landing-rinascita/LandingReveal";
import styles from "@/components/landing-rinascita/landing.module.css";

export const metadata: Metadata = {
  title: "Webdahoi — Ruang Belajar Digital",
  description: "Portal pembelajaran untuk mengakses materi, tugas, dan ujian dalam ruang kerja sekolah yang terarah.",
};
const features = [
  { icon: BookOpen, number: "01", title: "Ilmu selalu dekat", text: "Temukan materi dari guru mata pelajaran dan buka sumber belajar yang dibagikan untuk kelasmu.", tag: "Materi pembelajaran" },
  { icon: ClipboardList, number: "02", title: "Langkah lebih terarah", text: "Baca instruksi tugas, perhatikan tenggat, dan ikuti alur pengumpulan yang tersedia.", tag: "Tugas dan pengumpulan" },
  { icon: FileText, number: "03", title: "Persiapan yang berarti", text: "Periksa jadwal dan ketentuan ujian sebelum mengerjakan melalui akun sekolahmu.", tag: "Ujian digital" },
];
const roles = [
  { title: "Siswa", caption: "Belajar dan bertumbuh", text: "Akses materi kelas, tugas, ujian, dan profil melalui ruang belajar pribadi." },
  { title: "Guru", caption: "Mendampingi proses belajar", text: "Siapkan materi, tugas, dan ujian serta kelola penilaian dan kehadiran." },
  { title: "Kurikulum", caption: "Menjaga arah pembelajaran", text: "Atur akun Guru/Siswa dan penugasan, lalu tinjau aktivitas pembelajaran." },
  { title: "Kepala Sekolah & Admin", caption: "Melihat dan menata", text: "Gunakan ringkasan dan pengelolaan sekolah sesuai kewenangan akun masing-masing." },
];
const faqs = [
  ["Bagaimana cara mulai menggunakan portal?", "Pilih Masuk Portal, lalu gunakan akun yang telah disiapkan sekolah. Hubungi pengelola sekolah jika kamu belum memiliki akun."],
  ["Apakah setiap peran melihat menu yang sama?", "Tidak. Menu dan tindakan mengikuti peran akun. Siswa, Guru, Kurikulum, Kepala Sekolah, dan Admin memiliki ruang kerja masing-masing."],
  ["Bisakah portal dibuka melalui ponsel?", "Halaman ini dirancang responsif. Untuk kegiatan belajar, periksa juga petunjuk guru dan pastikan koneksi tersedia, terutama saat ujian atau mengirim tugas."],
];
export default function LandingPage() {
  return <main className={styles.root} data-landing-root="">
    <LandingReveal />
    <a className={styles.skip} href="#konten">Lewati navigasi</a>
    <header className={styles.header}><div className={styles.navInner}>
      <Link href="/" className={styles.brand} aria-label="Webdahoi — Beranda"><span className={styles.brandIcon}><GraduationCap size={23} aria-hidden="true" /></span>
        <span>Webdahoi<small>LEARNING PORTAL</small></span></Link>
      <nav className={styles.desktopNav} aria-label="Navigasi utama"><a href="#fitur">Fitur</a><a href="#peran">Ruang peran</a><a href="#alur">Cara mulai</a></nav>
      <Link className={styles.navLogin} href="/login">Masuk Portal <ArrowUpRight size={15} aria-hidden="true" /></Link>
    </div><nav className={styles.mobileNav} aria-label="Navigasi bagian halaman"><a href="#fitur">Fitur</a><a href="#peran">Peran</a><a href="#alur">Cara mulai</a><a href="#faq">FAQ</a></nav></header>

    <section className={styles.hero} id="konten" aria-labelledby="hero-title">
      <div className={styles.heroCopy}><p className={styles.eyebrow}><span /> Ruang untuk belajar dan bertumbuh</p>
        <h1 id="hero-title">Setiap ilmu,<br />membuka <em>cakrawala.</em></h1>
        <p className={styles.lead}>Tempat materi, tugas, dan ujian bertemu. Hadirkan perjalanan belajar yang lebih terarah dalam satu portal sekolah.</p>
        <div className={styles.actions}><Link className={styles.primary} href="/login">Mulai perjalananmu <ArrowUpRight size={18} aria-hidden="true" /></Link><a className={styles.secondary} href="#fitur">Jelajahi fitur</a></div>
        <p className={styles.heroNote}><ShieldCheck size={16} aria-hidden="true" /> Ruang kerja mengikuti peran akun sekolah.</p>
      </div>
      <div className={styles.heroArt} aria-hidden="true"><div className={styles.artFrame}>
        {/* Original local vector artwork, no external image request. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/themes/landing-rinascita/academy.svg" width="720" height="860" alt="" fetchPriority="high" />
        <div className={styles.artLabel}><span>WEBDAHOI / LEARNING PORTAL</span><p>Belajar hari ini.<br /><em>Melangkah lebih jauh.</em></p></div>
      </div><span className={styles.artSeal}><BookOpen size={24} /><small>Knowledge<br />opens doors</small></span></div>
    </section>

    <div className={styles.ribbon} aria-hidden="true"><span>Materi</span><i /><span>Tugas</span><i /><span>Ujian</span><i /><span>Kolaborasi</span></div>

    <section className={styles.section} id="fitur" aria-labelledby="feature-title">
      <div className={styles.sectionHeading} data-reveal=""><div><p className={styles.eyebrow}>Didesain untuk keseharian sekolah</p><h2 id="feature-title">Lebih tertata.<br /><em>Lebih bermakna.</em></h2></div><p className={styles.sectionIntro}>Fokus pada hal yang penting: memahami pelajaran, menyelesaikan tanggung jawab, dan melanjutkan proses belajar.</p></div>
      <div className={styles.featureGrid}>{features.map(({ icon: Icon, ...feature }) => <article className={styles.featureCard} key={feature.number} data-reveal="">
        <div className={styles.cardTop}><span className={styles.icon}><Icon size={25} aria-hidden="true" /></span><span className={styles.cardNumber}>{feature.number}</span></div>
        <p className={styles.tag}>{feature.tag}</p><h3>{feature.title}</h3><p>{feature.text}</p><Link href="/login">Masuk untuk menjelajah <ArrowUpRight size={16} aria-hidden="true" /></Link>
      </article>)}</div>
    </section>

    <section className={styles.roleSection} id="peran" aria-labelledby="role-title"><div className={styles.section}>
      <div className={styles.sectionHeading} data-reveal=""><div><p className={styles.eyebrow}>Satu sekolah, beragam peran</p><h2 id="role-title">Ruang yang tepat<br />untuk <em>setiap langkah.</em></h2></div><Users size={52} className={styles.sectionIcon} aria-hidden="true" /></div>
      <div className={styles.roleGrid}>{roles.map((role, i) => <article className={styles.roleCard} key={role.title} data-reveal=""><span className={styles.roleNumber}>0{i + 1}</span><div><p className={styles.tag}>{role.caption}</p><h3>{role.title}</h3><p>{role.text}</p></div></article>)}</div>
    </div></section>

    <section className={styles.section} id="alur" aria-labelledby="steps-title"><div className={styles.sectionHeading} data-reveal=""><div><p className={styles.eyebrow}>Mulai dengan sederhana</p><h2 id="steps-title">Tiga langkah,<br /><em>satu ruang belajar.</em></h2></div></div>
      <ol className={styles.steps}>{[["Masuk dengan akun", "Gunakan identitas akun yang telah disiapkan sekolah."], ["Temukan ruangmu", "Buka menu yang tersedia sesuai peran dan akses akun."], ["Lanjutkan aktivitas", "Akses materi atau kelola kegiatan belajar melalui dashboard."]].map(([title, text], i) => <li key={title} data-reveal=""><span>0{i + 1}</span><h3>{title}</h3><p>{text}</p></li>)}</ol>
    </section>

    <section className={styles.faqSection} id="faq" aria-labelledby="faq-title"><div data-reveal=""><p className={styles.eyebrow}>Sebelum memulai</p><h2 id="faq-title">Ada yang ingin<br /><em>kamu ketahui?</em></h2></div><div className={styles.faqList}>{faqs.map(([question, answer]) => <details key={question} className={styles.faq} data-reveal=""><summary>{question}<span aria-hidden="true">+</span></summary><p>{answer}</p></details>)}</div></section>

    <section className={styles.cta} data-reveal="" aria-labelledby="cta-title"><p className={styles.eyebrow}>Langkah berikutnya dimulai di sini</p><h2 id="cta-title">Siap membuka<br /><em>cakrawala baru?</em></h2><p>Masuk dan temukan ruang belajarmu di Webdahoi.</p><Link className={styles.primary} href="/login">Masuk Portal <ArrowUpRight size={18} aria-hidden="true" /></Link></section>
    <footer className={styles.footer}><Link href="/" className={styles.footerBrand}>Webdahoi</Link><p>© {new Date().getFullYear()} Webdahoi — Haddy Setyo</p><a href="#konten">Kembali ke atas ↑</a></footer>
  </main>;
}
