"use client";

import { useState } from "react";
import { useNotificationsStore, scheduleNotification } from "@/stores/notificationsStore";
import type { Reminder } from "@/stores/notificationsStore";

export default function RemindersSection() {
  const { reminders, permissionStatus, addReminder, updateReminder, removeReminder, toggleReminder, requestPermission } =
    useNotificationsStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: "", timeISO: "", repeat: "none" as "none" | "daily" | "weekly" });

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (!granted) {
      alert("Notification permission denied. You can enable it in your browser settings.");
    }
  };

  const handleAddReminder = () => {
    if (!newReminder.title.trim()) {
      alert("Please enter a reminder title");
      return;
    }

    const reminder = addReminder(newReminder.title.trim(), newReminder.timeISO || undefined, newReminder.repeat);

    // Schedule the notification
    if (permissionStatus === "granted") {
      scheduleNotification(reminder);
    }

    setNewReminder({ title: "", timeISO: "", repeat: "none" });
    setShowAddForm(false);
  };

  const handleToggle = (reminder: Reminder) => {
    toggleReminder(reminder.id);
    if (!reminder.enabled && permissionStatus === "granted") {
      // Re-schedule when enabled
      scheduleNotification({ ...reminder, enabled: true });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm("Delete this reminder?")) {
      removeReminder(id);
    }
  };

  return (
    <section className="rounded-full border border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Reminders</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="text-sm text-[var(--accent-progress)] hover:underline"
        >
          {showAddForm ? "Cancel" : "+ Add"}
        </button>
      </div>

      {/* Permission status */}
      {permissionStatus !== "granted" && (
        <div className="mb-4 p-3 rounded-full bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
            Notifications are {permissionStatus === "denied" ? "blocked" : "not enabled"}.
          </div>
          {permissionStatus !== "denied" && (
            <button
              onClick={handleRequestPermission}
              className="text-xs px-3 py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
            >
              Enable Notifications
            </button>
          )}
          {permissionStatus === "denied" && (
            <div className="text-xs text-yellow-700 dark:text-yellow-300">
              Please enable notifications in your browser settings to receive reminders.
            </div>
          )}
        </div>
      )}

      {/* Add form */}
      {showAddForm && (
        <div className="mb-4 p-3 rounded-full bg-neutral-50 dark:bg-neutral-800/50 space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={newReminder.title}
              onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
              placeholder="e.g., Time for morning workout"
              className="w-full px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Time (optional)</label>
            <input
              type="time"
              value={newReminder.timeISO}
              onChange={(e) => setNewReminder({ ...newReminder, timeISO: e.target.value })}
              className="w-full px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Repeat</label>
            <select
              value={newReminder.repeat}
              onChange={(e) => setNewReminder({ ...newReminder, repeat: e.target.value as any })}
              className="w-full px-3 py-2 rounded-full border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm"
            >
              <option value="none">One-time</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <button
            onClick={handleAddReminder}
            className="w-full px-4 py-2 rounded-full bg-[var(--accent-progress)] text-white text-sm font-medium hover:opacity-90"
          >
            Add Reminder
          </button>
        </div>
      )}

      {/* Reminders list */}
      <div className="space-y-2">
        {reminders.length === 0 ? (
          <div className="text-sm text-neutral-500 text-center py-4">No reminders yet</div>
        ) : (
          reminders.map((reminder) => (
            <div
              key={reminder.id}
              className="p-3 rounded-full border border-neutral-200 dark:border-neutral-800 flex items-start gap-3"
            >
              <input
                type="checkbox"
                checked={reminder.enabled}
                onChange={() => handleToggle(reminder)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{reminder.title}</div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  {reminder.timeISO && (
                    <span>
                      {reminder.timeISO} •{" "}
                    </span>
                  )}
                  <span className="capitalize">{reminder.repeat === "none" ? "One-time" : reminder.repeat}</span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(reminder.id)}
                className="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
