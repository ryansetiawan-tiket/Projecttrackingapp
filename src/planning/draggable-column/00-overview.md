# Draggable Columns - Overview

## Tujuan
Memberikan fleksibilitas kepada user untuk mengatur urutan kolom di Table View sesuai preferensi mereka, meningkatkan UX dan produktivitas dengan memprioritaskan informasi yang paling relevan.

## Target
**Desktop Table View** - Fitur ini khusus untuk desktop, tidak untuk mobile (mobile sudah menggunakan card layout)

## Problem Statement
Saat ini urutan kolom di table view fixed/hardcoded:
1. **Project Name** (always first, pinned)
2. **Status**
3. **Type**
4. **Vertical**
5. **Deliverables**
6. **Assets Progress**
7. **Start Date**
8. **End Date**
9. **Collaborators**
10. **Links**

Setiap user memiliki workflow berbeda dan mungkin ingin melihat kolom tertentu lebih dulu (misalnya: Collaborators di sebelah Project Name, atau Deliverables lebih ke kiri).

## Solution
Implementasi drag & drop reordering untuk table headers dengan:
- ✅ **Persistent Storage** - Simpan preferensi column order di database
- ✅ **Drag & Drop UI** - Visual feedback saat dragging
- ✅ **Reset to Default** - Tombol untuk kembali ke urutan default
- ✅ **Per-User Settings** - Setiap user bisa punya preferensi sendiri
- ✅ **Project Name Pinned** - Kolom pertama (Project Name) tetap fixed/tidak bisa di-drag

## Success Criteria
1. User bisa drag & drop table headers untuk mengubah urutan
2. Urutan tersimpan di database dan persistent across sessions
3. Visual feedback yang jelas saat dragging
4. Performance tidak terganggu (smooth dragging)
5. Ada opsi reset to default order
6. Project Name column tetap di posisi pertama (locked)

## Tech Stack
- **react-dnd** atau **dnd-kit** untuk drag & drop
- **Supabase** untuk persist column order preferences
- **Context/Hook** untuk manage column order state
- **ProjectTable.tsx** sebagai target implementation

## Version
**v2.4.0** - Draggable Columns for Table View

## Dependencies
- Tidak ada breaking changes pada fitur existing
- Compatible dengan semua fitur table saat ini (sorting, filtering, dll)
