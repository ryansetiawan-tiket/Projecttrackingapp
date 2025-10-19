# Draggable Table Columns - Planning Documentation

## 📋 Quick Links

- [Overview](./00-overview.md) - Feature goals, problem statement, success criteria
- [UI Specifications](./01-ui-specifications.md) - Visual design, interaction flows, animations
- [Data Structures](./02-data-structures.md) - Types, database schema, state management
- [Implementation Plan](./03-implementation-plan.md) - Step-by-step implementation guide
- [Testing Guide](./04-testing-guide.md) - Comprehensive test cases and quality checklist
- **[Implementation Complete](./05-implementation-complete.md) - ✅ Feature fully deployed**
- **[Column Cleanup Summary](./COLUMN_CLEANUP_SUMMARY.md) - 3 columns removed**
- [Quick Start](./QUICK_START.md) - Quick reference for developers

---

## 🎯 Feature Summary

**What:** Allow users to drag & drop table column headers to reorder them in Table View

**Why:** Different users have different workflows and want to prioritize different information

**How:** Using react-dnd for drag & drop, Supabase for persistence, custom hook for state management

**Version:** v2.4.0

---

## 🚀 Quick Start for Developers

### 1. Read the Planning Docs
- Start with `00-overview.md` for context
- Review `01-ui-specifications.md` for UX requirements
- Study `02-data-structures.md` for technical design
- Follow `03-implementation-plan.md` for step-by-step guidance

### 2. Key Files to Create/Modify

**New Files:**
- `/utils/columnOrderUtils.ts` - Helper functions
- `/hooks/useColumnOrder.ts` - State management hook
- `/components/project-table/DraggableTableHeader.tsx` - Draggable component

**Modified Files:**
- `/types/project.ts` - Add column types
- `/components/ProjectTable.tsx` - Integrate drag & drop
- `/supabase/functions/server/index.tsx` - Add API routes

### 3. Implementation Order
1. **Phase 1: Foundation** (Types, utilities, backend, hook)
2. **Phase 2: Drag & Drop UI** (DnD setup, draggable component)
3. **Phase 3: Integration** (Connect to ProjectTable, reset button)
4. **Phase 4: Testing** (Manual testing, documentation)

### 4. Timeline
- **Day 1:** Foundation & Data Layer
- **Day 2:** Drag & Drop UI
- **Day 3:** Polish & Testing

---

## 🎨 Visual Preview

```
BEFORE DRAG (7 columns):
┌─────────────┬────────┬──────────────┬────────┬────────┬──────────────┬───────┐
│ Project Name│ Status │ Deliverables │ Start  │ End    │ Collaborator │ Links │
└─────────────┴────────┴──────────────┴────────┴────────┴──────────────┴───────┘

DURING DRAG (moving Deliverables):
┌─────────────┬────────┬ ░░░░░░░░░░░░ ┬────────┬────────┬──────────────┬───────┐
│ Project Name│[Status]│ Deliverables │ Start  │ End    │ Collaborator │ Links │
│             │   ┃    │  (dragging)  │        │        │              │       │
└─────────────┴────────┴──────────────┴────────┴────────┴──────────────┴───────┘
                   ↑
            Drop indicator

AFTER DROP:
┌─────────────┬──────────────┬────────┬────────┬────────┬──────────────┬───────┐
│ Project Name│ Deliverables │ Status │ Start  │ End    │ Collaborator │ Links │
└─────────────┴──────────────┴────────┴────────┴────────┴──────────────┴───────┘

Note: Vertical, Type, and Assets columns removed (see COLUMN_CLEANUP_SUMMARY.md)
```

---

## 📊 Technical Architecture

### Data Flow
```
User Interaction
      ↓
DraggableTableHeader (UI)
      ↓
useColumnOrder (Hook)
      ↓
columnOrderUtils (Logic)
      ↓
Backend API (Persistence)
      ↓
Supabase KV Store (Database)
```

### State Management
```typescript
useColumnOrder() {
  columns: TableColumn[]          // Current order
  reorderColumn(from, to)         // Reorder function
  resetToDefault()                // Reset function
  hasCustomOrder: boolean         // Is customized?
  isLoading: boolean              // Loading state
}
```

### Database Storage
```
Key: "table_column_order:{userId}"
Value: {
  columnOrder: ["projectName", "deliverables", "status", ...],
  lastUpdated: "2025-10-19T10:30:00Z"
}
```

