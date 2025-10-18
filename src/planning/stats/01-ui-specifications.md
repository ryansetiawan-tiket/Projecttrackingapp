# Stats Feature - UI Specifications

## 🎨 Dialog Layout

### Dialog Structure
```
┌──────────────────────────────────────────────────────┐
│  📊 Statistics                              [✕]      │
├──────────────────────────────────────────────────────┤
│  [Overview] [Projects] [Assets] [Collaboration] [...] │ ← Tabs
├──────────────────────────────────────────────────────┤
│                                                       │
│  [Tab Content Area]                                   │
│                                                       │
│  - Stats Cards                                        │
│  - Charts                                             │
│  - Tables/Lists                                       │
│                                                       │
│                                                       │
└──────────────────────────────────────────────────────┘
```

### Dialog Properties
- **Component**: Dialog (shadcn)
- **Width**: `max-w-6xl` (wider for charts)
- **Height**: `max-h-[90vh]` with scroll
- **Backdrop**: Semi-transparent with blur
- **Animation**: Smooth fade + scale

## 📑 Tab Navigation

### Tab List
1. **Overview** - 📊 Icon
2. **Projects** - 📁 Icon  
3. **Assets** - 🖼️ Icon
4. **Collaboration** - 👥 Icon
5. **Workflow** - ✓ Icon
6. **Timeline** - 📅 Icon

### Tab Styling
- Active tab: Primary color underline
- Hover: Background color change
- Mobile: Scrollable horizontal tabs
- Icons: 16px lucide-react icons

## 📊 Overview Tab

### Layout (Grid 2x2)
```
┌──────────────────┬──────────────────┐
│  Total Projects  │  Total Assets    │
│  [Large Number]  │  [Large Number]  │
│  [Trend Badge]   │  [Trend Badge]   │
├──────────────────┼──────────────────┤
│  Collaborators   │  Completion Rate │
│  [Large Number]  │  [Progress Ring] │
│  [Active Status] │  [Percentage]    │
└──────────────────┴──────────────────┘
```

### Quick Insights Section
```
┌─────────────────────────────────────┐
│  Quick Insights                     │
├─────────────────────────────────────┤
│  • Most Active Vertical: [Name]     │
│  • Busiest Quarter: [Q#]            │
│  • Average Assets/Project: [#]      │
│  • Most Common Status: [Status]     │
└─────────────────────────────────────┘
```

### Recent Activity
```
┌─────────────────────────────────────┐
│  Recent Activity (Last 7 Days)      │
├─────────────────────────────────────┤
│  • 3 Projects Created               │
│  • 15 Assets Added                  │
│  • 24 Actions Completed             │
└─────────────────────────────────────┘
```

## 📁 Projects Tab

### Status Distribution (Horizontal Bar Chart)
```
Status A  ████████████████░░░░  80%
Status B  █████████░░░░░░░░░░░  45%
Status C  ███░░░��░░░░░░░░░░░░░  15%
```

### Vertical Distribution (Pie/Donut Chart)
```
     [Donut Chart]
     
Vertical A  ███ 35%
Vertical B  ███ 28%
Vertical C  ███ 22%
Vertical D  ███ 15%
```

### Type Distribution (Bar Chart)
```
┌─────────────────────────────┐
│ Type Distrib│ution          │
│      ┌───┐                  │
│      │   │  ┌───┐           │
│ ┌───┐│   │  │   │  ┌───┐   │
│ │ A ││ B │  │ C │  │ D │   │
└─────────────────────────────┘
```

### Quarter Distribution (Timeline View)
```
Q1 2025  ████████  [8 projects]
Q2 2025  ████████████  [12 projects]
Q3 2025  ████  [4 projects]
Q4 2025  ██  [2 projects]
```

### Stats Cards Grid
```
┌──────────────┬──────────────┬──────────────┐
│ Avg Duration │ Longest Proj │ Shortest Prj │
│  [X days]    │  [X days]    │  [X days]    │
└──────────────┴──────────────┴──────────────┘
```

## 🖼️ Assets Tab

### Asset Type Overview (3 Cards)
```
┌─────────────┬─────────────┬─────────────┐
│ 📁 Files    │ 📸 Lightroom│ 📂 GDrive   │
│  [Count]    │  [Count]    │  [Count]    │
│  [%]        │  [%]        │  [%]        │
└─────────────┴─────────────┴─────────────┘
```

### Illustration Type Breakdown
```
Type A  ████████████  [120 assets]
Type B  ████████      [80 assets]
Type C  █████         [50 assets]
Type D  ███           [30 assets]
```

### Assets per Project (Distribution Chart)
```
┌─────────────────────────────┐
│ Assets Distribution         │
│    Most: 50 assets          │
│    Avg:  15 assets          │
│    Min:  2 assets           │
│                             │
│  [Histogram Chart]          │
└─────────────────────────────┘
```

### Folder Statistics
```
┌──────────────────────────────┐
│ GDrive Nested Folders        │
│  • Total Folders: [#]        │
│  • Max Depth: [#] levels     │
│  • Avg Files/Folder: [#]     │
├──────────────────────────────┤
│ Lightroom Folders            │
│  • Total Folders: [#]        │
│  • Organized Assets: [%]     │
└──────────────────────────────┘
```

### Asset Status Distribution
```
Status A  ████████████  [60 assets]
Status B  ████████      [40 assets]  
Status C  █████         [25 assets]
```

## 👥 Collaboration Tab

