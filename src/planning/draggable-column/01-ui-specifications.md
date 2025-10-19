# Draggable Columns - UI Specifications

## Visual Design

### Table Header States

#### 1. Default State (Idle)
```
┌─────────────┬────────┬──────┬──────────┬──────────────┬────────┐
│ Project Name│ Status │ Type │ Vertical │ Deliverables │ Assets │
│             │        │      │          │              │        │
└─────────────┴────────┴──────┴──────────┴──────────────┴────────┘
```
- Normal appearance
- Cursor: `cursor-grab` on hover untuk draggable columns
- Cursor: `cursor-default` untuk Project Name (locked)

#### 2. Hover State
```
┌─────────────┬────────┬──────┬──────────┬──────────────┬────────┐
│ Project Name│[Status]│ Type │ Vertical │ Deliverables │ Assets │
│             │  ↕️     │      │          │              │        │
└─────────────┴────────┴──────┴──────────┴──────────────┴────────┘
```
- Subtle background color change (bg-gray-100 dark:bg-gray-800)
- Drag indicator icon (↕️ atau GripVertical from lucide-react)
- Tidak ada hover effect di Project Name column

#### 3. Dragging State
```
┌─────────────┬────────┬──────┬──────────┬──────────────┬────────┐
│ Project Name│ ░░░░░░ │ Type │ Vertical │ Deliverables │[Status]│
│             │  DROP  │      │          │              │  ↕️    │
└─────────────┴────────┴──────┴──────────┴──────────────┴────────┘
```
- Dragged column: Semi-transparent, elevated shadow, cursor: `cursor-grabbing`
- Drop zone: Dashed border atau highlight color
- Other columns: Shift animation (smooth transition)

#### 4. Drop Target Indicator
```
│              │        │
│              ┃        │  <- Blue/accent color indicator bar
│              │        │
```
- Vertical line (2-3px) di antara columns
- Accent color (primary theme color)
- Show only on valid drop targets

### Reset Button Location

**Option A: Di Table Header (Recommended)**
```
┌─────────────────────────────────────────────────────────────────┐
│ All Projects (42)                    [🔄 Reset Column Order]     │
├─────────────┬────────┬──────┬──────────┬──────────────┬────────┤
│ Project Name│ Status │ Type │ Vertical │ Deliverables │ Assets │
```

**Option B: Di Filter Bar**
```
┌─────────────────────────────────────────────────────────────────┐
│ [Search] [Status▾] [Type▾] [Vertical▾]    [🔄 Reset Columns]   │
├─────────────┬────────┬──────┬──────────┬──────────────┬────────┤
│ Project Name│ Status │ Type │ Vertical │ Deliverables │ Assets │
```

→ **Pilihan: Option A** - Lebih dekat dengan columns yang di-reset

## Interaction Flow

### Drag & Drop Flow
1. **User hovers** table header → Cursor jadi grab icon
2. **User mousedown** → Column "lifted" (shadow + semi-transparent)
3. **User drags** → Visual preview follows cursor
4. **Drop indicators appear** → Blue line shows valid drop position
5. **User drops** → Smooth animation, column slides to new position
6. **Auto-save** → Silently save to database (no toast needed)

### Reset Flow
1. **User clicks "Reset Column Order"** button
2. **Confirmation** (optional) → "Reset to default column order?"
3. **Columns animate** back to default positions
4. **Toast notification** → "Column order reset to default"

## Visual Feedback

### During Drag
- **Dragged Column**: 
  - `opacity-60`
  - `shadow-2xl`
  - `scale-105` (slightly larger)
  - `z-50` (above everything)

- **Drop Zone**:
  - `border-l-2 border-primary` (left indicator)
  - Or `bg-primary/10` (subtle highlight)

- **Other Columns**:
  - Smooth `transition-all duration-200`
  - Shift left/right sesuai drop position

### Locked Column (Project Name)
- Visual indicator bahwa column ini tidak bisa di-drag
- Icon: 📌 atau 🔒 (subtle, di pojok)
- Tooltip on hover: "This column is locked"
- Slightly different background (bg-gray-50/dark:bg-gray-900)

## Responsive Behavior

### Desktop Only
- Minimum screen width: **1024px** (lg breakpoint)
- Below 1024px: Table view berubah ke card view (mobile)
- Draggable columns tidak aktif di mobile/tablet

## Accessibility

### Keyboard Support
- **Tab**: Navigate between headers
- **Space/Enter**: Pick up column
- **Arrow Keys**: Move column left/right
- **Space/Enter**: Drop column
- **Escape**: Cancel drag

### Screen Reader
- `aria-label="Drag to reorder columns"`
- `aria-grabbed="true"` saat dragging
- Announce position changes: "Status column moved to position 3"

### Focus States
- Clear focus ring dengan outline
- Focus visible during keyboard navigation

## Animation Specifications

### Drag Start
```css
transform: scale(1.05);
opacity: 0.6;
box-shadow: 0 10px 30px rgba(0,0,0,0.3);
transition: transform 150ms ease-out;
```

### Column Shift
```css
transition: transform 200ms cubic-bezier(0.4, 0, 0.2, 1);
```

### Drop
```css
transition: all 250ms cubic-bezier(0.4, 0, 0.2, 1);
opacity: 1;
transform: scale(1);
```

### Reset Animation
```css
transition: transform 400ms cubic-bezier(0.4, 0, 0.2, 1);
/* Stagger: Each column animates with 50ms delay */
```

## Edge Cases & Error States

### During Active Drag
1. **User scrolls** → Drag continues, preview follows
2. **User switches tab** → Auto-cancel drag
3. **Network error** → Local state updates, retry save on reconnect

### Column Width
- Maintain existing column width logic
- Dragging tidak mengubah width
- Responsive width tetap berfungsi

## Components Affected

### Main Component
- `components/ProjectTable.tsx` - Primary implementation

### Supporting Components
- `components/project-table/types.ts` - Add column order types
- `components/project-table/helpers.ts` - Column reorder utilities

### New Components (if needed)
- `components/project-table/DraggableTableHeader.tsx` - Reusable header
- `contexts/ColumnOrderContext.tsx` - Global state management (optional)

## Design Tokens

### Colors
```typescript
const dragColors = {
  dropIndicator: 'hsl(var(--primary))',
  draggedBg: 'rgba(0, 0, 0, 0.05)',
  hoverBg: 'hsl(var(--muted))',
  lockedBg: 'hsl(var(--muted) / 0.5)',
}
```

### Shadows
```typescript
const dragShadows = {
  lifted: '0 10px 30px rgba(0, 0, 0, 0.2)',
  dropped: '0 1px 3px rgba(0, 0, 0, 0.1)',
}
```

## Testing Checklist

### Visual Testing
- [ ] Drag preview looks good
- [ ] Drop indicators clear and visible
- [ ] Animations smooth (60fps)
- [ ] Dark mode support
- [ ] No layout shift bugs

### Functional Testing
- [ ] Drag & drop works correctly
- [ ] Order persists after reload
- [ ] Reset button works
- [ ] Project Name column stays locked
- [ ] Keyboard navigation works
- [ ] Multi-user: Each user has own order

### Browser Testing
- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (feature disabled)
