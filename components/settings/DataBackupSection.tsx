"use client";

import { useState } from "react";

const BACKUP_KEYS = [
  "diet-by-day-v2",
  "workout-by-day-v2",
  "progress-weight-by-day-v1",
  "progress-media-index-v1",
  "goals-v1",
  "reminders-v1",
  "meal-templates-v1",
  "settings-v1",
  "onboarding-done-v1",
];

export default function DataBackupSection() {
  const [importing, setImporting] = useState(false);

  const handleExport = () => {
    try {
      const backup: Record<string, any> = {};

      for (const key of BACKUP_KEYS) {
        const value = localStorage.getItem(key);
        if (value) {
          try {
            backup[key] = JSON.parse(value);
          } catch {
            backup[key] = value; // Store as string if not JSON
          }
        }
      }

      backup._exportDate = new Date().toISOString();
      backup._version = "1.0";

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trainer-app-backup-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      alert("Backup exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export backup. Please try again.");
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backup = JSON.parse(e.target?.result as string);

        const confirmed = confirm(
          `This will restore data from ${
            backup._exportDate ? new Date(backup._exportDate).toLocaleDateString() : "unknown date"
          }.\n\nExisting data will be overwritten. Continue?`
        );

        if (!confirmed) {
          setImporting(false);
          return;
        }

        let restoredCount = 0;
        for (const key of BACKUP_KEYS) {
          if (backup[key] !== undefined) {
            const value = typeof backup[key] === "string" ? backup[key] : JSON.stringify(backup[key]);
            localStorage.setItem(key, value);
            restoredCount++;
          }
        }

        alert(`Backup restored successfully! ${restoredCount} items imported.\n\nReloading app...`);

        // Reload page to apply changes
        window.location.reload();
      } catch (error) {
        console.error("Import error:", error);
        alert("Failed to import backup. The file may be corrupted.");
      } finally {
        setImporting(false);
        event.target.value = ""; // Reset file input
      }
    };

    reader.onerror = () => {
      alert("Failed to read file.");
      setImporting(false);
    };

    reader.readAsText(file);
  };

  const handleClearAll = () => {
    const confirmed = confirm(
      "⚠️ WARNING: This will delete ALL your data!\n\nThis action cannot be undone. Are you absolutely sure?"
    );

    if (!confirmed) return;

    const doubleConfirm = confirm("Are you REALLY sure? This will permanently delete all workouts, diet, and progress data.");

    if (!doubleConfirm) return;

    try {
      for (const key of BACKUP_KEYS) {
        localStorage.removeItem(key);
      }
      alert("All data cleared. Reloading app...");
      window.location.reload();
    } catch (error) {
      console.error("Clear error:", error);
      alert("Failed to clear data.");
    }
  };

  return (
    <section className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
      <h2 className="font-semibold mb-3">Data Backup & Restore</h2>

      <div className="space-y-3">
        {/* Export */}
        <div>
          <button
            onClick={handleExport}
            className="w-full px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-2"
          >
            <span>⬇️</span>
            <span>Export Backup</span>
          </button>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Download all your data as a JSON file
          </p>
        </div>

        {/* Import */}
        <div>
          <label className="w-full px-4 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 text-sm font-medium hover:bg-neutral-100 dark:hover:bg-neutral-800 flex items-center justify-center gap-2 cursor-pointer">
            <span>⬆️</span>
            <span>{importing ? "Importing..." : "Import Backup"}</span>
            <input type="file" accept=".json" onChange={handleImport} className="hidden" disabled={importing} />
          </label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Restore data from a backup file
          </p>
        </div>

        {/* Clear all */}
        <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800">
          <button
            onClick={handleClearAll}
            className="w-full px-4 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600"
          >
            🗑️ Clear All Data
          </button>
          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
            ⚠️ This will permanently delete all your data
          </p>
        </div>
      </div>
    </section>
  );
}
