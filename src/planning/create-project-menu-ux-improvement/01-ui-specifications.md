# 📐 UI SPECIFICATIONS - Two-Column Layout

## 🎨 LAYOUT STRUCTURE

### **Desktop Grid (≥1024px)**

```
Main Container:
┌──────────────────────────────────────────────────────────────┐
│ Project Form Wrapper                                         │
│ className="lg:grid lg:grid-cols-[45%_55%] lg:gap-6          │
│            space-y-6 lg:space-y-0"                          │
├─────────────────────────────┬────────────────────────────────┤
│ LEFT COLUMN                 │ RIGHT COLUMN                   │
│ className="space-y-6"       │ className="space-y-6"          │
│                             │                                │
│ [8 sections]                │ [4 sections]                   │
│ ~850px height               │ ~1300px height                 │
└─────────────────────────────┴────────────────────────────────┘

Dimensions:
- Left Column:  45% width (~650px at 1440px viewport)
- Right Column: 55% width (~790px at 1440px viewport)
- Gap:          24px (gap-6)
- Padding:      Same as current (per section)
```

---

## 📏 COLUMN SPECIFICATIONS

### **LEFT COLUMN (45%)**

**Purpose:** Essential metadata, quick-access fields, configuration

**Sections (in order):**
1. Vertical Selector
2. Project Name (required)
3. Description (optional)
4. Internal Notes (optional)
5. Status
6. Timeline (Start/Due dates)
7. Illustration Types (required)
8. Collaborators

**Styling:**
```tsx
className="space-y-6"  // Vertical spacing between sections
```

**Individual Section Heights:**
| Section | Approx Height | Notes |
|---------|--------------|-------|
| Vertical Selector | ~80px | Compact chips |
| Project Name | ~90px | Single input |
| Description | ~140px | Textarea min-h-24 |
| Internal Notes | ~120px | Textarea min-h-20 |
| Status | ~90px | Select dropdown |
| Timeline | ~110px | 2-col grid dates |
| Types | ~120px | Badge list + select |
| Collaborators | ~100px | Avatar stack |
| **TOTAL** | **~850px** | Compact design |

---

### **RIGHT COLUMN (55%)**

**Purpose:** Content-heavy sections, expandable content, media

**Sections (in order):**
1. Actionable Items (Assets) (required)
2. Project Links
3. Lightroom Assets (optional)
4. Google Drive Assets (optional)

**Styling:**
```tsx
className="space-y-6"  // Vertical spacing between sections
```

**Individual Section Heights:**
| Section | Approx Height | Notes |
|---------|--------------|-------|
| Actionable Items | ~400px+ | Accordion, expandable |
| Project Links | ~450px | Icon grid + inputs |
| Lightroom Assets | ~200px | Image grid |
| GDrive Assets | ~250px | Folder tree |
| **TOTAL** | **~1300px** | Spacious, can grow |

---

## 🎨 RESPONSIVE BREAKPOINTS

### **Desktop (≥1024px) - Two Columns**

```css
.project-form-wrapper {
  display: grid;
  grid-template-columns: 45% 55%;
  gap: 1.5rem; /* 24px */
}
```

**Tailwind Classes:**
```tsx
className="lg:grid lg:grid-cols-[45%_55%] lg:gap-6 space-y-6 lg:space-y-0"
```

**Behavior:**
- ✅ Horizontal layout
- ✅ Two columns side-by-side
- ✅ No vertical spacing (lg:space-y-0)
- ✅ 24px gap between columns

---

### **Mobile/Tablet (<1024px) - Single Column**

```css
.project-form-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem; /* 24px */
}
```

**Tailwind Classes:**
```tsx
className="space-y-6"  // Mobile default
```

**Behavior:**
- ✅ Vertical stack
- ✅ Single column (100% width)
- ✅ Same as current mobile layout
- ✅ 24px spacing between sections

---

## 📦 SECTION CARDS STYLING

### **Current Card Style (Unchanged):**

```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4 space-y-4">
    {/* Section content */}
  </CardContent>
</Card>
```

### **Optional Enhancement (Future):**

```tsx
// Add subtle hover state
<Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
  <CardContent className="p-4 space-y-4">
    {/* Section content */}
  </CardContent>
</Card>
```

---

## 🎯 SECTION-BY-SECTION LAYOUT

### **1. Vertical Selector (LEFT)**

**Current:**
```tsx
<VerticalSelector
  value={formData.vertical}
  verticals={verticals}
  verticalColors={verticalColors}
  onChange={(value) => updateData('vertical', value)}
  onAddVertical={onAddVertical}
/>
```

**Position:** LEFT column, position 1  
**Height:** ~80px  
**No changes to component itself**

---

### **2. Project Name (LEFT)**

