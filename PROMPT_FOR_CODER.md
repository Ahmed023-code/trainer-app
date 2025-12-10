# PROMPT_FOR_CODER: Neomorphism Design System - Complete App Restyle

## Objective
Apply neomorphism design styling to **ALL elements** across the entire Trainer App. Maintain all existing functionality, layout structure, and data flow while transforming the visual design to a soft, raised neomorphic aesthetic with subtle shadows and rounded edges throughout the application.

## Design Principles

### Neomorphism Core Characteristics
- **Soft Raised Appearance**: Elements appear to extrude from the background
- **Dual Shadow System**: 
  - Light shadow (top-left): `rgba(255, 255, 255, 0.7)` for light mode, `rgba(255, 255, 255, 0.05)` for dark mode
  - Dark shadow (bottom-right): `rgba(0, 0, 0, 0.15)` for light mode, `rgba(0, 0, 0, 0.5)` for dark mode
- **Background Matching**: Card/component backgrounds should be very close to page background (subtle contrast only)
- **Rounded Corners**: Use `rounded-2xl` or `rounded-3xl` for cards, `rounded-full` for buttons
- **Minimal Borders**: Remove or make borders extremely subtle (opacity < 0.1)
- **No Hard Edges**: All elements should have soft, organic feel
- **Inset Effects**: Input fields and recessed elements use inset shadows

## Global Setup

### 1. Background Colors (app/globals.css)
Update the root background colors:
- **Light Mode**: `--bg: #E5E7EB` (light gray)
- **Dark Mode**: `--bg: #1A1A1B` (dark gray)
- Update `html, body` background to use these colors

### 2. Neomorphic Shadow Utilities
Add reusable shadow classes to `app/globals.css`:
```css
/* Raised (extruded) elements */
.neomorphic-raised {
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.1), -8px -8px 16px rgba(255, 255, 255, 0.7);
}
.dark .neomorphic-raised {
  box-shadow: 8px 8px 16px rgba(0, 0, 0, 0.5), -8px -8px 16px rgba(255, 255, 255, 0.05);
}

/* Inset (recessed) elements */
.neomorphic-inset {
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.1), inset -4px -4px 8px rgba(255, 255, 255, 0.6);
}
.dark .neomorphic-inset {
  box-shadow: inset 4px 4px 8px rgba(0, 0, 0, 0.3), inset -4px -4px 8px rgba(255, 255, 255, 0.03);
}

/* Button pressed state */
.neomorphic-pressed {
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.5);
}
.dark .neomorphic-pressed {
  box-shadow: inset 2px 2px 4px rgba(0, 0, 0, 0.3), inset -2px -2px 4px rgba(255, 255, 255, 0.02);
}
```

## Implementation by Component Type

### A. CARDS & CONTAINERS

#### Pattern for All Cards:
- Remove: `border`, `bg-white/70`, `dark:bg-neutral-900/60`, `backdrop-blur`, `shadow-sm`
- Add:
  - Background: `bg-neutral-100` (light) / `bg-neutral-800` (dark)
  - Shadow: Use Tailwind arbitrary values: `shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)]` (dark)
  - Border radius: `rounded-3xl`
  - Remove all border classes

#### Files to Update:
1. **Home Tab** (`app/(tabs)/page.tsx`):
   - Weight card (line 243)
   - Diet Summary card (line 344)
   - Workout Summary card (line 402)
   - Inbox card (line 442)
   - Reminder items (line 462): Use inset neomorphic effect

2. **Diet Tab** (`app/(tabs)/diet/page.tsx`):
   - Meal cards (line 336): Apply neomorphic styling
   - "Log Meal" button container (line 375)

3. **Workout Tab** (`app/(tabs)/workout/page.tsx`):
   - Exercise cards (line 289): Apply neomorphic styling
   - Workout Notes card (line 324)
   - "Log Workout" button container (line 310)

4. **Settings Tab** (`app/(tabs)/settings/page.tsx`):
   - Profile section (line 57)
   - Appearance section (line 98)
   - Units section (line 125)
   - Workout Settings link (line 169)
   - Diet Settings link (line 184)
   - Logout section (line 199)

