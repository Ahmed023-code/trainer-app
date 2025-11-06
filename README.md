# Trainer App

A comprehensive fitness and nutrition tracking web application built with Next.js. Track your daily diet, workouts, body weight, and progress across different dates with a fully date-scoped data management system.

## Features

### Core Tracking
- **Diet Tracking**: Log meals with macro tracking (calories, protein, carbs, fat), food library search with USDA database, emoji-free macro rings
- **Workout Tracking**: Log exercises with sets, reps, weight, RPE, exercise library, saved routines, professional SVG chart visualization
- **Progress Dashboard**: View your progress by Day/Week/Month/Year with summaries and visualizations, purple accent theme
- **Media Gallery**: Store photos/videos for each day using IndexedDB
- **Weight Tracking**: Log daily weight with sparkline visualization

### Smart Features
- **Home Dashboard**: Today recap with diet summary, workout snapshot, quick actions, and deep links
- **Reminders System**: Create, manage, and track reminders with optional due dates
- **Messages & Alerts**: Inbox system for notifications and important information
- **Day Completion Badge**: Animated gradient badge appears when workout + weight + diet are all logged for a day
- **Date Navigation**: Seamlessly navigate between dates with persistent state per tab
- **Deep Linking**: Quick navigation between tabs with pre-selected dates

### Design & UX
- **Mobile-First**: Responsive design optimized for 320-480px screens with safe-area support
- **Offline-First**: All data stored locally in browser (no backend required)
- **Dark Mode**: Full dark mode support with iOS-like polish
- **Accessibility**: 40px minimum tap targets, aria-labels, keyboard navigation support
- **No Emojis**: Professional, clean design without emoji clutter

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **State Management**: Zustand (legacy), transitioning to storageV2
- **Storage**: localStorage + IndexedDB (via idb-keyval)
- **Data Fetching**: TanStack Query
- **UI**: Custom React components, mobile-first responsive design

## Date-Scoped Storage Architecture

### Overview

The app uses a unified, date-scoped persistence layer (`stores/storageV2.ts`) where all data is keyed by date in `YYYY-MM-DD` format (local time). This allows users to:
- Navigate to any date and view/edit data for that specific day
- Maintain separate data sets for each day (diet, workout, weight, media)
- Automatically migrate from legacy undated storage keys

### Storage Keys

All metadata is stored in `localStorage`:

- **`diet-by-day-v2`**: `Record<dateISO, DietDayState>`
  - Contains meals array and macro goals for each date
  - DietDayState: `{ meals: Meal[], goals: Goals }`

- **`workout-by-day-v2`**: `Record<dateISO, WorkoutDayState>`
  - Contains exercises array and workout notes for each date
  - WorkoutDayState: `{ exercises: Exercise[], notes: string }`

- **`progress-weight-by-day-v1`**: `Record<dateISO, number>`
  - Body weight in pounds/kg for each date

- **`progress-media-index-v1`**: `Record<dateISO, MediaItem[]>`
  - Metadata for photos/videos (filename, size, type, idbKey)
  - Actual blobs stored in IndexedDB

Media blobs are stored in **IndexedDB** (via idb-keyval):
- **Key format**: `media:<uuid>`
- **Value**: Blob (image or video file)
- Lazy-loaded for performance

### Date Navigation State

Each tab persists its last selected date in localStorage:

- **`ui-last-date-diet`**: Last viewed date in Diet tab
- **`ui-last-date-workout`**: Last viewed date in Workout tab
- **`ui-last-date-progress`**: Last viewed date in Progress tab

This allows each tab to maintain independent date selection that persists across sessions.

### Legacy Migration

On first load, `storageV2` automatically migrates data from legacy keys to today's date:

**Legacy Keys Migrated**:
- `diet-meals-v1` → `diet-by-day-v2[today]`
- `diet-goals-v1` → `diet-by-day-v2[today]`
- `workout-exercises-v1` → `workout-by-day-v2[today]`
- `workout-notes-v1` → `workout-by-day-v2[today]`

Migration runs once on app boot (module load) and is idempotent.

### API Functions

