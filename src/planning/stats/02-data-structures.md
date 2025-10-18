# Stats Feature - Data Structures & Calculations

## 📊 Core Statistics Interface

```typescript
interface TrackerStats {
  overview: OverviewStats;
  projects: ProjectStats;
  assets: AssetStats;
  collaboration: CollaborationStats;
  workflow: WorkflowStats;
  timeline: TimelineStats;
}
```

## 🎯 Overview Statistics

```typescript
interface OverviewStats {
  // Key Metrics
  totalProjects: number;
  totalAssets: number;
  totalCollaborators: number;
  completionRate: number; // percentage
  
  // Quick Insights
  insights: {
    mostActiveVertical: {
      name: string;
      color: string;
      count: number;
    };
    busiestQuarter: {
      quarter: string;
      count: number;
    };
    averageAssetsPerProject: number;
    mostCommonStatus: {
      name: string;
      color: string;
      count: number;
    };
  };
  
  // Recent Activity (last 7 days)
  recentActivity: {
    projectsCreated: number;
    assetsAdded: number;
    actionsCompleted: number;
  };
}
```

### Calculation Logic

```typescript
function calculateOverviewStats(projects: Project[]): OverviewStats {
  const totalProjects = projects.length;
  
  const totalAssets = projects.reduce((sum, project) => {
    return sum + 
      (project.assets?.length || 0) +
      (project.lightroomAssets?.length || 0) +
      (project.gdriveAssets?.length || 0);
  }, 0);
  
  const collaboratorSet = new Set<string>();
  projects.forEach(project => {
    project.collaborators?.forEach(c => collaboratorSet.add(c.id));
  });
  const totalCollaborators = collaboratorSet.size;
  
  const completedProjects = projects.filter(p => 
    p.status?.toLowerCase().includes('done') || 
    p.status?.toLowerCase().includes('complete')
  ).length;
  const completionRate = totalProjects > 0 
    ? (completedProjects / totalProjects) * 100 
    : 0;
  
  // ... more calculations
}
```

## 📁 Project Statistics

```typescript
interface ProjectStats {
  // Status Distribution
  byStatus: StatusDistribution[];
  
  // Vertical Distribution
  byVertical: VerticalDistribution[];
  
  // Type Distribution
  byType: TypeDistribution[];
  
  // Quarter Distribution
  byQuarter: QuarterDistribution[];
  
  // Duration Statistics
  duration: {
    average: number; // days
    longest: {
      projectName: string;
      days: number;
    };
    shortest: {
      projectName: string;
      days: number;
    };
  };
  
  // Additional Metrics
  totalByYear: Record<string, number>;
  activeProjects: number;
  archivedProjects: number;
}

interface StatusDistribution {
  status: string;
  color: string;
  count: number;
  percentage: number;
}

interface VerticalDistribution {
  vertical: string;
  color: string;
  count: number;
  percentage: number;
}

interface TypeDistribution {
  type: string;
  color: string;
  count: number;
  percentage: number;
}

interface QuarterDistribution {
  quarter: string; // e.g., "Q1 2025"
  year: number;
  quarterNumber: number;
  count: number;
  projects: string[]; // project IDs or names
}
```

### Calculation Logic

