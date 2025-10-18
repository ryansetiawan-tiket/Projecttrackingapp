# Project Detail Sidebar - Implementation Spec

## ✅ Implementation Complete

Project detail sekarang muncul dalam bentuk **sidebar dari kanan** (desktop) dan **drawer dari bawah** (mobile), menggantikan dialog/modal yang sebelumnya.

---

## 🎯 Design Goals

- **Better UX**: Sidebar tidak menutupi seluruh context (masih bisa lihat table/timeline)
- **Modern Pattern**: Mengikuti aplikasi seperti Linear, Notion, Asana
- **Clear Hierarchy**: Sections yang jelas dengan spacing konsisten
- **Easy to Read**: Layout yang clean dan informasi yang terorganisir

---

## 📱 Visual Structure

### **Desktop (≥ 768px) - Sheet Sidebar**
```
┌────────────────────────────────────────────┐
│ Dashboard / Timeline                       │ ← Background (slightly dimmed)
│                                            │
│  ┌─────────────────────────────────┐      │
│  │ Project Details            [X]  │ ←─────┼─ Sidebar Header (fixed)
│  ├─────────────────────────────────┤      │
│  │ [Scrollable Content]            │      │
│  │                                 │      │
│  │ ▼ Header Section                │      │
│  │   Project Name (large)          │      │
│  │   [Tags] [Status] [Quarter]     │      │
│  │   [Edit Project Button]         │      │
│  │                                 │      │
│  │ ▼ Timeline                      │      │
│  │   Start Date | Due Date         │      │
│  │                                 │      │
│  │ ▼ Project Types                 │      │
│  │ ▼ Collaborators                 │      │
│  │ ▼ Resources (Links)             │      │
│  │ ▼ Tasks                         │      │
│  │ ▼ Notes                         │      │
│  └─────────────────────────────────┘      │
└────────────────────────────────────────────┘
```

**Dimensions**:
- Width: `480px` (sm), `540px` (lg)
- Height: Full viewport height
- Position: Fixed right, slide from right
- Overlay: Semi-transparent black (50%)

---

### **Mobile (< 768px) - Drawer**
```
┌─────────────────────────────┐
│ Project Details        [X]  │ ← Drawer Header
├─────────────────────────────┤
│ [Scrollable Content]        │
│                             │
│ Same structure as desktop   │
│ but optimized for mobile    │
│                             │
└─────────────────────────────┘
```

**Dimensions**:
- Height: 92% of viewport
- Position: Fixed bottom, slide from bottom
- Handle: Drag handle at top (drawer native)

---

## 🎨 Content Structure

### **1. Header Section** (Always visible at top)
```
Project Name (2xl, semibold, 2-3 lines max)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[🏷️ Vertical] [● Status] [Q4 2025]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[✏️ Edit Project] (Full width button)
```

**Spacing**: 
- Inner spacing: `mb-3` between elements
- Outer padding: `p-6`
- Tags gap: `gap-2`

**Colors**:
- Vertical badge: Dynamic color from context
- Status badge: Semantic colors (green/yellow/blue)
- Quarter badge: Blue tint (`bg-blue-50 text-blue-700`)

---

### **2. Timeline Section**
```
📅 TIMELINE
━━━━━━━━━━━━━━━━━━━━━━
┌─────────────────────────┐
│ Start Date | Mon, Oct 10, 2024 │
│ Due Date   | Fri, Oct 20, 2024 │
│ Sprint     | Sprint 3           │ (optional)
└─────────────────────────┘
```

**Styling**:
- Section title: `text-sm font-semibold text-muted-foreground uppercase`
- Row: `bg-muted/50 rounded-lg py-2 px-3`
- Label: `text-sm text-muted-foreground`
- Value: `text-sm font-medium`

---

### **3. Project Types Section**
```
📄 PROJECT TYPES
━━━━━━━━━━━━━━━━━━━━━━
[Spot] [Icon] [Banner]
```

**Styling**:
- Badges: Dynamic color from typeColors context
- Padding: `px-3 py-1.5`
- Border: None (solid background)

---

### **4. Collaborators Section**
```
👥 COLLABORATORS
━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────────┐
│ [JD] John Doe          │
│      Illustrator       │
├────────────────────────┤
│ [AS] Alice Smith       │
│      Designer          │
└────────────────────────┘
```

