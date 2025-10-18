import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Workflow as WorkflowIcon } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { AssetActionManager } from '../AssetActionManager';
import { ActionableItem, ProjectStatus, AssetAction } from '../../types/project';
import { getProgressColorValue, calculateAssetProgress } from '../../utils/taskProgress';
import { useStatusContext } from '../StatusContext';
import { useActionPresets } from '../ActionPresetContext';
import { useWorkflows } from '../WorkflowContext';
import { useColors } from '../ColorContext';
import { 
  getAssetProgress, 
  getDaysUntilDeadline, 
  getDeadlineUrgency, 
  getUrgencyColor, 
  getBulletColor,
  calculateProjectStatus 
} from './helpers';

interface AssetProgressBarProps {
  projectId: string;
  projectStatus: ProjectStatus;
  projectDueDate: string | null | undefined;
  projectType?: string;
  projectTypes?: string[];
  actionableItems: ActionableItem[] | undefined;
  isPublicView: boolean;
  isExpanded: boolean;
  onToggleExpansion: (e: React.MouseEvent) => void;
  onUpdateProject: (data: { actionable_items?: ActionableItem[]; status?: ProjectStatus }) => void;
  activeAssetPopover: string | null;
  onActiveAssetPopoverChange: (value: string | null) => void;
  statusOptions: string[];
  sortedStatuses: Array<{ name: string; order: number }>;
}

