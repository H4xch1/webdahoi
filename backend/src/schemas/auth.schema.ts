import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string({ error: "NIK / NIP / email wajib diisi" })
    .trim()
    .min(1, { message: "NIK / NIP / email wajib diisi" })
    .max(100, { message: "Identifier terlalu panjang" }),

  password: z
    .string({ error: "Password wajib diisi" })
    .min(6, { message: "Password minimal 6 karakter" })
    .max(72, { message: "Password maksimal 72 karakter" }),
});

export const googleLoginSchema = z.object({
  idToken: z
    .string({ error: "idToken wajib dikirim" })
    .trim()
    .min(10, { message: "idToken tidak valid" }),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type GoogleLoginInput = z.infer<typeof googleLoginSchema>;