**Current:**
```tsx
<div className="space-y-3">
  <div className="flex items-center gap-2">
    <Briefcase className="h-4 w-4 text-primary" />
    <Label>Project Name *</Label>
  </div>
  <Input
    value={formData.project_name || ''}
    onChange={(e) => updateData('project_name', e.target.value)}
    className="h-12 bg-background border-2"
    required
  />
</div>
```

**Position:** LEFT column, position 2  
**Height:** ~90px  
**No changes needed**

---

### **3. Description (LEFT)**

**Current:**
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4 space-y-4">
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4" />
      <h3>Project Description (Optional)</h3>
    </div>
    <Textarea
      value={formData.description}
      onChange={(e) => updateData('description', e.target.value)}
      className="min-h-[100px]"
    />
  </CardContent>
</Card>
```

**Position:** LEFT column, position 3  
**Height:** ~140px  
**Potential optimization:** Change `min-h-[100px]` → `min-h-[80px]` for compact

---

### **4. Internal Notes (LEFT)**

**Current:**
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4 space-y-4">
    <div className="flex items-center gap-2">
      <FileText className="h-4 w-4" />
      <h3>Internal Notes (Optional, max 150 chars)</h3>
    </div>
    <Textarea
      value={formData.notes || ''}
      onChange={(e) => updateData('notes', e.target.value)}
      className="min-h-[80px]"
      maxLength={150}
    />
    <p>{(formData.notes || '').length}/150 characters</p>
  </CardContent>
</Card>
```

**Position:** LEFT column, position 4  
**Height:** ~120px  
**No changes needed**

---

### **5. Status (LEFT)**

**Current:**
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4 space-y-4">
    <div className="flex items-center gap-2">
      <Tag className="h-4 w-4" />
      <h3>Project Status</h3>
    </div>
    <Select
      value={formData.status}
      onValueChange={(value) => updateData('status', value)}
    >
      <SelectTrigger className="h-12" />
      <SelectContent>{/* options */}</SelectContent>
    </Select>
  </CardContent>
</Card>
```

**Position:** LEFT column, position 5  
**Height:** ~90px  
**No changes needed**

---

### **6. Timeline (LEFT)**

**Current:**
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4 space-y-4">
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4" />
      <h3>Project Timeline</h3>
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div>
        <Label>START DATE</Label>
        <DatePickerWithToday value={formData.start_date} />
      </div>
      <div>
        <Label>DUE DATE</Label>
        <DatePickerWithToday value={formData.due_date} />
      </div>
    </div>
  </CardContent>
</Card>
```

**Position:** LEFT column, position 6  
**Height:** ~110px  
**No changes needed**

---

### **7. Illustration Types (LEFT)**

**Current:**
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4 space-y-4">
    <div className="flex items-center gap-2">
      <ArrowUpDown className="h-4 w-4" />
      <h3>Illustration Types *</h3>
    </div>
    <div className="space-y-4">
      {/* Selected types badges */}
      <Select onValueChange={addType}>
        <SelectTrigger className="h-12" />
        <SelectContent>{/* options */}</SelectContent>
      </Select>
    </div>
  </CardContent>
</Card>
```

**Position:** LEFT column, position 7  
**Height:** ~120px  
**No changes needed**

---

### **8. Collaborators (LEFT)**

**Current:**
```tsx
<TeamMemberManager
  formData={formData}
  collaborators={collaborators}
  onFormDataChange={onFormDataChange}
/>
```

**Position:** LEFT column, position 8 (last)  
**Height:** ~100px  
**No changes to component**

---

### **9. Actionable Items (RIGHT)**

**Current:**
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4">
    <ActionableItemManager
      actionableItems={formData.actionable_items || []}
      projectCollaborators={formData.collaborators}
      globalCollaborators={collaborators}
      onActionableItemsChange={handleActionableItemsChange}
      onProjectCollaboratorsChange={(newCollaborators) => {...}}
      onAllItemsCompleted={handleAllItemsCompleted}
      onProjectStatusChange={(newStatus) => {...}}
    />
  </CardContent>
</Card>
```

**Position:** RIGHT column, position 1  
**Height:** ~400px+ (expandable)  
**No changes to component**

---

### **10. Project Links (RIGHT)**

**Current:**
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4 space-y-4">
    <div className="flex items-center gap-2">
      <Link className="h-4 w-4" />
      <h3>Project Links</h3>
    </div>
    {/* Existing links list */}
    {/* Icon grid (ScrollArea 280px) */}
    {/* URL input */}
  </CardContent>
</Card>
```

**Position:** RIGHT column, position 2  
**Height:** ~450px  
**No changes needed**

---

### **11. Lightroom Assets (RIGHT)**

**Current:**
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4">
    <LightroomAssetManager
      assets={formData.lightroom_assets || []}
      onChange={(assets) => updateData('lightroom_assets', assets)}
      actionableItems={formData.actionable_items || []}
    />
  </CardContent>
</Card>
```

**Position:** RIGHT column, position 3  
**Height:** ~200px  
**No changes to component**