export function AssetProgressBar({
  projectId,
  projectStatus,
  projectDueDate,
  projectType,
  projectTypes,
  actionableItems,
  isPublicView,
  isExpanded,
  onToggleExpansion,
  onUpdateProject,
  activeAssetPopover,
  onActiveAssetPopoverChange,
  statusOptions,
  sortedStatuses
}: AssetProgressBarProps) {
  const { shouldAutoTriggerStatus, getStatusColor, getStatusTextColor } = useStatusContext();
  const { presets } = useActionPresets();
  const { workflows } = useWorkflows();
  const { typeColors } = useColors();
  const assetProgress = getAssetProgress(actionableItems);
  
  // Track empty state popover (asset-specific)
  const [emptyAssetPopover, setEmptyAssetPopover] = useState<string | null>(null);
  const [emptyPopoverView, setEmptyPopoverView] = useState<'menu' | 'actions' | 'workflow'>('menu');
  const [emptyActionSearch, setEmptyActionSearch] = useState('');
  
  // Track which individual assets are expanded (for collapsible accordion)
  const [expandedAssetIds, setExpandedAssetIds] = useState<Set<string>>(() => {
    // Auto-expand first asset or assets with few actions
    const initialExpanded = new Set<string>();
    if (actionableItems && actionableItems.length > 0) {
      actionableItems.forEach((asset, index) => {
        const actionCount = asset.actions?.length || 0;
        if (index === 0 || actionCount < 5) {
          initialExpanded.add(asset.id);
        }
      });
    }
    return initialExpanded;
  });
  
  // No assets - don't render anything
  if (assetProgress === null || !actionableItems || actionableItems.length === 0) {
    return null;
  }
  
  // Helper function to check if auto-trigger should happen (multi-asset check)
  const checkIfShouldAutoTrigger = (assets: ActionableItem[], targetStatus: string): boolean => {
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
      
      console.log(`[Desktop Auto-trigger Check] "${targetStatus}": All actions complete? ${allActionsComplete}`);
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
    
    console.log(`[Desktop Auto-trigger Check] "${targetStatus}": All assets ready? ${allAssetsReady}`);
    return allAssetsReady;
  };

  // Helper to add preset action to empty asset
  const addPresetAction = (assetId: string, actionName: string) => {
    const newAction: AssetAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: actionName,
      completed: false
    };
    
    const updatedItems = actionableItems.map(a => 
      a.id === assetId 
        ? { ...a, actions: [newAction] }
        : a
    );
    
    onUpdateProject({ actionable_items: updatedItems });
    setEmptyAssetPopover(null);
    setEmptyActionSearch('');
    setEmptyPopoverView('menu');
  };
  
  // Helper to add workflow actions to empty asset
  const addWorkflowActions = (assetId: string, workflowActions: string[]) => {
    const newActions: AssetAction[] = workflowActions.map((actionName, index) => ({
      id: `action_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name: actionName,
      completed: false
    }));
    
    const updatedItems = actionableItems.map(a => 
      a.id === assetId 
        ? { ...a, actions: newActions }
        : a
    );
    
    onUpdateProject({ actionable_items: updatedItems });
    setEmptyAssetPopover(null);
    setEmptyPopoverView('menu');
  };

  const handleAssetStatusChange = (assetId: string, newStatus: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedAssets = actionableItems?.map(asset => 
      asset.id === assetId 
        ? { ...asset, status: newStatus, is_completed: newStatus === 'Done' }
        : asset
    );
    
    // Auto-calculate project status based on assets, but preserve manual statuses
    const newProjectStatus = calculateProjectStatus(updatedAssets, projectStatus, sortedStatuses);
    
    onUpdateProject({ 
      actionable_items: updatedAssets,
      status: newProjectStatus 
    });
    onActiveAssetPopoverChange(null);
  };

  const isAssetCompleted = (asset: ActionableItem): boolean => {
    return asset.is_completed === true || asset.status === 'Done';
  };
  
  // Helper to get status badge color
  const getStatusBadgeColor = (status: string) => {
    if (status === 'Done') return 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700';
    if (status === 'In Progress') return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700';
    return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800/40 dark:text-gray-300 dark:border-gray-700';
  };
  
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

  // Single asset rendering
  if (actionableItems.length === 1) {
    const asset = actionableItems[0];
    
    // Collect all types (project + asset level)
    const typesSet = new Set<string>();
    if (Array.isArray(projectTypes) && projectTypes.length > 0) {
      projectTypes.forEach(type => typesSet.add(type));
    } else if (projectType) {
      typesSet.add(projectType);
    }
    if (asset.type) typesSet.add(asset.type);
    const uniqueTypes = Array.from(typesSet);
    const displayTypes = uniqueTypes.slice(0, 2);
    const remainingTypes = uniqueTypes.slice(2);
    const remainingCount = remainingTypes.length;
    
    return (
      <TooltipProvider delayDuration={200}>
      <div className="space-y-1.5">
        {/* Asset Label */}
        {isPublicView ? (
          // Public view: clickable only if asset has actions (for expansion), otherwise read-only
          asset.actions && asset.actions.length > 0 ? (
            <button
              onClick={onToggleExpansion}
              className="flex items-center gap-1.5 pl-1 hover:opacity-70 transition-opacity cursor-pointer group"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${getBulletColor(asset.status || 'Not Started')} flex-shrink-0`} />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                {asset.title}
              </span>
              {uniqueTypes.length > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {displayTypes.map((type) => (
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
                  {remainingCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Badge 
                            variant="secondary"
                            className="text-[10px] h-4 px-1.5 cursor-help"
                          >
                            +{remainingCount}
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <div className="flex flex-col gap-1">
                          {remainingTypes.map((type) => (
                            <div key={type} className="flex items-center gap-1.5">
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: typeColors[type] || '#6b7280' }}
                              />
                              <span className="text-xs">{type}</span>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </button>
          ) : (
            <div className="flex items-center gap-1.5 pl-1">
              <div className={`w-1.5 h-1.5 rounded-full ${getBulletColor(asset.status || 'Not Started')} flex-shrink-0`} />
              <span className="text-xs text-muted-foreground">
                {asset.title}
              </span>
              {uniqueTypes.length > 0 && (
                <div className="flex items-center gap-1 flex-shrink-0">
                  {displayTypes.map((type) => (
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
                  {remainingCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Badge 
                            variant="secondary"
                            className="text-[10px] h-4 px-1.5 cursor-help"
                          >
                            +{remainingCount}
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <div className="flex flex-col gap-1">
                          {remainingTypes.map((type) => (
                            <div key={type} className="flex items-center gap-1.5">
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: typeColors[type] || '#6b7280' }}
                              />
                              <span className="text-xs">{type}</span>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </div>
          )
        ) : (
          // Admin view: if no actions → popover to change status, if has actions → clickable to expand
          asset.actions && asset.actions.length > 0 ? (
            <button
              onClick={onToggleExpansion}
              className="flex items-center gap-1.5 pl-1 hover:opacity-70 transition-opacity cursor-pointer group"
            >
              <div className={`w-1.5 h-1.5 rounded-full ${getBulletColor(asset.status || 'Not Started')} flex-shrink-0`} />
              <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                {asset.title}
              </span>
              {uniqueTypes.length > 0 && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {displayTypes.map((type) => (
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
                  {remainingCount > 0 && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="inline-flex">
                          <Badge 
                            variant="secondary"
                            className="text-[10px] h-4 px-1.5 cursor-help"
                          >
                            +{remainingCount}
                          </Badge>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[200px]">
                        <div className="flex flex-col gap-1">
                          {remainingTypes.map((type) => (
                            <div key={type} className="flex items-center gap-1.5">
                              <div 
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: typeColors[type] || '#6b7280' }}
                              />
                              <span className="text-xs">{type}</span>
                            </div>
                          ))}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  )}
                </div>
              )}
            </button>
          ) : (
            <Popover 
              open={activeAssetPopover === `${projectId}-${asset.id}`}
              onOpenChange={(open) => onActiveAssetPopoverChange(open ? `${projectId}-${asset.id}` : null)}
            >
              <PopoverTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 pl-1 hover:opacity-70 transition-opacity cursor-pointer group"
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${getBulletColor(asset.status || 'Not Started')} flex-shrink-0`} />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                    {asset.title}
                  </span>
                  {uniqueTypes.length > 0 && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {displayTypes.map((type) => (
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
                      {remainingCount > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Badge 
                                variant="secondary"
                                className="text-[10px] h-4 px-1.5 cursor-help"
                              >
                                +{remainingCount}
                              </Badge>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px]">
                            <div className="flex flex-col gap-1">
                              {remainingTypes.map((type) => (
                                <div key={type} className="flex items-center gap-1.5">
                                  <div 
                                    className="w-2 h-2 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: typeColors[type] || '#6b7280' }}
                                  />
                                  <span className="text-xs">{type}</span>
                                </div>
                              ))}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start">
                <div className="space-y-0.5">
                  {statusOptions.map((status) => (
                    <button
                      key={status}
                      onClick={(e) => handleAssetStatusChange(asset.id, status, e)}
                      className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors ${
                        asset.status === status ? 'bg-accent' : ''
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )
        )}

        {/* Progress Bar + Badge Row */}
        <div className="flex items-center gap-2 pl-1">
          {/* Progress Container (80-85% width) */}
          <div 
            onClick={(e) => {
              if (asset.actions && asset.actions.length > 0) {
                onToggleExpansion(e);
              }
            }}
            className={`flex items-center gap-1.5 flex-1 min-w-0 ${
              asset.actions && asset.actions.length > 0
                ? 'cursor-pointer hover:opacity-80 transition-opacity'
                : ''
            }`}
          >
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div 
                className="h-1.5 rounded-full transition-all duration-300"
                style={{ 
                  width: `${assetProgress}%`,
                  backgroundColor: getProgressColorValue(assetProgress)
                }}
              />
            </div>
            <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0 tabular-nums">
              {assetProgress}%
            </span>
          </div>

          {/* Days Left Badge - Secondary Style */}
          {(() => {
            const urgency = getDeadlineUrgency(projectDueDate, projectStatus);
            if (!urgency.showBadge) return null;
            
            const daysLeft = getDaysUntilDeadline(projectDueDate);
            const { color, bgColor } = getUrgencyColor(daysLeft, projectStatus);
            
            return (
              <div 
                onClick={(e) => {
                  if (asset.actions && asset.actions.length > 0) {
                    onToggleExpansion(e);
                  }
                }}
                className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 tabular-nums font-medium cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                  backgroundColor: bgColor,
                  color: color,
                }}
              >
                {urgency.label}
              </div>
            );
          })()}

          {/* Chevron for single task with actions */}
          {asset.actions && asset.actions.length > 0 && (
            <button
              onClick={onToggleExpansion}
              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
            >
              <ChevronDown 
                className={`w-4 h-4 transition-transform duration-200 ${
                  isExpanded ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}
        </div>
        
        {/* Expanded Action Items for Single Asset - 2 Column Grid */}
        {isExpanded && asset.actions && asset.actions.length > 0 && (
          <div className="pl-1 mt-2" onClick={(e) => e.stopPropagation()}>
            <AssetActionManager
              actions={asset.actions}
              hideProgress={true}
              gridLayout={true}
              status={asset.status}
              readOnly={isPublicView}
              onAllActionsCompleted={() => {
                // Single asset - no auto-collapse/expand behavior needed
                console.log('[AssetProgressBar Single] ✅ All actions completed in single asset');
              }}
              onChange={(updatedActions) => {
                // 🎯 Check if any newly MANUALLY checked action should trigger project status change
                // IMPORTANT: Only manually checked actions trigger status (not auto-checked ones)
                const previousActions = asset.actions || [];
                const newlyCheckedAction = updatedActions.find((newAction, idx) => {
                  const oldAction = previousActions[idx];
                  // Must be: newly completed AND NOT auto-checked
                  return newAction.completed && 
                         (!oldAction || !oldAction.completed) && 
                         !newAction.wasAutoChecked;
                });
                
                let projectStatusOverride: ProjectStatus | undefined = undefined;
                if (newlyCheckedAction) {
                  const triggerResult = shouldAutoTriggerStatus(newlyCheckedAction.name);
                  if (triggerResult.shouldTrigger && triggerResult.statusName) {
                    // ✅ NEW: Check if ALL assets are ready before auto-triggering
                    const updatedItems = [{ 
                      ...asset, 
                      actions: updatedActions
                    }];
                    
                    const shouldAutoTriggerNow = checkIfShouldAutoTrigger(updatedItems, triggerResult.statusName);
                    
                    if (shouldAutoTriggerNow) {
                      console.log(`[AssetProgressBar Single] 🎯 Auto-trigger: "${newlyCheckedAction.name}" → "${triggerResult.statusName}" (all assets ready)`);
                      projectStatusOverride = triggerResult.statusName as ProjectStatus;
                    } else {
                      console.log(`[AssetProgressBar Single] ⏸️ Auto-trigger blocked: Other assets not ready for "${triggerResult.statusName}"`);
                    }
                  }
                }
                
                // Calculate completion status
                const completedCount = updatedActions.filter(a => a.completed).length;
                const totalCount = updatedActions.length;
                const allCompleted = totalCount > 0 && completedCount === totalCount;
                const someCompleted = completedCount > 0 && completedCount < totalCount;
                const noneCompleted = completedCount === 0;
                
                // Determine new status based on completion
                let newStatus = asset.status;
                if (allCompleted) {
                  newStatus = 'Done';
                } else if (someCompleted) {
                  newStatus = 'In Progress';
                } else if (noneCompleted) {
                  const notStartedStatus = sortedStatuses.find(s => 
                    s.name.toLowerCase() === 'not started' || 
                    s.name.toLowerCase() === 'notstarted' ||
                    s.name.toLowerCase() === 'todo' ||
                    s.name.toLowerCase() === 'to do'
                  );
                  newStatus = notStartedStatus?.name || (sortedStatuses.length > 0 ? sortedStatuses[0].name : 'Not Started');
                }
                
                const updatedItems = [{ 
                  ...asset, 
                  actions: updatedActions,
                  status: newStatus,
                  is_completed: allCompleted
                }];
                
                // Use project status override if provided, otherwise calculate
                const finalProjectStatus = projectStatusOverride || calculateProjectStatus(updatedItems, projectStatus, sortedStatuses);
                
                onUpdateProject({ 
                  actionable_items: updatedItems,
                  status: finalProjectStatus
                });
              }}
              compact={true}
            />
          </div>
        )}
      </div>
      </TooltipProvider>
    );
  }

  // Multiple assets rendering
  return (
    <TooltipProvider delayDuration={200}>
    <div className="space-y-1.5">
      {/* Asset Count Label */}
      {!isExpanded && (
        <div 
          onClick={onToggleExpansion}
          className="flex items-center gap-1.5 pl-1 cursor-pointer hover:opacity-70 transition-opacity"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-gray-400 flex-shrink-0" />
          <span className="text-xs text-muted-foreground">
            {actionableItems?.length} assets
          </span>
          
          {/* Type Badges - Show max 2 */}
          {(() => {
            // Collect all types from:
            // 1. Project-level types (project.types array or project.type single)
            // 2. Asset-level types (actionableItems[].type)
            const typesSet = new Set<string>();
            
            // Add project-level types
            if (Array.isArray(projectTypes) && projectTypes.length > 0) {
              projectTypes.forEach(type => typesSet.add(type));
            } else if (projectType) {
              typesSet.add(projectType);
            }
            
            // Add asset-level types
            actionableItems.forEach(item => {
              if (item.type) typesSet.add(item.type);
            });
            
            const uniqueTypes = Array.from(typesSet);
            
            if (uniqueTypes.length === 0) return null;
            
            const displayTypes = uniqueTypes.slice(0, 2);
            const remainingTypes = uniqueTypes.slice(2);
            const remainingCount = remainingTypes.length;
            
            return (
              <div className="flex items-center gap-1 flex-shrink-0">
                {displayTypes.map((type) => (
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
                {remainingCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex">
                        <Badge 
                          variant="secondary"
                          className="text-[10px] h-4 px-1.5 cursor-help"
                        >
                          +{remainingCount}
                        </Badge>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[200px]">
                      <div className="flex flex-col gap-1">
                        {remainingTypes.map((type) => (
                          <div key={type} className="flex items-center gap-1.5">
                            <div 
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: typeColors[type] || '#6b7280' }}
                            />
                            <span className="text-xs">{type}</span>
                          </div>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            );
          })()}
        </div>
      )}

      {/* Progress Bar + Badge Row */}
      <div className="flex items-center gap-2 pl-1">
        {/* Progress Container (80-85% width) */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <button
            onClick={onToggleExpansion}
            className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 hover:opacity-80 transition-opacity cursor-pointer"
          >
            <div 
              className="h-1.5 rounded-full transition-all duration-300 pointer-events-none"
              style={{ 
                width: `${assetProgress}%`,
                backgroundColor: getProgressColorValue(assetProgress)
              }}
            />
          </button>
          <span className="text-[10px] text-muted-foreground font-medium flex-shrink-0 tabular-nums">
            {assetProgress}%
          </span>
        </div>

        {/* Days Left Badge - Secondary Style */}
        {(() => {
          const urgency = getDeadlineUrgency(projectDueDate, projectStatus);
          if (!urgency.showBadge) return null;
          
          const daysLeft = getDaysUntilDeadline(projectDueDate);
          const { color, bgColor } = getUrgencyColor(daysLeft, projectStatus);
          
          return (
            <button 
              onClick={onToggleExpansion}
              className="text-[10px] px-1.5 py-0.5 rounded flex-shrink-0 tabular-nums font-medium cursor-pointer hover:opacity-80 transition-opacity"
              style={{
                backgroundColor: bgColor,
                color: color,
              }}
            >
              {urgency.label}
            </button>
          );
        })()}

        {/* Chevron */}
        <button
          onClick={onToggleExpansion}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          <ChevronDown 
            className={`w-4 h-4 transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>
      
      {/* Expanded Asset List - Collapsible Accordion */}
      {isExpanded && (
        <div className="space-y-1 pl-1 mt-2">
          {actionableItems.map((asset, index) => {
            const completed = isAssetCompleted(asset);
            const hasActions = asset.actions && asset.actions.length > 0;
            const completedActions = asset.actions?.filter(a => a.completed).length || 0;
            const totalActions = asset.actions?.length || 0;
            const isAssetExpanded = expandedAssetIds.has(asset.id);
            
            return (
              <Collapsible 
                key={asset.id}
                open={isAssetExpanded}
                onOpenChange={() => toggleAssetExpansion(asset.id)}
              >
                <div className="rounded border border-border/30 overflow-hidden bg-card/30 hover:bg-card/50 transition-colors">
                  {/* Collapsible Header - NOT as CollapsibleTrigger */}
                  <div className="flex items-center justify-between gap-2 p-2 hover:bg-muted/20 transition-colors">
                    {/* Left: Chevron + Bullet + Title + Plus Icon (if no actions) - CLICKABLE TO EXPAND */}
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                      <CollapsibleTrigger asChild>
                        <button 
                          className="flex items-center gap-1.5 flex-1 min-w-0 text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                        >
                          <div className="flex-shrink-0">
                            {isAssetExpanded ? (
                              <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform" />
                            ) : (
                              <ChevronRight className="h-3 w-3 text-muted-foreground transition-transform" />
                            )}
                          </div>
                          <div 
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: getStatusColor(asset.status || 'Not Started') }}
                          />
                          <span className={`text-xs truncate ${completed ? 'line-through opacity-60' : 'text-foreground'}`}>
                            {asset.title}
                          </span>
                          {asset.type && (
                            <Badge 
                              className="text-[10px] h-4 px-1.5 border-0 flex-shrink-0" 
                              style={{ 
                                backgroundColor: `${typeColors[asset.type] || '#6b7280'}20`,
                                color: typeColors[asset.type] || '#6b7280'
                              }}
                            >
                              {asset.type}
                            </Badge>
                          )}
                        </button>
                      </CollapsibleTrigger>
                      
                      {/* Plus Icon Button for Empty Assets */}
                      {!hasActions && !isPublicView && (
                        <Popover 
                          open={emptyAssetPopover === asset.id}
                          onOpenChange={(open) => {
                            setEmptyAssetPopover(open ? asset.id : null);
                            if (!open) {
                              setEmptyActionSearch('');
                              setEmptyPopoverView('menu');
                            } else {
                              setEmptyPopoverView('menu');
                            }
                          }}
                        >
                          <PopoverTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="h-4 w-4 rounded hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent 
                            className={emptyPopoverView === 'menu' ? 'w-48 p-2' : 'w-64 p-0'}
                            align="start"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Menu View */}
                            {emptyPopoverView === 'menu' && (
                              <div className="space-y-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEmptyPopoverView('actions');
                                  }}
                                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors flex items-center gap-2"
                                >
                                  <Plus className="h-3 w-3" />
                                  Add Actions
                                </button>
                                {workflows.length > 0 && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEmptyPopoverView('workflow');
                                    }}
                                    className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors flex items-center gap-2"
                                  >
                                    <WorkflowIcon className="h-3 w-3" />
                                    Add Workflow
                                  </button>
                                )}
                              </div>
                            )}
                            
                            {/* Action Selector View */}
                            {emptyPopoverView === 'actions' && (
                              <Command>
                                <CommandInput 
                                  placeholder="Search or type new action..." 
                                  value={emptyActionSearch}
                                  onValueChange={setEmptyActionSearch}
                                />
                                <CommandList>
                                  <CommandEmpty>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="w-full justify-start text-xs"
                                      onClick={() => {
                                        if (emptyActionSearch.trim()) {
                                          addPresetAction(asset.id, emptyActionSearch);
                                        }
                                      }}
                                    >
                                      <Plus className="h-3 w-3 mr-2" />
                                      Create "{emptyActionSearch}"
                                    </Button>
                                  </CommandEmpty>
                                  <CommandGroup heading="Presets">
                                    {presets.map((preset) => (
                                      <CommandItem
                                        key={preset}
                                        onSelect={() => addPresetAction(asset.id, preset)}
                                        className="text-xs"
                                      >
                                        {preset}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            )}
                            
                            {/* Workflow Selector View */}
                            {emptyPopoverView === 'workflow' && (
                              <Command>
                                <CommandInput placeholder="Search workflows..." />
                                <CommandList>
                                  <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
                                    No workflows found
                                  </CommandEmpty>
                                  <CommandGroup heading="Available Workflows">
                                    {workflows.map((workflow) => (
                                      <CommandItem
                                        key={workflow.id}
                                        onSelect={() => addWorkflowActions(asset.id, workflow.actions)}
                                        className="text-xs flex-col items-start gap-1 py-2"
                                      >
                                        <span className="font-medium">{workflow.name}</span>
                                        <span className="text-muted-foreground">
                                          {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
                                          {workflow.assignedTypes && workflow.assignedTypes.length > 0 && (
                                            <> • {workflow.assignedTypes.join(', ')}</>
                                          )}
                                        </span>
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            )}
                          </PopoverContent>
                        </Popover>
                      )}
                    </div>
                    
                    {/* Right: Progress Badge + Status */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {/* Progress Badge */}
                      {hasActions && (
                        <Badge 
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 h-4 bg-primary/5 text-primary border-primary/20"
                        >
                          {Math.round((completedActions / totalActions) * 100)}%
                        </Badge>
                      )}
                      
                      {/* Status Badge with Popover */}
                      {!isPublicView ? (
                        <Popover 
                          open={activeAssetPopover === `${projectId}-${asset.id}`}
                          onOpenChange={(open) => onActiveAssetPopoverChange(open ? `${projectId}-${asset.id}` : null)}
                        >
                          <PopoverTrigger asChild>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              className="hover:opacity-80 transition-opacity"
                            >
                              <Badge 
                                variant="outline"
                                className="text-[10px] px-1.5 py-0 h-4 cursor-pointer border"
                                style={{
                                  backgroundColor: `${getStatusColor(asset.status || 'Not Started')}15`,
                                  color: getStatusColor(asset.status || 'Not Started'),
                                  borderColor: `${getStatusColor(asset.status || 'Not Started')}40`
                                }}
                              >
                                {asset.status || 'Not Started'}
                              </Badge>
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-1" align="end">
                            <div className="space-y-0.5">
                              {statusOptions.map((status) => (
                                <button
                                  key={status}
                                  onClick={(e) => handleAssetStatusChange(asset.id, status, e)}
                                  className={`w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors ${
                                    asset.status === status ? 'bg-accent' : ''
                                  }`}
                                >
                                  {status}
                                </button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      ) : (
                        <Badge 
                          variant="outline"
                          className="text-[10px] px-1.5 py-0 h-4 border"
                          style={{
                            backgroundColor: `${getStatusColor(asset.status || 'Not Started')}15`,
                            color: getStatusColor(asset.status || 'Not Started'),
                            borderColor: `${getStatusColor(asset.status || 'Not Started')}40`
                          }}
                        >
                          {asset.status || 'Not Started'}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Collapsible Content */}
                  <CollapsibleContent>
                    <div className="px-2 pb-2 space-y-2 border-t border-border/20">
                      {/* Render action items with 2-COLUMN GRID LAYOUT */}
                      {hasActions && (
                        <div onClick={(e) => e.stopPropagation()}>
                          <AssetActionManager
                            actions={asset.actions}
                            hideProgress={true}
                            gridLayout={true}
                            status={asset.status}
                            readOnly={isPublicView}
                            onAllActionsCompleted={() => {
                              // Only trigger auto-collapse/expand if there are multiple assets
                              if (actionableItems && actionableItems.length > 1) {
                                console.log(`[AssetProgressBar Multi] 🎯 Asset "${asset.title}" completed! Auto-collapsing and expanding next incomplete asset...`);
                                
                                // Close current asset
                                setExpandedAssetIds(prev => {
                                  const newSet = new Set(prev);
                                  newSet.delete(asset.id);
                                  return newSet;
                                });
                                
                                // Find next INCOMPLETE asset (skip already completed ones)
                                const currentIndex = actionableItems.findIndex(a => a.id === asset.id);
                                const nextIncompleteAsset = actionableItems.slice(currentIndex + 1).find(a => {
                                  // Asset is incomplete if:
                                  // 1. Has no actions, OR
                                  // 2. Has actions but not all completed
                                  if (!a.actions || a.actions.length === 0) {
                                    return true; // Empty asset = not complete
                                  }
                                  return a.actions.some(action => !action.completed);
                                });
                                
                                if (nextIncompleteAsset) {
                                  console.log(`[AssetProgressBar Multi] ➡️ Opening next incomplete asset: "${nextIncompleteAsset.title}"`);
                                  setTimeout(() => {
                                    setExpandedAssetIds(prev => {
                                      const newSet = new Set(prev);
                                      newSet.add(nextIncompleteAsset.id);
                                      return newSet;
                                    });
                                  }, 300); // Delay to allow collapse animation to finish
                                } else {
                                  console.log(`[AssetProgressBar Multi] 🎉 All assets completed! No more incomplete assets.`);
                                }
                              }
                            }}
                            onChange={(updatedActions) => {
                        // 🎯 Check if any newly MANUALLY checked action should trigger project status change
                        // IMPORTANT: Only manually checked actions trigger status (not auto-checked ones)
                        const previousActions = asset.actions || [];
                        const newlyCheckedAction = updatedActions.find((newAction, idx) => {
                          const oldAction = previousActions[idx];
                          // Must be: newly completed AND NOT auto-checked
                          return newAction.completed && 
                                 (!oldAction || !oldAction.completed) && 
                                 !newAction.wasAutoChecked;
                        });
                        
                        let projectStatusOverride: ProjectStatus | undefined = undefined;
                        if (newlyCheckedAction) {
                          const triggerResult = shouldAutoTriggerStatus(newlyCheckedAction.name);
                          if (triggerResult.shouldTrigger && triggerResult.statusName) {
                            // ✅ NEW: Check if ALL assets are ready before auto-triggering
                            const updatedItems = actionableItems.map(a => 
                              a.id === asset.id 
                                ? { ...a, actions: updatedActions }
                                : a
                            );
                            
                            const shouldAutoTriggerNow = checkIfShouldAutoTrigger(updatedItems, triggerResult.statusName);
                            
                            if (shouldAutoTriggerNow) {
                              console.log(`[AssetProgressBar Multi] 🎯 Auto-trigger: "${newlyCheckedAction.name}" → "${triggerResult.statusName}" (all assets ready)`);
                              projectStatusOverride = triggerResult.statusName as ProjectStatus;
                            } else {
                              console.log(`[AssetProgressBar Multi] ⏸️ Auto-trigger blocked: Other assets not ready for "${triggerResult.statusName}"`);
                            }
                          }
                        }
                        
                        const completedCount = updatedActions.filter(a => a.completed).length;
                        const totalCount = updatedActions.length;
                        const allCompleted = totalCount > 0 && completedCount === totalCount;
                        const someCompleted = completedCount > 0 && completedCount < totalCount;
                        const noneCompleted = completedCount === 0;
                        
                        let newStatus = asset.status;
                        if (allCompleted) {
                          newStatus = 'Done';
                        } else if (someCompleted) {
                          newStatus = 'In Progress';
                        } else if (noneCompleted) {
                          const notStartedStatus = sortedStatuses.find(s => 
                            s.name.toLowerCase() === 'not started' || 
                            s.name.toLowerCase() === 'notstarted' ||
                            s.name.toLowerCase() === 'todo' ||
                            s.name.toLowerCase() === 'to do'
                          );
                          newStatus = notStartedStatus?.name || (sortedStatuses.length > 0 ? sortedStatuses[0].name : 'Not Started');
                        }
                        
                        const updatedItems = actionableItems.map(a => 
                          a.id === asset.id 
                            ? { ...a, actions: updatedActions, status: newStatus, is_completed: allCompleted }
                            : a
                        );
                        
                        // Use project status override if provided, otherwise calculate
                        const finalProjectStatus = projectStatusOverride || calculateProjectStatus(updatedItems, projectStatus, sortedStatuses);
                        
                        onUpdateProject({ 
                          actionable_items: updatedItems,
                          status: finalProjectStatus
                        });
                      }}
                            compact={true}
                          />
                        </div>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
    </TooltipProvider>
  );
}
