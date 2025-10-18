# Changelog

## 📝 History Perubahan Aplikasi

Semua perubahan notable di aplikasi ini didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan project ini menggunakan [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Export projects to CSV/JSON
- Bulk operations untuk projects
- Advanced filtering & search
- Custom dashboard widgets
- Email notifications
- Calendar sync integration

---

## [2.0.0] - 2025-01-18

### 🎉 Major Release - Comprehensive Feature Update

### Added
- ✨ **Search functionality** untuk assignee dropdown menggunakan Command component
- ✨ **"Save as Draft" tetap di page** - tidak close dialog setelah save
- ✨ **Hover-triggered plus buttons** di kolom Collaborators, Links, dan Deliverables
- ✨ **Absolute positioning** untuk plus buttons agar tidak mempengaruhi alignment
- ✨ **Duration format improvement** - dari "x days" ke "x months x days"
- ✨ **Dynamic Collaborator Layout System** dengan intelligent layout rules
- ✨ **Editable role names** dengan backend PUT endpoint
- ✨ **Quarter Distribution Chart** dengan multi-year support & unique colors per year
- ✨ **Add Project Link Dialog** dengan 11 preset icons populer
- ✨ **GDrive Preview Asset Names** di gallery view
- ✨ **Notes tab** untuk project documentation
- ✨ **Drag & drop reordering** untuk actions dalam preset

### Changed
- 🔄 **Stats menu position** - menukar posisi Settings dengan Stats di dropdown profile
- 🔄 **Stats charts colors** - menggunakan warna dari settings page (Type & Status colors)
- 🔄 **Plus button behavior** - hidden by default, muncul on hover
- 🔄 **Collaborator display** - dynamic layout berdasarkan jumlah member

### Fixed
- 🐛 **Plus button alignment issue** - menggunakan absolute positioning untuk stabilitas
- 🐛 **URL overflow** di Add Project Link Dialog - proper word-break handling
- 🐛 **Quarter chart colors** - berbeda warna untuk setiap quarter & tahun
- 🐛 **Icon button alignment** - tidak terpengaruh saat plus button muncul/hilang

---

## [1.9.0] - 2025-01-15

### 🚀 Stats Dashboard Implementation

### Added
- ✨ **Stats Dashboard** dengan 2 tabs (Overview & Projects)
- ✨ **Overview Tab** dengan stats cards & 4 charts:
  - Total Projects, Active Projects, Completed Projects
  - Average Duration, Completion Rate, On-time Delivery
  - Projects by Type (Pie Chart)
  - Projects by Status (Bar Chart)
  - Quarter Distribution (Bar Chart)
  - Timeline Chart (Line Chart)
- ✨ **Projects Tab** dengan detailed per-project statistics
- ✨ **StatsCard component** untuk reusable stat display
- ✨ **Chart color integration** dengan settings page colors

### Changed
- 🔄 All charts menggunakan Recharts library
- 🔄 Stats calculations moved to `statsCalculations.ts` utility

---

## [1.8.0] - 2025-01-10

### 🎨 Dynamic Collaborator Layout & Role Management

### Added
- ✨ **Dynamic Collaborator Layout** di CollaboratorAvatars.tsx:
  - 1-2 members: Single row
  - 3-4 members: 2x2 grid
  - 5-6 members: 2x3 grid
  - 7-8 members: 2x4 grid
  - 9+ members: First 8 + count badge
- ✨ **Editable Role Names** dengan inline editing
- ✨ **Backend PUT endpoint** untuk rename role
- ✨ **Real-time role sync** across application

### Fixed
- 🐛 Role name changes tidak ter-update di collaborator display
- 🐛 Avatar layout tidak optimal untuk 5-8 members

---

## [1.7.0] - 2025-01-05

### 📁 GDrive Nested Folders & File Upload

### Added
- ✨ **Nested folders support** untuk GDrive assets
- ✨ **Breadcrumb navigation** untuk folder hierarchy
- ✨ **Smart folder click priority**:
  - Click name/icon: Navigate into folder
  - Click anywhere else: Expand/collapse
- ✨ **Drag & drop multiple files** dengan flow:
  - Drop files/folders
  - Edit folder structure
  - Assign to asset (optional)
  - Batch upload
- ✨ **GDrive Preview Gallery** dengan asset names
- ✨ **Folder Structure Editor** component
- ✨ **File Cards Editor** component

### Changed
- 🔄 GDrive asset structure: flat → nested dengan `parent_id` & `folder_path`
- 🔄 Add GDrive Asset flow: single file → multiple files with folders

### Fixed
- 🐛 **Backward compatibility** untuk existing flat assets
- 🐛 **Breadcrumb navigation** incorrect path
- 🐛 **Folder icons** showing when shouldn't

---

## [1.6.0] - 2024-12-20

### 🔗 Project Links System & Preset Icons

### Added
- ✨ **Add Project Link Dialog** dengan advanced features:
  - Project selector dropdown
  - Existing links preview
  - Link label picker dengan 2 tabs (Presets & Saved Labels)
  - URL validation
  - Enter key support
- ✨ **11 Preset Icons** untuk popular tools:
  - Figma, Google Sheets, Notion, Trello, Slack
  - GitHub, Linear, Asana, Miro, Airtable, ClickUp
- ✨ **Custom link labels** dengan emoji/SVG support
- ✨ **Quick access buttons** di project table

### Changed
- 🔄 Links structure: unlabeled → labeled dengan icons
- 🔄 LinksCell component: text links → icon buttons

---

## [1.5.0] - 2024-12-15

### ⚙️ Settings Migration to Database

### Major Migration
- 🗄️ **localStorage → Supabase Database** migration
- 🗄️ Migrated settings:
  - Admin Profile (editorName → fullName)
  - Team Management
  - Status Management
  - Type & Vertical Management
  - Workflow Settings
  - Action Presets
  - Link Labels

### Added
- ✨ **Settings table** di database
- ✨ **Migration script** dengan rollback support
- ✨ **Backward compatibility** handlers
- ✨ **Auto-migration** on first login after update

### Changed
- 🔄 **"Editor" terminology → "Admin"**
- 🔄 All settings now persisted in database
- 🔄 Settings sync across devices

### Removed
- ❌ localStorage dependency untuk settings
- ❌ "Editor" terminology (replaced with "Admin")

---

## [1.4.0] - 2024-12-10

### 🔄 Workflow & Action System

### Added
- ✨ **Workflow Manager** dengan stage-based workflows
- ✨ **Action Preset System** dengan reusable templates
- ✨ **Drag & drop reordering** untuk actions
- ✨ **Auto-trigger actions** saat status berubah
- ✨ **Auto-check actions above** feature
- ✨ **ActionableItemManager** component
- ✨ **AssetActionManager** component

### Changed
- 🔄 Action status: hardcoded → dynamic system
- 🔄 Actions linked to workflow stages

### Fixed
- 🐛 **Auto-trigger** tidak bekerja di mobile
- 🐛 **Action order** tidak persist setelah reorder
- 🐛 Desktop vs mobile action trigger inconsistency

---

## [1.3.0] - 2024-12-01

### 🎨 Dynamic Status System

### Added
- ✨ **Dynamic Status Management** (tidak lagi hardcoded)
- ✨ **StatusManager** component untuk CRUD operations
- ✨ **Custom status colors** dengan HSL color picker
- ✨ **Drag & drop reorder** untuk status order
- ✨ **Auto-migration** dari hardcoded status ke dynamic

### Changed
- 🔄 Status: hardcoded array → database table
- 🔄 Status colors: fixed → customizable

### Database Changes
- 📊 Created `statuses` table
- 📊 Added RLS policies untuk statuses

---

## [1.2.0] - 2024-11-20

### 👥 Team Management System

### Added
- ✨ **Team Management** page di Settings
- ✨ **CRUD operations** untuk team members
- ✨ **Role assignment** system
- ✨ **Custom colors** per team member
- ✨ **Collaborator avatars** dengan initials
- ✨ **Team member search & filter**

### Database Changes
- 📊 Created `teams` table
- 📊 Added RLS policies untuk teams

---

## [1.1.0] - 2024-11-10

### 📱 Mobile Optimization

### Added
- ✨ **Mobile Timeline** dengan week view
- ✨ **Week Strip** navigation
- ✨ **Event Bars** color-coded
- ✨ **Event Detail Sheet** bottom drawer
- ✨ **Mobile Project List** card-based
- ✨ **Mobile Filters** bottom sheet
- ✨ **Touch-friendly** interactions (min 44px targets)

### Changed
- 🔄 Responsive breakpoints optimized
- 🔄 Mobile-first component approach

---

## [1.0.0] - 2024-11-01

### 🎉 Initial Release

### Core Features
- ✨ **4 Dashboard Views**: Table, Timeline, Deliverables, Archive
- ✨ **Project Management** dengan full CRUD
- ✨ **Asset Management**:
  - Google Drive assets
  - Lightroom assets
- ✨ **Authentication** dengan Supabase Auth
- ✨ **Real-time Sync** dengan Supabase Realtime
- ✨ **Type & Vertical** management
- ✨ **Status tracking**
- ✨ **Urgency levels**
- ✨ **Collaborators** assignment
- ✨ **External links** management

### Database
- 📊 Created `projects` table
- 📊 Set up Row Level Security (RLS)
- 📊 Real-time subscriptions enabled

### UI/UX
- 🎨 Dark mode support
- 🎨 Tailwind CSS styling
- 🎨 Shadcn/ui components
- 🎨 Responsive design

---

## Version History Summary

| Version | Date | Type | Description |
|---------|------|------|-------------|
| 2.0.0 | 2025-01-18 | Major | Comprehensive feature updates & UX improvements |
| 1.9.0 | 2025-01-15 | Minor | Stats Dashboard implementation |
| 1.8.0 | 2025-01-10 | Minor | Dynamic collaborator layout & role management |
| 1.7.0 | 2025-01-05 | Minor | GDrive nested folders & file upload |
| 1.6.0 | 2024-12-20 | Minor | Project links system & preset icons |
| 1.5.0 | 2024-12-15 | Minor | Settings migration to database |
| 1.4.0 | 2024-12-10 | Minor | Workflow & action system |
| 1.3.0 | 2024-12-01 | Minor | Dynamic status system |
| 1.2.0 | 2024-11-20 | Minor | Team management system |
| 1.1.0 | 2024-11-10 | Minor | Mobile optimization |
| 1.0.0 | 2024-11-01 | Major | Initial release |

---

## Legend

- ✨ **Added**: New features
- 🔄 **Changed**: Changes in existing functionality
- 🐛 **Fixed**: Bug fixes
- ❌ **Removed**: Removed features
- 🗄️ **Database**: Database changes
- 📊 **Migration**: Data migration
- 🎨 **UI/UX**: User interface/experience improvements
- 🚀 **Performance**: Performance improvements
- 📱 **Mobile**: Mobile-specific changes
- 🔒 **Security**: Security-related changes
- 📝 **Documentation**: Documentation changes

---

## Semantic Versioning

Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Incompatible API changes atau major breaking changes
- **MINOR**: Backward-compatible new features
- **PATCH**: Backward-compatible bug fixes

### Guidelines
- Breaking changes → Increment MAJOR
- New features → Increment MINOR
- Bug fixes → Increment PATCH

---

## Contributing to Changelog

Saat membuat perubahan:

1. Add entry di section `[Unreleased]`
2. Gunakan format:
   ```markdown
   ### Category
   - Type **Feature/Fix name** - description
   ```
3. Categories: Added, Changed, Fixed, Removed, Database, etc.
4. Saat release, move entries dari Unreleased ke version baru

---

**Last Updated**: 2025-01-18
