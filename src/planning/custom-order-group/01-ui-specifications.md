# Custom Group Order Feature - UI Specifications

## 🎨 UI Components Overview

This document details the UI specifications for the Custom Group Order feature in Settings Page.

---

## 📍 Settings Page Layout

### **Section Placement**

Settings Page akan memiliki 2 new sections:

```
Settings Page
├── ... (existing sections)
├── Table Column Order          ← Existing
├── Status Group Order          ← NEW (Section 1)
│   ├── Active Projects Order   ← Subsection 1a
│   └── Archive Projects Order  ← Subsection 1b
├── Vertical Group Order        ← NEW (Section 2)
└── ... (other sections)
```

**Rationale**: Menempatkan kedua section setelah "Table Column Order" karena keduanya berkaitan dengan table view customization.

---

## 🎯 Section 1: Status Group Order

### **Section Header**

```tsx
<div className="space-y-4">
  <div>
    <h3 className="text-lg font-medium">Status Group Order</h3>
    <p className="text-sm text-muted-foreground">
      Customize the order of status groups in Table view. 
      Active and Archive tabs have separate orderings.
    </p>
  </div>
  
  {/* Subsection 1a: Active Projects Order */}
  {/* Subsection 1b: Archive Projects Order */}
</div>
```

---

### **Subsection 1a: Active Projects Order**

#### **Layout Structure**

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base flex items-center justify-between">
      <span>Active Projects Order</span>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleResetActiveOrder}
      >
        Reset to Default
      </Button>
    </CardTitle>
    <p className="text-xs text-muted-foreground">
      These statuses appear in the "Table" tab (non-archive projects)
    </p>
  </CardHeader>
  
  <CardContent>
    {/* Draggable list of active statuses */}
    <DraggableStatusList items={activeStatusOrder} />
  </CardContent>
</Card>
```

#### **Draggable Item Design**

Each status item in the list:

```tsx
<div className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors group">
  {/* Drag Handle */}
  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
  
  {/* Order Number */}
  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
    {index + 1}
  </div>
  
  {/* Status Name */}
  <div className="flex-1 text-sm font-medium">
    {statusName}
  </div>
  
  {/* Status Color Indicator (if available) */}
  <div 
    className="w-3 h-3 rounded-full" 
    style={{ backgroundColor: statusColor }}
  />
</div>
```

**Visual States:**
- Default: `bg-card border`
- Hover: `hover:bg-accent/50`
- Dragging: `opacity-50 cursor-grabbing`
- Drop target: `border-primary border-2 bg-primary/5`

---

### **Subsection 1b: Archive Projects Order**

Similar structure to 1a, but for archive statuses:

```tsx
<Card>
  <CardHeader>
    <CardTitle className="text-base flex items-center justify-between">
      <span>Archive Projects Order</span>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleResetArchiveOrder}
      >
        Reset to Default
      </Button>
    </CardTitle>
    <p className="text-xs text-muted-foreground">
      These statuses appear in the "Archive" tab
    </p>
  </CardHeader>
  
  <CardContent>
    {/* Draggable list of archive statuses */}
    <DraggableStatusList items={archiveStatusOrder} />
  </CardContent>
</Card>
```

**Default Items:**
- Done
- Canceled

---

## 🎯 Section 2: Vertical Group Order

### **Section Structure**

```tsx
<div className="space-y-4">
  <div>
    <h3 className="text-lg font-medium">Vertical Group Order</h3>
    <p className="text-sm text-muted-foreground">
      Customize the order of vertical groups when grouping by Vertical in Table view.
      Default order is alphabetical (A-Z).
    </p>
  </div>
  
  <Card>
    <CardHeader>
      <CardTitle className="text-base flex items-center justify-between">
        <span>Vertical Order</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleResetVerticalOrder}
        >
          Reset to Alphabetical
        </Button>
      </CardTitle>
    </CardHeader>
    
    <CardContent>
      {/* Draggable list of verticals */}
      <DraggableVerticalList items={verticalOrder} />
    </CardContent>
  </Card>
</div>
```

---

### **Draggable Vertical Item Design**

Each vertical item in the list:

```tsx
<div className="flex items-center gap-3 p-3 bg-card border rounded-lg hover:bg-accent/50 transition-colors group">
  {/* Drag Handle */}
  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
  
  {/* Order Number */}
  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
    {index + 1}
  </div>
  
  {/* Vertical Name */}
  <div className="flex-1 text-sm font-medium">
    {verticalName}
  </div>
  
  {/* Vertical Color Indicator (if available) */}
  <div 
    className="w-3 h-3 rounded-full border" 
    style={{ backgroundColor: verticalColor }}
  />
