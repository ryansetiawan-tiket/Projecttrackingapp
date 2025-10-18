# Mobile Development Patterns

Quick reference untuk mobile-first development patterns dalam aplikasi ini.

---

## **1. Responsive Layout Patterns**

### **Two-Column to Stack**
```tsx
// Desktop: 2 columns side by side
// Mobile: Stacked vertically
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  <LeftContent />
  <RightContent />
</div>
```

### **Three-Column to Stack**
```tsx
// Desktop: 3 columns
// Tablet: 2 columns  
// Mobile: 1 column
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>
```

### **Sidebar Layout**
```tsx
// Desktop: Sidebar + Main
// Mobile: Stack
<div className="flex flex-col lg:flex-row gap-6">
  <aside className="lg:w-64">Sidebar</aside>
  <main className="flex-1">Main Content</main>
</div>
```

---

## **2. Typography Patterns**

### **Heading Sizes**
```tsx
// Page Title
<h1 className="text-xl md:text-2xl lg:text-3xl">
  Page Title
</h1>

// Section Title
<h2 className="text-lg md:text-xl">
  Section Title
</h2>

// Card Title
<h3 className="text-base md:text-lg">
  Card Title
</h3>

// Sub-heading
<h4 className="text-sm md:text-base">
  Sub Heading
</h4>
```

### **Body Text**
```tsx
// Primary text
<p className="text-sm md:text-base">
  Body text
</p>

// Secondary text
<p className="text-xs md:text-sm text-muted-foreground">
  Secondary text
</p>

// Small text
<span className="text-xs">
  Small text
</span>
```

---

## **3. Spacing Patterns**

### **Container Padding**
```tsx
// Outer container
<div className="container mx-auto px-4 py-6 pb-safe">

// Card padding
<CardContent className="p-3 md:p-4 lg:p-6">

// Section spacing
<div className="space-y-4 md:space-y-6 lg:space-y-8">
```

### **Gap Sizing**
```tsx
// Flex/Grid gaps
<div className="flex gap-2 md:gap-4 lg:gap-6">
<div className="grid gap-3 md:gap-4 lg:gap-6">
```

---

## **4. Component Patterns**

### **Button Sizes**
```tsx
// Mobile-optimized buttons
<Button 
  size="sm" 
  className="w-full sm:w-auto"
>
  Action
</Button>

// Icon buttons with proper touch target
<Button
  size="icon"
  className="h-9 w-9 md:h-10 md:w-10"
>
  <Icon className="h-4 w-4" />
</Button>
```

### **Form Layouts**
```tsx
// Mobile: Stacked fields
// Desktop: Can use grid
<div className="space-y-4 md:space-y-0 md:grid md:grid-cols-2 md:gap-4">
  <div className="space-y-2">
    <Label>Field 1</Label>
    <Input />
  </div>
  <div className="space-y-2">
    <Label>Field 2</Label>
    <Input />
  </div>
</div>
```

### **Card Headers**
```tsx
<CardHeader className="pb-3">
  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
    <Icon className="h-4 w-4 md:h-5 md:w-5" />
    Title
  </CardTitle>
  <CardDescription className="text-xs md:text-sm">
    Description text
  </CardDescription>
</CardHeader>
```

---

## **5. Navigation Patterns**

### **Header Navigation**
```tsx
<header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b safe-area-inset">
  <div className="container mx-auto px-4 py-3 md:py-4">
    <div className="flex items-center gap-2 md:gap-4">
      <Button variant="ghost" size="sm" className="h-9 px-2 md:px-3">
        <ArrowLeft className="h-4 w-4 md:mr-2" />
        <span className="hidden md:inline">Back</span>
      </Button>
    </div>
  </div>
</header>
```

### **Tab Navigation**
```tsx
<TabsList className="grid w-full grid-cols-6 h-auto">
  <TabsTrigger className="flex items-center gap-1 py-2 px-2 sm:px-3">
    <Icon className="h-4 w-4 flex-shrink-0" />
    <span className="hidden md:inline truncate">Full Label</span>
    <span className="md:hidden text-xs truncate">Short</span>
  </TabsTrigger>
</TabsList>
```

---

