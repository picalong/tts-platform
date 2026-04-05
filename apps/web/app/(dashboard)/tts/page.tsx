"use client";

import { useState, useEffect } from "react";
import { generateTtsAction, getVoicesAction } from "@/lib/actions";

const MOCK_VOICES = [
  {
    id: "mock-1",
    name: "Google en-US-Standard-A",
    provider: "google",
    language: "en-US",
    gender: "female",
    type: "standard",
    creditCostPer1kChars: 1.0,
  },
  {
    id: "mock-2",
    name: "Google en-US-Standard-B",
    provider: "google",
    language: "en-US",
    gender: "male",
    type: "standard",
    creditCostPer1kChars: 1.0,
  },
  {
    id: "mock-3",
    name: "Azure en-US-JennyNeural",
    provider: "azure",
    language: "en-US",
    gender: "female",
    type: "neural",
    creditCostPer1kChars: 1.5,
  },
  {
    id: "mock-4",
    name: "OpenAI alloy",
    provider: "openai",
    language: "en-US",
    gender: "neutral",
    type: "premium",
    creditCostPer1kChars: 2.0,
  },
];

export default function TtsPage() {
  const [text, setText] = useState("");
  const [voiceId, setVoiceId] = useState(MOCK_VOICES[0].id);
  const [speed, setSpeed] = useState(1);
  const [pitch, setPitch] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [estimatedCost, setEstimatedCost] = useState(0);

  useEffect(() => {
    const voice = MOCK_VOICES.find((v) => v.id === voiceId);
    if (voice && text) {
      const cost = (text.length / 1000) * voice.creditCostPer1kChars;
      setEstimatedCost(cost);
    }
  }, [text, voiceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setJobId(null);
    setStatus(null);

    const result = await generateTtsAction(text, voiceId, speed, pitch);

    setLoading(false);

    if (result.success && result.jobId) {
      setJobId(result.jobId);
      setStatus(result.status || "pending");
    } else {
      setError(result.error || "Generation failed");
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Text to Speech</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Generate Audio</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Text to Convert
              </label>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter your text here..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md h-40 resize-none"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                {text.length} characters
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Voice
              </label>
              <select
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {MOCK_VOICES.map((voice) => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} ({voice.gender}, {voice.type}) -{" "}
                    {voice.creditCostPer1kChars} credits/1k chars
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Speed ({speed}x)
                </label>
                <input
                  type="range"
                  min="0.25"
                  max="4"
                  step="0.25"
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pitch ({pitch})
                </label>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={pitch}
                  onChange={(e) => setPitch(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Estimated Cost:</span>
                <span className="text-lg font-bold text-blue-600">
                  {estimatedCost.toFixed(2)} credits
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !text.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Generating..." : "Generate Audio"}
            </button>
          </form>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Job Status</h2>

          {jobId ? (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Job ID</p>
                <p className="font-mono text-sm">{jobId}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                    status === "completed"
                      ? "bg-green-100 text-green-800"
                      : status === "failed"
                        ? "bg-red-100 text-red-800"
                        : status === "processing"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {status || "pending"}
                </span>
              </div>

              {status === "completed" && (
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 mb-2">Audio ready!</p>
                  <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">
                    Download Audio
                  </button>
                </div>
              )}

              {status === "pending" || status === "processing" ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Submit a job to see its status here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
