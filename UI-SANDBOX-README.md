# 🎨 UI Sandbox Branch - README

## Overview

This branch (`claude/ui-sandbox-01JqBiUW9i7GhQprFTDrZ4mK`) is a **UI experimentation playground** for testing different visual designs, layouts, and user experiences **without worrying about backend correctness or data integrity**.

**⚠️ IMPORTANT**: This branch is **NEVER** meant to be merged back into main. It exists purely for rapid UI iteration and design experiments.

---

## What's Different Here?

### 1. Mock In-Memory Storage
- **File**: `stores/mockStorage.ts`
- Replaces `localStorage` with in-memory storage
- Pre-populated with **90 days of realistic mock data**:
  - Weight logs (with gradual 5lb loss trend)
  - 30 days of varied diet data (breakfast, lunch, dinner, snacks)
  - 30 days of workout data (Push/Pull/Leg split)
  - Reminders and inbox items

### 2. Stubbed Storage Layer
- **File**: `stores/storageV2.ts`
- Modified to use mock storage when `UI_SANDBOX = true` (line 38)
- All reads/writes go to in-memory data instead of browser storage
- Data resets on every page reload (perfect for clean testing)

### 3. Stubbed API Routes
- **File**: `app/api/food/search/route.ts`
  - Returns 30 common foods from mock database
  - No PostgreSQL connection needed

- **File**: `app/api/food/details/route.ts`
  - Returns mock nutrition data for any food
  - Generates generic data for unknown FDC IDs

### 4. Auto-Login
- Mock storage includes a pre-created profile
- Login screen automatically bypassed
- No authentication required

---

## Running the UI Sandbox

```bash
# Install dependencies (if not already done)
npm install

# Start dev server
npm run dev

# App will be available at:
# http://localhost:3000
```

