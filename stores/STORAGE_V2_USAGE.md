# StorageV2 Usage Guide

## Overview

The `storageV2` module provides a unified, date-scoped persistence layer for Diet and Workout data. It supports:
- Per-day storage using `YYYY-MM-DD` format
- Automatic migration from legacy undated keys
- LocalStorage for metadata
- IndexedDB for media blobs (lazy-loaded via idb-keyval)

## API Reference

### Date Helpers

```typescript
getTodayISO(): string
// Returns today's date in YYYY-MM-DD format

toISODate(d: Date): string
// Converts a Date object to YYYY-MM-DD format
```

### Diet Operations

```typescript
readDiet(dateISO: string): DietDayState
// Read diet data for a specific date
// Returns default values if no data exists

writeDiet(dateISO: string, partial: Partial<DietDayState>): void
// Write diet data for a specific date
// Merges with existing data

// Example:
writeDiet("2024-01-15", {
  goals: { cal: 2000, p: 150, c: 200, f: 60 },
  meals: [{ name: "Lunch", items: [] }]
});
```

### Workout Operations

```typescript
readWorkout(dateISO: string): WorkoutDayState
// Read workout data for a specific date
// Returns default values if no data exists

writeWorkout(dateISO: string, partial: Partial<WorkoutDayState>): void
// Write workout data for a specific date
// Merges with existing data

// Example:
writeWorkout("2024-01-15", {
  exercises: [{ name: "Bench Press", sets: [] }],
  notes: "Great workout!"
});
```

### Weight Operations

```typescript
readWeight(dateISO: string): number | null
// Read weight for a specific date
// Returns null if no data exists

writeWeight(dateISO: string, value: number): void
// Write weight for a specific date

// Example:
writeWeight("2024-01-15", 75.5);
```

### Media Operations

```typescript
listMedia(dateISO: string): MediaItem[]
// List all media items for a specific date

addMedia(dateISO: string, file: File): Promise<MediaItem>
// Add a media file for a specific date
// Returns the created MediaItem with idbKey

removeMedia(dateISO: string, id: string): Promise<void>
// Remove a media item by ID

getMediaBlob(idbKey: string): Promise<Blob | undefined>
// Retrieve the blob for a media item
// Use the idbKey from MediaItem
```

## Migration

Migration runs automatically on app boot when the module is imported. It:
1. Checks if legacy keys exist (`diet-meals-v1`, `diet-goals-v1`, `workout-exercises-v1`, `workout-notes-v1`)
2. Migrates data to today's date in the new format
3. Leaves legacy keys intact for rollback
4. Only runs if v2 data doesn't already exist

## Storage Keys

### New Keys (v2)
- `diet-by-day-v2`: `Record<string, DietDayState>`
- `workout-by-day-v2`: `Record<string, WorkoutDayState>`
- `progress-weight-by-day-v1`: `Record<string, number>`
- `progress-media-index-v1`: `Record<string, MediaItem[]>`

### Legacy Keys (preserved)
- `diet-meals-v1`: Array of meals
- `diet-goals-v1`: Goals object
- `workout-exercises-v1`: Array of exercises
- `workout-notes-v1`: Notes string
- `workout-routines-v1`: Array of routines

## Type Definitions

```typescript
type DietDayState = {
  meals: Meal[];
  goals: Goals;
};

type WorkoutDayState = {
  exercises: Exercise[];
  notes: string;
};

type MediaItem = {
  id: string;
  type: "image" | "video";
  name: string;
  size: number;
  idbKey: string;
  createdAt: number;
};
```

## Usage Example

```typescript
import { getTodayISO, readDiet, writeDiet } from "@/stores/storageV2";

// Get today's date
const today = getTodayISO();

// Read today's diet data
const diet = readDiet(today);

// Update goals
writeDiet(today, {
  goals: { cal: 2000, p: 150, c: 200, f: 60 }
});

// Update meals
writeDiet(today, {
  meals: [
    { name: "Breakfast", items: [...] },
    { name: "Lunch", items: [...] }
  ]
});
```

