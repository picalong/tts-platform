import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const AUTH_COOKIE = "auth_token";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const response = await fetch(`${API_URL}/subscriptions/current`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Error fetching subscription:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription" },
      { status: 500 },
    );
  }
}
