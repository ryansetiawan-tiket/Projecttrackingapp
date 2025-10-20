import { useState, useEffect } from 'react';
import { Project, Collaborator } from '../../types/project';
import { ProjectCard } from '../ProjectCard';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '../ui/collapsible';
import { Badge } from '../ui/badge';
import { ChevronDown, Filter, Plus } from 'lucide-react';
import { cn } from '../ui/utils';
import { useColors } from '../ColorContext';
import { useStatusContext } from '../StatusContext';
import { useStatusGroupOrder } from '../../hooks/useStatusGroupOrder';
import { useVerticalGroupOrder } from '../../hooks/useVerticalGroupOrder';
import { sortProjectsByUrgency, getMostUrgentPriority } from '../../utils/sortingUtils';

interface MobileProjectListProps {
  projects: Project[];
  collaborators: Collaborator[];
  groupByMode: 'status' | 'vertical';
  onProjectClick: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onProjectUpdate?: (id: string, data: Partial<Project>) => void;
  onNavigateToLightroom?: (projectId: string) => void;
  onNavigateToGDrive?: (projectId: string) => void;
  onCreateProject?: (vertical?: string, status?: string) => void;
  isPublicView?: boolean;
  isArchive?: boolean;
}

export function MobileProjectList({
  projects,
  collaborators,
  groupByMode,
  onProjectClick,
  onEditProject,
  onDeleteProject,
  onProjectUpdate,
  onNavigateToLightroom,
  onNavigateToGDrive,
  onCreateProject,
  isPublicView = false,
  isArchive = false
}: MobileProjectListProps) {
  const { verticalColors } = useColors();
  const { statuses } = useStatusContext();
  const { activeOrder, archiveOrder } = useStatusGroupOrder();
  const { verticalOrder } = useVerticalGroupOrder();
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set());

  // Group projects and sort each group by urgency
  const groupedProjects = projects.reduce((groups, project) => {
    const key = groupByMode === 'status' 
      ? project.status || 'No Status' 
      : project.vertical || 'No Vertical';
    
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(project);
    return groups;
  }, {} as Record<string, Project[]>);

  // Sort projects within each group by urgency
  Object.keys(groupedProjects).forEach(key => {
    groupedProjects[key] = sortProjectsByUrgency(groupedProjects[key]);
  });

  // Sort groups based on mode using custom order from settings
  let sortedGroupKeys: string[];
  if (groupByMode === 'status') {
    // Use custom status order from settings (active or archive)
    const statusOrder = isArchive ? archiveOrder : activeOrder;
    
    sortedGroupKeys = Object.keys(groupedProjects).sort((a, b) => {
      // Put "No Status" at the end
      if (a === 'No Status') return 1;
      if (b === 'No Status') return -1;
      
      const indexA = statusOrder.indexOf(a);
      const indexB = statusOrder.indexOf(b);
      
      // If status not found in order, put at end
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  } else {
    // Use custom vertical order from settings
    sortedGroupKeys = Object.keys(groupedProjects).sort((a, b) => {
      // Put "No Vertical" at the end
      if (a === 'No Vertical') return 1;
      if (b === 'No Vertical') return -1;
      
      const indexA = verticalOrder.indexOf(a);
      const indexB = verticalOrder.indexOf(b);
      
      // If vertical not found in order, put at end
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      
      return indexA - indexB;
    });
  }

  // Auto-expand first group on mount or when grouping changes
  useEffect(() => {
    const firstGroupKey = sortedGroupKeys[0];
    if (firstGroupKey) {
      setOpenGroups(new Set([firstGroupKey]));
    }
  }, [groupByMode]);

  const toggleGroup = (key: string) => {
    setOpenGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const getStatusColor = (status: string) => {
    const statusConfig = statuses.find(s => s.name === status);
    return statusConfig?.color || '#6b7280';
  };

  return (
    <div className="space-y-4 pb-6">
      {sortedGroupKeys.map((groupKey) => {
        const groupProjects = groupedProjects[groupKey];
        const isOpen = openGroups.has(groupKey);
        
        // Get group color
        const groupColor = groupByMode === 'status' 
          ? getStatusColor(groupKey)
          : verticalColors[groupKey] || '#6b7280';

        return (
          <Collapsible
            key={groupKey}
            open={isOpen}
            onOpenChange={() => toggleGroup(groupKey)}
            className="border-2 rounded-xl bg-card overflow-hidden shadow-md hover:shadow-lg transition-shadow"
          >
            <div 
              className="flex items-center justify-between hover:bg-accent/50 active:bg-accent transition-colors"
              style={{
                borderLeft: `5px solid ${groupColor}`
              }}
            >
              <CollapsibleTrigger className="flex-1 px-5 py-4 touch-manipulation">
                <div className="flex items-center gap-4">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                    style={{
                      backgroundColor: `${groupColor}20`,
                      border: `2px solid ${groupColor}`
                    }}
                  >
                    <ChevronDown 
                      className={cn(
                        "h-5 w-5 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                      style={{ color: groupColor }}
                    />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate">{groupKey}</h3>
                    <p className="text-sm text-muted-foreground">
                      {groupProjects.length} project{groupProjects.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* Add Project Button - Show for both status and vertical grouping */}
              {!isPublicView && onCreateProject && (
                <>
                  {/* For vertical grouping - pass vertical as parameter */}
                  {groupByMode === 'vertical' && groupKey !== 'No Vertical' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateProject(groupKey);
                      }}
                      className="mr-4 p-2.5 rounded-lg hover:bg-background/80 active:bg-background transition-colors touch-manipulation flex-shrink-0"
                      style={{
                        backgroundColor: `${groupColor}15`,
                      }}
                      aria-label={`Add project to ${groupKey}`}
                    >
                      <Plus 
                        className="h-5 w-5" 
                        style={{ color: groupColor }}
                      />
                    </button>
                  )}

                  {/* For status grouping - pass status as second parameter */}
                  {groupByMode === 'status' && groupKey !== 'No Status' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateProject(undefined, groupKey);
                      }}
                      className="mr-4 p-2.5 rounded-lg hover:bg-background/80 active:bg-background transition-colors touch-manipulation flex-shrink-0"
                      style={{
                        backgroundColor: `${groupColor}15`,
                      }}
                      aria-label={`Add project with status ${groupKey}`}
                    >
                      <Plus 
                        className="h-5 w-5" 
                        style={{ color: groupColor }}
                      />
                    </button>
                  )}
                </>
              )}
            </div>

            <CollapsibleContent>
              <div className="px-3 py-4 space-y-3 bg-muted/20 border-t">
                {groupProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    collaborators={collaborators}
                    onProjectClick={onProjectClick}
                    onEditProject={onEditProject}
                    isPublicView={isPublicView}
                    onDeleteProject={onDeleteProject}
                    onProjectUpdate={onProjectUpdate}
                    onNavigateToLightroom={onNavigateToLightroom}
                    onNavigateToGDrive={onNavigateToGDrive}
                    showVerticalBadge={groupByMode !== 'vertical'}
                  />
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {sortedGroupKeys.length === 0 && (
        <div className="text-center py-20 px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Filter className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No projects found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
        </div>
      )}
    </div>
  );
}
