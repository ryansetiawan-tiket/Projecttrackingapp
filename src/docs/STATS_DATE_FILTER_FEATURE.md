# Stats Date Filter Feature 📅

## Overview

The Statistics page now includes a powerful **Time Period Filter** that allows users to analyze their project data across different time ranges. This feature makes it easy to track trends, compare performance across periods, and gain insights into project timelines.

## Features

### 🎯 **Filter Types**

Users can filter statistics by:

1. **All Time** (Default)
   - Shows all projects regardless of date
   - No filtering applied
   - Total project count displayed

2. **Year**
   - Filter by specific calendar year
   - Example: "2024"
   - Shows Jan 1 - Dec 31 of selected year

3. **Half (H1/H2)**
   - Filter by semester/half-year
   - **H1**: January - June
   - **H2**: July - December
   - Example: "H1 2024"

4. **Quarter (Q1-Q4)**
   - Filter by business quarter
   - **Q1**: Jan - Mar
   - **Q2**: Apr - Jun
   - **Q3**: Jul - Sep
   - **Q4**: Oct - Dec
   - Example: "Q2 2024"

5. **Month**
   - Filter by specific month
   - Full month names displayed
   - Example: "March 2024"

6. **Week**
   - Filter by week number
   - Weeks start on Monday
   - Example: "Week 12, 2024"

---

## UI/UX Design

### **Filter Card Layout**

```
┌────────────────────────────────────────────────────┐
│  Time Period: [All Time ▼]                        │
│                                                    │
│  📊 Showing: All Time (45 total projects)         │
└────────────────────────────────────────────────────┘
```

```
┌────────────────────────────────────────────────────┐
│  Time Period: [Quarter ▼]                         │
│  Select Period: [Q1 ▼] [2024 ▼]                  │
│                                                    │
│  📈 Showing data for: Q1 2024                      │
│     Jan 1, 2024 - Mar 31, 2024                    │
│     12 of 45 projects in this period              │
└────────────────────────────────────────────────────┘
```

### **Visual Indicators**

- ✅ **Badge** showing active filter period
- ✅ **Date range** displayed in human-readable format
- ✅ **Project count** showing filtered vs. total
- ✅ **Icon** (TrendingUp) for visual clarity
- ✅ **Responsive** layout for mobile/desktop

---

## Technical Implementation

### **Components**

1. **`StatsDateFilter.tsx`**
   - Main filter component with cascading dropdowns
   - Period type selector + specific period selector
   - Date range calculation logic
   - Export `DateRange` interface

2. **`StatsPage.tsx`** (Updated)
   - Integrates date filter component
   - Manages filter state
   - Filters projects based on date range
   - Passes filtered data to all stat tabs

3. **`dateFilterUtils.ts`** (New utility)
   - Helper functions for date calculations
   - Range generators for each period type
   - Date validation and formatting

### **Data Flow**

```
User selects period
    ↓
StatsDateFilter calculates date range
    ↓
Callback passes DateRange to StatsPage
    ↓
StatsPage filters projects
    ↓
Filtered projects passed to all stat components
    ↓
Charts and stats update automatically
```

### **Filter Logic**

Projects are filtered based on:
1. **Primary**: `start_date` (project start date)
2. **Fallback**: `completed_at` (completion timestamp)
3. Projects without dates are excluded when filter is active

```typescript
const filteredProjects = projects.filter(project => {
  const projectDate = project.start_date 
    ? new Date(project.start_date)
    : project.completed_at 
      ? new Date(project.completed_at)
      : null;

  if (!projectDate) return false;
  
  return projectDate >= dateRange.start && projectDate <= dateRange.end;
});
```

---

## Available Years Detection

The filter automatically detects available years from project data:

```typescript
const availableYears = useMemo(() => {
  const years = new Set<number>();
  projects.forEach(project => {
    if (project.start_date) years.add(new Date(project.start_date).getFullYear());
    if (project.due_date) years.add(new Date(project.due_date).getFullYear());
    if (project.completed_at) years.add(new Date(project.completed_at).getFullYear());
  });
  return Array.from(years).sort((a, b) => b - a); // Descending
}, [projects]);
```

- Scans all `start_date`, `due_date`, and `completed_at` fields
- Extracts unique years
- Sorted in descending order (most recent first)
- Defaults to current year if no projects exist

---

## Responsive Design

### **Desktop**
- Two-column layout: Period Type | Specific Period
- Full labels and descriptions
- Side-by-side selectors for Half/Quarter/Month/Week

### **Mobile**
- Stacked layout: Period Type above Specific Period
- Compact selectors
- Readable date formats
- Touch-friendly dropdowns

---

## User Benefits

### 📊 **For Project Managers**
- Track quarterly performance
- Compare H1 vs H2 productivity
- Identify seasonal trends
- Month-over-month analysis

### 🎯 **For Team Leads**
- Weekly sprint reviews
- Monthly team performance
- Year-end reporting
- Period-based planning

