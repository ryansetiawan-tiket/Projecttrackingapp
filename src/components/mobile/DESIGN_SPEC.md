# Mobile Timeline Week View - Design Specification

## Visual Overview

```
┌─────────────────────────────────────┐
│         Timeline Header             │ 
│  Timeline      [Today] [Hide Done]  │
│  8 projects                         │
├─────────────────────────────────────┤
│  ◀  [Mo] [Tu] [We] [Th] [Fr]  ▶    │ ← Week Strip (horizontal scroll)
│      10   11   12   13   14         │   64px per day cell
├─────────────────────────────────────┤
│                                     │
│  ▼ Marketing                        │ ← Lane Accordion (collapsed)
│     3 projects                      │
│                                     │
│  ▼ Product                          │
│     ┌──────────────────────────┐   │
│     │ ▎Project Alpha           │   │ ← Agenda Item Card
│     │ ▎Marketing • Icon        │   │   - 6px color stripe
│     │ ▎Oct 10 - Oct 15  ● On… │   │   - Title + meta + status
│     │                        ▸ │   │   - 64px min height
│     └──────────────────────────┘   │
│     ┌──────────────────────────┐   │
│     │ ▎Project Beta            │   │
│     │ ▎Product • Spot          │   │
│     │ ▎Oct 12 - Oct 20  ● Rev… │   │
│     │                        ▸ │   │
│     └──────────────────────────┘   │
│                                     │
│                                     │
│                                     │
│                                     │
└─────────────────────────────────────┘

         ↓ Tap agenda item ↓

┌─────────────────────────────────────┐
│            ═══════                  │ ← Swipe handle
│                                 ✕   │
│  Project Alpha                      │ ← Bottom Sheet
│  Marketing • Icon                   │   85vh max height
│                                     │   Swipeable to dismiss
│  📅 Timeline                        │
│     October 10, 2024                │
│     to                              │
│     October 15, 2024                │
│                                     │
│  👤 Collaborators                   │
│     [Alex] [Jordan]                 │
│                                     │
│  🔗 Figma                           │
│     Open in Figma →                 │
│                                     │
│  📝 Notes                           │
│     Design system icons for...     │
│                                     │
│  ┌──────────────┬────────────────┐ │
│  │ Edit Project │ Mark as Done   │ │ ← Action buttons
│  └──────────────┴────────────────┘ │   44px+ touch targets
└─────────────────────────────────────┘
```

## Component Dimensions

### DayCell (64px width)
```
┌─────────┐
│   Wed   │ ← 12px text
│   13    │ ← 16px bold
│  ● ● ●  │ ← Event indicators (1px dots)
└─────────┘
  64px
```

### EventBar (32px height)
```
┌──────────────────────────────────┐
│ Project Name - Oct 13         ▸  │ ← 14px, truncated
└──────────────────────────────────┘
 Full width               32px height
 Background: status color
```

### AgendaItem Card (64px min height)
```
┌─┬────────────────────────────────┬──┐
│▎│ Project Name                   │▸ │
│▎│ Marketing • Icon • Oct 10-15   │  │
│▎│ ● In Progress                  │  │
└─┴────────────────────────────────┴──┘
 6px   Content area               20px
 stripe                          chevron
```

### Lane Accordion Header (56px)
```
┌──────────────────────────────────────┐
│ ▶ Marketing                  [3] [2] │ ← 56px touch target
│   3 projects                         │
└──────────────────────────────────────┘
  Chevron + name        Status badges
```

## Color System

Uses existing design tokens from globals.css:

**Status Colors** (from `getStatusColor`):
- Not Started: `#6B7280` (Gray 500)
- In Progress: `#FFE5A0` (Yellow)
- On Review: `#F59E0B` (Amber 500)
- Done: `#10B981` (Green 500)
- On Hold: `#F97316` (Orange 500)
- Canceled: `#EF4444` (Red 500)

**UI Colors**:
- Background: `var(--background)`
- Foreground: `var(--foreground)`
- Muted: `var(--muted)`
- Accent: `var(--accent)`
- Border: `var(--border)`

**Text Colors**:
- Title: 14-16px, `text-foreground`
- Meta: 12px, `text-muted-foreground`
- On colored backgrounds: Contrast calculated via `getContrastColor`

## Typography

**No font-size/weight overrides** - uses base typography from globals.css:

- Headers: 16-18px semibold
- Body: 14px regular
- Meta: 12px regular
- Small: 10-11px regular

