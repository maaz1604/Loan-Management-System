'use client';

interface RangeSliderProps {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export default function RangeSlider({ label, min, max, step, value, onChange, formatValue }: RangeSliderProps) {
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-300">{label}</label>
        <span className="text-lg font-semibold text-indigo-400">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer bg-slate-700 accent-indigo-500"
          style={{
            background: `linear-gradient(to right, #6366f1 0%, #6366f1 ${percentage}%, #334155 ${percentage}%, #334155 100%)`,
          }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-500">
        <span>{formatValue ? formatValue(min) : min}</span>
        <span>{formatValue ? formatValue(max) : max}</span>
      </div>
    </div>
  );
}