5. **Progress Tab** (`app/(tabs)/schedule/page.tsx`):
   - All view components will inherit from their component files (see Progress Components section)

6. **Login Page** (`app/login/page.tsx`):
   - Form container (line 58): Apply neomorphic card styling

7. **Onboarding Page** (`app/onboarding/page.tsx`):
   - Form container (line 34): Apply neomorphic card styling

### B. BUTTONS

#### Primary Action Buttons
- Remove: `bg-accent-*`, `text-white`, `hover:opacity-90`, `border`
- Add:
  - Background: `bg-neutral-200` (light) / `bg-neutral-700` (dark)
  - Shadow: `shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]` (dark)
  - Active state: `active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.1),inset_-2px_-2px_4px_rgba(255,255,255,0.5)]`
  - Text color: Use accent color (`text-accent-diet`, `text-accent-workout`, etc.)
  - Border radius: `rounded-full`
  - Font weight: `font-semibold`
  - Transition: `transition-all duration-200`

#### Secondary/Outline Buttons
- Same as primary but with neutral text color
- May use slightly lighter background

#### Icon Buttons (Edit, Delete, +/-)
- Light mode: `bg-neutral-200 shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.7)]`
- Dark mode: `dark:bg-neutral-700 dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.05)]`
- Active: `active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)]`
- Remove borders, keep accent color for icons

#### FABs (Floating Action Buttons)
- Diet tab FAB (line 387): Apply neomorphic raised effect
- Workout tab FAB (line 349): Apply neomorphic raised effect
- Clock button (line 338): Apply neomorphic raised effect

#### Files to Update:
- All button elements across all pages
- Bottom navigation buttons (see Navigation section)

### C. INPUT FIELDS

#### Pattern for All Inputs:
- Remove: `bg-white`, `dark:bg-neutral-900`, `border`, `bg-neutral-100`, `dark:bg-neutral-800`
- Add:
  - Background: `bg-neutral-100` (light) / `bg-neutral-800` (dark)
  - Shadow: `shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.6)]` (light) / `dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.03)]` (dark)
  - Border radius: `rounded-full` for most inputs, `rounded-xl` for textareas
  - Focus state: Add subtle glow using accent color with low opacity: `focus:ring-2 focus:ring-accent-*/20`

#### Files to Update:
- Home tab: Weight input (line 273)
- Settings: Name input (line 72)
- Login: Name input (line 69)
- Onboarding: Name input (line 37)
- All modal inputs (see Modals section)
- Textareas: Workout Notes (line 326)

### D. MODALS

#### Modal Container Pattern:
- Remove: `bg-white`, `dark:bg-neutral-900`, `border`, `shadow-xl`, `shadow-2xl`
- Add:
  - Background: `bg-neutral-100` (light) / `bg-neutral-800` (dark)
  - Shadow: More pronounced than cards: `shadow-[12px_12px_24px_rgba(0,0,0,0.15),-12px_-12px_24px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[12px_12px_24px_rgba(0,0,0,0.6),-12px_-12px_24px_rgba(255,255,255,0.05)]` (dark)
  - Border radius: `rounded-3xl`
  - Backdrop: Keep `bg-black/50` but add `backdrop-blur-sm`

#### Modal Internal Elements:
- Headers: Apply subtle inset or raised effect
- Inputs: Use inset neomorphic styling (see Input Fields section)
- Buttons: Use neomorphic button styling (see Buttons section)
- Lists/Items: Apply subtle inset effect for list items

#### Files to Update:
1. **Diet Modals**:
   - `components/diet/EditFoodModal.tsx`: Modal container, inputs, buttons
   - `components/diet/FoodLibraryModal.tsx`: Modal container, search input, food items
   - `components/diet/MealDetailModal.tsx`: Modal container, all internal elements
   - `components/diet/SaveMealModal.tsx`: Modal container, inputs
   - `components/diet/LoadMealModal.tsx`: Modal container, template cards
   - `components/diet/NutritionOverview.tsx`: Modal/page container
   - `components/diet/MicronutrientsModal.tsx`: Modal container
   - `components/diet/MealNutrientsModal.tsx`: Modal container

