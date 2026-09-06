import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "NIS/NIK atau email wajib diisi"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export type LoginInput = z.infer<typeof loginSchema>;
