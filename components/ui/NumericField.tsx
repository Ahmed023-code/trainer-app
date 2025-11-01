"use client";

import { useState, useEffect } from "react";

type NumericFieldProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  placeholder?: string;
  className?: string;
};

export default function NumericField({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  label,
  placeholder,
  className = "",
}: NumericFieldProps) {
  const [displayValue, setDisplayValue] = useState(String(value));

  // Sync with prop changes
  useEffect(() => {
    setDisplayValue(String(value));
  }, [value]);

  const handleChange = (newValue: string) => {
    setDisplayValue(newValue);

    // Allow empty string
    if (newValue === "") {
      return;
    }

    // Parse and validate
    const num = parseFloat(newValue);
    if (!isNaN(num)) {
      onChange(num);
    }
  };

  const handleBlur = () => {
    if (displayValue === "" || displayValue === "-") {
      setDisplayValue("0");
      onChange(0);
    } else {
      const num = parseFloat(displayValue);
      if (!isNaN(num)) {
        let clamped = num;
        if (min !== undefined) clamped = Math.max(min, clamped);
        if (max !== undefined) clamped = Math.min(max, clamped);
        setDisplayValue(String(clamped));
        onChange(clamped);
      }
    }
  };

  const handleIncrement = () => {
    const current = displayValue === "" ? 0 : parseFloat(displayValue) || 0;
    let next = current + step;
    if (max !== undefined) next = Math.min(max, next);
    setDisplayValue(String(next));
    onChange(next);
  };

  const handleDecrement = () => {
    const current = displayValue === "" ? 0 : parseFloat(displayValue) || 0;
    let next = current - step;
    if (min !== undefined) next = Math.max(min, next);
    setDisplayValue(String(next));
    onChange(next);
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium mb-2">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleDecrement}
          className="tap-target min-w-10 min-h-10 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors"
          aria-label="Decrease"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>

        <input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 rounded-lg border border-border bg-card text-text text-center focus:ring-2 focus:ring-accent-home focus:outline-none"
        />

        <button
          type="button"
          onClick={handleIncrement}
          className="tap-target min-w-10 min-h-10 flex items-center justify-center rounded-lg border border-border bg-card hover:bg-muted transition-colors"
          aria-label="Increase"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