## **6. Modal/Drawer Patterns**

### **Responsive Dialogs**
```tsx
// Use Sheet for desktop, Drawer for mobile
import { useIsMobile } from './ui/use-mobile';

function MyDialog() {
  const isMobile = useIsMobile();
  
  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        {content}
      </DialogContent>
    </Dialog>
  );
}
```

---

## **7. Icon Patterns**

### **Icon Sizing**
```tsx
// Large icons (headers, featured)
<Icon className="h-6 w-6 md:h-8 md:w-8" />

// Medium icons (section headers)
<Icon className="h-4 w-4 md:h-5 md:w-5" />

// Small icons (inline, buttons)
<Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />

// Tiny icons (metadata, badges)
<Icon className="h-3 w-3" />
```

---

## **8. Utility Classes**

### **Safe Area**
```tsx
// For notched devices
<div className="safe-area-inset">
<div className="pb-safe">
<div className="pt-safe">
```

### **Touch Optimization**
```tsx
// Better touch interaction
<button className="touch-manipulation">
<div className="touch-target"> // min 44x44px
<div className="no-touch-select"> // Prevent selection
```

### **Scrolling**
```tsx
// Smooth iOS scrolling
<div className="momentum-scroll overflow-y-auto">
```

---

## **9. Visibility Controls**

### **Show/Hide by Breakpoint**
```tsx
// Hide on mobile, show on desktop
<div className="hidden md:block">Desktop Only</div>

// Show on mobile, hide on desktop
<div className="md:hidden">Mobile Only</div>

// Show different content
<>
  <div className="md:hidden">Mobile Content</div>
  <div className="hidden md:block">Desktop Content</div>
</>
```

### **Conditional Rendering**
```tsx
const isMobile = useIsMobile();

return (
  <>
    {isMobile ? (
      <MobileComponent />
    ) : (
      <DesktopComponent />
    )}
  </>
);
```

---

## **10. Common Mistakes to Avoid**

### **❌ Don't**
```tsx
// Too small on mobile
<Button size="sm" className="h-8">

// Hover-only interaction
<div className="hover:bg-accent">

// Text too small
<p className="text-xs md:text-xs">

// Complex grid on mobile
<div className="grid grid-cols-3">
```

### **✅ Do**
```tsx
// Proper touch target
<Button size="sm" className="h-9 md:h-10">

// Touch-friendly interaction
<button className="touch-manipulation active:scale-95">

// Appropriate text size
<p className="text-sm md:text-base">

// Mobile-friendly grid
<div className="grid grid-cols-1 md:grid-cols-3">
```

---

## **11. Performance Tips**

### **Lazy Loading**
```tsx
// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function MyPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### **Optimized Images**
```tsx
// Use appropriate sizes
<img 
  src={isMobile ? image.mobile : image.desktop}
  loading="lazy"
  className="w-full h-auto"
/>
```

---

## **12. Testing Checklist**

```tsx
// Quick mobile test in component
function MyComponent() {
  const isMobile = useIsMobile();
  
  console.log('Mobile mode:', isMobile);
  
  // Test different states
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

### **Browser DevTools**
1. Open DevTools (F12)
2. Toggle device toolbar (Ctrl+Shift+M)
3. Test these sizes:
   - 375px (iPhone SE)
   - 390px (iPhone 12/13/14)
   - 768px (iPad)
   - 1024px (Desktop)

---

## **Quick Reference: Breakpoints**

```tsx
// sm: 640px
className="sm:..."

// md: 768px (main mobile/desktop split)
className="md:..."

// lg: 1024px
className="lg:..."

// xl: 1280px
className="xl:..."

// 2xl: 1536px
className="2xl:..."
```

---

## **Template: New Mobile Component**

```tsx
import { useIsMobile } from './ui/use-mobile';

export function MyComponent() {
  const isMobile = useIsMobile();
  
  return (
    <div className="container mx-auto px-4 py-6 pb-safe">
      <header className="mb-6">
        <h1 className="text-xl md:text-2xl">
          Component Title
        </h1>
      </header>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="space-y-3 md:space-y-4">
              {/* Content */}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

Happy mobile coding! 📱✨
