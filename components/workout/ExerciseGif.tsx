"use client";

import { useEffect, useState } from "react";
import { getOfflineDB } from "@/utils/offlineDb";

type Props = {
  gifUrl: string;
  alt: string;
  className?: string;
};

export default function ExerciseGif({ gifUrl, alt, className = "" }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let mounted = true;
    let objectUrl: string | null = null;

    (async () => {
      try {
        const db = await getOfflineDB();

        // Check cache first
        const cachedBlob = await db.getCachedGif(gifUrl);
        if (cachedBlob) {
          if (!mounted) return;
          objectUrl = URL.createObjectURL(cachedBlob);
          setBlobUrl(objectUrl);
          setLoading(false);
          return;
        }

        // Try to fetch from network
        const response = await fetch(gifUrl);
        if (!response.ok) throw new Error("Failed to fetch");

        const blob = await response.blob();

        // Cache the blob
        await db.cacheGif(gifUrl, blob);

        if (!mounted) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
        setLoading(false);
      } catch (err) {
        console.error("Failed to load GIF:", err);
        if (!mounted) return;
        setError(true);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [gifUrl]);

  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg ${className}`}
      >
        <div className="animate-pulse text-neutral-400 dark:text-neutral-600 text-sm">
          Loading...
        </div>
      </div>
    );
  }

  if (error || !blobUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 dark:bg-neutral-800 rounded-lg ${className}`}
      >
        <div className="text-neutral-400 dark:text-neutral-600 text-sm text-center p-4">
          GIF unavailable offline
        </div>
      </div>
    );
  }

  return (
    <img
      src={blobUrl}
      alt={alt}
      className={`object-contain rounded-lg ${className}`}
    />
  );
}
