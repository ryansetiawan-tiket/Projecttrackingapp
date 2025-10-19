import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Project, Collaborator } from '../types/project';
import { ProjectCard } from './ProjectCard';
import { ProjectGroup } from './ProjectGroup';
import { useColors } from './ColorContext';
import { useStatusContext } from './StatusContext';
import { useAuth } from '../contexts/AuthContext';
import { useColumnOrder } from '../hooks/useColumnOrder';
import { DraggableTableHeader } from './project-table/DraggableTableHeader';
import { getQuarterPattern } from '../utils/quarterUtils';
import { sortProjectsByUrgency, getMostUrgentPriority, getDaysUntilDeadline } from '../utils/sortingUtils';
import { ProjectTableRow } from './project-table/renderProjectRow';
import { hexToRgba } from './project-table/helpers';
import { AddGDriveAssetDialog } from './AddGDriveAssetDialog';
import { AddLightroomAssetDialog } from './AddLightroomAssetDialog';
import { AddProjectLinkDialog } from './AddProjectLinkDialog';

// All helper functions moved to /components/project-table/helpers.ts

/**
 * Format urgency info for collapsed group header
 * Returns { text, variant } for urgency badge
 */
function formatUrgencyInfo(projects: Project[]): { text: string; variant: 'destructive' | 'warning' | 'default' | null } | null {
  if (projects.length === 0) return null;
  
  // Find most urgent project
  let mostUrgent: { project: Project; daysLeft: number | null } | null = null;
  
  for (const project of projects) {
    const daysLeft = getDaysUntilDeadline(project.due_date);
    if (daysLeft === null) continue; // Skip projects without due date
    
    if (mostUrgent === null || (daysLeft !== null && daysLeft < (mostUrgent.daysLeft ?? Infinity))) {
      mostUrgent = { project, daysLeft };
    }
  }
  
  if (!mostUrgent || mostUrgent.daysLeft === null) return null;
  
  const daysLeft = mostUrgent.daysLeft;
  
  // Overdue
  if (daysLeft < 0) {
    const daysOverdue = Math.abs(daysLeft);
    return {
      text: daysOverdue === 1 ? '1 day overdue' : `${daysOverdue} days overdue`,
      variant: 'destructive'
    };
  }
  
  // Due today
  if (daysLeft === 0) {
    return {
      text: 'Due today',
      variant: 'destructive'
    };
  }
  
  // Less than 24 hours (show hours)
  if (daysLeft === 1) {
    // Calculate exact hours for more precision
    const deadline = new Date(mostUrgent.project.due_date!);
    const now = new Date();
    const hoursLeft = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60));
    
    if (hoursLeft < 24) {
      return {
        text: hoursLeft === 1 ? '1 hour left' : `${hoursLeft} hours left`,
        variant: 'warning'
      };
    }
  }
  
  // 1-3 days
  if (daysLeft <= 3) {
    return {
      text: daysLeft === 1 ? '1 day left' : `${daysLeft} days left`,
      variant: 'warning'
    };
  }
  
  // 4-7 days
  if (daysLeft <= 7) {
    return {
      text: `${daysLeft} days left`,
      variant: 'default'
    };
  }
  
  // 8+ days - don't show (not urgent enough)
  return null;
}

interface ProjectTableProps {
  projects: Project[];
  collaborators: Collaborator[];
  onProjectClick: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onProjectUpdate: (id: string, data: Partial<Project>) => void;
  onProjectDelete: (id: string) => void;
  onCreateProject: (vertical?: string) => void;
  onNavigateToLightroom?: (projectId: string) => void;
  onNavigateToGDrive?: (projectId: string) => void;
  selectedQuarter?: string;
  selectedYear?: string;
  groupByMode?: 'status' | 'vertical';
  isPublicView?: boolean;
}