</div>
```

---

## 🎭 Interactive States

### **Drag & Drop Behavior**

#### **1. Grab State**
```css
cursor: grab;
/* On mousedown */
cursor: grabbing;
```

#### **2. Dragging State**
```tsx
{isDragging && (
  <div className="opacity-50 rotate-2">
    {/* Original item with reduced opacity */}
  </div>
)}
```

#### **3. Drop Zone Indicator**
```tsx
{isOver && canDrop && (
  <div className="h-1 bg-primary rounded-full my-1" />
)}
```

#### **4. Invalid Drop Zone**
```tsx
{isOver && !canDrop && (
  <div className="h-1 bg-destructive rounded-full my-1" />
)}
```

---

## 📱 Responsive Design

### **Desktop (> 768px)**
- Full width cards with padding
- Drag handle always visible
- Hover states enabled

### **Mobile (< 768px)**
- Reduced padding for cards
- Larger touch targets (min 44px height)
- Drag handle larger (h-5 w-5 instead of h-4 w-4)
- Simplified layout (hide order numbers on mobile)

```tsx
<div className="flex items-center gap-2 md:gap-3 p-2 md:p-3">
  <GripVertical className="h-5 w-5 md:h-4 md:w-4" />
  
  {/* Order number - hidden on mobile */}
  <div className="hidden md:flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-medium">
    {index + 1}
  </div>
  
  <div className="flex-1 text-sm">
    {itemName}
  </div>
</div>
```

---

## 🎨 Visual Design Tokens

### **Colors**

```tsx
// Item background
bg-card                    // Default
hover:bg-accent/50         // Hover
bg-primary/5               // Drop target

// Borders
border                     // Default (from theme)
border-primary border-2    // Drop target
border-destructive         // Invalid drop

// Text
text-sm font-medium        // Item name
text-xs text-muted-foreground  // Helper text

// Icons
text-muted-foreground      // Drag handle
text-primary               // Order number
```

### **Spacing**

```tsx
// Card spacing
space-y-4                  // Between sections
p-3                        // Item padding
gap-3                      // Item internal gap

// Section spacing
space-y-6                  // Between major sections in Settings
```

### **Sizing**

```tsx
// Icons
h-4 w-4                    // Drag handle (desktop)
h-5 w-5                    // Drag handle (mobile)

// Order number badge
w-6 h-6                    // Circle size
text-xs                    // Font size

// Status/Vertical color dot
w-3 h-3                    // Indicator size
```

---

## 🔔 Feedback Mechanisms

### **1. Auto-save Indicator**

Show toast notification on successful save:

```tsx
toast.success("Status group order updated");
toast.success("Vertical group order updated");
```

### **2. Reset Confirmation**

Show confirmation dialog before reset:

```tsx
<AlertDialog>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Reset to Default Order?</AlertDialogTitle>
      <AlertDialogDescription>
        This will restore the default status order. Your custom order will be lost.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={handleReset}>
        Reset
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

### **3. Loading States**

Show skeleton while loading order:

```tsx
{isLoading ? (
  <div className="space-y-2">
    <Skeleton className="h-14 w-full" />
    <Skeleton className="h-14 w-full" />
    <Skeleton className="h-14 w-full" />
  </div>
) : (
  <DraggableList items={items} />
)}
```

---

## 🎯 Accessibility

### **Keyboard Navigation**

```tsx
// Enable keyboard reordering
<div
  tabIndex={0}
  role="button"
  aria-label={`${itemName}, position ${index + 1} of ${total}. Press space to grab, arrow keys to move, space to drop.`}
  onKeyDown={handleKeyboardReorder}
>
  {/* Item content */}
</div>
```

### **Screen Reader Announcements**

```tsx
// On drag start
announce("Grabbed ${itemName} at position ${index + 1}");

// On move
announce("${itemName} moved to position ${newIndex + 1}");

// On drop
announce("${itemName} dropped at position ${finalIndex + 1}");
```

### **ARIA Attributes**

```tsx
<div
  role="list"
  aria-label="Status group order"
>
  <div 
    role="listitem"
    aria-grabbed={isDragging}
    aria-dropeffect="move"
  >
    {/* Item */}
  </div>
</div>
```

---

## 📊 Empty States

### **No Active Statuses**

```tsx
<div className="p-8 text-center text-sm text-muted-foreground">
  <p>No active statuses found.</p>
  <p className="mt-2">Create statuses in Status Manager to customize order.</p>
</div>
```

### **No Archive Statuses**

```tsx
<div className="p-8 text-center text-sm text-muted-foreground">
  <p>No archive statuses found.</p>
  <p className="mt-2">"Done" and "Canceled" are default archive statuses.</p>
</div>
```

### **No Verticals**

```tsx
<div className="p-8 text-center text-sm text-muted-foreground">
  <p>No verticals found.</p>
  <p className="mt-2">Create verticals in Type & Vertical Management to customize order.</p>
</div>
```

---

## 🎬 Animation Specifications

### **Drag Animation**

```tsx
// Smooth transition when reordering
<motion.div
  layout
  transition={{ 
    type: "spring", 
    stiffness: 500, 
    damping: 30 
  }}
>
  {/* Item */}
</motion.div>
```

### **Reset Animation**

```tsx
// Fade out old order, fade in new order
<motion.div
  initial={{ opacity: 0, y: -10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2 }}
>
  {/* Reordered list */}
</motion.div>
```

---

## 🔗 Consistency with Existing Patterns

This feature follows the established patterns from **TableColumnOrderManager**:

✅ Same drag & drop library (react-dnd)  
✅ Same Card/CardHeader/CardContent structure  
✅ Same "Reset to Default" button placement  
✅ Same auto-save behavior (no explicit save button)  
✅ Same toast notifications  
✅ Same responsive breakpoints  

**Difference**: We have multiple subsections (Active/Archive) instead of single list.

---

**Next Document**: [02-data-structures.md](./02-data-structures.md)
