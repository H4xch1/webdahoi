import { apiClient } from "./api-client";

export interface LoginPayload {
  identifier: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: string;
    nama: string;
    role: "MURID" | "GURU" | "ADMIN" | "KEPSEK" | "KURIKULUM";
  };
}

export async function login(payload: LoginPayload) {
  return apiClient<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function logout() {
  return apiClient("/auth/logout", { method: "POST" });
}

export async function getMe(token?: string) {
  return apiClient("/auth/me", { token });
}
