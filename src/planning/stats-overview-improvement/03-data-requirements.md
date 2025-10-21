# Data Requirements - Stats Overview Redesign 📊

**Purpose:** Define all data structures, calculations, and utilities needed for the redesigned Overview tab.

---

## 🎯 Data Sources

### Existing Data (Already Available)
```typescript
// From StatsOverview props
interface StatsOverviewProps {
  projects: Project[];
  verticals: Vertical[];
  statuses: Status[];
  collaborators: Collaborator[];
  selectedPeriod: 'all' | 'year' | 'quarter' | 'month' | 'week';
  selectedYear?: number;
  selectedQuarter?: number;
  selectedMonth?: number;
  selectedWeek?: { year: number; month: number; week: number };
}
```

### Current Stats (Already Calculated)
From `/utils/statsCalculations.ts`:
- `totalProjects`
- `projectsCompleted`
- `totalAssets`
- `totalActions`
- `recentProjects` (last 7 days)
- `mostActiveVertical`
- `averageAssetsPerProject`

---

## 📊 New Calculations Needed

### 1. Performance Summary Data

#### Completion Progress
```typescript
interface CompletionProgress {
  totalProjects: number;
  completedProjects: number;
  inProgressProjects: number;
  completionRate: number; // percentage
  completionMessage: string; // dynamic message based on rate
}

function getCompletionProgress(projects: Project[]): CompletionProgress {
  const total = projects.length;
  const completed = projects.filter(p => isProjectCompleted(p)).length;
  const inProgress = total - completed;
  const rate = calculatePercentage(completed, total);
  
  return {
    totalProjects: total,
    completedProjects: completed,
    inProgressProjects: inProgress,
    completionRate: rate,
    completionMessage: getCompletionMessage(rate)
  };
}

function getCompletionMessage(rate: number): string {
  if (rate >= 70) return `🎉 ${rate}% completion rate! You're crushing it!`;
  if (rate >= 50) return `☕ ${rate}% completion rate! The other half might still be on coffee break.`;
  if (rate >= 30) return `🏃 ${rate}% completion rate — room to grow, but we all start somewhere!`;
  return `🌱 ${rate}% done! Every masterpiece takes time.`;
}
```

#### Top Collaborators Preview
```typescript
interface TopCollaborator {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  projectCount: number;
}

function getTopCollaborators(projects: Project[], limit: number = 3): TopCollaborator[] {
  const collaboratorCounts = new Map<string, number>();
  
  projects.forEach(project => {
    project.collaborators?.forEach(collabId => {
      collaboratorCounts.set(collabId, (collaboratorCounts.get(collabId) || 0) + 1);
    });
  });
  
  // Sort by count and return top N
  return Array.from(collaboratorCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([id, count]) => ({
      id,
      name: getCollaboratorName(id),
      initials: getCollaboratorInitials(id),
      avatar: getCollaboratorAvatar(id),
      projectCount: count
    }));
}
```

---

### 2. Highlights Data

#### Top Category (Vertical)
```typescript
interface TopVertical {
  name: string;
  color: string;
  count: number;
  total: number;
  percentage: number;
  emoji: string;
  message: string;
}

