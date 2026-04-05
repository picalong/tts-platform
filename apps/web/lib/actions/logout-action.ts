"use server";

import { cookies } from "next/headers";
import { createLogoutCookie } from "../cookies";

export interface ActionResult {
  success: boolean;
  error?: string;
}

export async function logoutAction(): Promise<ActionResult> {
  try {
    const cookie = createLogoutCookie();
    const cookieStore = await cookies();
    cookieStore.set(cookie.name, cookie.value, cookie.options);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Logout failed",
    };
  }
}
