import { useState } from 'react';
import { TableRow, TableCell } from '../ui/table';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { MoreHorizontal, Edit, Trash2, Info } from 'lucide-react';
import { ProjectTableRowProps } from './types';
import { DEFAULT_TABLE_COLUMNS, TableColumnId } from '../../types/project';
import { DateCell } from './DateCell';
import { LinksCell } from './LinksCell';
import { DeliverablesCell } from './DeliverablesCell';
import { CollaboratorAvatars } from './CollaboratorAvatars';
import { AssetProgressBar } from './AssetProgressBar';
import { getRowBackgroundColor } from './helpers';
import { getContrastColor } from '../../utils/colorUtils';
import { useColors } from '../ColorContext';
import { useStatusContext } from '../StatusContext';
import { useLinkLabels } from '../../hooks/useLinkLabels';

/**
 * Shared ProjectTableRow component
 * Used in both "Group by Status" and "Group by Vertical" modes
 * Handles all row rendering, interactions, and state management
 */
export function ProjectTableRow({
  project,
  collaborators,
  verticalColors,
  config,
  handlers,
  state,
  onStateChange,
  isPublicView,
  columns
}: ProjectTableRowProps) {
  const { typeColors } = useColors();
  const { linkLabels } = useLinkLabels();
  const { getStatusColor: getStatusColorFromContext, getStatusTextColor, statuses } = useStatusContext();
  const [hoveredCollaboratorCell, setHoveredCollaboratorCell] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  // Get status options from context
  const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);
  const statusOptions = sortedStatuses.map(s => s.name);

  // Determine row background based on deadline urgency
  const rowBgColor = getRowBackgroundColor(project.due_date, project.status);

  // Handle date updates
  const handleDateUpdate = (projectId: string, field: string, date: Date | undefined) => {
    if (!date) return;
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    handlers.onUpdate(projectId, { [field]: dateString });
    onStateChange({ activeDatePopover: null });
  };

  const handleSetToday = (projectId: string, field: string) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const dateString = `${year}-${month}-${day}`;
    
    handlers.onUpdate(projectId, { [field]: dateString });
    onStateChange({ activeDatePopover: null });
  };

  // Handle asset expansion toggle
  const handleToggleAssetExpansion = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newExpandedAssets = new Set(state.expandedAssets);
    if (newExpandedAssets.has(project.id)) {
      newExpandedAssets.delete(project.id);
    } else {
      newExpandedAssets.add(project.id);
    }
    onStateChange({ expandedAssets: newExpandedAssets });
  };

  // 🆕 Helper function to render cell by column ID (v2.4.0)
  const renderCellByColumnId = (columnId: TableColumnId) => {
    switch (columnId) {
      case 'projectName':
        return (
          <TableCell key="projectName" className={`${config.rowPadding} w-[420px] min-w-[420px] max-w-[420px]`}>
            <div className="space-y-2 mx-[2px] my-[0px] p-[0px]">
              <div className="flex items-center gap-2">
                {project.is_draft && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700">
                    Draft
                  </Badge>
                )}
                {project.notes && project.notes.trim() && (
                  <TooltipProvider delayDuration={200}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div 
                          className="flex-shrink-0 cursor-help"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground transition-colors" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent 
                        side="right" 
                        className="max-w-xs break-words"
                        sideOffset={5}
                      >
                        <p className="text-xs">
                          {project.notes.length > 150 
                            ? `${project.notes.substring(0, 150)}...` 
                            : project.notes}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <span className="font-medium truncate">{project.project_name}</span>
              </div>
              {project.description && (
                <div className="text-sm text-muted-foreground truncate">
                  {project.description}
                </div>
              )}
              <AssetProgressBar
                projectId={project.id}
                projectStatus={project.status}
                projectDueDate={project.due_date}
                projectType={project.type}
                projectTypes={project.types}
                actionableItems={project.actionable_items}
                isPublicView={isPublicView}
                isExpanded={state.expandedAssets.has(project.id)}
                onToggleExpansion={handleToggleAssetExpansion}
                onUpdateProject={(data) => handlers.onUpdate(project.id, data)}
                activeAssetPopover={state.activeAssetPopover}
                onActiveAssetPopoverChange={(value) => onStateChange({ activeAssetPopover: value })}
                statusOptions={statusOptions}
                sortedStatuses={sortedStatuses}
              />
            </div>
          </TableCell>
        );

      case 'status':
        return (
          <TableCell key="status" className="w-[140px] min-w-[140px] max-w-[140px] text-center" onClick={(e) => e.stopPropagation()}>
            {isPublicView ? (
              <Badge 
                variant="outline" 
                className="text-xs"
                style={{
                  backgroundColor: getStatusColorFromContext(project.status),
                  color: getStatusTextColor(project.status),
                  borderColor: getStatusColorFromContext(project.status)
                }}
              >
                {project.status}
              </Badge>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <button className="focus:outline-none">
                    <div className="flex items-center gap-1.5">
                      <Badge 
                        variant="outline" 
                        className="text-xs cursor-pointer hover:opacity-80 transition-opacity"
                        style={{
                          backgroundColor: getStatusColorFromContext(project.status),
                          color: getStatusTextColor(project.status),
                          borderColor: getStatusColorFromContext(project.status)
                        }}
                      >
                        {project.status}
                      </Badge>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {statusOptions.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (status === 'Done' && project.actionable_items && project.actionable_items.length > 0) {
                          const updatedAssets = project.actionable_items.map(asset => ({
                            ...asset,
                            status: 'Done',
                            is_completed: true,
                            actions: asset.actions?.map(action => ({
                              ...action,
                              completed: true
                            })) || []
                          }));
                          handlers.onUpdate(project.id, { 
                            status,
                            actionable_items: updatedAssets,
                            completed_at: new Date().toISOString()
                          });
                        } else if (status === 'Done') {
                          handlers.onUpdate(project.id, { 
                            status,
                            completed_at: new Date().toISOString()
                          });
                        } else {
                          handlers.onUpdate(project.id, { 
                            status,
                            completed_at: null
                          });
                        }
                      }}
                      className="cursor-pointer"
                    >
                      <Badge 
                        className="text-xs font-medium w-full justify-center"
                        variant="outline"
                        style={{
                          backgroundColor: getStatusColorFromContext(status),
                          color: getStatusTextColor(status),
                          borderColor: getStatusColorFromContext(status)
                        }}
                      >
                        {status}
                      </Badge>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </TableCell>
        );

      case 'deliverables':
        return (
          <TableCell key="deliverables" className="w-[140px] min-w-[140px] max-w-[140px]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-center">
              <DeliverablesCell
                lightroomAssets={project.lightroom_assets}
                gdriveAssets={project.gdrive_assets}
                onNavigateToLightroom={() => handlers.onNavigateToLightroom(project.id)}
                onNavigateToGDrive={() => handlers.onNavigateToGDrive(project.id)}
                onAddLightroom={handlers.onAddLightroom ? () => handlers.onAddLightroom!(project.id) : undefined}
                onAddGDrive={handlers.onAddGDrive ? () => handlers.onAddGDrive!(project.id) : undefined}
                isHovered={isHovered}
              />
            </div>
          </TableCell>
        );

      case 'startDate':
        return (
          <TableCell key="startDate" className="w-[120px] min-w-[120px] max-w-[120px] text-center" onClick={(e) => e.stopPropagation()}>
            <DateCell
              dateString={project.start_date}
              projectId={project.id}
              field="start_date"
              isPublicView={isPublicView}
              activeDatePopover={state.activeDatePopover}
              onPopoverChange={(value) => onStateChange({ activeDatePopover: value })}
              onDateUpdate={handleDateUpdate}
              onSetToday={handleSetToday}
            />
          </TableCell>
        );

      case 'endDate':
        return (
          <TableCell key="endDate" className="w-[140px] min-w-[140px] max-w-[140px] text-center" onClick={(e) => e.stopPropagation()}>
            <DateCell
              dateString={project.due_date}
              projectId={project.id}
              field="due_date"
              isPublicView={isPublicView}
              activeDatePopover={state.activeDatePopover}
              onPopoverChange={(value) => onStateChange({ activeDatePopover: value })}
              onDateUpdate={handleDateUpdate}
              onSetToday={handleSetToday}
            />
          </TableCell>
        );

      case 'collaborators':
        return (
          <TableCell
            key="collaborators"
            className="w-[160px] min-w-[160px] max-w-[160px] text-center"
            onClick={(e) => e.stopPropagation()}
            onMouseEnter={() => setHoveredCollaboratorCell(true)}
            onMouseLeave={() => setHoveredCollaboratorCell(false)}
          >
            <CollaboratorAvatars
              projectId={project.id}
              projectCollaborators={project.collaborators || []}
              allCollaborators={collaborators}
              isPublicView={isPublicView}
              isHovered={hoveredCollaboratorCell}
              onUpdate={(updatedCollaborators) => {
                handlers.onUpdate(project.id, { collaborators: updatedCollaborators });
              }}
            />
          </TableCell>
        );

      case 'links':
        return (
          <TableCell key="links" className="w-[100px] min-w-[100px] max-w-[100px]">
            <div className="flex items-center justify-center">
              <LinksCell
                links={project.links}
                linkLabels={linkLabels}
                onAddLink={handlers.onAddLink ? () => handlers.onAddLink!(project.id) : undefined}
                isHovered={isHovered}
              />
            </div>
          </TableCell>
        );

      default:
        return null;
    }
  };

  // Use columns prop if provided, otherwise use default order
  const columnsToRender = columns || DEFAULT_TABLE_COLUMNS;

  return (
    <TableRow 
      key={project.id}
      className={`cursor-pointer ${rowBgColor}`}
      onClick={() => handlers.onClick(project)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 🆕 Render cells dynamically based on column order (v2.4.0) */}
      {columnsToRender.map((column) => renderCellByColumnId(column.id))}

      {/* Actions Cell - Always last, only show if not public view */}
      {!isPublicView && (
        <TableCell className="w-[50px] min-w-[50px] max-w-[50px] text-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                handlers.onEdit(project);
              }}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={(e) => {
                  e.stopPropagation();
                  handlers.onDelete(project);
                }}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    </TableRow>
  );
}