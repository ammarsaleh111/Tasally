# 🎨 Quick Color Reference

**Ammar Times Design System - Developer Cheat Sheet**

---

## Most Common Colors

```jsx
// Backgrounds
className="bg-background"        // Page background
className="bg-card"              // Card/modal background
className="bg-surface-hover"     // Hover state background

// Text
className="text-foreground"      // Primary text
className="text-text-muted"      // Secondary text
className="text-button-text"     // Button text (always white)

// Borders
className="border-border-default"  // Standard border
className="border-border-active"   // Active/focused border
className="border-card-border"     // Card borders

// Buttons
className="bg-button-primary text-button-text"
className="hover:bg-button-primary-hover"

// Keyboard Keys
className="bg-key text-key-fg hover:bg-key-hover"
```

---

## Game-Specific Colors

### Wordle
```jsx
// Correct letter (green)
className="bg-wordle-correct text-button-text"

// Present letter (yellow)
className="bg-wordle-present text-button-text"

// Absent letter (gray)
className="bg-wordle-absent text-button-text"

// Tile borders
className="border-wordle-border"
```

### Connections
```jsx
// Group colors (use with var())
className="bg-[var(--connections-yellow)]"
className="bg-[var(--connections-green)]"
className="bg-[var(--connections-blue)]"
className="bg-[var(--connections-purple)]"

// Text colors
className="text-[var(--connections-text-light)]"  // Black
className="text-[var(--connections-text-dark)]"   // White
```

### Crossword
```jsx
// Active cell
className="bg-[var(--crossword-active)]"
className="ring-[var(--crossword-active-ring)]"

// Highlighted word
className="bg-[var(--crossword-highlight)]"
```

---

## Common Patterns

### Primary Button
```jsx
<button className="
  bg-button-primary 
  text-button-text 
  hover:bg-button-primary-hover 
  transition-all
">
  Click Me
</button>
```

### Card
```jsx
<div className="
  bg-card 
  border 
  border-card-border 
  rounded-lg 
  p-6
  hover:border-border-active
  transition-all
">
  Content
</div>
```

### Input Field
```jsx
<input className="
  bg-background 
  border-2 
  border-border-default 
  focus:border-border-active 
  text-foreground
  rounded-lg
  transition-all
" />
```

### Modal
```jsx
<div className="
  bg-card 
  border 
  border-card-border 
  rounded-xl 
  shadow-2xl 
  p-6
">
  <h2 className="text-foreground">Title</h2>
  <p className="text-text-muted">Description</p>
</div>
```

### Toast Notification
```jsx
<div className="
  bg-[var(--toast-bg)] 
  text-[var(--toast-fg)] 
  border 
  border-[var(--toast-border)]
  rounded-md
">
  Message
</div>
```

---

## Using CSS Variables Directly

When Tailwind classes don't exist:

```jsx
// Background
className="bg-[var(--variable-name)]"

// Text
className="text-[var(--variable-name)]"

// Border
className="border-[var(--variable-name)]"

// Inline styles
style={{ backgroundColor: 'var(--variable-name)' }}
```

---

## Available Variables

### Base
- `--background`
- `--foreground`
- `--text-muted`

### UI
- `--key-bg`
- `--key-bg-hover`
- `--key-text`
- `--border-default`
- `--border-active`
- `--card-bg`
- `--card-border`
- `--surface-hover`

### Buttons
- `--button-primary`
- `--button-primary-hover`
- `--button-text`

### Wordle
- `--wordle-correct`
- `--wordle-present`
- `--wordle-absent`
- `--wordle-tile-border`

### Connections
- `--connections-yellow`
- `--connections-green`
- `--connections-blue`
- `--connections-purple`
- `--connections-text-light`
- `--connections-text-dark`

### Crossword
- `--crossword-active`
- `--crossword-active-ring`
- `--crossword-highlight`
- `--crossword-black`

### Feedback
- `--toast-bg`
- `--toast-fg`
- `--toast-border`

### Graphs
- `--graph-bar`
- `--graph-bg`

---

## ⚠️ Never Do This

```jsx
❌ className="bg-slate-800"
❌ className="text-white"
❌ className="bg-[#6aaa64]"
❌ className="border-gray-200"
❌ style={{ color: '#ffffff' }}
```

## ✅ Always Do This

```jsx
✅ className="bg-card"
✅ className="text-button-text"
✅ className="bg-[var(--wordle-correct)]"
✅ className="border-border-default"
✅ style={{ color: 'var(--foreground)' }}
```

---

## Theme Toggle Example

```jsx
import { useTheme } from '@/components/ThemeProvider';

export default function MyComponent() {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <button onClick={toggleTheme}>
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );
}
```

---

## Debugging Tips

1. **Check globals.css** - All colors defined there
2. **Inspect in DevTools** - See computed CSS variable values
3. **Toggle theme** - Ensure both modes look good
4. **Check contrast** - Use browser accessibility tools
5. **Test transitions** - Switch themes and watch for flashes

---

## Quick Test

After making changes:

```bash
# 1. Start dev server
npm run dev

# 2. Visit these pages in both themes:
# - / (home)
# - /games (hub)
# - /games/wordle
# - /games/connections
# - /games/crossword
# - /games/numbers
# - /games/trivia
# - /profile

# 3. Toggle theme multiple times
# 4. Check for white flashes
# 5. Verify smooth transitions
```

---

**Last Updated:** January 10, 2026  
**See:** [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for full documentation
