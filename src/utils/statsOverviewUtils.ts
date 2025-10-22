// Stats Overview Utilities - Data calculations for redesigned Overview tab

import { Project } from '../types/project';
import { Vertical } from '../hooks/useVerticals';
import { Status } from '../types/status';
import { 
  isProjectCompleted, 
  getTotalAssetsForProject,
  getTotalActionsForProject,
  calculatePercentage 
} from './statsCalculations';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CompletionProgress {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  completionRate: number;
  completionMessage: string;
}

export interface TopCollaborator {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  projectCount: number;
}

export interface TopVertical {
  name: string;
  color: string;
  count: number;
  total: number;
  percentage: number;
  emoji: string;
  message: string;
}

export interface FastestProject {
  name: string;
  days: number;
  message: string;
}

export interface LongestProject {
  name: string;
  days: number;
  message: string;
}

export interface BusiestMonth {
  month: string;
  year: number;
  totalActivities: number;
  projects: number;
  assets: number;
  actions: number;
  comment: string;
}

export interface MostActiveCollaborator {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  simultaneousProjects: number;
  totalProjects: number;
  message: string;
}

export interface BestPeriod {
  dateRange: string;
  projects: number;
  assets: number;
  actions: number;
  message: string;
}

export interface VerticalBreakdown {
  name: string;
  color: string;
  count: number;
  percentage: number;
  completedCount: number;
  completionRate: number;
}

export interface EfficiencyStats {
  avgDuration: {
    value: number;
    label: string;
    comment: string;
  };
  avgAssets: {
    value: number;
    label: string;
    comment: string;
  };
  busiestMonth: {
    month: string;
    year: number;
    totalActivities: number;
    projects: number;
    assets: number;
    actions: number;
    comment: string;
  } | null;
}

export interface WeeklyPulse {
  projectsCreated: number;
  assetsAdded: number;
  actionsCompleted: number;
  trend: 'up' | 'down' | 'same';
  trendMessage: string;
}

export interface TeamSnapshot {
  totalCollaborators: number;
  topCollaborators: TopCollaborator[];
  newCollaborators: string[];
  topSquadMessage: string;
}