```typescript
function calculateProjectStats(projects: Project[]): ProjectStats {
  // Status Distribution
  const statusMap = new Map<string, number>();
  projects.forEach(project => {
    const status = project.status || 'No Status';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });
  
  const byStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    color: getStatusColor(status),
    count,
    percentage: (count / projects.length) * 100
  }));
  
  // Vertical Distribution
  const verticalMap = new Map<string, number>();
  projects.forEach(project => {
    const vertical = project.vertical || 'No Vertical';
    verticalMap.set(vertical, (verticalMap.get(vertical) || 0) + 1);
  });
  
  const byVertical = Array.from(verticalMap.entries()).map(([vertical, count]) => ({
    vertical,
    color: getVerticalColor(vertical),
    count,
    percentage: (count / projects.length) * 100
  }));
  
  // Quarter Distribution
  const quarterMap = new Map<string, QuarterDistribution>();
  projects.forEach(project => {
    if (project.start_date) {
      const { quarter, year } = getQuarterFromDate(project.start_date);
      const key = `Q${quarter} ${year}`;
      
      if (!quarterMap.has(key)) {
        quarterMap.set(key, {
          quarter: key,
          year,
          quarterNumber: quarter,
          count: 0,
          projects: []
        });
      }
      
      const dist = quarterMap.get(key)!;
      dist.count++;
      dist.projects.push(project.name);
    }
  });
  
  // Duration calculations
  const durations = projects
    .filter(p => p.start_date && p.end_date)
    .map(p => ({
      name: p.name,
      days: calculateDaysBetween(p.start_date!, p.end_date!)
    }))
    .filter(d => d.days > 0);
  
  const averageDuration = durations.length > 0
    ? durations.reduce((sum, d) => sum + d.days, 0) / durations.length
    : 0;
  
  const longest = durations.length > 0
    ? durations.reduce((max, d) => d.days > max.days ? d : max)
    : null;
  
  const shortest = durations.length > 0
    ? durations.reduce((min, d) => d.days < min.days ? d : min)
    : null;
  
  // ... more calculations
}
```

## 🖼️ Asset Statistics

```typescript
interface AssetStats {
  // Total Assets
  total: number;
  
  // By Type
  byType: {
    file: AssetTypeStats;
    lightroom: AssetTypeStats;
    gdrive: AssetTypeStats;
  };
  
  // By Illustration Type
  byIllustrationType: IllustrationTypeDistribution[];
  
  // By Status
  byStatus: StatusDistribution[];
  
  // Per Project
  perProject: {
    average: number;
    max: {
      projectName: string;
      count: number;
    };
    min: {
      projectName: string;
      count: number;
    };
    distribution: AssetDistribution[];
  };
  
  // Folder Statistics
  folders: {
    gdrive: {
      totalFolders: number;
      maxDepth: number;
      avgFilesPerFolder: number;
      totalNestedAssets: number;
    };
    lightroom: {
      totalFolders: number;
      organizedAssets: number;
      organizedPercentage: number;
    };
  };
  
  // Preview Statistics (GDrive specific)
  preview: {
    withPreview: number;
    withoutPreview: number;
    multiplePreview: number;
  };
}

interface AssetTypeStats {
  count: number;
  percentage: number;
  byProject: number; // average per project
}

interface IllustrationTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

interface AssetDistribution {
  range: string; // e.g., "0-5", "6-10", "11-20", "21+"
  count: number; // number of projects in this range
}
```

### Calculation Logic

