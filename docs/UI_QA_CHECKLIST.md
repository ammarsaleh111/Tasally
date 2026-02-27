# UI/UX Quality Assurance Checklist

## Ammar Times - Premium Puzzle Platform

This document provides a comprehensive QA checklist for validating all UI improvements across light and dark modes.

---

## 🎨 Design System Verification

### Design Tokens (`src/utils/designTokens.ts`)

- [ ] All spacing values use consistent scale (0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24)
- [ ] Typography scale is consistent (xs, sm, base, lg, xl, 2xl, 3xl, 4xl, 5xl)
- [ ] Border radius follows scale (none, sm, md, lg, xl, 2xl, full)
- [ ] Shadow levels defined (none, sm, md, lg, xl, 2xl, inner)
- [ ] Game-specific colors defined (wordle, connections, strands, crossword)
- [ ] All 7 seasonal themes have accent colors

### CSS Variables (`src/app/globals.css`)

- [ ] Light theme variables complete in `:root`
- [ ] Dark theme variables complete in `.dark`
- [ ] Theme accent system working with `data-theme` attribute
- [ ] All 7 seasonal theme accent overrides defined
- [ ] Focus ring styles present (`:focus-visible`)
- [ ] Reduced motion preferences respected (`@media prefers-reduced-motion`)

---

## 🧩 UI Components (`src/components/ui/`)

### Button Component

| Test                                  | Light Mode | Dark Mode |
| ------------------------------------- | ---------- | --------- |
| Primary variant renders correctly     | ☐          | ☐         |
| Secondary variant renders correctly   | ☐          | ☐         |
| Ghost variant renders correctly       | ☐          | ☐         |
| Outline variant renders correctly     | ☐          | ☐         |
| Destructive variant renders correctly | ☐          | ☐         |
| Success variant renders correctly     | ☐          | ☐         |
| Disabled state visible                | ☐          | ☐         |
| Loading spinner visible               | ☐          | ☐         |
| Focus ring visible on keyboard focus  | ☐          | ☐         |
| Hover states work                     | ☐          | ☐         |

### Card Component

| Test                                      | Light Mode | Dark Mode |
| ----------------------------------------- | ---------- | --------- |
| Default variant renders                   | ☐          | ☐         |
| Elevated variant has shadow               | ☐          | ☐         |
| Bordered variant has border               | ☐          | ☐         |
| Interactive variant has hover effect      | ☐          | ☐         |
| Gradient variant has gradient             | ☐          | ☐         |
| CardHeader, CardTitle, CardContent render | ☐          | ☐         |

### Badge Component

| Test                          | Light Mode | Dark Mode |
| ----------------------------- | ---------- | --------- |
| Default variant               | ☐          | ☐         |
| Success variant (green)       | ☐          | ☐         |
| Warning variant (amber)       | ☐          | ☐         |
| Danger variant (red)          | ☐          | ☐         |
| Info variant (blue)           | ☐          | ☐         |
| Accent variant (theme accent) | ☐          | ☐         |
| Outline variant               | ☐          | ☐         |

### Modal Component

| Test                                | Light Mode | Dark Mode |
| ----------------------------------- | ---------- | --------- |
| Backdrop blur visible               | ☐          | ☐         |
| Modal centered on screen            | ☐          | ☐         |
| Close button visible                | ☐          | ☐         |
| Escape key closes modal             | ☐          | ☐         |
| Click outside closes modal          | ☐          | ☐         |
| Focus trapped inside modal          | ☐          | ☐         |
| Size variants (sm, md, lg, xl) work | ☐          | ☐         |
| Reduced motion: no animation        | ☐          | ☐         |

### Toast Component

| Test                        | Light Mode | Dark Mode |
| --------------------------- | ---------- | --------- |
| Default toast visible       | ☐          | ☐         |
| Success toast (green icon)  | ☐          | ☐         |
| Error toast (red icon)      | ☐          | ☐         |
| Warning toast (amber icon)  | ☐          | ☐         |
| Info toast (blue icon)      | ☐          | ☐         |
| Dismiss button works        | ☐          | ☐         |
| Auto-dismiss after duration | ☐          | ☐         |

### Other Components

| Component                                | Light Mode | Dark Mode |
| ---------------------------------------- | ---------- | --------- |
| Tabs (default/pills/underline/segmented) | ☐          | ☐         |
| Input, Select, Checkbox, Toggle          | ☐          | ☐         |
| Progress bar fills correctly             | ☐          | ☐         |
| Skeleton loading animations              | ☐          | ☐         |
| Tooltip displays on hover                | ☐          | ☐         |
| IconButton circular shape                | ☐          | ☐         |

---