export interface OverviewData {
  performanceSummary: CompletionProgress & {
    topCollaborators: TopCollaborator[];
    totalCollaborators: number;
  };
  highlights: {
    topVertical: TopVertical | null;
    fastestProject: FastestProject | null;
    longestProject: LongestProject | null;
    busiestMonth: BusiestMonth | null;
    mostActiveCollaborator: MostActiveCollaborator | null;
    bestWeek: BestPeriod | null;
  };
  verticalBreakdown: {
    data: VerticalBreakdown[];
    caption: string;
  };
  efficiencyStats: EfficiencyStats;
  weeklyPulse: WeeklyPulse;
  teamSnapshot: TeamSnapshot;
  closingMessage: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getCollaboratorName(id: string, collaborators: any[]): string {
  const collab = collaborators.find(c => c.id === id);
  return collab?.name || collab?.nickname || 'Unknown';
}

function getCollaboratorInitials(id: string, collaborators: any[]): string {
  const name = getCollaboratorName(id, collaborators);
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

function getCollaboratorAvatar(id: string, collaborators: any[]): string | undefined {
  const collab = collaborators.find(c => c.id === id);
  return collab?.photo_url;
}

function getProjectDuration(project: Project): number {
  if (!project.start_date || !project.completed_at) return 0;
  
  const start = new Date(project.start_date);
  const end = new Date(project.completed_at);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function isProjectOnTime(project: Project): boolean {
  // Projects without deadline cannot be "on-time" or "late"
  // This function should only be called on projects with due_date
  if (!project.completed_at || !project.due_date) return true; // Fallback for safety
  return new Date(project.completed_at) <= new Date(project.due_date);
}

function getProjectDelay(project: Project): number {
  if (!project.completed_at || !project.due_date) return 0;
  
  const completed = new Date(project.completed_at);
  const deadline = new Date(project.due_date);
  
  if (completed <= deadline) return 0;
  
  const diffTime = completed.getTime() - deadline.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function getWeekKey(date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const week = Math.ceil(d.getDate() / 7);
  return `${year}-${month}-${week}`;
}

function formatWeekRange(weekKey: string, projects: Project[]): string {
  // Find projects in this week to get actual date range
  const weekProjects = projects.filter(p => getWeekKey(p.created_at) === weekKey);
  if (weekProjects.length === 0) return 'Unknown';
  
  const dates = weekProjects.map(p => new Date(p.created_at)).sort((a, b) => a.getTime() - b.getTime());
  const start = dates[0];
  const end = dates[dates.length - 1];
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return `${monthNames[start.getMonth()]} ${start.getDate()}–${end.getDate()}`;
}

function getVerticalEmoji(verticalName: string): string {
  const emojiMap: Record<string, string> = {
    'Loyalty': '💛',
    'Growth': '🚀',
    'Disco': '🪩',
    'Retention': '🔄',
    'Acquisition': '🎯',
    'Brand': '✨',
    'Campaign': '📢',
    'Social': '📱',
  };
  return emojiMap[verticalName] || '🎨';
}

// ============================================================================
// COMPLETION PROGRESS
// ============================================================================

function getCompletionProgress(projects: Project[]): CompletionProgress {
  const total = projects.length;
  const completed = projects.filter(p => isProjectCompleted(p)).length;
  const inProgress = total - completed;
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    totalProjects: total,
    completedProjects: completed,
    inProgressProjects: inProgress,
    completionRate: rate,
    completionMessage: getCompletionMessage(rate)
  };
}

function getCompletionMessage(rate: number): string {
  if (rate >= 70) return `🎉 ${rate}% completion rate! You\'re crushing it!`;
  if (rate >= 50) return `☕ ${rate}% completion rate! The other half might still be on coffee break.`;
  if (rate >= 30) return `🏃 ${rate}% completion rate - room to grow, but we all start somewhere!`;
  return `🌱 ${rate}% done! Every masterpiece takes time.`;
}

// ============================================================================
// TOP COLLABORATORS
// ============================================================================

function getTopCollaborators(projects: Project[], collaborators: any[], limit: number = 3): TopCollaborator[] {
  const collaboratorCounts = new Map<string, number>();
  
  projects.forEach(project => {
    project.collaborators?.forEach((collab) => {
      const collabId = typeof collab === 'string' ? collab : collab.id;
      collaboratorCounts.set(collabId, (collaboratorCounts.get(collabId) || 0) + 1);
    });
  });
  
  return Array.from(collaboratorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({
      id,
      name: getCollaboratorName(id, collaborators),
      initials: getCollaboratorInitials(id, collaborators),
      avatar: getCollaboratorAvatar(id, collaborators),
      projectCount: count
    }));
}

// ============================================================================
// TOP VERTICAL
// ============================================================================

function getTopVertical(projects: Project[], verticals: Vertical[]): TopVertical | null {
  if (projects.length === 0) return null;
  
  const verticalCounts = new Map<string, number>();
  
  projects.forEach(project => {
    const verticalId = project.vertical;
    if (verticalId) {
      verticalCounts.set(verticalId, (verticalCounts.get(verticalId) || 0) + 1);
    }
  });
  
  const topEntry = Array.from(verticalCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];
  
  if (!topEntry) return null;
  
  const [verticalId, count] = topEntry;
  const vertical = verticals.find(v => v.id === verticalId);
  
  if (!vertical) return null;
  
  const percentage = Math.round((count / projects.length) * 100);
  const emoji = getVerticalEmoji(vertical.name);
  
  return {
    name: vertical.name,
    color: vertical.color,
    count,
    total: projects.length,
    percentage,
    emoji,
    message: `🔥 Top Category: ${vertical.name} - ${count} out of ${projects.length} projects (${percentage}%) are pure ${vertical.name.toLowerCase()} grind ${emoji}`
  };
}

// ============================================================================
// FASTEST PROJECT
// ============================================================================

function getFastestProject(projects: Project[]): FastestProject | null {
  const completedProjects = projects.filter(p => isProjectCompleted(p) && p.start_date && p.completed_at);
  
  if (completedProjects.length === 0) return null;
  
  let fastest = completedProjects[0];
  let minDays = getProjectDuration(fastest);
  
  completedProjects.forEach(project => {
    const duration = getProjectDuration(project);
    if (duration > 0 && duration < minDays) {
      minDays = duration;
      fastest = project;
    }
  });
  
  const message = getFastestProjectMessage(fastest.project_name, minDays);
  
  return {
    name: fastest.project_name,
    days: minDays,
    message
  };
}

function getFastestProjectMessage(name: string, days: number): string {
  if (days <= 3) return `⚡ Fastest Project: ${name} - blink and you\'d miss it (${days} days)! ⚡`;
  if (days <= 7) return `⚡ Fastest Project: ${name} - wrapped up in just ${days} days! 🎯`;
  return `⚡ Fastest Project: ${name} - the speedy one at ${days} days! 🏃`;
}

// ============================================================================
// LONGEST PROJECT
// ============================================================================

function getLongestProject(projects: Project[]): LongestProject | null {
  // Filter projects with both start_date and due_date (planned duration)
  const projectsWithTimeline = projects.filter(p => p.start_date && p.due_date);
  
  if (projectsWithTimeline.length === 0) return null;
  
  let longest = projectsWithTimeline[0];
  let maxDays = getPlannedDuration(longest);
  
  projectsWithTimeline.forEach(project => {
    const duration = getPlannedDuration(project);
    if (duration > maxDays) {
      maxDays = duration;
      longest = project;
    }
  });
  
  const message = getLongestProjectMessage(longest.project_name, maxDays);
  
  return {
    name: longest.project_name,
    days: maxDays,
    message
  };
}

function getPlannedDuration(project: Project): number {
  if (!project.start_date || !project.due_date) return 0;
  
  const start = new Date(project.start_date);
  const end = new Date(project.due_date);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function getLongestProjectMessage(name: string, days: number): string {
  if (days >= 90) return `the epic saga! 🏛️`;
  if (days >= 60) return `good things take time 🐢`;
  if (days >= 30) return `marathon project mode 🏃`;
  return `took its sweet time ☕`;
}

// ============================================================================
// BUSIEST MONTH
// ============================================================================

function getBusiestMonth(projects: Project[]): BusiestMonth | null {
  if (projects.length === 0) return null;
  
  const monthlyStats = new Map<string, { projects: number; assets: number; actions: number }>();
  
  projects.forEach(project => {
    const date = new Date(project.created_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const current = monthlyStats.get(monthKey) || { projects: 0, assets: 0, actions: 0 };
    
    current.projects++;
    current.assets += getTotalAssetsForProject(project);
    current.actions += getTotalActionsForProject(project);
    
    monthlyStats.set(monthKey, current);
  });
  
  if (monthlyStats.size === 0) return null;
  
  let busiestMonth = '';
  let maxActivities = 0;
  
  monthlyStats.forEach((stats, monthKey) => {
    const totalActivities = stats.projects + stats.assets + stats.actions;
    if (totalActivities > maxActivities) {
      maxActivities = totalActivities;
      busiestMonth = monthKey;
    }
  });
  
  const stats = monthlyStats.get(busiestMonth)!;
  const [year, monthIndex] = busiestMonth.split('-').map(Number);
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const month = monthNames[monthIndex];
  
  const totalActivities = stats.projects + stats.assets + stats.actions;
  
  return {
    month,
    year,
    totalActivities,
    projects: stats.projects,
    assets: stats.assets,
    actions: stats.actions,
    comment: getBusiestMonthMessage(month, stats.projects, totalActivities)
  };
}

function getBusiestMonthMessage(month: string, projects: number, activities: number): string {
  // Very high activity (200+)
  if (activities >= 200) {
    if (projects >= 20) return `absolute chaos! 🤯 someone get this person a medal`;
    if (projects >= 15) return `productivity beast mode unlocked 🦁 take a break maybe?`;
    if (projects >= 10) return `this is insane! 🔥 are you a productivity robot?`;
    return `absolute chaos! 🤯 but make it organized`;
  }
  
  // High activity (100-199)
  if (activities >= 100) {
    if (projects >= 15) return `juggling ${projects} projects like a pro 🤹 respect!`;
    if (projects >= 10) return `${projects} projects?! someone's on fire 🔥`;
    if (projects >= 8) return `beast mode activated 🦁 caffeine levels: maximum`;
    return `super productive! 🚀 your future self says thanks`;
  }
  
  // Medium-high activity (50-99)
  if (activities >= 50) {
    if (projects >= 10) return `${projects} projects, ${activities} things done - legendary! ⭐`;
    if (projects >= 7) return `crushing it with ${projects} projects! 💪 goals`;
    if (projects >= 5) return `solid hustle! 🏃 ${month} was kind to you`;
    return `productivity on point! 🎯 keep it up`;
  }
  
  // Medium activity (20-49)
  if (activities >= 20) {
    if (projects >= 5) return `${projects} projects handled smoothly 👌 nice balance`;
    if (projects >= 3) return `steady grind! 🔨 consistency wins`;
    return `keeping busy! 📊 quality over quantity`;
  }
  
  // Low activity (<20)
  if (projects >= 3) return `${projects} projects in focus mode 🎯 depth over breadth`;
  if (projects >= 2) return `quality work > quantity 💎 intentional productivity`;
  return `chill vibes only ☕ sometimes less is more`;
}

// ============================================================================
// MOST ACTIVE COLLABORATOR
// ============================================================================

function getMostActiveCollaborator(projects: Project[], collaborators: any[]): MostActiveCollaborator | null {
  const collabCounts = new Map<string, number>();
  
  projects.forEach(project => {
    project.collaborators?.forEach((collab) => {
      const collabId = typeof collab === 'string' ? collab : collab.id;
      collabCounts.set(collabId, (collabCounts.get(collabId) || 0) + 1);
    });
  });
  
  if (collabCounts.size === 0) return null;
  
  const [topId, count] = Array.from(collabCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];
  
  // Calculate simultaneous projects (in-progress)
  const inProgressProjects = projects.filter(p => !isProjectCompleted(p));
  const simultaneousCount = inProgressProjects.filter(p => 
    p.collaborators?.some(c => {
      const cId = typeof c === 'string' ? c : c.id;
      return cId === topId;
    })
  ).length;
  
  const name = getCollaboratorName(topId, collaborators);
  const message = getMostActiveMessage(name, simultaneousCount, count);
  
  return {
    id: topId,
    name,
    initials: getCollaboratorInitials(topId, collaborators),
    avatar: getCollaboratorAvatar(topId, collaborators),
    simultaneousProjects: simultaneousCount,
    totalProjects: count,
    message
  };
}

function getMostActiveMessage(name: string, simultaneous: number, total: number): string {
  if (simultaneous >= 3) {
    return `👥 Most Active: ${name} - juggling ${simultaneous} projects at once! 🤹`;
  }
  if (total >= 5) {
    return `👥 MVP: ${name} - contributed to ${total} projects! 🏆`;
  }
  return `👥 Most Active Collaborator: ${name} - found in ${simultaneous} simultaneous projects 😂`;
}

// ============================================================================
// BEST WEEK
// ============================================================================

function getBestWeek(projects: Project[]): BestPeriod | null {
  const weeklyStats = new Map<string, { projects: number; assets: number; actions: number }>();
  
  projects.forEach(project => {
    const weekKey = getWeekKey(project.created_at);
    const current = weeklyStats.get(weekKey) || { projects: 0, assets: 0, actions: 0 };
    
    current.projects++;
    current.assets += getTotalAssetsForProject(project);
    current.actions += getTotalActionsForProject(project);
    
    weeklyStats.set(weekKey, current);
  });
  
  if (weeklyStats.size === 0) return null;
  
  let bestWeek = '';
  let maxActions = 0;
  
  weeklyStats.forEach((stats, weekKey) => {
    if (stats.actions > maxActions) {
      maxActions = stats.actions;
      bestWeek = weekKey;
    }
  });
  
  const stats = weeklyStats.get(bestWeek)!;
  const dateRange = formatWeekRange(bestWeek, projects);
  
  return {
    dateRange,
    projects: stats.projects,
    assets: stats.assets,
    actions: stats.actions,
    message: getBestWeekMessage(dateRange, stats)
  };
}

function getBestWeekMessage(dateRange: string, stats: { projects: number; assets: number; actions: number }): string {
  if (stats.actions >= 100) {
    return `🎯 Best Week: ${dateRange} - ${stats.projects} projects, ${stats.assets} assets, ${stats.actions} actions... are you okay? 😅`;
  }
  if (stats.actions >= 50) {
    return `🎯 Best Week: ${dateRange} - absolute beast mode! 🦁`;
  }
  return `🎯 Best Week: ${dateRange} - solid hustle! 💼`;
}

// ============================================================================
// VERTICAL BREAKDOWN
// ============================================================================

function getVerticalBreakdown(projects: Project[], verticals: Vertical[]): VerticalBreakdown[] {
  const breakdown: VerticalBreakdown[] = [];
  
  verticals.forEach(vertical => {
    const verticalProjects = projects.filter(p => p.vertical === vertical.id);
    const completed = verticalProjects.filter(p => isProjectCompleted(p));
    
    if (verticalProjects.length > 0) {
      breakdown.push({
        name: vertical.name,
        color: vertical.color,
        count: verticalProjects.length,
        percentage: Math.round((verticalProjects.length / projects.length) * 100),
        completedCount: completed.length,
        completionRate: Math.round((completed.length / verticalProjects.length) * 100)
      });
    }
  });
  
  return breakdown.sort((a, b) => b.count - a.count);
}

function getVerticalCaption(breakdown: VerticalBreakdown[]): string {
  if (breakdown.length === 0) return '';
  
  const [top] = breakdown;
  
  if (top.percentage > 50) {
    return `${top.name}'s stealing the spotlight 🏆, while others are chilling on the bench.`;
  }
  
  if (breakdown.length >= 2 && Math.abs(breakdown[0].percentage - breakdown[1].percentage) < 10) {
    return `${breakdown[0].name} and ${breakdown[1].name} are tied - competitive energy! ⚡`;
  }
  
  return `Pretty balanced across categories - nice variety! 🎨`;
}

// ============================================================================
// EFFICIENCY STATS
// ============================================================================
// 🔧 COMPLETED_AT FIX (v2.7.1):
// - Some Done projects don't have completed_at (created before this feature)
// - Now using fallback: completed_at || updated_at for calculations
// - ProjectForm auto-sets completed_at when status changes to "Done"
// - ProjectFormData interface updated to include completed_at field

function getEfficiencyStats(projects: Project[]): EfficiencyStats {
  // Step 1: Filter completed projects (with fallback for missing completed_at)
  // 🔧 FIX: Don't require completed_at - use fallback to due_date or updated_at
  const completedProjects = projects.filter(p => {
    const isCompleted = isProjectCompleted(p);
    const hasStartDate = !!p.start_date;
    // Accept projects without completed_at if they have due_date or updated_at as fallback
    const hasCompletionDate = !!(p.completed_at || p.due_date || p.updated_at);
    return isCompleted && hasStartDate && hasCompletionDate;
  });
  
  // Debug: Check all projects first
  console.log('🔍 ALL PROJECTS DEBUG:', {
    total: projects.length,
    doneStatusCount: projects.filter(p => isProjectCompleted(p)).length,
    projectStatuses: projects.map(p => ({ name: p.project_name, status: p.status })),
    completedCount: completedProjects.length,
    completedProjects: completedProjects.map(p => ({
      name: p.project_name,
      status: p.status,
      start_date: p.start_date,
      due_date: p.due_date,
      completed_at: p.completed_at,
      updated_at: p.updated_at,
      effectiveCompletedAt: p.completed_at || p.due_date || p.updated_at
    }))
  });
  
  // Average Duration - use fallback completion date
  const durations = completedProjects.map(p => {
    const effectiveCompletedAt = p.completed_at || p.due_date || p.updated_at;
    if (!effectiveCompletedAt || !p.start_date) return 0;
    const days = Math.ceil((new Date(effectiveCompletedAt).getTime() - new Date(p.start_date).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }).filter(d => d > 0);
  
  const avgDuration = durations.length > 0 
    ? durations.reduce((a, b) => a + b, 0) / durations.length 
    : 0;
  
  // Average Assets
  const avgAssets = projects.length > 0
    ? projects.reduce((sum, p) => sum + getTotalAssetsForProject(p), 0) / projects.length
    : 0;
  
  // Busiest Month
  const busiestMonth = getBusiestMonth(projects);
  
  console.log('🔍 BUSIEST MONTH DEBUG:', busiestMonth);
  
  return {
    avgDuration: {
      value: parseFloat(avgDuration.toFixed(1)),
      label: 'Project Duration',
      comment: getDurationComment(avgDuration)
    },
    avgAssets: {
      value: parseFloat(avgAssets.toFixed(1)),
      label: 'Assets per Project',
      comment: getAssetsComment(avgAssets)
    },
    busiestMonth: busiestMonth ? {
      month: busiestMonth.month,
      year: busiestMonth.year,
      totalActivities: busiestMonth.totalActivities,
      projects: busiestMonth.projects,
      assets: busiestMonth.assets,
      actions: busiestMonth.actions,
      comment: busiestMonth.comment
    } : null
  };
}

function getDurationComment(days: number): string {
  if (days <= 3) return 'lightning fast! ⚡';
  if (days <= 7) return 'not bad, not Netflix-binge-long either 🍿';
  if (days <= 14) return 'about right for quality work 👌';
  if (days <= 30) return 'slow and steady wins the race 🐢';
  return 'taking the scenic route - Rome wasn\'t built in a day! 🏛️';
}

function getAssetsComment(count: number): string {
  if (count <= 2) return 'lean and mean! 💪';
  if (count <= 5) return 'solid amount of deliverables 📦';
  if (count <= 10) return 'packed with content! 🎁';
  return 'asset factory mode activated! 🏭';
}

// ============================================================================
// WEEKLY PULSE
// ============================================================================

function getWeeklyPulse(projects: Project[]): WeeklyPulse {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  // This week
  const thisWeekProjects = projects.filter(p => 
    new Date(p.created_at) >= weekAgo
  );
  const thisWeekAssets = thisWeekProjects.reduce((sum, p) => 
    sum + getTotalAssetsForProject(p), 0
  );
  const thisWeekActions = thisWeekProjects.reduce((sum, p) => 
    sum + getTotalActionsForProject(p), 0
  );
  
  // Last week
  const lastWeekProjects = projects.filter(p => {
    const date = new Date(p.created_at);
    return date >= twoWeeksAgo && date < weekAgo;
  });
  const lastWeekActions = lastWeekProjects.reduce((sum, p) => 
    sum + getTotalActionsForProject(p), 0
  );
  
  // Determine trend
  let trend: 'up' | 'down' | 'same' = 'same';
  if (thisWeekActions > lastWeekActions) trend = 'up';
  else if (thisWeekActions < lastWeekActions) trend = 'down';
  
  const trendMessage = getWeeklyTrendMessage(trend);
  
  return {
    projectsCreated: thisWeekProjects.length,
    assetsAdded: thisWeekAssets,
    actionsCompleted: thisWeekActions,
    trend,
    trendMessage
  };
}

function getWeeklyTrendMessage(trend: 'up' | 'down' | 'same'): string {
  if (trend === 'up') {
    return 'Up from last week - productivity\'s on fire 🔥 (and maybe your brain too 😵)';
  }
  if (trend === 'down') {
    return 'Taking it slower this week - self-care is important too! 🧘';
  }
  return 'Steady pace - consistency is key! 📊';
}

// ============================================================================
// TEAM SNAPSHOT
// ============================================================================

function getTeamSnapshot(projects: Project[], collaborators: any[]): TeamSnapshot {
  const allCollabIds = new Set<string>();
  projects.forEach(p => {
    p.collaborators?.forEach((collab) => {
      const collabId = typeof collab === 'string' ? collab : collab.id;
      allCollabIds.add(collabId);
    });
  });
  
  const topCollabs = getTopCollaborators(projects, collaborators, 4);
  
  // Get new collaborators (would need joinedDate field - for now return empty)
  const newCollabs: string[] = [];
  
  const topSquadMessage = getTopSquadMessage(topCollabs);
  
  return {
    totalCollaborators: allCollabIds.size,
    topCollaborators: topCollabs,
    newCollaborators: newCollabs,
    topSquadMessage
  };
}

function getTopSquadMessage(topCollabs: TopCollaborator[]): string {
  if (topCollabs.length === 0) {
    return 'Solo journey so far - independent creator mode! 🎨';
  }
  
  if (topCollabs.length === 1) {
    return `Dynamic duo with ${topCollabs[0].name} - Batman & Robin vibes 🦇`;
  }
  
  if (topCollabs.length <= 3) {
    const names = topCollabs.map(c => c.name).join(', ');
    return `Core team: ${names} - dream team right here! 🌟`;
  }
  
  const names = topCollabs.slice(0, 4).map(c => c.name).join(', ');
  return `Top squad: ${names} - these legends never sleep 😎`;
}

// ============================================================================
// CLOSING MESSAGE
// ============================================================================

function getClosingMessage(completionRate: number, recentActivity: 'high' | 'normal' | 'low'): string {
  const messages = {
    high: [
      'Keep it up - your projects need you (and probably caffeine). ☕💪',
      'Great work! But maybe take a breather? 😅',
      'Productivity beast mode activated! 🦁'
    ],
    normal: [
      'You\'re doing great! One project at a time 🎯',
      'Slow progress is still progress - keep going! 🌱',
      'Halfway done! Time for a snack break 🍪'
    ],
    low: [
      'Remember: Rome wasn\'t built in a day! 🏛️',
      'Every completed project is a win - celebrate the small stuff! 🎉',
      'Time to get back in the game! 💪'
    ]
  };
  
  const pool = messages[recentActivity];
  return pool[Math.floor(Math.random() * pool.length)];
}

function getActivityLevel(pulse: WeeklyPulse): 'high' | 'normal' | 'low' {
  if (pulse.actionsCompleted > 100) return 'high';
  if (pulse.actionsCompleted > 30) return 'normal';
  return 'low';
}

// ============================================================================
// MAIN CALCULATOR
// ============================================================================

export function calculateOverviewData(
  projects: Project[],
  verticals: Vertical[],
  statuses: Status[],
  collaborators: any[]
): OverviewData {
  const completionProgress = getCompletionProgress(projects);
  const topCollaborators = getTopCollaborators(projects, collaborators, 3);
  const teamSnapshot = getTeamSnapshot(projects, collaborators);
  const weeklyPulse = getWeeklyPulse(projects);
  const verticalBreakdownData = getVerticalBreakdown(projects, verticals);
  
  return {
    performanceSummary: {
      ...completionProgress,
      topCollaborators,
      totalCollaborators: teamSnapshot.totalCollaborators
    },
    highlights: {
      topVertical: getTopVertical(projects, verticals),
      fastestProject: getFastestProject(projects),
      longestProject: getLongestProject(projects),
      busiestMonth: getBusiestMonth(projects),
      mostActiveCollaborator: getMostActiveCollaborator(projects, collaborators),
      bestWeek: getBestWeek(projects)
    },
    verticalBreakdown: {
      data: verticalBreakdownData,
      caption: getVerticalCaption(verticalBreakdownData)
    },
    efficiencyStats: getEfficiencyStats(projects),
    weeklyPulse,
    teamSnapshot,
    closingMessage: getClosingMessage(
      completionProgress.completionRate,
      getActivityLevel(weeklyPulse)
    )
  };
}