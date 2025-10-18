# 🧭 Project: Personal Timeline & Task Tracker App

## Overview
Build a **customizable timeline tracking app** inspired by Google Sheets + Timeline view, designed for **personal and collaborative project management**.

The goal is to create a **responsive, visually clear, and fully editable** workspace that allows users to manage ongoing, upcoming, and completed tasks — categorized flexibly using **collections, domains, types, and tags**, with data stored and synced via **Supabase**.

---

## 🧱 Core Features

### 1. Dashboard & Timeline View
- Interactive **timeline visualization** showing projects and tasks.
- Each item displays:
  - Task name
  - Duration (Start–Due dates)
  - Status (color-coded)
  - Collaborators
  - Type or domain indicators (e.g. `LOYALTY`, `PopUp`)
- Timeline supports:
  - Horizontal scroll and zoom (week / month / quarter)
  - Date range switching
- Fully **responsive and mobile-friendly**
- Toggle between:
  - **Timeline View**
  - **Table View**

---

### 2. Task Table View
- Spreadsheet-like display with sortable columns:
  - Project name  
  - Domain  
  - Type  
  - Collection (e.g. Q3 2025)  
  - Collaborators  
  - Start date / Due date  
  - Status  
  - Notes  
  - Tags  
- Inline editing or side panel editing supported.
- Sort, filter, and search available for all columns.

---

### 3. Task Detail Panel
- Editable form with fields:
  - **Project Title**
  - **Collection** (Q3 2025)
  - **Domain** (CSF, ORDER, LOYALTY, etc.)
  - **Type** (PopUp, Banner, etc.)
  - **Collaborators** (multi-select)
  - **Links** (Figma, Docs, URLs)
  - **Start & Due Dates**
  - **Status**
  - **Tags**
  - **Notes**
- Upload attachments (images, docs).
- Quick actions: Duplicate / Archive / Mark Done.

---

## 🧩 Categorization Model

No rigid grouping.  
Use a **multi-dimensional categorization model** instead:

| Field | Description | Example |
|--------|--------------|---------|
| `collection` | Time period or quarter grouping | Q3 2025 |
| `domain` | High-level function area | LOYALTY, CSF, ORDER |
| `type` | Task or content format | PopUp, Banner, DLP |
| `tags[]` | Flexible multi-labels | ["Campaign", "Design", "Urgent"] |

Example JSON:
```json
{
  "project": "Promo Paduka Campaign (Sultan)",
  "collection": "Q3 2025",
  "domain": "LOYALTY",
  "type": "DLP",
  "tags": ["Campaign", "PopUp", "Design Required"],
  "status": "In Progress",
  "collaborators": ["Jonathan Timothy Christian", "Putu Mahendra Wijaya", "Alvin Niza Aulia"],
  "startDate": "2025-09-22",
  "dueDate": "2025-10-02",
  "links": {
    "figma": "https://figma.com/...",
    "notes": "https://docs.google.com/..."
  }
}
⚙️ Functional Features
Filtering & Search
Filter by domain, collection, type, status, tags, or collaborator.

Keyword search for project names and notes.

Editing & Management
Add, edit, duplicate, delete projects.

Inline edit in table.

Drag to reschedule tasks on timeline.

Export & Import
Export to CSV / JSON.

Import from spreadsheet (CSV upload).

Real-time sync with Supabase.

🔗 Supabase Integration
Purpose
Use Supabase as the backend for:

Data storage

Real-time updates (changes auto-sync to all clients)

Authentication (optional)

File storage (attachments)

1. Database Schema
projects
Column	Type	Description
id	uuid (PK)	Unique project ID
project_name	text	Project title
collection	text	Quarter / time grouping
domain	text	Major area (CSF, ORDER, etc.)
type	text	Task type (Banner, PopUp, etc.)
tags	text[]	Labels for filtering
status	text	Enum: "Not Started", "In Progress", "On Review", "Done"
notes	text	Additional notes
start_date	date	Start date
due_date	date	Due date
links	jsonb	{ figma, docs, other }
created_at	timestamp	Default now()
updated_at	timestamp	Default now()

collaborators
Column	Type	Description
id	uuid (PK)	Unique collaborator ID
name	text	Collaborator name
email	text	(Optional) contact
role	text	(Optional) designer/dev/pm

project_collaborators
Many-to-many relationship table.

Column	Type	Description
id	uuid (PK)	Unique ID
project_id	uuid (FK → projects.id)	Linked project
collaborator_id	uuid (FK → collaborators.id)	Linked collaborator

2. Authentication (Optional)
If login is needed:

Enable Supabase Auth with email or OAuth (Google).

Restrict CRUD operations to user-owned projects (via user_id column).

3. Real-Time Sync
Enable Supabase Realtime on projects table.

Frontend subscribes to changes (INSERT, UPDATE, DELETE) to auto-refresh timeline and table views.

Example (pseudocode):

js
Copy code
supabase
  .channel('project_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, handleUpdate)
  .subscribe()
4. File Storage
Store attachments (images, documents) in Supabase Storage.

Folder structure:

bash
Copy code
/projects/{project_id}/attachments/{filename}
Each file record linked via links.other in projects.

5. Example Query
js
Copy code
const { data, error } = await supabase
  .from('projects')
  .select('*')
  .eq('collection', 'Q3 2025')
  .order('start_date', { ascending: true });
🧠 AI Build Instructions (for Figma Make)
When generating:

Implement Supabase integration first:

Connect to public REST endpoint or Supabase SDK.

Map schema fields.

Build two main views:

Table View

Timeline View

Include:

Search bar

Filter controls

View toggle (Table ↔ Timeline)

Use Supabase CRUD for task management:

INSERT → new project

UPDATE → edits

DELETE → remove

Real-time updates refresh current view instantly.

Use client-side caching for smooth interaction.

Mobile-friendly UI priority.

🎨 Design & UX Guidelines
General
Clean, neutral design like Notion or Linear.

Rounded cards, light shadows, minimal colors.

Soft color accents for each domain.

Framer Motion for smooth transitions.

Timeline
Bars colored by status.

Hover tooltip: project title, dates, collaborators.

Table
Sticky headers, sortable columns.

Status badges with color pills.

Detail Panel
Slide-in side drawer.

Autosave support.

Consistent spacing and hierarchy.

📱 Responsive Design Rules
Device	Layout
Desktop	Table + timeline side-by-side
Tablet	Collapsible sidebar, stacked layout
Mobile	Single-column cards, expandable details

📦 Tech Stack Recommendations
Layer	Tech
Frontend	React + Vite + TailwindCSS
Backend	Supabase (Postgres, Realtime, Storage, Auth)
State	Zustand or Redux Toolkit
Date Handling	Day.js or date-fns
Deployment	Vercel or Netlify

🚀 Stretch Goals
Dark mode toggle

Calendar sync (Google Calendar / iCal)

Notifications for deadlines

AI project insight summary

Collaboration (shared workspaces)

📌 Summary
This app replaces the Google Sheets + Timeline combo with a modern, Supabase-powered project tracker.
It combines:

A flexible multi-dimensional categorization model

Real-time sync

Clean UI and smooth usability

Scalability for future automation and integration

Result: a powerful personal timeline and project tracker that grows with your workflow — no more rigid spreadsheets.