```typescript
function calculateAssetStats(projects: Project[]): AssetStats {
  let totalFile = 0;
  let totalLightroom = 0;
  let totalGdrive = 0;
  
  const illustrationTypeMap = new Map<string, number>();
  const assetCountPerProject: number[] = [];
  
  // GDrive folder stats
  let totalGdriveFolders = 0;
  let maxDepth = 0;
  let totalNestedAssets = 0;
  let gdriveWithPreview = 0;
  let gdriveMultiplePreview = 0;
  
  // Lightroom folder stats
  let totalLightroomFolders = 0;
  let organizedLightroomAssets = 0;
  
  projects.forEach(project => {
    // Count assets
    const fileCount = project.assets?.length || 0;
    const lightroomCount = project.lightroomAssets?.length || 0;
    const gdriveCount = project.gdriveAssets?.length || 0;
    
    totalFile += fileCount;
    totalLightroom += lightroomCount;
    totalGdrive += gdriveCount;
    
    assetCountPerProject.push(fileCount + lightroomCount + gdriveCount);
    
    // Illustration type distribution
    project.assets?.forEach(asset => {
      if (asset.illustrationType) {
        illustrationTypeMap.set(
          asset.illustrationType,
          (illustrationTypeMap.get(asset.illustrationType) || 0) + 1
        );
      }
    });
    
    // GDrive folder analysis
    project.gdriveAssets?.forEach(asset => {
      if (asset.folder) {
        totalGdriveFolders++;
        const depth = calculateFolderDepth(asset.folder);
        maxDepth = Math.max(maxDepth, depth);
        totalNestedAssets++;
      }
      
      if (asset.previewUrls && asset.previewUrls.length > 0) {
        gdriveWithPreview++;
        if (asset.previewUrls.length > 1) {
          gdriveMultiplePreview++;
        }
      }
    });
    
    // Lightroom folder analysis
    project.lightroomAssets?.forEach(asset => {
      if (asset.folder) {
        totalLightroomFolders++;
        organizedLightroomAssets++;
      }
    });
  });
  
  const total = totalFile + totalLightroom + totalGdrive;
  
  // Calculate distribution ranges
  const distribution = calculateDistribution(assetCountPerProject);
  
  // ... more calculations and return
}

function calculateDistribution(counts: number[]): AssetDistribution[] {
  const ranges = [
    { min: 0, max: 5, label: '0-5' },
    { min: 6, max: 10, label: '6-10' },
    { min: 11, max: 20, label: '11-20' },
    { min: 21, max: 50, label: '21-50' },
    { min: 51, max: Infinity, label: '51+' }
  ];
  
  return ranges.map(range => ({
    range: range.label,
    count: counts.filter(c => c >= range.min && c <= range.max).length
  }));
}

function calculateFolderDepth(folder: GDriveFolder): number {
  let depth = 0;
  let current = folder;
  while (current.parentId) {
    depth++;
    current = findParentFolder(current.parentId); // helper function
  }
  return depth;
}
```

## 👥 Collaboration Statistics

```typescript
interface CollaborationStats {
  // Total Collaborators
  totalCollaborators: number;
  totalUniqueCollaborators: number;
  
  // Top Collaborators
  topCollaborators: CollaboratorRanking[];
  
  // Collaborators per Project
  perProject: {
    average: number;
    max: {
      projectName: string;
      count: number;
    };
    min: {
      projectName: string;
      count: number;
    };
    distribution: CollaboratorDistribution[];
  };
  
  // Role Distribution
  byRole: RoleDistribution[];
  
  // Team Statistics
  teams: {
    totalTeams: number;
    totalMembers: number;
    averageTeamSize: number;
    projectsUsingTeams: number;
  };
}

interface CollaboratorRanking {
  id: string;
  name: string;
  nickname?: string;
  photo_url?: string;
  projectCount: number;
  role: string;
}

interface CollaboratorDistribution {
  range: string; // e.g., "Solo (1)", "Small (2-3)", "Medium (4-6)", "Large (7+)"
  count: number;
  percentage: number;
}

interface RoleDistribution {
  role: string;
  count: number;
  percentage: number;
}
```

### Calculation Logic

```typescript
function calculateCollaborationStats(projects: Project[]): CollaborationStats {
  const collaboratorMap = new Map<string, CollaboratorRanking>();
  const roleMap = new Map<string, number>();
  const collaboratorsPerProject: number[] = [];
  
  projects.forEach(project => {
    const collabCount = project.collaborators?.length || 0;
    collaboratorsPerProject.push(collabCount);
    
    project.collaborators?.forEach(collab => {
      // Track collaborator participation
      if (!collaboratorMap.has(collab.id)) {
        collaboratorMap.set(collab.id, {
          id: collab.id,
          name: collab.name,
          nickname: collab.nickname,
          photo_url: collab.photo_url,
          projectCount: 0,
          role: collab.role
        });
      }
      
      const ranking = collaboratorMap.get(collab.id)!;
      ranking.projectCount++;
      
      // Track role distribution
      roleMap.set(collab.role, (roleMap.get(collab.role) || 0) + 1);
    });
  });
  
  // Sort and get top collaborators
  const topCollaborators = Array.from(collaboratorMap.values())
    .sort((a, b) => b.projectCount - a.projectCount)
    .slice(0, 10);
  
  // Calculate distribution
  const distribution = [
    { range: 'Solo (1)', min: 1, max: 1 },
    { range: 'Small (2-3)', min: 2, max: 3 },
    { range: 'Medium (4-6)', min: 4, max: 6 },
    { range: 'Large (7+)', min: 7, max: Infinity }
  ].map(range => {
    const count = collaboratorsPerProject.filter(
      c => c >= range.min && c <= range.max
    ).length;
    return {
      range: range.range,
      count,
      percentage: (count / projects.length) * 100
    };
  });
  
  // ... more calculations
}
```

