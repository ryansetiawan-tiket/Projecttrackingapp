import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ExternalLink, Calendar, User, Clock, Target, MoreHorizontal, Edit, Trash2, FileText, Link as LinkIcon, ChevronDown, Info } from 'lucide-react';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { LightroomIcon } from './icons/LightroomIcon';
import { Project, Collaborator } from '../types/project';
import { useColors } from './ColorContext';
import { useStatusContext } from './StatusContext';
import { getContrastColor } from '../utils/colorUtils';
import { formatQuarterBadge } from '../utils/quarterUtils';
import { useLinkLabels } from '../hooks/useLinkLabels';
import { calculateProjectProgress, getProgressColorValue } from '../utils/taskProgress';
import { useEffect, useRef, useState } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { toast } from 'sonner@2.0.3';
import { AssetActionManager } from './AssetActionManager';

// Date formatting utility
const formatDate = (dateString: string) => {
  if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
    return '-';
  }
  
  try {
    const date = new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '-';
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric'
    });
  } catch (error) {
    console.warn('Error formatting date:', dateString, error);
    return '-';
  }
};

// Note: Quarter badge logic moved to utils/quarterUtils.ts
// This shows quarter range based on start_date and due_date

// Get initials from name
const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase();
};

// Get header color based on deadline proximity or status
const getDeadlineHeaderColor = (dueDateString: string, status: string, statuses: any[], getStatusBgColor: (status: string) => string) => {
  // If status is Done, use status badge color with light opacity
  if (status === 'Done') {
    const statusColor = getStatusBgColor(status);
    // Create a light version of the status color for the header
    return 'bg-green-50 dark:bg-green-900/40';
  }
  
  if (!dueDateString || dueDateString === '' || dueDateString === null || dueDateString === undefined) {
    return 'bg-gray-50 dark:bg-[#2A2A2F]'; // Default for projects without due date
  }
  
  try {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(dueDate.getTime())) {
      return 'bg-gray-50 dark:bg-[#2A2A2F]';
    }
    
    // Reset both dates to midnight for accurate day comparison
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Color scheme based on deadline proximity
    if (daysDiff < 0) {
      return 'bg-red-100 dark:bg-red-950/60'; // Overdue - Red
    } else if (daysDiff <= 3) {
      return 'bg-red-50 dark:bg-red-900/40'; // Very close (0-3 days) - Light Red
    } else if (daysDiff <= 7) {
      return 'bg-orange-50 dark:bg-orange-900/40'; // Close (4-7 days) - Orange
    } else if (daysDiff <= 14) {
      return 'bg-yellow-50 dark:bg-yellow-900/40'; // Getting close (8-14 days) - Yellow
    } else if (daysDiff <= 30) {
      return 'bg-blue-50 dark:bg-blue-900/40'; // Medium term (15-30 days) - Blue
    } else {
      return 'bg-green-50 dark:bg-green-900/40'; // Plenty of time (>30 days) - Green
    }
  } catch (error) {
    console.warn('Error calculating deadline proximity:', dueDateString, error);
    return 'bg-gray-50 dark:bg-[#2A2A2F]';
  }
};

// Get days left message for urgent projects
const getDaysLeftMessage = (dueDateString: string, status: string) => {
  // Don't show days left if project is done
  if (status === 'Done') {
    return {
      message: 'Completed',
      color: 'text-green-700 dark:text-green-400'
    };
  }
  
  if (!dueDateString || dueDateString === '' || dueDateString === null || dueDateString === undefined) {
    return null;
  }
  
  try {
    const dueDate = new Date(dueDateString);
    const now = new Date();
    
    // Check if date is valid
    if (isNaN(dueDate.getTime())) {
      return null;
    }
    
    // Reset both dates to midnight for accurate day comparison
    now.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    // Calculate days difference
    const timeDiff = dueDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // Only show for urgent projects (14 days or less)
    if (daysDiff < 0) {
      const overdueDays = Math.abs(daysDiff);
      return {
        message: `${overdueDays} day${overdueDays === 1 ? '' : 's'} overdue`,
        color: 'text-red-700 dark:text-red-400'
      };
    } else if (daysDiff === 0) {
      return {
        message: 'Due today',
        color: 'text-red-700 dark:text-red-400'
      };
    } else if (daysDiff <= 14) {
      return {
        message: `${daysDiff} day${daysDiff === 1 ? '' : 's'} left`,
        color: daysDiff <= 3 ? 'text-red-700 dark:text-red-400' : daysDiff <= 7 ? 'text-orange-700 dark:text-orange-400' : 'text-yellow-700 dark:text-yellow-400'
      };
    }
    
    return null;
  } catch (error) {
    console.warn('Error calculating days left:', dueDateString, error);
    return null;
  }
};

