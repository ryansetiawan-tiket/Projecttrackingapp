# Custom Group Order Feature - Testing Guide

## 🧪 Testing Overview

This document provides comprehensive testing procedures for the Custom Group Order feature.

---

## 📋 Pre-Testing Checklist

### **Environment Setup**

- [ ] Development environment running
- [ ] Database connection working
- [ ] Test data populated (statuses, verticals, projects)
- [ ] Browser console open for error monitoring
- [ ] React DevTools installed (optional but helpful)

### **Test Data Preparation**

Create the following test data:

**Statuses:**
- In Progress
- In Review
- Lightroom
- Not Started
- Babysit
- On Hold
- Done
- Canceled
- (Add a test status: "Waiting for Client")

**Verticals:**
- Brand
- Creative
- Marketing
- Product
- (Add a test vertical: "Sales")

**Projects:**
- At least 3 projects per status
- At least 3 projects per vertical
- Mix of active and archived projects

---

## 🎯 Unit Testing

### **Test Suite 1: groupOrderUtils.ts**

#### **Test 1.1: mergeOrderWithItems - Basic Merge**

```typescript
describe('mergeOrderWithItems', () => {
  test('preserves order for existing items', () => {
    const savedOrder = ['A', 'B', 'C'];
    const availableItems = ['A', 'B', 'C'];
    const result = mergeOrderWithItems(savedOrder, availableItems, false);
    expect(result).toEqual(['A', 'B', 'C']);
  });

  test('appends new items to end', () => {
    const savedOrder = ['A', 'B'];
    const availableItems = ['A', 'B', 'C', 'D'];
    const result = mergeOrderWithItems(savedOrder, availableItems, false);
    expect(result).toEqual(['A', 'B', 'C', 'D']);
  });

  test('removes deleted items', () => {
    const savedOrder = ['A', 'B', 'C', 'D'];
    const availableItems = ['A', 'C'];
    const result = mergeOrderWithItems(savedOrder, availableItems, false);
    expect(result).toEqual(['A', 'C']);
  });

  test('sorts new items alphabetically when flag is true', () => {
    const savedOrder = ['Product', 'Marketing'];
    const availableItems = ['Product', 'Marketing', 'Sales', 'Brand'];
    const result = mergeOrderWithItems(savedOrder, availableItems, true);
    expect(result).toEqual(['Product', 'Marketing', 'Brand', 'Sales']);
  });

  test('handles empty saved order', () => {
    const savedOrder = [];
    const availableItems = ['A', 'B', 'C'];
    const result = mergeOrderWithItems(savedOrder, availableItems, false);
    expect(result).toEqual(['A', 'B', 'C']);
  });

  test('handles empty available items', () => {
    const savedOrder = ['A', 'B', 'C'];
    const availableItems = [];
    const result = mergeOrderWithItems(savedOrder, availableItems, false);
    expect(result).toEqual([]);
  });
});
```

#### **Test 1.2: Validation Functions**

```typescript
describe('validateStatusOrder', () => {
  test('accepts valid string array', () => {
    const valid = ['Status 1', 'Status 2', 'Status 3'];
    expect(validateStatusOrder(valid)).toBe(true);
  });

  test('rejects non-array', () => {
    expect(validateStatusOrder('not an array')).toBe(false);
    expect(validateStatusOrder(null)).toBe(false);
    expect(validateStatusOrder(undefined)).toBe(false);
  });

  test('rejects array with non-strings', () => {
    expect(validateStatusOrder([1, 2, 3])).toBe(false);
    expect(validateStatusOrder(['Status', 123])).toBe(false);
  });

  test('rejects array with duplicates', () => {
    expect(validateStatusOrder(['A', 'B', 'A'])).toBe(false);
  });

  test('rejects array with empty strings', () => {
    expect(validateStatusOrder(['A', '', 'B'])).toBe(false);
    expect(validateStatusOrder(['A', '  ', 'B'])).toBe(false);
  });
});
```

#### **Test 1.3: Sync Functions**

```typescript
describe('syncStatusOrder', () => {
  test('filters to active statuses only', () => {
    const currentOrder = ['In Progress', 'In Review'];
    const availableStatuses = ['In Progress', 'In Review', 'Done', 'Canceled'];
    const result = syncStatusOrder(currentOrder, availableStatuses, false);
    expect(result).not.toContain('Done');
    expect(result).not.toContain('Canceled');
  });

  test('filters to archive statuses only', () => {
    const currentOrder = ['Done', 'Canceled'];
    const availableStatuses = ['In Progress', 'Done', 'Canceled'];
    const result = syncStatusOrder(currentOrder, availableStatuses, true);
    expect(result).toContain('Done');
    expect(result).toContain('Canceled');
    expect(result).not.toContain('In Progress');
  });
});

describe('syncVerticalOrder', () => {
  test('sorts new verticals alphabetically', () => {
    const currentOrder = ['Product'];
    const availableVerticals = ['Product', 'Brand', 'Sales'];
    const result = syncVerticalOrder(currentOrder, availableVerticals);
    expect(result).toEqual(['Product', 'Brand', 'Sales']);
  });
});
```

