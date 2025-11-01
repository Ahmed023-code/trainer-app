"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSettingsStore, cmToFeetInches, feetInchesToCm } from "@/stores/settingsStore";

const KEY_V2 = "diet-goals-v2";
const KEY_V1 = "diet-goals-v1";

type Sex = "male" | "female";
type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "veryActive";
type Goal = "lose" | "maintain" | "gain";
type Preset = "highProtein" | "veryHighProtein" | "lowCarb" | "keto" | "balanced" | "custom";

type Profile = {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  bodyFatPct?: number;
  activityLevel: ActivityLevel;
};

type GoalConfig = {
  goal: Goal;
  weeklyRateLbs: number; // e.g., -0.5 for losing 0.5 lbs/week
};

type DietGoals = {
  profile: Profile;
  goalConfig: GoalConfig;
  preset: Preset;
  targets: {
    kcal: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
};

const DEFAULT_PROFILE: Profile = {
  sex: "male",
  age: 30,
  heightCm: 175,
  weightKg: 80,
  activityLevel: "moderate",
};

const DEFAULT_GOAL: GoalConfig = {
  goal: "maintain",
  weeklyRateLbs: 0,
};

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  veryActive: 1.9,
};

// Calculate BMR using Mifflin-St Jeor equation
function calculateBMR(profile: Profile): number {
  const { sex, age, heightCm, weightKg } = profile;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === "male" ? 5 : -161);
  return Math.round(bmr);
}

// Calculate TDEE
function calculateTDEE(profile: Profile): number {
  const bmr = calculateBMR(profile);
  const tdee = bmr * ACTIVITY_FACTORS[profile.activityLevel];
  return Math.round(tdee);
}

// Calculate calorie target based on goal with unit-aware conversion
function calculateCalorieTarget(
  profile: Profile,
  goalConfig: GoalConfig,
  weightUnit: "lbs" | "kg",
  weeklyRate: number
): number {
  const tdee = calculateTDEE(profile);

  // Energy per unit weight
  const energyPerUnit = weightUnit === "lbs" ? 3500 : 7700; // kcal per lb or kg

  // Apply sign based on goal (user enters positive values, we make them negative for loss)
  let signedRate = weeklyRate;
  if (goalConfig.goal === "lose") {
    signedRate = -Math.abs(weeklyRate);
  } else if (goalConfig.goal === "gain") {
    signedRate = Math.abs(weeklyRate);
  }

  // Daily calorie adjustment
  const dailyDeltaKcal = (signedRate * energyPerUnit) / 7;
  const calorieTarget = tdee + dailyDeltaKcal;

  return Math.round(calorieTarget);
}

// Validate weekly rate bounds
function validateWeeklyRate(rate: number, unit: "lbs" | "kg"): {
  isValid: boolean;
  warning?: string;
} {
  const absRate = Math.abs(rate);
  const maxRate = unit === "lbs" ? 2.0 : 0.9;

  if (absRate > maxRate) {
    return {
      isValid: false,
      warning: `Weekly rate exceeds safe limit of ${maxRate} ${unit}/week`
    };
  }

  return { isValid: true };
}

