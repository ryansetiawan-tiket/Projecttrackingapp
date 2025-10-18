export interface Status {
  id: string;
  name: string;
  color: string; // Hex color for badge background
  textColor?: string; // Custom text color (if undefined, uses auto-contrast)
  useAutoContrast?: boolean; // If true, ignore textColor and use auto-contrast (default: true)
  displayIn: 'table' | 'archive'; // Where to show this status
  order: number; // For sorting
  is_manual?: boolean; // Whether this status is manually set (preserves user choice) vs auto-calculated
  auto_trigger_from_action?: boolean; // NEW: Auto-update project status when asset action with matching name is checked
}

// Default statuses
export const DEFAULT_STATUSES: Status[] = [
  {
    id: 'not-started',
    name: 'Not Started',
    color: '#9CA3AF',
    displayIn: 'table',
    order: 0,
    is_manual: false // Auto-calculated status
  },
  {
    id: 'planning',
    name: 'Planning',
    color: '#60A5FA',
    displayIn: 'table',
    order: 1,
    is_manual: false // Auto-calculated status
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    color: '#FBBF24',
    displayIn: 'table',
    order: 2,
    is_manual: false // Auto-calculated status
  },
  {
    id: 'review',
    name: 'Review',
    color: '#A78BFA',
    displayIn: 'table',
    order: 3,
    is_manual: true // Manual status - preserves user choice
  },
  {
    id: 'done',
    name: 'Done',
    color: '#34D399',
    displayIn: 'archive',
    order: 4,
    is_manual: true // Manual status - preserves user choice
  },
  {
    id: 'on-hold',
    name: 'On Hold',
    color: '#F59E0B',
    displayIn: 'table',
    order: 5,
    is_manual: true // Manual status - preserves user choice
  },
  {
    id: 'canceled',
    name: 'Canceled',
    color: '#EF4444',
    displayIn: 'archive',
    order: 6,
    is_manual: true // Manual status - preserves user choice
  }
];
