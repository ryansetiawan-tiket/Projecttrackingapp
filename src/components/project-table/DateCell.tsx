import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Button } from '../ui/button';
import { Calendar as CalendarComponent } from '../ui/calendar';
import { CalendarCheck } from 'lucide-react';
import { DateWithQuarter } from '../DateWithQuarter';

interface DateCellProps {
  dateString: string | null | undefined;
  projectId: string;
  field: 'start_date' | 'due_date';
  isPublicView: boolean;
  activeDatePopover: string | null;
  onPopoverChange: (value: string | null) => void;
  onDateUpdate: (projectId: string, field: string, date: Date | undefined) => void;
  onSetToday: (projectId: string, field: string) => void;
  compactMode?: boolean;
}

// Helper to convert date string to Date object for calendar
const convertToCalendarDate = (dateString: string | null | undefined): Date | undefined => {
  if (!dateString || dateString === '') return undefined;
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? undefined : date;
  } catch {
    return undefined;
  }
};

export function DateCell({
  dateString,
  projectId,
  field,
  isPublicView,
  activeDatePopover,
  onPopoverChange,
  onDateUpdate,
  onSetToday,
  compactMode = false
}: DateCellProps) {
  const popoverId = `${projectId}-${field === 'start_date' ? 'start' : 'due'}`;

  if (isPublicView) {
    return (
      <div className="text-sm text-muted-foreground md:text-foreground text-left">
        <DateWithQuarter dateString={dateString} showQuarter={!compactMode} />
      </div>
    );
  }

  return (
    <Popover 
      open={activeDatePopover === popoverId}
      onOpenChange={(open) => onPopoverChange(open ? popoverId : null)}
    >
      <PopoverTrigger asChild>
        <button className="text-sm text-muted-foreground md:text-foreground hover:text-primary transition-colors cursor-pointer text-left">
          <DateWithQuarter dateString={dateString} showQuarter={!compactMode} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3 border-b">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetToday(projectId, field)}
            className="w-full text-xs"
          >
            <CalendarCheck className="h-3 w-3 mr-1.5" />
            Set to Today
          </Button>
        </div>
        <CalendarComponent
          mode="single"
          selected={convertToCalendarDate(dateString)}
          onSelect={(date) => onDateUpdate(projectId, field, date)}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
