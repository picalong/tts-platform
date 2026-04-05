export interface CookieOptions {
  name: string;
  value: string;
  options?: {
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
  };
}

export const AUTH_COOKIE_NAME = "auth_token";
export const AUTH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60;

export function createAuthCookie(token: string): CookieOptions {
  return {
    name: AUTH_COOKIE_NAME,
    value: token,
    options: {
      maxAge: AUTH_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}

export function createLogoutCookie(): CookieOptions {
  return {
    name: AUTH_COOKIE_NAME,
    value: "",
    options: {
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    },
  };
}