---

### **12. Google Drive Assets (RIGHT)**

**Current:**
```tsx
<Card className="overflow-hidden">
  <CardContent className="p-4">
    <GDriveAssetManager
      assets={formData.gdrive_assets || []}
      onChange={(assets) => updateData('gdrive_assets', assets)}
      projectId={projectId || `temp-${Date.now()}`}
      actionableItems={formData.actionable_items || []}
    />
  </CardContent>
</Card>
```

**Position:** RIGHT column, position 4 (last)  
**Height:** ~250px  
**No changes to component**

---

## 🎨 SPACING SYSTEM

### **Gap Between Columns:**
```
gap-6 = 24px

┌────────┐ 24px ┌────────┐
│  LEFT  │◄────►│ RIGHT  │
└────────┘      └────────┘
```

### **Vertical Spacing (Within Columns):**
```
space-y-6 = 24px

┌─────────┐
│ Section │
└─────────┘
    ↕ 24px
┌─────────┐
│ Section │
└─────────┘
```

### **Card Padding (Current):**
```
p-4 = 16px padding all sides
```

### **Card Content Spacing:**
```
space-y-4 = 16px between elements
```

---

## 🖱️ INTERACTION STATES

### **Card Hover (Optional Enhancement):**

**Default:**
```tsx
<Card className="overflow-hidden border-2">
```

**Hover:**
```tsx
<Card className="overflow-hidden border-2 hover:border-primary/50 transition-colors">
```

**Visual Effect:**
- Border color changes to primary/50
- Smooth 200ms transition
- Subtle elevation (optional shadow)

---

## 📱 MOBILE RESPONSIVENESS

### **Viewport Sizes:**

| Device | Width | Layout |
|--------|-------|--------|
| Desktop | ≥1024px | Two columns |
| Tablet | 768-1023px | Single column |
| Mobile | <768px | Single column |

### **Breakpoint Behavior:**

**At 1024px:**
```
1025px:  [LEFT | RIGHT]  ← Two columns
1024px:  [LEFT | RIGHT]  ← Still two columns
1023px:  [SINGLE]        ← Collapse to single
```

### **Mobile Order (Top to Bottom):**
1. Vertical Selector
2. Project Name
3. Description
4. Internal Notes
5. Status
6. Timeline
7. Types
8. Collaborators
9. Actionable Items
10. Project Links
11. Lightroom Assets
12. GDrive Assets

**Same as current mobile order - no changes!**

---

## 🎯 VISUAL HIERARCHY

### **Color Coding (Priority):**

```
🟢 P0 - Critical:   Vertical, Name, Status
🟠 P1 - Important:  Timeline, Types, Collaborators
🟡 P2 - Optional:   Description, Notes
🔵 P3 - Content:    Assets, Links, Files
```

### **Layout Reflects Priority:**

**LEFT (Always Visible):**
- 🟢 P0: Vertical, Name, Status
- 🟠 P1: Timeline, Types, Collaborators
- 🟡 P2: Description, Notes

**RIGHT (Scrollable):**
- 🔵 P3: All content sections

---

## 📐 DIMENSIONS REFERENCE

### **At Common Viewport Sizes:**

**1920px (Full HD Desktop):**
- Left column: 45% = 864px
- Gap: 24px
- Right column: 55% = 1056px

**1440px (Laptop):**
- Left column: 45% = 648px
- Gap: 24px
- Right column: 55% = 792px

**1280px (Small Laptop):**
- Left column: 45% = 576px
- Gap: 24px
- Right column: 55% = 704px

**1024px (Breakpoint):**
- Left column: 45% = 460px
- Gap: 24px
- Right column: 55% = 563px

**768px (Tablet):**
- Single column: 100%

---

## ✅ IMPLEMENTATION CHECKLIST

**Grid Structure:**
- [ ] Add grid wrapper with responsive classes
- [ ] Create left column div
- [ ] Create right column div
- [ ] Add gap-6 for spacing

**Left Column Sections:**
- [ ] Move Vertical Selector
- [ ] Move Project Name
- [ ] Move Description
- [ ] Move Internal Notes
- [ ] Move Status
- [ ] Move Timeline
- [ ] Move Types
- [ ] Move Collaborators

**Right Column Sections:**
- [ ] Move Actionable Items
- [ ] Move Project Links
- [ ] Move Lightroom Assets
- [ ] Move GDrive Assets

**Styling:**
- [ ] Test spacing consistency
- [ ] Verify card padding
- [ ] Check vertical alignment
- [ ] Test responsive breakpoints

**Testing:**
- [ ] Desktop layouts (1920px, 1440px, 1280px)
- [ ] Breakpoint (1024px)
- [ ] Tablet (768px)
- [ ] Mobile (375px)

---

*UI Specifications for Two-Column Layout*  
*Version: v2.8.0*  
*Next: Implementation Guide*
