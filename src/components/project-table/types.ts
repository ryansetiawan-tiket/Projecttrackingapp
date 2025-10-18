import { Project, Collaborator } from '../../types/project';

/**
 * Configuration for project row rendering
 * Determines visual layout and behavior differences between grouping modes
 */
export interface ProjectTableRowConfig {
  // Layout configuration
  indentLevel: 'vertical-subgroup' | 'top-level';
  showVerticalBadge: boolean;
  rowPadding: string;
  
  // Optional overrides
  showDescription?: boolean;
  showAssetProgress?: boolean;
  compactMode?: boolean;
}

/**
 * Event handlers for project row interactions
 * Passed from parent to handle user actions
 */
export interface ProjectTableRowHandlers {
  onClick: (project: Project) => void;
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onUpdate: (id: string, data: Partial<Project>) => void;
  onNavigateToLightroom: (projectId: string) => void;
  onNavigateToGDrive: (projectId: string) => void;
  onAddLink?: (projectId: string) => void;
  onAddLightroom?: (projectId: string) => void;
  onAddGDrive?: (projectId: string) => void;
}

/**
 * State management for row interactive elements
 * Tracks which popovers/expansions are active
 */
export interface ProjectTableRowState {
  expandedAssets: Set<string>;
  activeAssetPopover: string | null;
  activeDatePopover: string | null;
  activeStatusPopover: string | null;
}

/**
 * Main props interface for ProjectTableRow component
 * Combines all configuration, data, handlers, and state
 */
export interface ProjectTableRowProps {
  // Data
  project: Project;
  collaborators: Collaborator[];
  verticalColors: Record<string, string>;
  
  // Configuration
  config: ProjectTableRowConfig;
  
  // Event Handlers
  handlers: ProjectTableRowHandlers;
  
  // State Management
  state: ProjectTableRowState;
  onStateChange: (newState: Partial<ProjectTableRowState>) => void;
  
  // Context
  isPublicView: boolean;
}

/**
 * Urgency indicator styling and data
 */
export interface UrgencyIndicator {
  color: string;
  bgColor: string;
}

/**
 * Deadline urgency badge data
 */
export interface DeadlineUrgency {
  className: string;
  label: string;
  showBadge: boolean;
}