## ✓ Workflow Statistics

```typescript
interface WorkflowStats {
  // Total Actions
  totalActions: number;
  
  // By Status
  byStatus: {
    completed: number;
    pending: number;
    inProgress: number;
  };
  
  // Completion Rate
  completionRate: number; // percentage
  
  // Per Project
  perProject: {
    average: number;
    max: {
      projectName: string;
      count: number;
    };
    min: {
      projectName: string;
      count: number;
    };
  };
  
  // Action Presets
  topPresets: PresetUsage[];
  
  // By Asset Type
  byAssetType: {
    file: number;
    lightroom: number;
    gdrive: number;
  };
}

interface PresetUsage {
  presetName: string;
  usageCount: number;
}
```

### Calculation Logic

```typescript
function calculateWorkflowStats(projects: Project[]): WorkflowStats {
  let totalActions = 0;
  let completed = 0;
  let pending = 0;
  let inProgress = 0;
  
  const presetMap = new Map<string, number>();
  const actionsPerProject: Array<{ name: string; count: number }> = [];
  
  projects.forEach(project => {
    let projectActionCount = 0;
    
    // Count actions from all asset types
    const allAssets = [
      ...(project.assets || []),
      ...(project.lightroomAssets || []),
      ...(project.gdriveAssets || [])
    ];
    
    allAssets.forEach(asset => {
      const actions = asset.actions || [];
      projectActionCount += actions.length;
      totalActions += actions.length;
      
      actions.forEach(action => {
        // Status counting
        if (action.status === 'done' || action.completed) {
          completed++;
        } else if (action.status === 'in-progress') {
          inProgress++;
        } else {
          pending++;
        }
        
        // Preset tracking (if action has preset info)
        if (action.presetName) {
          presetMap.set(
            action.presetName,
            (presetMap.get(action.presetName) || 0) + 1
          );
        }
      });
    });
    
    actionsPerProject.push({
      name: project.name,
      count: projectActionCount
    });
  });
  
  const completionRate = totalActions > 0
    ? (completed / totalActions) * 100
    : 0;
  
  const topPresets = Array.from(presetMap.entries())
    .map(([name, count]) => ({ presetName: name, usageCount: count }))
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 5);
  
  // ... more calculations
}
```

## 📅 Timeline Statistics

```typescript
interface TimelineStats {
  // Current Quarter
  currentQuarter: {
    quarter: string;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    progress: number; // percentage
  };
  
  // Deadlines
  deadlines: {
    next7Days: DeadlineProject[];
    next30Days: DeadlineProject[];
    overdue: DeadlineProject[];
  };
  
  // Project Creation Timeline
  projectsByMonth: MonthDistribution[];
  
  // Busiest Periods
  busiestMonth: {
    month: string;
    year: number;
    projectCount: number;
  };
  
  busiestQuarter: {
    quarter: string;
    projectCount: number;
  };
}

interface DeadlineProject {
  id: string;
  name: string;
  type: string;
  vertical: string;
  endDate: string;
  daysUntil: number; // negative if overdue
  status: string;
}

interface MonthDistribution {
  month: string; // "Jan", "Feb", etc.
  year: number;
  count: number;
}
```

### Calculation Logic

