import { Project } from '../types/project';

/**
 * Get days until deadline
 */
export function getDaysUntilDeadline(dateString: string | null | undefined): number | null {
  if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
    return null;
  }
  
  try {
    const deadline = new Date(dateString);
    if (isNaN(deadline.getTime())) {
      return null;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('Error calculating days until deadline:', error);
    return null;
  }
}

/**
 * Get urgency priority score for sorting
 * Lower score = higher priority (appears first)
 */
export function getUrgencyPriority(project: Project): number {
  // Done projects always go to bottom
  if (project.status === 'Done') {
    return 1000;
  }
  
  const daysLeft = getDaysUntilDeadline(project.due_date);
  
  // No deadline = lowest priority (but above Done)
  if (daysLeft === null) {
    return 900;
  }
  
  // Overdue = highest priority
  if (daysLeft < 0) {
    return Math.abs(daysLeft); // More overdue = higher priority (1, 2, 3...)
  }
  
  // Due today
  if (daysLeft === 0) {
    return 100;
  }
  
  // 1-3 days left = very urgent
  if (daysLeft <= 3) {
    return 200 + daysLeft; // 201, 202, 203
  }
  
  // 4-7 days left = urgent
  if (daysLeft <= 7) {
    return 300 + daysLeft; // 304, 305, 306, 307
  }
  
  // 8-14 days left = upcoming
  if (daysLeft <= 14) {
    return 400 + daysLeft; // 408-414
  }
  
  // 15-30 days left = normal
  if (daysLeft <= 30) {
    return 500 + daysLeft; // 515-530
  }
  
  // 31+ days = low priority
  return 600 + Math.min(daysLeft, 300); // Cap at 900
}

/**
 * Sort projects by deadline urgency
 * Most urgent (overdue, due today, closest deadline) first
 * Done projects last
 */
export function sortProjectsByUrgency(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    const priorityA = getUrgencyPriority(a);
    const priorityB = getUrgencyPriority(b);
    
    // Lower priority number = higher urgency = comes first
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, sort by project name
    return (a.project_name || '').localeCompare(b.project_name || '');
  });
}

/**
 * Get the most urgent (lowest) priority score from an array of projects
 * Used to sort groups by their most urgent project
 */
export function getMostUrgentPriority(projects: Project[]): number {
  if (projects.length === 0) return 999;
  
  return Math.min(...projects.map(p => getUrgencyPriority(p)));
}

/**
 * Find projects that should be auto-promoted to "In Progress" based on urgency
 * A project gets promoted if:
 * - It's more urgent than any project currently "In Progress"
 * - It's NOT archived
 * - It's NOT "On Hold"
 * - It's NOT already "In Progress" or "Done"
 * 
 * Returns array of project IDs that should be promoted
 */
export function findProjectsToPromote(projects: Project[], manualStatusNames?: string[]): string[] {
  // Manual statuses that should NEVER be auto-promoted (case-insensitive)
  // If manualStatusNames is provided (from StatusContext), use that
  // Otherwise fallback to defaults for backward compatibility
  const defaultManualStatuses = [
    'on hold', 
    'canceled', 
    'babysit', 
    'on review', 
    'on list lightroom',
    'in review',
    'in queue lightroom',
    'lightroom', // Added for migration
    'light room', // Variations
    'lr',
    'lr queue',
    'done'
  ];
  
  const manualStatuses = manualStatusNames || defaultManualStatuses;
  
  console.log('[sortingUtils] Manual statuses to exclude from promotion:', manualStatuses);
  
  // Separate projects by status
  const inProgressProjects = projects.filter(p => 
    p.status === 'In Progress' && !p.archived
  );
  
  const otherProjects = projects.filter(p => {
    const statusLower = p.status.toLowerCase().trim();
    const isManual = manualStatuses.includes(statusLower);
    const shouldExclude = p.status === 'In Progress' || isManual || p.archived;
    
    if (isManual) {
      console.log(`[sortingUtils] Excluding "${p.project_name}" (status: "${p.status}") - manual status detected`);
    }
    
    return !shouldExclude;
  });
  
  // If no "In Progress" projects exist, don't promote anything
  // (let user manually set the first one)
  if (inProgressProjects.length === 0) {
    return [];
  }
  
  // Find the MOST urgent (lowest priority score) among "In Progress" projects
  const mostUrgentInProgressPriority = Math.min(
    ...inProgressProjects.map(p => getUrgencyPriority(p))
  );
  
  // Find projects in other statuses that are MORE urgent than the most urgent in progress
  const projectsToPromote = otherProjects.filter(p => {
    const priority = getUrgencyPriority(p);
    // Lower priority score = more urgent
    // Only promote if MORE urgent than the MOST urgent in progress
    return priority < mostUrgentInProgressPriority;
  });
  
  return projectsToPromote.map(p => p.id);
}

/**
 * Sort assets by completion status
 * - Non-Done assets first (maintain original order)
 * - Done assets last (sorted by completion time, newest completed first)
 */
export function sortAssetsByCompletion<T extends { status?: string; completed_at?: string | null }>(
  assets: T[]
): T[] {
  if (!assets || assets.length === 0) return assets;

  const nonDoneAssets: T[] = [];
  const doneAssets: T[] = [];

  // Separate Done vs non-Done assets
  assets.forEach(asset => {
    if (asset.status === 'Done') {
      doneAssets.push(asset);
    } else {
      nonDoneAssets.push(asset);
    }
  });

  // Sort Done assets by completion time (newest completed first)
  doneAssets.sort((a, b) => {
    // Assets with completed_at come before those without
    if (a.completed_at && !b.completed_at) return -1;
    if (!a.completed_at && b.completed_at) return 1;
    if (!a.completed_at && !b.completed_at) return 0;

    // Both have completed_at - newer completion comes first (descending)
    return new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime();
  });

  // Return non-Done assets first, then Done assets
  return [...nonDoneAssets, ...doneAssets];
}