**Styling**:
- Avatar: Circle with initials (32px)
- Background: `bg-muted/50 rounded-lg`
- Name: `text-sm font-medium`
- Role: `text-xs text-muted-foreground`

---

### **5. Resources Section**
```
🔗 RESOURCES
━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────────┐
│ 📄 Figma Design      ↗ │
│ 🖼️ Lightroom         ↗ │
│ 🔗 Google Drive      ↗ │
└────────────────────────┘
```

**Styling**:
- Row: Hover effect (`hover:bg-muted`)
- Icon: `text-muted-foreground`
- Label: `text-sm font-medium truncate`
- External link icon: Transition on hover

---

### **6. Tasks Section** ✨ Updated
```
✅ TASKS (2/3)
━━━━━━━━━━━━━━━━━━━━━━
[Progress Bar: 67% Complete] 2 of 3 done
━━━━━━━━━━━━━━━━━━━━━━

┌────────────────────────────────┐
│ Hero Banner         [Not Started]
│ ────────────────────────────────
│ ☐ Reference
│ ☐ Drafting  
│ ☐ Layouting
│                           0%
│ ────────────────────────────────
│ 👤 Nindya     📅 Oct 15, 2025
└────────────────────────────────┘

┌────────────────────────────────┐
│ Bottom Banner      [In Progress]
│ ────────────────────────────────
│ ☑ Reference
│ ☑ Drafting  
│ ☐ Layouting
│                          67%
│ ────────────────────────────────
│ 👤 Nindya     📅 Oct 15, 2025
└────────────────────────────────┘
```

**Features**:
- ✅ Overall progress bar showing total task completion
- ✅ Individual task cards with title & status badge
- ✅ Action items (checkboxes) - read-only in detail view
- ✅ Individual task progress percentage
- ✅ Collaborators and due date metadata
- ✅ Consistent with screenshot design

**Styling**:
- Card: `bg-muted/30 rounded-lg border border-border/30 p-3`
- Title: `text-sm font-medium`
- Status badge: Dynamic color based on status
- Actions: AssetActionManager component (read-only)
- Progress: Right-aligned percentage
- Meta: Separator border with icons + text

---

### **7. Notes Section**
```
📝 NOTES
━━━━━━━━━━━━━━━━━━━━━━
┌────────────────────────┐
│ This project requires  │
│ collaboration with     │
│ the marketing team...  │
└────────────────────────┘
```

**Styling**:
- Background: `bg-muted/30 rounded-lg`
- Text: `text-sm whitespace-pre-wrap`
- Padding: `py-3 px-4`

---

## 🎯 Section Hierarchy

### **Visual Separators**
Each section is separated by:
```tsx
<Separator className="my-6" />
```

### **Section Title Pattern**
```tsx
<h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
  <Icon className="h-4 w-4" />
  Section Name
</h3>
```

### **Content Spacing**
- Section spacing: `space-y-6` (24px between sections)
- Inner spacing: `space-y-3` (12px within section)
- Row spacing: `space-y-2` (8px between rows)

---

## 🎨 Color System

### **Backgrounds**
- Card background: `bg-white` / `bg-card` (dark mode)
- Row background: `bg-muted/50`
- Note/Asset background: `bg-muted/30`
- Hover: `hover:bg-muted`

### **Text Colors**
- Primary: `text-foreground`
- Secondary: `text-muted-foreground`
- Labels: `text-muted-foreground`
- Values: `text-foreground font-medium`

### **Status Colors** (Semantic)
| Status | Background | Text |
|--------|-----------|------|
| Not Started | `bg-gray-100` | `text-gray-700` |
| In Progress | `bg-[#FFE5A0]` | `text-[#8B6914]` |
| Done | `bg-green-100` | `text-green-700` |
| On Hold | `bg-yellow-100` | `text-yellow-700` |
| Canceled | `bg-red-100` | `text-red-700` |
| On Review | `bg-purple-100` | `text-purple-700` |

---

## 🔄 Interactions

### **Opening Sidebar**
```tsx
// User clicks row in table/timeline
onProjectClick(project) → 
  setSelectedProject(project) → 
  setDetailSidebarOpen(true)
```

### **Closing Sidebar**
- Click X button
- Click overlay (outside sidebar)
- Press ESC key
- Navigate to edit mode

```tsx
onClose() → 
  setDetailSidebarOpen(false) → 
  setTimeout(() => setSelectedProject(null), 300) // Allow animation
```