2. **Workout Modals**:
   - `components/workout/ExerciseDetailModal.tsx`: Modal container, set inputs, buttons
   - `components/workout/ExerciseLibraryModal.tsx`: Modal container, search, exercise items
   - `components/workout/RoutinesModal.tsx`: Modal container, routine cards
   - `components/workout/ExerciseHistoryModal.tsx`: Modal container, history items
   - `components/workout/ClockModal.tsx`: Modal container, timer controls

3. **Home Tab Modal**:
   - New Reminder Modal (line 513): Apply modal container pattern

### E. NAVIGATION

#### Bottom Navigation Bar (`app/(tabs)/layout.tsx`):
- Remove: `border`, `bg-white/95`, `dark:bg-neutral-900/95`, `backdrop-blur`, `shadow-xl`
- Add:
  - Background: `bg-neutral-100` (light) / `bg-neutral-800` (dark)
  - Shadow: `shadow-[0_-4px_12px_rgba(0,0,0,0.1),0_4px_12px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[0_-4px_12px_rgba(0,0,0,0.5),0_4px_12px_rgba(255,255,255,0.05)]` (dark)
  - Border radius: `rounded-full` (already applied)
  - Tab buttons: Apply neomorphic raised effect when active, subtle inset when inactive

#### DaySelector Component (`components/ui/DaySelector.tsx`):
- Date button: Apply neomorphic raised effect
- Navigation arrows: Apply subtle neomorphic effect
- Calendar picker: Apply neomorphic card styling
- Today button: Apply neomorphic button styling

### F. PROGRESS VIEW COMPONENTS

#### Files to Update:
1. `components/progress/DayView.tsx`: All cards and elements
2. `components/progress/WeekView.tsx`: Summary cards, day grid items
3. `components/progress/MonthView.tsx`: Calendar grid, day cells, summary cards
4. `components/progress/YearView.tsx`: Monthly cards, progress bars
5. `components/progress/DailyFeedbackCard.tsx`: Card container
6. `components/progress/GoalRingsCard.tsx`: Card container
7. `components/progress/WeightTrendCard.tsx`: Card container

#### Pattern:
- All cards: Use neomorphic card pattern
- Calendar cells: Subtle neomorphic effect, more pronounced when active
- Progress bars: Use inset neomorphic styling for track, raised for fill
- Summary cards: Standard neomorphic card styling

### G. DIET COMPONENTS

#### Files to Update:
1. `components/diet/MealSection.tsx`: 
   - Meal header: Neomorphic raised
   - Food items: Subtle inset effect
   - Action buttons: Neomorphic button styling
   - Kebab menu: Neomorphic card styling

2. `components/diet/MacroRings.tsx`:
   - Container: Neomorphic card styling
   - Action buttons: Neomorphic button styling
   - Rings themselves: Keep existing SVG styling, but container should be neomorphic

### H. WORKOUT COMPONENTS

#### Files to Update:
1. `components/workout/ExerciseSection.tsx`:
   - Exercise header: Neomorphic raised
   - Set items: Subtle inset effect
   - Action buttons: Neomorphic button styling
   - Set inputs: Inset neomorphic styling

2. `components/workout/BodyPartPills.tsx`:
   - Pills: Neomorphic raised effect with subtle shadows

3. `components/workout/WorkoutMiniChart.tsx`:
   - Chart container: Neomorphic card styling
   - Bars: Inset for track, raised for fill

### I. SETTINGS COMPONENTS

#### Files to Update:
1. `components/settings/DataBackupSection.tsx`: All cards and buttons
2. `components/settings/RemindersSection.tsx`: All cards and buttons

#### Settings Sub-pages:
- `app/(tabs)/settings/diet/page.tsx`: All form elements, cards, buttons
- `app/(tabs)/settings/workout/page.tsx`: All form elements, cards, buttons

### J. PILLS, BADGES & TAGS

#### BodyPartPills (`components/workout/BodyPartPills.tsx`):
- **Container card** (line 27): Apply neomorphic card styling (remove border, backdrop-blur, shadow-sm)
- **Individual pills** (line 35): 
  - Remove: `bg-gradient-to-r`, `border`, `shadow-sm`
  - Add: `bg-neutral-200` (light) / `bg-neutral-700` (dark)
  - Shadow: `shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.05)]` (dark)
  - Keep accent color for text
