import { AssetAction } from '../types/project';

/**
 * Calculate progress percentage based on completed actions
 * Returns 0 if no actions exist (backward compatibility)
 */
export function calculateAssetProgress(actions?: AssetAction[]): number {
  if (!actions || actions.length === 0) {
    return 0;
  }
  
  const completedCount = actions.filter(action => action.completed).length;
  return Math.round((completedCount / actions.length) * 100);
}

/**
 * Calculate overall project progress from actionable items
 * Returns null if no actionable items exist
 */
export function calculateProjectProgress(actionableItems: Array<{ actions?: AssetAction[] }> | undefined): number | null {
  if (!actionableItems || actionableItems.length === 0) {
    return null;
  }

  let totalProgress = 0;
  let assetsWithActions = 0;

  actionableItems.forEach(asset => {
    if (asset.actions && asset.actions.length > 0) {
      const assetProgress = calculateAssetProgress(asset.actions);
      totalProgress += assetProgress;
      assetsWithActions++;
    }
  });

  if (assetsWithActions === 0) {
    return null;
  }

  return Math.round(totalProgress / assetsWithActions);
}

/**
 * Get progress color based on percentage (CSS color, not class)
 */
export function getProgressColorValue(progress: number): string {
  if (progress === 0) return '#94a3b8'; // gray
  if (progress < 33) return '#f59e0b'; // orange/amber
  if (progress < 66) return '#3b82f6'; // blue
  if (progress < 100) return '#10b981'; // green
  return '#22c55e'; // bright green for 100%
}

/**
 * Get progress color based on percentage (Tailwind class)
 */
export function getProgressColor(progress: number): string {
  if (progress === 0) return 'bg-gray-300 dark:bg-gray-600';
  if (progress < 33) return 'bg-amber-500';
  if (progress < 66) return 'bg-blue-500';
  if (progress < 100) return 'bg-green-500';
  return 'bg-green-600';
}

/**
 * Format progress display text
 */
export function formatProgressText(progress: number, actionCount: number): string {
  if (actionCount === 0) return 'No actions';
  const completed = Math.round((progress / 100) * actionCount);
  return `${completed}/${actionCount}`;
}
