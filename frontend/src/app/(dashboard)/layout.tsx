import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import styles from "./dashboard.module.css";

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) return null;

  const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/me`, {
    headers: { Cookie: `token=${token}` },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const data = await getCurrentUser();
  if (!data?.user) redirect("/login");

  const role = data.user.role.toLowerCase().replace("_utama", "");

  return (
    <div className={styles.shell}>
      <Sidebar role={role} />
      <main className={styles.content}>{children}</main>
    </div>
  );
}
