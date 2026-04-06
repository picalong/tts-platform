"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { TextInput } from "@/components/TextInput";
import { VoiceSelector } from "@/components/VoiceSelector";
import { AudioPlayer } from "@/components/AudioPlayer";
import { SettingsPanel } from "@/components/SettingsPanel";
import {
  fetchVoices,
  generateTtsJob,
  getJobStatus,
  getCreditBalance,
} from "@/lib/api-client";
import { Voice, TtsJobStatus } from "@/lib/types";

interface Toast {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

export default function TtsPage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>("");
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<TtsJobStatus | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [creditBalance, setCreditBalance] = useState<number>(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isLoadingVoices, setIsLoadingVoices] = useState(true);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const addToast = useCallback((message: string, type: Toast["type"]) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const selectedVoiceData = voices.find((v) => v.id === selectedVoice);
  const estimatedCost = selectedVoiceData
    ? (text.length / 1000) * selectedVoiceData.creditCostPer1kChars
    : 0;

  useEffect(() => {
    const loadInitialData = async () => {
      setIsLoadingVoices(true);
      const [voicesRes, balanceRes] = await Promise.all([
        fetchVoices(),
        getCreditBalance(),
      ]);

      if (voicesRes.success && voicesRes.data) {
        setVoices(voicesRes.data);
        if (voicesRes.data.length > 0) {
          setSelectedVoice(voicesRes.data[0].id);
        }
      } else {
        addToast(voicesRes.error || "Failed to load voices", "error");
      }

      if (balanceRes.success && balanceRes.data) {
        setCreditBalance(balanceRes.data.balance);
      }

      setIsLoadingVoices(false);
    };

    loadInitialData();
  }, [addToast]);

  const pollJobStatus = useCallback((id: string) => {
    pollIntervalRef.current = setInterval(async () => {
      const result = await getJobStatus(id);
      if (result.success && result.data) {
        setJobStatus(result.data.status);

        if (result.data.status === TtsJobStatus.COMPLETED) {
          if (result.data.audioUrl) {
            setGeneratedAudio(result.data.audioUrl);
          }
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        } else if (result.data.status === TtsJobStatus.FAILED) {
          setErrorMessage(result.data.errorMessage || "Generation failed");
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      }
    }, 2000);
  }, []);

  const handleGenerate = async () => {
    if (!text.trim() || !selectedVoice) return;

    setIsGenerating(true);
    setErrorMessage(null);
    setGeneratedAudio(null);
    setJobId(null);
    setJobStatus(null);

    const result = await generateTtsJob(text, selectedVoice, speed, pitch);

    if (!result.success) {
      setIsGenerating(false);

      if (result.error === "INSUFFICIENT_CREDITS") {
        router.push("/billing");
        return;
      }

      addToast(result.error || "Generation failed", "error");
      setErrorMessage(result.error || "Generation failed");
      return;
    }

    if (result.data) {
      setJobId(result.data.jobId);
      setJobStatus(TtsJobStatus.PENDING);

      setCreditBalance((prev) =>
        Math.max(0, prev - result.data!.estimatedCredits),
      );

      pollJobStatus(result.data.jobId);
    }

    setIsGenerating(false);
  };

  const handleRetry = () => {
    setErrorMessage(null);
    handleGenerate();
  };

  const handleDownload = () => {
    if (!generatedAudio) return;
    const link = document.createElement("a");
    link.href = generatedAudio;
    link.download = "generated-audio.wav";
    link.click();
  };

  const handleDelete = () => {
    setGeneratedAudio(null);
    setJobId(null);
    setJobStatus(null);
  };

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
              px-4 py-3 rounded-lg shadow-lg text-white animate-slide-in
              ${toast.type === "error" ? "bg-red-500" : ""}
              ${toast.type === "success" ? "bg-green-500" : ""}
              ${toast.type === "info" ? "bg-blue-500" : ""}
            `}
          >
            {toast.message}
          </div>
        ))}
      </div>

      {/* Top Bar */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold text-slate-900">
              Welcome back, User!
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-sm font-medium">
              {creditBalance.toFixed(2)} credits
            </div>
            <button className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
              EN ▼
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Hero Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Convert Text to Speech
          </h2>
          <p className="text-slate-600">
            Transform your text into natural-sounding audio with our AI-powered
            voice generator
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button className="px-4 py-2 bg-purple-100 text-purple-700 font-medium rounded-lg hover:bg-purple-200 transition-colors">
            SRT Dubbing Beta
          </button>
          <button className="px-4 py-2 bg-blue-100 text-blue-700 font-medium rounded-lg hover:bg-blue-200 transition-colors">
            Multi-Voice New
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Input & Voice */}
          <div className="lg:col-span-2 space-y-6">
            {/* Text Input */}
            <TextInput
              value={text}
              onChange={setText}
              maxLength={500}
              placeholder="Enter your text here to convert to speech..."
              onDetectLanguage
            />

            {/* Voice Selector */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Select Voice
              </h3>
              {isLoadingVoices ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
                  <svg
                    className="animate-spin h-8 w-8 mx-auto text-slate-400"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  <p className="mt-2 text-slate-500">Loading voices...</p>
                </div>
              ) : (
                <VoiceSelector
                  voices={voices}
                  selectedVoice={selectedVoice}
                  onSelectVoice={setSelectedVoice}
                />
              )}
            </div>
          </div>

          {/* Right Column - Settings & Output */}
          <div className="space-y-6">
            {/* Settings */}
            <SettingsPanel
              speed={speed}
              pitch={pitch}
              onSpeedChange={setSpeed}
              onPitchChange={setPitch}
            />

            {/* Estimated Cost */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">Estimated Cost</span>
                <span className="text-xl font-bold text-slate-900">
                  {estimatedCost.toFixed(2)} credits
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {text.length} chars × {selectedVoiceData?.creditCostPer1kChars}{" "}
                cr/1k chars
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <svg
                    className="w-5 h-5 text-red-500 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-700 text-sm">{errorMessage}</p>
                    <button
                      onClick={handleRetry}
                      className="mt-2 text-sm font-medium text-red-600 hover:text-red-800"
                    >
                      Retry →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!text.trim() || !selectedVoice || isGenerating}
              className="w-full py-4 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <svg
                    className="w-5 h-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  Generate Audio
                </>
              )}
            </button>

            {/* Job Status */}
            {jobId && !generatedAudio && (
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {jobStatus === TtsJobStatus.PENDING && (
                      <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse" />
                    )}
                    {jobStatus === TtsJobStatus.PROCESSING && (
                      <svg
                        className="w-5 h-5 text-blue-500 animate-spin"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                    )}
                    {jobStatus === TtsJobStatus.COMPLETED && (
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                    {jobStatus === TtsJobStatus.FAILED && (
                      <svg
                        className="w-5 h-5 text-red-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Job {jobId.slice(0, 8)}...
                    </p>
                    <p className="text-xs text-slate-500 capitalize">
                      {jobStatus?.toLowerCase() || "pending"}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Audio Player */}
            {generatedAudio ? (
              <AudioPlayer
                src={generatedAudio}
                onDownload={handleDownload}
                onDelete={handleDelete}
              />
            ) : (
              <AudioPlayer />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