- **Count badges inside pills** (line 40):
  - Remove: `bg-[#8ff000]`
  - Add: `bg-neutral-300` (light) / `bg-neutral-600` (dark)
  - Shadow: `shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[2px_2px_4px_rgba(0,0,0,0.4),-2px_-2px_4px_rgba(255,255,255,0.05)]` (dark)

#### CompletionBadge (`components/ui/CompletionBadge.tsx`):
- Remove: `border`, `bg-gradient-to-r`, `animate-pulse`
- Add: `bg-neutral-200` (light) / `bg-neutral-700` (dark)
- Shadow: `shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.05)]` (dark)
- Keep gradient text effect

#### Macro Badges (in FoodLibraryModal, MealSection, etc.):
- All macro badges (P, F, C, Cal) with colored backgrounds:
  - Remove: `backgroundColor` inline styles, `border`
  - Add neomorphic raised effect with appropriate background colors
  - Light mode: `shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)]`
  - Dark mode: `dark:shadow-[2px_2px_4px_rgba(0,0,0,0.4),-2px_-2px_4px_rgba(255,255,255,0.05)]`

#### Set Type Badges (in ExerciseSection):
- Warmup, Working, Drop Set badges:
  - Apply neomorphic raised effect
  - Light mode: `shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)]`
  - Dark mode: `dark:shadow-[2px_2px_4px_rgba(0,0,0,0.4),-2px_-2px_4px_rgba(255,255,255,0.05)]`

### K. CHARTS & GRAPHS

#### WorkoutMiniChart (`components/workout/WorkoutMiniChart.tsx`):
- **Container** (lines 94, 221):
  - Remove: `border`, `bg-white/70`, `dark:bg-neutral-900/60`, `backdrop-blur`
  - Add: `bg-neutral-100` (light) / `bg-neutral-800` (dark)
  - Shadow: `shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-6px_-6px_12px_rgba(255,255,255,0.05)]` (dark)
  - Border radius: `rounded-2xl`
- **Tooltip** (lines 173, 286):
  - Remove: `border`, `bg-white`, `dark:bg-neutral-900`, `shadow-lg`
  - Add: `bg-neutral-200` (light) / `bg-neutral-700` (dark)
  - Shadow: `shadow-[4px_4px_8px_rgba(0,0,0,0.15),-4px_-4px_8px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[4px_4px_8px_rgba(0,0,0,0.5),-4px_-4px_8px_rgba(255,255,255,0.05)]` (dark)
- **Chart bars** (column variant): Apply subtle raised effect to bars
- **Chart points/circles**: Keep existing styling but ensure they have depth

#### WeightTrendCard (`components/progress/WeightTrendCard.tsx`):
- **Container** (line 96):
  - Remove: `border`, `bg-white/70`, `dark:bg-neutral-900/60`, `backdrop-blur`, `shadow-sm`
  - Add: `bg-neutral-100` (light) / `bg-neutral-800` (dark)
  - Shadow: `shadow-[8px_8px_16px_rgba(0,0,0,0.1),-8px_-8px_16px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[8px_8px_16px_rgba(0,0,0,0.5),-8px_-8px_16px_rgba(255,255,255,0.05)]` (dark)
  - Border radius: `rounded-3xl`
- **Stats grid items**: Apply subtle inset effect to stat containers

#### Chart Containers in Progress Views:
- All chart containers in DayView, WeekView, MonthView, YearView:
  - Apply neomorphic card styling
  - Ensure charts themselves (SVG) maintain visual clarity

### L. MENUS & CONTEXT MENUS

#### Kebab Menus (3-dot menus):
- **MealSection kebab menu** (`components/diet/MealSection.tsx`, line 327):
  - Remove: `border`, `bg-white`, `dark:bg-neutral-900`, `shadow-lg`
  - Add: `bg-neutral-200` (light) / `bg-neutral-700` (dark)
  - Shadow: `shadow-[6px_6px_12px_rgba(0,0,0,0.15),-6px_-6px_12px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[6px_6px_12px_rgba(0,0,0,0.5),-6px_-6px_12px_rgba(255,255,255,0.05)]` (dark)
  - Border radius: `rounded-2xl`
  - Menu items: Apply subtle inset effect on hover