function getTopVertical(projects: Project[], verticals: Vertical[]): TopVertical | null {
  if (projects.length === 0) return null;
  
  const verticalCounts = new Map<string, number>();
  
  projects.forEach(project => {
    const verticalId = project.vertical;
    verticalCounts.set(verticalId, (verticalCounts.get(verticalId) || 0) + 1);
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
    message: `🔥 Top Category: ${vertical.name} — ${count} out of ${projects.length} projects (${percentage}%) are pure ${vertical.name.toLowerCase()} grind ${emoji}`
  };
}

function getVerticalEmoji(verticalName: string): string {
  const emojiMap: Record<string, string> = {
    'Loyalty': '💛',
    'Growth': '🚀',
    'Disco': '🪩',
    'Retention': '🔄',
    'Acquisition': '🎯',
    // Add more mappings
  };
  return emojiMap[verticalName] || '🎨';
}
```

#### Fastest Project
```typescript
interface FastestProject {
  name: string;
  days: number;
  message: string;
}

function getFastestProject(projects: Project[]): FastestProject | null {
  const completedProjects = projects.filter(p => isProjectCompleted(p));
  
  if (completedProjects.length === 0) return null;
  
  let fastest = completedProjects[0];
  let minDays = getProjectDuration(fastest);
  
  completedProjects.forEach(project => {
    const duration = getProjectDuration(project);
    if (duration < minDays) {
      minDays = duration;
      fastest = project;
    }
  });
  
  const message = getFastestProjectMessage(fastest.name, minDays);
  
  return {
    name: fastest.name,
    days: minDays,
    message
  };
}

function getProjectDuration(project: Project): number {
  if (!project.startDate || !project.completedDate) return 0;
  
  const start = new Date(project.startDate);
  const end = new Date(project.completedDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function getFastestProjectMessage(name: string, days: number): string {
  if (days <= 3) return `⚡ Fastest Project: ${name} — blink and you'd miss it (${days} days)! ⚡`;
  if (days <= 7) return `⚡ Fastest Project: ${name} — wrapped up in just ${days} days! 🎯`;
  return `⚡ Fastest Project: ${name} — the speedy one at ${days} days! 🏃`;
}
```

#### Most Active Collaborator
```typescript
interface MostActiveCollaborator {
  id: string;
  name: string;
  initials: string;
  avatar?: string;
  simultaneousProjects: number;
  totalProjects: number;
  message: string;
}

function getMostActiveCollaborator(projects: Project[]): MostActiveCollaborator | null {
  // Count collaborators across all projects
  const collabCounts = new Map<string, number>();
  
  projects.forEach(project => {
    project.collaborators?.forEach(collabId => {
      collabCounts.set(collabId, (collabCounts.get(collabId) || 0) + 1);
    });
  });
  
  if (collabCounts.size === 0) return null;
  
  // Find most active
  const [topId, count] = Array.from(collabCounts.entries())
    .sort((a, b) => b[1] - a[1])[0];
  
  // Calculate simultaneous projects (in-progress)
  const inProgressProjects = projects.filter(p => !isProjectCompleted(p));
  const simultaneousCount = inProgressProjects.filter(p => 
    p.collaborators?.includes(topId)
  ).length;
  
  const name = getCollaboratorName(topId);
  const message = getMostActiveMessage(name, simultaneousCount, count);
  
  return {
    id: topId,
    name,
    initials: getCollaboratorInitials(topId),
    avatar: getCollaboratorAvatar(topId),
    simultaneousProjects: simultaneousCount,
    totalProjects: count,
    message
  };
}

function getMostActiveMessage(name: string, simultaneous: number, total: number): string {
  if (simultaneous >= 3) {
    return `👥 Most Active: ${name} — juggling ${simultaneous} projects at once! 🤹`;
  }
  if (total >= 5) {
    return `👥 MVP: ${name} — contributed to ${total} projects! 🏆`;
  }
  return `👥 Most Active Collaborator: ${name} — found in ${simultaneous} simultaneous projects 😂`;
}
```

#### Best Week/Period
```typescript
interface BestPeriod {
  dateRange: string;
  projects: number;
  assets: number;
  actions: number;
  message: string;
}

function getBestWeek(projects: Project[]): BestPeriod | null {
  // Group projects by week
  const weeklyStats = new Map<string, { projects: number; assets: number; actions: number }>();
  
  projects.forEach(project => {
    const weekKey = getWeekKey(project.createdDate);
    const current = weeklyStats.get(weekKey) || { projects: 0, assets: 0, actions: 0 };
    
    current.projects++;
    current.assets += getTotalAssetsForProject(project);
    current.actions += getTotalActionsForProject(project);
    
    weeklyStats.set(weekKey, current);
  });
  
  if (weeklyStats.size === 0) return null;
  
  // Find week with most actions
  let bestWeek = '';
  let maxActions = 0;
  
  weeklyStats.forEach((stats, weekKey) => {
    if (stats.actions > maxActions) {
      maxActions = stats.actions;
      bestWeek = weekKey;
    }
  });
  
  const stats = weeklyStats.get(bestWeek)!;
  const dateRange = formatWeekRange(bestWeek);
  
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
    return `🎯 Best Week: ${dateRange} — ${stats.projects} projects, ${stats.assets} assets, ${stats.actions} actions… are you okay? 😅`;
  }
  if (stats.actions >= 50) {
    return `🎯 Best Week: ${dateRange} — absolute beast mode! 🦁`;
  }
  return `🎯 Best Week: ${dateRange} — solid hustle! 💼`;
}

function getWeekKey(date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth();
  const week = Math.ceil(d.getDate() / 7);
  return `${year}-${month}-${week}`;
}

function formatWeekRange(weekKey: string): string {
  // Convert "2024-9-3" to "Oct 14-20"
  // Implementation depends on date utility
  return 'Oct 14–20'; // Placeholder
}
```

---

### 3. Vertical Breakdown Data

```typescript
interface VerticalBreakdown {
  name: string;
  color: string;
  count: number;
  percentage: number;
  completedCount: number;
  completionRate: number;
}

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
    return `${breakdown[0].name} and ${breakdown[1].name} are tied — competitive energy! ⚡`;
  }
  
  return `Pretty balanced across categories — nice variety! 🎨`;
}
```

---

### 4. Efficiency Stats Data

```typescript
interface EfficiencyStats {
  avgDuration: {
    value: number;
    label: string;
    comment: string;
  };
  onTimeRate: {
    value: number;
    label: string;
    comment: string;
  };
  avgDelay: {
    value: number;
    label: string;
    comment: string;
  };
  avgAssets: {
    value: number;
    label: string;
    comment: string;
  };
}

