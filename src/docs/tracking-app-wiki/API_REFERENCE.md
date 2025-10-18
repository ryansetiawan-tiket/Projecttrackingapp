# API Reference

## 📚 Reference untuk Hooks, Utils, dan Components

Dokumentasi lengkap untuk custom hooks, utility functions, dan key components.

## Daftar Isi

1. [Custom Hooks](#custom-hooks)
2. [Utility Functions](#utility-functions)
3. [Context Providers](#context-providers)
4. [Key Components](#key-components)
5. [Type Definitions](#type-definitions)

---

## Custom Hooks

### Data Fetching Hooks

#### useProjects

Fetch dan manage project data dari database.

```typescript
import { useProjects } from '../hooks/useProjects';

function MyComponent() {
  const { 
    projects,           // Project[]
    loading,            // boolean
    error,              // Error | null
    createProject,      // (data: Partial<Project>) => Promise<Project>
    updateProject,      // (id: string, data: Partial<Project>) => Promise<void>
    deleteProject,      // (id: string) => Promise<void>
    refetch             // () => Promise<void>
  } = useProjects();
  
  // ... use hooks
}
```

**Features**:
- ✅ Real-time subscriptions
- ✅ Automatic refetch
- ✅ Error handling
- ✅ Loading states

---

#### useTeams

Manage team members data.

```typescript
import { useTeams } from '../hooks/useTeams';

function MyComponent() {
  const {
    teams,              // TeamMember[]
    loading,            // boolean
    createTeamMember,   // (data: TeamMemberInput) => Promise<TeamMember>
    updateTeamMember,   // (id: string, data: Partial<TeamMember>) => Promise<void>
    deleteTeamMember,   // (id: string) => Promise<void>
    refetch             // () => Promise<void>
  } = useTeams();
}
```

**TeamMember Type**:
```typescript
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  color?: string;
  user_id: string;
  created_at: string;
}
```

---

#### useStatuses

Manage dynamic status system.

```typescript
import { useStatuses } from '../hooks/useStatuses';

function MyComponent() {
  const {
    statuses,           // Status[]
    loading,            // boolean
    createStatus,       // (data: StatusInput) => Promise<Status>
    updateStatus,       // (id: string, data: Partial<Status>) => Promise<void>
    deleteStatus,       // (id: string) => Promise<void>
    reorderStatuses,    // (orderedIds: string[]) => Promise<void>
    refetch             // () => Promise<void>
  } = useStatuses();
}
```

**Status Type**:
```typescript
interface Status {
  id: string;
  name: string;
  color: string;
  order_index: number;
  user_id: string;
  created_at: string;
}
```

---

#### useTypes

Manage project type definitions.

```typescript
import { useTypes } from '../hooks/useTypes';

const { types, createType, updateType, deleteType } = useTypes();
```

**Returns**: Similar pattern to other data hooks

---

#### useVerticals

Manage project vertical definitions.

```typescript
import { useVerticals } from '../hooks/useVerticals';

const { verticals, createVertical, updateVertical, deleteVertical } = useVerticals();
```

---

#### useLinkLabels

Manage custom link labels dengan icons.

```typescript
import { useLinkLabels } from '../hooks/useLinkLabels';

function MyComponent() {
  const {
    linkLabels,         // LinkLabel[]
    loading,            // boolean
    createLinkLabel,    // (data: LinkLabelInput) => Promise<LinkLabel>
    updateLinkLabel,    // (id: string, data: Partial<LinkLabel>) => Promise<void>
    deleteLinkLabel,    // (id: string) => Promise<void>
    refetch             // () => Promise<void>
  } = useLinkLabels();
}
```

**LinkLabel Type**:
```typescript
interface LinkLabel {
  id: string;
  label: string;
  icon_type: 'emoji' | 'svg' | 'none';
  icon_value: string;
  placeholder?: string;
  user_id: string;
}
```

---

#### useRoles

Manage custom role definitions.

```typescript
import { useRoles } from '../hooks/useRoles';

const { roles, updateRole, loading } = useRoles();
```

---

### Settings Hooks

#### useAdminProfile

Manage admin user profile.

```typescript
import { useAdminProfile } from '../hooks/useAdminProfile';

function MyComponent() {
  const {
    profile,            // AdminProfile | null
    loading,            // boolean
    updateProfile,      // (data: Partial<AdminProfile>) => Promise<void>
    refetch             // () => Promise<void>
  } = useAdminProfile();
}
```

**AdminProfile Type**:
```typescript
interface AdminProfile {
  fullName: string;
  email: string;
  // additional fields
}
```

---

#### useAppSettings

Generic settings management hook.

```typescript
import { useAppSettings } from '../hooks/useAppSettings';

function MyComponent() {
  const {
    getSetting,         // (key: string) => any
    setSetting,         // (key: string, value: any) => Promise<void>
    deleteSetting,      // (key: string) => Promise<void>
    loading             // boolean
  } = useAppSettings();
}
```

---

#### useSnackbarSettings

Manage snackbar banner settings.

```typescript
import { useSnackbarSettings } from '../hooks/useSnackbarSettings';

const { 
  isEnabled, 
  message, 
  updateSettings 
} = useSnackbarSettings();
```

---

### Utility Hooks

#### useDebouncedUpdate

Debounce updates untuk auto-save functionality.

```typescript
import { useDebouncedUpdate } from '../hooks/useDebouncedUpdate';

function MyComponent() {
  const debouncedUpdate = useDebouncedUpdate(
    async (data: Project) => {
      await supabase
        .from('projects')
        .update(data)
        .eq('id', data.id);
    },
    1000  // 1 second delay
  );
  
  // Usage
  const handleChange = (field: string, value: any) => {
    const updatedProject = { ...project, [field]: value };
    debouncedUpdate(updatedProject);
  };
}
```

**Parameters**:
- `updateFn`: `(data: T) => Promise<void>` - Function to call
- `delay`: `number` - Delay in milliseconds (default: 1000)

**Returns**: Debounced function

---

## Utility Functions

### Color Utilities

#### colorUtils.ts

```typescript
import { 
  hslToHex, 
  hexToHsl, 
  adjustLightness,
  getContrastColor 
} from '../utils/colorUtils';

// Convert HSL to Hex
const hex = hslToHex(210, 70, 50);  // "#2E86DE"

// Convert Hex to HSL
const hsl = hexToHsl("#2E86DE");  // { h: 210, s: 70, l: 50 }

// Adjust lightness
const lighter = adjustLightness("hsl(210, 70%, 50%)", 10);  // 10% lighter

// Get contrast color (black or white)
const contrast = getContrastColor("#2E86DE");  // "white" or "black"
```

---

### Chart Helpers

#### chartHelpers.ts

```typescript
import { 
  formatChartData,
  calculatePercentage,
  groupByPeriod 
} from '../utils/chartHelpers';

// Format data for Recharts
const chartData = formatChartData(projects, 'type');
// Returns: [{ name: 'Design', value: 10, fill: '#color' }, ...]

// Calculate percentage
const percent = calculatePercentage(5, 20);  // 25

// Group projects by period
const grouped = groupByPeriod(projects, 'month');
// Returns: { '2024-01': [projects], '2024-02': [projects] }
```

---

### Stats Calculations

#### statsCalculations.ts

```typescript
import { 
  calculateProjectStats,
  formatDaysToMonthsDays,
  getCompletionRate 
} from '../utils/statsCalculations';

// Calculate comprehensive stats
const stats = calculateProjectStats(projects);
// Returns: {
//   total: number,
//   active: number,
//   completed: number,
//   avgDuration: number,
//   completionRate: number
// }

// Format days to "X months Y days"
const formatted = formatDaysToMonthsDays(65);
// Returns: "2 months 5 days"

// Get completion rate
const rate = getCompletionRate(projects);  // 75.5
```

---

### GDrive Utilities

#### gdriveUtils.ts

```typescript
import {
  normalizeGDriveAssets,
  buildFolderHierarchy,
  getFolderContents,
  buildBreadcrumbs
} from '../utils/gdriveUtils';

// Normalize assets (backward compatibility)
const normalized = normalizeGDriveAssets(assets);

// Build folder hierarchy
const tree = buildFolderHierarchy(assets);

// Get contents of specific folder
const contents = getFolderContents(assets, folderId);

// Build breadcrumb path
const breadcrumbs = buildBreadcrumbs(currentFolder, allAssets);
```

---

### Quarter Utilities

#### quarterUtils.ts

```typescript
import {
  getQuarterFromDate,
  formatQuarter,
  getQuarterRange,
  isInQuarter
} from '../utils/quarterUtils';

// Get quarter from date
const quarter = getQuarterFromDate(new Date('2024-05-15'));
// Returns: { quarter: 2, year: 2024 }

// Format quarter
const formatted = formatQuarter(2, 2024);  // "Q2 2024"

// Get date range for quarter
const range = getQuarterRange(2, 2024);
// Returns: { start: Date, end: Date }

// Check if date is in quarter
const inQuarter = isInQuarter(date, 2, 2024);  // boolean
```

---

### Sorting Utilities

#### sortingUtils.ts

```typescript
import {
  sortByDate,
  sortByString,
  sortByStatus,
  sortProjects
} from '../utils/sortingUtils';

// Sort by date
const sorted = sortByDate(projects, 'deadline', 'asc');

// Sort by string field
const sorted = sortByString(projects, 'project_name', 'desc');

// Sort by status (using status order)
const sorted = sortByStatus(projects, statusOrder);

// Generic project sort
const sorted = sortProjects(projects, 'deadline', 'desc');
```

---

### Team Utilities

#### teamUtils.ts

```typescript
import {
  getTeamMemberById,
  getTeamMembersByRole,
  formatTeamMemberName,
  getInitials
} from '../utils/teamUtils';

// Get team member by ID
const member = getTeamMemberById(teams, memberId);

// Get all members of specific role
const designers = getTeamMembersByRole(teams, 'Designer');

// Format member name
const name = formatTeamMemberName(member);  // "John D."

// Get initials
const initials = getInitials("John Doe");  // "JD"
```

---

### Task Progress

#### taskProgress.ts

```typescript
import {
  calculateProgress,
  getCompletedActions,
  getTotalActions,
  isFullyCompleted
} from '../utils/taskProgress';

// Calculate completion percentage
const progress = calculateProgress(asset);  // 75

// Get completed actions count
const completed = getCompletedActions(asset);  // 3

// Get total actions count
const total = getTotalActions(asset);  // 4

// Check if fully completed
const isDone = isFullyCompleted(asset);  // false
```

---

### URL Manager

#### urlManager.ts

```typescript
import {
  buildProjectUrl,
  buildGDriveUrl,
  parseUrlParams,
  updateUrlParams
} from '../utils/urlManager';

// Build project detail URL
const url = buildProjectUrl(projectId);  // "/project/abc-123"

// Build GDrive tab URL with folder
const url = buildGDriveUrl(projectId, folderId);
// "/project/abc-123?tab=gdrive&folder=xyz-789"

// Parse URL params
const params = parseUrlParams(window.location.search);
// { tab: 'gdrive', folder: 'xyz-789' }

// Update URL without reload
updateUrlParams({ tab: 'workflow' });
```

---

### Premade Icons

#### premadeIcons.ts

Array of preset icons untuk Link Labels.

```typescript
import { premadeIcons, type PremadeIcon } from '../utils/premadeIcons';

// Available presets:
// - Figma
// - Google Sheets
// - Notion
// - Trello
// - Slack
// - GitHub
// - Linear
// - Asana
// - Miro
// - Airtable
// - ClickUp

// PremadeIcon type
interface PremadeIcon {
  id: string;
  name: string;
  category: string;
  svg: string;  // SVG markup
}
```

---

## Context Providers

### AuthContext

Provides authentication state globally.

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const {
    user,               // User | null
    profile,            // UserProfile | null
    loading,            // boolean
    signIn,             // (email: string, password: string) => Promise<void>
    signOut,            // () => Promise<void>
    signUp,             // (email: string, password: string) => Promise<void>
  } = useAuth();
}
```

**Usage**:
```tsx
// Wrap app with provider
<AuthContext.Provider value={authValue}>
  <App />
</AuthContext.Provider>

// Use in components
const { user, signIn } = useAuth();
```

---

### ColorContext

Provides color schemes untuk Types & Verticals.

```typescript
import { useColor } from '../components/ColorContext';

function MyComponent() {
  const {
    getTypeColor,       // (type: string) => string
    getVerticalColor,   // (vertical: string) => string
    typeColors,         // Record<string, string>
    verticalColors,     // Record<string, string>
  } = useColor();
  
  const color = getTypeColor('Design');  // "hsl(210, 70%, 50%)"
}
```

---

### StatusContext

Provides dynamic status system.

```typescript
import { useStatusContext } from '../components/StatusContext';

function MyComponent() {
  const {
    statuses,           // Status[]
    getStatusColor,     // (statusName: string) => string
    loading,            // boolean
  } = useStatusContext();
}
```

---

### WorkflowContext

Provides workflow definitions.

```typescript
import { useWorkflow } from '../components/WorkflowContext';

function MyComponent() {
  const {
    workflows,          // Workflow[]
    getWorkflowByType,  // (type: string) => Workflow | undefined
    loading,            // boolean
  } = useWorkflow();
}
```

---

### ActionSettingsContext

Provides action preset & settings.

```typescript
import { useActionSettings } from '../components/ActionSettingsContext';

function MyComponent() {
  const {
    actionPresets,      // ActionPreset[]
    actionSettings,     // ActionSettings
    updateSettings,     // (settings: Partial<ActionSettings>) => Promise<void>
    loading,            // boolean
  } = useActionSettings();
}
```

---

## Key Components

### Shadcn UI Components

Located in `/components/ui/`

#### Button

```tsx
import { Button } from './components/ui/button';

<Button variant="default" size="md">Click me</Button>

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon
```

#### Dialog

```tsx
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from './components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
    </DialogHeader>
    {/* Content */}
    <DialogFooter>
      <Button onClick={handleSave}>Save</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

#### Select

```tsx
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

#### Command

```tsx
import { 
  Command, 
  CommandInput, 
  CommandList, 
  CommandItem 
} from './components/ui/command';

<Command>
  <CommandInput placeholder="Search..." />
  <CommandList>
    {items.map(item => (
      <CommandItem key={item.id} onSelect={() => handleSelect(item)}>
        {item.name}
      </CommandItem>
    ))}
  </CommandList>
</Command>
```

For complete Shadcn UI documentation, see: [Shadcn/ui Docs](https://ui.shadcn.com)

---

### Custom Components

#### CollaboratorAvatars

Display team member avatars dengan dynamic layout.

```tsx
import { CollaboratorAvatars } from './components/project-table/CollaboratorAvatars';

<CollaboratorAvatars
  collaborators={project.collaborators}
  maxDisplay={8}
  size="md"  // sm, md, lg
/>
```

**Props**:
- `collaborators`: TeamMember[]
- `maxDisplay?`: number (default: 8)
- `size?`: 'sm' | 'md' | 'lg'

---

#### AssetProgressBar

Progress bar untuk asset completion.

```tsx
import { AssetProgressBar } from './components/project-table/AssetProgressBar';

<AssetProgressBar
  completed={5}
  total={10}
  showPercentage
/>
```

**Props**:
- `completed`: number
- `total`: number
- `showPercentage?`: boolean

---

#### DateWithQuarter

Date display dengan quarter badge.

```tsx
import { DateWithQuarter } from './components/DateWithQuarter';

<DateWithQuarter
  date={new Date('2024-05-15')}
  showQuarter
/>
```

**Props**:
- `date`: Date | string
- `showQuarter?`: boolean

---

#### StatsCard

Card component untuk displaying statistics.

```tsx
import { StatsCard } from './components/stats/StatsCard';

<StatsCard
  title="Total Projects"
  value={42}
  icon={<FolderIcon />}
  trend="+12%"
/>
```

**Props**:
- `title`: string
- `value`: number | string
- `icon?`: ReactNode
- `trend?`: string
- `description?`: string

---

## Type Definitions

### Project Types

```typescript
// types/project.ts

interface Project {
  id: string;
  project_name: string;
  type: string;
  vertical: string;
  start_date: string;
  deadline: string;
  status: string;
  urgency: 'High' | 'Medium' | 'Low';
  collaborators: TeamMember[];
  links: {
    labeled: ProjectLink[];
  };
  gdrive_assets: GDriveAsset[];
  lightroom_assets: LightroomAsset[];
  actionable_items: ActionableItem[];
  notes?: string;
  archived: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ProjectLink {
  id: string;
  label: string;
  url: string;
}

interface GDriveAsset {
  id: string;
  name: string;
  url: string;
  type: 'file' | 'folder';
  parent_id: string | null;
  folder_path: string;
  status?: string;
  actionable_items: ActionableItem[];
}

interface ActionableItem {
  id: string;
  description: string;
  isCompleted: boolean;
  assignee?: TeamMember;
  order: number;
  trigger_status?: string | null;
}
```

### Team Types

```typescript
// types/team.ts

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  color?: string;
  user_id: string;
  created_at: string;
}

interface Role {
  id: string;
  name: string;
  permissions?: string[];
  user_id: string;
}
```

### Status Types

```typescript
// types/status.ts

interface Status {
  id: string;
  name: string;
  color: string;
  order_index: number;
  user_id: string;
  created_at: string;
}
```

### Stats Types

```typescript
// types/stats.ts

interface ProjectStats {
  total: number;
  active: number;
  completed: number;
  avgDuration: number;
  completionRate: number;
  onTimeDelivery: number;
}

interface ChartData {
  name: string;
  value: number;
  fill?: string;
}

interface QuarterData {
  quarter: string;
  year: number;
  count: number;
  fill?: string;
}
```

---

## Usage Examples

### Example 1: Create Project

```typescript
import { useProjects } from '../hooks/useProjects';
import { toast } from 'sonner@2.0.3';

function CreateProjectForm() {
  const { createProject } = useProjects();
  
  const handleSubmit = async (data: ProjectFormData) => {
    try {
      const newProject = await createProject(data);
      toast.success('Project created!');
      navigate(`/project/${newProject.id}`);
    } catch (error) {
      toast.error('Failed to create project');
    }
  };
  
  return <form onSubmit={handleSubmit}>...</form>;
}
```

### Example 2: Real-time Updates

```typescript
import { useProjects } from '../hooks/useProjects';
import { useEffect } from 'react';

function ProjectList() {
  const { projects, refetch } = useProjects();
  
  // Manual refetch on demand
  useEffect(() => {
    const interval = setInterval(refetch, 30000);  // Every 30s
    return () => clearInterval(interval);
  }, [refetch]);
  
  return (
    <div>
      {projects.map(project => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
}
```

### Example 3: Use Multiple Hooks

```typescript
import { useProjects } from '../hooks/useProjects';
import { useTeams } from '../hooks/useTeams';
import { useStatuses } from '../hooks/useStatuses';

function Dashboard() {
  const { projects, loading: projectsLoading } = useProjects();
  const { teams, loading: teamsLoading } = useTeams();
  const { statuses, loading: statusesLoading } = useStatuses();
  
  const loading = projectsLoading || teamsLoading || statusesLoading;
  
  if (loading) return <LoadingSpinner />;
  
  return <DashboardContent projects={projects} teams={teams} statuses={statuses} />;
}
```

---

**Next**: [Changelog →](./CHANGELOG.md)
