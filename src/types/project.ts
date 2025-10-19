export interface Project {
  id: string;
  project_name: string;
  vertical: string;
  type: ProjectType;
  types?: ProjectTypeList; // Multiple types (colors fetched from global settings)
  status: ProjectStatus;
  description: string;
  notes?: string; // Optional internal notes/reminders for project (max 150 chars)
  start_date: string;
  due_date: string;
  links: ProjectLinks;
  collaborators: ProjectCollaborator[];
  sprint?: string;
  figma_working_file?: string;
  actionable_items?: ActionableItem[];
  lightroom_assets?: LightroomAsset[];
  gdrive_assets?: GDriveAsset[];
  is_draft?: boolean; // Draft status - allows saving incomplete projects
  completed_at?: string | null; // Timestamp when project was completed (status set to Done)
  created_at: string;
  updated_at: string;
}

export interface LightroomAsset {
  id: string;
  asset_name: string;
  asset_type?: 'file' | 'folder'; // 🆕 NESTED FOLDERS: Type of asset (default: 'file')
  lightroom_url?: string; // Optional, karena belum tentu ada
  gdrive_url?: string; // Optional
  asset_id?: string; // Optional, to associate lightroom asset with specific actionable asset
  parent_id?: string | null; // 🆕 NESTED FOLDERS: Reference to parent folder (null/undefined = root level)
  color?: string; // 🆕 Optional folder color for visual organization
  created_at: string;
}

export interface GDrivePreview {
  id: string;
  url: string;
  name?: string; // Optional preview name (max 100 chars)
}

export interface GDriveAsset {
  id: string;
  asset_name: string;
  gdrive_link: string;
  asset_type: 'file' | 'folder';
  preview_url?: string; // Single preview - Signed URL from Supabase Storage (for 'file' type, backward compatibility)
  preview_urls?: GDrivePreview[] | string[]; // Multiple previews - Array of preview objects (new format) or string URLs (old format for backward compatibility)
  asset_id?: string; // Associated actionable item (for grouping/filtering)
  parent_id?: string | null; // 🆕 NESTED FOLDERS: Reference to parent folder (null/undefined = root level, max depth: 10 levels)
  created_at: string;
}

export interface AssetAction {
  id: string;
  name: string;
  completed: boolean;
  wasAutoChecked?: boolean; // Track if this action was auto-checked (vs manually checked)
}

export interface ActionableItem {
  id: string;
  title: string;
  type?: ProjectType;
  illustration_type?: string; // Optional illustration type (e.g., "Page Module", "Component", "Banner", etc.)
  collaborator?: ProjectCollaborator; // Keep for backward compatibility
  collaborators?: ProjectCollaborator[]; // New field for multiple assignees
  start_date?: string;
  due_date?: string;
  status?: ProjectStatus; // New: track progress status
  is_completed: boolean; // Keep for backward compatibility
  actions?: AssetAction[]; // New: action items for progress tracking
  completed_at?: string | null; // Timestamp when asset was marked as Done
  created_at: string;
  updated_at: string;
}

export interface ProjectLink {
  id: string;
  label: string;
  url: string;
}

export interface ProjectLinks {
  figma?: string;
  docs?: string;
  lightroom?: string;
  other?: string[];
  // New flexible structure for labeled links
  labeled?: ProjectLink[];
}

export interface ProjectCollaborator {
  id: string;
  name: string;
  nickname?: string;
  role: string;
  photo_url?: string;
  profile_url?: string;
}

export interface Collaborator {
  id: string;
  name: string;
  nickname?: string;
  role: string;
  photo_url?: string;
  profile_url?: string;
}

// Dynamic project type - can be any string now since types are managed in database
export type ProjectType = string;

export interface ProjectTypeWithColor {
  type: ProjectType;
  color: string;
}

// For projects, we only store the type names, colors are fetched from global settings
export type ProjectTypeList = ProjectType[];

export type ProjectStatus = 
  | "Not Started" 
  | "In Progress" 
  | "Babysit" 
  | "Done" 
  | "On Hold" 
  | "Canceled" 
  | "On List Lightroom" 
  | "On Review";

export interface ProjectFormData {
  project_name: string;
  vertical: string;
  type: ProjectType; // Keep for backward compatibility
  types?: ProjectTypeList; // Multiple types (colors fetched from global settings)
  status: ProjectStatus;
  description: string;
  notes?: string; // Optional internal notes/reminders for project (max 150 chars)
  start_date: string;
  due_date: string;
  links: ProjectLinks;
  collaborators: ProjectCollaborator[];
  sprint?: string;
  figma_working_file?: string;
  actionable_items?: ActionableItem[];
  lightroom_assets?: LightroomAsset[];
  gdrive_assets?: GDriveAsset[];
  is_draft?: boolean; // Draft status - allows saving incomplete projects
}

export interface FilterOptions {
  vertical?: string;
  type?: string;
  status?: ProjectStatus;
  collaborator?: string;
  search?: string;
}

export interface Workflow {
  id: string;
  name: string;
  actions: string[];
  assignedTypes?: ProjectType[];
  created_at: string;
  updated_at: string;
}

// ========================================
// TABLE COLUMN ORDERING (v2.4.0)
// ========================================

export type TableColumnId = 
  | 'projectName'    // LOCKED - always first
  | 'status'
  | 'deliverables'
  | 'startDate'
  | 'endDate'
  | 'collaborators'
  | 'links';

export interface TableColumn {
  id: TableColumnId;
  label: string;
  locked?: boolean;        // true for projectName
  defaultOrder: number;    // Original position (0-6)
  visible: boolean;        // Future: column visibility toggle
  width?: string;          // Optional: custom width
}

export const DEFAULT_TABLE_COLUMNS: TableColumn[] = [
  { 
    id: 'projectName', 
    label: 'Project', 
    locked: true, 
    defaultOrder: 0, 
    visible: true 
  },
  { 
    id: 'status', 
    label: 'Status', 
    defaultOrder: 1, 
    visible: true 
  },
  { 
    id: 'collaborators', 
    label: 'Collaborators', 
    defaultOrder: 2, 
    visible: true 
  },
  { 
    id: 'startDate', 
    label: 'Start Date', 
    defaultOrder: 3, 
    visible: true 
  },
  { 
    id: 'endDate', 
    label: 'Due Date', 
    defaultOrder: 4, 
    visible: true 
  },
  { 
    id: 'links', 
    label: 'Links', 
    defaultOrder: 5, 
    visible: true 
  },
  { 
    id: 'deliverables', 
    label: 'Deliverables', 
    defaultOrder: 6, 
    visible: true 
  },
];