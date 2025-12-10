"use client";

import { useEffect, useState } from "react";

type ClockModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function ClockModal({ isOpen, onClose }: ClockModalProps) {
  const [tab, setTab] = useState<"stopwatch" | "timer">("stopwatch");

  // Stopwatch state
  const [stopwatchTime, setStopwatchTime] = useState<number>(0);
  const [stopwatchRunning, setStopwatchRunning] = useState<boolean>(false);

  // Timer state
  const [timerInput, setTimerInput] = useState<{ min: number; sec: number }>({
    min: 0,
    sec: 30,
  });
  const [timerTime, setTimerTime] = useState<number>(30);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [timerFinished, setTimerFinished] = useState<boolean>(false);

  // Stopwatch tick
  useEffect(() => {
    if (!stopwatchRunning) return;
    const interval = setInterval(() => {
      setStopwatchTime((v) => v + 0.01);
    }, 10);
    return () => clearInterval(interval);
  }, [stopwatchRunning]);

  // Timer tick
  useEffect(() => {
    if (!timerRunning || timerTime <= 0) return;
    const interval = setInterval(() => {
      setTimerTime((v) => {
        if (v <= 0.01) {
          setTimerRunning(false);
          setTimerFinished(true);
          return 0;
        }
        return v - 0.01;
      });
    }, 10);
    return () => clearInterval(interval);
  }, [timerRunning, timerTime]);

  // Reset timer finished state when timer changes
  useEffect(() => {
    setTimerFinished(false);
  }, [timerInput]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    const pad = (n: number) => String(n).padStart(2, "0");

    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}.${pad(ms)}`;
    }
    return `${pad(m)}:${pad(s)}.${pad(ms)}`;
  };

  const handleStopwatchReset = () => {
    setStopwatchRunning(false);
    setStopwatchTime(0);
  };

  const handleTimerStart = () => {
    if (!timerRunning) {
      const total = timerInput.min * 60 + timerInput.sec;
      setTimerTime(total);
      setTimerFinished(false);
    }
    setTimerRunning(!timerRunning);
  };

  const handleTimerReset = () => {
    setTimerRunning(false);
    setTimerTime(timerInput.min * 60 + timerInput.sec);
    setTimerFinished(false);
  };

  if (!isOpen) return null;

  const timerProgress = timerTime / (timerInput.min * 60 + timerInput.sec);

  return (
    <div className="fixed inset-0 z-[9700] bg-white dark:bg-neutral-950">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-semibold">Clock</h1>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-4 pb-4">
          <button
            className={`flex-1 px-6 py-3 rounded-full border font-medium transition-all ${
              tab === "stopwatch"
                ? "bg-[var(--accent-workout)] border-[var(--accent-workout)] text-black shadow-lg scale-105"
                : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            }`}
            onClick={() => setTab("stopwatch")}
          >
            Stopwatch
          </button>
          <button
            className={`flex-1 px-6 py-3 rounded-full border font-medium transition-all ${
              tab === "timer"
                ? "bg-[var(--accent-workout)] border-[var(--accent-workout)] text-black shadow-lg scale-105"
                : "border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            }`}
            onClick={() => setTab("timer")}
          >
            Timer
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-6">
        {tab === "stopwatch" ? (
          <div className="w-full max-w-md space-y-8">
            {/* Stopwatch Display */}
            <div className="relative">
              {/* Animated circle */}
              <div className="relative w-80 h-80 mx-auto">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-neutral-200 dark:text-neutral-800"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="var(--accent-workout)"
                    strokeWidth="2"
                    strokeDasharray={`${(stopwatchTime % 60) * (283 / 60)} 283`}
                    className={`transition-all ${stopwatchRunning ? 'duration-[10ms]' : 'duration-300'}`}
                  />
                </svg>

                {/* Time display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`text-6xl font-bold tabular-nums transition-all ${stopwatchRunning ? 'scale-105' : 'scale-100'}`}>
                    {formatTime(stopwatchTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-center items-center gap-6">
              <button
                onClick={() => setStopwatchRunning(!stopwatchRunning)}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  stopwatchRunning
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : "bg-[var(--accent-workout)] hover:opacity-90"
                } text-black`}
              >
                {stopwatchRunning ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleStopwatchReset}
                className="w-20 h-20 rounded-full border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center justify-center transition-all"
                aria-label="Reset"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md space-y-8">
            {/* Timer Display */}
            <div className="relative">
              {/* Animated circle with countdown */}
              <div className="relative w-80 h-80 mx-auto">
                <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="text-neutral-200 dark:text-neutral-800"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={timerFinished ? "#EF4444" : "var(--accent-workout)"}
                    strokeWidth="3"
                    strokeDasharray={`${timerProgress * 283} 283`}
                    className={`transition-all ${timerRunning ? 'duration-[10ms]' : 'duration-300'} ${timerFinished ? 'animate-pulse' : ''}`}
                  />
                </svg>

                {/* Time display */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className={`text-6xl font-bold tabular-nums transition-all ${timerRunning ? 'scale-105' : 'scale-100'} ${timerFinished ? 'text-red-500 animate-pulse' : ''}`}>
                    {formatTime(timerTime)}
                  </div>
                </div>
              </div>
            </div>

            {/* Time Input (only when not running) */}
            {!timerRunning && !timerFinished && (
              <div className="flex justify-center gap-8 mb-6">
                {/* Minutes */}
                <div className="flex flex-col items-center">
                  <button
                    className="w-12 h-12 rounded-full border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 grid place-items-center text-2xl transition-all"
                    onClick={() => setTimerInput((v) => ({ ...v, min: v.min + 1 }))}
                  >
                    +
                  </button>
                  <div className="w-16 text-center text-2xl font-bold my-2">{timerInput.min}</div>
                  <button
                    className="w-12 h-12 rounded-full border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 grid place-items-center text-2xl transition-all"
                    onClick={() => setTimerInput((v) => ({ ...v, min: Math.max(0, v.min - 1) }))}
                  >
                    -
                  </button>
                  <span className="text-sm mt-2 text-neutral-500 dark:text-neutral-400">minutes</span>
                </div>

                {/* Seconds */}
                <div className="flex flex-col items-center">
                  <button
                    className="w-12 h-12 rounded-full border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 grid place-items-center text-2xl transition-all"
                    onClick={() => setTimerInput((v) => ({ ...v, sec: (v.sec + 15) % 60 }))}
                  >
                    +
                  </button>
                  <div className="w-16 text-center text-2xl font-bold my-2">{timerInput.sec}</div>
                  <button
                    className="w-12 h-12 rounded-full border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 grid place-items-center text-2xl transition-all"
                    onClick={() => setTimerInput((v) => ({ ...v, sec: v.sec === 0 ? 45 : (v.sec - 15 + 60) % 60 }))}
                  >
                    -
                  </button>
                  <span className="text-sm mt-2 text-neutral-500 dark:text-neutral-400">seconds</span>
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center items-center gap-6">
              <button
                onClick={handleTimerStart}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg transition-all ${
                  timerRunning
                    ? "bg-yellow-500 hover:bg-yellow-600"
                    : timerFinished
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-[var(--accent-workout)] hover:opacity-90"
                } text-black`}
              >
                {timerRunning ? (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                ) : (
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              <button
                onClick={handleTimerReset}
                className="w-20 h-20 rounded-full border-2 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 flex items-center justify-center transition-all"
                aria-label="Reset"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                  <path d="M21 3v5h-5" />
                  <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                  <path d="M3 21v-5h5" />
                </svg>
              </button>
            </div>

            {timerFinished && (
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500 animate-pulse">Time's Up!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
