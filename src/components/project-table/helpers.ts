import { calculateAssetProgress } from '../../utils/taskProgress';
import { UrgencyIndicator, DeadlineUrgency } from './types';

/**
 * Convert hex color to rgba with opacity
 */
export const hexToRgba = (hex: string, opacity: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * Get urgency color based on days left
 */
export const getUrgencyColor = (daysLeft: number | null, status: string): UrgencyIndicator => {
  // Don't show urgency for completed projects
  if (status === 'Done') {
    return { color: '#22c55e', bgColor: hexToRgba('#22c55e', 0.12) }; // green
  }
  
  if (daysLeft === null) {
    return { color: '#6b7280', bgColor: hexToRgba('#6b7280', 0.12) }; // gray
  }
  
  if (daysLeft < 0) {
    return { color: '#ef4444', bgColor: hexToRgba('#ef4444', 0.12) }; // red - overdue
  }
  
  if (daysLeft === 0) {
    return { color: '#f97316', bgColor: hexToRgba('#f97316', 0.12) }; // orange - due today
  }
  
  if (daysLeft <= 3) {
    return { color: '#f97316', bgColor: hexToRgba('#f97316', 0.12) }; // orange - urgent
  }
  
  if (daysLeft <= 7) {
    return { color: '#eab308', bgColor: hexToRgba('#eab308', 0.12) }; // yellow - warning
  }
  
  if (daysLeft <= 14) {
    return { color: '#3b82f6', bgColor: hexToRgba('#3b82f6', 0.12) }; // blue - upcoming
  }
  
  return { color: '#6b7280', bgColor: hexToRgba('#6b7280', 0.12) }; // gray - normal
};

/**
 * Get days until deadline
 */
export const getDaysUntilDeadline = (dateString: string | null | undefined): number | null => {
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
    console.warn('Error calculating days until deadline:', dateString, error);
    return null;
  }
};

/**
 * Get deadline urgency with styling
 */
export const getDeadlineUrgency = (dateString: string | null | undefined, status: string): DeadlineUrgency => {
  // If project is done, show completed badge
  if (status === 'Done') {
    return {
      className: 'bg-green-50 text-green-700 border-green-200',
      label: 'Completed',
      showBadge: true
    };
  }
  
  const daysLeft = getDaysUntilDeadline(dateString);
  
  if (daysLeft === null) {
    return { className: '', label: '', showBadge: false };
  }
  
  if (daysLeft < 0) {
    return {
      className: 'bg-red-50 text-red-700 border-red-200',
      label: `${Math.abs(daysLeft)} days overdue`,
      showBadge: true
    };
  }
  
  if (daysLeft === 0) {
    return {
      className: 'bg-orange-50 text-orange-700 border-orange-200',
      label: 'Due today',
      showBadge: true
    };
  }
  
  if (daysLeft <= 3) {
    return {
      className: 'bg-orange-50 text-orange-700 border-orange-200',
      label: `${daysLeft} days left`,
      showBadge: true
    };
  }
  
  if (daysLeft <= 7) {
    return {
      className: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      label: `${daysLeft} days left`,
      showBadge: true
    };
  }
  
  if (daysLeft <= 14) {
    return {
      className: 'bg-blue-50 text-blue-700 border-blue-200',
      label: `${daysLeft} days left`,
      showBadge: true
    };
  }
  
  return { className: '', label: '', showBadge: false };
};

/**
 * Get row background color based on deadline urgency
 */
export const getRowBackgroundColor = (dateString: string | null | undefined, status: string): string => {
  // If project is done, use green background
  if (status === 'Done') {
    return 'bg-green-50/40 hover:bg-green-50/60 dark:bg-green-950/30 dark:hover:bg-green-950/50';
  }
  
  const daysLeft = getDaysUntilDeadline(dateString);
  
  if (daysLeft === null) {
    return 'hover:bg-muted/50';
  }
  
  // Overdue, due today, and 1-3 days - RED (urgent!)
  if (daysLeft < 0 || daysLeft === 0 || daysLeft <= 3) {
    return 'bg-red-50/40 hover:bg-red-50/60 dark:bg-red-950/30 dark:hover:bg-red-950/50';
  }
  
  // 4-7 days - yellow
  if (daysLeft <= 7) {
    return 'bg-yellow-50/40 hover:bg-yellow-50/60 dark:bg-yellow-950/30 dark:hover:bg-yellow-950/50';
  }
  
  // 8-14 days - blue
  if (daysLeft <= 14) {
    return 'bg-blue-50/40 hover:bg-blue-50/60 dark:bg-blue-950/30 dark:hover:bg-blue-950/50';
  }
  
  // More than 14 days - default
  return 'hover:bg-muted/50';
};

