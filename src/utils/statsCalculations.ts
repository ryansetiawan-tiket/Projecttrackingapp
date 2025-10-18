// Stats Calculations - Core utility functions

import { Project } from '../types/project';

// ============================================================================
// DATE UTILITIES
// ============================================================================

export function getQuarterFromDate(date: string): { quarter: number; year: number } {
  const d = new Date(date);
  return {
    quarter: Math.floor(d.getMonth() / 3) + 1,
    year: d.getFullYear()
  };
}

export function getCurrentQuarter(): { quarter: number; year: number } {
  const now = new Date();
  return {
    quarter: Math.floor(now.getMonth() / 3) + 1,
    year: now.getFullYear()
  };
}

export function getQuarterString(quarter: number, year: number): string {
  return `Q${quarter} ${year}`;
}

export function calculateDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getDaysUntil(date: string): number {
  const now = new Date();
  const targetDate = new Date(date);
  const diffTime = targetDate.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getMonthName(monthIndex: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex];
}

export function isWithinLastNDays(date: string, days: number): boolean {
  const now = new Date();
  const targetDate = new Date(date);
  const diffTime = now.getTime() - targetDate.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= days;
}

// ============================================================================
// COLOR UTILITIES
// ============================================================================

export function getStatusColor(status: string, statuses: any[]): string {
  const statusObj = statuses.find(s => s.name === status);
  return statusObj?.color || 'hsl(0, 0%, 50%)';
}

export function getVerticalColor(vertical: string): string {
  const verticals = JSON.parse(localStorage.getItem('verticals') || '[]');
  const verticalObj = verticals.find((v: any) => v.name === vertical);
  return verticalObj?.color || 'hsl(0, 0%, 50%)';
}

export function getTypeColor(type: string, types: any[]): string {
  const typeObj = types.find(t => t.name === type);
  return typeObj?.color || 'hsl(0, 0%, 50%)';
}

// ============================================================================
// PERCENTAGE UTILITIES
// ============================================================================

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100 * 10) / 10; // Round to 1 decimal
}

export function safeAverage(total: number, count: number): number {
  if (count === 0) return 0;
  return Math.round((total / count) * 10) / 10; // Round to 1 decimal
}

// ============================================================================
// DISTRIBUTION UTILITIES
// ============================================================================

export function calculateDistribution(
  counts: number[],
  ranges: Array<{ min: number; max: number; label: string }>
): Array<{ range: string; count: number }> {
  return ranges.map(range => ({
    range: range.label,
    count: counts.filter(c => c >= range.min && c <= range.max).length
  }));
}

export function getAssetDistributionRanges() {
  return [
    { min: 0, max: 5, label: '0-5' },
    { min: 6, max: 10, label: '6-10' },
    { min: 11, max: 20, label: '11-20' },
    { min: 21, max: 50, label: '21-50' },
    { min: 51, max: Infinity, label: '51+' }
  ];
}

export function getCollaboratorDistributionRanges() {
  return [
    { min: 1, max: 1, label: 'Solo (1)' },
    { min: 2, max: 3, label: 'Small (2-3)' },
    { min: 4, max: 6, label: 'Medium (4-6)' },
    { min: 7, max: Infinity, label: 'Large (7+)' }
  ];
}

// ============================================================================
// FOLDER DEPTH CALCULATION
// ============================================================================

export function calculateFolderDepth(folder: any): number {
  let depth = 0;
  let current = folder;
  
  // Safety limit to prevent infinite loops
  const maxDepth = 10;
  
  while (current && current.parentId && depth < maxDepth) {
    depth++;
    // In practice, we'd need to find the parent from a folder map
    // For now, we'll just return the depth based on path separators
    break;
  }
  
  // Alternative: count path separators if path exists
  if (folder.path) {
    const pathParts = folder.path.split('/').filter(Boolean);
    return pathParts.length;
  }
  
  return depth;
}

// ============================================================================
// PROJECT FILTERING
// ============================================================================

export function isProjectCompleted(project: Project): boolean {
  const status = project.status?.toLowerCase() || '';
  return status.includes('done') || 
         status.includes('complete') || 
         status.includes('finished') ||
         status.includes('delivered');
}

export function isProjectActive(project: Project): boolean {
  return !project.isArchived && !isProjectCompleted(project);
}

export function isProjectInQuarter(
  project: Project,
  quarter: number,
  year: number
): boolean {
  if (!project.start_date) return false;
  const projectQuarter = getQuarterFromDate(project.start_date);
  return projectQuarter.quarter === quarter && projectQuarter.year === year;
}

// ============================================================================
// ASSET COUNTING
// ============================================================================

export function getTotalAssetsForProject(project: Project): number {
  const fileCount = project.assets?.length || 0;
  const lightroomCount = project.lightroomAssets?.length || 0;
  const gdriveCount = project.gdriveAssets?.length || 0;
  return fileCount + lightroomCount + gdriveCount;
}

export function getTotalActionsForProject(project: Project): number {
  let total = 0;
  
  // Count actions from file assets
  project.assets?.forEach(asset => {
    total += asset.actions?.length || 0;
  });
  
  // Count actions from lightroom assets
  project.lightroomAssets?.forEach(asset => {
    total += asset.actions?.length || 0;
  });
  
  // Count actions from gdrive assets
  project.gdriveAssets?.forEach(asset => {
    total += asset.actions?.length || 0;
  });
  
  return total;
}

// ============================================================================
// SORTING UTILITIES
// ============================================================================

export function sortByCount<T extends { count: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.count - a.count);
}

export function sortByPercentage<T extends { percentage: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.percentage - a.percentage);
}

export function sortByProjectCount<T extends { projectCount: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.projectCount - a.projectCount);
}

// ============================================================================
// MAP HELPERS
// ============================================================================

export function incrementMapValue<K>(map: Map<K, number>, key: K): void {
  map.set(key, (map.get(key) || 0) + 1);
}

export function mapToDistribution<T extends { count: number; percentage: number }>(
  map: Map<string, number>,
  total: number,
  createItem: (key: string, count: number, percentage: number) => T
): T[] {
  return Array.from(map.entries()).map(([key, count]) => 
    createItem(key, count, calculatePercentage(count, total))
  );
}

// ============================================================================
// VALIDATION
// ============================================================================

export function isValidDate(dateString: string | undefined): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

export function hasAssets(project: Project): boolean {
  return getTotalAssetsForProject(project) > 0;
}

export function hasCollaborators(project: Project): boolean {
  return (project.collaborators?.length || 0) > 0;
}