```typescript
// Date helpers
getTodayISO(): string                    // Returns YYYY-MM-DD for today
toISODate(date: Date): string            // Converts Date to YYYY-MM-DD

// Diet operations
readDiet(dateISO: string): DietDayState
writeDiet(dateISO: string, partial: Partial<DietDayState>): void

// Workout operations
readWorkout(dateISO: string): WorkoutDayState
writeWorkout(dateISO: string, partial: Partial<WorkoutDayState>): void

// Weight operations
readWeight(dateISO: string): number | null
writeWeight(dateISO: string, value: number): void

// Media operations (async, uses IndexedDB)
listMedia(dateISO: string): MediaItem[]
addMedia(dateISO: string, file: File): Promise<MediaItem>
removeMedia(dateISO: string, id: string): Promise<void>
getMediaBlob(idbKey: string): Promise<Blob | undefined>
```

## Date Navigation & Deep Linking

### DaySelector Component

The `<DaySelector />` component provides a consistent date navigation UI across tabs:

- **Left/Right arrows**: Navigate to previous/next day
- **Center button**: Click to open native date picker
- **"Today" pill**: Shows when current date is today

Props:
```typescript
{
  dateISO: string;           // Current date in YYYY-MM-DD
  dateObj: Date;             // Date object for formatting
  onPrev: () => void;        // Previous day handler
  onNext: () => void;        // Next day handler
  onSelect: (dateISO: string) => void;  // Date picker handler
  isToday: boolean;          // Whether current date is today
}
```

### useDaySelector Hook

Custom hook for managing date selection state:

```typescript
const { dateISO, dateObj, goPrevDay, goNextDay, setDateISO, isToday } =
  useDaySelector('ui-last-date-diet');
```

Features:
- Initializes from localStorage or defaults to today
- Provides navigation actions (prev/next)
- Persists date changes to localStorage
- Returns formatted Date object for display

### Deep Linking Between Tabs

The Progress tab can deep link to Diet/Workout tabs with a specific date:

```typescript
// From Progress Day view
const openDietForDate = () => {
  localStorage.setItem("ui-last-date-diet", dateISO);
  router.push(`/diet`);
};
```

This sets the target tab's last-selected date before navigation, ensuring the user sees data for the same day when switching tabs.

## Progress Tab Views

### Day View
- Weight input with 7-day sparkline
- Diet summary with macro rings
- Workout summary (exercises, sets, volume)
- Media gallery (add/remove photos/videos)
- "Open Diet/Workout" buttons for deep linking

### Week View
- Summary cards: total workouts, sets, diet adherence days
- 7-day grid showing:
  - Day name and date
  - Badges for workout (yellow), weight (blue), diet adherence (green)
- Click any day to navigate to that date

### Month View
- Monthly stats: workout days, weigh-ins, diet adherence days
- Full calendar grid with:
  - Day headers (S M T W T F S)
  - Activity badges per day
  - Empty cells for days outside current month
- Click any day to navigate to that date

### Year View
- Total workouts and average diet adherence
- 12 monthly cards showing:
  - Workout count
  - Average diet adherence percentage
  - Progress bar for workout frequency
- Click any month to navigate to that month

## Development

```bash
# Install dependencies
npm install

# Run development server (local only)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Remote Access

Access your app from any device on the same network (phone, tablet, other computers):

### Quick Start

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Get your local IP address:**
   ```bash
   npm run ip
   ```

3. **Access from other devices:**
   - Open the URL shown (e.g., `http://192.168.1.100:3000`)
   - Make sure both devices are on the same WiFi network

### How It Works

The app runs in **server mode** for web access and **export mode** for mobile builds:

- **Web/Remote Access**: `npm run dev` or `npm start` runs a Next.js server on `0.0.0.0:3000`
- **Mobile Build**: `npm run mobile:build` exports static files for Capacitor

### Access Over the Internet

For access from anywhere (not just local network), use one of these options:

**Option 1: ngrok (Recommended)**
```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In another terminal, create a tunnel
ngrok http 3000
```

**Option 2: localtunnel**
```bash
# Install localtunnel
npm install -g localtunnel

# Start your app
npm run dev

# In another terminal, create a tunnel
lt --port 3000
```

**Option 3: Deploy to Production**
- Vercel: `vercel deploy`
- Netlify: Connect your git repository
- Railway: `railway up`

### Troubleshooting

**Can't connect from other devices?**
- Verify both devices are on the same WiFi network
- Check firewall settings (allow port 3000)
- Try disabling VPN on either device
- Run `npm run ip` to confirm the correct IP address

**Mobile build not working?**
- Mobile builds use `npm run mobile:build` (export mode)
- Web server mode is separate and doesn't affect mobile builds

## Project Structure