- **ExerciseSection set menu** (`components/workout/ExerciseSection.tsx`):
  - Same styling as MealSection kebab menu
- **RoutinesModal routine menu** (`components/workout/RoutinesModal.tsx`):
  - Same styling as above
- **Kebab menu trigger buttons** (3-dot buttons):
  - Apply neomorphic raised effect
  - Light mode: `bg-neutral-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)]`
  - Dark mode: `dark:bg-neutral-700 dark:shadow-[2px_2px_4px_rgba(0,0,0,0.4),-2px_-2px_4px_rgba(255,255,255,0.05)]`
  - Active: `active:shadow-[inset_1px_1px_2px_rgba(0,0,0,0.15)]`

### M. SEGMENTED CONTROLS & TOGGLES

#### Progress Tab View Selector (`app/(tabs)/schedule/page.tsx`, line 103):
- **Container**:
  - Remove: `border`, `bg-white`, `dark:bg-neutral-900`
  - Add: `bg-neutral-200` (light) / `bg-neutral-700` (dark)
  - Shadow: `shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(255,255,255,0.03)]` (dark)
  - Border radius: `rounded-full`
- **Active segment** (line 108):
  - Remove: `bg-[var(--accent-progress)]`, `text-white`
  - Add: `bg-neutral-100` (light) / `bg-neutral-800` (dark)
  - Shadow: `shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.7)]` (light) / `dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.05)]` (dark)
  - Text color: Use accent color
- **Inactive segments**: Subtle inset appearance

#### Settings Toggle Buttons (`app/(tabs)/settings/page.tsx`):
- **Theme selector** (lines 104-118):
  - Container: Inset neomorphic effect
  - Active button: Raised neomorphic effect with accent color text
  - Inactive buttons: Subtle inset
- **Weight unit selector** (lines 131-143): Same pattern
- **Energy unit selector** (lines 150-162): Same pattern

#### Period Navigation Buttons (`app/(tabs)/schedule/page.tsx`, lines 76, 90):
- Apply neomorphic raised effect
- Light mode: `bg-neutral-200 shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.7)]`
- Dark mode: `dark:bg-neutral-700 dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.05)]`
- Active: `active:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.15)]`

### N. LIST ITEMS & CARDS

#### Food Items in Lists:
- **MealSection food items** (`components/diet/MealSection.tsx`, line 226):
  - Apply subtle inset neomorphic effect
  - Light mode: `bg-neutral-50 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.08),inset_-2px_-2px_4px_rgba(255,255,255,0.6)]`
  - Dark mode: `dark:bg-neutral-800/50 dark:shadow-[inset_2px_2px_4px_rgba(0,0,0,0.2),inset_-2px_-2px_4px_rgba(255,255,255,0.02)]`
  - Border radius: `rounded-xl`

#### Exercise Items in Lists:
- **ExerciseSection set items**: Apply same inset effect as food items

#### Template Cards (LoadMealModal, RoutinesModal):
- **Template cards**:
  - Remove: `border`, flat backgrounds
  - Add neomorphic raised effect
  - Light mode: `bg-neutral-200 shadow-[4px_4px_8px_rgba(0,0,0,0.1),-4px_-4px_8px_rgba(255,255,255,0.7)]`
  - Dark mode: `dark:bg-neutral-700 dark:shadow-[4px_4px_8px_rgba(0,0,0,0.4),-4px_-4px_8px_rgba(255,255,255,0.05)]`
  - Hover: Slightly more pronounced shadow

#### History Items (ExerciseHistoryModal):
- **History entry cards**: Apply neomorphic raised effect
- Same pattern as template cards

### O. PROGRESS VIEW ELEMENTS

#### Week View Day Grid (`components/progress/WeekView.tsx`):
- **Day grid items** (line 101+):
  - Apply neomorphic raised effect
  - Light mode: `bg-neutral-200 shadow-[3px_3px_6px_rgba(0,0,0,0.1),-3px_-3px_6px_rgba(255,255,255,0.7)]`
  - Dark mode: `dark:bg-neutral-700 dark:shadow-[3px_3px_6px_rgba(0,0,0,0.4),-3px_-3px_6px_rgba(255,255,255,0.05)]`
  - Active/selected days: More pronounced shadow
  - Badges inside: Neomorphic raised effect