interface ProjectCardProps {
  project: Project;
  collaborators: Collaborator[];
  onProjectClick: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  onProjectUpdate?: (id: string, data: Partial<Project>) => void;
  onNavigateToLightroom?: (projectId: string) => void;
  onNavigateToGDrive?: (projectId: string) => void;
  showVerticalBadge?: boolean;
  isPublicView?: boolean;
}

export function ProjectCard({
  project,
  collaborators,
  onProjectClick,
  onEditProject,
  onDeleteProject,
  onProjectUpdate,
  onNavigateToLightroom,
  onNavigateToGDrive,
  showVerticalBadge = true,
  isPublicView = false
}: ProjectCardProps) {
  // Use color context for consistent colors across app
  const { verticalColors, typeColors } = useColors();
  const { statuses, getStatusColor: getStatusBgColor, getStatusTextColor, isManualStatus, shouldAutoTriggerStatus } = useStatusContext();
  const { linkLabels } = useLinkLabels();

  // Calculate project progress
  const projectProgress = calculateProjectProgress(project.actionable_items);
  
  // Use ref to track if we've already triggered an update for this progress/status combination
  const lastUpdateRef = useRef<string>('');
  
  // State for expandable assets sections
  const [isAssetsExpanded, setIsAssetsExpanded] = useState(false);
  
  // State for notes dialog
  const [isNotesDialogOpen, setIsNotesDialogOpen] = useState(false);
  const [expandedAssetIds, setExpandedAssetIds] = useState<Set<string>>(new Set());
  
  // Toggle individual asset expansion
  const toggleAssetExpansion = (assetId: string) => {
    setExpandedAssetIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };
  
  // Helper function to check if auto-trigger should happen
  const checkIfShouldAutoTrigger = (assets: typeof project.actionable_items, targetStatus: string): boolean => {
    if (!assets || assets.length === 0) return false;
    
    // For "Done" status - ALL actions in ALL assets must be completed
    if (targetStatus.toLowerCase() === 'done') {
      const allActionsComplete = assets.every(asset => {
        // If asset has no actions, consider it complete
        if (!asset.actions || asset.actions.length === 0) {
          return asset.is_completed || asset.status === 'Done';
        }
        // All actions must be completed
        return asset.actions.every(a => a.completed);
      });
      
      console.log(`[Auto-trigger Check] "${targetStatus}": All actions complete? ${allActionsComplete}`);
      return allActionsComplete;
    }
    
    // For other statuses (e.g., "Lightroom", "On Hold") - check if ALL assets have reached that phase
    const allAssetsReady = assets.every(asset => {
      // If asset has no actions, it's considered ready
      if (!asset.actions || asset.actions.length === 0) {
        return true;
      }
      
      // Check if this asset has an action matching the target status
      const targetAction = asset.actions.find(a => 
        a.name.toLowerCase().trim() === targetStatus.toLowerCase().trim()
      );
      
      // If asset doesn't have this action, it's considered ready (doesn't block)
      if (!targetAction) {
        return true;
      }
      
      // Asset has the action - it must be completed
      return targetAction.completed;
    });
    
    console.log(`[Auto-trigger Check] "${targetStatus}": All assets ready? ${allAssetsReady}`);
    return allAssetsReady;
  };
  
  // Auto-update status based on progress (bidirectional)
  useEffect(() => {
    if (!onProjectUpdate || projectProgress === null) return;

    // CRITICAL: DO NOT auto-calculate status for manually set statuses
    // These statuses are set explicitly by user and should be preserved
    // Uses dynamic check from StatusContext - no more hardcoded status names!
    const isManual = isManualStatus(project.status);
    
    console.log(`[ProjectCard] Auto-status check for "${project.name}":`, {
      status: project.status,
      isManual,
      progress: projectProgress,
      willSkip: isManual
    });
    
    if (isManual) {
      console.log(`[ProjectCard] ✅ Skipping auto-status for manual status: ${project.status}`);
      return; // Never auto-calculate for manual statuses
    }

    // Determine the appropriate status based on progress
    let newStatus: string | null = null;

    // Calculate total action count across all assets
    const totalActionCount = (project.actionable_items || []).reduce((sum, asset) => {
      return sum + (asset.actions?.length || 0);
    }, 0);

    if (projectProgress === 100 && project.status !== 'Done') {
      // Progress is 100% but status is not Done → set to Done
      newStatus = 'Done';
      // Will set completed_at in the update below
    } else if (projectProgress === 0 && project.status === 'Not Started') {
      // IMPORTANT: Do nothing if already "Not Started" at 0%
      // This prevents unnecessary updates
      newStatus = null;
    } else if (projectProgress === 0 && project.status !== 'Not Started') {
      // CRITICAL EDGE CASE FIX: For single-action projects only!
      // If project has only 1 action total, preserve "In Progress" at 0%
      // This handles edge case where progress can only be 0% or 100% (no middle ground)
      // For multi-action projects, allow revert to "Not Started" (normal behavior)
      if (project.status === 'In Progress' && totalActionCount === 1) {
        console.log(`[ProjectCard] Preserving "In Progress" for single-action project at 0%`);
        newStatus = null; // Do NOT revert to "Not Started"
      } else {
        // For other statuses OR multi-action projects at 0%, set to "Not Started"
        newStatus = 'Not Started';
      }
    } else if (projectProgress > 0 && projectProgress < 100 && project.status !== 'In Progress') {
      // Progress is between 1-99% but status is not In Progress → set to In Progress
      // This handles both: Not Started → In Progress AND Done → In Progress
      newStatus = 'In Progress';
    }

    // Apply the status change if needed (with deduplication)
    if (newStatus) {
      const updateKey = `${project.id}-${projectProgress}-${newStatus}`;
      if (lastUpdateRef.current !== updateKey) {
        lastUpdateRef.current = updateKey;
        
        console.log(`[ProjectCard] Auto-updating status from ${project.status} to ${newStatus} (progress: ${projectProgress}%)`);
        
        // Use a small delay to batch updates and avoid race conditions
        const timer = setTimeout(() => {
          // Track completion timestamp when status changes to Done
          onProjectUpdate(project.id, { 
            status: newStatus,
            completed_at: newStatus === 'Done' ? new Date().toISOString() : null
          });
        }, 200);
        
        return () => clearTimeout(timer);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectProgress, project.status, project.id]);

  // Helper function to render custom icon
  const renderLinkIcon = (label: string) => {
    const linkLabel = linkLabels?.find(ll => ll.label.toLowerCase() === label.toLowerCase());
    
    if (!linkLabel) {
      return <LinkIcon className="h-6 w-6" />;
    }

    if (linkLabel.icon_type === 'emoji') {
      return <span className="text-xl leading-none">{linkLabel.icon_value}</span>;
    } else if (linkLabel.icon_type === 'svg') {
      return (
        <div 
          className="w-6 h-6 flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto" 
          dangerouslySetInnerHTML={{ __html: linkLabel.icon_value }}
        />
      );
    } else {
      return <LinkIcon className="h-6 w-6" />;
    }
  };

  // Get status options from context (only table statuses, not archive)
  const statusOptions = statuses
    .filter(s => s.displayIn === 'table')
    .map(s => s.name);



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Progress':
        return <Clock className="h-3 w-3" />;
      case 'Done':
        return <Target className="h-3 w-3" />;
      default:
        return null;
    }
  };

  return (
    <>
    <Card 
      className="group cursor-pointer hover:shadow-lg transition-all duration-200 border-2 border-border/50 hover:border-border shadow-sm dark:bg-[#1A1A1D] dark:border-[#2E2E32] dark:shadow-[0_4px_12px_rgba(0,0,0,0.4)] dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.5)] bg-[rgb(255,255,255)]"
      onClick={() => onProjectClick(project)}
    >
      <CardContent className="p-0">
        {/* Header Section with Project Title and Badges */}
        <div className={`${getDeadlineHeaderColor(project.due_date, project.status, statuses, getStatusBgColor)} px-4 py-3 rounded-t-lg relative`}>
          {/* Actions Dropdown - Top Right Corner */}
          {!isPublicView && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 h-8 w-8 p-0 bg-background/70 dark:bg-background/60 hover:bg-background/90 dark:hover:bg-background/80 transition-colors duration-200 text-muted-foreground hover:text-foreground"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditProject(project);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                {onDeleteProject && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteProject(project);
                    }}
                    className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600 dark:text-red-400 dark:focus:text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Project Title with Vertical Badge */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1 flex-wrap pr-10">
              {/* Draft Badge - Show first if project is draft */}
              {project.is_draft && (
                <Badge 
                  className="text-xs px-2 py-0.5 border bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700"
                >
                  Draft
                </Badge>
              )}
              {/* Vertical Badge - Only show if showVerticalBadge is true */}
              {project.vertical && showVerticalBadge && (
                <Badge 
                  className="text-xs font-medium px-2 py-1 border-0 shrink-0"
                  style={{ 
                    backgroundColor: verticalColors[project.vertical] || '#3b82f6',
                    color: getContrastColor(verticalColors[project.vertical] || '#3b82f6')
                  }}
                >
                  {project.vertical}
                </Badge>
              )}
              {/* Quarter Badge - Text only style */}
              {formatQuarterBadge(project.start_date, project.due_date) && (
                <span className="text-xs text-muted-foreground font-mono flex-shrink-0 text-left">
                  {formatQuarterBadge(project.start_date, project.due_date)}
                </span>
              )}
              {/* Notes Icon Button - Only show if notes exist */}
              {project.notes && project.notes.trim() && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 flex-shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsNotesDialogOpen(true);
                  }}
                >
                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
                </Button>
              )}
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg leading-tight">
                {project.project_name}
              </h3>
            </div>
            
            {/* Progress Bar - Show if there are tasks with actions */}
            {projectProgress !== null && (
              <div className="mt-2 flex items-center gap-1 w-full">
                <div className="flex-1 min-w-0 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${projectProgress}%`,
                      backgroundColor: getProgressColorValue(projectProgress)
                    }}
                  />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex-shrink-0 pt-[0px] pr-[0px] pb-[0px] pl-[2px]">
                  {projectProgress}%
                </span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Status Badge - Clickable for quick change (but NOT for public view) */}
            {onProjectUpdate && !isPublicView ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button 
                    className="focus:outline-none"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Badge 
                      className="text-xs font-medium px-3 py-1 flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity border-0"
                      style={{
                        backgroundColor: getStatusBgColor(project.status),
                        color: getStatusTextColor(project.status)
                      }}
                    >
                      {getStatusIcon(project.status)}
                      {project.status}
                    </Badge>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
                  {statusOptions.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation();
                        
                        // When status changes to "Done", auto-complete all assets AND all actions
                        if (status === 'Done' && project.actionable_items && project.actionable_items.length > 0) {
                          const updatedAssets = project.actionable_items.map(asset => ({
                            ...asset,
                            status: 'Done',
                            is_completed: true,
                            // Complete ALL actions within this asset
                            actions: asset.actions?.map(action => ({
                              ...action,
                              completed: true
                            })) || []
                          }));
                          
                          onProjectUpdate(project.id, { 
                            status,
                            actionable_items: updatedAssets
                          });
                        } else {
                          onProjectUpdate(project.id, { status });
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <Badge 
                        className="text-xs font-medium w-full justify-center border-0"
                        style={{
                          backgroundColor: getStatusBgColor(status),
                          color: getStatusTextColor(status)
                        }}
                      >
                        {status}
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Badge 
                className="text-xs font-medium px-3 py-1 flex items-center gap-1 border-0"
                style={{
                  backgroundColor: getStatusBgColor(project.status),
                  color: getStatusTextColor(project.status)
                }}
              >
                {getStatusIcon(project.status)}
                {project.status}
              </Badge>
            )}
            
            {/* Days Left Warning - Only for urgent projects or Completed status */}
            {(() => {
              const daysLeftInfo = getDaysLeftMessage(project.due_date, project.status);
              return daysLeftInfo && (
                <div className={`text-xs font-medium px-2 py-1 rounded-md bg-background/70 dark:bg-background/40 ${daysLeftInfo.color} flex items-center gap-1`}>
                  {project.status === 'Done' ? <Target className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {daysLeftInfo.message}
                </div>
              );
            })()}
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-4">
          
          {/* Type Badges */}
          {/* Type badges removed - now displayed inline with project name */}

          {/* Dates Section */}
          <div className="flex items-center justify-between py-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">START DATE</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(project.start_date)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">DUE DATE</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{formatDate(project.due_date)}</p>
              </div>
            </div>
          </div>

          {/* Tasks Section */}
          {project.actionable_items && project.actionable_items.length > 0 && (
            <div 
              className="bg-gray-50 dark:bg-[#2A2A2F] rounded-lg p-3"
              onClick={(e) => e.stopPropagation()}
            >
              <Collapsible open={isAssetsExpanded} onOpenChange={setIsAssetsExpanded}>
                {/* Header - Clickable to expand/collapse */}
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide flex-shrink-0">ASSETS</span>
                      
                      {/* Type Badges - Show max 2 */}
                      {(() => {
                        // Collect all types from:
                        // 1. Project-level types (project.types array or project.type single)
                        // 2. Asset-level types (actionableItems[].type)
                        const typesSet = new Set<string>();
                        
                        // Add project-level types
                        if (Array.isArray(project.types) && project.types.length > 0) {
                          project.types.forEach(type => typesSet.add(type));
                        } else if (project.type) {
                          typesSet.add(project.type);
                        }
                        
                        // Add asset-level types
                        project.actionable_items.forEach(item => {
                          if (item.type) typesSet.add(item.type);
                        });
                        
                        const uniqueTypes = Array.from(typesSet);
                        
                        if (uniqueTypes.length === 0) return null;
                        
                        const displayTypes = uniqueTypes.slice(0, 2);
                        const remainingCount = uniqueTypes.length - displayTypes.length;
                        
                        return (
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {displayTypes.slice(0, 1).map((type) => (
                              <Badge 
                                key={type}
                                className="text-[10px] h-4 px-1.5 border-0" 
                                style={{ 
                                  backgroundColor: `${typeColors[type] || '#6b7280'}20`,
                                  color: typeColors[type] || '#6b7280'
                                }}
                              >
                                {type}
                              </Badge>
                            ))}
                            {(displayTypes.length > 1 || remainingCount > 0) && (
                              <span className="text-[12px] text-muted-foreground">
                                +{displayTypes.length - 1 + remainingCount}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <Badge className="text-xs bg-muted dark:bg-[#1A1A1D] text-muted-foreground dark:text-gray-300 flex-shrink-0" variant="outline">
                      {project.actionable_items.filter(item => item.status === 'Done' || item.is_completed).length}/{project.actionable_items.length} done
                    </Badge>
                  </div>
                </CollapsibleTrigger>

                {/* Collapsed View - Show first 2 assets with individual chevron */}
                {!isAssetsExpanded && (
                  <div className="space-y-2 mb-3">
                    {project.actionable_items.slice(0, 2).map((item) => {
                      const isDone = item.status === 'Done' || item.is_completed;
                      const hasActions = item.actions && item.actions.length > 0;
                      const isExpanded = expandedAssetIds.has(item.id);
                      
                      return (
                        <div key={item.id} className="border border-border rounded-md overflow-hidden">
                          {/* Asset Header with individual chevron */}
                          <div
                            onClick={() => hasActions && toggleAssetExpansion(item.id)}
                            className={`flex items-center justify-between p-2 ${
                              hasActions ? 'cursor-pointer hover:bg-muted/50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {hasActions && (
                                <ChevronDown 
                                  className={`h-3 w-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                                    isExpanded ? '' : '-rotate-90'
                                  }`}
                                />
                              )}
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0" 
                                style={{ 
                                  backgroundColor: getStatusBgColor(item.status || 'Not Started')
                                }}
                              />
                              <span className={`text-sm truncate ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                {item.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {hasActions && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                  {Math.round((item.actions.filter(a => a.completed).length / item.actions.length) * 100)}%
                                </Badge>
                              )}
                              
                              {/* Illustration Type Badge */}
                              {item.illustration_type && (
                                <Badge 
                                  variant="outline"
                                  className="text-[10px] h-4 px-1.5 flex-shrink-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800" 
                                >
                                  {item.illustration_type}
                                </Badge>
                              )}
                              
                              {/* Type Badge for single asset */}
                              {item.type && (
                                <Badge 
                                  className="text-[10px] h-4 px-1.5 border-0 flex-shrink-0" 
                                  style={{ 
                                    backgroundColor: `${typeColors[item.type] || '#6b7280'}20`,
                                    color: typeColors[item.type] || '#6b7280'
                                  }}
                                >
                                  {item.type}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Asset Actions - 2 Column Grid (in collapsed view) */}
                          {hasActions && isExpanded && (
                            <div className="bg-muted/30 px-2 py-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
                              <AssetActionManager
                                actions={item.actions}
                                hideProgress={true}
                                gridLayout={true}
                                status={item.status}
                                readOnly={isPublicView}
                                compact={true}
                                onStatusChange={(newStatus) => {
                                  // Update asset status based on action completion
                                  const updatedAssets = (project.actionable_items || []).map(asset => 
                                    asset.id === item.id 
                                      ? { ...asset, status: newStatus }
                                      : asset
                                  );
                                  
                                  if (onProjectUpdate) {
                                    onProjectUpdate(project.id, { 
                                      actionable_items: updatedAssets
                                    });
                                  }
                                }}
                                onChange={(updatedActions) => {
                                  // 🎯 Check if any newly MANUALLY checked action should trigger project status change
                                  const previousActions = item.actions || [];
                                  const newlyCheckedAction = updatedActions.find((newAction, idx) => {
                                    const oldAction = previousActions[idx];
                                    return newAction.completed && 
                                           (!oldAction || !oldAction.completed) && 
                                           !newAction.wasAutoChecked;
                                  });
                                  
                                  let statusOverride: string | undefined = undefined;
                                  if (newlyCheckedAction) {
                                    const triggerResult = shouldAutoTriggerStatus(newlyCheckedAction.name);
                                    if (triggerResult.shouldTrigger && triggerResult.statusName) {
                                      const updatedAssets = (project.actionable_items || []).map(asset => 
                                        asset.id === item.id 
                                          ? { ...asset, actions: updatedActions }
                                          : asset
                                      );
                                      
                                      const shouldAutoTriggerNow = checkIfShouldAutoTrigger(updatedAssets, triggerResult.statusName);
                                      
                                      if (shouldAutoTriggerNow) {
                                        console.log(`[ProjectCard Mobile Collapsed] 🎯 Auto-trigger: "${newlyCheckedAction.name}" → "${triggerResult.statusName}"`);
                                        statusOverride = triggerResult.statusName;
                                      } else {
                                        console.log(`[ProjectCard Mobile Collapsed] ⏸️ Auto-trigger blocked: Other assets not ready`);
                                      }
                                    }
                                  }
                                  
                                  const updatedAssets = (project.actionable_items || []).map(asset => 
                                    asset.id === item.id 
                                      ? { ...asset, actions: updatedActions }
                                      : asset
                                  );
                                  
                                  if (onProjectUpdate) {
                                    if (statusOverride) {
                                      onProjectUpdate(project.id, { 
                                        actionable_items: updatedAssets,
                                        status: statusOverride
                                      });
                                      toast.success(`Action completed • Status updated to "${statusOverride}"`);
                                    } else {
                                      onProjectUpdate(project.id, { 
                                        actionable_items: updatedAssets
                                      });
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {project.actionable_items.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        +{project.actionable_items.length - 2} more assets
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded View - Show all assets with actions */}
                <CollapsibleContent>
                  <div className="space-y-2 mb-3">
                    {project.actionable_items.map((item) => {
                      const isDone = item.status === 'Done' || item.is_completed;
                      const hasActions = item.actions && item.actions.length > 0;
                      const isExpanded = expandedAssetIds.has(item.id);
                      
                      return (
                        <div key={item.id} className="border border-border rounded-md overflow-hidden">
                          {/* Asset Header */}
                          <div
                            onClick={() => hasActions && toggleAssetExpansion(item.id)}
                            className={`flex items-center justify-between p-2 ${
                              hasActions ? 'cursor-pointer hover:bg-muted/50' : ''
                            }`}
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {hasActions && (
                                <ChevronDown 
                                  className={`h-3 w-3 text-muted-foreground flex-shrink-0 transition-transform duration-200 ${
                                    isExpanded ? '' : '-rotate-90'
                                  }`}
                                />
                              )}
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0" 
                                style={{ 
                                  backgroundColor: getStatusBgColor(item.status || 'Not Started')
                                }}
                              />
                              <span className={`text-sm truncate ${isDone ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                {item.title}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {hasActions && (
                                <Badge variant="secondary" className="text-xs flex-shrink-0">
                                  {Math.round((item.actions.filter(a => a.completed).length / item.actions.length) * 100)}%
                                </Badge>
                              )}
                              
                              {/* Illustration Type Badge */}
                              {item.illustration_type && (
                                <Badge 
                                  variant="outline"
                                  className="text-[10px] h-4 px-1.5 flex-shrink-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800" 
                                >
                                  {item.illustration_type}
                                </Badge>
                              )}
                              
                              {/* Type Badge for single asset */}
                              {item.type && (
                                <Badge 
                                  className="text-[10px] h-4 px-1.5 border-0 flex-shrink-0" 
                                  style={{ 
                                    backgroundColor: `${typeColors[item.type] || '#6b7280'}20`,
                                    color: typeColors[item.type] || '#6b7280'
                                  }}
                                >
                                  {item.type}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Asset Actions - 2 Column Grid */}
                          {hasActions && isExpanded && (
                            <div className="bg-muted/30 px-2 py-2 border-t border-border" onClick={(e) => e.stopPropagation()}>
                              <AssetActionManager
                                actions={item.actions}
                                hideProgress={true}
                                gridLayout={true}
                                status={item.status}
                                readOnly={isPublicView}
                                compact={true}
                                onStatusChange={(newStatus) => {
                                  // Update asset status based on action completion
                                  const updatedAssets = (project.actionable_items || []).map(asset => 
                                    asset.id === item.id 
                                      ? { ...asset, status: newStatus }
                                      : asset
                                  );
                                  
                                  if (onProjectUpdate) {
                                    onProjectUpdate(project.id, { 
                                      actionable_items: updatedAssets
                                    });
                                  }
                                }}
                                onChange={(updatedActions) => {
                                  // 🎯 Check if any newly MANUALLY checked action should trigger project status change
                                  // IMPORTANT: Only manually checked actions trigger status (not auto-checked ones)
                                  const previousActions = item.actions || [];
                                  const newlyCheckedAction = updatedActions.find((newAction, idx) => {
                                    const oldAction = previousActions[idx];
                                    // Must be: newly completed AND NOT auto-checked
                                    return newAction.completed && 
                                           (!oldAction || !oldAction.completed) && 
                                           !newAction.wasAutoChecked;
                                  });
                                  
                                  let statusOverride: string | undefined = undefined;
                                  if (newlyCheckedAction) {
                                    const triggerResult = shouldAutoTriggerStatus(newlyCheckedAction.name);
                                    if (triggerResult.shouldTrigger && triggerResult.statusName) {
                                      // ✅ Check if ALL assets are ready before auto-triggering
                                      const updatedAssets = (project.actionable_items || []).map(asset => 
                                        asset.id === item.id 
                                          ? { ...asset, actions: updatedActions }
                                          : asset
                                      );
                                      
                                      const shouldAutoTriggerNow = checkIfShouldAutoTrigger(updatedAssets, triggerResult.statusName);
                                      
                                      if (shouldAutoTriggerNow) {
                                        console.log(`[ProjectCard Mobile] 🎯 Auto-trigger: "${newlyCheckedAction.name}" → "${triggerResult.statusName}" (all assets ready)`);
                                        statusOverride = triggerResult.statusName;
                                      } else {
                                        console.log(`[ProjectCard Mobile] ⏸️ Auto-trigger blocked: Other assets not ready for "${triggerResult.statusName}"`);
                                      }
                                    }
                                  }
                                  
                                  // Calculate completion status
                                  const completedCount = updatedActions.filter(a => a.completed).length;
                                  const totalCount = updatedActions.length;
                                  const allCompleted = totalCount > 0 && completedCount === totalCount;
                                  
                                  // Update this asset with new actions
                                  const updatedAssets = (project.actionable_items || []).map(asset => 
                                    asset.id === item.id 
                                      ? { 
                                          ...asset, 
                                          actions: updatedActions,
                                          is_completed: allCompleted
                                        }
                                      : asset
                                  );
                                  
                                  // Update project
                                  if (onProjectUpdate) {
                                    if (statusOverride) {
                                      onProjectUpdate(project.id, { 
                                        actionable_items: updatedAssets,
                                        status: statusOverride
                                      });
                                      toast.success(`Action completed • Status updated to "${statusOverride}"`);
                                    } else {
                                      onProjectUpdate(project.id, { 
                                        actionable_items: updatedAssets
                                      });
                                    }
                                  }
                                }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </div>
          )}

          {/* Quick Links & Deliverables (Lightroom & GDrive) */}
          {(project.links?.figma || project.links?.lightroom || project.lightroom_assets?.length || project.gdrive_assets?.length || (project.links?.other && project.links.other.length > 0) || (project.links?.labeled && project.links.labeled.length > 0)) && (
            <div className="flex flex-wrap items-center gap-2">
              {/* Circular Icon Buttons - Links */}
              {project.links?.figma && (
                <a
                  href={project.links.figma}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center h-11 w-11 bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] rounded-full border border-border/30 dark:border-[#2E2E32] transition-all duration-200 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:scale-105 active:scale-95"
                  title="Figma Design"
                >
                  {renderLinkIcon('Figma')}
                </a>
              )}
              {project.links?.other && project.links.other.slice(0, 3).map((link, index) => {
                // Try to find matching linkLabel by URL or use generic
                const matchingLabel = linkLabels?.find(ll => link.includes(ll.label.toLowerCase()));
                const label = matchingLabel?.label || `Link ${index + 1}`;
                return (
                  <a
                    key={index}
                    href={link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center h-11 w-11 bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] rounded-full border border-border/30 dark:border-[#2E2E32] transition-all duration-200 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:scale-105 active:scale-95"
                    title={label}
                  >
                    {matchingLabel ? renderLinkIcon(matchingLabel.label) : <LinkIcon className="h-6 w-6" />}
                  </a>
                );
              })}
              {/* New flexible structure for labeled links */}
              {project.links?.labeled && project.links.labeled.slice(0, 3).map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center justify-center h-11 w-11 bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] rounded-full border border-border/30 dark:border-[#2E2E32] transition-all duration-200 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:scale-105 active:scale-95"
                  title={link.label}
                >
                  {renderLinkIcon(link.label)}
                </a>
              ))}

              {/* Spacer to push deliverables to the right */}
              <div className="flex-1 min-w-2" />

              {/* Deliverables Icon Buttons - Flattened structure */}
              {/* Lightroom Icon Button */}
              {(project.lightroom_assets && project.lightroom_assets.length > 0) && onNavigateToLightroom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToLightroom(project.id);
                  }}
                  className="inline-flex items-center justify-center h-11 w-11 bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] rounded-full border border-border/30 dark:border-[#2E2E32] transition-all duration-200 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:scale-105 active:scale-95"
                  title={`Lightroom (${project.lightroom_assets.length})`}
                >
                  <LightroomIcon className="h-6 w-6" />
                </button>
              )}
              
              {/* GDrive Icon Button */}
              {project.gdrive_assets && project.gdrive_assets.length > 0 && onNavigateToGDrive && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateToGDrive(project.id);
                  }}
                  className="inline-flex items-center justify-center h-11 w-11 bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] rounded-full border border-border/30 dark:border-[#2E2E32] transition-all duration-200 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white hover:scale-105 active:scale-95"
                  title={`Google Drive (${project.gdrive_assets.length})`}
                >
                  <GoogleDriveIcon className="h-6 w-6" />
                </button>
              )}
            </div>
          )}

          {/* Footer with Collaborators */}
          <div className="flex items-center justify-between pt-2 border-t border-border dark:border-[#2E2E32]">
            {project.collaborators && project.collaborators.length > 0 ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  {project.collaborators.slice(0, 3).map((collaborator, index) => {
                    const displayName = collaborator.nickname || collaborator.name || 'Unknown';
                    const hasProfileUrl = collaborator.profile_url && collaborator.profile_url.trim() !== '';
                    
                    const content = (
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-6 w-6 border border-border dark:border-[#2E2E32]">
                          {collaborator.photo_url && (
                            <img 
                              src={collaborator.photo_url} 
                              alt={displayName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          )}
                          <AvatarFallback className="text-[10px] font-medium bg-muted dark:bg-[#2A2A2F] dark:text-gray-300">
                            {getInitials(displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm text-foreground">
                          {displayName}
                          {index < Math.min(project.collaborators.length - 1, 2) && ' '}
                        </span>
                      </div>
                    );
                    
                    return hasProfileUrl ? (
                      <a
                        key={index}
                        href={collaborator.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="cursor-pointer hover:opacity-70 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {content}
                      </a>
                    ) : (
                      <div key={index}>
                        {content}
                      </div>
                    );
                  })}
                  {project.collaborators.length > 3 && (
                    <span className="text-sm text-muted-foreground ml-1">
                      +{project.collaborators.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                No members
              </div>
            )}


          </div>
        </div>
      </CardContent>
    </Card>
    
    {/* Notes Dialog - Super Simple */}
    <Dialog open={isNotesDialogOpen} onOpenChange={setIsNotesDialogOpen}>
      <DialogContent className="sm:max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            Project Notes
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-foreground whitespace-pre-wrap break-words">
            {project.notes}
          </p>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
