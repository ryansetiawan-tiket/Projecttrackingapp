import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import { DayCell } from './DayCell';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../ui/utils';

interface WeekStripProps {
  days: Date[];
  selectedDate: Date | null;
  onDateSelect: (date: Date) => void;
  eventCountByDate?: Map<string, number>;
}

export interface WeekStripRef {
  scrollToToday: () => void;
}

export const WeekStrip = forwardRef<WeekStripRef, WeekStripProps>(({ 
  days, 
  selectedDate, 
  onDateSelect,
  eventCountByDate = new Map()
}, ref) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const scrollToToday = () => {
    if (!scrollRef.current) return;
    
    const todayIndex = days.findIndex(day => {
      const d = new Date(day);
      d.setHours(0, 0, 0, 0);
      return d.getTime() === today.getTime();
    });
    
    if (todayIndex !== -1) {
      const cellWidth = 64; // DayCell width
      const gap = 8; // gap-2 = 8px between cells
      const containerPadding = 16; // px-4 on each side
      const containerWidth = scrollRef.current.clientWidth;
      
      // Total width occupied by cells and gaps before today
      const totalWidthBeforeToday = (todayIndex * cellWidth) + (todayIndex * gap);
      
      // Center the today cell in viewport
      const centerOffset = (containerWidth / 2) - (cellWidth / 2);
      
      // Calculate scroll position: position of today - center offset + left padding
      const scrollLeft = Math.max(0, totalWidthBeforeToday - centerOffset + containerPadding);
      
      scrollRef.current.scrollTo({ left: scrollLeft, behavior: 'smooth' });
    }
  };

  // Expose scrollToToday via ref
  useImperativeHandle(ref, () => ({
    scrollToToday
  }));

  // Auto-scroll to today on mount
  useEffect(() => {
    scrollToToday();
  }, [days]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 320; // ~5 days
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="relative bg-background border-b">
      {/* Fade hints */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
      
      {/* Left chevron */}
      <button
        onClick={() => scroll('left')}
        className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm flex items-center justify-center hover:bg-accent transition-colors touch-manipulation"
        aria-label="Scroll left"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      
      {/* Right chevron */}
      <button
        onClick={() => scroll('right')}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm border shadow-sm flex items-center justify-center hover:bg-accent transition-colors touch-manipulation"
        aria-label="Scroll right"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      
      {/* Scrollable week strip */}
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-hide px-4 py-3 scroll-smooth momentum-scroll"
        style={{
          scrollSnapType: 'x mandatory'
        }}
      >
        {days.map((day) => {
          const dateKey = getDateKey(day);
          const dayDate = new Date(day);
          dayDate.setHours(0, 0, 0, 0);
          const todayDate = new Date(today);
          todayDate.setHours(0, 0, 0, 0);
          
          const isToday = dayDate.getTime() === todayDate.getTime();
          const isSelected = selectedDate && 
            new Date(selectedDate).toDateString() === dayDate.toDateString();
          const eventCount = eventCountByDate.get(dateKey) || 0;
          
          return (
            <div
              key={dateKey}
              style={{ scrollSnapAlign: 'center' }}
            >
              <DayCell
                date={day}
                isToday={isToday}
                isSelected={isSelected}
                hasEvents={eventCount > 0}
                eventCount={eventCount}
                onClick={() => onDateSelect(day)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
});

WeekStrip.displayName = 'WeekStrip';
