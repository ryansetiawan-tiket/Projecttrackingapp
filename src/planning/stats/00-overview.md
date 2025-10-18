# Stats Feature - Overview & Planning

## 📋 Feature Description

Menambahkan menu **"Stats"** pada profile dropdown yang menampilkan statistik komprehensif tentang tracker, memberikan insight mendalam tentang projects, assets, collaborators, dan workflow.

## 🎯 Goals

1. **Transparency**: Memberikan visibility penuh terhadap data tracker
2. **Insights**: Membantu user memahami pola dan trend dari projects mereka
3. **Decision Making**: Data-driven insights untuk planning dan resource allocation
4. **Monitoring**: Track progress dan identify bottlenecks

## 📍 Menu Location

**Profile Dropdown Menu** (Dashboard top-right):
```
┌─────────────────────────┐
│ Profile Photo           │
│ User Name               │
│ user@email.com          │
├─────────────────────────┤
│ ⚙️  Settings             │
│ 📊 Stats          [NEW] │  ← Added here
│ 🚪 Log out              │
└─────────────────────────┘
```

## 🎨 UI Approach

**Dialog/Sheet Component** dengan:
- **Tabs Navigation** untuk kategorisasi statistik
- **Visual Charts** menggunakan Recharts
- **Responsive Design** (mobile-friendly)
- **Color-coded** sesuai vertical/type colors
- **Export Capability** (future enhancement)

## 📊 Statistics Categories

### 1. **Overview Tab**
Quick summary dengan key metrics paling penting
- Total Projects
- Total Assets
- Active Collaborators
- Completion Rate

### 2. **Projects Tab**
Deep dive ke project statistics
- By Status
- By Vertical
- By Type
- By Quarter
- By Duration

### 3. **Assets Tab**
Asset breakdown komprehensif
- Total & by Type (File/Lightroom/GDrive)
- By Project
- By Illustration Type
- By Status
- Folder Statistics

### 4. **Collaboration Tab**
Team & collaborator insights
- Most Active Collaborators
- Collaborators per Project
- Team Distribution
- Role Distribution

### 5. **Workflow Tab**
Action & task statistics
- Total Actions
- Actions by Status
- Completion Rate
- Average per Project

### 6. **Timeline Tab**
Time-based insights
- Current Quarter Projects
- Upcoming Deadlines
- Overdue Projects
- Project Distribution by Month

## 🔧 Technical Components

### New Components to Create:
1. `StatsDialog.tsx` - Main container
2. `StatsOverview.tsx` - Overview tab content
3. `StatsProjects.tsx` - Projects tab content
4. `StatsAssets.tsx` - Assets tab content
5. `StatsCollaboration.tsx` - Collaboration tab content
6. `StatsWorkflow.tsx` - Workflow tab content
7. `StatsTimeline.tsx` - Timeline tab content
8. `StatsCard.tsx` - Reusable stat card component
9. `StatsChart.tsx` - Reusable chart wrapper

### New Hooks to Create:
1. `useStats.ts` - Main statistics calculation hook
2. `useProjectStats.ts` - Project-specific calculations
3. `useAssetStats.ts` - Asset-specific calculations

### New Utils to Create:
1. `statsCalculations.ts` - Pure calculation functions
2. `chartHelpers.ts` - Chart data formatting

## 📦 Data Sources

All data akan diambil dari existing hooks:
- `useProjects()` - Project data
- `useLocalProjects()` - Local project data
- `useTeams()` - Team & collaborator data
- `useStatuses()` - Status data
- `useTypes()` - Type data
- Vertical data dari localStorage/settings

## 🚀 Implementation Phases

### Phase 1: Foundation (Priority: High)
- Create StatsDialog component
- Add menu item to profile dropdown
- Implement basic tabs structure
- Create StatsCard component

### Phase 2: Overview & Projects (Priority: High)
- Implement Overview tab
- Implement Projects tab
- Add basic charts (bar, pie)
- Calculate core statistics

### Phase 3: Assets & Details (Priority: Medium)
- Implement Assets tab
- Add Lightroom/GDrive specific stats
- Implement folder statistics
- Add illustration type breakdown

### Phase 4: Collaboration & Workflow (Priority: Medium)
- Implement Collaboration tab
- Implement Workflow tab
- Add collaborator rankings
- Add action statistics

### Phase 5: Timeline & Polish (Priority: Low)
- Implement Timeline tab
- Add deadline tracking
- Polish UI/UX
- Add loading states

### Phase 6: Enhancements (Future)
- Export to CSV/PDF
- Date range filters
- Comparison views
- Trends over time

## 🎯 Success Metrics

- Users can quickly understand their tracker at a glance
- All statistics are accurate and real-time
- UI is intuitive and easy to navigate
- Performance remains smooth with large datasets
- Mobile experience is equally good

## 🔄 Next Steps

1. ✅ Create planning documentation (this file)
2. → Review and approve planning
3. → Create detailed UI mockups
4. → Define data structures
5. → Implement Phase 1
6. → Progressive implementation of remaining phases

## 📝 Notes

- Statistics are calculated **client-side** from existing data
- **No backend changes** required initially
- Performance consideration for large datasets (1000+ projects)
- Consider **memoization** for expensive calculations
- Add **loading skeletons** for better UX