```typescript
function calculateTimelineStats(projects: Project[]): TimelineStats {
  const now = new Date();
  const currentQuarterNum = Math.floor(now.getMonth() / 3) + 1;
  const currentYear = now.getFullYear();
  
  // Current quarter projects
  const currentQuarterProjects = projects.filter(p => {
    if (!p.start_date) return false;
    const { quarter, year } = getQuarterFromDate(p.start_date);
    return quarter === currentQuarterNum && year === currentYear;
  });
  
  const activeInQuarter = currentQuarterProjects.filter(p => 
    !p.status?.toLowerCase().includes('done')
  );
  
  const completedInQuarter = currentQuarterProjects.filter(p => 
    p.status?.toLowerCase().includes('done')
  );
  
  // Deadlines
  const next7Days: DeadlineProject[] = [];
  const next30Days: DeadlineProject[] = [];
  const overdue: DeadlineProject[] = [];
  
  projects.forEach(project => {
    if (!project.end_date) return;
    
    const endDate = new Date(project.end_date);
    const daysUntil = Math.ceil(
      (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const deadlineProject: DeadlineProject = {
      id: project.id,
      name: project.name,
      type: project.type || '',
      vertical: project.vertical || '',
      endDate: project.end_date,
      daysUntil,
      status: project.status || ''
    };
    
    if (daysUntil < 0) {
      overdue.push(deadlineProject);
    } else if (daysUntil <= 7) {
      next7Days.push(deadlineProject);
    } else if (daysUntil <= 30) {
      next30Days.push(deadlineProject);
    }
  });
  
  // Sort by urgency
  next7Days.sort((a, b) => a.daysUntil - b.daysUntil);
  next30Days.sort((a, b) => a.daysUntil - b.daysUntil);
  overdue.sort((a, b) => a.daysUntil - b.daysUntil);
  
  // Projects by month
  const monthMap = new Map<string, MonthDistribution>();
  projects.forEach(project => {
    if (!project.start_date) return;
    
    const date = new Date(project.start_date);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    
    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {
        month: date.toLocaleString('default', { month: 'short' }),
        year: date.getFullYear(),
        count: 0
      });
    }
    
    monthMap.get(monthKey)!.count++;
  });
  
  // ... more calculations
}
```

## 🔧 Helper Functions

```typescript
// Date utilities
function getQuarterFromDate(date: string): { quarter: number; year: number } {
  const d = new Date(date);
  return {
    quarter: Math.floor(d.getMonth() / 3) + 1,
    year: d.getFullYear()
  };
}

function calculateDaysBetween(start: string, end: string): number {
  const startDate = new Date(start);
  const endDate = new Date(end);
  return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
}

// Color utilities
function getStatusColor(status: string): string {
  // Get from StatusContext
}

function getVerticalColor(vertical: string): string {
  // Get from localStorage or context
}

function getTypeColor(type: string): string {
  // Get from TypeContext
}
```

## 📊 Chart Data Formatters

```typescript
// For Recharts
function formatForPieChart(data: VerticalDistribution[]) {
  return data.map(item => ({
    name: item.vertical,
    value: item.count,
    fill: item.color
  }));
}

function formatForBarChart(data: StatusDistribution[]) {
  return data.map(item => ({
    name: item.status,
    value: item.count,
    fill: item.color
  }));
}

function formatForLineChart(data: MonthDistribution[]) {
  return data.map(item => ({
    name: `${item.month} ${item.year}`,
    value: item.count
  }));
}
```

## 🎯 Performance Considerations

### Memoization Strategy
```typescript
// Memoize expensive calculations
const memoizedStats = useMemo(() => {
  return calculateAllStats(projects);
}, [projects]);

// Separate memos for each tab
const overviewStats = useMemo(() => 
  calculateOverviewStats(projects), 
  [projects]
);

const projectStats = useMemo(() => 
  calculateProjectStats(projects), 
  [projects]
);
```

### Optimization Tips
1. Calculate stats only when dialog opens
2. Cache results per session
3. Use Web Workers for large datasets (1000+ projects)
4. Lazy load chart libraries
5. Virtual scrolling for long lists