### Top Collaborators (Leaderboard)
```
┌──────────────────────────────────────┐
│  🏆 Most Active Collaborators        │
├──────────────────────────────────────┤
│  1. 👤 John Doe        [15 projects] │
│  2. 👤 Jane Smith      [12 projects] │
│  3. 👤 Bob Wilson      [10 projects] │
│  4. 👤 Alice Brown     [8 projects]  │
│  5. 👤 Charlie Davis   [6 projects]  │
└──────────────────────────────────────┘
```

### Collaborators per Project (Distribution)
```
┌─────────────────────────────┐
│ Team Size Distribution      │
│                             │
│  Solo (1)      ████  [20%]  │
│  Small (2-3)   ████████      │
│  Medium (4-6)  ██████        │
│  Large (7+)    ████          │
└─────────────────────────────┘
```

### Role Distribution (Pie Chart)
```
     [Pie Chart]
     
Designer     ███ 40%
Developer    ███ 30%
Manager      ███ 20%
Other        ███ 10%
```

### Team Statistics
```
┌──────────────┬──────────────┬──────────────┐
│ Total Teams  │ Total Members│ Avg Team Size│
│  [#]         │  [#]         │  [#]         │
└──────────────┴──────────────┴──────────────┘
```

## ✓ Workflow Tab

### Action Statistics (Grid)
```
┌──────────────┬──────────────┬──────────────┐
│ Total Actions│ Completed    │ Pending      │
│  [Count]     │  [Count]     │  [Count]     │
│              │  [% Badge]   │  [% Badge]   │
└──────────────┴──────────────┴──────────────┘
```

### Completion Rate (Progress Ring)
```
┌─────────────────────────────┐
│                             │
│        ◯ 75%                │
│     Completed               │
│                             │
└─────────────────────────────┘
```

### Actions by Status (Horizontal Bar)
```
✓ Done       ████████████████░░  [85%]
◷ In Prog    ████░░░░░░░░░░░░░░  [20%]
○ To Do      ██░░░░░░░░░░░░░░░░  [10%]
```

### Actions per Project (Stats)
```
┌──────────────┬──────────────┬──────────────┐
│ Avg/Project  │ Max Actions  │ Min Actions  │
│  [#.#]       │  [#]         │  [#]         │
└─���────────────┴──────────────┴──────────────┘
```

### Most Common Action Presets (Top 5)
```
1. Review & Feedback      [45 uses]
2. Design Iteration       [38 uses]
3. Client Approval        [32 uses]
4. Development Phase      [28 uses]
5. Testing & QA           [22 uses]
```

## 📅 Timeline Tab

### Current Quarter Overview
```
┌─────────────────────────────────────┐
│  Q1 2025 Overview                   │
├─────────────────────────────────────┤
│  Total Projects: [#]                │
│  Active: [#]  •  Completed: [#]     │
│  Progress: ████████████░░  [80%]    │
└─────────────────────────────────────┘
```

### Upcoming Deadlines (Next 7 Days)
```
┌─────────────────────────────────────┐
│  🔔 Upcoming This Week              │
├─────────────────────────────────────┤
│  Mon  Project A    [Video]          │
│  Wed  Project B    [Social]         │
│  Fri  Project C    [Ads]            │
└─────────────────────────────────────┘
```

### Upcoming Deadlines (Next 30 Days)
```
┌─────────────────────────────────────┐
│  📆 Next 30 Days                    │
├─────────────────────────────────────┤
│  [List of 10 projects with dates]   │
│  [Grouped by week]                  │
└─────────────────────────────────────┘
```

### Overdue Projects (Alert)
```
┌─────────────────────────────────────┐
│  ⚠️  Overdue Projects               │
├─────────────────────────────────────┤
│  Project X  [2 days overdue]        │
│  Project Y  [5 days overdue]        │
└─────────────────────────────────────┘
```

### Project Distribution by Month (Line Chart)
```
┌─────────────────────────────┐
│ Projects Created per Month  │
│       ●                     │
│      / \       ●            │
│     /   \     / \           │
│  ●─/     ●───/   ●──●       │
│  J F M A M J J A S O N D    │
└─────────────────────────────┘
```

## 🎨 Component Styling

### Stats Card Component
```tsx
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle className="text-sm font-medium">
        {title}
      </CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    {subtitle && (
      <p className="text-xs text-muted-foreground mt-1">
        {subtitle}
      </p>
    )}
    {trend && <Badge>{trend}</Badge>}
  </CardContent>
</Card>
```

### Color Scheme
- **Primary Stats**: Use existing vertical colors
- **Charts**: Use type colors
- **Status**: Use status colors from system
- **Neutral Elements**: Muted foreground
- **Highlights**: Primary theme color

### Typography Scale
- **Large Numbers**: text-3xl font-bold
- **Titles**: text-lg font-semibold
- **Labels**: text-sm font-medium
- **Body**: text-sm
- **Captions**: text-xs text-muted-foreground

## 📱 Responsive Design

### Desktop (> 1024px)
- Full width dialog (max-w-6xl)
- Grid layouts for stats cards
- Side-by-side charts
- All tabs visible

### Tablet (768px - 1024px)
- Reduced dialog width (max-w-4xl)
- 2-column grids become 1-column
- Stacked charts
- Scrollable tabs

### Mobile (< 768px)
- Full screen sheet instead of dialog
- Single column layout
- Simplified charts
- Compact stats cards
- Horizontal scrollable tabs

## 🎯 Accessibility

- **Keyboard Navigation**: Full tab support
- **Screen Readers**: Proper ARIA labels
- **Color Contrast**: WCAG AA compliant
- **Focus Indicators**: Clear focus states
- **Alt Text**: All charts have text alternatives
