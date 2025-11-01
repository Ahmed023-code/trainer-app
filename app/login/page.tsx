"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [name, setName] = useState("");
  const router = useRouter();

  // Check if already logged in
  useEffect(() => {
    const profile = localStorage.getItem("profile-v1");
    if (profile) {
      try {
        const data = JSON.parse(profile);
        if (data.displayName) {
          router.push("/");
        }
      } catch {
        // Invalid data, stay on login
      }
    }
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    // Save display name
    const profile = {
      displayName: name.trim(),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem("profile-v1", JSON.stringify(profile));

    // Navigate to home
    router.push("/");
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-bg">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome</h1>
          <p className="text-text-muted">Enter your name to get started</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-2">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 rounded-lg border border-border bg-card text-text focus:ring-2 focus:ring-accent-home focus:outline-none"
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={!name.trim()}
            className="w-full px-4 py-3 rounded-lg bg-accent-home text-white font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            Continue
          </button>
        </form>
      </div>
    </main>
  );
}
