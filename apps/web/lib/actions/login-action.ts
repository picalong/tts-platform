"use server";

import { cookies } from "next/headers";
import { api, LoginInput } from "../api";
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

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  const input: LoginInput = { email, password };
  const result = await api.auth.login(input);

  if (!result.success || !result.data) {
    return { success: false, error: result.error || "Login failed" };
  }

  const cookie = createAuthCookie(result.data.accessToken);
  const cookieStore = await cookies();
  cookieStore.set(cookie.name, cookie.value, cookie.options);

  return {
    success: true,
    data: result.data.user,
  };
}
