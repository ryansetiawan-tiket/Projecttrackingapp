# Development Guide

## 👨‍💻 Panduan untuk Developer

Dokumen ini untuk developer yang ingin contribute atau extend aplikasi.

## Daftar Isi

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Code Standards](#code-standards)
4. [Component Guidelines](#component-guidelines)
5. [State Management Patterns](#state-management-patterns)
6. [Database Operations](#database-operations)
7. [Adding New Features](#adding-new-features)
8. [Testing](#testing)
9. [Deployment](#deployment)

---

## Getting Started

### Prerequisites

```bash
# Required
- Node.js v16+ 
- npm/yarn/pnpm
- Git
- Supabase account (for backend)

# Recommended
- VS Code
- React DevTools extension
- Supabase CLI (optional)
```

### Initial Setup

```bash
# 1. Clone repository
git clone <repo-url>
cd project-tracker

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env

# Edit .env with your Supabase credentials:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# 4. Start development server
npm run dev

# 5. Open browser
# Navigate to http://localhost:5173
```

### Project Structure Overview

```
src/
├── components/        # React components
│   ├── ui/           # Base UI components (Shadcn)
│   ├── mobile/       # Mobile-specific components
│   └── [features]/   # Feature components
├── contexts/         # React Context providers
├── hooks/            # Custom React hooks
├── types/            # TypeScript definitions
├── utils/            # Helper functions
│   └── supabase/    # Supabase utilities
├── styles/           # Global styles
└── App.tsx           # Main app entry
```

---

## Development Workflow

### Branch Strategy

```bash
# Main branches
main          # Production-ready code
develop       # Development branch
staging       # Pre-production testing

# Feature branches
feature/feature-name
fix/bug-name
refactor/component-name
docs/documentation-update
```

### Typical Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-feature

# 2. Make changes
# - Write code
# - Test locally
# - Write tests (if applicable)

# 3. Commit changes
git add .
git commit -m "feat: add new feature description"

# 4. Push to remote
git push origin feature/new-feature

# 5. Create Pull Request
# - Add description
# - Link related issues
# - Request review

# 6. After approval, merge to develop
git checkout develop
git merge feature/new-feature

# 7. Deploy to staging for testing
npm run build
# Deploy to staging environment

# 8. After testing, merge to main
git checkout main
git merge develop
```

### Commit Message Convention

```bash
# Format: <type>(<scope>): <subject>

# Types:
feat:     # New feature
fix:      # Bug fix
refactor: # Code refactoring
docs:     # Documentation
style:    # Formatting, missing semicolons, etc.
test:     # Adding tests
chore:    # Maintenance

# Examples:
feat(stats): add quarter distribution chart
fix(table): resolve overflow issue in links cell
refactor(hooks): optimize useProjects hook
docs(wiki): update troubleshooting guide
style(ui): format button component
test(utils): add tests for color utilities
chore(deps): update dependencies
```

---

## Code Standards

### TypeScript Guidelines

#### 1. **Always Define Types**

```typescript
// ✅ Good
interface ProjectFormData {
  project_name: string;
  type: string;
  vertical: string;
  start_date: string;
  deadline: string;
}

function createProject(data: ProjectFormData): Promise<Project> {
  // ...
}

// ❌ Bad
function createProject(data: any) {
  // ...
}
```

#### 2. **Use Discriminated Unions**

```typescript
// ✅ Good
type AssetType = 
  | { type: 'gdrive'; url: string; }
  | { type: 'lightroom'; catalog: string; }
  | { type: 'file'; path: string; };

// ❌ Bad
type AssetType = {
  type: string;
  url?: string;
  catalog?: string;
  path?: string;
};
```

#### 3. **Avoid Any Type**

```typescript
// ✅ Good
function processData<T>(data: T[]): T[] {
  return data.filter(item => item !== null);
}

// ❌ Bad
function processData(data: any): any {
  return data.filter((item: any) => item !== null);
}
```

### React Guidelines

#### 1. **Component Structure**

```typescript
// Standard component template
import { useState, useEffect } from 'react';
import { SomeType } from '../types/project';

interface ComponentNameProps {
  prop1: string;
  prop2?: number;
  onAction?: () => void;
}

export function ComponentName({ 
  prop1, 
  prop2 = 10, 
  onAction 
}: ComponentNameProps) {
  // 1. Hooks (useState, useEffect, custom hooks)
  const [state, setState] = useState<SomeType | null>(null);
  
  useEffect(() => {
    // Effect logic
  }, []);
  
  // 2. Event handlers
  const handleClick = () => {
    // Handler logic
    onAction?.();
  };
  
  // 3. Render helpers
  const renderItem = (item: SomeType) => {
    return <div>{item.name}</div>;
  };
  
  // 4. Main render
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

#### 2. **Props Destructuring**

```typescript
// ✅ Good: Destructure in parameter
export function Component({ name, value, onChange }: Props) {
  return <input value={value} onChange={onChange} />;
}

// ❌ Bad: Access via props object
export function Component(props: Props) {
  return <input value={props.value} onChange={props.onChange} />;
}
```

#### 3. **Event Handler Naming**

```typescript
// ✅ Good: Use "handle" prefix
const handleSubmit = () => { /* ... */ };
const handleChange = (e: ChangeEvent) => { /* ... */ };
const handleDelete = (id: string) => { /* ... */ };

// ❌ Bad: Generic names
const submit = () => { /* ... */ };
const change = (e: ChangeEvent) => { /* ... */ };
const deleteItem = (id: string) => { /* ... */ };
```

### Styling Guidelines

#### 1. **Use Tailwind Only**

```tsx
// ✅ Good: Tailwind classes
<div className="flex items-center gap-2 p-4 bg-background rounded-lg">
  <span className="text-sm text-muted-foreground">Content</span>
</div>

// ❌ Bad: Inline styles
<div style={{ display: 'flex', padding: '16px' }}>
  <span style={{ fontSize: '14px' }}>Content</span>
</div>
```

#### 2. **NO Font/Typography Classes**

```tsx
// ❌ AVOID: Don't use these classes
className="text-2xl font-bold leading-tight"

// ✅ Use HTML semantic tags instead
// Typography already defined in globals.css
<h1>Heading</h1>
<h2>Subheading</h2>
<p>Paragraph</p>
```

**Exception**: Only use when user explicitly requests font changes

#### 3. **Conditional Classes**

```tsx
// ✅ Good: Template literals for conditional classes
<div 
  className={`
    flex items-center gap-2
    ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted'}
    ${isHovered ? 'opacity-100' : 'opacity-0'}
  `}
>

// ✅ Also good: Using clsx or cn utility
import { cn } from '../utils/cn';

<div 
  className={cn(
    "flex items-center gap-2",
    isActive && "bg-primary text-primary-foreground",
    isHovered && "opacity-100"
  )}
>
```

---

## Component Guidelines

### When to Create a Component

**Create new component when**:
- ✅ Logic is reused in 2+ places
- ✅ Component exceeds ~200 lines
- ✅ Has distinct responsibility
- ✅ Improves readability

**Keep inline when**:
- ✅ Used only once
- ✅ Simple JSX (< 50 lines)
- ✅ Tightly coupled to parent

### Component Organization

```tsx
// 1. Large feature components → Own file
components/ProjectPage.tsx
components/Dashboard.tsx
components/SettingsPage.tsx

// 2. Reusable components → Grouped by feature
components/project-table/
  ├── LinksCell.tsx
  ├── DateCell.tsx
  └── CollaboratorAvatars.tsx

// 3. Shared utilities → ui/ folder
components/ui/
  ├── button.tsx
  ├── dialog.tsx
  └── select.tsx
```

### Props Interface Pattern

```typescript
// ✅ Good: Explicit and documented
interface ProjectCardProps {
  /** Project data to display */
  project: Project;
  
  /** Called when project is clicked */
  onClick?: (project: Project) => void;
  
  /** Show archive button */
  showArchive?: boolean;
  
  /** Additional CSS classes */
  className?: string;
}

// ❌ Bad: No documentation
interface ProjectCardProps {
  project: Project;
  onClick?: Function;
  showArchive?: boolean;
}
```

---

## State Management Patterns

### Local State (useState)

**Use for**:
- UI-only state (modals, dropdowns, hover states)
- Form inputs
- Temporary data

```typescript
function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  return (
    // ...
  );
}
```

### Context State (useContext)

**Use for**:
- Truly global state (auth, theme, colors)
- Data needed by many components
- Cross-cutting concerns

```typescript
// 1. Create context
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Create provider
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Create custom hook
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

### Server State (Custom Hooks)

**Use for**:
- Data from database
- API responses
- Real-time subscriptions

```typescript
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('projects')
        .select('*');
      
      if (error) throw error;
      setProjects(data || []);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  
  return { projects, loading, error, refetch: fetchProjects };
}
```

---

## Database Operations

### Supabase Client Setup

```typescript
// utils/supabase/client.tsx
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

### CRUD Operations Pattern

```typescript
// CREATE
async function createProject(data: ProjectFormData) {
  const { data: newProject, error } = await supabase
    .from('projects')
    .insert([{
      ...data,
      user_id: user.id
    }])
    .select()
    .single();
  
  if (error) throw error;
  return newProject;
}

// READ
async function getProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

// UPDATE
async function updateProject(id: string, updates: Partial<Project>) {
  const { data, error } = await supabase
    .from('projects')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

// DELETE
async function deleteProject(id: string) {
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id);
  
  if (error) throw error;
}
```

### Real-time Subscriptions

```typescript
useEffect(() => {
  const channel = supabase
    .channel('projects-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'projects',
        filter: `user_id=eq.${user.id}`
      },
      (payload) => {
        console.log('Change received:', payload);
        
        if (payload.eventType === 'INSERT') {
          setProjects(prev => [...prev, payload.new as Project]);
        } else if (payload.eventType === 'UPDATE') {
          setProjects(prev => prev.map(p => 
            p.id === payload.new.id ? payload.new as Project : p
          ));
        } else if (payload.eventType === 'DELETE') {
          setProjects(prev => prev.filter(p => p.id !== payload.old.id));
        }
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [user.id]);
```

---

## Adding New Features

### Step-by-Step Process

#### 1. **Plan the Feature**

```markdown
## Feature: Add Export to CSV

### Requirements
- Export projects to CSV file
- Include all project fields
- Filter by status/type before export
- Download as file

### Technical Approach
- Create utility function to convert projects to CSV
- Add export button to Dashboard
- Use browser download API
- Show progress indicator

### Files to Create/Modify
- Create: utils/exportUtils.ts
- Modify: components/Dashboard.tsx
- Modify: types/project.ts (if needed)
```

#### 2. **Create Types (if needed)**

```typescript
// types/export.ts
export interface ExportOptions {
  format: 'csv' | 'json';
  includeArchived: boolean;
  fields?: string[];
}

export interface ExportResult {
  filename: string;
  data: string;
  rowCount: number;
}
```

#### 3. **Implement Core Logic**

```typescript
// utils/exportUtils.ts
export function projectsToCSV(projects: Project[]): string {
  const headers = ['Name', 'Type', 'Vertical', 'Status', 'Start Date', 'Deadline'];
  const rows = projects.map(p => [
    p.project_name,
    p.type,
    p.vertical,
    p.status,
    p.start_date,
    p.deadline
  ]);
  
  return [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
}

export function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

#### 4. **Create UI Component**

```tsx
// components/ExportButton.tsx
import { Download } from 'lucide-react';
import { Button } from './ui/button';
import { projectsToCSV, downloadFile } from '../utils/exportUtils';
import { toast } from 'sonner@2.0.3';

interface ExportButtonProps {
  projects: Project[];
}

export function ExportButton({ projects }: ExportButtonProps) {
  const handleExport = () => {
    try {
      const csv = projectsToCSV(projects);
      const filename = `projects-${new Date().toISOString().split('T')[0]}.csv`;
      downloadFile(csv, filename);
      toast.success(`Exported ${projects.length} projects`);
    } catch (error) {
      toast.error('Export failed');
      console.error(error);
    }
  };
  
  return (
    <Button onClick={handleExport} variant="outline" size="sm">
      <Download className="h-4 w-4 mr-2" />
      Export CSV
    </Button>
  );
}
```

#### 5. **Integrate into Existing Component**

```tsx
// components/Dashboard.tsx
import { ExportButton } from './ExportButton';

export function Dashboard() {
  const { projects } = useProjects();
  
  return (
    <div>
      {/* ... existing code ... */}
      
      <div className="flex justify-end gap-2 mb-4">
        <ExportButton projects={projects} />
        {/* other buttons */}
      </div>
      
      {/* ... existing code ... */}
    </div>
  );
}
```

#### 6. **Test the Feature**

```typescript
// Test manually:
// 1. Click export button
// 2. Verify CSV downloads
// 3. Open CSV and check data
// 4. Test with filtered projects
// 5. Test with no projects
// 6. Test with special characters in names
```

#### 7. **Document**

```markdown
## Export Feature

### Usage
Click "Export CSV" button in Dashboard to download all projects as CSV file.

### Options
- Exports visible projects (respects filters)
- Filename includes current date
- Fields included: Name, Type, Vertical, Status, Dates

### Future Enhancements
- Export selected projects only
- Choose which fields to export
- Export as JSON or Excel
```

---

## Testing

### Manual Testing Checklist

```markdown
## Feature Testing

### Functionality
- [ ] Feature works as expected
- [ ] All user interactions work
- [ ] Error cases handled gracefully
- [ ] Loading states shown
- [ ] Success feedback provided

### UI/UX
- [ ] Responsive on mobile
- [ ] Accessible (keyboard navigation)
- [ ] Consistent with design system
- [ ] No layout issues
- [ ] Animations smooth

### Data
- [ ] Data saves correctly
- [ ] Data loads correctly
- [ ] Real-time updates work
- [ ] Handles empty states
- [ ] Handles large datasets

### Edge Cases
- [ ] Works with no data
- [ ] Works with maximum data
- [ ] Special characters handled
- [ ] Long text doesn't break layout
- [ ] Network errors handled
```

### Browser Testing

Test in:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile Safari (iOS)
- ✅ Mobile Chrome (Android)

---

## Deployment

### Build for Production

```bash
# 1. Run tests (if available)
npm run test

# 2. Build production bundle
npm run build

# 3. Preview build locally
npm run preview

# 4. Check build output
ls -lh dist/
```

### Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables

```bash
# Production environment variables
VITE_SUPABASE_URL=<production-url>
VITE_SUPABASE_ANON_KEY=<production-key>

# Set in Vercel Dashboard:
# Project Settings → Environment Variables
```

### Post-Deployment Checklist

- [ ] App loads without errors
- [ ] Authentication works
- [ ] Database operations work
- [ ] Real-time updates work
- [ ] Mobile responsive
- [ ] Performance acceptable (< 3s load time)
- [ ] No console errors
- [ ] SSL certificate valid

---

## Helpful Resources

### Documentation
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Shadcn/ui Docs](https://ui.shadcn.com)
- [Supabase Docs](https://supabase.com/docs)

### Tools
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [VS Code Extensions](https://code.visualstudio.com/docs/editor/extension-marketplace)
- [Postman](https://www.postman.com/) (API testing)

---

**Next**: [API Reference →](./API_REFERENCE.md)
