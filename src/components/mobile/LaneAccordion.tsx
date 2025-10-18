import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../ui/utils';
import { Project } from '../../types/project';
import { AgendaItem } from './AgendaItem';
import { sortProjectsByUrgency } from '../../utils/sortingUtils';

// Get days until deadline for urgency indicator
const getDaysUntilDeadline = (dateString: string | null | undefined): number | null => {
  if (!dateString) return null;
  
  try {
    const deadline = new Date(dateString);
    if (isNaN(deadline.getTime())) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    deadline.setHours(0, 0, 0, 0);
    
    const diffTime = deadline.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch {
    return null;
  }
};

// Get deadline urgency color for indicator
const getDeadlineUrgencyColor = (dateString: string | null | undefined, status: string): string | null => {
  if (status === 'Done') {
    return '#10B981'; // Green
  }
  
  const daysLeft = getDaysUntilDeadline(dateString);
  if (daysLeft === null) return null;
  
  if (daysLeft <= 3) {
    return '#EF4444'; // Red
  }
  
  if (daysLeft <= 7) {
    return '#EAB308'; // Yellow
  }
  
  if (daysLeft <= 14) {
    return '#3B82F6'; // Blue
  }
  
  return null;
};

interface LaneAccordionProps {
  vertical: string;
  projects: Project[];
  getStatusColor: (status: string) => string;
  onProjectClick: (project: Project) => void;
  defaultCollapsed?: boolean;
}

export function LaneAccordion({
  vertical,
  projects,
  getStatusColor,
  onProjectClick,
  defaultCollapsed = true
}: LaneAccordionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);
  
  // Sort projects by urgency
  const sortedProjects = sortProjectsByUrgency(projects);
  
  // Auto-expand if not default collapsed
  useEffect(() => {
    setIsCollapsed(defaultCollapsed);
  }, [defaultCollapsed]);

  return (
    <div className="border-b last:border-b-0">
      {/* Header */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className={cn(
          "w-full flex items-center justify-between p-4 bg-muted/30",
          "hover:bg-muted/50 active:bg-muted transition-colors touch-manipulation"
        )}
        style={{ minHeight: '56px' }}
      >
        <div className="flex items-center gap-3">
          <ChevronDown
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isCollapsed && "-rotate-90"
            )}
          />
          <div className="text-left">
            <div className="font-medium text-sm text-foreground">
              {vertical}
            </div>
            <div className="text-xs text-muted-foreground">
              {projects.length} {projects.length === 1 ? 'project' : 'projects'}
            </div>
          </div>
        </div>
        
        {/* Quick count badges */}
        <div className="flex gap-1">
          {['In Progress', 'On Review'].map(status => {
            const count = projects.filter(p => p.status === status).length;
            if (count === 0) return null;
            return (
              <div
                key={status}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-background text-[10px] font-medium"
                style={{ color: getStatusColor(status) }}
              >
                {count}
              </div>
            );
          })}
        </div>
      </button>
      
      {/* Content */}
      {!isCollapsed && (
        <div className="bg-background">
          <div className="flex flex-col gap-2 p-3">
            {sortedProjects.map((project) => (
              <AgendaItem
                key={project.id}
                project={project}
                statusColor={getStatusColor(project.status)}
                urgencyColor={getDeadlineUrgencyColor(project.due_date, project.status)}
                onClick={() => onProjectClick(project)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
