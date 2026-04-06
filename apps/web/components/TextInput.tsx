"use client";

import { useState, useRef, useEffect } from "react";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  maxLength?: number;
  placeholder?: string;
  onDetectLanguage?: boolean;
}

export function TextInput({
  value,
  onChange,
  maxLength = 500,
  placeholder = "Enter your text here...",
  onDetectLanguage,
}: TextInputProps) {
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  const handleDetectLanguage = async () => {
    if (!onDetectLanguage || isDetecting) return;

    setIsDetecting(true);
    setDetectedLanguage(null);

    await new Promise((resolve) => setTimeout(resolve, 1000));

    setDetectedLanguage("English (US)");
    setIsDetecting(false);
  };

  const charCount = value.length;
  const isOverLimit = charCount > maxLength;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 resize-none focus:outline-none text-slate-700 text-lg leading-relaxed"
        rows={4}
      />

      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          {detectedLanguage && (
            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
              {detectedLanguage}
            </span>
          )}

          {onDetectLanguage && (
            <button
              onClick={handleDetectLanguage}
              disabled={isDetecting}
              className="flex items-center gap-1 px-3 py-1 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
            >
              {isDetecting ? (
                <svg
                  className="w-4 h-4 animate-spin"
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
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
              Detect Language
            </button>
          )}
        </div>

        <span
          className={`text-sm ${
            isOverLimit ? "text-red-500 font-medium" : "text-slate-500"
          }`}
        >
          {charCount}/{maxLength}
        </span>
      </div>
    </div>
  );
}