#### Month View Calendar (`components/progress/MonthView.tsx`):
- **Calendar grid cells**:
  - Apply subtle neomorphic raised effect
  - Today cell: More pronounced shadow
  - Selected cell: Raised neomorphic effect
  - Cells with data: Subtle raised effect
- **Activity badges** in cells: Neomorphic raised effect

#### Year View Monthly Cards (`components/progress/YearView.tsx`):
- **Monthly cards**:
  - Apply neomorphic card styling
  - Progress bars: Inset for track, raised for fill
  - Stats: Neomorphic raised effect

### P. CHECKBOXES & RADIO BUTTONS

#### Checkboxes:
- Light mode: `bg-neutral-200 shadow-[2px_2px_4px_rgba(0,0,0,0.1),-2px_-2px_4px_rgba(255,255,255,0.7)]`
- Dark mode: `dark:bg-neutral-700 dark:shadow-[2px_2px_4px_rgba(0,0,0,0.4),-2px_-2px_4px_rgba(255,255,255,0.05)]`
- Checked state: Use accent color with neomorphic inset
- Remove all borders

#### Radio Buttons:
- Same pattern as checkboxes

### Q. DROPDOWNS & SELECTS

#### Dropdowns/Selects:
- Container: Neomorphic raised
- Options list: Neomorphic card styling with raised effect
- Selected option: Subtle inset effect

### R. PROGRESS RINGS & CIRCULAR ELEMENTS

#### Macro Rings (`components/diet/MacroRings.tsx`):
- **Container**: Neomorphic card styling
- **Ring containers**: Subtle raised effect
- **Value badges**: Neomorphic raised effect
- Keep existing SVG ring rendering, but ensure containers have depth

#### Progress Rings in Home Tab:
- Same styling as MacroRings
- Center labels: Neomorphic raised effect

## Implementation Checklist

### Phase 1: Global Setup
- [ ] Update background colors in `app/globals.css`
- [ ] Add neomorphic shadow utility classes
- [ ] Test background colors in light and dark modes

### Phase 2: Core Components
- [ ] Update DaySelector component
- [ ] Update bottom navigation bar
- [ ] Update all button styles globally
- [ ] Update all input field styles globally

### Phase 3: Main Pages
- [ ] Home tab - all cards and elements
- [ ] Diet tab - meal cards, buttons, FAB
- [ ] Workout tab - exercise cards, buttons, FAB
- [ ] Settings tab - all sections
- [ ] Progress tab - all view components
- [ ] Login page
- [ ] Onboarding pages

### Phase 4: Modals
- [ ] All diet modals
- [ ] All workout modals
- [ ] Home tab reminder modal

### Phase 5: Specialized Components
- [ ] MealSection component
- [ ] ExerciseSection component
- [ ] Progress view components
- [ ] Settings sub-pages

### Phase 6: Pills, Badges & Tags
- [ ] BodyPartPills container and individual pills
- [ ] Count badges inside pills
- [ ] CompletionBadge
- [ ] All macro badges (P, F, C, Cal) throughout app
- [ ] Set type badges (Warmup, Working, Drop Set)

### Phase 7: Charts & Graphs
- [ ] WorkoutMiniChart containers and tooltips
- [ ] WeightTrendCard container
- [ ] All chart containers in progress views
- [ ] Chart tooltips and interactive elements

### Phase 8: Menus & Context Menus
- [ ] All kebab menus (MealSection, ExerciseSection, RoutinesModal)
- [ ] Kebab menu trigger buttons (3-dot buttons)
- [ ] Menu items and hover states

### Phase 9: Segmented Controls & Toggles
- [ ] Progress tab view selector
- [ ] Settings toggle buttons (Theme, Weight, Energy)
- [ ] Period navigation buttons
- [ ] All segmented controls throughout app

### Phase 10: List Items & Cards
- [ ] Food items in MealSection
- [ ] Exercise set items
- [ ] Template cards (LoadMealModal, RoutinesModal)
- [ ] History items (ExerciseHistoryModal)