function getEfficiencyStats(projects: Project[]): EfficiencyStats {
  const completedProjects = projects.filter(p => isProjectCompleted(p));
  
  // Average Duration
  const durations = completedProjects.map(p => getProjectDuration(p));
  const avgDuration = durations.length > 0 
    ? durations.reduce((a, b) => a + b, 0) / durations.length 
    : 0;
  
  // On-time Rate
  const onTimeCount = completedProjects.filter(p => isProjectOnTime(p)).length;
  const onTimeRate = completedProjects.length > 0
    ? (onTimeCount / completedProjects.length) * 100
    : 0;
  
  // Average Delay
  const delays = completedProjects
    .filter(p => !isProjectOnTime(p))
    .map(p => getProjectDelay(p));
  const avgDelay = delays.length > 0
    ? delays.reduce((a, b) => a + b, 0) / delays.length
    : 0;
  
  // Average Assets
  const avgAssets = projects.length > 0
    ? projects.reduce((sum, p) => sum + getTotalAssetsForProject(p), 0) / projects.length
    : 0;
  
  return {
    avgDuration: {
      value: parseFloat(avgDuration.toFixed(1)),
      label: 'Project Duration',
      comment: getDurationComment(avgDuration)
    },
    onTimeRate: {
      value: Math.round(onTimeRate),
      label: 'On-Time Delivery',
      comment: getOnTimeComment(onTimeRate)
    },
    avgDelay: {
      value: parseFloat(avgDelay.toFixed(1)),
      label: 'Average Delay',
      comment: getDelayComment(avgDelay)
    },
    avgAssets: {
      value: parseFloat(avgAssets.toFixed(1)),
      label: 'Assets per Project',
      comment: getAssetsComment(avgAssets)
    }
  };
}

function getDurationComment(days: number): string {
  if (days <= 3) return 'lightning fast! ⚡';
  if (days <= 7) return 'not bad, not Netflix-binge-long either 🍿';
  if (days <= 14) return 'about right for quality work 👌';
  if (days <= 30) return 'slow and steady wins the race 🐢';
  return 'taking the scenic route — Rome wasn't built in a day! 🏛️';
}

function getOnTimeComment(rate: number): string {
  if (rate >= 90) return 'basically a time machine! ⏰✨';
  if (rate >= 80) return 'faster than most deliveries 🚚💨';
  if (rate >= 70) return 'pretty reliable! 📦';
  if (rate >= 60) return 'room for improvement, but who\'s perfect? 🤷';
  return 'slow and steady — deadlines are just suggestions, right? 😅';
}

function getDelayComment(days: number): string {
  if (days <= 0.5) return 'barely noticeable! 🎯';
  if (days <= 1) return 'just fashionably late ⏰';
  if (days <= 2) return 'could be worse! ☕';
  if (days <= 5) return 'the projects needed more time to be perfect 💎';
  return 'good things take time! 🌟';
}

function getAssetsComment(count: number): string {
  if (count <= 2) return 'lean and mean! 💪';
  if (count <= 5) return 'solid amount of deliverables 📦';
  if (count <= 10) return 'packed with content! 🎁';
  return 'asset factory mode activated! 🏭';
}

function isProjectOnTime(project: Project): boolean {
  if (!project.completedDate || !project.deadline) return true;
  return new Date(project.completedDate) <= new Date(project.deadline);
}

