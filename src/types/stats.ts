// Stats Feature - TypeScript Interfaces

export interface TrackerStats {
  overview: OverviewStats;
  projects: ProjectStats;
  assets: AssetStats;
  collaboration: CollaborationStats;
  workflow: WorkflowStats;
  timeline: TimelineStats;
}

// ============================================================================
// OVERVIEW STATISTICS
// ============================================================================

export interface OverviewStats {
  totalProjects: number;
  totalAssets: number;
  totalCollaborators: number;
  completionRate: number;
  
  insights: {
    mostActiveVertical: {
      name: string;
      color: string;
      count: number;
    } | null;
    busiestQuarter: {
      quarter: string;
      count: number;
    } | null;
    averageAssetsPerProject: number;
    mostCommonStatus: {
      name: string;
      color: string;
      count: number;
    } | null;
  };
  
  recentActivity: {
    projectsCreated: number;
    assetsAdded: number;
    actionsCompleted: number;
  };
}

// ============================================================================
// PROJECT STATISTICS
// ============================================================================

export interface ProjectStats {
  byStatus: StatusDistribution[];
  byVertical: VerticalDistribution[];
  byType: TypeDistribution[];
  byQuarter: QuarterDistribution[];
  
  duration: {
    average: number;
    longest: ProjectDuration | null;
    shortest: ProjectDuration | null;
  };
  
  totalByYear: Record<string, number>;
  activeProjects: number;
  archivedProjects: number;
}

export interface StatusDistribution {
  status: string;
  color: string;
  count: number;
  percentage: number;
}

export interface VerticalDistribution {
  vertical: string;
  color: string;
  count: number;
  percentage: number;
}

export interface TypeDistribution {
  type: string;
  color: string;
  count: number;
  percentage: number;
}

export interface QuarterDistribution {
  quarter: string;
  year: number;
  quarterNumber: number;
  count: number;
  projects: string[];
}

export interface ProjectDuration {
  projectName: string;
  days: number;
}

// ============================================================================
// ASSET STATISTICS
// ============================================================================

export interface AssetStats {
  total: number;
  
  byType: {
    file: AssetTypeStats;
    lightroom: AssetTypeStats;
    gdrive: AssetTypeStats;
  };
  
  byIllustrationType: IllustrationTypeDistribution[];
  byStatus: StatusDistribution[];
  
  perProject: {
    average: number;
    max: AssetProjectInfo | null;
    min: AssetProjectInfo | null;
    distribution: AssetDistribution[];
  };
  
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
  
  preview: {
    withPreview: number;
    withoutPreview: number;
    multiplePreview: number;
  };
}

export interface AssetTypeStats {
  count: number;
  percentage: number;
  byProject: number;
}

export interface IllustrationTypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface AssetProjectInfo {
  projectName: string;
  count: number;
}

export interface AssetDistribution {
  range: string;
  count: number;
}

// ============================================================================
// COLLABORATION STATISTICS
// ============================================================================

export interface CollaborationStats {
  totalCollaborators: number;
  totalUniqueCollaborators: number;
  
  topCollaborators: CollaboratorRanking[];
  
  perProject: {
    average: number;
    max: CollaboratorProjectInfo | null;
    min: CollaboratorProjectInfo | null;
    distribution: CollaboratorDistribution[];
  };
  
  byRole: RoleDistribution[];
  
  teams: {
    totalTeams: number;
    totalMembers: number;
    averageTeamSize: number;
    projectsUsingTeams: number;
  };
}

export interface CollaboratorRanking {
  id: string;
  name: string;
  nickname?: string;
  photo_url?: string;
  projectCount: number;
  role: string;
}

export interface CollaboratorProjectInfo {
  projectName: string;
  count: number;
}

export interface CollaboratorDistribution {
  range: string;
  count: number;
  percentage: number;
}

export interface RoleDistribution {
  role: string;
  count: number;
  percentage: number;
}

// ============================================================================
// WORKFLOW STATISTICS
// ============================================================================

export interface WorkflowStats {
  totalActions: number;
  
  byStatus: {
    completed: number;
    pending: number;
    inProgress: number;
  };
  
  completionRate: number;
  
  perProject: {
    average: number;
    max: ActionProjectInfo | null;
    min: ActionProjectInfo | null;
  };
  
  topPresets: PresetUsage[];
  
  byAssetType: {
    file: number;
    lightroom: number;
    gdrive: number;
  };
}

export interface ActionProjectInfo {
  projectName: string;
  count: number;
}

export interface PresetUsage {
  presetName: string;
  usageCount: number;
}

// ============================================================================
// TIMELINE STATISTICS
// ============================================================================

export interface TimelineStats {
  currentQuarter: {
    quarter: string;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    progress: number;
  };
  
  deadlines: {
    next7Days: DeadlineProject[];
    next30Days: DeadlineProject[];
    overdue: DeadlineProject[];
  };
  
  projectsByMonth: MonthDistribution[];
  
  busiestMonth: {
    month: string;
    year: number;
    projectCount: number;
  } | null;
  
  busiestQuarter: {
    quarter: string;
    projectCount: number;
  } | null;
}

export interface DeadlineProject {
  id: string;
  name: string;
  type: string;
  vertical: string;
  endDate: string;
  daysUntil: number;
  status: string;
}

export interface MonthDistribution {
  month: string;
  year: number;
  count: number;
}