// Calculate macro targets based on preset
function calculateMacros(
  calorieTarget: number,
  profile: Profile,
  preset: Preset,
  customTargets?: { protein_g: number; carbs_g: number; fat_g: number }
): { protein_g: number; carbs_g: number; fat_g: number } {
  if (preset === "custom" && customTargets) {
    return customTargets;
  }

  const weightLbs = profile.weightKg * 2.20462;
  let protein_g = 0;
  let fat_g = 0;
  let carbs_g = 0;

  switch (preset) {
    case "veryHighProtein":
      // VHP: 1.3g/lb BW (2.8g/kg), 22% fat, remainder carbs
      protein_g = Math.round(weightLbs * 1.3);
      fat_g = Math.round((calorieTarget * 0.22) / 9);
      carbs_g = Math.round((calorieTarget - protein_g * 4 - fat_g * 9) / 4);
      break;
    case "highProtein":
      protein_g = Math.round(weightLbs * 1.0);
      fat_g = Math.round((calorieTarget * 0.25) / 9);
      carbs_g = Math.round((calorieTarget - protein_g * 4 - fat_g * 9) / 4);
      break;
    case "lowCarb":
      protein_g = Math.round(weightLbs * 0.9);
      carbs_g = Math.round((calorieTarget * 0.2) / 4);
      fat_g = Math.round((calorieTarget - protein_g * 4 - carbs_g * 4) / 9);
      break;
    case "keto":
      // Keto: 1.0g/lb protein, 5% carbs (max 50g), remainder fat
      protein_g = Math.round(weightLbs * 1.0);
      carbs_g = Math.min(50, Math.round((calorieTarget * 0.05) / 4));
      fat_g = Math.round((calorieTarget - protein_g * 4 - carbs_g * 4) / 9);
      break;
    case "balanced":
    default:
      protein_g = Math.round(weightLbs * 0.8);
      fat_g = Math.round((calorieTarget * 0.28) / 9);
      carbs_g = Math.round((calorieTarget - protein_g * 4 - fat_g * 9) / 4);
      break;
  }

  return { protein_g, carbs_g, fat_g };
}