---

## ✅ Success Criteria

- [x] User can drag & drop column headers
- [x] Column order persists across sessions
- [x] Each user has independent preferences
- [x] Project Name column stays locked at position 0
- [x] Reset button available when order is customized
- [x] Smooth animations (60fps)
- [x] Keyboard accessible
- [x] Screen reader compatible
- [x] Dark mode support
- [x] No breaking changes to existing features

---

## 🔍 Key Design Decisions

### Why react-dnd?
- Already available in environment
- Robust drag & drop handling
- Good accessibility support
- Active maintenance

### Why lock Project Name column?
- Provides consistent anchor point
- Users always know where project names are
- Prevents confusion

### Why per-user preferences?
- Different roles have different priorities
- More flexible than team-wide settings
- Easier to implement initially

### Why debounced saves?
- Prevents excessive database writes
- Better performance during rapid reordering
- Still feels instant to user (optimistic updates)

---

## 🚧 Known Limitations

1. **Desktop Only** - Mobile uses card layout (no columns)
2. **No Column Resizing** - Can reorder but not resize (future feature)
3. **No Saved Presets** - Can't save multiple layouts (future feature)
4. **No Column Hiding** - All columns always visible (future feature)
5. **No Team Defaults** - Admin can't set default for team (future feature)

---

## 🔮 Future Enhancements

### v2.5.0+
- Column visibility toggle (show/hide columns)
- Column width adjustment (resize columns)
- Saved layout presets (multiple configurations)
- Team-wide default layouts (admin sets for team)
- Column grouping (group related columns)
- Export/import column layouts

---

## 📚 Related Features

### Depends On
- Existing ProjectTable component
- Authentication system (userId for preferences)
- Supabase KV store

### Affects
- ProjectTable rendering
- Table sorting (must work with custom order)
- Table filtering (must work with custom order)
- Mobile view (disabled on mobile)

### Related Planning Docs
- `/planning/stats/` - Stats page (similar per-user preferences)
- `/planning/project-row-shared-component.md` - Table row rendering

---

## 🐛 Troubleshooting

### Column order doesn't persist
- Check browser console for API errors
- Verify user is authenticated
- Check database for saved order
- Verify API routes are accessible

### Dragging feels laggy
- Check browser performance
- Verify no console errors
- Test on different browser
- Check CSS animations (should use transform, not position)

### Columns revert to default
- Check if database save succeeds
- Verify no conflicting localStorage code
- Check for race conditions in hook

### Reset button doesn't appear
- Verify hasCustomOrder logic
- Check if column order actually changed
- Inspect isDefaultOrder() function

---

## 📝 Documentation Status

| Document | Status | Last Updated |
|----------|--------|--------------|
| Overview | ✅ Complete | 2025-10-19 |
| UI Specifications | ✅ Complete | 2025-10-19 |
| Data Structures | ✅ Complete | 2025-10-19 |
| Implementation Plan | ✅ Complete | 2025-10-19 |
| Testing Guide | ✅ Complete | 2025-10-19 |
| Implementation Complete | ✅ Complete | 2025-10-19 |
| Column Cleanup Summary | ✅ Complete | 2025-10-19 |
| Quick Start | ✅ Complete | 2025-10-19 |
| User Guide | ⏳ Pending | - |

---

## 👥 Stakeholders

- **Users** - End users who want custom column order
- **Admin** - May want to set team defaults (future)
- **Developers** - Implementing and maintaining feature
- **QA** - Testing across browsers and scenarios

---

## 🎓 Learning Resources

### React DnD
- [Official Docs](https://react-dnd.github.io/react-dnd/)
- [Examples](https://react-dnd.github.io/react-dnd/examples)

### Accessibility
- [ARIA Drag and Drop](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [Keyboard Navigation](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/)

### Performance
- [React Performance](https://react.dev/learn/render-and-commit)
- [CSS Animations](https://web.dev/animations/)

---

## 📞 Questions?

If you have questions about this feature:

1. Check the planning docs (this folder)
2. Review implementation plan for detailed steps
3. Check testing guide for expected behavior
4. Refer to related code in ProjectTable.tsx

---

**Version:** 1.1  
**Status:** ✅ **IMPLEMENTED & DEPLOYED**  
**Feature Status:** Production Ready  
**Columns:** 7 total (6 draggable + 1 locked)  
**Last Updated:** 2025-10-19  
**Release:** v2.4.0
