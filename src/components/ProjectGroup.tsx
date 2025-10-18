import { useState } from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown, Building, Plus } from 'lucide-react';
import { Project, Collaborator } from '../types/project';
import { ProjectCard } from './ProjectCard';
import { useColors } from './ColorContext';
import { sortProjectsByUrgency } from '../utils/sortingUtils';

interface ProjectGroupProps {
  vertical: string;
  projects: Project[];
  collaborators: Collaborator[];
  onProjectClick: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onDeleteProject?: (project: Project) => void;
  onProjectUpdate?: (id: string, data: Partial<Project>) => void;
  onNavigateToLightroom?: (projectId: string) => void;
  onNavigateToGDrive?: (projectId: string) => void;
  onCreateProject: (vertical?: string) => void;
  isPublicView?: boolean;
}

export function ProjectGroup({
  vertical,
  projects,
  collaborators,
  onProjectClick,
  onEditProject,
  onDeleteProject,
  onProjectUpdate,
  onNavigateToLightroom,
  onNavigateToGDrive,
  onCreateProject,
  isPublicView = false
}: ProjectGroupProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { verticalColors } = useColors();
  
  // Sort projects by urgency
  const sortedProjects = sortProjectsByUrgency(projects);
  
  const completedCount = sortedProjects.filter(p => p.status === 'Done').length;
  const totalCount = sortedProjects.length;
  const progressPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  const verticalColor = verticalColors[vertical] || '#6b7280';
  
  // Calculate actionable items progress across all projects
  const allActionableItems = sortedProjects.flatMap(p => p.actionable_items || []);
  const completedActionableItems = allActionableItems.filter(item => item.is_completed).length;
  const totalActionableItems = allActionableItems.length;
  const actionableProgress = totalActionableItems > 0 ? 
    Math.round((completedActionableItems / totalActionableItems) * 100) : 0;

  return (
    <Card className="overflow-hidden border-l-4" style={{ borderLeftColor: verticalColor }}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="hover:bg-muted/50 cursor-pointer transition-colors pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: verticalColor }}
                />
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">{vertical}</h3>
                </div>
                <Badge variant="outline" className="text-xs">
                  {totalCount} project{totalCount !== 1 ? 's' : ''}
                </Badge>
                {!isPublicView && (
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onCreateProject(vertical);
                    }}
                    className="p-0.5 rounded hover:bg-muted/50 transition-colors opacity-60 hover:opacity-100 cursor-pointer"
                    title={`Create new project in ${vertical}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        onCreateProject(vertical);
                      }
                    }}
                  >
                    <Plus className="w-3.5 h-3.5" style={{ color: verticalColor }} />
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end gap-2 min-w-0 flex-shrink-0">
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <Badge 
                      variant="secondary" 
                      className="text-xs whitespace-nowrap"
                      style={{ 
                        backgroundColor: `${verticalColor}15`, 
                        color: verticalColor 
                      }}
                    >
                      {progressPercentage}% complete
                    </Badge>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="flex gap-2 items-center">
                    <div className="w-16 bg-muted rounded-full h-1.5 flex-shrink-0">
                      <div 
                        className="h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${progressPercentage}%`,
                          backgroundColor: verticalColor 
                        }}
                      />
                    </div>
                  </div>
                </div>
                
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-3">
            {/* Projects grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  collaborators={collaborators}
                  onProjectClick={onProjectClick}
                  onEditProject={onEditProject}
                  onDeleteProject={onDeleteProject}
                  onProjectUpdate={onProjectUpdate}
                  onNavigateToLightroom={onNavigateToLightroom}
                  onNavigateToGDrive={onNavigateToGDrive}
                  showVerticalBadge={false}
                  isPublicView={isPublicView}
                />
              ))}
              

            </div>
            

          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}