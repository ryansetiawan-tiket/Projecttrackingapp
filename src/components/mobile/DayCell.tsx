import { cn } from '../ui/utils';

interface DayCellProps {
  date: Date;
  isToday?: boolean;
  isSelected?: boolean;
  hasEvents?: boolean;
  eventCount?: number;
  onClick?: () => void;
}

export function DayCell({ 
  date, 
  isToday = false, 
  isSelected = false,
  hasEvents = false,
  eventCount = 0,
  onClick 
}: DayCellProps) {
  const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
  const day = date.getDate();
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 w-16 min-w-[64px] py-2 px-2 rounded-lg transition-all touch-manipulation",
        "hover:bg-accent active:scale-95",
        isSelected && "bg-primary text-primary-foreground",
        isToday && !isSelected && "bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-200 dark:ring-blue-800",
        !isSelected && !isToday && "bg-card"
      )}
      style={{ minHeight: '64px' }}
    >
      {/* Weekday */}
      <span className={cn(
        "text-xs",
        isSelected ? "text-primary-foreground" : "text-muted-foreground"
      )}>
        {weekday}
      </span>
      
      {/* Date */}
      <span className={cn(
        "text-base font-semibold",
        isToday && !isSelected && "text-blue-600 dark:text-blue-400"
      )}>
        {day}
      </span>
      
      {/* Event indicators */}
      {hasEvents && eventCount > 0 && (
        <div className="flex gap-0.5 mt-0.5">
          {Array.from({ length: Math.min(eventCount, 3) }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "w-1 h-1 rounded-full",
                isSelected ? "bg-primary-foreground/60" : "bg-primary/60"
              )}
            />
          ))}
          {eventCount > 3 && (
            <span className={cn(
              "text-[8px] ml-0.5",
              isSelected ? "text-primary-foreground/80" : "text-muted-foreground"
            )}>
              +{eventCount - 3}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
