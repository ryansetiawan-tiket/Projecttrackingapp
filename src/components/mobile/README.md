# Mobile Timeline Components

This directory contains mobile-optimized components for the Timeline (Week view) feature. These components are **mobile-only** and designed with a mobile-first approach using touch-optimized interactions.

## Architecture

The mobile timeline uses a different pattern from desktop:
- **Desktop**: Google Sheets-style horizontal scrolling grid
- **Mobile**: Week Strip + Agenda List + Bottom Sheet detail

## Components

### `DayCell.tsx`
- **Size**: 64px width, auto height
- **Variants**: `default`, `today`, `selected`
- **Features**: 
  - Shows weekday (12px) and date (16px bold)
  - Event indicators (dots) showing event count
  - Touch-optimized (64px min height for 44px+ touch target)

### `WeekStrip.tsx`
- Horizontal scrolling container with 7+ days
- Auto-scrolls to today on mount
- Fade hints on edges for scroll affordance
- Chevron buttons for navigation
- Snap scrolling for better UX

### `EventBar.tsx`
- **Size**: 32px height
- **Features**:
  - Single-line truncated title with ellipsis
  - Status color background with contrast text
  - Multi-day indicators (caps on start/end)
  - Long-press support (500ms) with haptic feedback
  - Touch-optimized interactions

### `AgendaItem.tsx`
- Full-width card component
- **Layout**:
  - Left: 6px colored status stripe
  - Middle: Title (14px), meta info (12px), status badge
  - Right: Chevron icon
- **Min Height**: 64px for comfortable touch targets
- Shows: vertical, type, date range, status

### `LaneAccordion.tsx`
- Collapsible vertical/lane grouping
- **Default state**: Collapsed (mobile optimization)
- **Header**: Shows lane name, project count, quick status badges
- **Content**: List of AgendaItems
- **Min Height**: 56px touch target

### `EventDetailSheet.tsx`
- Bottom sheet drawer using shadcn drawer component
- **Max Height**: 85vh
- **Features**:
  - Swipe down to dismiss
  - Handle bar for visual affordance
  - Scrollable content area
  - Action buttons (Edit, Mark Done)
  - Full project details display

### `MobileTimelineWeek.tsx`
- Main container component
- Combines all mobile components
- **Features**:
  - Date filtering by tapping day cells
  - "Today" button to jump to current date
  - "Hide Done" toggle
  - Empty state handling
  - Groups projects by vertical

## Design Tokens

All components use existing global design tokens from `/styles/globals.css`:
- Colors: `--color-*` variables
- Spacing: Tailwind spacing scale
- Typography: Base font sizes (no override of text-* classes)
- Border radius: 8-12px for mobile comfort

### Mobile-Specific Tokens (in globals.css)
```css
.touch-manipulation /* -webkit-tap-highlight-color: transparent */
.mobile-timeline-container /* height calculations */
.momentum-scroll /* iOS smooth scrolling */
```

## Touch Targets

All interactive elements meet or exceed **44px minimum** touch target size:
- DayCell: 64px × 64px
- EventBar: full width × 32px (in vertical stack context = 44px+)
- AgendaItem: full width × 64px
- LaneAccordion header: full width × 56px
- Buttons: 44px+ height

## Responsive Behavior

Mobile timeline is **hidden on desktop** (`md:hidden` class).
Desktop timeline continues to use original `ProjectTimeline.tsx` implementation.

Breakpoint: `768px` (Tailwind `md` breakpoint)
- `< 768px`: Mobile components
- `>= 768px`: Desktop Google Sheets-style timeline

## Integration

The mobile timeline is integrated into `ProjectTimeline.tsx`:

```tsx
<div className="md:hidden">
  <MobileTimelineWeek
    projects={periodProjects}
    onProjectClick={onProjectClick}
    hideDone={hideDone}
    onHideDoneToggle={() => setHideDone(!hideDone)}
  />
</div>

<div className="hidden md:block">
  {/* Original desktop timeline */}
</div>
```

## Data Flow

1. Projects filtered by date range and status
2. Grouped by vertical/lane
3. Day cells show event counts per date
4. Tapping day cell filters agenda list
5. Tapping agenda item opens bottom sheet
6. Bottom sheet shows full project details

## Interactions

### Tap Interactions
- **Day cell**: Select date → filter agenda list
- **Agenda item**: Open bottom sheet with details
- **Lane accordion**: Expand/collapse lane
- **Today button**: Jump to current date
- **Hide Done toggle**: Show/hide completed projects

### Long Press
- **Event bar**: 500ms hold → quick action menu (future enhancement)
- Haptic feedback on supported devices

### Swipe/Scroll
- **Week strip**: Horizontal scroll (momentum)
- **Agenda list**: Vertical scroll
- **Bottom sheet**: Swipe down to dismiss

## Sample Data

Uses same project data from the main application. No mock data required.

## QA Checklist

- ✅ Week strip scrolls horizontally
- ✅ Day cells are 64px wide and readable
- ✅ Event titles truncate to 1 line with ellipsis
- ✅ Tapping event opens bottom sheet
- ✅ Lane accordions can expand/collapse
- ✅ All touch targets meet 44px minimum
- ✅ Today button scrolls to current date
- ✅ Date filtering works correctly
- ✅ Hide Done toggle works
- ✅ Responsive: mobile only (< 768px)

## Future Enhancements

- [ ] Long-press quick actions menu
- [ ] Drag-to-reorder in agenda list
- [ ] Week-to-week swipe navigation
- [ ] Pull-to-refresh
- [ ] Offline support with caching
- [ ] Calendar integration
- [ ] Notification badges on day cells

## Notes

- **DO NOT** modify desktop components
- **DO NOT** change global design tokens
- All mobile components are namespaced under `/components/mobile/`
- Mobile-specific utilities are in `globals.css` utilities layer