### **Edit Mode**
```tsx
onEdit(project) → 
  setDetailSidebarOpen(false) → // Close sidebar
  setSelectedProject(project) →
  setCurrentPage('edit-project')
```

---

## 📱 Responsive Behavior

### **Desktop (≥ 768px)**
- Component: `<Sheet>` from shadcn
- Side: `right`
- Width: `480px` (sm), `540px` (lg)
- Animation: Slide from right
- Overlay: Yes (click to close)

### **Mobile (< 768px)**
- Component: `<Drawer>` from shadcn
- Side: `bottom`
- Height: `92vh` max
- Animation: Slide from bottom
- Handle: Native drawer handle

---

## 🛠️ Implementation Files

### **New Components**
1. **`/components/ProjectDetailSidebar.tsx`**
   - Main sidebar component
   - Handles desktop/mobile switching
   - All content sections

### **Modified Components**
1. **`/App.tsx`**
   - Added `detailSidebarOpen` state
   - Modified `navigateToProjectDetail()` to open sidebar
   - Added `closeDetailSidebar()` handler
   - Replaced `ProjectInfo` page navigation with sidebar

---

## 🎯 State Management

### **App.tsx State**
```tsx
const [selectedProject, setSelectedProject] = useState<Project | null>(null);
const [detailSidebarOpen, setDetailSidebarOpen] = useState(false);
```

### **Flow**
```
Table Row Click
     ↓
navigateToProjectDetail(project)
     ↓
setSelectedProject(project)
setDetailSidebarOpen(true)
     ↓
<ProjectDetailSidebar 
  project={selectedProject}
  isOpen={detailSidebarOpen}
  onClose={closeDetailSidebar}
/>
     ↓
User closes or edits
     ↓
closeDetailSidebar()
     ↓
setDetailSidebarOpen(false)
setTimeout(() => setSelectedProject(null), 300)
```

---

## ✅ Benefits

### **Before (Dialog/Modal)**
- ❌ Menutupi seluruh context
- ❌ Tidak bisa lihat table/timeline
- ❌ Feels "blocking"
- ❌ Harus close untuk melihat data lain

### **After (Sidebar)**
- ✅ Context tetap visible (dimmed)
- ✅ Bisa lihat table/timeline di background
- ✅ Feels "contextual"
- ✅ Modern pattern (Linear-style)
- ✅ Better hierarchy dan readability
- ✅ Smooth slide animation

---

## 🚀 Design Principles Applied

1. **Clear Hierarchy**
   - Section titles with uppercase + tracking
   - Consistent icon usage
   - Visual separators

2. **Easy Scanning**
   - Left-aligned labels
   - Right-aligned values (in timeline)
   - Consistent row heights

3. **Information Density**
   - Not too crowded
   - Not too sparse
   - Optimal padding/spacing

4. **Visual Feedback**
   - Hover states on links
   - Active states on buttons
   - Smooth transitions

5. **Accessibility**
   - Semantic HTML
   - ARIA labels
   - Keyboard navigation (ESC to close)

---

## 📊 Spacing Reference

| Element | Spacing |
|---------|---------|
| Outer padding | `p-6` (24px) |
| Section gap | `space-y-6` (24px) |
| Inner section gap | `space-y-3` (12px) |
| Row gap | `space-y-2` (8px) |
| Tag gap | `gap-2` (8px) |
| Icon-text gap | `gap-2` / `gap-3` |
| Header bottom margin | `mb-3` (12px) |

---

## 🎨 Typography Scale

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Project name | 2xl (24px) | Semibold | foreground |
| Section title | sm (14px) | Semibold | muted-foreground |
| Label | sm (14px) | Regular | muted-foreground |
| Value | sm (14px) | Medium | foreground |
| Badge text | sm (14px) | Medium | Various |
| Notes | sm (14px) | Regular | foreground |

---

## ✅ Production Status

**Status**: ✅ **Ready for Production**

- Desktop sidebar: Working with Sheet
- Mobile drawer: Working with Drawer
- Responsive: Proper breakpoint (768px)
- Animations: Smooth slide transitions
- State management: Clean and predictable
- Hierarchy: Clear sections with separators
- Readability: Optimized spacing and typography

---

**Completed**: Project Detail Sidebar Implementation  
**Pattern**: Linear/Notion-style sidebar  
**Experience**: Modern, contextual, easy to read ✨
