"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api-client";
import styles from "./login.module.css";

const loginSchema = z.object({
  identifier: z.string().min(1, "NIS/NIK atau email wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(data: LoginForm) {
    setError(null);
    try {
      const res = await api.post<{ user: { role: string } }>("/auth/login", data);
      const roleRoute = res.user.role.toLowerCase().replace("_utama", "");
      router.push(`/${roleRoute}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal");
    }
  }

  return (
    <main className={styles.loginRoot}>
      <div className={styles.visualSide}>
        <div className={styles.visualOverlay} />
        <h2 className={styles.brand}>FIX</h2>
      </div>

      <div className={styles.formSide}>
        <div className={styles.card}>
          <h1 className={styles.cardTitle}>LOGIN</h1>
          <div className={styles.divider} />

          <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
            <label className={styles.label}>NIK / Email</label>
            <input
              className={styles.input}
              placeholder="Masukkan NIK atau email"
              {...register("identifier")}
            />
            {errors.identifier && (
              <p className={styles.errorText}>{errors.identifier.message}</p>
            )}

            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="Masukkan password"
              {...register("password")}
            />
            {errors.password && (
              <p className={styles.errorText}>{errors.password.message}</p>
            )}

            {error && <p className={styles.errorText}>{error}</p>}

            <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
