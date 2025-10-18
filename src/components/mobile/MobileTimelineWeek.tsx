import { useState, useMemo, useRef } from 'react';
import { WeekStrip, WeekStripRef } from './WeekStrip';
import { LaneAccordion } from './LaneAccordion';
import { Button } from '../ui/button';
import { Calendar } from 'lucide-react';
import { Project } from '../../types/project';
import { useStatusContext } from '../StatusContext';
import { sortProjectsByUrgency, getMostUrgentPriority } from '../../utils/sortingUtils';

// Date utilities
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const eachDayOfInterval = (start: Date, end: Date) => {
  const days = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
};

interface MobileTimelineWeekProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  onEditProject?: (project: Project) => void;
  onUpdateProject?: (id: string, data: Partial<Project>) => void;
  hideArchived?: boolean;
  onHideArchivedToggle?: () => void;
}

export function MobileTimelineWeek({ 
  projects, 
  onProjectClick,
  onEditProject,
  onUpdateProject,
  hideArchived = false,
  onHideArchivedToggle
}: MobileTimelineWeekProps) {
  const { isArchiveStatus } = useStatusContext();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const weekStripRef = useRef<WeekStripRef>(null);

  // Calculate date range from projects
  const { periodStart, periodEnd, timeSlots } = useMemo(() => {
    const projectsWithDates = projects.filter(p => p.start_date && p.due_date);
    
    if (projectsWithDates.length === 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const weekStart = addDays(today, -7);
      const weekEnd = addDays(today, 7);
      return {
        periodStart: weekStart,
        periodEnd: weekEnd,
        timeSlots: eachDayOfInterval(weekStart, weekEnd)
      };
    }
    
    const startDates = projectsWithDates.map(p => new Date(p.start_date));
    const dueDates = projectsWithDates.map(p => new Date(p.due_date));
    
    const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
    const latestDue = new Date(Math.max(...dueDates.map(d => d.getTime())));
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const effectiveStart = new Date(Math.min(earliestStart.getTime(), today.getTime()));
    const effectiveEnd = new Date(Math.max(latestDue.getTime(), today.getTime()));
    
    const rangeStart = addDays(effectiveStart, -7);
    const rangeEnd = addDays(effectiveEnd, 7);
    
    const days = eachDayOfInterval(rangeStart, rangeEnd);
    return { periodStart: rangeStart, periodEnd: rangeEnd, timeSlots: days };
  }, [projects]);

  // Filter projects
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      if (!project.start_date || !project.due_date) return false;
      // Filter out archived projects based on status configuration
      if (hideArchived && isArchiveStatus(project.status)) return false;
      
      const projectStart = new Date(project.start_date);
      const projectEnd = new Date(project.due_date);
      
      // Filter by selected date if any
      if (selectedDate) {
        const selected = new Date(selectedDate);
        selected.setHours(0, 0, 0, 0);
        projectStart.setHours(0, 0, 0, 0);
        projectEnd.setHours(0, 0, 0, 0);
        
        return projectStart <= selected && projectEnd >= selected;
      }
      
      return true;
    });
  }, [projects, hideArchived, selectedDate, isArchiveStatus]);

  // Group by vertical and sort each group by urgency
  const projectsByVertical = useMemo(() => {
    const groups: { [vertical: string]: Project[] } = {};
    filteredProjects.forEach(project => {
      const vertical = project.vertical || 'Uncategorized';
      if (!groups[vertical]) {
        groups[vertical] = [];
      }
      groups[vertical].push(project);
    });
    
    // Sort projects within each vertical by urgency
    Object.keys(groups).forEach(vertical => {
      groups[vertical] = sortProjectsByUrgency(groups[vertical]);
    });
    
    return groups;
  }, [filteredProjects]);

  // Sort verticals by most urgent project
  const verticals = useMemo(() => {
    const verticalKeys = Object.keys(projectsByVertical);
    return verticalKeys.sort((a, b) => {
      const urgencyA = getMostUrgentPriority(projectsByVertical[a]);
      const urgencyB = getMostUrgentPriority(projectsByVertical[b]);
      
      // Lower priority number = more urgent
      if (urgencyA !== urgencyB) {
        return urgencyA - urgencyB;
      }
      
      // If same urgency, sort alphabetically
      return a.localeCompare(b);
    });
  }, [projectsByVertical]);

  // Count events per date
  const eventCountByDate = useMemo(() => {
    const counts = new Map<string, number>();
    projects.forEach(project => {
      if (!project.start_date || !project.due_date) return;
      // Filter out archived projects based on status configuration
      if (hideArchived && isArchiveStatus(project.status)) return;
      
      const start = new Date(project.start_date);
      const end = new Date(project.due_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      
      const days = eachDayOfInterval(start, end);
      days.forEach(day => {
        const key = day.toISOString().split('T')[0];
        counts.set(key, (counts.get(key) || 0) + 1);
      });
    });
    return counts;
  }, [projects, hideArchived, isArchiveStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started': return '#6B7280';
      case 'In Progress': return '#FFE5A0';
      case 'On Review': return '#F59E0B';
      case 'Done': return '#10B981';
      case 'On Hold': return '#F97316';
      case 'Canceled': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const handleProjectClick = (project: Project) => {
    // Open ProjectDetailSidebar instead of EventDetailSheet
    onProjectClick(project);
  };

  const handleMarkDone = (project: Project) => {
    if (onUpdateProject) {
      // When marking as done, auto-complete all tasks
      if (project.actionable_items && project.actionable_items.length > 0) {
        const updatedTasks = project.actionable_items.map(task => ({
          ...task,
          status: 'Done',
          is_completed: true
        }));
        
        onUpdateProject(project.id, { 
          status: 'Done',
          actionable_items: updatedTasks
        });
      } else {
        onUpdateProject(project.id, { status: 'Done' });
      }
    }
  };

  const goToToday = () => {
    // Scroll to today in WeekStrip instead of filtering
    weekStripRef.current?.scrollToToday();
  };

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  return (
    <div className="flex flex-col mobile-timeline-container bg-background">
      {/* Header */}
      <div className="flex-shrink-0 bg-background border-b px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-lg font-semibold">
              Timeline
            </h2>
            <p className="text-xs text-muted-foreground">
              {filteredProjects.length} projects
              {selectedDate && ' • Filtered by date'}
            </p>
          </div>
          <div className="flex gap-2">
            {selectedDate && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearDateFilter}
                className="h-11 text-xs touch-manipulation"
              >
                Clear Filter
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="h-11 text-xs touch-manipulation"
            >
              <Calendar className="w-3 h-3 mr-1" />
              Today
            </Button>
            {onHideArchivedToggle && (
              <Button
                variant={hideArchived ? 'default' : 'outline'}
                size="sm"
                onClick={onHideArchivedToggle}
                className="h-11 text-xs touch-manipulation"
              >
                {hideArchived ? 'Show' : 'Hide'} Archived
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Week Strip */}
      <div className="flex-shrink-0">
        <WeekStrip
          ref={weekStripRef}
          days={timeSlots}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
          eventCountByDate={eventCountByDate}
        />
      </div>

      {/* Agenda List */}
      <div className="flex-1 overflow-y-auto momentum-scroll" style={{ touchAction: 'pan-y' }}>
        {verticals.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground text-sm">
              {selectedDate 
                ? 'No projects on this date'
                : 'No projects to display'
              }
            </p>
            {selectedDate && (
              <Button
                variant="link"
                size="sm"
                onClick={clearDateFilter}
                className="mt-2"
              >
                Clear date filter
              </Button>
            )}
          </div>
        ) : (
          <div>
            {verticals.map((vertical, index) => (
              <LaneAccordion
                key={vertical}
                vertical={vertical}
                projects={projectsByVertical[vertical]}
                getStatusColor={getStatusColor}
                onProjectClick={handleProjectClick}
                defaultCollapsed={index !== 0}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