```
app/
├── (tabs)/
│   ├── layout.tsx          # Bottom tab navigation with safe-area support
│   ├── page.tsx            # Home tab with Today recap, reminders, deep links
│   ├── diet/
│   │   └── page.tsx        # Diet tracking with date selector & macro rings
│   ├── workout/
│   │   └── page.tsx        # Workout tracking with WorkoutMiniChart
│   ├── schedule/
│   │   └── page.tsx        # Progress tab (Day/Week/Month/Year) with purple accent
│   └── settings/
│       ├── page.tsx        # Settings
│       └── diet/
│           └── page.tsx    # Diet goals configuration
├── layout.tsx              # Root layout
└── globals.css             # Global styles + utilities (tap-target, animations)

components/
├── diet/                   # Diet-specific components
│   ├── MacroRings.tsx      # Emoji-free macro rings
│   ├── MealSection.tsx
│   └── FoodLibraryModal.tsx
├── workout/                # Workout-specific components
│   ├── ExerciseSection.tsx
│   ├── WorkoutMiniChart.tsx # New SVG chart (area/column, no emojis)
│   └── RoutinesModal.tsx
└── ui/                     # Shared UI components
    ├── DaySelector.tsx     # Date navigation component
    ├── CompletionBadge.tsx # Animated gradient completion badge
    └── SwipeDelete.tsx

stores/
├── storageV2.ts           # Unified date-scoped storage layer
├── inboxStore.ts          # Reminders, messages, alerts (Zustand)
├── dietStore.ts           # Legacy Zustand store (deprecated)
└── workoutStore.ts        # Legacy Zustand store (deprecated)

hooks/
└── useDaySelector.ts      # Date selection hook with persistence

utils/
└── completion.ts          # isDayComplete(), getTodayISO() utilities

public/
├── data/
│   ├── foods.json         # USDA food database
│   └── exercises.json     # Exercise database
└── icons/                 # SVG icons
```

## Key Implementation Details

### Accessibility
- All icon buttons have `aria-label` attributes
- Minimum 40px tap targets with `.tap-target` utility class
- Semantic HTML with proper heading hierarchy
- Keyboard navigation support on interactive chart elements
- Focus rings on all interactive components

### Performance
- Memoized derived data (totals, summaries, chart data)
- Lazy-loaded IndexedDB operations
- Object URLs created on load, revoked on unmount
- Transition effects (150ms) for smooth animations
- SVG charts with no external dependencies for fast load times

### Mobile-First Design
- Responsive containers with `max-w-[480px]` for optimal mobile viewing
- Safe-area support with `env(safe-area-inset-bottom)` for notched devices
- Touch-friendly controls with hover states
- iOS-like rounded corners, shadows, backdrop blur
- Bottom tab navigation with safe area padding
- No horizontal scroll on 320px-360px screens

### WorkoutMiniChart Component
```typescript
<WorkoutMiniChart
  data={[{ label: "Chest", value: 12 }, { label: "Back", value: 8 }]}
  variant="area" | "column"
  height={160}
  accentColor="#FACC15"
/>
```
- Pure SVG implementation, no external chart libraries
- Mobile-friendly tap-to-lock tooltips
- Auto-scaling axes with grid lines
- Smooth animations with CSS keyframes
- Supports both area (sparkline) and column (bar) charts

### Inbox System
```typescript
// Reminders, messages, and alerts
const { reminders, addReminder, toggleReminder } = useInboxStore();
```
- Zustand store with localStorage persistence
- Reminders with optional due dates
- Messages from system or other sources
- Typed alerts (info, warn, error)
- Auto-loads on app boot

### Day Completion
```typescript
// Check if a day is complete (workout + weight + diet logged)
const isComplete = isDayComplete(dateISO);
```
- Automatic detection when all three data types are present
- Animated gradient badge with confetti-inspired design
- Shows on Home, Progress, and relevant date headers

### TypeScript
- Strict mode enabled
- Explicit types for all storage operations
- No `any` except in legacy migration transforms
- Type-safe chart data structures

## Documentation Files

- [DATE_NAVIGATION.md](DATE_NAVIGATION.md) - Detailed date navigation implementation
- [STORAGE_V2_IMPLEMENTATION.md](STORAGE_V2_IMPLEMENTATION.md) - Storage migration guide
- [stores/STORAGE_V2_USAGE.md](stores/STORAGE_V2_USAGE.md) - Storage API reference

## License

MIT