## Spacing Scale

**Padding** (Tailwind scale):
- Container: `px-4 py-3` (16px / 12px)
- Cards: `p-3` (12px)
- Compact: `p-2` (8px)

**Gaps**:
- Week strip cells: `gap-2` (8px)
- Agenda items: `gap-2` (8px)
- Icon + text: `gap-1` to `gap-3` (4-12px)

**Border Radius**:
- Cards: `rounded-lg` (8px)
- Buttons: `rounded-lg` (8px)
- Badges: `rounded-full` or `rounded` (4px)

## Interactions & Animations

### Tap States
- **Default**: `hover:bg-accent`
- **Active**: `active:scale-[0.98]` or `active:bg-accent/80`
- **Tap highlight**: Removed via `-webkit-tap-highlight-color: transparent`

### Transitions
- Background: `transition-colors`
- Transform: `transition-all` or `transition-transform`
- Smooth scroll: `scroll-smooth`

### Long Press (EventBar)
- Duration: 500ms
- Haptic: 50ms vibration on supported devices
- Visual: No visual change (future: show menu overlay)

### Scroll Behaviors
- **Week Strip**: 
  - Horizontal scroll with snap points
  - Momentum scrolling
  - Auto-scroll to today on mount
- **Agenda List**:
  - Vertical momentum scroll
  - Overscroll containment

### Bottom Sheet
- Entry: Slide up from bottom (Smart Animate)
- Exit: Swipe down or tap overlay
- Backdrop: Semi-transparent overlay

## Responsive Rules

### Viewport Breakpoints
```css
< 768px (mobile)  → Show mobile timeline
>= 768px (tablet+) → Show desktop timeline
```

### Touch Target Compliance
All interactive elements ≥ 44px in at least one dimension:

| Component | Width | Height | Compliant |
|-----------|-------|--------|-----------|
| DayCell | 64px | 64px | ✅ Yes |
| EventBar | 100% | 32px | ✅ Yes (in stack) |
| AgendaItem | 100% | 64px | ✅ Yes |
| LaneAccordion | 100% | 56px | ✅ Yes |
| Button | varies | 44px+ | ✅ Yes |

## Accessibility

### Semantic HTML
- Buttons for interactive elements
- Proper heading hierarchy
- ARIA labels on icon-only buttons

### Keyboard Support
- Tab navigation (desktop fallback)
- Enter/Space to activate buttons
- Escape to close bottom sheet

### Screen Reader
- Descriptive labels
- Status announcements
- Count information

### Color Contrast
- Text on colored backgrounds: Auto-calculated via `getContrastColor`
- Minimum ratio: 4.5:1 for body text
- Status badges: Color + text label

## States & Variants

### DayCell States
- `default`: Gray background
- `today`: Blue highlight + ring
- `selected`: Primary color, white text
- `hasEvents`: Show event indicator dots

### EventBar Variants
- `default`: Full rounded corners
- `multiDay start`: Rounded left only
- `multiDay middle`: No rounded corners
- `multiDay end`: Rounded right only
- `done`: 70% opacity

### LaneAccordion States
- `collapsed`: Chevron rotated -90°
- `expanded`: Chevron rotated 0°, content visible

### AgendaItem States
- `default`: Border + hover effect
- `hover`: Accent background
- `active`: Accent/80 + scale 98%

## Empty States

### No Projects
```
┌─────────────────────────────────────┐
│           📅                        │
│    No projects to display           │
└─────────────────────────────────────┘
```

### No Projects on Date (filtered)
```
┌─────────────────────────────────────┐
│           📅                        │
│   No projects on this date          │
│   [Clear date filter]               │
└─────────────────────────────────────┘
```

## Performance Optimizations

- Lazy rendering of accordion content
- Virtualized scrolling not needed (acceptable item counts)
- Memoized date calculations
- Event count caching per date
- Debounced scroll handlers

## Browser Support

- Modern browsers (Chrome, Safari, Firefox, Edge)
- iOS Safari 14+
- Android Chrome 90+
- Progressive enhancement for older browsers

## Future Considerations

- Virtual scrolling for 1000+ projects
- Drag-and-drop reordering
- Multi-select mode
- Batch operations
- Offline mode
- PWA support

---

**Last Updated**: Implementation complete
**Status**: ✅ Ready for QA
**Viewport**: 375×812 (iPhone 13 Mini reference)