### Phase 11: Progress View Elements
- [ ] Week view day grid items
- [ ] Month view calendar cells
- [ ] Year view monthly cards
- [ ] All progress view badges and indicators

### Phase 12: Final Polish & Testing
- [ ] Verify ALL elements have neomorphic styling (no flat elements remaining)
- [ ] Check pills, badges, tags throughout entire app
- [ ] Verify all charts have neomorphic containers
- [ ] Verify all menus have neomorphic styling
- [ ] Verify all buttons (including icon buttons, toggles, segmented controls)
- [ ] Verify all interactive states (hover, active, focus, pressed)
- [ ] Test dark mode appearance for ALL elements
- [ ] Test light mode appearance for ALL elements
- [ ] Test mobile responsiveness
- [ ] Verify accessibility (contrast ratios)
- [ ] Performance testing (shadow rendering)
- [ ] Visual audit: Walk through every screen and verify no flat elements remain

## Technical Implementation Notes

1. **Shadow Values**: Use Tailwind's arbitrary values `shadow-[...]` for precise control
2. **Performance**: Neomorphic shadows can be performance-intensive; test on lower-end devices
3. **Responsive Design**: Ensure neomorphic effects work well on mobile devices
4. **Accessibility**: Maintain WCAG contrast ratios for all text (minimum 4.5:1 for normal text)
5. **Dark Mode**: Ensure neomorphic effects are visible and appropriate in dark mode
6. **Transitions**: Add smooth transitions for interactive states: `transition-all duration-200`
7. **Z-index**: Maintain existing z-index hierarchy for modals and overlays
8. **Backdrop Blur**: Use sparingly; may impact performance on some devices

## Important Constraints

- **DO NOT** change any functionality, state management, or data flow
- **DO NOT** modify component structure or JSX hierarchy
- **DO NOT** change any prop names or component interfaces
- **DO NOT** alter any event handlers or business logic
- **ONLY** modify CSS classes and styling
- Maintain all existing accessibility attributes (aria-labels, etc.)
- Preserve all existing responsive breakpoints
- Keep all existing animations and transitions (add neomorphic styling to them)
- Maintain existing color schemes for accents (diet green, workout yellow, etc.)

## Expected Visual Result

The entire app should have a cohesive, modern neomorphic design where:
- All cards appear to float slightly above the background
- All buttons feel pressable with depth and tactile feedback
- All inputs appear recessed into the surface
- Modals have elevated, prominent appearance
- Navigation feels integrated and raised
- The overall aesthetic is clean, minimalist, premium, and cohesive
- The design maintains excellent usability and readability across all screens
- Light and dark modes both have appropriate neomorphic effects

## Files Summary

### Core Files to Modify:
- `app/globals.css` - Global styles and utilities
- `app/(tabs)/layout.tsx` - Bottom navigation
- `app/(tabs)/page.tsx` - Home tab
- `app/(tabs)/diet/page.tsx` - Diet tab
- `app/(tabs)/workout/page.tsx` - Workout tab
- `app/(tabs)/settings/page.tsx` - Settings tab
- `app/(tabs)/schedule/page.tsx` - Progress tab
- `app/login/page.tsx` - Login page
- `app/onboarding/page.tsx` - Onboarding page

### Component Files to Modify:
- `components/ui/DaySelector.tsx`
- All files in `components/diet/`
- All files in `components/workout/`
- All files in `components/progress/`
- All files in `components/settings/`

### Settings Sub-pages (if they exist):
- `app/(tabs)/settings/diet/page.tsx`
- `app/(tabs)/settings/workout/page.tsx`

## CRITICAL: Complete Element Coverage Checklist

**EVERY VISUAL ELEMENT** in the app must have neomorphic styling. Before considering the task complete, verify that ALL of the following have been styled:

### ✅ Elements That MUST Have Neomorphism:

1. **All Cards & Containers**
   - [ ] Weight card
   - [ ] Diet Summary card
   - [ ] Workout Summary card
   - [ ] Inbox card
   - [ ] Meal cards
   - [ ] Exercise cards
   - [ ] Settings sections
   - [ ] Progress view cards
   - [ ] Modal containers
   - [ ] Chart containers