### 📈 **For Stakeholders**
- Custom reporting periods
- Flexible date ranges
- Quick performance snapshots
- Historical comparisons

---

## Usage Examples

### **Example 1: Quarterly Review**
1. Select "Quarter" from Time Period dropdown
2. Choose "Q2" and "2024"
3. View all stats filtered to Apr-Jun 2024
4. Compare with Q1 by changing selection

### **Example 2: Monthly Performance**
1. Select "Month" from Time Period dropdown
2. Choose "January" and "2024"
3. See January-specific statistics
4. Navigate through months to spot trends

### **Example 3: Year-End Report**
1. Select "Year" from Time Period dropdown
2. Choose "2024"
3. Generate full-year statistics
4. Export insights for stakeholders

### **Example 4: Weekly Sprint**
1. Select "Week" from Time Period dropdown
2. Choose "Week 12" and "2024"
3. Review week's project activity
4. Track sprint deliverables

---

## Future Enhancements

### 🚀 **Potential Additions**

1. **Custom Date Range**
   - Date picker for start/end dates
   - More flexible than predefined periods

2. **Compare Periods**
   - Side-by-side comparison
   - Q1 2024 vs Q1 2023
   - Growth/change indicators

3. **Quick Filters**
   - "Last 30 days"
   - "Last 90 days"
   - "Current quarter"
   - "Current year"

4. **Save Filters**
   - Bookmark favorite date ranges
   - Quick access to commonly used periods

5. **Export Filtered Data**
   - Download CSV/Excel of filtered stats
   - Shareable reports

6. **Filter Presets**
   - "This week"
   - "This month"
   - "This quarter"
   - "This year"

---

## Integration Points

The date filter integrates seamlessly with all stats tabs:

### ✅ **Overview Tab**
- Total projects count
- Status distribution
- Vertical breakdown
- Completion rate

### ✅ **Projects Tab**
- Project list by status
- Type distribution
- Timeline chart
- Progress metrics

### ✅ **Assets Tab**
- Asset count by type
- Completion status
- Deliverables overview

### ✅ **Collaboration Tab**
- Collaborator activity
- Team participation
- Workload distribution

### ✅ **Timeline Tab**
- Project timeline view
- Deadline tracking
- Milestone progress

---

## Performance Considerations

- ✅ **useMemo** for filtered projects (prevents re-filtering on every render)
- ✅ **useMemo** for available years (calculated once from projects)
- ✅ **Lightweight calculations** (date comparisons only)
- ✅ **No API calls** (client-side filtering)
- ✅ **Instant updates** (no loading states)

---

## Accessibility

- ✅ Keyboard navigation for dropdowns
- ✅ Clear labels and descriptions
- ✅ Screen reader friendly
- ✅ Touch-friendly on mobile
- ✅ High contrast indicators

---

## Testing Checklist

### **Functional Tests**

- [ ] All Time filter shows all projects
- [ ] Year filter correctly filters by calendar year
- [ ] Half (H1/H2) filters show correct 6-month periods
- [ ] Quarter filters show correct 3-month periods
- [ ] Month filter shows correct single month
- [ ] Week filter shows correct 7-day period
- [ ] Available years list matches project data
- [ ] Project count updates correctly
- [ ] Date range displays accurate dates
- [ ] All stats tabs respect the filter

### **Edge Cases**

- [ ] No projects → shows current year in dropdown
- [ ] Projects without dates → excluded from filtered results
- [ ] Year spanning multiple projects
- [ ] Week crossing year boundary (Week 52/1)
- [ ] Leap year handling (Feb 29)

### **UI/UX Tests**

- [ ] Mobile responsive layout
- [ ] Desktop two-column layout
- [ ] Dropdown selections work smoothly
- [ ] Badge displays correctly
- [ ] Date formatting is readable
- [ ] Filter state persists during tab switching

---

## Known Limitations

1. **Week Calculation**
   - Assumes weeks start on Monday
   - ISO week standard may differ slightly
   - Year-boundary weeks may span two years

2. **Date Filtering**
   - Only filters by `start_date` or `completed_at`
   - Does not filter by `due_date` range
   - Projects without dates are excluded

3. **No Timezone Handling**
   - Uses local browser timezone
   - May cause discrepancies for global teams

---

## Changelog

### **Version 1.0** (Current)
- ✅ Initial implementation
- ✅ 6 filter types: All Time, Year, Half, Quarter, Month, Week
- ✅ Automatic year detection
- ✅ Responsive UI
- ✅ Visual indicators and badges
- ✅ Integration with all stats tabs

---

## Support

For questions or issues related to date filtering:
1. Check if projects have valid `start_date` or `completed_at` values
2. Verify available years appear in dropdown
3. Ensure selected period has projects within range
4. Check browser console for any date parsing errors

---

**Status:** ✅ **Fully Implemented**  
**Default Filter:** All Time  
**Last Updated:** January 2025
