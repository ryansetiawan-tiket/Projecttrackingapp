# Architecture Guide

## 📐 Arsitektur Aplikasi

Dokumen ini menjelaskan arsitektur lengkap dari Personal Timeline & Task Tracker.

## Daftar Isi

1. [System Architecture](#system-architecture)
2. [Folder Structure](#folder-structure)
3. [Component Hierarchy](#component-hierarchy)
4. [Data Flow](#data-flow)
5. [State Management](#state-management)
6. [Database Schema](#database-schema)
7. [Authentication Flow](#authentication-flow)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Dashboard   │  │   Settings   │  │    Stats     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Context Providers                       │   │
│  │  - Auth  - Color  - Status  - Workflow  - Actions   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Custom Hooks Layer                      │   │
│  │  - useProjects  - useTeams  - useStatuses  etc.     │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ API Calls (Supabase Client)
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    Supabase Backend                          │
│                                                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   Auth   │  │ Database │  │ Storage  │  │ Realtime │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

#### 1. **Single Page Application (SPA)**
- React Router untuk navigation
- Client-side routing dengan browser history API
- URL state management untuk deep linking

#### 2. **Context-Based State Management**
- Tidak menggunakan Redux/Zustand untuk simplicity
- Multiple specialized contexts untuk separation of concerns
- Custom hooks sebagai interface untuk consume context

#### 3. **Component-First Design**
- Atomic design principles
- Reusable UI components dari Shadcn/ui
- Feature-based component organization

#### 4. **Real-time First**
- Supabase Realtime subscriptions untuk live updates
- Optimistic UI updates untuk better UX
- Automatic re-fetching pada critical operations

---

## Folder Structure

```
/
├── components/              # React components
│   ├── ui/                 # Shadcn UI components (base)
│   ├── mobile/             # Mobile-specific components
│   ├── project-table/      # Table view components
│   ├── stats/              # Stats dashboard components
│   ├── gdrive-bulk-upload/ # GDrive upload flow components
│   ├── icons/              # Custom icon components
│   ├── figma/              # Figma-related utilities
│   └── [feature].tsx       # Feature components
│
├── contexts/               # React Context providers
│   └── AuthContext.tsx
│
├── hooks/                  # Custom React hooks
│   ├── useProjects.ts
│   ├── useTeams.ts
│   ├── useStatuses.ts
│   └── [etc].ts
│
├── types/                  # TypeScript type definitions
│   ├── project.ts
│   ├── team.ts
│   ├── status.ts
│   └── stats.ts
│
├── utils/                  # Utility functions
│   ├── supabase/          # Supabase client & helpers
│   ├── chartHelpers.ts
│   ├── colorUtils.ts
│   ├── statsCalculations.ts
│   └── [etc].ts
│
├── docs/                   # Documentation
│   └── tracking-app-wiki/ # Main documentation wiki
│
├── planning/               # Planning documents
├── styles/                 # Global styles
└── supabase/              # Supabase functions
    └── functions/server/
```

### Component Organization Principles

#### 1. **Feature-Based Components** (Root `/components`)
- Components yang define major features
- Contoh: `Dashboard.tsx`, `ProjectPage.tsx`, `SettingsPage.tsx`

#### 2. **UI Components** (`/components/ui`)
- Base components dari Shadcn/ui
- TIDAK BOLEH dimodifikasi secara ekstensif
- Hanya customize melalui props dan className

#### 3. **Feature Modules** (Sub-folders)
- Components yang terkait digroup dalam folder
- Contoh: `/stats`, `/project-table`, `/gdrive-bulk-upload`
- Include types.ts jika ada type-specific

#### 4. **Mobile Components** (`/components/mobile`)
- Mobile-optimized versions
- Responsive alternatives untuk desktop components
- Mobile-first interaction patterns

---

## Component Hierarchy

### Main App Structure

```
App.tsx
├── ThemeProvider
│   ├── ColorContext.Provider
│   │   ├── StatusContext.Provider
│   │   │   ├── WorkflowContext.Provider
│   │   │   │   ├── ActionSettingsContext.Provider
│   │   │   │   │   ├── AuthPage (if not authenticated)
│   │   │   │   │   └── Dashboard (if authenticated)
│   │   │   │   │       ├── Header
│   │   │   │   │       ├── ProjectFilters
│   │   │   │   │       ├── ViewSelector
│   │   │   │   │       └── [Active View Component]
│   │   │   │   │           ├── ProjectTable
│   │   │   │   │           ├── ProjectTimeline
│   │   │   │   │           ├── AssetOverview
│   │   │   │   │           └── Archive
└── ToastProvider
```

### Dashboard Views Hierarchy

#### 1. Table View
```
ProjectTable
├── ProjectFilters
├── table (HTML)
│   ├── thead
│   │   └── Column Headers
│   └── tbody
│       └── renderProjectRow (for each project)
│           ├── DateCell
│           ├── CollaboratorAvatars
│           ├── LinksCell
│           ├── DeliverablesCell
│           └── AssetProgressBar
```

#### 2. Timeline View
```
ProjectTimeline
├── Desktop: ProjectTimelineItem (grid-based)
└── Mobile: MobileTimelineWeek
    ├── WeekStrip
    ├── EventBar
    └── EventDetailSheet
```

#### 3. Deliverables View (Asset Overview)
```
AssetOverview
├── GDriveOverview
│   └── Asset Cards with Progress
└── LightroomOverview
    └── Asset Cards with Progress
```

### Project Page Hierarchy

```
ProjectPage
├── ProjectInfo (Header section)
├── Tabs
│   ├── Overview Tab
│   │   ├── Project Form (editable fields)
│   │   └── Action Buttons
│   ├── Google Drive Tab
│   │   ├── GDrivePage
│   │   │   ├── Breadcrumbs Navigation
│   │   │   ├── Folder/File List
│   │   │   └── AddGDriveAssetDialog
│   │   └── GDrivePreviewGalleryPage
│   ├── Lightroom Tab
│   │   └── LightroomPage
│   ├── Workflow Tab
│   │   └── AssetActionManager
│   │       └── ActionableItemManager
│   └── Notes Tab
│       └── Textarea (project notes)
```

### Settings Page Hierarchy

```
SettingsPage
├── Navigation Tabs
├── Admin Profile Tab
│   └── AdminProfileManager
├── Team Management Tab
│   └── TeamManagement
│       ├── TeamMemberManager
│       └── RoleManagement
├── Status Management Tab
│   └── StatusManager
├── Type Management Tab
│   └── TypeManager (with color picker)
├── Vertical Management Tab
│   └── VerticalManager (with color picker)
├── Link Labels Tab
│   └── LinkLabelManager
├── Workflow Tab
│   └── WorkflowManager
└── Action Presets Tab
    └── ActionPresetManager
```

---

## Data Flow

### Request Flow Pattern

#### 1. **Read Operations (GET)**
```
Component
  └─> Custom Hook (e.g., useProjects)
      └─> Supabase Client
          └─> Supabase Database
              └─> Return Data
                  └─> Hook State Update
                      └─> Component Re-render
```

#### 2. **Write Operations (POST/PUT/DELETE)**
```
Component (User Action)
  └─> Event Handler
      └─> Optimistic Update (optional)
          └─> Supabase Client Mutation
              └─> Success/Error Handling
                  └─> Toast Notification
                      └─> Re-fetch Data (or Realtime update)
                          └─> Component Re-render
```

#### 3. **Real-time Updates**
```
Supabase Realtime Subscription
  └─> Database Change Event
      └─> Subscription Callback
          └─> Hook State Update
              └─> Component Re-render
```

### Example: Creating a Project

```typescript
// 1. User clicks "Create Project" button
// 2. ProjectForm validation
// 3. Call createProject handler

const handleCreateProject = async (data) => {
  // 4. Optimistic UI update (optional)
  setIsLoading(true);
  
  try {
    // 5. Supabase insert
    const { data: newProject, error } = await supabase
      .from('projects')
      .insert([data])
      .select()
      .single();
    
    if (error) throw error;
    
    // 6. Success toast
    toast.success('Project created!');
    
    // 7. Navigate to project page
    navigate(`/project/${newProject.id}`);
    
  } catch (error) {
    // 8. Error handling
    toast.error('Failed to create project');
    console.error(error);
  } finally {
    // 9. Reset loading state
    setIsLoading(false);
  }
};
```

---

## State Management

### Context Architecture

#### 1. **AuthContext** (`/contexts/AuthContext.tsx`)
**Purpose**: Manage authentication state globally
- Current user
- User profile
- Login/logout methods
- Session management

```typescript
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  // ...
}
```

#### 2. **ColorContext** (`/components/ColorContext.tsx`)
**Purpose**: Manage color schemes untuk Types & Verticals
- Type colors
- Vertical colors
- Color utility functions

#### 3. **StatusContext** (`/components/StatusContext.tsx`)
**Purpose**: Manage dynamic status system
- Status list
- Status CRUD operations
- Status color & order

#### 4. **WorkflowContext** (`/components/WorkflowContext.tsx`)
**Purpose**: Manage workflow definitions
- Workflow templates
- Stage definitions
- Status transitions

#### 5. **ActionSettingsContext** (`/components/ActionSettingsContext.tsx`)
**Purpose**: Manage action presets & settings
- Action presets
- Auto-trigger settings
- Action templates

### Custom Hooks Pattern

Semua data fetching menggunakan custom hooks pattern:

```typescript
// Example: useProjects hook
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Fetch projects
  const fetchProjects = useCallback(async () => {
    // Supabase query
  }, []);
  
  // CRUD operations
  const createProject = async (data: Partial<Project>) => { /* ... */ };
  const updateProject = async (id: string, data: Partial<Project>) => { /* ... */ };
  const deleteProject = async (id: string) => { /* ... */ };
  
  // Real-time subscription
  useEffect(() => {
    const subscription = supabase
      .channel('projects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, 
        (payload) => {
          // Handle real-time updates
        }
      )
      .subscribe();
    
    return () => { subscription.unsubscribe(); };
  }, []);
  
  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects
  };
}
```

---

## Database Schema

### Core Tables

#### 1. **projects**
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_name TEXT NOT NULL,
  type TEXT,
  vertical TEXT,
  start_date DATE,
  deadline DATE,
  status TEXT,
  urgency TEXT,
  collaborators JSONB DEFAULT '[]',
  links JSONB DEFAULT '{}',
  gdrive_assets JSONB DEFAULT '[]',
  lightroom_assets JSONB DEFAULT '[]',
  actionable_items JSONB DEFAULT '[]',
  notes TEXT,
  user_id UUID REFERENCES auth.users(id),
  archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

#### 2. **teams**
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,
  color TEXT,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now()
);
```

#### 3. **statuses**
```sql
CREATE TABLE statuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  order_index INTEGER,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT now()
);
```

#### 4. **settings**
```sql
CREATE TABLE settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  setting_key TEXT NOT NULL,
  setting_value JSONB,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
```

### JSONB Field Structures

#### collaborators (in projects)
```json
[
  {
    "id": "team-uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "Designer"
  }
]
```

#### links (in projects)
```json
{
  "labeled": [
    {
      "id": "link-id",
      "label": "Figma",
      "url": "https://figma.com/..."
    }
  ]
}
```

#### gdrive_assets (in projects)
```json
[
  {
    "id": "asset-uuid",
    "name": "Design File",
    "url": "https://drive.google.com/...",
    "status": "in-progress",
    "folder_path": "Designs/Final",
    "parent_id": "folder-uuid",
    "type": "file",
    "actionable_items": []
  }
]
```

#### actionable_items (in assets)
```json
[
  {
    "id": "action-uuid",
    "description": "Review design",
    "isCompleted": false,
    "assignee": {
      "id": "team-uuid",
      "name": "John Doe"
    },
    "order": 0
  }
]
```

---

## Authentication Flow

### Login Flow
```
1. User enters email & password
   └─> AuthPage component

2. Submit credentials
   └─> supabase.auth.signInWithPassword()

3. Supabase validates credentials
   └─> Returns session + user

4. AuthContext updates state
   └─> user & profile set

5. Redirect to Dashboard
   └─> Route protection check passes
```

### Session Management
```
1. App loads
   └─> AuthContext initializes

2. Check for existing session
   └─> supabase.auth.getSession()

3. If session exists
   └─> Fetch user profile
   └─> Set authenticated state

4. If no session
   └─> Show AuthPage

5. Listen for auth state changes
   └─> supabase.auth.onAuthStateChange()
   └─> Update context on changes
```

### Route Protection
```typescript
// In App.tsx or routing logic
{user ? (
  <Dashboard />
) : (
  <AuthPage />
)}
```

---

## Performance Considerations

### 1. **Lazy Loading**
- Components loaded on-demand
- Code splitting per route
- Dynamic imports untuk heavy components

### 2. **Memoization**
- `useMemo` untuk expensive calculations
- `useCallback` untuk function props
- `React.memo` untuk pure components

### 3. **Debouncing**
- Search inputs debounced
- Auto-save debounced (useDebouncedUpdate hook)
- Resize handlers debounced

### 4. **Optimistic Updates**
- Immediate UI feedback
- Background sync dengan server
- Rollback on error

### 5. **Pagination & Virtualization**
- Large lists use virtual scrolling (future enhancement)
- Pagination untuk stats & reports
- Lazy loading untuk images

---

## Best Practices

### Component Guidelines
1. ✅ One component per file
2. ✅ Props interface defined dengan TypeScript
3. ✅ Proper prop destructuring
4. ✅ Event handlers prefixed dengan `handle`
5. ✅ Use Shadcn UI components when possible

### State Management Guidelines
1. ✅ Lift state up only when necessary
2. ✅ Use Context untuk truly global state
3. ✅ Local state untuk UI-only state
4. ✅ Custom hooks untuk data fetching

### Styling Guidelines
1. ✅ Tailwind utility classes only
2. ✅ NO inline styles unless dynamic
3. ✅ NO font-size, font-weight, line-height classes (use globals.css tokens)
4. ✅ Consistent spacing scale

### TypeScript Guidelines
1. ✅ Explicit return types untuk functions
2. ✅ Avoid `any` type
3. ✅ Use discriminated unions untuk variants
4. ✅ Type imports separately

---

**Next**: [Features Documentation →](./FEATURES.md)
