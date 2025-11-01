import { create } from "zustand";

const STORAGE_KEY = "settings-v1";

type Theme = "dark" | "light" | "system";
type WeightUnit = "lbs" | "kg";
type EnergyUnit = "kcal" | "kJ";
type HeightUnit = "cm" | "ft";

type Settings = {
  theme: Theme;
  weightUnit: WeightUnit;
  energyUnit: EnergyUnit;
  heightUnit: HeightUnit;
};

type SettingsState = Settings & {
  setTheme: (theme: Theme) => void;
  setWeightUnit: (unit: WeightUnit) => void;
  setEnergyUnit: (unit: EnergyUnit) => void;
  setHeightUnit: (unit: HeightUnit) => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
};

const DEFAULT_SETTINGS: Settings = {
  theme: "system",
  weightUnit: "lbs",
  energyUnit: "kcal",
  heightUnit: "cm",
};

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULT_SETTINGS,

  setTheme: (theme) => {
    set({ theme });
    get().saveToStorage();

    // Apply theme to document
    if (typeof window !== "undefined") {
      const root = window.document.documentElement;

      if (theme === "system") {
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.toggle("dark", systemDark);
      } else {
        root.classList.toggle("dark", theme === "dark");
      }
    }
  },

  setWeightUnit: (weightUnit) => {
    set({ weightUnit });
    get().saveToStorage();
  },

  setEnergyUnit: (energyUnit) => {
    set({ energyUnit });
    get().saveToStorage();
  },

  setHeightUnit: (heightUnit) => {
    set({ heightUnit });
    get().saveToStorage();
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const data = JSON.parse(raw);
      const settings = { ...DEFAULT_SETTINGS, ...data };
      set(settings);

      // Apply theme
      if (typeof window !== "undefined") {
        const root = window.document.documentElement;
        if (settings.theme === "system") {
          const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
          root.classList.toggle("dark", systemDark);
        } else {
          root.classList.toggle("dark", settings.theme === "dark");
        }
      }
    } catch {
      // Ignore errors
    }
  },

  saveToStorage: () => {
    try {
      const { theme, weightUnit, energyUnit, heightUnit } = get();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ theme, weightUnit, energyUnit, heightUnit }));
    } catch {
      // Ignore errors
    }
  },
}));

// Load from storage on mount and listen for system theme changes
if (typeof window !== "undefined") {
  useSettingsStore.getState().loadFromStorage();

  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", () => {
    const settings = useSettingsStore.getState();
    if (settings.theme === "system") {
      const root = window.document.documentElement;
      root.classList.toggle("dark", mediaQuery.matches);
    }
  });
}

// Utility functions for unit conversions
export const convertWeight = (value: number, from: WeightUnit, to: WeightUnit): number => {
  if (from === to) return value;
  if (from === "lbs" && to === "kg") return value * 0.453592;
  if (from === "kg" && to === "lbs") return value / 0.453592;
  return value;
};

export const convertEnergy = (value: number, from: EnergyUnit, to: EnergyUnit): number => {
  if (from === to) return value;
  if (from === "kcal" && to === "kJ") return value * 4.184;
  if (from === "kJ" && to === "kcal") return value / 4.184;
  return value;
};

export const convertHeight = (value: number, from: HeightUnit, to: HeightUnit): number => {
  if (from === to) return value;
  if (from === "cm" && to === "ft") return value / 30.48; // cm to feet (as decimal)
  if (from === "ft" && to === "cm") return value * 30.48; // feet (as decimal) to cm
  return value;
};

// Convert cm to feet and inches object
export const cmToFeetInches = (cm: number): { feet: number; inches: number } => {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
};

// Convert feet and inches to cm
export const feetInchesToCm = (feet: number, inches: number): number => {
  return (feet * 12 + inches) * 2.54;
};
