"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api-client";
import styles from "./detail.module.css";

export default function TugasDetailPage() {
  const { id } = useParams();
  const [fileUrl, setFileUrl] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [nilai, setNilai] = useState<number | null>(null);

  async function handleSubmit() {
    await api.post(`/murid/tugas/${id}/submit`, { fileUrl });
    setSubmitted(true);
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Tugas B.Indo</h1>
      <p className={styles.desc}>Kerjakan tugas dan kumpulkan melalui link gambar.</p>

      {!submitted ? (
        <div className={styles.formBox}>
          <label className={styles.label}>Image Link</label>
          <input
            className={styles.input}
            placeholder="https://..."
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
          />
          {fileUrl && (
            <div className={styles.preview}>
              <span>Preview:</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={fileUrl} alt="preview" className={styles.previewImg} />
            </div>
          )}
          <button className={styles.submitBtn} onClick={handleSubmit}>
            Submit
          </button>
        </div>
      ) : (
        <div className={styles.resultBox}>
          <p>Tugas berhasil dikumpulkan.</p>
          {nilai !== null && <p className={styles.nilai}>Nilai: {nilai}</p>}
        </div>
      )}
    </div>
  );
}
