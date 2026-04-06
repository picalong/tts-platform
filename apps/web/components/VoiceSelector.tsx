"use client";

import { useState, useRef } from "react";

export interface Voice {
  id: string;
  name: string;
  provider: "google" | "azure" | "openai" | string;
  language: string;
  gender: "male" | "female" | "neutral";
  type: "standard" | "neural" | "premium";
  creditCostPer1kChars: number;
  usageCount?: number;
  previewUrl?: string | null;
}

interface VoiceSelectorProps {
  voices: Voice[];
  selectedVoice: string;
  onSelectVoice: (voiceId: string) => void;
}

export function VoiceSelector({
  voices,
  selectedVoice,
  onSelectVoice,
}: VoiceSelectorProps) {
  const [activeTab, setActiveTab] = useState<
    "all" | "google" | "azure" | "openai"
  >("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const providerTabs = [
    { id: "all", label: "ALL" },
    { id: "google", label: "GOOGLE" },
    { id: "azure", label: "AZURE" },
    { id: "openai", label: "OPENAI" },
  ] as const;

  const filteredVoices = voices.filter((voice) => {
    const matchesTab = activeTab === "all" || voice.provider === activeTab;
    const matchesSearch =
      searchQuery === "" ||
      voice.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voice.language.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handlePreview = (voice: Voice) => {
    if (playingPreview === voice.id) {
      audioRef.current?.pause();
      setPlayingPreview(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    if (voice.previewUrl) {
      const audio = new Audio(voice.previewUrl);
      audioRef.current = audio;
      audio.play();
      setPlayingPreview(voice.id);
      audio.onended = () => setPlayingPreview(null);
    }
  };

  const providerColors: Record<string, string> = {
    google: "bg-blue-100 text-blue-700",
    azure: "bg-purple-100 text-purple-700",
    openai: "bg-green-100 text-green-700",
  };

  const typeColors: Record<string, string> = {
    standard: "bg-gray-100 text-gray-600",
    neural: "bg-indigo-100 text-indigo-600",
    premium: "bg-amber-100 text-amber-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        {providerTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 px-4 py-3 text-sm font-medium transition-colors
              ${
                activeTab === tab.id
                  ? "text-slate-900 border-b-2 border-slate-900 bg-slate-50"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-200">
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            placeholder="Search voices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-200 focus:border-slate-400"
          />
        </div>
      </div>

      {/* Voice List */}
      <div className="max-h-80 overflow-y-auto">
        {filteredVoices.map((voice) => (
          <div
            key={voice.id}
            onClick={() => onSelectVoice(voice.id)}
            className={`
              flex items-center justify-between px-4 py-3 text-left cursor-pointer transition-colors
              ${
                selectedVoice === voice.id
                  ? "bg-slate-100 border-l-4 border-slate-900"
                  : "hover:bg-slate-50 border-l-4 border-transparent"
              }
            `}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-900">{voice.name}</span>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${providerColors[voice.provider]}`}
                >
                  {voice.provider.toUpperCase()}
                </span>
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${typeColors[voice.type]}`}
                >
                  {voice.type.toUpperCase()}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                <span>{voice.language}</span>
                <span>{voice.gender}</span>
                {voice.usageCount !== undefined && (
                  <span className="text-slate-400">
                    {voice.usageCount} uses
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-slate-600">
                {voice.creditCostPer1kChars} cr/1k
              </span>
              {voice.previewUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(voice);
                  }}
                  className={`
                    p-2 rounded-full transition-colors
                    ${
                      playingPreview === voice.id
                        ? "bg-red-500 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }
                  `}
                >
                  {playingPreview === voice.id ? (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
