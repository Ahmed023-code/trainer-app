"use client";

import { useState, useEffect } from "react";

const STORAGE_KEY = "progress-feedback-v1";

type DailyFeedback = {
  mood: number; // 1-5
  energy: number; // 1-5
  notes?: string;
};

type DailyFeedbackCardProps = {
  dateISO: string;
};

export default function DailyFeedbackCard({ dateISO }: DailyFeedbackCardProps) {
  const [feedback, setFeedback] = useState<DailyFeedback>({ mood: 3, energy: 3, notes: "" });
  const [showNotes, setShowNotes] = useState(false);

  // Load feedback on mount and when date changes
  useEffect(() => {
    const stored = readFeedback(dateISO);
    if (stored) {
      setFeedback(stored);
    } else {
      setFeedback({ mood: 3, energy: 3, notes: "" });
    }
  }, [dateISO]);

  const handleSave = (field: "mood" | "energy", value: number) => {
    const updated = { ...feedback, [field]: value };
    setFeedback(updated);
    writeFeedback(dateISO, updated);
  };

  const handleNotesChange = (notes: string) => {
    const updated = { ...feedback, notes };
    setFeedback(updated);
    writeFeedback(dateISO, updated);
  };

  const moodLabels = ["😢 Poor", "😕 Low", "😐 Okay", "🙂 Good", "😄 Great"];
  const energyLabels = ["😴 Exhausted", "🥱 Tired", "😐 Average", "💪 Energetic", "⚡ Pumped"];

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
      <h3 className="font-semibold mb-4">How are you feeling?</h3>

      <div className="space-y-4">
        {/* Mood slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Mood</label>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">{moodLabels[feedback.mood - 1]}</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={feedback.mood}
            onChange={(e) => handleSave("mood", Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #f59e0b 25%, #eab308 50%, #84cc16 75%, #22c55e 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>

        {/* Energy slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">Energy</label>
            <span className="text-sm text-neutral-600 dark:text-neutral-400">{energyLabels[feedback.energy - 1]}</span>
          </div>
          <input
            type="range"
            min="1"
            max="5"
            value={feedback.energy}
            onChange={(e) => handleSave("energy", Number(e.target.value))}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #6366f1 0%, #8b5cf6 25%, #a855f7 50%, #d946ef 75%, #ec4899 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-neutral-500 mt-1">
            <span>1</span>
            <span>2</span>
            <span>3</span>
            <span>4</span>
            <span>5</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-[var(--accent-progress)] hover:underline"
          >
            {showNotes ? "Hide notes" : "Add notes"}
          </button>
          {showNotes && (
            <textarea
              value={feedback.notes || ""}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="How are you feeling today? Any observations?"
              className="w-full mt-2 px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-sm resize-none"
              rows={3}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Storage helpers
function readFeedback(dateISO: string): DailyFeedback | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data[dateISO] || null;
  } catch {
    return null;
  }
}

function writeFeedback(dateISO: string, feedback: DailyFeedback) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : {};
    data[dateISO] = feedback;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to save feedback:", err);
  }
}

// Helper to get average mood/energy for a range
export function getAverageFeedback(
  startISO: string,
  endISO: string
): { avgMood: number; avgEnergy: number; count: number } {
  if (typeof window === "undefined") return { avgMood: 0, avgEnergy: 0, count: 0 };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { avgMood: 0, avgEnergy: 0, count: 0 };

    const data = JSON.parse(raw);
    let totalMood = 0;
    let totalEnergy = 0;
    let count = 0;

    for (const [dateISO, feedback] of Object.entries(data)) {
      if (dateISO >= startISO && dateISO <= endISO) {
        const f = feedback as DailyFeedback;
        totalMood += f.mood;
        totalEnergy += f.energy;
        count++;
      }
    }

    return {
      avgMood: count > 0 ? totalMood / count : 0,
      avgEnergy: count > 0 ? totalEnergy / count : 0,
      count,
    };
  } catch {
    return { avgMood: 0, avgEnergy: 0, count: 0 };
  }
}
