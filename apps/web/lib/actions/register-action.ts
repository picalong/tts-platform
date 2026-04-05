"use server";

import { cookies } from "next/headers";
import { api, RegisterInput } from "../api";
import { createAuthCookie } from "../cookies";

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: {
    id: string;
    email: string;
    name: string;
    credits: number;
    tier: string;
  };
}

export async function registerAction(
  formData: FormData,
): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const name = formData.get("name") as string;

  if (!email || !password || !name) {
    return { success: false, error: "All fields are required" };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  const input: RegisterInput = { email, password, name };
  const result = await api.auth.register(input);

  if (!result.success || !result.data) {
    return { success: false, error: result.error || "Registration failed" };
  }

  const cookie = createAuthCookie(result.data.accessToken);
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, cookie.value, cookie.options);

  return {
    success: true,
    data: result.data.user,
  };
}
