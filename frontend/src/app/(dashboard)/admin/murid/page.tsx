"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import styles from "./murid-admin.module.css";

interface MuridRow {
  id: string;
  name: string;
  email: string;
}

export default function AdminMuridPage() {
  const [murid, setMurid] = useState<MuridRow[]>([]);

  useEffect(() => {
    api.get<{ users: MuridRow[] }>("/admin/users").then((res) => setMurid(res.users));
  }, []);

  async function handleDelete(id: string) {
    await api.delete(`/admin/users/${id}`);
    setMurid((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Data Murid</h1>
        <button className={styles.registerBtn}>Register Murid +</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Email</th>
            <th>Nama Lengkap</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {murid.map((m) => (
            <tr key={m.id}>
              <td>{m.email}</td>
              <td>{m.name}</td>
              <td>
                <button className={styles.deleteBtn} onClick={() => handleDelete(m.id)}>
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
