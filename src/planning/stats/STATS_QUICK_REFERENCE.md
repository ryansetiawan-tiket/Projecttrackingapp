# Stats Feature - Quick Reference 📊

**Status**: ✅ **COMPLETE**  
**Version**: 2.1.0  
**Date**: October 18, 2025

---

## 🎯 Quick Access

**Location**: Profile Dropdown → **Stats** (before Settings)

**Shortcut**: Click avatar in header → Stats option

---

## 📑 5 Tabs Overview

| Tab | Focus | Cards | Charts |
|-----|-------|-------|--------|
| **Overview** | High-level insights | 6 | 4 |
| **Projects** | Project analytics | 4 | 4 |
| **Assets** | Deliverables | 4 | 4 |
| **Collaboration** | Team insights | 4 | 4 |
| **Timeline** | Schedule & deadlines | 4 | 3 |

---

## 📊 Tab 1: Overview

### Cards
1. Total Projects
2. Active Projects
3. Completed Projects
4. Average Duration
5. Completion Rate
6. On-time Delivery

### Charts
1. Projects by Type (Pie)
2. Projects by Status (Bar)
3. Quarter Distribution (Bar)
4. Projects by Vertical (Pie)

**Key Feature**: All charts menggunakan warna dari Settings page

---

## 📂 Tab 2: Projects

### Cards
1. Total Projects
2. Active Projects
3. Completed Projects
4. Average Duration

### Charts
1. Projects by Status (Bar)
2. Projects by Type (Pie)
3. Projects by Vertical (Pie)
4. Quarter Distribution (Bar)

**Key Feature**: Detailed project distribution analytics

---

## 📦 Tab 3: Assets

### Cards
1. Total Assets (GDrive + Lightroom)
2. Google Drive Assets
3. Lightroom Assets
4. Avg per Project

### Charts
1. Assets by Platform (Pie)
2. Files vs Folders (Pie)
3. Assets by Project Type (Bar)
4. Top Projects by Asset Count (Bar)

**Key Feature**: Fokus pada DELIVERABLES, bukan action items

---

## 👥 Tab 4: Collaboration

### Cards
1. Total Collaborators
2. Avg per Project
3. Avg per Collaborator
4. Projects with Team

### Features
1. Most Active Collaborators (Top 10 List)
2. Collaborators by Role (Pie)
3. Projects by Team Size (Bar)
4. Workload by Role (Grouped Bar)

**Key Feature**: Ranked list dengan avatar & detailed stats

---

## 📅 Tab 5: Timeline

### Cards
1. Overdue Projects
2. Due This Week
3. Due This Month
4. Avg Duration

### Special Sections
1. **Overdue Alert** (Red Box) - Top 10 overdue
2. **Upcoming Deadlines** (Next 14 days) - Color-coded urgency

### Charts
1. Projects by Quarter (Grouped Bar)
2. Project Starts Last 12 Months (Line)
3. Duration Distribution (Bar)

**Key Feature**: Smart filtering (only non-completed for overdue)

---

## 🎨 Color System

### Color Sources
- **Type**: Settings → Project Types
- **Status**: Settings → Status Management
- **Vertical**: Settings → Verticals

### Benefits
- ✅ Consistent visual language
- ✅ User-customizable
- ✅ Auto-updates

---

## 🔧 Components

```
/components/stats/
├── StatsCard.tsx              # Reusable card
├── StatsOverview.tsx          # Tab 1
├── StatsProjects.tsx          # Tab 2
├── StatsAssets.tsx            # Tab 3
├── StatsCollaboration.tsx     # Tab 4
└── StatsTimeline.tsx          # Tab 5
```

---

## 📚 Utilities

```
/utils/
├── statsCalculations.ts       # Core calculations
├── chartHelpers.ts            # Chart formatting
└── quarterUtils.ts            # Quarter helpers
```

---

## 🚀 Usage Examples

### Example 1: Check Project Completion Rate
1. Open Stats dialog
2. Go to **Overview** tab
3. Look at **Completion Rate** card

### Example 2: Find Overdue Projects
1. Open Stats dialog
2. Go to **Timeline** tab
3. Look at **Overdue Projects Alert** (red box)

### Example 3: Analyze Team Workload
1. Open Stats dialog
2. Go to **Collaboration** tab
3. Check **Workload by Role** chart

### Example 4: View Assets Distribution
1. Open Stats dialog
2. Go to **Assets** tab
3. Check **Assets by Platform** pie chart

---

## 💡 Tips & Tricks

### Get Quick Insights
- **Overview tab** untuk bird's eye view
- **Projects tab** untuk project distribution
- **Timeline tab** untuk deadline management

### Monitor Team Performance
- **Collaboration tab** untuk:
  - Most active members
  - Workload distribution
  - Team size patterns

### Track Deliverables
- **Assets tab** untuk:
  - Platform usage (GDrive vs Lightroom)
  - File vs folder ratio
  - Projects dengan banyak assets

### Identify Bottlenecks
- **Timeline tab** untuk:
  - Overdue projects
  - Upcoming deadlines
  - Duration patterns

---

## 🐛 Known Limitations

1. **No Date Range Filter** - Shows all-time data
2. **No Export Feature** - Cannot export to PDF/Excel
3. **No Comparison** - No year-over-year comparison
4. **Static Data** - No real-time updates (refresh required)

### Future Enhancements
- Date range filters
- Export reports (PDF, Excel)
- Comparative analytics
- Custom dashboards
- Real-time updates

---

## 📖 Related Documentation

- [Features.md](../../docs/tracking-app-wiki/FEATURES.md) - Full feature documentation
- [CHANGELOG.md](../../docs/tracking-app-wiki/CHANGELOG.md) - Version history
- [Implementation Complete](./05-implementation-complete.md) - Technical details
- [UI Specifications](./01-ui-specifications.md) - Design specs

---

## ✅ Quick Checklist

Before using Stats:
- [ ] Have projects created
- [ ] Settings configured (Types, Statuses, Verticals)
- [ ] Team members added
- [ ] Assets added to projects
- [ ] Dates filled in projects

---

## 🎓 FAQ

### Q: Why are my charts empty?
**A**: Make sure you have:
- Projects created
- Settings configured (Types, Statuses, Verticals)
- Dates filled in projects

### Q: How to change chart colors?
**A**: Go to Settings → Customize Type/Status/Vertical colors

### Q: Can I export the stats?
**A**: Not yet - planned for future release

### Q: How often does data update?
**A**: Stats recalculate when you open the dialog

### Q: Why don't I see action stats in Assets tab?
**A**: Assets tab fokus pada deliverables (GDrive & Lightroom files), bukan action items

---

**Version**: 2.1.0  
**Last Updated**: October 18, 2025  
**Status**: ✅ Production Ready
