"use client";

import { useEffect, useState } from "react";
import {
  guruApi,
  errorMessage,
  type GuruOptions,
} from "@/lib/guruApi";

import shared from "../guru-shared.module.css";

export function useGuruOptions() {
  const [options, setOptions] = useState<GuruOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError("");

    guruApi
      .options(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setOptions(result);
      })
      .catch((err: unknown) => {
        if (!controller.signal.aborted) setError(errorMessage(err));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [attempt]);

  return {
    options,
    loading,
    error,
    retry: () => setAttempt((value) => value + 1),
  };
}

interface ClassSubjectFieldsProps {
  options: GuruOptions;
  kelasId: string;
  mapelId: string;
  onClassChange: (value: string) => void;
  onSubjectChange: (value: string) => void;
  disabled?: boolean;
}

export function ClassSubjectFields({
  options,
  kelasId,
  mapelId,
  onClassChange,
  onSubjectChange,
  disabled = false,
}: ClassSubjectFieldsProps) {
  const selectedClass = options.kelas.find(
    (kelas) => kelas.id === kelasId,
  );

  return (
    <>
      <label className={shared.field}>
        Kelas
        <select
          className={shared.select}
          value={kelasId}
          required
          disabled={disabled}
          onChange={(event) => {
            onClassChange(event.target.value);
            onSubjectChange("");
          }}
        >
          <option value="">Pilih kelas</option>
          {options.kelas.map((kelas) => (
            <option key={kelas.id} value={kelas.id}>
              {kelas.nama} — {kelas.jurusan.nama}
            </option>
          ))}
        </select>
      </label>

      <label className={shared.field}>
        Mata pelajaran
        <select
          className={shared.select}
          value={mapelId}
          required
          disabled={disabled || !kelasId}
          onChange={(event) => onSubjectChange(event.target.value)}
        >
          <option value="">Pilih mata pelajaran</option>
          {selectedClass?.mapel.map((mapel) => (
            <option key={mapel.id} value={mapel.id}>
              {mapel.nama}
            </option>
          ))}
        </select>
      </label>

      {selectedClass && selectedClass.mapel.length === 0 && (
        <p className={`${shared.notice} ${shared.full}`}>
          Belum ada mata pelajaran yang ditugaskan kepada Anda pada
          kelas ini. Hubungi admin untuk mengatur penugasan guru dan
          mata pelajaran kelas.
        </p>
      )}
    </>
  );
}