export default function DietSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnDate = searchParams.get("returnDate");
  const { weightUnit, energyUnit, heightUnit, setHeightUnit } = useSettingsStore();

  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [goalConfig, setGoalConfig] = useState<GoalConfig>(DEFAULT_GOAL);
  const [preset, setPreset] = useState<Preset>("balanced");
  const [customTargets, setCustomTargets] = useState({ protein_g: 0, carbs_g: 0, fat_g: 0 });
  const [saved, setSaved] = useState(false);
  const [weeklyRate, setWeeklyRate] = useState(0); // In current unit (lbs or kg)
  const [heightFeet, setHeightFeet] = useState<number | "">(0);
  const [heightInches, setHeightInches] = useState<number | "">(0);
  const [lockedMacros, setLockedMacros] = useState({ protein: false, carbs: false, fat: false });

  // Load existing goals
  useEffect(() => {
    try {
      const rawV2 = localStorage.getItem(KEY_V2);
      if (rawV2) {
        const data: DietGoals = JSON.parse(rawV2);
        setProfile(data.profile || DEFAULT_PROFILE);
        setGoalConfig(data.goalConfig || DEFAULT_GOAL);
        setPreset(data.preset || "balanced");

        // Convert stored weeklyRateLbs to current unit
        const storedRateLbs = data.goalConfig?.weeklyRateLbs || 0;
        const currentRate = weightUnit === "lbs" ? storedRateLbs : storedRateLbs / 2.20462;
        setWeeklyRate(currentRate);

        if (data.preset === "custom") {
          setCustomTargets(data.targets);
        }
      } else {
        // Migrate from v1
        const rawV1 = localStorage.getItem(KEY_V1);
        if (rawV1) {
          const oldGoals = JSON.parse(rawV1);
          setCustomTargets({
            protein_g: oldGoals.p || 0,
            carbs_g: oldGoals.c || 0,
            fat_g: oldGoals.f || 0,
          });
        }
      }
    } catch (err) {
      console.error("Failed to load diet goals:", err);
    }
  }, [weightUnit]);

  // Sync feet/inches when profile.heightCm or heightUnit changes
  useEffect(() => {
    if (heightUnit === "ft") {
      const { feet, inches } = cmToFeetInches(profile.heightCm);
      setHeightFeet(feet);
      setHeightInches(inches);
    }
  }, [profile.heightCm, heightUnit]);

  // Calculate targets
  const calculatedTargets = useMemo(() => {
    const calorieTarget = calculateCalorieTarget(profile, goalConfig, weightUnit, weeklyRate);
    const macros = calculateMacros(calorieTarget, profile, preset, customTargets);
    return {
      kcal: calorieTarget,
      ...macros,
    };
  }, [profile, goalConfig, preset, customTargets, weightUnit, weeklyRate]);

  // Calculate daily delta and validation
  const energyPerUnit = weightUnit === "lbs" ? 3500 : 7700;
  // Apply goal sign for display
  const signedRate = goalConfig.goal === "lose" ? -Math.abs(weeklyRate) : goalConfig.goal === "gain" ? Math.abs(weeklyRate) : 0;
  const dailyDeltaKcal = Math.round((signedRate * energyPerUnit) / 7);
  const rateValidation = validateWeeklyRate(weeklyRate, weightUnit);

  // Validate custom macros
  const customCaloriesFromMacros = customTargets.protein_g * 4 + customTargets.carbs_g * 4 + customTargets.fat_g * 9;
  const customMismatch = preset === "custom" && Math.abs(customCaloriesFromMacros - calculatedTargets.kcal) > 50;

  const handleSave = () => {
    const targets = preset === "custom" ? { kcal: Math.round(customCaloriesFromMacros), ...customTargets } : calculatedTargets;

    // Convert weekly rate to lbs for storage
    const weeklyRateLbs = weightUnit === "lbs" ? weeklyRate : weeklyRate * 2.20462;

    const data: DietGoals = {
      profile,
      goalConfig: {
        ...goalConfig,
        weeklyRateLbs,
      },
      preset,
      targets,
    };

    localStorage.setItem(KEY_V2, JSON.stringify(data));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Also update v1 for backwards compatibility
    localStorage.setItem(
      KEY_V1,
      JSON.stringify({
        cal: targets.kcal,
        p: targets.protein_g,
        c: targets.carbs_g,
        f: targets.fat_g,
      })
    );
  };

  const handleBack = () => {
    if (returnDate) {
      router.push(`/diet?date=${returnDate}`);
    } else {
      router.push("/settings");
    }
  };

  const convertWeight = (kg: number) => {
    if (weightUnit === "lbs") {
      return Math.round(kg * 2.20462 * 10) / 10; // Round to 1 decimal
    }
    return Math.round(kg * 10) / 10; // Round to 1 decimal
  };
  const convertHeight = (cm: number) => {
    if (heightUnit === "ft") {
      // This is handled separately with feet/inches inputs
      return cm;
    }
    return Math.round(cm); // Round to whole number
  };

  return (
    <main className="mx-auto w-full max-w-[520px] px-3 sm:px-4 pb-[calc(env(safe-area-inset-bottom)+80px)] space-y-4">
      <div className="pt-4 flex items-center gap-3">
        <button onClick={handleBack} className="text-2xl" aria-label="Back">
          ←
        </button>
        <h1 className="text-xl font-semibold">Diet Settings</h1>
      </div>

      {/* Profile */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm space-y-3">
        <h2 className="font-semibold">Profile</h2>
        <div className="space-y-3">
          <label className="text-sm">
            Sex
            <select
              value={profile.sex}
              onChange={(e) => setProfile({ ...profile, sex: e.target.value as Sex })}
              className="mt-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 w-full bg-white dark:bg-neutral-900"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Age
              <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={() => setProfile({ ...profile, age: Math.max(10, profile.age - 1) })}
                className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-lg"
              >
                −
              </button>
              <input
                type="text"
                inputMode="numeric"
                value={profile.age === 0 ? "" : profile.age}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, "");
                  setProfile({ ...profile, age: val === "" ? 0 : Math.min(100, Math.max(10, Number(val))) });
                }}
                className="w-16 text-center rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-2 bg-white dark:bg-neutral-900"
              />
              <button
                type="button"
                onClick={() => setProfile({ ...profile, age: Math.min(100, profile.age + 1) })}
                className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-lg"
              >
                +
              </button>
              </div>
            </label>
            <label className="text-sm">
              Weight ({weightUnit})
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    const step = weightUnit === "lbs" ? 1 : 0.5;
                    const minKg = weightUnit === "lbs" ? 30 / 2.20462 : 30;
                    setProfile({ ...profile, weightKg: Math.max(minKg, profile.weightKg - step / (weightUnit === "lbs" ? 2.20462 : 1)) });
                  }}
                  className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-lg"
                >
                  −
                </button>
                <input
                  type="text"
                  inputMode="decimal"
                  value={profile.weightKg === 0 ? "" : convertWeight(profile.weightKg)}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    const value = val === "" ? 0 : Number(val);
                    setProfile({ ...profile, weightKg: weightUnit === "lbs" ? value / 2.20462 : value });
                  }}
                  className="w-20 text-center rounded-lg border border-neutral-300 dark:border-neutral-700 px-2 py-2 bg-white dark:bg-neutral-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    const step = weightUnit === "lbs" ? 1 : 0.5;
                    const maxKg = weightUnit === "lbs" ? 300 / 2.20462 : 300;
                    setProfile({ ...profile, weightKg: Math.min(maxKg, profile.weightKg + step / (weightUnit === "lbs" ? 2.20462 : 1)) });
                  }}
                  className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-lg"
                >
                  +
                </button>
              </div>
            </label>
          </div>
          <label className="text-sm">
            Height ({heightUnit})
            <div className="flex gap-2 mt-1">
              {heightUnit === "cm" ? (
                <>
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, heightCm: Math.max(100, profile.heightCm - 1) })}
                    className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={profile.heightCm === 0 ? "" : Math.round(profile.heightCm)}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setProfile({ ...profile, heightCm: val === "" ? 0 : Math.min(250, Math.max(100, Number(val))) });
                    }}
                    className="w-12 text-center rounded-lg border border-neutral-300 dark:border-neutral-700 px-1 py-2 bg-white dark:bg-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setProfile({ ...profile, heightCm: Math.min(250, profile.heightCm + 1) })}
                    className="px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      const feet = typeof heightFeet === "number" ? heightFeet : 0;
                      const newFeet = Math.max(3, feet - 1);
                      setHeightFeet(newFeet);
                      setProfile({ ...profile, heightCm: feetInchesToCm(newFeet, typeof heightInches === "number" ? heightInches : 0) });
                    }}
                    className="px-2 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="ft"
                    value={heightFeet === 0 ? "" : heightFeet}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      const feet = val === "" ? 0 : Math.min(8, Math.max(3, Number(val)));
                      setHeightFeet(feet);
                      setProfile({ ...profile, heightCm: feetInchesToCm(feet, typeof heightInches === "number" ? heightInches : 0) });
                    }}
                    className="w-12 text-center rounded-lg border border-neutral-300 dark:border-neutral-700 px-1 py-2 bg-white dark:bg-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const feet = typeof heightFeet === "number" ? heightFeet : 0;
                      const newFeet = Math.min(8, feet + 1);
                      setHeightFeet(newFeet);
                      setProfile({ ...profile, heightCm: feetInchesToCm(newFeet, typeof heightInches === "number" ? heightInches : 0) });
                    }}
                    className="px-2 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const inches = typeof heightInches === "number" ? heightInches : 0;
                      const newInches = Math.max(0, inches - 1);
                      setHeightInches(newInches);
                      setProfile({ ...profile, heightCm: feetInchesToCm(typeof heightFeet === "number" ? heightFeet : 0, newInches) });
                    }}
                    className="px-2 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-lg"
                  >
                    −
                  </button>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="in"
                    value={heightInches === 0 ? "" : heightInches}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      const inches = val === "" ? 0 : Math.min(11, Math.max(0, Number(val)));
                      setHeightInches(inches);
                      setProfile({ ...profile, heightCm: feetInchesToCm(typeof heightFeet === "number" ? heightFeet : 0, inches) });
                    }}
                    className="w-12 text-center rounded-lg border border-neutral-300 dark:border-neutral-700 px-1 py-2 bg-white dark:bg-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const inches = typeof heightInches === "number" ? heightInches : 0;
                      const newInches = Math.min(11, inches + 1);
                      setHeightInches(newInches);
                      setProfile({ ...profile, heightCm: feetInchesToCm(typeof heightFeet === "number" ? heightFeet : 0, newInches) });
                    }}
                    className="px-2 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors font-bold text-lg"
                  >
                    +
                  </button>
                </>
              )}
              <select
                value={heightUnit}
                onChange={(e) => setHeightUnit(e.target.value as "cm" | "ft")}
                className="rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 bg-white dark:bg-neutral-900"
              >
                <option value="cm">cm</option>
                <option value="ft">ft</option>
              </select>
            </div>
          </label>
        </div>
        <label className="text-sm block">
          Activity Level
          <select
            value={profile.activityLevel}
            onChange={(e) => setProfile({ ...profile, activityLevel: e.target.value as ActivityLevel })}
            className="mt-1 rounded-lg border border-neutral-300 dark:border-neutral-700 px-3 py-2 w-full bg-white dark:bg-neutral-900"
          >
            <option value="sedentary">Sedentary (little/no exercise)</option>
            <option value="light">Light (1-3 days/week)</option>
            <option value="moderate">Moderate (3-5 days/week)</option>
            <option value="active">Active (6-7 days/week)</option>
            <option value="veryActive">Very Active (athlete/physical job)</option>
          </select>
        </label>
      </section>

      {/* Goal */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm space-y-3">
        <h2 className="font-semibold">Goal</h2>
        <div className="space-y-2">
          <label className="text-sm block">
            Weekly Rate ({weightUnit}/week)
            <div className="mt-3 mb-2">
              <input
                type="range"
                min={weightUnit === "lbs" ? "-3" : "-1.5"}
                max={weightUnit === "lbs" ? "3" : "1.5"}
                step={weightUnit === "lbs" ? "0.25" : "0.1"}
                value={weeklyRate * (goalConfig.goal === "lose" ? -1 : goalConfig.goal === "gain" ? 1 : 0)}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setWeeklyRate(Math.abs(value));
                  if (value < 0) {
                    setGoalConfig({ ...goalConfig, goal: "lose" });
                  } else if (value > 0) {
                    setGoalConfig({ ...goalConfig, goal: "gain" });
                  } else {
                    setGoalConfig({ ...goalConfig, goal: "maintain" });
                  }
                }}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gradient-to-r from-red-200 via-neutral-200 to-green-200 dark:from-red-900/30 dark:via-neutral-700 dark:to-green-900/30"
                style={{
                  background: `linear-gradient(to right,
                    rgb(254 202 202) 0%,
                    rgb(254 202 202) 33%,
                    rgb(229 231 235) 45%,
                    rgb(229 231 235) 55%,
                    rgb(187 247 208) 67%,
                    rgb(187 247 208) 100%)`
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-neutral-500 mb-2">
              <span>Lose</span>
              <span>Maintain</span>
              <span>Gain</span>
            </div>
            <div className="flex justify-between items-center">
              <div className="text-sm">
                {goalConfig.goal === "maintain" && <span className="font-medium">Maintain Weight</span>}
                {goalConfig.goal === "lose" && <span className="font-medium text-red-600 dark:text-red-400">Lose {weeklyRate.toFixed(weightUnit === "lbs" ? 2 : 1)} {weightUnit}/week</span>}
                {goalConfig.goal === "gain" && <span className="font-medium text-green-600 dark:text-green-400">Gain {weeklyRate.toFixed(weightUnit === "lbs" ? 2 : 1)} {weightUnit}/week</span>}
              </div>
              <div className="text-xs text-neutral-600 dark:text-neutral-400">
                {dailyDeltaKcal >= 0 ? "+" : ""}{dailyDeltaKcal} kcal/day
              </div>
            </div>
            {!rateValidation.isValid && (
              <div className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center gap-1 mt-2">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1L1 14h14L8 1z" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                  <path d="M8 6v4M8 11v1" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                {rateValidation.warning}
              </div>
            )}
          </label>
        </div>
      </section>

      {/* Preset */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm space-y-3">
        <h2 className="font-semibold">Macro Preset</h2>
        <div className="grid grid-cols-2 gap-2">
          {(["balanced", "highProtein", "veryHighProtein", "lowCarb", "keto", "custom"] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => setPreset(p)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                preset === p
                  ? "bg-accent-diet text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300"
              }`}
            >
              {p === "balanced" && "Balanced"}
              {p === "highProtein" && "High Protein"}
              {p === "veryHighProtein" && "Very High Protein"}
              {p === "lowCarb" && "Low Carb"}
              {p === "keto" && "Keto"}
              {p === "custom" && "Custom"}
            </button>
          ))}
        </div>

        {preset === "custom" && (
          <div className="space-y-4 pt-2">
            {/* Macro Sliders */}
            {(["protein", "carbs", "fat"] as const).map((macro) => {
              const proteinCal = customTargets.protein_g * 4;
              const carbsCal = customTargets.carbs_g * 4;
              const fatCal = customTargets.fat_g * 9;
              const totalCal = proteinCal + carbsCal + fatCal || 1;

              const proteinPct = (proteinCal / totalCal) * 100;
              const carbsPct = (carbsCal / totalCal) * 100;
              const fatPct = (fatCal / totalCal) * 100;

              const currentPct = macro === "protein" ? proteinPct : macro === "carbs" ? carbsPct : fatPct;
              const isLocked = lockedMacros[macro];

              return (
                <div key={macro} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium capitalize">{macro}</label>
                    <button
                      type="button"
                      onClick={() => setLockedMacros({ ...lockedMacros, [macro]: !isLocked })}
                      className={`p-1.5 rounded transition-colors ${
                        isLocked ? "bg-accent-diet text-white" : "bg-neutral-100 dark:bg-neutral-800"
                      }`}
                      title={isLocked ? "Unlock" : "Lock"}
                    >
                      {isLocked ? "🔒" : "🔓"}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="70"
                    step="1"
                    disabled={isLocked}
                    value={currentPct}
                    onChange={(e) => {
                      const newPct = Number(e.target.value);
                      const oldPct = currentPct;
                      const diff = newPct - oldPct;

                      // Start with current percentages
                      let newProteinPct = proteinPct;
                      let newCarbsPct = carbsPct;
                      let newFatPct = fatPct;

                      // Update the macro being adjusted
                      if (macro === "protein") newProteinPct = newPct;
                      else if (macro === "carbs") newCarbsPct = newPct;
                      else newFatPct = newPct;

                      // Find other unlocked macros (excluding current one being adjusted)
                      const unlockedMacros = [];
                      if (!lockedMacros.protein && macro !== "protein") unlockedMacros.push("protein");
                      if (!lockedMacros.carbs && macro !== "carbs") unlockedMacros.push("carbs");
                      if (!lockedMacros.fat && macro !== "fat") unlockedMacros.push("fat");

                      // If there are unlocked macros, reduce them to compensate
                      if (unlockedMacros.length > 0) {
                        const perMacro = -diff / unlockedMacros.length;
                        unlockedMacros.forEach(m => {
                          if (m === "protein") newProteinPct += perMacro;
                          else if (m === "carbs") newCarbsPct += perMacro;
                          else if (m === "fat") newFatPct += perMacro;
                        });
                      } else {
                        // All others locked - cap at what's remaining
                        const lockedSum = (lockedMacros.protein ? proteinPct : 0) +
                                         (lockedMacros.carbs ? carbsPct : 0) +
                                         (lockedMacros.fat ? fatPct : 0);
                        const maxAllowed = 100 - lockedSum;
                        if (macro === "protein") newProteinPct = Math.min(newPct, maxAllowed);
                        else if (macro === "carbs") newCarbsPct = Math.min(newPct, maxAllowed);
                        else newFatPct = Math.min(newPct, maxAllowed);
                      }

                      // Clamp values
                      newProteinPct = Math.max(5, Math.min(70, newProteinPct));
                      newCarbsPct = Math.max(5, Math.min(70, newCarbsPct));
                      newFatPct = Math.max(5, Math.min(70, newFatPct));

                      // Normalize to 100%
                      const sum = newProteinPct + newCarbsPct + newFatPct;
                      if (Math.abs(sum - 100) > 0.1) {
                        newProteinPct = (newProteinPct / sum) * 100;
                        newCarbsPct = (newCarbsPct / sum) * 100;
                        newFatPct = (newFatPct / sum) * 100;
                      }

                      // Convert to grams
                      const protein_g = Math.round((calculatedTargets.kcal * newProteinPct / 100) / 4);
                      const carbs_g = Math.round((calculatedTargets.kcal * newCarbsPct / 100) / 4);
                      const fat_g = Math.round((calculatedTargets.kcal * newFatPct / 100) / 9);

                      setCustomTargets({ protein_g, carbs_g, fat_g });
                    }}
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer ${
                      isLocked ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    style={{
                      background: macro === "protein"
                        ? "#F87171"
                        : macro === "carbs"
                        ? "#60A5FA"
                        : "#FACC15"
                    }}
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {Math.round(currentPct)}%
                    </span>
                    <span className="font-medium">
                      {macro === "protein" ? customTargets.protein_g : macro === "carbs" ? customTargets.carbs_g : customTargets.fat_g}g
                    </span>
                  </div>
                </div>
              );
            })}

            <div className="text-xs text-neutral-500 pt-2">
              <div className="flex justify-between">
                <span>Safe range: Protein 10-35%, Carbs 20-50%, Fat 15-35%</span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Summary */}
      <section className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-accent-diet/10 to-accent-diet/5 p-4 shadow-sm">
        <h2 className="font-semibold mb-3">Your Daily Targets</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-neutral-600 dark:text-neutral-400">BMR</div>
            <div className="text-lg font-bold">{calculateBMR(profile)} {energyUnit}</div>
          </div>
          <div>
            <div className="text-neutral-600 dark:text-neutral-400">TDEE</div>
            <div className="text-lg font-bold">{calculateTDEE(profile)} {energyUnit}</div>
          </div>
          <div className="col-span-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
            <div className="text-neutral-600 dark:text-neutral-400 mb-2">Macro Targets</div>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div>
                <div className="text-xs text-neutral-500">Calories</div>
                <div className="text-lg font-bold text-accent-diet">{calculatedTargets.kcal}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Protein</div>
                <div className="text-lg font-bold text-accent-diet">{calculatedTargets.protein_g}g</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Carbs</div>
                <div className="text-lg font-bold text-accent-diet">{calculatedTargets.carbs_g}g</div>
              </div>
              <div>
                <div className="text-xs text-neutral-500">Fat</div>
                <div className="text-lg font-bold text-accent-diet">{calculatedTargets.fat_g}g</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Actions */}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+16px)] flex gap-3">
        <button
          onClick={handleBack}
          className="px-4 py-3 rounded-lg border border-neutral-300 dark:border-neutral-700 font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800"
        >
          Cancel
        </button>
        <button onClick={handleSave} className="flex-1 px-4 py-3 rounded-lg bg-accent-diet text-white font-medium hover:opacity-90">
          Save Targets
        </button>
      </div>

      {saved && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
          ✓ Targets saved!
        </div>
      )}
    </main>
  );
}