---

## 🔧 Integration Testing

### **Test Suite 2: Custom Hooks**

#### **Test 2.1: useStatusGroupOrder Hook**

**Setup:**
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useStatusGroupOrder } from '../hooks/useStatusGroupOrder';
```

**Test Cases:**

```typescript
describe('useStatusGroupOrder', () => {
  test('loads default orders on first render', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useStatusGroupOrder());
    
    expect(result.current.isLoading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.activeOrder).toBeDefined();
    expect(result.current.archiveOrder).toBeDefined();
  });

  test('updates active order successfully', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useStatusGroupOrder());
    await waitForNextUpdate();
    
    const newOrder = ['In Review', 'In Progress', 'Not Started'];
    
    await act(async () => {
      await result.current.updateActiveOrder(newOrder);
    });
    
    expect(result.current.activeOrder).toEqual(newOrder);
  });

  test('resets active order to default', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useStatusGroupOrder());
    await waitForNextUpdate();
    
    // First change the order
    await act(async () => {
      await result.current.updateActiveOrder(['Custom', 'Order']);
    });
    
    // Then reset
    await act(async () => {
      await result.current.resetActiveOrder();
    });
    
    expect(result.current.activeOrder).toEqual(DEFAULT_ACTIVE_STATUS_ORDER);
  });
});
```

#### **Test 2.2: useVerticalGroupOrder Hook**

```typescript
describe('useVerticalGroupOrder', () => {
  test('loads alphabetical order on first render', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useVerticalGroupOrder());
    
    await waitForNextUpdate();
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.verticalOrder.length).toBeGreaterThan(0);
    
    // Check alphabetical order
    const sorted = [...result.current.verticalOrder].sort();
    expect(result.current.verticalOrder).toEqual(sorted);
  });

  test('updates vertical order successfully', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useVerticalGroupOrder());
    await waitForNextUpdate();
    
    const newOrder = ['Sales', 'Product', 'Marketing', 'Brand'];
    
    await act(async () => {
      await result.current.updateVerticalOrder(newOrder);
    });
    
    expect(result.current.verticalOrder).toEqual(newOrder);
  });

  test('resets to alphabetical order', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useVerticalGroupOrder());
    await waitForNextUpdate();
    
    const originalOrder = result.current.verticalOrder;
    
    // Change order
    await act(async () => {
      await result.current.updateVerticalOrder(['Z', 'Y', 'X']);
    });
    
    // Reset
    await act(async () => {
      await result.current.resetVerticalOrder();
    });
    
    const sorted = [...result.current.verticalOrder].sort();
    expect(result.current.verticalOrder).toEqual(sorted);
  });
});
```

---

## 🖥️ Component Testing

### **Test Suite 3: DraggableOrderItem**

```typescript
import { render, screen } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { DraggableOrderItem } from '../components/DraggableOrderItem';

