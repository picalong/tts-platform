"use client";

interface SettingsPanelProps {
  speed: number;
  pitch: number;
  onSpeedChange: (speed: number) => void;
  onPitchChange: (pitch: number) => void;
}

export function SettingsPanel({
  speed,
  pitch,
  onSpeedChange,
  onPitchChange,
}: SettingsPanelProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-900 mb-4">Settings</h3>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Speed</label>
            <span className="text-sm text-slate-500">{speed}x</span>
          </div>
          <input
            type="range"
            min="0.25"
            max="4"
            step="0.25"
            value={speed}
            onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>0.25x</span>
            <span>4x</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Pitch</label>
            <span className="text-sm text-slate-500">{pitch}</span>
          </div>
          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={pitch}
            onChange={(e) => onPitchChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
          />
          <div className="flex justify-between text-xs text-slate-400 mt-1">
            <span>-12</span>
            <span>+12</span>
          </div>
        </div>
      </div>
    </div>
  );
}
