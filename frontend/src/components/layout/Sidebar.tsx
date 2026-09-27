"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  ClipboardList,
  BookOpen,
  FileText,
  LogOut,
  Users,
  BarChart3,
  ShieldCheck,
  UserPlus,
} from "lucide-react";

import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import styles from "./Sidebar.module.css";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
  exact?: boolean;
}

const NAV_BY_ROLE: Record<string, NavItem[]> = {
  murid: [
    {
      label: "Home",
      href: "/murid",
      icon: <Home size={18} />,
      exact: true,
    },
    {
      label: "Tugas",
      href: "/murid/tugas",
      icon: <ClipboardList size={18} />,
    },
    {
      label: "Materi",
      href: "/murid/materi",
      icon: <BookOpen size={18} />,
    },
    {
      label: "Ujian",
      href: "/murid/ujian",
      icon: <FileText size={18} />,
    },
  ],

  guru: [
    {
      label: "Home",
      href: "/guru",
      icon: <Home size={18} />,
      exact: true,
    },
    {
      label: "Tugas",
      href: "/guru/tugas",
      icon: <ClipboardList size={18} />,
    },
    {
      label: "Materi",
      href: "/guru/materi",
      icon: <BookOpen size={18} />,
    },
    {
      label: "Ujian",
      href: "/guru/ujian",
      icon: <FileText size={18} />,
    },
    {
      label: "Absen",
      href: "/guru/absen",
      icon: <Users size={18} />,
    },
  ],

  kepsek: [
    {
      label: "Home",
      href: "/kepsek",
      icon: <Home size={18} />,
      exact: true,
    },
    {
      label: "Summary",
      href: "/kepsek/summary",
      icon: <BarChart3 size={18} />,
    },
    {
      label: "Guru",
      href: "/kepsek/guru",
      icon: <Users size={18} />,
    },
  ],

  kurikulum: [
    {
      label: "Home",
      href: "/kurikulum",
      icon: <Home size={18} />,
      exact: true,
    },
    {
      label: "Guru",
      href: "/kurikulum/guru",
      icon: <Users size={18} />,
    },
    {
      label: "Materi",
      href: "/kurikulum/materi",
      icon: <BookOpen size={18} />,
    },
    {
      label: "Tugas",
      href: "/kurikulum/tugas",
      icon: <ClipboardList size={18} />,
    },
    {
      label: "Penilaian",
      href: "/kurikulum/penilaian",
      icon: <FileText size={18} />,
    },
  ],

  admin: [
    {
      label: "Home",
      href: "/admin",
      icon: <Home size={18} />,
      exact: true,
    },
    {
      label: "Manage Murid",
      href: "/admin/murid",
      icon: <Users size={18} />,
    },
    {
      label: "Manage Guru",
      href: "/admin/guru",
      icon: <Users size={18} />,
    },
    {
      label: "Manage Kepsek",
      href: "/admin/kepsek",
      icon: <Users size={18} />,
    },
    {
      label: "Manage Kurikulum",
      href: "/admin/kurikulum",
      icon: <Users size={18} />,
    },
    {
      label: "Manage Admin",
      href: "/admin/admin",
      icon: <ShieldCheck size={18} />,
    },
  ],
};

export default function Sidebar({ role }: { role: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const normalizedRole = role.trim().toLowerCase();
  const roleKey =
    normalizedRole === "admin_utama" ? "admin" : normalizedRole;

  const items = NAV_BY_ROLE[roleKey] ?? [];

  async function handleLogout() {
    if (isLoggingOut) return;

    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      await api.post("/auth/logout");
      router.replace("/login");
      router.refresh();
    } catch {
      setLogoutError("Gagal logout. Silakan coba lagi.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logoWrap}>
        <div className={styles.logo} aria-label="Logo">
          ⏳
        </div>
      </div>

      <nav className={styles.nav} aria-label="Navigasi utama">
        {items.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href ||
              pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                styles.navItem,
                active && styles.navItemActive
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {logoutError && (
        <p
          role="alert"
          style={{
            color: "#fca5a5",
            fontSize: "0.8rem",
            padding: "0 1rem",
          }}
        >
          {logoutError}
        </p>
      )}

      <button
        type="button"
        onClick={handleLogout}
        disabled={isLoggingOut}
        className={styles.logoutBtn}
      >
        <LogOut size={16} />
        <span>{isLoggingOut ? "Logging out..." : "Log Out"}</span>
      </button>
    </aside>
  );
}