function getProjectDelay(project: Project): number {
  if (!project.completedDate || !project.deadline) return 0;
  
  const completed = new Date(project.completedDate);
  const deadline = new Date(project.deadline);
  
  if (completed <= deadline) return 0;
  
  const diffTime = completed.getTime() - deadline.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

---

### 5. Weekly Pulse Data

```typescript
interface WeeklyPulse {
  projectsCreated: number;
  assetsAdded: number;
  actionsCompleted: number;
  trend: 'up' | 'down' | 'same';
  trendMessage: string;
}

function getWeeklyPulse(projects: Project[]): WeeklyPulse {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  
  // This week
  const thisWeekProjects = projects.filter(p => 
    new Date(p.createdDate) >= weekAgo
  );
  const thisWeekAssets = thisWeekProjects.reduce((sum, p) => 
    sum + getTotalAssetsForProject(p), 0
  );
  const thisWeekActions = thisWeekProjects.reduce((sum, p) => 
    sum + getTotalActionsForProject(p), 0
  );
  
  // Last week
  const lastWeekProjects = projects.filter(p => {
    const date = new Date(p.createdDate);
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
    return 'Up from last week — productivity\'s on fire 🔥 (and maybe your brain too 😵)';
  }
  if (trend === 'down') {
    return 'Taking it slower this week — self-care is important too! 🧘';
  }
  return 'Steady pace — consistency is key! 📊';
}
```

---

### 6. Team Snapshot Data

```typescript
interface TeamSnapshot {
  totalCollaborators: number;
  topCollaborators: TopCollaborator[];
  newCollaborators: string[];
  topSquadMessage: string;
}

function getTeamSnapshot(projects: Project[], collaborators: Collaborator[]): TeamSnapshot {
  // Get all unique collaborator IDs
  const allCollabIds = new Set<string>();
  projects.forEach(p => {
    p.collaborators?.forEach(id => allCollabIds.add(id));
  });
  
  // Get top collaborators
  const topCollabs = getTopCollaborators(projects, 4);
  
  // Get new collaborators (joined in last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const newCollabs = collaborators
    .filter(c => new Date(c.joinedDate) >= thirtyDaysAgo)
    .map(c => c.name);
  
  // Generate top squad message
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
    return 'Solo journey so far — independent creator mode! 🎨';
  }
  
  if (topCollabs.length === 1) {
    return `Dynamic duo with ${topCollabs[0].name} — Batman & Robin vibes 🦇`;
  }
  
  if (topCollabs.length <= 3) {
    const names = topCollabs.map(c => c.name).join(', ');
    return `Core team: ${names} — dream team right here! 🌟`;
  }
  
  const names = topCollabs.slice(0, 4).map(c => c.name).join(', ');
  return `Top squad: ${names} — these legends never sleep 😎`;
}
```

---

### 7. Fun Closing Message

```typescript
function getClosingMessage(completionRate: number, recentActivity: 'high' | 'normal' | 'low'): string {
  const messages = {
    high: [
      'Keep it up — your projects need you (and probably caffeine). ☕💪',
      'Great work! But maybe take a breather? 😅',
      'Productivity beast mode activated! 🦁'
    ],
    normal: [
      'You\'re doing great! One project at a time 🎯',
      'Slow progress is still progress — keep going! 🌱',
      'Halfway done! Time for a snack break 🍪'
    ],
    low: [
      'Remember: Rome wasn't built in a day! 🏛️',
      'Every completed project is a win — celebrate the small stuff! 🎉',
      'Time to get back in the game! 💪'
    ]
  };
  
  const pool = messages[recentActivity];
  return pool[Math.floor(Math.random() * pool.length)];
}
```

---

## 🗃️ New Utility File

Create `/utils/statsOverviewUtils.ts`:

```typescript
import { Project, Vertical, Status, Collaborator } from '../types';
import { 
  isProjectCompleted, 
  getTotalAssetsForProject,
  getTotalActionsForProject,
  calculatePercentage 
} from './statsCalculations';

export interface OverviewData {
  performanceSummary: CompletionProgress & {
    topCollaborators: TopCollaborator[];
  };
  highlights: {
    topVertical: TopVertical | null;
    fastestProject: FastestProject | null;
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

export function calculateOverviewData(
  projects: Project[],
  verticals: Vertical[],
  statuses: Status[],
  collaborators: Collaborator[]
): OverviewData {
  // Implementation combines all functions above
  // Return comprehensive data object
}

// Export all helper functions
export * from './statsOverviewHelpers';
```

---

## ✅ Data Checklist

- [ ] All calculations use real data
- [ ] No hardcoded values
- [ ] Handle edge cases (empty data)
- [ ] Performance optimized (memoization)
- [ ] TypeScript types defined
- [ ] Utility functions tested
- [ ] Fallback messages for missing data

---

**Next:** Review Implementation Plan (04-implementation-plan.md)
