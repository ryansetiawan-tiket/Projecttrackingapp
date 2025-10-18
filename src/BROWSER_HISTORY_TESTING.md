# Browser History Navigation - Testing Guide

**Date**: 2025-01-12  
**Feature**: Browser Back/Forward Navigation  
**Status**: Ready for Testing ✅

---

## 🧪 Quick Test Scenarios

### Desktop Browser (Chrome/Firefox/Safari)

#### Test 1: Basic Navigation
1. Open app at `/`
2. Click "+" to create project
3. **Press browser BACK button**
   - ✅ Should return to dashboard
   - ✅ URL should change to `/`

#### Test 2: Multiple Back/Forward
1. Navigate: Dashboard → Create → Dashboard → Settings
2. **Press BACK 3 times**
   - ✅ Should go: Settings → Dashboard → Create → Dashboard
3. **Press FORWARD 3 times**
   - ✅ Should go: Dashboard → Create → Dashboard → Settings

#### Test 3: Edit Project
1. Click edit on any project
2. URL should show: `?page=edit&id=xxx`
3. **Press BACK**
   - ✅ Should return to dashboard
   - ✅ Project editor closes

#### Test 4: Dashboard View Switching
1. Switch from Table → Timeline → Archive
2. **Press BACK** (should do nothing - view switches use replaceState)
   - ✅ Should stay on Archive view
   - ✅ Back should go to previous PAGE, not VIEW

#### Test 5: Refresh Preservation
1. Navigate to Settings page
2. URL: `?page=settings`
3. **Press F5 to refresh**
   - ✅ Should stay on Settings page
   - ✅ No redirect to dashboard

#### Test 6: Deep Linking
1. Copy this URL: `?page=edit&id=xxx` (use real project ID)
2. **Open in new tab**
   - ✅ Should open directly to edit page
   - ✅ Should load project correctly

#### Test 7: Unsaved Changes
1. Start creating a project
2. Type something in project name
3. **Press BACK button**
   - ✅ Should show "Unsaved Changes" dialog
   - ✅ Should NOT navigate away
   - ✅ Should offer: Continue Editing / Discard / Save as Draft

---

### Mobile Browser (iOS Safari / Chrome Android)

#### Test 8: Swipe Back Gesture (iOS)
1. Open app on iOS Safari
2. Navigate: Dashboard → Edit Project
3. **Swipe from left edge →**
   - ✅ Should go back to dashboard
   - ✅ Should show native iOS back animation

#### Test 9: Android Back Button
1. Open app on Android Chrome
2. Navigate: Dashboard → Create Project
3. **Press hardware BACK button**
   - ✅ Should go back to dashboard
   - ✅ Should close create drawer

#### Test 10: Drawer Swipe Close
1. On mobile, click "+" to create project
2. Drawer opens from bottom
3. **Swipe drawer down to close**
   - ✅ Should trigger back navigation
   - ✅ URL should update to `/`

#### Test 11: Mobile Unsaved Changes
1. Start creating project on mobile
2. Type something
3. **Swipe drawer down OR press back button**
   - ✅ Should show "Unsaved Changes" dialog
   - ✅ Drawer should NOT close
   - ✅ Should re-push history state

---

### Public Shares (Backward Compatibility)

#### Test 12: Public Lightroom Share
1. Open URL: `?lightroom=xxx` (use real project ID)
2. **Should open Lightroom gallery**
   - ✅ Should be public view (no edit buttons)
   - ✅ Should work exactly as before
   - ✅ Back button behavior (if not logged in, may exit app)

#### Test 13: Public GDrive Share
1. Open URL: `?gdrive=xxx` (use real project ID)
2. **Should open GDrive gallery**
   - ✅ Should be public view
   - ✅ Should work exactly as before

---

### Edge Cases

#### Test 14: Project Not Found
1. Open URL: `?page=edit&id=nonexistent-id`
2. **Should fallback gracefully**
   - ✅ Should redirect to dashboard
   - ✅ Should show "Project not found" (or just go to dashboard)

#### Test 15: Rapid Back/Forward Clicks
1. Navigate through several pages
2. **Click BACK button rapidly 5+ times**
   - ✅ Should handle gracefully
   - ✅ Should not break app state
   - ✅ Should not skip pages

#### Test 16: Invalid URL Params
1. Open URL: `?page=invalid`
2. **Should default to dashboard**
   - ✅ Should show dashboard
   - ✅ Should not crash

---

## 🎯 Expected URL Patterns

### Reference Table

| User Action | URL | Page Type |
|-------------|-----|-----------|
| Open app | `/` or `?view=table` | Dashboard Table |
| Switch to Timeline | `?view=timeline` | Dashboard Timeline |
| Switch to Archive | `?view=archive` | Dashboard Archive |
| Click Create | `?page=create` | Create Project |
| Create with preset | `?page=create&vertical=BrandDesign` | Create (pre-filled) |
| Edit project | `?page=edit&id=abc123` | Edit Project |
| Open Settings | `?page=settings` | Settings |
| Open Lightroom | `?page=lightroom&id=abc123` | Lightroom (auth) |
| Public Lightroom | `?lightroom=abc123` | Lightroom (public) |
| Public GDrive | `?gdrive=abc123` | GDrive (public) |
| Login page | `?page=auth` | Auth/Login |

---

## 🐛 Known Issues / Limitations

### None Found Yet! 🎉

If you encounter any issues during testing, please note:
1. What you were doing
2. What you expected
3. What actually happened
4. Browser and device info

---

## ✅ Success Criteria

For each test, the feature passes if:

✅ Browser back button works correctly  
✅ Browser forward button works correctly  
✅ URL updates appropriately  
✅ State syncs correctly  
✅ Mobile gestures work  
✅ No console errors  
✅ No visual glitches  
✅ No state corruption  

---

## 📱 Test Devices Recommended

### Desktop
- Chrome (latest)
- Firefox (latest)
- Safari (macOS)
- Edge (latest)

### Mobile
- iOS Safari (iOS 14+)
- Chrome Android (latest)
- Samsung Internet (latest)

---

## 🎊 Happy Testing!

The feature should work seamlessly across all scenarios. Browser navigation should feel natural and native, as if the app was a multi-page website (even though it's actually a SPA).

**Expected Result**: Perfect native browser behavior on all platforms! 🚀
