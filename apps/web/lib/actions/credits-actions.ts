"use server";

import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "../cookies";

export interface CreditBalance {
  userId: string;
  balance: number;
  tier: string;
}

export interface TransactionHistory {
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    description: string;
    createdAt: string;
  }>;
  total: number;
  page: number;
  limit: number;
}

export async function getCreditBalance(): Promise<{
  success: boolean;
  data?: CreditBalance;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/credits/balance`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await result.json();

    if (!result.ok) {
      return { success: false, error: data.message || "Failed to get balance" };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getCreditHistory(
  page = 1,
  limit = 20,
): Promise<{
  success: boolean;
  data?: TransactionHistory;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/credits/history?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await result.json();

    if (!result.ok) {
      return { success: false, error: data.message || "Failed to get history" };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getSubscriptionTiers(): Promise<{
  success: boolean;
  data?: Array<{
    tier: string;
    name: string;
    creditsPerMonth: number;
    features: string[];
  }>;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const result = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/subscriptions/tiers`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await result.json();

    if (!result.ok) {
      return { success: false, error: data.message || "Failed to get tiers" };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
