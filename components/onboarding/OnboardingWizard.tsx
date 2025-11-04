"use client";

import { useState } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { useGoalsStore } from "@/stores/goalsStore";
import { writeWeight } from "@/stores/storageV2";

const STORAGE_KEY = "onboarding-done-v1";

type OnboardingStep = "welcome" | "units" | "weight" | "macros" | "goals" | "finish";

type OnboardingWizardProps = {
  onComplete: () => void;
};

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const [step, setStep] = useState<OnboardingStep>("welcome");
  const [weight, setWeight] = useState("");
  const [macroPreset, setMacroPreset] = useState<"maintenance" | "cut" | "bulk">("maintenance");

  const { weightUnit, energyUnit, setWeightUnit, setEnergyUnit } = useSettingsStore();
  const { setWeeklyGoals } = useGoalsStore();

  const handleComplete = () => {
    // Save weight if provided
    if (weight && Number(weight) > 0) {
      const today = new Date();
      const dateISO = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
        today.getDate()
      ).padStart(2, "0")}`;
      writeWeight(dateISO, Number(weight));
    }

    // Set goals based on macro preset
    const presets = {
      maintenance: { workouts: 4, protein: 150, caloriesTarget: 2400 },
      cut: { workouts: 5, protein: 180, caloriesTarget: 2000 },
      bulk: { workouts: 4, protein: 180, caloriesTarget: 3000 },
    };
    setWeeklyGoals(presets[macroPreset]);

    // Mark onboarding as done
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, "true");
    }

    onComplete();
  };

  const nextStep = () => {
    const steps: OnboardingStep[] = ["welcome", "units", "weight", "macros", "goals", "finish"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const steps: OnboardingStep[] = ["welcome", "units", "weight", "macros", "goals", "finish"];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const steps: OnboardingStep[] = ["welcome", "units", "weight", "macros", "goals", "finish"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <div className="fixed inset-0 bg-white dark:bg-neutral-900 z-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all ${
                i === currentStepIndex
                  ? "w-8 bg-[var(--accent-progress)]"
                  : i < currentStepIndex
                  ? "w-2 bg-[var(--accent-progress)]/50"
                  : "w-2 bg-neutral-300 dark:bg-neutral-700"
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className="text-center space-y-6">
          {step === "welcome" && (
            <>
              <h1 className="text-3xl font-bold">Welcome to Trainer App!</h1>
              <p className="text-neutral-600 dark:text-neutral-400">
                Let's get you set up in just a few steps. This will help us personalize your experience.
              </p>
            </>
          )}

          {step === "units" && (
            <>
              <h2 className="text-2xl font-bold">Choose Your Units</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Weight</label>
                  <div className="flex gap-2">
                    {(["lbs", "kg"] as const).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => setWeightUnit(unit)}
                        className={`flex-1 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                          weightUnit === unit
                            ? "bg-[var(--accent-progress)] text-white"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {unit.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Energy</label>
                  <div className="flex gap-2">
                    {(["kcal", "kJ"] as const).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => setEnergyUnit(unit)}
                        className={`flex-1 px-4 py-3 rounded-full text-sm font-medium transition-colors ${
                          energyUnit === unit
                            ? "bg-[var(--accent-progress)] text-white"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {step === "weight" && (
            <>
              <h2 className="text-2xl font-bold">What's Your Current Weight?</h2>
              <div>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={`Enter weight in ${weightUnit}`}
                  className="w-full px-4 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-lg text-center"
                  autoFocus
                />
                <p className="text-sm text-neutral-500 mt-2">You can skip this and add it later</p>
              </div>
            </>
          )}

          {step === "macros" && (
            <>
              <h2 className="text-2xl font-bold">What's Your Goal?</h2>
              <div className="space-y-3">
                {(["maintenance", "cut", "bulk"] as const).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setMacroPreset(preset)}
                    className={`w-full p-4 rounded-full border-2 transition-all ${
                      macroPreset === preset
                        ? "border-[var(--accent-progress)] bg-[var(--accent-progress)]/10"
                        : "border-neutral-300 dark:border-neutral-700"
                    }`}
                  >
                    <div className="font-semibold text-lg capitalize">{preset}</div>
                    <div className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                      {preset === "maintenance" && "Maintain current weight and build strength"}
                      {preset === "cut" && "Lose fat while preserving muscle"}
                      {preset === "bulk" && "Build muscle and gain weight"}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {step === "goals" && (
            <>
              <h2 className="text-2xl font-bold">Your Weekly Goals</h2>
              <div className="p-6 rounded-full bg-neutral-100 dark:bg-neutral-800 space-y-3 text-left">
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Workouts per week:</span>
                  <span className="font-semibold">
                    {macroPreset === "cut" ? "5" : "4"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Daily protein target:</span>
                  <span className="font-semibold">
                    {macroPreset === "maintenance" ? "150" : "180"}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600 dark:text-neutral-400">Daily calories target:</span>
                  <span className="font-semibold">
                    {macroPreset === "maintenance" ? "2400" : macroPreset === "cut" ? "2000" : "3000"} {energyUnit}
                  </span>
                </div>
              </div>
              <p className="text-sm text-neutral-500">You can adjust these anytime in Settings</p>
            </>
          )}

          {step === "finish" && (
            <>
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold">You're All Set!</h2>
              <p className="text-neutral-600 dark:text-neutral-400">
                Start tracking your workouts, diet, and progress. Let's achieve your fitness goals together!
              </p>
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {step !== "welcome" && step !== "finish" && (
            <button
              onClick={prevStep}
              className="px-6 py-3 rounded-full border border-neutral-300 dark:border-neutral-700 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              Back
            </button>
          )}
          <button
            onClick={step === "finish" ? handleComplete : nextStep}
            className="flex-1 px-6 py-3 rounded-full bg-[var(--accent-progress)] text-white font-medium hover:opacity-90"
          >
            {step === "welcome" ? "Get Started" : step === "finish" ? "Start Using App" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper to check if onboarding is complete
export function isOnboardingComplete(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(STORAGE_KEY) === "true";
}

// Helper to reset onboarding (for testing)
export function resetOnboarding() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
