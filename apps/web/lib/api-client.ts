"use server";

import { cookies } from "next/headers";
import type { Voice, ApiResponse, TtsJobResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value;
}

export async function fetchVoices(): Promise<ApiResponse<Voice[]>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${API_URL}/tts/voices`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to fetch voices",
      };
    }

    return { success: true, data: data.voices || data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function generateTtsJob(
  text: string,
  voiceId: string,
  speed = 1,
  pitch = 0,
): Promise<ApiResponse<{ jobId: string; estimatedCredits: number }>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${API_URL}/tts/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, voiceId, speed, pitch }),
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 402 || data.code === "INSUFFICIENT_CREDITS") {
        return {
          success: false,
          error: "INSUFFICIENT_CREDITS",
          data: undefined,
        };
      }
      return { success: false, error: data.message || "Generation failed" };
    }

    return {
      success: true,
      data: {
        jobId: data.jobId,
        estimatedCredits: data.estimatedCredits,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getJobStatus(
  jobId: string,
): Promise<ApiResponse<TtsJobResponse>> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${API_URL}/tts/jobs/${jobId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.message || "Failed to get job status",
      };
    }

    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
}

export async function getCreditBalance(): Promise<
  ApiResponse<{ balance: number; tier: string }>
> {
  try {
    const token = await getAuthToken();
    if (!token) {
      return { success: false, error: "Not authenticated" };
    }

    const response = await fetch(`${API_URL}/credits/balance`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
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
