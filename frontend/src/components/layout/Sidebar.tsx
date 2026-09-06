"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ClipboardList, BookOpen, FileText, LogOut, Users, BarChart3 } from "lucide-react";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import styles from "./Sidebar.module.css";


interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  murid: [
    { label: "Home", href: "/murid", icon: <Home size={18} /> },
    { label: "Tugas", href: "/murid/tugas", icon: <ClipboardList size={18} /> },
    { label: "Materi", href: "/murid/materi", icon: <BookOpen size={18} /> },
    { label: "Ujian", href: "/murid/ujian", icon: <FileText size={18} /> },
  ],
  guru: [
    { label: "Home", href: "/guru", icon: <Home size={18} /> },
    { label: "Tugas", href: "/guru/tugas", icon: <ClipboardList size={18} /> },
    { label: "Materi", href: "/guru/materi", icon: <BookOpen size={18} /> },
    { label: "Ujian", href: "/guru/ujian", icon: <FileText size={18} /> },
    { label: "Absen", href: "/guru/absen", icon: <Users size={18} /> },
  ],
  kepsek: [
    { label: "Home", href: "/kepsek", icon: <Home size={18} /> },
    { label: "Summary", href: "/kepsek/summary", icon: <BarChart3 size={18} /> },
    { label: "Guru", href: "/kepsek/guru", icon: <Users size={18} /> },
  ],
  kurikulum: [
    { label: "Home", href: "/kurikulum", icon: <Home size={18} /> },
    { label: "Guru", href: "/kurikulum/guru", icon: <Users size={18} /> },
    { label: "Materi", href: "/kurikulum/materi", icon: <BookOpen size={18} /> },
    { label: "Tugas", href: "/kurikulum/tugas", icon: <ClipboardList size={18} /> },
    { label: "Penilaian", href: "/kurikulum/penilaian", icon: <FileText size={18} /> },
  ],
  admin: [
    { label: "Home", href: "/admin", icon: <Home size={18} /> },
    { label: "Murid", href: "/admin/murid", icon: <Users size={18} /> },
    { label: "Guru", href: "/admin/guru", icon: <Users size={18} /> },
    { label: "Kepsek", href: "/admin/kepsek", icon: <Users size={18} /> },
    { label: "Kurikulum", href: "/admin/kurikulum", icon: <Users size={18} /> },
  ],
};

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const items = NAV_BY_ROLE[role] || [];

  async function handleLogout() {
    await api.post("/auth/logout");
    router.push("/login");
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoWrap}>
        <div className={styles.logo}>⏳</div>
      </div>

      <nav className={styles.nav}>
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(styles.navItem, active && styles.navItemActive)}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <button onClick={handleLogout} className={styles.logoutBtn}>
        <LogOut size={16} />
        Log Out
      </button>
    </aside>
  );
}