## 📄 Page-Level Verification

### Home Page (`/`)

| Test                                      | Light Mode | Dark Mode |
| ----------------------------------------- | ---------- | --------- |
| Hero section gradient visible             | ☐          | ☐         |
| Countdown timer updates                   | ☐          | ☐         |
| Stats cards display correctly             | ☐          | ☐         |
| Recent achievements show                  | ☐          | ☐         |
| Theme event badge (when active)           | ☐          | ☐         |
| CTA button hover state                    | ☐          | ☐         |
| Responsive layout (mobile/tablet/desktop) | ☐          | ☐         |

### Games Hub (`/games`)

| Test                          | Light Mode | Dark Mode |
| ----------------------------- | ---------- | --------- |
| SiteHeader renders            | ☐          | ☐         |
| 9 game cards display          | ☐          | ☐         |
| Game icons visible            | ☐          | ☐         |
| Game descriptions readable    | ☐          | ☐         |
| Streak badges show            | ☐          | ☐         |
| Theme indicator (when active) | ☐          | ☐         |
| Card hover effects            | ☐          | ☐         |
| Quick action buttons work     | ☐          | ☐         |

### Profile Page (`/profile`)

| Test                         | Light Mode | Dark Mode |
| ---------------------------- | ---------- | --------- |
| Avatar displays              | ☐          | ☐         |
| Player name editable         | ☐          | ☐         |
| Overall stats visible        | ☐          | ☐         |
| Game performance cards       | ☐          | ☐         |
| Achievements grid            | ☐          | ☐         |
| Progress bars fill correctly | ☐          | ☐         |
| Activity streak calendar     | ☐          | ☐         |

### Leaderboard Page (`/leaderboard`)

| Test                             | Light Mode | Dark Mode |
| -------------------------------- | ---------- | --------- |
| Game select dropdown works       | ☐          | ☐         |
| Daily/Monthly tabs toggle        | ☐          | ☐         |
| Current game badge shows         | ☐          | ☐         |
| Table headers styled             | ☐          | ☐         |
| Rank medals (gold/silver/bronze) | ☐          | ☐         |
| Top 3 row highlighting           | ☐          | ☐         |
| Row hover effect                 | ☐          | ☐         |
| Loading spinner shows            | ☐          | ☐         |
| Empty state message              | ☐          | ☐         |
| Error state with retry           | ☐          | ☐         |

### Site Header

| Test                              | Light Mode | Dark Mode |
| --------------------------------- | ---------- | --------- |
| Logo/brand visible                | ☐          | ☐         |
| Navigation links clickable        | ☐          | ☐         |
| Active link highlighted           | ☐          | ☐         |
| Theme toggle works                | ☐          | ☐         |
| Scroll-based styling (if applied) | ☐          | ☐         |
| Mobile menu opens                 | ☐          | ☐         |
| Mobile menu closes on link click  | ☐          | ☐         |

---

## 🎮 Game Pages Verification

For each game, verify the following:

### Common Elements

| Game         | Header | Grid | Keyboard | Modal | Toast |
| ------------ | ------ | ---- | -------- | ----- | ----- |
| Wordle       | ☐      | ☐    | ☐        | ☐     | ☐     |
| Connections  | ☐      | ☐    | N/A      | ☐     | ☐     |
| Crossword    | ☐      | ☐    | ☐        | ☐     | ☐     |
| Numbers      | ☐      | ☐    | ☐        | ☐     | ☐     |
| Trivia       | ☐      | N/A  | N/A      | ☐     | ☐     |
| Strands      | ☐      | ☐    | N/A      | ☐     | ☐     |
| Spelling Bee | ☐      | ☐    | ☐        | ☐     | ☐     |
| Waffle       | ☐      | ☐    | ☐        | ☐     | ☐     |
| Combinations | ☐      | ☐    | N/A      | ☐     | ☐     |

### Game-Specific Colors

| Element                     | Light Mode | Dark Mode |
| --------------------------- | ---------- | --------- |
| Wordle correct (green)      | ☐          | ☐         |
| Wordle present (yellow)     | ☐          | ☐         |
| Wordle absent (gray)        | ☐          | ☐         |
| Connections category colors | ☐          | ☐         |
| Strands ribbon colors       | ☐          | ☐         |
| Crossword active cell       | ☐          | ☐         |

---

## 🌙 Theme Engine Verification

### Light/Dark Toggle

- [ ] Toggle button visible in header
- [ ] Click toggles between light and dark
- [ ] Preference persists on page reload
- [ ] All pages respect the theme
- [ ] Transitions are smooth (0.3s)

### Seasonal Theme Accents

Test when a seasonal theme is active:

| Theme            | Accent Applied | Badge Shows | Game Content Themed |
| ---------------- | -------------- | ----------- | ------------------- |
| Halloween (Oct)  | ☐              | ☐           | ☐                   |
| Christmas (Dec)  | ☐              | ☐           | ☐                   |
| Ramadan (varies) | ☐              | ☐           | ☐                   |
| Sports Week      | ☐              | ☐           | ☐                   |
| World Cup        | ☐              | ☐           | ☐                   |
| Music Week       | ☐              | ☐           | ☐                   |
| Oscar Week (Feb) | ☐              | ☐           | ☐                   |

### Theme Accent CSS Variables

When a theme is active (e.g., `data-theme="halloween"`):

- [ ] `--theme-accent` overrides work
- [ ] `--theme-accent-foreground` readable
- [ ] `--theme-accent-soft` visible
- [ ] Buttons with accent class use theme color
- [ ] Badges with accent variant use theme color

---

## ♿ Accessibility Verification

### Keyboard Navigation

- [ ] Tab through all interactive elements
- [ ] Focus indicators visible (2px ring)
- [ ] Escape closes modals/dropdowns
- [ ] Enter/Space activates buttons
- [ ] Arrow keys navigate tabs/lists

### Screen Reader

- [ ] All buttons have accessible names
- [ ] Images have alt text
- [ ] Form inputs have labels
- [ ] Error messages announced
- [ ] Modal focus announced

### Reduced Motion

With `prefers-reduced-motion: reduce`:

- [ ] No page animations
- [ ] No confetti
- [ ] No flip animations
- [ ] Transitions are instant

### Color Contrast

| Element                 | Light Mode WCAG | Dark Mode WCAG |
| ----------------------- | --------------- | -------------- |
| Body text on background | ≥4.5:1 ☐        | ≥4.5:1 ☐       |
| Heading text            | ≥4.5:1 ☐        | ≥4.5:1 ☐       |
| Muted text              | ≥4.5:1 ☐        | ≥4.5:1 ☐       |
| Button text on primary  | ≥4.5:1 ☐        | ≥4.5:1 ☐       |
| Link text               | ≥4.5:1 ☐        | ≥4.5:1 ☐       |
| Error text              | ≥4.5:1 ☐        | ≥4.5:1 ☐       |

---

## 📱 Responsive Design

### Breakpoints

| Breakpoint              | Page        | Layout Correct |
| ----------------------- | ----------- | -------------- |
| Mobile (< 640px)        | Home        | ☐              |
| Mobile (< 640px)        | Games       | ☐              |
| Mobile (< 640px)        | Profile     | ☐              |
| Mobile (< 640px)        | Leaderboard | ☐              |
| Tablet (640px - 1024px) | Home        | ☐              |
| Tablet (640px - 1024px) | Games       | ☐              |
| Tablet (640px - 1024px) | Profile     | ☐              |
| Tablet (640px - 1024px) | Leaderboard | ☐              |
| Desktop (> 1024px)      | Home        | ☐              |
| Desktop (> 1024px)      | Games       | ☐              |
| Desktop (> 1024px)      | Profile     | ☐              |
| Desktop (> 1024px)      | Leaderboard | ☐              |

### Mobile-Specific

- [ ] Touch targets ≥ 44x44px
- [ ] No horizontal scroll
- [ ] Text readable without zoom
- [ ] Mobile menu accessible
- [ ] Modals fit screen

---

## 🚀 Performance

- [ ] No layout shift on load
- [ ] Images optimized
- [ ] CSS animations use `transform`/`opacity`
- [ ] `will-change` used sparingly
- [ ] No excessive re-renders

---

## 🧪 Test Scenarios

### New User Flow

1. [ ] Land on home page - hero visible
2. [ ] Click "Play Today's Puzzles" - goes to games
3. [ ] Select a game - game loads
4. [ ] Complete game - result modal shows
5. [ ] View profile - stats updated
6. [ ] Check leaderboard - position visible

### Theme Toggle Flow

1. [ ] Start in dark mode (default)
2. [ ] Click theme toggle
3. [ ] All elements switch to light mode
4. [ ] Refresh page - light mode persists
5. [ ] Toggle back to dark mode

### Error Handling

- [ ] Network error shows message
- [ ] Empty states display correctly
- [ ] Invalid input shows error feedback
- [ ] Retry buttons work

---

## ✅ Sign-off

| Reviewer | Date | Light Mode | Dark Mode  | Notes |
| -------- | ---- | ---------- | ---------- | ----- |
|          |      | ☐ Approved | ☐ Approved |       |

---

_Last Updated: January 2026_
_Ammar Times v1.0 Design System_