/**
 * Calculate asset progress percentage based on asset actions
 */
export const getAssetProgress = (actionableItems: any[] | undefined): number | null => {
  if (!actionableItems || actionableItems.length === 0) {
    return null;
  }
  
  // Calculate average progress across all assets
  let totalProgress = 0;
  let assetsWithActions = 0;
  
  actionableItems.forEach(asset => {
    if (asset.actions && asset.actions.length > 0) {
      // Calculate progress for this asset based on actions
      const assetProgress = calculateAssetProgress(asset.actions);
      totalProgress += assetProgress;
      assetsWithActions++;
    } else {
      // Assets without actions: consider completed if status is Done
      if (asset.is_completed === true || asset.status === 'Done') {
        totalProgress += 100;
      }
      assetsWithActions++;
    }
  });
  
  if (assetsWithActions === 0) return 0;
  
  return Math.round(totalProgress / assetsWithActions);
};

/**
 * Check if individual asset is completed
 */
export const isAssetCompleted = (asset: any): boolean => {
  return asset.is_completed === true || asset.status === 'Done';
};

/**
 * Get bullet point color based on status
 */
export const getBulletColor = (status: string): string => {
  switch (status) {
    case 'Not Started':
      return 'bg-gray-400';
    case 'In Progress':
      return 'bg-[#FFD666]';
    case 'Babysit':
      return 'bg-purple-500';
    case 'Done':
      return 'bg-green-600';
    case 'On Hold':
      return 'bg-orange-500';
    case 'Canceled':
      return 'bg-red-500';
    case 'On List Lightroom':
      return 'bg-pink-500';
    case 'On Review':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-400';
  }
};

/**
 * Calculate project status from assets
 * IMPORTANT: This should NOT override manually set statuses like "On Hold", "Canceled", etc.
 * ⚡ CRITICAL: Also preserves "In Progress" to prevent visual jumping during action checks
 */
export const calculateProjectStatus = (assets: any[] | undefined, currentProjectStatus?: string, sortedStatuses?: Array<{name: string; order: number}>): string => {
  // List of statuses that are manually set by user and should NOT be auto-calculated
  const manualStatuses = [
    'on hold', 
    'canceled', 
    'babysit', 
    'on review', 
    'on list lightroom',
    'in review',
    'in queue lightroom',
    'done'
  ];
  
  // If current status is a manual status, preserve it
  if (currentProjectStatus && manualStatuses.includes(currentProjectStatus.toLowerCase())) {
    return currentProjectStatus;
  }
  
  // ⚡ CRITICAL FIX: Preserve "In Progress" status to prevent visual jumping
  // When project is "In Progress", only change to "Done" if ALL assets completed
  // Never change FROM "In Progress" to "Not Started" - this causes visual jumping!
  if (currentProjectStatus && currentProjectStatus.toLowerCase() === 'in progress') {
    // Check if ALL assets are completed
    const allCompleted = assets && assets.length > 0 && 
                        assets.every(a => a.is_completed === true || a.status === 'Done');
    
    if (allCompleted) {
      return 'Done';
    } else {
      // Keep "In Progress" - don't recalculate to prevent jumping!
      return currentProjectStatus;
    }
  }
  
  // If no assets, keep current status or default to first status
  if (!assets || assets.length === 0) {
    return currentProjectStatus || (sortedStatuses && sortedStatuses.length > 0 ? sortedStatuses[0].name : 'Not Started');
  }
  
  // Calculate based on asset statuses (only for "Not Started" or undefined status)
  const completedAssets = assets.filter(a => a.is_completed === true || a.status === 'Done').length;
  const totalAssets = assets.length;
  
  if (completedAssets === totalAssets) {
    return 'Done';
  } else if (completedAssets > 0) {
    return 'In Progress';
  } else {
    // Find "Not Started" status or use first status
    const notStartedStatus = sortedStatuses?.find(s => 
      s.name.toLowerCase() === 'not started' || 
      s.name.toLowerCase() === 'notstarted' ||
      s.name.toLowerCase() === 'todo' ||
      s.name.toLowerCase() === 'to do'
    );
    return notStartedStatus?.name || (sortedStatuses && sortedStatuses.length > 0 ? sortedStatuses[0].name : 'Not Started');
  }
};
