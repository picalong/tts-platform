"use server";

import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "../cookies";

export interface TtsJobResult {
  success: boolean;
  jobId?: string;
  estimatedCredits?: number;
  status?: string;
  error?: string;
}

export async function generateTtsAction(
  text: string,
  voiceId: string,
  speed?: number,
  pitch?: number,
): Promise<TtsJobResult> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tts/generate`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, voiceId, speed, pitch }),
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "Generation failed" };
    }

    return {
      success: true,
      jobId: data.jobId,
      estimatedCredits: data.estimatedCredits,
      status: data.status,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getTtsJobsAction(
  page = 1,
  limit = 20,
): Promise<{
  success: boolean;
  data?: {
    jobs: Array<{
      id: string;
      status: string;
      text: string;
      creditCost: number;
      audioUrl: string | null;
      createdAt: string;
    }>;
    total: number;
  };
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tts/jobs?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to get jobs" };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getTtsJobStatusAction(jobId: string): Promise<{
  success: boolean;
  data?: {
    id: string;
    status: string;
    audioUrl: string | null;
    errorMessage: string | null;
    creditCost: number;
  };
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tts/jobs/${jobId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to get job" };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getVoicesAction(): Promise<{
  success: boolean;
  data?: Array<{
    id: string;
    name: string;
    provider: string;
    language: string;
    gender: string;
    type: string;
    creditCostPer1kChars: number;
  }>;
  error?: string;
}> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/tts/voices`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    const data = await response.json();

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to get voices" };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}