export function ProjectTable({
  projects,
  collaborators,
  onProjectClick,
  onEditProject,
  onProjectUpdate,
  onProjectDelete,
  onCreateProject,
  onNavigateToLightroom,
  onNavigateToGDrive,
  selectedQuarter = 'all',
  selectedYear = 'all',
  groupByMode = 'status',
  isPublicView = false
}: ProjectTableProps) {
  const { verticalColors } = useColors();
  const { statuses, getStatusColor: getStatusColorFromContext, isManualStatus } = useStatusContext();
  const { accessToken } = useAuth();
  
  // 🆕 Column Order Management (v2.4.0)
  const {
    columns,
    reorderColumn,
    isLoading: isLoadingColumns,
  } = useColumnOrder(accessToken);
  
  // Filter visible columns for rendering
  const visibleColumns = columns.filter(col => col.visible);
  
  const [expandedAssets, setExpandedAssets] = useState<Set<string>>(new Set());
  const [activeAssetPopover, setActiveAssetPopover] = useState<string | null>(null);
  const [activeDatePopover, setActiveDatePopover] = useState<string | null>(null);
  // State for tracking which status groups are open in desktop table (when group by status)
  const [openStatuses, setOpenStatuses] = useState<Set<string>>(new Set());
  // State for tracking which vertical sections are collapsed (format: "statusKey-verticalName" or "verticalKey-statusName")
  const [collapsedVerticals, setCollapsedVerticals] = useState<Set<string>>(new Set());
  // State for tracking which vertical groups are open (when group by vertical)
  const [openVerticals, setOpenVerticals] = useState<Set<string>>(new Set());
  // State for tracking which status sub-sections are collapsed within verticals (format: "verticalName-statusName")
  const [collapsedStatuses, setCollapsedStatuses] = useState<Set<string>>(new Set());
  
  // 🆕 State for Add Assets dialogs
  const [gdriveDialogOpen, setGdriveDialogOpen] = useState(false);
  const [gdriveDialogProjectId, setGdriveDialogProjectId] = useState<string | undefined>(undefined);
  const [lightroomDialogOpen, setLightroomDialogOpen] = useState(false);
  const [lightroomDialogProjectId, setLightroomDialogProjectId] = useState<string | undefined>(undefined);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [linkDialogProjectId, setLinkDialogProjectId] = useState<string | undefined>(undefined);
  
  // Use projects prop directly (already sorted from Dashboard)
  const sortedProjects = projects;

  // Filter projects by selected year and quarter (from props)
  const filteredProjects = sortedProjects.filter(project => {
    // IMPORTANT: Projects without dates (including drafts) should always pass through date filters
    // They may not have dates yet, but we still want to show them
    const isDraft = project.is_draft === true;
    const hasNoDates = !project.start_date && !project.due_date;
    
    // Get year number for filtering
    const yearNum = selectedYear !== 'all' ? parseInt(selectedYear) : undefined;
    
    // Filter by year if selected - skip for projects without dates
    if (yearNum !== undefined && !isDraft && !hasNoDates) {
      const startYear = project.start_date ? new Date(project.start_date).getFullYear() : null;
      const dueYear = project.due_date ? new Date(project.due_date).getFullYear() : null;
      
      // Project must have at least one date matching the selected year
      if (startYear !== yearNum && dueYear !== yearNum) {
        return false;
      }
    }
    
    // Filter by quarter if selected - skip for projects without dates
    if (selectedQuarter !== 'all' && selectedQuarter !== 'No Quarter' && !isDraft && !hasNoDates) {
      // Get the project's quarter pattern
      const projectPattern = getQuarterPattern(project.start_date, project.due_date, yearNum);
      
      if (!projectPattern) return false;
      
      // Check if selected quarter matches or is included in project pattern
      const selectedMatch = selectedQuarter.match(/^Q(\d)(?:-Q(\d))?$/);
      const projectMatch = projectPattern.match(/^Q(\d)(?:-Q(\d))?$/);
      
      if (selectedMatch && projectMatch) {
        const selectedStart = parseInt(selectedMatch[1]);
        const selectedEnd = selectedMatch[2] ? parseInt(selectedMatch[2]) : selectedStart;
        const selectedIsSingle = !selectedMatch[2];
        
        const projectStart = parseInt(projectMatch[1]);
        const projectEnd = projectMatch[2] ? parseInt(projectMatch[2]) : projectStart;
        const projectIsSingle = !projectMatch[2];
        
        // If user selected a single quarter (e.g., Q2)
        // Show all projects that include that quarter (both single and ranges)
        if (selectedIsSingle) {
          const includesQuarter = projectStart <= selectedStart && projectEnd >= selectedStart;
          if (!includesQuarter) return false;
        } else {
          // If user selected a range (e.g., Q1-Q3)
          // Show ONLY projects with exact matching range (not single quarters)
          const matchesExactly = projectStart === selectedStart && projectEnd === selectedEnd && !projectIsSingle;
          
          if (!matchesExactly) return false;
        }
      }
    }
    
    return true;
  });
  
  // For DESKTOP: Group projects by status with special "Draft" group
  // Get status order from context, sorted by order field
  const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);
  const statusOrder = ['Draft', ...sortedStatuses.map(s => s.name)];
  const groupedByStatus = filteredProjects.reduce((groups, project) => {
    // Separate draft projects into "Draft" group
    if (project.is_draft) {
      if (!groups['Draft']) {
        groups['Draft'] = [];
      }
      groups['Draft'].push(project);
    } else {
      const status = project.status || 'No Status';
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(project);
    }
    return groups;
  }, {} as Record<string, Project[]>);

  // Sort statuses by predefined order - "Draft" always first, then by statusOrder
  const sortedStatusKeys = Object.keys(groupedByStatus).sort((a, b) => {
    // Force "Draft" to always be first
    if (a === 'Draft') return -1;
    if (b === 'Draft') return 1;
    
    const indexA = statusOrder.indexOf(a);
    const indexB = statusOrder.indexOf(b);
    
    // If both statuses are in the order array
    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    
    // If only a is in the order array, it comes first
    if (indexA !== -1) return -1;
    
    // If only b is in the order array, it comes first
    if (indexB !== -1) return 1;
    
    // If neither is in the order array, sort alphabetically
    return a.localeCompare(b);
  });
  
  // Debug logging
  console.log('[ProjectTable] groupedByStatus keys:', Object.keys(groupedByStatus));
  console.log('[ProjectTable] sortedStatusKeys:', sortedStatusKeys);
  console.log('[ProjectTable] Draft group exists?', groupedByStatus['Draft']?.length || 0);
  console.log('[ProjectTable] Draft projects:', groupedByStatus['Draft']?.map(p => ({ id: p.id, name: p.project_name, is_draft: p.is_draft })));

  // For DESKTOP: Group projects by vertical (for Group by Vertical mode)
  const groupedByVerticalDesktop = filteredProjects.reduce((groups, project) => {
    const vertical = project.vertical || 'Uncategorized';
    if (!groups[vertical]) {
      groups[vertical] = [];
    }
    groups[vertical].push(project);
    return groups;
  }, {} as Record<string, Project[]>);

  // Sort verticals alphabetically, with "Uncategorized" last
  const sortedVerticalKeys = Object.keys(groupedByVerticalDesktop).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    return a.localeCompare(b);
  });
  
  // 🎯 Initialize status groups from localStorage (preserve user's expand/collapse choices)
  useEffect(() => {
    const saved = localStorage.getItem('project-table-open-statuses');
    if (saved) {
      try {
        const savedSet = new Set<string>(JSON.parse(saved));
        // Only use saved state if it contains valid status keys
        const validSaved = Array.from(savedSet).filter(key => sortedStatusKeys.includes(key));
        if (validSaved.length > 0) {
          setOpenStatuses(new Set(validSaved));
          return;
        }
      } catch (e) {
        console.warn('Failed to parse saved status groups:', e);
      }
    }
    // Default: all open
    setOpenStatuses(new Set(sortedStatusKeys));
  }, [sortedStatusKeys.join(',')]); // Only reset when status keys change

  // 🎯 Initialize vertical groups from localStorage (preserve user's expand/collapse choices)
  useEffect(() => {
    const saved = localStorage.getItem('project-table-open-verticals');
    if (saved) {
      try {
        const savedSet = new Set<string>(JSON.parse(saved));
        // Only use saved state if it contains valid vertical keys
        const validSaved = Array.from(savedSet).filter(key => sortedVerticalKeys.includes(key));
        if (validSaved.length > 0) {
          setOpenVerticals(new Set(validSaved));
          return;
        }
      } catch (e) {
        console.warn('Failed to parse saved vertical groups:', e);
      }
    }
    // Default: all open
    setOpenVerticals(new Set(sortedVerticalKeys));
  }, [sortedVerticalKeys.join(',')]); // Only reset when vertical keys change
  
  // 🎯 Save status groups to localStorage whenever they change
  useEffect(() => {
    if (openStatuses.size > 0) {
      localStorage.setItem('project-table-open-statuses', JSON.stringify(Array.from(openStatuses)));
    }
  }, [openStatuses]);
  
  // 🎯 Save vertical groups to localStorage whenever they change
  useEffect(() => {
    if (openVerticals.size > 0) {
      localStorage.setItem('project-table-open-verticals', JSON.stringify(Array.from(openVerticals)));
    }
  }, [openVerticals]);

  const toggleStatus = (status: string) => {
    setOpenStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  const toggleVertical = (vertical: string) => {
    setOpenVerticals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vertical)) {
        newSet.delete(vertical);
      } else {
        newSet.add(vertical);
      }
      return newSet;
    });
  };

  const toggleStatusCollapse = (verticalKey: string, statusName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const statusKey = `${verticalKey}-${statusName}`;
    setCollapsedStatuses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(statusKey)) {
        newSet.delete(statusKey);
      } else {
        newSet.add(statusKey);
      }
      return newSet;
    });
  };

  const toggleVerticalCollapse = (statusKey: string, verticalName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const verticalKey = `${statusKey}-${verticalName}`;
    setCollapsedVerticals(prev => {
      const newSet = new Set(prev);
      if (newSet.has(verticalKey)) {
        newSet.delete(verticalKey);
      } else {
        newSet.add(verticalKey);
      }
      return newSet;
    });
  };

  const toggleAssetExpansion = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectId)) {
        newSet.delete(projectId);
      } else {
        newSet.add(projectId);
      }
      return newSet;
    });
  };

  const handleAssetStatusChange = (project: Project, assetId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedAssets = project.actionable_items?.map(asset => 
      asset.id === assetId 
        ? { ...asset, status: newStatus, is_completed: newStatus === 'Done' }
        : asset
    );
    
    // Auto-calculate project status based on assets, but preserve manual statuses
    const newProjectStatus = calculateProjectStatus(updatedAssets, project.status);
    
    onProjectUpdate(project.id, { 
      actionable_items: updatedAssets,
      status: newProjectStatus 
    });
    setActiveAssetPopover(null);
  };

  // Convert date string to Date object for calendar
  const convertToCalendarDate = (dateString: string | null | undefined): Date | undefined => {
    if (!dateString) return undefined;
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    } catch {
      return undefined;
    }
  };

  // Convert Date object to YYYY-MM-DD string
  const convertDateToString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Handle date update
  const handleDateUpdate = (projectId: string, field: 'start_date' | 'due_date', date: Date | undefined) => {
    if (!date) return;
    const dateString = convertDateToString(date);
    onProjectUpdate(projectId, { [field]: dateString });
    setActiveDatePopover(null);
  };

  // Set date to today
  const handleSetToday = (projectId: string, field: 'start_date' | 'due_date') => {
    const today = new Date();
    const dateString = convertDateToString(today);
    onProjectUpdate(projectId, { [field]: dateString });
    setActiveDatePopover(null);
  };

  // Get status options from context, sorted by order
  const statusOptions = sortedStatuses.map(s => s.name);

  const getStatusColor = (status: string) => {
    const bgColor = getStatusColorFromContext(status);
    const textColor = getStatusTextColor(status);
    return '';
  };

  // Get bullet point color based on status
  const getBulletColor = (status: string) => {
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

  // Calculate project status from assets
  // IMPORTANT: This should NOT override manually set statuses like "On Hold", "Canceled", etc.
  // ⚡ CRITICAL: Also preserves "In Progress" to prevent visual jumping during action checks
  const calculateProjectStatus = (assets: any[] | undefined, currentProjectStatus?: string): string => {
    // CRITICAL: If current status is a manual status, ALWAYS preserve it
    // This ensures user's explicit status choices are never overridden
    // Uses dynamic check from StatusContext - no more hardcoded status names!
    if (currentProjectStatus && isManualStatus(currentProjectStatus)) {
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
    
    // Use first status from context as default
    const defaultStatus = sortedStatuses.length > 0 ? sortedStatuses[0].name : 'Not Started';
    if (!assets || assets.length === 0) {
      return currentProjectStatus || defaultStatus;
    }
    
    // Count statuses
    const statusCount: Record<string, number> = {};
    assets.forEach(asset => {
      const status = asset.status || 'Not Started';
      statusCount[status] = (statusCount[status] || 0) + 1;
    });

    // All assets have same status
    const uniqueStatuses = Object.keys(statusCount);
    if (uniqueStatuses.length === 1) {
      return uniqueStatuses[0];
    }

    // Multiple statuses - use priority based on status order
    // Check each status in order (lower order = higher priority)
    for (const status of sortedStatuses) {
      if (statusCount[status.name]) return status.name;
    }
    
    // CRITICAL EDGE CASE: For single-action projects only!
    // Calculate total action count
    const totalActionCount = (assets || []).reduce((sum, asset) => {
      return sum + (asset.actions?.length || 0);
    }, 0);
    
    // If we get here and current status is "In Progress" and only 1 action total,
    // preserve it even at 0% (edge case: no middle ground between 0% and 100%)
    // For multi-action projects, allow revert to "Not Started" (normal behavior)
    if (currentProjectStatus === 'In Progress' && totalActionCount === 1) {
      return 'In Progress';
    }
    
    return 'Not Started';
  };

  // Check if project has mixed asset statuses
  const hasMixedAssetStatuses = (assets: any[] | undefined): boolean => {
    if (!assets || assets.length <= 1) return false;
    
    const uniqueStatuses = new Set(assets.map(asset => asset.status || 'Not Started'));
    return uniqueStatuses.size > 1;
  };

  const getCollaboratorNames = (collaborators: any[]) => {
    if (!collaborators || !Array.isArray(collaborators)) return [];
    return collaborators.slice(0, 3).map(collab => 
      typeof collab === 'string' ? collab : (collab.nickname || collab.name)
    );
  };

  if (projects.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No projects found. Create your first project to get started.</p>
      </Card>
    );
  }

  // For MOBILE: Group projects by vertical while preserving original sort order
  const groupedByVertical = sortedProjects.reduce((groups, project) => {
    const vertical = project.vertical || 'Uncategorized';
    if (!groups[vertical]) {
      groups[vertical] = [];
    }
    groups[vertical].push(project);
    return groups;
  }, {} as Record<string, Project[]>);

  // Sort verticals by urgency (most urgent project in each vertical)
  const verticalOrder = Object.keys(groupedByVertical).sort((a, b) => {
    if (a === 'Uncategorized') return 1;
    if (b === 'Uncategorized') return -1;
    
    const urgencyA = getMostUrgentPriority(groupedByVertical[a]);
    const urgencyB = getMostUrgentPriority(groupedByVertical[b]);
    
    if (urgencyA !== urgencyB) {
      return urgencyA - urgencyB;
    }
    
    return a.localeCompare(b);
  });
  
  // Determine which verticals should be grouped (more than 1 project)
  const shouldGroupVerticals = verticalOrder.filter(vertical => groupedByVertical[vertical].length > 1);
  
  // For ungrouped projects, preserve the original sort order from sortedProjects
  const ungroupedVerticals = new Set(verticalOrder.filter(vertical => groupedByVertical[vertical].length === 1));
  const ungroupedProjects = sortedProjects.filter(project => {
    const vertical = project.vertical || 'Uncategorized';
    return ungroupedVerticals.has(vertical);
  });

  // Toggle quarter group open/closed
  const toggleQuarter = (quarter: string) => {
    setOpenQuarters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(quarter)) {
        newSet.delete(quarter);
      } else {
        newSet.add(quarter);
      }
      return newSet;
    });
  };

  // Get background color for status group header (uses status badge color from context)
  const getStatusHeaderBgColor = (status: string) => {
    // Special handling for Draft
    if (status === 'Draft') {
      return hexToRgba('#d97706', 0.12); // Amber color with opacity
    }
    
    // Get status color from context
    const statusColor = getStatusColorFromContext(status);
    
    // Convert to rgba with low opacity for background
    return hexToRgba(statusColor, 0.12);
  };

  // Show loading skeleton while columns are loading
  if (isLoadingColumns) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <>
      {/* Mobile Grouped Card View - Hidden on desktop */}
      <div className="block md:hidden space-y-4">
        {/* Grouped projects (verticals with more than 1 project) */}
        {shouldGroupVerticals.map((vertical) => (
          <ProjectGroup
            key={vertical}
            vertical={vertical}
            projects={groupedByVertical[vertical]}
            collaborators={collaborators}
            onProjectClick={onProjectClick}
            onEditProject={onEditProject}
            onDeleteProject={(project) => onProjectDelete(project.id)}
            onProjectUpdate={onProjectUpdate}
            onNavigateToLightroom={onNavigateToLightroom}
            onNavigateToGDrive={onNavigateToGDrive}
            onCreateProject={onCreateProject}
            isPublicView={isPublicView}
          />
        ))}
        
        {/* Ungrouped projects (verticals with only 1 project) */}
        {ungroupedProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            collaborators={collaborators}
            onProjectClick={onProjectClick}
            onEditProject={onEditProject}
            onDeleteProject={(project) => onProjectDelete(project.id)}
            isPublicView={isPublicView}
            onProjectUpdate={onProjectUpdate}
            onNavigateToLightroom={onNavigateToLightroom}
            onNavigateToGDrive={onNavigateToGDrive}
            showVerticalBadge={true}
          />
        ))}
      </div>

      {/* Desktop Table View - Hidden on mobile */}
      <div className="hidden md:block space-y-4">
        
        {/* Render based on group mode */}
        {groupByMode === 'status' ? (
          // GROUP BY STATUS MODE
          <>
            {/* Debug logging for rendering */}
            {console.log('[ProjectTable] Rendering sortedStatusKeys:', sortedStatusKeys)}
            {console.log('[ProjectTable] groupByMode:', groupByMode)}
            
            {/* Render grouped statuses */}
            {sortedStatusKeys.map((status) => {
              console.log('[ProjectTable] Rendering status group:', status, 'with', groupedByStatus[status]?.length, 'projects');
              return (
          <Card key={status}>
            <Collapsible
              open={openStatuses.has(status)}
              onOpenChange={() => toggleStatus(status)}
            >
              {/* Status Group Header */}
              <div 
                className="border-b border-border"
                style={{ backgroundColor: getStatusHeaderBgColor(status) }}
              >
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors bg-[rgba(0,0,0,0)]">
                    <div className="flex items-center gap-3">
                      {openStatuses.has(status) ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <h3 className="font-mono font-medium" style={{ color: getStatusColorFromContext(status) }}>{status}</h3>
                      <Badge 
                        variant="secondary" 
                        className={status === 'Draft' 
                          ? 'text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700'
                          : 'text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700'
                        }
                      >
                        {groupedByStatus[status].length} {groupedByStatus[status].length === 1 ? 'project' : 'projects'}
                      </Badge>
                      
                      {/* 🔥 Urgency indicator - only show when collapsed and not Done */}
                      {!openStatuses.has(status) && status !== 'Done' && (() => {
                        const urgencyInfo = formatUrgencyInfo(groupedByStatus[status]);
                        if (!urgencyInfo) return null;
                        
                        return (
                          <Badge 
                            variant={urgencyInfo.variant === 'destructive' ? 'destructive' : urgencyInfo.variant === 'warning' ? 'default' : 'secondary'}
                            className={
                              urgencyInfo.variant === 'destructive'
                                ? 'text-xs bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700'
                                : urgencyInfo.variant === 'warning'
                                ? 'text-xs bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700'
                                : 'text-xs bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700'
                            }
                          >
                            {urgencyInfo.text}
                          </Badge>
                        );
                      })()}
                      
                      {!isPublicView && (
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            onCreateProject(undefined, status);
                          }}
                          className="p-0.5 rounded hover:bg-muted/50 transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                          title={`Create new project with status ${status}`}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              e.stopPropagation();
                              onCreateProject(undefined, status);
                            }
                          }}
                        >
                          <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                  </div>
                </CollapsibleTrigger>
              </div>

              {/* Status Group Content */}
              <CollapsibleContent>
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="group">
                        {visibleColumns.map((column, index) => {
                          // Map column IDs to widths and styles
                          const getColumnStyles = () => {
                            switch (column.id) {
                              case 'projectName':
                                return 'w-[420px] min-w-[420px] max-w-[420px] text-left pl-8';
                              case 'status':
                                return 'w-[140px] min-w-[140px] max-w-[140px] text-center';
                              case 'type':
                                return 'w-[120px] min-w-[120px] max-w-[120px] text-center';
                              case 'vertical':
                                return 'w-[140px] min-w-[140px] max-w-[140px] text-center';
                              case 'deliverables':
                                return 'w-[140px] min-w-[140px] max-w-[140px] text-center';
                              case 'assetsProgress':
                                return 'w-[120px] min-w-[120px] max-w-[120px] text-center';
                              case 'startDate':
                                return 'w-[120px] min-w-[120px] max-w-[120px] text-center';
                              case 'endDate':
                                return 'w-[140px] min-w-[140px] max-w-[140px] text-center';
                              case 'collaborators':
                                return 'w-[160px] min-w-[160px] max-w-[160px] text-center';
                              case 'links':
                                return 'w-[100px] min-w-[100px] max-w-[100px] text-center';
                              default:
                                return 'w-[120px] min-w-[120px] max-w-[120px] text-center';
                            }
                          };

                          return (
                            <DraggableTableHeader
                              key={column.id}
                              column={column}
                              index={index}
                              onReorder={reorderColumn}
                              className={getColumnStyles()}
                            >
                              {column.label}
                            </DraggableTableHeader>
                          );
                        })}
                        {!isPublicView && <TableHead className="w-[50px] min-w-[50px] max-w-[50px]"></TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(() => {
                        // Group projects by vertical within this status
                        const projectsByVertical = groupedByStatus[status].reduce((groups, project) => {
                          const vertical = project.vertical || 'Uncategorized';
                          if (!groups[vertical]) {
                            groups[vertical] = [];
                          }
                          groups[vertical].push(project);
                          return groups;
                        }, {} as Record<string, Project[]>);

                        // Sort verticals - special handling for Done status
                        const sortedVerticals = Object.keys(projectsByVertical).sort((a, b) => {
                          // Uncategorized always last
                          if (a === 'Uncategorized') return 1;
                          if (b === 'Uncategorized') return -1;
                          
                          // For Done status: sort by most recent completion date in each vertical
                          if (status === 'Done') {
                            // Find most recent completed_at in each vertical
                            const mostRecentA = projectsByVertical[a]
                              .filter(p => p.completed_at)
                              .map(p => new Date(p.completed_at!).getTime())
                              .sort((x, y) => y - x)[0] || 0; // Most recent first
                            
                            const mostRecentB = projectsByVertical[b]
                              .filter(p => p.completed_at)
                              .map(p => new Date(p.completed_at!).getTime())
                              .sort((x, y) => y - x)[0] || 0; // Most recent first
                            
                            if (mostRecentA !== mostRecentB) {
                              return mostRecentB - mostRecentA; // More recent = comes first (higher timestamp)
                            }
                          }
                          
                          // For other statuses: sort by most urgent project in each vertical
                          const urgencyA = getMostUrgentPriority(projectsByVertical[a]);
                          const urgencyB = getMostUrgentPriority(projectsByVertical[b]);
                          
                          if (urgencyA !== urgencyB) {
                            return urgencyA - urgencyB; // Lower priority = more urgent = comes first
                          }
                          
                          // If same urgency, sort alphabetically
                          return a.localeCompare(b);
                        });

                        // Render grouped by vertical
                        return sortedVerticals.flatMap((vertical, verticalIndex) => {
                          // Special sorting for Done status - sort by completion date (most recent first)
                          // This applies to vertical ordering within each vertical group
                          const projectsInVertical = status === 'Done' 
                            ? [...projectsByVertical[vertical]].sort((a, b) => {
                                // Projects with completed_at come first, sorted by most recent
                                if (a.completed_at && b.completed_at) {
                                  return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
                                }
                                if (a.completed_at && !b.completed_at) return -1;
                                if (!a.completed_at && b.completed_at) return 1;
                                // Fallback to urgency sorting for projects without completed_at
                                return 0;
                              })
                            : sortProjectsByUrgency(projectsByVertical[vertical]);
                          const verticalColor = verticalColors[vertical] || '#6b7280';
                          const verticalKey = `${status}-${vertical}`;
                          const isCollapsed = collapsedVerticals.has(verticalKey);
                          
                          return [
                            // Vertical Section Header Row
                            <TableRow 
                              key={`vertical-${status}-${vertical}`}
                              className="bg-muted/30 hover:bg-muted/40 border-t-2 border-muted cursor-pointer transition-colors"
                              onClick={(e) => toggleVerticalCollapse(status, vertical, e)}
                            >
                              <TableCell colSpan={8} className="py-2.5 px-6 text-left">
                                <div className="flex items-center gap-2 mt-[0px] mr-[0px] mb-[0px] ml-[-12px]">
                                  <ChevronRight 
                                    className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 ${
                                      isCollapsed ? '' : 'rotate-90'
                                    }`}
                                    style={{ color: verticalColor }}
                                  />
                                  <div 
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: verticalColor }}
                                  />
                                  <span 
                                    className="font-mono font-medium uppercase tracking-wide text-xs"
                                    style={{ color: verticalColor }}
                                  >
                                    {vertical}
                                  </span>
                                  <span 
                                    className="text-[10px] text-muted-foreground/60 font-mono ml-0.5"
                                  >
                                    ({projectsInVertical.length})
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>,
                            // Projects in this vertical (only show if not collapsed)
                            ...(isCollapsed ? [] : projectsInVertical.map((project) => (
                <ProjectTableRow
                  key={project.id}
                  project={project}
                  collaborators={collaborators}
                  verticalColors={verticalColors}
                  columns={visibleColumns}
                  config={{
                    indentLevel: 'status-subgroup',
                    showVerticalBadge: true,
                    rowPadding: 'pl-8',
                  }}
                  handlers={{
                    onClick: onProjectClick,
                    onEdit: onEditProject,
                    onDelete: (p) => onProjectDelete(p.id),
                    onUpdate: onProjectUpdate,
                    onNavigateToLightroom: onNavigateToLightroom || (() => {}),
                    onNavigateToGDrive: onNavigateToGDrive || (() => {}),
                    onAddLink: !isPublicView ? (projectId) => {
                      // 🆕 Open dialog with pre-filled project
                      setLinkDialogProjectId(projectId);
                      setLinkDialogOpen(true);
                    } : undefined,
                    onAddLightroom: !isPublicView ? (projectId) => {
                      // 🆕 Open dialog with pre-filled project
                      setLightroomDialogProjectId(projectId);
                      setLightroomDialogOpen(true);
                    } : undefined,
                    onAddGDrive: !isPublicView ? (projectId) => {
                      // 🆕 Open dialog with pre-filled project
                      setGdriveDialogProjectId(projectId);
                      setGdriveDialogOpen(true);
                    } : undefined,
                  }}
                  state={{
                    expandedAssets,
                    activeAssetPopover,
                    activeDatePopover,
                    activeStatusPopover: null,
                  }}
                  onStateChange={(newState) => {
                    if (newState.expandedAssets) setExpandedAssets(newState.expandedAssets);
                    if (newState.activeAssetPopover !== undefined) setActiveAssetPopover(newState.activeAssetPopover);
                    if (newState.activeDatePopover !== undefined) setActiveDatePopover(newState.activeDatePopover);
                  }}
                  isPublicView={isPublicView}
                />
              )))];
                        });
                      })()}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        );
            })}
          </>
        ) : (
          // GROUP BY VERTICAL MODE
          <>
            {/* Render grouped verticals */}
            {sortedVerticalKeys.map((vertical) => {
              const verticalColor = verticalColors[vertical] || '#6b7280';
              
              return (
                <Card key={vertical}>
                  <Collapsible
                    open={openVerticals.has(vertical)}
                    onOpenChange={() => toggleVertical(vertical)}
                  >
                    {/* Vertical Group Header */}
                    <div className="border-b border-border bg-muted/30">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors bg-[rgba(0,0,0,0)]">
                          <div className="flex items-center gap-3">
                            {openVerticals.has(vertical) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: verticalColor }}
                              />
                              <h3 
                                className="font-mono font-medium uppercase tracking-wide"
                                style={{ color: verticalColor }}
                              >
                                {vertical}
                              </h3>
                            </div>
                            <Badge 
                              variant="secondary" 
                              className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700"
                            >
                              {groupedByVerticalDesktop[vertical].length} {groupedByVerticalDesktop[vertical].length === 1 ? 'project' : 'projects'}
                            </Badge>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                    </div>

                    {/* Vertical Group Content */}
                    <CollapsibleContent>
                      <div className="overflow-auto">
                        <Table>
                          <TableHeader>
                            <TableRow className="group">
                              {columns.map((column, index) => {
                                const getColumnStyles = () => {
                                  switch (column.id) {
                                    case 'projectName':
                                      return 'w-[420px] min-w-[420px] max-w-[420px] text-left pl-8';
                                    case 'status':
                                      return 'w-[140px] min-w-[140px] max-w-[140px] text-center';
                                    case 'type':
                                      return 'w-[120px] min-w-[120px] max-w-[120px] text-center';
                                    case 'vertical':
                                      return 'w-[140px] min-w-[140px] max-w-[140px] text-center';
                                    case 'deliverables':
                                      return 'w-[140px] min-w-[140px] max-w-[140px] text-center';
                                    case 'assetsProgress':
                                      return 'w-[120px] min-w-[120px] max-w-[120px] text-center';
                                    case 'startDate':
                                      return 'w-[120px] min-w-[120px] max-w-[120px] text-center';
                                    case 'endDate':
                                      return 'w-[140px] min-w-[140px] max-w-[140px] text-center';
                                    case 'collaborators':
                                      return 'w-[160px] min-w-[160px] max-w-[160px] text-center';
                                    case 'links':
                                      return 'w-[100px] min-w-[100px] max-w-[100px] text-center';
                                    default:
                                      return 'w-[120px] min-w-[120px] max-w-[120px] text-center';
                                  }
                                };

                                return (
                                  <DraggableTableHeader
                                    key={column.id}
                                    column={column}
                                    index={index}
                                    onReorder={reorderColumn}
                                    className={getColumnStyles()}
                                  >
                                    {column.label}
                                  </DraggableTableHeader>
                                );
                              })}
                              {!isPublicView && <TableHead className="w-[50px] min-w-[50px] max-w-[50px]"></TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(() => {
                              // Group projects by status within this vertical
                              const projectsByStatus = groupedByVerticalDesktop[vertical].reduce((groups, project) => {
                                // Separate draft projects into "Draft" group
                                if (project.is_draft) {
                                  if (!groups['Draft']) {
                                    groups['Draft'] = [];
                                  }
                                  groups['Draft'].push(project);
                                } else {
                                  const status = project.status || 'No Status';
                                  if (!groups[status]) {
                                    groups[status] = [];
                                  }
                                  groups[status].push(project);
                                }
                                return groups;
                              }, {} as Record<string, Project[]>);

                              // Sort statuses by predefined order
                              const sortedStatuses = Object.keys(projectsByStatus).sort((a, b) => {
                                // Force "Draft" to always be first
                                if (a === 'Draft') return -1;
                                if (b === 'Draft') return 1;
                                
                                const indexA = statusOrder.indexOf(a);
                                const indexB = statusOrder.indexOf(b);
                                
                                if (indexA !== -1 && indexB !== -1) {
                                  return indexA - indexB;
                                }
                                
                                if (indexA !== -1) return -1;
                                if (indexB !== -1) return 1;
                                
                                return a.localeCompare(b);
                              });

                              // Render grouped by status
                              return sortedStatuses.flatMap((status, statusIndex) => {
                                // Special sorting for Done status - sort by completion date (most recent first)
                                const projectsInStatus = status === 'Done' 
                                  ? [...projectsByStatus[status]].sort((a, b) => {
                                      // Projects with completed_at come first, sorted by most recent
                                      if (a.completed_at && b.completed_at) {
                                        return new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime();
                                      }
                                      if (a.completed_at && !b.completed_at) return -1;
                                      if (!a.completed_at && b.completed_at) return 1;
                                      // Fallback to urgency sorting for projects without completed_at
                                      return 0;
                                    })
                                  : sortProjectsByUrgency(projectsByStatus[status]);
                                const statusKey = `${vertical}-${status}`;
                                const isCollapsed = collapsedStatuses.has(statusKey);
                                const statusBgColor = getStatusHeaderBgColor(status);
                                
                                return [
                                  // Status Section Header Row
                                  <TableRow 
                                    key={`status-${vertical}-${status}`}
                                    className="hover:bg-black/5 dark:hover:bg-white/5 border-t-2 border-muted cursor-pointer transition-colors"
                                    style={{ backgroundColor: statusBgColor }}
                                    onClick={(e) => toggleStatusCollapse(vertical, status, e)}
                                  >
                                    <TableCell colSpan={8} className="py-2.5 px-6 text-left">
                                      <div className="flex items-center gap-2 mt-[0px] mr-[0px] mb-[0px] ml-[-12px]">
                                        <ChevronRight 
                                          className={`w-4 h-4 transition-transform duration-200 flex-shrink-0 text-muted-foreground ${
                                            isCollapsed ? '' : 'rotate-90'
                                          }`}
                                        />
                                        <span className="font-mono text-xs text-muted-foreground">
                                          {status}
                                        </span>
                                        {!isPublicView && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onCreateProject(vertical, status);
                                            }}
                                            className="p-0.5 rounded hover:bg-muted/50 transition-colors opacity-60 hover:opacity-100"
                                            title={`Create new project in ${vertical} with status ${status}`}
                                          >
                                            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                                          </button>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>,
                                  // Projects in this status (only show if not collapsed)
                                  ...(isCollapsed ? [] : projectsInStatus.map((project) => (
                                    <ProjectTableRow
                                      key={project.id}
                                      project={project}
                                      collaborators={collaborators}
                                      verticalColors={verticalColors}
                                      columns={visibleColumns}
                                      config={{
                                        indentLevel: 'status-subgroup',
                                        showVerticalBadge: false,
                                        rowPadding: 'pl-8',
                                      }}
                                      handlers={{
                                        onClick: onProjectClick,
                                        onEdit: onEditProject,
                                        onDelete: (p) => onProjectDelete(p.id),
                                        onUpdate: onProjectUpdate,
                                        onNavigateToLightroom: onNavigateToLightroom || (() => {}),
                                        onNavigateToGDrive: onNavigateToGDrive || (() => {}),
                                        onAddLink: !isPublicView ? (projectId) => {
                                          // 🆕 Open dialog with pre-filled project
                                          setLinkDialogProjectId(projectId);
                                          setLinkDialogOpen(true);
                                        } : undefined,
                                        onAddLightroom: !isPublicView ? (projectId) => {
                                          // 🆕 Open dialog with pre-filled project
                                          setLightroomDialogProjectId(projectId);
                                          setLightroomDialogOpen(true);
                                        } : undefined,
                                        onAddGDrive: !isPublicView ? (projectId) => {
                                          // 🆕 Open dialog with pre-filled project
                                          setGdriveDialogProjectId(projectId);
                                          setGdriveDialogOpen(true);
                                        } : undefined,
                                      }}
                                      state={{
                                        expandedAssets,
                                        activeAssetPopover,
                                        activeDatePopover,
                                        activeStatusPopover: null,
                                      }}
                                      onStateChange={(newState) => {
                                        if (newState.expandedAssets) setExpandedAssets(newState.expandedAssets);
                                        if (newState.activeAssetPopover !== undefined) setActiveAssetPopover(newState.activeAssetPopover);
                                        if (newState.activeDatePopover !== undefined) setActiveDatePopover(newState.activeDatePopover);
                                      }}
                                      isPublicView={isPublicView}
                                    />
                                  )))
                                ];
                              });
                            })()}
                          </TableBody>
                        </Table>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </>
        )}
      </div>
      
      {/* 🆕 Add Assets Dialogs - Controlled from table */}
      <AddGDriveAssetDialog
        projects={projects}
        onProjectUpdate={onProjectUpdate}
        open={gdriveDialogOpen}
        onOpenChange={(open) => {
          setGdriveDialogOpen(open);
          if (!open) setGdriveDialogProjectId(undefined);
        }}
        prefilledProjectId={gdriveDialogProjectId}
      />
      
      <AddLightroomAssetDialog
        projects={projects}
        onProjectUpdate={onProjectUpdate}
        open={lightroomDialogOpen}
        onOpenChange={(open) => {
          setLightroomDialogOpen(open);
          if (!open) setLightroomDialogProjectId(undefined);
        }}
        prefilledProjectId={lightroomDialogProjectId}
      />
      
      <AddProjectLinkDialog
        projects={projects}
        onProjectUpdate={onProjectUpdate}
        open={linkDialogOpen}
        onOpenChange={(open) => {
          setLinkDialogOpen(open);
          if (!open) setLinkDialogProjectId(undefined);
        }}
        prefilledProjectId={linkDialogProjectId}
      />
    </>
  );
}