The app will:
✅ Load with 90 days of weight data
✅ Show 30 days of realistic diet/workout logs
✅ Have functional navigation across all tabs
✅ Allow adding/editing data (changes don't persist across reloads)

---

## What Can You Safely Do Here?

### ✅ Encouraged Experiments

1. **Try Different Visual Styles**
   ```typescript
   // Example: Switch to glassmorphism in globals.css
   .card {
     background: rgba(255, 255, 255, 0.1);
     backdrop-filter: blur(10px);
     border: 1px solid rgba(255, 255, 255, 0.2);
   }
   ```

2. **Create Alternate Screen Versions**
   - Copy `app/(tabs)/page.tsx` → `app/(tabs)/page-v2.tsx`
   - Test different layouts side-by-side
   - Use route parameters or toggles to switch versions

3. **Experiment with Color Palettes**
   - Modify CSS variables in `app/globals.css`
   - Try different accent colors for each section
   - Test dark mode variations

4. **Refactor UI Components**
   - Extract repeated patterns into reusable components
   - Try different component libraries
   - Experiment with animations and transitions

5. **Mock Different Data States**
   - Edit `stores/mockStorage.ts` to test edge cases:
     - Empty states (no workouts logged)
     - Progress states (halfway to goals)
     - Completed states (all goals achieved)
     - Error states (over macros, missed days)

### ❌ Things You Don't Need to Worry About

- **Data persistence** - It's all in-memory, resets on reload
- **Backend correctness** - APIs return fake data
- **Type safety** (to an extent) - Focus on visual polish
- **Production readiness** - This is a playground!
- **Database connections** - All stubbed with mocks
- **Authentication flows** - Bypassed entirely

---

## Toggling UI Sandbox Mode

Want to switch back to real data? Easy:

**File**: `stores/storageV2.ts` (line 38)
```typescript
// Set to false to use real localStorage
const UI_SANDBOX = false;  // ← Change this
```

Then restart the dev server. The app will use actual browser storage and real API calls.

---

## Project Structure Refresher

### Main Sections (Bottom Tab Navigation)
```
/              → Home (Dashboard)
/diet          → Diet tracking
/workout       → Workout logging
/schedule      → Progress analytics
/settings      → App configuration
```

### Key Directories
```
app/(tabs)/        → Main app pages
components/        → Reusable UI components
  ├── diet/        → Diet-specific components
  ├── workout/     → Workout-specific components
  ├── progress/    → Analytics components
  ├── settings/    → Settings components
  └── ui/          → Generic UI elements

stores/            → State management (Zustand)
  ├── mockStorage.ts       → Mock data (UI Sandbox)
  ├── storageV2.ts         → Main storage layer
  ├── settingsStore.ts     → App settings
  └── ...

utils/             → Helper functions
  └── mockData.ts          → Legacy mock data generator
```

### Styling System
- **Tailwind CSS** with custom config
- **Neumorphic design** (raised/inset shadows)
- **CSS Variables** for theming:
  - `--accent-home`
  - `--accent-diet`
  - `--accent-workout`
  - `--accent-progress`

---

## Common UI Experiments

### 1. Change the Macro Ring Styles
**File**: `app/(tabs)/page.tsx` (lines 701-1180)

Try different ring stroke widths, colors, or animations:
```typescript
const stroke = 20; // Make rings thicker
const radius = (size - stroke) / 2;
```

### 2. Swap Out the Bottom Nav
**File**: `app/(tabs)/layout.tsx` (lines 55-79)

Try a different tab bar style:
- Pill-shaped buttons
- Icon-only with labels on active
- Horizontal scrolling tabs
- Floating action button

### 3. Add a New Accent Color
**File**: `app/globals.css`

```css
:root {
  --accent-nutrition: #10b981; /* New green accent */
}
```

Then use it in components:
```typescript
style={{ color: 'var(--accent-nutrition)' }}
```

### 4. Test Different Card Layouts
**File**: `app/(tabs)/page.tsx` (lines 445-553)

Try grid vs. list layouts, different spacing, card sizes, etc.

---

## Mock Data Details

### Weight Data
- **90 days** of logs
- Starts at 185 lbs
- Gradual 5 lb loss over 90 days
- Realistic daily fluctuations (±1 lb)

### Diet Data
- **30 days** of meals
- 4 meals per day: Breakfast, Lunch, Dinner, Snacks
- Varied meals cycling through 2 options each
- Default goals: 2400 cal, 180g protein, 240g carbs, 70g fat

### Workout Data
- **30 days** (every other day = 15 workouts)
- Push/Pull/Leg split cycling
- 3 exercises per workout
- 3-4 sets per exercise
- Progressive overload patterns

---

## Tips for Fast UI Iteration

1. **Use Hot Reload**
   - Keep dev server running
   - Save files and see changes instantly
   - No need to refresh browser

2. **Browser DevTools**
   - Inspect element styles
   - Test responsive designs
   - Modify CSS in real-time

3. **Component Isolation**
   - Extract complex components
   - Test them in isolation
   - Use temporary routes for A/B testing

4. **Visual Regression Testing**
   - Take screenshots before big changes
   - Compare side-by-side
   - Keep a design changelog

5. **Don't Overthink**
   - This is a playground!
   - Try wild ideas
   - Break things and learn

---

## Resetting the Branch

Want to start fresh? You can reset all changes:

```bash
# Discard all changes and return to original state
git reset --hard origin/main

# Or keep the UI sandbox setup but clear your experiments
git checkout stores/mockStorage.ts stores/storageV2.ts app/api/
```

---

## Switching Back to Main

When you're done experimenting and want to work on production code:

```bash
# Commit your UI experiments (optional, for reference)
git add .
git commit -m "UI experiments: [describe what you tried]"

# Switch back to main
git checkout main

# Your experiments are safely stored in this branch!
```

---

## FAQs

**Q: Can I create sub-branches from this UI sandbox?**
A: Absolutely! Create as many experimental branches as you want:
```bash
git checkout -b ui-sandbox/glassmorphism
git checkout -b ui-sandbox/dark-mode-v2
```

**Q: Will my changes affect the main branch?**
A: Nope! This branch is isolated. Nothing merges back unless you explicitly do it.

**Q: Can I test on mobile?**
A: Yes! The app is mobile-ready with Capacitor:
```bash
npm run mobile:ios      # Open in Xcode
npm run mobile:android  # Open in Android Studio
```

**Q: How do I add more mock data?**
A: Edit `stores/mockStorage.ts` → `initializeMockData()` function. Add more meals, workouts, or customize existing data.

**Q: Can I test with no data?**
A: Yes! In `stores/mockStorage.ts`, comment out the sections you want empty:
```typescript
// mockLocalStorage['diet-by-day-v2'] = JSON.stringify(dietData);
```

---

## Have Fun! 🎉

This branch is your creative canvas. Try crazy ideas, break things, and iterate fast. The worst that can happen is a page reload resets everything.

Happy designing! ✨
