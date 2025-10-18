import { ChevronRight } from 'lucide-react';
import { cn } from '../ui/utils';
import { Project } from '../../types/project';
import { Badge } from '../ui/badge';
import { DateWithQuarter } from '../DateWithQuarter';

// Get days until deadline
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

interface AgendaItemProps {
  project: Project;
  statusColor: string;
  urgencyColor?: string | null;
  onClick: () => void;
}

export function AgendaItem({ project, statusColor, urgencyColor = null, onClick }: AgendaItemProps) {

  // Get days left for badge
  const daysLeft = getDaysUntilDeadline(project.due_date);
  const getDaysLeftBadgeText = (): string | null => {
    if (project.status === 'Done' || daysLeft === null) return null;
    
    if (daysLeft < 0) {
      return `${Math.abs(daysLeft)}d over`;
    } else if (daysLeft === 0) {
      return 'Today';
    } else if (daysLeft <= 14) {
      return `${daysLeft}d left`;
    }
    
    return null;
  };

  const badgeText = getDaysLeftBadgeText();

  // Get darker version of urgency color for better contrast
  const getDarkerUrgencyColor = (color: string | null): string => {
    if (!color) return '#1F2937';
    
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const darkerR = Math.round(r * 0.6);
    const darkerG = Math.round(g * 0.6);
    const darkerB = Math.round(b * 0.6);
    
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(darkerR)}${toHex(darkerG)}${toHex(darkerB)}`;
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 p-3 bg-card rounded-lg border",
        "hover:bg-accent active:bg-accent/80 transition-all touch-manipulation"
      )}
      style={{ minHeight: '64px' }}
    >
      {/* Left color stripe */}
      <div
        className="w-1.5 h-12 rounded-full flex-shrink-0"
        style={{ backgroundColor: statusColor }}
      />
      
      {/* Content */}
      <div className="flex-1 min-w-0 text-left">
        {/* Title row - prominent */}
        <div className="flex items-center gap-2 mb-2">
          {urgencyColor && (
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-black/10 dark:ring-white/10"
              style={{ backgroundColor: urgencyColor }}
            />
          )}
          <h3 className="flex-1 truncate" style={{ fontSize: '15px', fontWeight: 500, lineHeight: '1.4' }}>
            {project.project_name}
          </h3>
        </div>
        
        {/* Key info row - single line with most important data */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Vertical badge - colored */}
          {project.vertical && (
            <span 
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px]"
              style={{ 
                backgroundColor: statusColor + '15',
                color: statusColor,
                fontWeight: 500
              }}
            >
              {project.vertical}
            </span>
          )}
          
          {/* Status badge */}
          <span 
            className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px]"
            style={{ 
              backgroundColor: statusColor + '20',
              color: statusColor,
              fontWeight: 500
            }}
          >
            {project.status}
          </span>
          
          {/* Urgency/Days left badge */}
          {badgeText && (
            <span 
              className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px]"
              style={{ 
                backgroundColor: urgencyColor ? `${urgencyColor}25` : 'rgba(0,0,0,0.05)',
                color: getDarkerUrgencyColor(urgencyColor),
                border: urgencyColor ? `1px solid ${urgencyColor}50` : 'none',
                fontWeight: 500
              }}
            >
              {badgeText}
            </span>
          )}
          
          {/* Draft badge */}
          {project.is_draft && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700" style={{ fontWeight: 500 }}>
              Draft
            </span>
          )}
        </div>
        
        {/* Dates - simplified, third row */}
        {(project.start_date || project.due_date) && (
          <div className="mt-1.5 text-xs text-muted-foreground">
            {project.start_date && project.due_date ? (
              <>
                <DateWithQuarter dateString={project.start_date} fallbackText="" showQuarter={false} /> → <DateWithQuarter dateString={project.due_date} fallbackText="" showQuarter={false} />
              </>
            ) : project.start_date ? (
              <DateWithQuarter dateString={project.start_date} fallbackText="" showQuarter={false} />
            ) : (
              <DateWithQuarter dateString={project.due_date} fallbackText="" showQuarter={false} />
            )}
          </div>
        )}
      </div>
      
      {/* Right chevron */}
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
