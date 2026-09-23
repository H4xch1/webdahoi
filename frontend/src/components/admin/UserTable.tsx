"use client";

import type { AdminUser } from "@/lib/adminApi";
import styles from "./UserTable.module.css";

type Props = {
  users: AdminUser[];
  showRole?: boolean;
  onDelete: (id: string) => void;
};

export default function UserTable({ users, showRole = false, onDelete }: Props) {
  if (!users.length) return <p className={styles.empty}>Belum ada data.</p>;

  return (
    <table className={styles.table}>
      <thead>
        <tr>
          <th>NIK</th>
          <th>Nama Lengkap</th>
          {showRole && <th>Role</th>}
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => (
          <tr key={u.id}>
            <td>{u.nik ?? u.nis ?? u.nip ?? "-"}</td>
            <td>{u.name}</td>
            {showRole && <td>{u.role}</td>}
            <td>
              <button className={styles.delete} onClick={() => onDelete(u.id)}>
                Hapus
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