2. **All Buttons**
   - [ ] Primary action buttons (Open Diet, Open Workout, Save Weight, etc.)
   - [ ] Secondary buttons
   - [ ] Icon buttons (edit, delete, +/-)
   - [ ] FABs (floating action buttons)
   - [ ] Navigation buttons (prev/next, period navigation)
   - [ ] Toggle buttons (settings)
   - [ ] Segmented control buttons
   - [ ] Kebab menu trigger buttons (3-dot buttons)
   - [ ] Bottom navigation tab buttons

3. **All Inputs**
   - [ ] Text inputs
   - [ ] Number inputs
   - [ ] Textareas
   - [ ] Date inputs
   - [ ] Search inputs

4. **All Pills & Badges**
   - [ ] BodyPartPills container
   - [ ] Individual body part pills
   - [ ] Count badges inside pills
   - [ ] CompletionBadge
   - [ ] Macro badges (P, F, C, Cal)
   - [ ] Set type badges (Warmup, Working, Drop Set)
   - [ ] Activity badges in progress views
   - [ ] Day completion indicators

5. **All Charts & Graphs**
   - [ ] WorkoutMiniChart container
   - [ ] Chart tooltips
   - [ ] WeightTrendCard container
   - [ ] All progress view chart containers
   - [ ] Chart bars (column charts)
   - [ ] Chart points/circles

6. **All Menus**
   - [ ] Kebab menus (MealSection, ExerciseSection, RoutinesModal)
   - [ ] Menu items
   - [ ] Context menus
   - [ ] Dropdown menus

7. **All Segmented Controls**
   - [ ] Progress tab view selector
   - [ ] Settings toggle groups (Theme, Weight, Energy)
   - [ ] Any other segmented controls

8. **All List Items**
   - [ ] Food items in meals
   - [ ] Exercise set items
   - [ ] Template cards
   - [ ] History items
   - [ ] Reminder items

9. **All Progress View Elements**
   - [ ] Week view day grid items
   - [ ] Month view calendar cells
   - [ ] Year view monthly cards
   - [ ] Day badges
   - [ ] Activity indicators

10. **All Special Elements**
    - [ ] Checkboxes
    - [ ] Radio buttons
    - [ ] DaySelector component
    - [ ] Calendar picker
    - [ ] Bottom navigation bar
    - [ ] Modal backdrops (keep blur, but ensure modals are raised)

### 🚨 Common Elements That Are Often Missed:

- **Pills/Badges**: BodyPartPills, count badges, macro badges, set type badges
- **Chart Containers**: WorkoutMiniChart, WeightTrendCard, all progress charts
- **Chart Tooltips**: All tooltips in charts
- **Kebab Menus**: All 3-dot menus and their containers
- **Segmented Controls**: View selector, settings toggles
- **List Items**: Food items, set items, template cards
- **Progress Grid Items**: Week day grid, month calendar cells
- **Icon Buttons**: All small icon buttons (edit, delete, kebab triggers)
- **Badges Inside Cards**: Count badges, status badges, completion indicators

### Visual Audit Process:

1. **Screen-by-Screen Walkthrough**: Go through every screen in the app
2. **Element-by-Element Check**: For each screen, identify every visual element
3. **Verify Depth**: Every element should have either:
   - Raised neomorphic effect (extruded from background)
   - Inset neomorphic effect (recessed into background)
4. **No Flat Elements**: If an element looks flat or has only a border, it needs neomorphism
5. **Consistency Check**: Similar elements should have similar neomorphic styling
6. **Dark Mode Check**: Verify all elements have appropriate neomorphic effects in dark mode
7. **Light Mode Check**: Verify all elements have appropriate neomorphic effects in light mode

## Final Notes

This is a comprehensive styling overhaul. **NO ELEMENT SHOULD REMAIN FLAT**. Work systematically through each section, testing as you go. The neomorphic design should feel cohesive and consistent across all screens and components. 

**Remember**: If an element has a background color, border, or shadow, it should have neomorphic styling. When in doubt, apply neomorphism - it's better to have consistent neomorphic styling throughout than to have some elements look flat.

The goal is a **100% neomorphic design** where every interactive and visual element has depth and dimension. Double-check pills, badges, charts, menus, buttons, and all UI elements to ensure complete coverage.
