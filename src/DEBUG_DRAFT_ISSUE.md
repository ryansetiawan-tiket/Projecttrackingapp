# DEBUG: Draft Projects Not Showing in Table

## Issue
Draft projects tidak muncul di table setelah klik "Save as Draft"

## Debugging Steps

### Step 1: Check Browser Console
Setelah klik "Save as Draft", cek console untuk logs berikut:

```
[ProjectPage] Saving project data: {...}
[dataUtils] is_draft in input: true
[dataUtils] is_draft in output: true
[App] is_draft value: true
[useProjects] is_draft value: true
[API] Creating project with sanitized data
```

**Verify**: Apakah `is_draft: true` muncul di semua layer?

### Step 2: Check Network Tab
1. Buka Chrome DevTools → Network tab
2. Klik "Save as Draft"
3. Cari request ke `/projects` (POST)
4. Check **Request Payload**:
   ```json
   {
     "is_draft": true,
     "project_name": "...",
     ...
   }
   ```
5. Check **Response**:
   ```json
   {
     "project": {
       "id": "...",
       "is_draft": true,
       ...
     }
   }
   ```

**Verify**: Apakah `is_draft: true` ada di request DAN response?

### Step 3: Check Server Logs (Supabase Dashboard)
1. Go to Supabase Dashboard
2. Navigate to Edge Functions → Logs
3. Look for:
   ```
   [Server] is_draft in request: true
   [Server] is_draft in created project: true
   ```

**Verify**: Apakah server menerima dan menyimpan `is_draft: true`?

### Step 4: Check Projects State
Setelah refresh, cek console:
```
[useProjects] Draft projects in response: X
[Dashboard] Draft projects in all: X
```

**Verify**: Apakah draft count > 0?

### Step 5: Manual Test

1. **Create Draft Project**:
   - Click "Create Project"
   - Fill ONLY project name: "Test Draft"
   - Click "Save as Draft" (bukan "Save Project")
   - Check console logs

2. **Expected Logs**:
   ```
   [ProjectPage] Saving project data: {project_name: "Test Draft", is_draft: true, ...}
   [App] is_draft value: true
   [Server] is_draft in request: true
   [Server] is_draft in created project: true
   [useProjects] Draft projects in response: 1
   ```

3. **Expected Result**:
   - Toast: "Draft saved successfully!"
   - Redirect to Dashboard
   - Project appears in table with "Draft" badge
   - Grouped under "Draft" section (paling atas)

## Common Issues & Solutions

### Issue 1: `is_draft` is `undefined` in logs
**Cause**: Field tidak di-pass dari ProjectPage
**Solution**: Check line 156 di ProjectPage.tsx - pastikan `is_draft: isDraft` ada

### Issue 2: `is_draft: false` instead of `true`
**Cause**: Button handler salah
**Solution**: Pastikan onClick handler adalah `() => handleSubmit(true)` bukan `() => handleSubmit(false)`

### Issue 3: Draft count is 0 in Dashboard
**Cause**: Data tidak ter-refresh atau ter-filter out
**Solution**: Check Dashboard.tsx line 325-326 - pastikan tidak ada filter untuk draft

### Issue 4: "Save as Draft" button tidak muncul
**Cause**: `hasChanges` is false
**Solution**: Ini sudah FIXED - button hanya muncul jika ada changes (by design)

## Quick Fix Checklist

- [ ] Console shows `is_draft: true` in ALL layers
- [ ] Network request shows `is_draft: true` in payload
- [ ] Network response shows `is_draft: true` in project
- [ ] Server logs show `is_draft: true` received and saved
- [ ] After refresh, draft count > 0 in console
- [ ] Draft project appears in table
- [ ] Draft badge is visible
- [ ] Project is in "Draft" group at top

## If Still Not Working

Share console logs from:
1. [ProjectPage] layer
2. [dataUtils] layer  
3. [App] layer
4. [useProjects] layer
5. [Server] layer (from Supabase)

This will help identify exactly where `is_draft` is getting lost.