describe('DraggableOrderItem', () => {
  const defaultProps = {
    id: 'test-item',
    name: 'Test Item',
    index: 0,
    onMove: jest.fn()
  };

  const renderWithDnd = (component) => {
    return render(
      <DndProvider backend={HTML5Backend}>
        {component}
      </DndProvider>
    );
  };

  test('renders item name correctly', () => {
    renderWithDnd(<DraggableOrderItem {...defaultProps} />);
    expect(screen.getByText('Test Item')).toBeInTheDocument();
  });

  test('displays correct index number', () => {
    renderWithDnd(<DraggableOrderItem {...defaultProps} index={5} />);
    expect(screen.getByText('6')).toBeInTheDocument(); // index + 1
  });

  test('shows color indicator when color is provided', () => {
    renderWithDnd(<DraggableOrderItem {...defaultProps} color="#ff0000" />);
    const colorIndicator = screen.getByRole('presentation');
    expect(colorIndicator).toHaveStyle({ backgroundColor: '#ff0000' });
  });

  test('calls onMove when dragged', async () => {
    const onMove = jest.fn();
    renderWithDnd(<DraggableOrderItem {...defaultProps} onMove={onMove} />);
    
    // Simulate drag & drop
    // (Implementation depends on your testing setup for react-dnd)
  });
});
```

---

## 🎨 UI/UX Testing

### **Test Suite 4: Settings Page Integration**

#### **Manual Test 4.1: Status Group Order Manager**

**Steps:**
1. Navigate to Settings Page
2. Scroll to "Status Group Order" section
3. Verify two subsections appear:
   - ✅ "Active Projects Order"
   - ✅ "Archive Projects Order"

**Active Projects Order:**
4. Verify default order matches:
   - In Progress (1)
   - In Review (2)
   - Lightroom (3)
   - Not Started (4)
   - Babysit (5)
   - On Hold (6)

5. Drag "Lightroom" to position 1
   - ✅ Visual feedback during drag
   - ✅ Smooth animation
   - ✅ Numbers update correctly

6. Click "Reset to Default"
   - ✅ Confirmation dialog appears
   - ✅ Click "Reset" → order restored
   - ✅ Toast notification appears

**Archive Projects Order:**
7. Verify default order:
   - Done (1)
   - Canceled (2)

8. Drag "Canceled" to position 1
   - ✅ Order changes to: Canceled, Done

9. Reset to default
   - ✅ Order restored to: Done, Canceled

---

#### **Manual Test 4.2: Vertical Group Order Manager**

**Steps:**
1. In Settings Page, find "Vertical Group Order" section
2. Verify verticals are listed alphabetically:
   - Brand
   - Creative
   - Marketing
   - Product

3. Drag "Product" to position 1
   - ✅ Visual feedback
   - ✅ Smooth animation
   - ✅ Numbers update

4. Click "Reset to Alphabetical"
   - ✅ Confirmation dialog
   - ✅ Order restored to alphabetical
   - ✅ Toast notification

---

### **Test Suite 5: Table View Integration**

#### **Manual Test 5.1: Status Grouping with Custom Order**

**Preparation:**
1. Go to Settings → Status Group Order
2. Set active order to: "In Review", "In Progress", "Not Started"
3. Go to Dashboard → Table View
4. Set groupBy to "Status"
5. Ensure on "Table" tab (not Archive)

**Verification:**
- ✅ Groups appear in order: In Review → In Progress → Not Started
- ✅ Other statuses appear after (alphabetically)
- ✅ Each group shows correct projects
- ✅ Expand/collapse works for each group

**Test Switching Tabs:**
6. Switch to "Archive" tab
   - ✅ Groups appear in archive order (Done, Canceled)
   - ✅ Only archived projects shown

7. Switch back to "Table" tab
   - ✅ Active order restored

---

#### **Manual Test 5.2: Vertical Grouping with Custom Order**

**Preparation:**
1. Go to Settings → Vertical Group Order
2. Set order to: "Sales", "Product", "Marketing", "Brand"
3. Go to Dashboard → Table View
4. Set groupBy to "Vertical"

**Verification:**
- ✅ Groups appear in custom order
- ✅ New vertical (not in custom order) appears at end
- ✅ Each group shows correct projects

---

## 🔄 Edge Case Testing

### **Test Suite 6: Edge Cases**

#### **Test 6.1: Add New Status**

**Steps:**
1. Go to Settings → Status Manager
2. Add new status: "Waiting for Client"
3. Go to Settings → Status Group Order
4. Verify:
   - ✅ New status appears at END of Active Projects Order
   - ✅ Can be dragged to reorder
   - ✅ Order persists after page refresh

---

#### **Test 6.2: Delete Status**

**Steps:**
1. Go to Settings → Status Manager
2. Try to delete a status that's used in projects
   - ✅ Cannot delete (StatusManager prevents this)

3. Create a test status "TestStatus" (not used in any project)
4. Add it to custom order (drag it to position 2)
5. Delete "TestStatus" from Status Manager
6. Go to Settings → Status Group Order
   - ✅ "TestStatus" removed from order
   - ✅ Other items maintain their order
   - ✅ No visual glitches

---

#### **Test 6.3: Add New Vertical**

**Steps:**
1. Go to Settings → Type & Vertical Management
2. Add new vertical: "Analytics"
3. Go to Settings → Vertical Group Order
4. Verify:
   - ✅ "Analytics" appears in alphabetical position
   - ✅ Can be dragged to reorder
   - ✅ Order persists after refresh

---

#### **Test 6.4: Empty State Handling**

**Steps:**
1. Delete all statuses (except required ones)
2. Go to Settings → Status Group Order
   - ✅ Shows "No statuses found" message
   - ✅ No errors in console

3. Add back some statuses
   - ✅ List populates correctly

---

#### **Test 6.5: Concurrent Edits (Multiple Tabs)**

**Steps:**
1. Open Settings Page in Tab 1
2. Open Settings Page in Tab 2
3. In Tab 1: Reorder statuses → Save
4. In Tab 2: Reorder statuses differently → Save
5. Refresh both tabs
   - ✅ Both show the last saved order (last write wins)
   - ✅ No corruption or errors

---

## 📱 Responsive Testing

### **Test Suite 7: Mobile & Tablet**

#### **Test 7.1: Mobile (< 768px)**

**Device**: iPhone 12 Pro / Chrome DevTools mobile emulation

**Settings Page:**
- ✅ Sections stack vertically
- ✅ Drag handles are larger (touchable)
- ✅ Order numbers hidden on mobile (optional)
- ✅ Touch drag & drop works smoothly
- ✅ Buttons are tappable (min 44px)

**Table View:**
- ✅ Groups appear in custom order
- ✅ Mobile card view respects group order

---

#### **Test 7.2: Tablet (768px - 1024px)**

**Device**: iPad / Chrome DevTools tablet emulation

- ✅ Settings layout adapts appropriately
- ✅ Drag & drop works with touch
- ✅ Table view shows custom group order

---

## 🌐 Cross-Browser Testing

### **Test Suite 8: Browser Compatibility**

#### **Browsers to Test:**

**Chrome (latest)**
- ✅ Drag & drop works
- ✅ Animations smooth
- ✅ No console errors

**Firefox (latest)**
- ✅ Drag & drop works
- ✅ Animations smooth
- ✅ No console errors

**Safari (latest)**
- ✅ Drag & drop works
- ✅ Animations smooth
- ✅ No console errors

**Edge (latest)**
- ✅ Drag & drop works
- ✅ Animations smooth
- ✅ No console errors

---

## ⚡ Performance Testing

### **Test Suite 9: Performance**

#### **Test 9.1: Large Dataset**

**Preparation:**
- Create 20+ statuses
- Create 10+ verticals
- Create 100+ projects

**Metrics:**
- ✅ Settings page loads in < 2 seconds
- ✅ Drag & drop remains smooth (60fps)
- ✅ Table grouping completes in < 1 second
- ✅ No memory leaks after 10 minutes of use

---

#### **Test 9.2: Database Operations**

**Metrics:**
- ✅ Save operation completes in < 500ms
- ✅ Load operation completes in < 500ms
- ✅ No database errors in console

---

## ♿ Accessibility Testing

### **Test Suite 10: Accessibility**

#### **Test 10.1: Keyboard Navigation**

**Steps:**
1. Navigate to Settings → Status Group Order
2. Tab through draggable items
   - ✅ Focus indicator visible
   - ✅ Can grab item with Space key
   - ✅ Can move with Arrow keys
   - ✅ Can drop with Space key

---

#### **Test 10.2: Screen Reader**

**Tool**: NVDA / JAWS / VoiceOver

**Steps:**
1. Navigate to Status Group Order Manager
   - ✅ Section headings announced
   - ✅ Item names announced
   - ✅ Position announced ("1 of 6")
   - ✅ Drag state announced ("grabbed", "dropped")

---

## 📊 Regression Testing

### **Test Suite 11: Ensure No Breaking Changes**

#### **Test 11.1: Existing Features Still Work**

- ✅ Table Column Order Manager (existing feature)
- ✅ Status Manager (can create/edit/delete)
- ✅ Vertical Manager (can create/edit/delete)
- ✅ Project creation/editing
- ✅ Table view filters and sorting
- ✅ Timeline view (not affected)
- ✅ Mobile view (not affected)

---

## ✅ Testing Checklist Summary

### **Unit Tests**
- [ ] groupOrderUtils.ts - all functions tested
- [ ] Validation functions tested
- [ ] Sync functions tested

### **Integration Tests**
- [ ] useStatusGroupOrder hook tested
- [ ] useVerticalGroupOrder hook tested

### **Component Tests**
- [ ] DraggableOrderItem component tested
- [ ] StatusGroupOrderManager component tested
- [ ] VerticalGroupOrderManager component tested

### **UI/UX Tests**
- [ ] Settings page integration verified
- [ ] Table view integration verified
- [ ] Drag & drop interaction smooth

### **Edge Cases**
- [ ] Add new status/vertical handled
- [ ] Delete status/vertical handled
- [ ] Empty states handled
- [ ] Concurrent edits handled

### **Responsive**
- [ ] Mobile testing complete
- [ ] Tablet testing complete

### **Cross-Browser**
- [ ] Chrome tested
- [ ] Firefox tested
- [ ] Safari tested
- [ ] Edge tested

### **Performance**
- [ ] Large dataset performance acceptable
- [ ] Database operations fast

### **Accessibility**
- [ ] Keyboard navigation works
- [ ] Screen reader compatible

### **Regression**
- [ ] No breaking changes to existing features

---

## 🐛 Bug Report Template

If issues are found during testing:

```markdown
**Bug Title**: [Short description]

**Severity**: Critical / High / Medium / Low

**Steps to Reproduce**:
1. Step 1
2. Step 2
3. Step 3

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots/Videos**:
[Attach if available]

**Environment**:
- Browser: [e.g., Chrome 120]
- OS: [e.g., macOS 14]
- Device: [e.g., Desktop, iPhone 12]

**Console Errors**:
[Paste any console errors]
```

---

**Next Document**: [README.md](./README.md)
