import { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { ChevronLeft, ChevronRight, Calendar, Filter } from 'lucide-react';
import { Project } from '../types/project';
import { getContrastColor } from '../utils/colorUtils';
import { MobileTimelineWeek } from './mobile/MobileTimelineWeek';
import { useStatusContext } from './StatusContext';
import { useColorContext } from './ColorContext';

// Date utilities
const addDays = (date: Date, days: number) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date: Date, months: number) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = result.getDate() - day;
  return new Date(result.setDate(diff));
};

const startOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

const endOfMonth = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
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

// Get quarter from month
const getQuarter = (month: number) => {
  if (month >= 0 && month <= 2) return 'Q1';
  if (month >= 3 && month <= 5) return 'Q2';
  if (month >= 6 && month <= 8) return 'Q3';
  return 'Q4';
};

type TimeView = 'week' | 'month';

interface ProjectTimelineProps {
  projects: Project[];
  onProjectClick: (project: Project) => void;
  isPublicView?: boolean;
}

export function ProjectTimeline({ projects, onProjectClick, isPublicView = false }: ProjectTimelineProps) {
  const { isArchiveStatus, getStatusColor: getStatusColorFromContext, getStatusTextColor } = useStatusContext();
  const { verticalColors } = useColorContext();
  
  const getVerticalColor = (vertical: string) => {
    return verticalColors[vertical] || '#6366F1';
  };
  const [currentDate, setCurrentDate] = useState(new Date());
  const [timeView, setTimeView] = useState<TimeView>('week');
  const [hideArchived, setHideArchived] = useState(true);
  const [selectedVertical, setSelectedVertical] = useState<string>('all');
  
  // Refs for scroll synchronization
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  
  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    visible: boolean;
    x: number;
    y: number;
    projectName: string;
    startDate: string;
    dueDate: string;
    status: string;
    vertical: string;
    daysLeft: number | null;
  } | null>(null);

  const { periodStart, periodEnd, timeSlots } = useMemo(() => {
    if (timeView === 'week') {
      // Find earliest start date and latest due date from all projects
      const projectsWithDates = projects.filter(p => p.start_date && p.due_date);
      
      if (projectsWithDates.length === 0) {
        // If no projects, show current week
        const weekStart = startOfWeek(currentDate);
        const weekEnd = addDays(weekStart, 6);
        const days = eachDayOfInterval(weekStart, weekEnd);
        return { periodStart: weekStart, periodEnd: weekEnd, timeSlots: days };
      }
      
      // Find min start date and max due date
      const startDates = projectsWithDates.map(p => new Date(p.start_date));
      const dueDates = projectsWithDates.map(p => new Date(p.due_date));
      
      const earliestStart = new Date(Math.min(...startDates.map(d => d.getTime())));
      const latestDue = new Date(Math.max(...dueDates.map(d => d.getTime())));
      
      // IMPORTANT: Always include today's date in the range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const effectiveStart = new Date(Math.min(earliestStart.getTime(), today.getTime()));
      const effectiveEnd = new Date(Math.max(latestDue.getTime(), today.getTime()));
      
      // Add buffer: H-7 from earliest start, H+7 from latest due
      const rangeStart = addDays(effectiveStart, -7);
      const rangeEnd = addDays(effectiveEnd, 7);
      
      const days = eachDayOfInterval(rangeStart, rangeEnd);
      return { periodStart: rangeStart, periodEnd: rangeEnd, timeSlots: days };
    } else {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart);
      const calendarEnd = addDays(startOfWeek(addDays(monthEnd, 6)), 6);
      const days = eachDayOfInterval(calendarStart, calendarEnd);
      return { periodStart: monthStart, periodEnd: monthEnd, timeSlots: days };
    }
  }, [currentDate, timeView, projects]);

  // Get unique verticals from all projects (dynamic from actual data)
  const availableVerticals = useMemo(() => {
    const verticalSet = new Set<string>();
    projects.forEach(project => {
      if (project.vertical) {
        verticalSet.add(project.vertical);
      }
    });
    return Array.from(verticalSet).sort();
  }, [projects]);

  // Check if there are projects without vertical
  const hasUncategorized = useMemo(() => {
    return projects.some(p => !p.vertical);
  }, [projects]);

  const periodProjects = useMemo(() => {
    return projects.filter(project => {
      if (!project.start_date || !project.due_date) return false;
      const projectStart = new Date(project.start_date);
      const projectEnd = new Date(project.due_date);
      const isInPeriod = projectStart <= periodEnd && projectEnd >= periodStart;
      
      // Filter out archived projects based on status configuration
      if (hideArchived && isArchiveStatus(project.status)) return false;
      
      // Filter by selected vertical (only in month view)
      if (timeView === 'month' && selectedVertical !== 'all') {
        const projectVertical = project.vertical || 'Uncategorized';
        if (projectVertical !== selectedVertical) return false;
      }
      
      return isInPeriod;
    });
  }, [projects, periodStart, periodEnd, hideArchived, timeView, selectedVertical]);

  const navigatePeriod = useCallback((direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      if (timeView === 'week') {
        return addDays(prev, direction === 'prev' ? -7 : 7);
      } else {
        return addMonths(prev, direction === 'prev' ? -1 : 1);
      }
    });
  }, [timeView]);

  const goToToday = () => setCurrentDate(new Date());

  // Flag to prevent scroll sync during programmatic scroll
  const isProgrammaticScroll = useRef(false);
  const scrollTimeoutRef = useRef<number | null>(null);

  // Synchronize horizontal scroll between header and body
  const handleHeaderScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll.current) return;
    if (bodyScrollRef.current) {
      bodyScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  const handleBodyScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    if (isProgrammaticScroll.current) return;
    if (headerScrollRef.current) {
      headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  }, []);

  // Scroll to today's date (Desktop only)
  const scrollToToday = useCallback((isInitialScroll = false) => {
    if (timeView !== 'week') {
      return;
    }
    
    // Wait for refs to be available
    if (!headerScrollRef.current || !bodyScrollRef.current) {
      requestAnimationFrame(() => scrollToToday(isInitialScroll));
      return;
    }
    
    // Check if this is desktop view (the scrollable container should be visible)
    const containerWidth = headerScrollRef.current.clientWidth;
    
    // If container width is 0, it means the desktop view is not visible (mobile layout)
    if (containerWidth === 0) {
      return;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayIndex = timeSlots.findIndex(slot => {
      const slotDate = new Date(slot);
      slotDate.setHours(0, 0, 0, 0);
      return slotDate.getTime() === today.getTime();
    });
    
    if (todayIndex === -1) {
      return;
    }
    
    // Each date column is 128px (w-32 = 8rem = 128px)
    const columnWidth = 128;
    
    // Center the today column in the viewport
    const scrollPosition = Math.max(0, (todayIndex * columnWidth) - (containerWidth / 2) + (columnWidth / 2));
    
    // Clear any existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    
    // Set flag to prevent scroll sync interference
    isProgrammaticScroll.current = true;
    
    // Use instant scroll for initial auto-scroll, smooth for manual clicks
    const scrollBehavior = isInitialScroll ? 'auto' : 'smooth';
    
    // Scroll both containers simultaneously
    headerScrollRef.current.scrollTo({
      left: scrollPosition,
      behavior: scrollBehavior
    });
    bodyScrollRef.current.scrollTo({
      left: scrollPosition,
      behavior: scrollBehavior
    });
    
    // Reset flag after scroll animation completes (smooth scroll takes ~500ms, instant is immediate)
    const resetDelay = isInitialScroll ? 100 : 1000;
    scrollTimeoutRef.current = window.setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, resetDelay);
  }, [timeView, timeSlots]);

  // Auto-scroll to today when switching to week view (Desktop only)
  // Using useLayoutEffect to ensure scroll happens after layout but before paint
  useLayoutEffect(() => {
    if (timeView === 'week' && timeSlots.length > 0) {
      // Use setTimeout with delay to ensure DOM is fully ready
      const timer = setTimeout(() => {
        scrollToToday(true); // Pass true to indicate this is initial scroll
      }, 300); // Delay to ensure container width is calculated
      
      return () => clearTimeout(timer);
    }
  }, [timeView, timeSlots.length, scrollToToday]);

  // Touch/Swipe handling
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSwipeActive, setIsSwipeActive] = useState(false);
  
  // Mouse drag handling for desktop
  const mouseStartX = useRef<number>(0);
  const mouseEndX = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStarted, setDragStarted] = useState(false);
  const dragThreshold = 5; // Minimum pixels moved to consider it a drag
  


  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (timeView !== 'week') return;
    touchStartX.current = e.targetTouches[0].clientX;
    setIsSwipeActive(true);
  }, [timeView]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (timeView !== 'week') return;
    touchEndX.current = e.targetTouches[0].clientX;
  }, [timeView]);

  const handleTouchEnd = useCallback(() => {
    if (timeView !== 'week') return;
    
    const difference = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(difference) > minSwipeDistance) {
      setIsTransitioning(true);
      
      // Haptic feedback for mobile devices
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
      
      if (difference > 0) {
        // Swipe left - go to next week
        navigatePeriod('next');
      } else {
        // Swipe right - go to previous week
        navigatePeriod('prev');
      }

      // Reset transition state after animation
      setTimeout(() => setIsTransitioning(false), 300);
    }
    
    setIsSwipeActive(false);
  }, [timeView]);

  // Mouse drag handlers for desktop
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (timeView !== 'week') return;
    
    // Only handle left mouse button
    if (e.button !== 0) return;
    
    e.preventDefault();
    setDragStarted(true);
    mouseStartX.current = e.clientX;
    mouseEndX.current = e.clientX;
  }, [timeView]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStarted || timeView !== 'week') return;
    
    const currentX = e.clientX;
    const distance = Math.abs(currentX - mouseStartX.current);
    
    // Start dragging only after threshold is met
    if (!isDragging && distance > dragThreshold) {
      setIsDragging(true);
    }
    
    if (isDragging) {
      e.preventDefault();
      mouseEndX.current = currentX;
    }
  }, [isDragging, dragStarted, timeView, dragThreshold]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging || timeView !== 'week') return;
    
    const difference = mouseStartX.current - mouseEndX.current;
    const minDragDistance = 50;

    if (Math.abs(difference) > minDragDistance) {
      setIsTransitioning(true);
      
      if (difference > 0) {
        // Drag left - go to next week
        navigatePeriod('next');
      } else {
        // Drag right - go to previous week
        navigatePeriod('prev');
      }

      // Reset transition state after animation
      setTimeout(() => setIsTransitioning(false), 300);
    }

    setIsDragging(false);
    setDragStarted(false);
  }, [isDragging, timeView]);

  const handleMouseLeave = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
      setDragStarted(false);
    }
  }, [isDragging]);

  // Mouse wheel handler for horizontal scrolling in week view
  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (timeView !== 'week') return;
    
    // Check if we have refs available
    if (!headerScrollRef.current || !bodyScrollRef.current) return;
    
    // Convert vertical scroll to horizontal scroll
    const deltaY = e.deltaY;
    const deltaX = e.deltaX;
    
    // If there's already horizontal scroll (trackpad), let it work naturally
    if (Math.abs(deltaX) > Math.abs(deltaY)) return;
    
    // Prevent default vertical scrolling
    e.preventDefault();
    
    // Calculate new scroll position
    const scrollAmount = deltaY;
    const currentScrollLeft = headerScrollRef.current.scrollLeft;
    const newScrollLeft = currentScrollLeft + scrollAmount;
    
    // Set flag to prevent scroll sync interference
    isProgrammaticScroll.current = true;
    
    // Scroll both header and body horizontally
    headerScrollRef.current.scrollLeft = newScrollLeft;
    bodyScrollRef.current.scrollLeft = newScrollLeft;
    
    // Reset flag after a short delay
    requestAnimationFrame(() => {
      isProgrammaticScroll.current = false;
    });
  }, [timeView]);

  // Keyboard navigation for week view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (timeView !== 'week') return;
      
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        navigatePeriod('prev');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        navigatePeriod('next');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeView]);

  // Global mouse event listeners for drag
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!dragStarted || timeView !== 'week') return;
      
      const currentX = e.clientX;
      const distance = Math.abs(currentX - mouseStartX.current);
      
      // Start dragging only after threshold is met
      if (!isDragging && distance > dragThreshold) {
        setIsDragging(true);
      }
      
      if (isDragging) {
        mouseEndX.current = currentX;
      }
    };

    const handleGlobalMouseUp = () => {
      if (!isDragging || timeView !== 'week') return;
      
      const difference = mouseStartX.current - mouseEndX.current;
      const minDragDistance = 50;

      if (Math.abs(difference) > minDragDistance) {
        setIsTransitioning(true);
        
        if (difference > 0) {
          navigatePeriod('next');
        } else {
          navigatePeriod('prev');
        }

        setTimeout(() => setIsTransitioning(false), 300);
      }

      setIsDragging(false);
      setDragStarted(false);
    };

    if (dragStarted) {
      document.addEventListener('mousemove', handleGlobalMouseMove);
      document.addEventListener('mouseup', handleGlobalMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDragging, dragStarted, timeView, dragThreshold]);

  const getStatusColor = (status: string) => {
    return getStatusColorFromContext(status);
  };

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

  // Get deadline urgency color for indicator dot
  const getDeadlineUrgencyColor = (dateString: string | null | undefined, status: string): string | null => {
    // Done projects get green indicator
    if (status === 'Done') {
      return '#10B981'; // Green
    }
    
    const daysLeft = getDaysUntilDeadline(dateString);
    if (daysLeft === null) return null;
    
    // Red for urgent (overdue, due today, or 1-3 days left)
    if (daysLeft <= 3) {
      return '#EF4444'; // Red
    }
    
    // Yellow for warning (4-7 days)
    if (daysLeft <= 7) {
      return '#EAB308'; // Yellow
    }
    
    // Blue for upcoming (8-14 days)
    if (daysLeft <= 14) {
      return '#3B82F6'; // Blue
    }
    
    // No indicator for > 14 days
    return null;
  };

  // Format days left badge text
  const getDaysLeftBadgeText = (dateString: string | null | undefined, status: string): string | null => {
    if (status === 'Done') {
      return null; // No badge for done projects
    }
    
    const daysLeft = getDaysUntilDeadline(dateString);
    if (daysLeft === null) return null;
    
    if (daysLeft < 0) {
      return `${Math.abs(daysLeft)}d over`; // Overdue
    } else if (daysLeft === 0) {
      return 'Due today';
    } else if (daysLeft <= 14) {
      return `${daysLeft}d left`;
    }
    
    return null; // Don't show for >14 days
  };

  // Calculate text color based on background brightness
  const getTextColor = (bgColor: string) => {
    // Convert hex to RGB
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;

    // Apply sRGB gamma correction
    const rsRGB = r <= 0.03928 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    const gsRGB = g <= 0.03928 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    const bsRGB = b <= 0.03928 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Calculate relative luminance
    const luminance = 0.2126 * rsRGB + 0.7152 * gsRGB + 0.0722 * bsRGB;

    // Return dark text for light backgrounds, white text for dark backgrounds
    return luminance > 0.5 ? '#1F2937' : '#FFFFFF'; // Gray 800 or White
  };

  // Get darker version of urgency color for better contrast on light badge background
  const getDarkerUrgencyColor = (urgencyColor: string | null): string => {
    if (!urgencyColor) return '#1F2937';
    
    // Parse hex color
    const hex = urgencyColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Darken by reducing RGB values (multiply by 0.6 for better visibility)
    const darkerR = Math.round(r * 0.6);
    const darkerG = Math.round(g * 0.6);
    const darkerB = Math.round(b * 0.6);
    
    // Convert back to hex
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return `#${toHex(darkerR)}${toHex(darkerG)}${toHex(darkerB)}`;
  };

  const getPeriodLabel = () => {
    if (timeView === 'week') {
      const startStr = periodStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const endStr = periodEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      return `${startStr} - ${endStr}`;
    } else {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
  };

  const getQuarterInfo = () => {
    const quarter = getQuarter(currentDate.getMonth());
    const year = currentDate.getFullYear();
    return `${quarter} ${year}`;
  };

  // Group projects by vertical for week view
  const projectsByVertical = useMemo(() => {
    if (timeView !== 'week') return {};
    
    const groups: { [vertical: string]: Project[] } = {};
    periodProjects.forEach(project => {
      const vertical = project.vertical || 'Uncategorized';
      if (!groups[vertical]) {
        groups[vertical] = [];
      }
      groups[vertical].push(project);
    });
    
    return groups;
  }, [periodProjects, timeView]);

  const verticals = useMemo(() => {
    return Object.keys(projectsByVertical).sort();
  }, [projectsByVertical]);

  return (
    <div className="bg-background">
      {/* Mobile: Use mobile-optimized timeline */}
      <div className="md:hidden h-full">
        <MobileTimelineWeek
          projects={periodProjects}
          onProjectClick={onProjectClick}
          hideArchived={hideArchived}
          onHideArchivedToggle={() => setHideArchived(!hideArchived)}
        />
      </div>

      {/* Desktop: Original timeline */}
      <div className="hidden md:block">
      {/* Mobile-First Timeline Header */}
      <div className="mb-6 px-4 py-4 bg-gray-50 dark:bg-[#1A1A1D] rounded-lg border border-transparent dark:border-[#2E2E32]">
        {/* Top Row - Month/Year and Quarter */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
              {getPeriodLabel()}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
              {timeView === 'month' && getQuarterInfo()}
              {timeView === 'week' && (
                <span className="flex items-center gap-1">
                  {`${periodProjects.length} projects • ${Math.ceil(timeSlots.length / 7)} weeks`}
                  <span className="hidden sm:inline text-xs text-gray-400 dark:text-gray-500">• Desktop: scroll to view</span>
                  <span className="sm:hidden text-xs text-gray-400 dark:text-gray-500">• Swipe to navigate</span>
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {timeView === 'month' ? `${periodProjects.length} projects` : ''}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {timeView === 'month' ? 'this month' : ''}
            </p>
          </div>
        </div>

        {/* Bottom Row - Controls */}
        <div className="flex items-center justify-between">
          {/* View Toggle - Mobile Optimized */}
          <div className="flex items-center space-x-1">
            <Button
              variant={timeView === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                setTimeView('week');
                setSelectedVertical('all'); // Reset filter when switching to week view
              }}
              className="text-xs px-2 py-1 h-8"
            >
              <Calendar className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">Week</span>
              <span className="xs:hidden">W</span>
            </Button>
            <Button
              variant={timeView === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeView('month')}
              className="text-xs px-2 py-1 h-8"
            >
              <Calendar className="h-3 w-3 mr-1" />
              <span className="hidden xs:inline">Month</span>
              <span className="xs:hidden">M</span>
            </Button>
            
            {/* Vertical Filter - Only show in month view on desktop */}
            {timeView === 'month' && (
              <>
                <div className="h-6 w-px bg-border mx-2" />
                <Select value={selectedVertical} onValueChange={setSelectedVertical}>
                  <SelectTrigger className="h-8 w-[140px] text-xs">
                    <div className="flex items-center gap-1.5">
                      <Filter className="h-3 w-3" />
                      <SelectValue placeholder="All Verticals" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Verticals</SelectItem>
                    {availableVerticals.map((vertical) => (
                      <SelectItem key={vertical} value={vertical}>
                        {vertical}
                      </SelectItem>
                    ))}
                    {hasUncategorized && (
                      <SelectItem value="Uncategorized">Uncategorized</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center space-x-2">
            {timeView === 'month' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePeriod('prev')}
                  disabled={isTransitioning}
                  className={`h-8 w-8 p-0 transition-all ${isTransitioning ? 'opacity-50' : 'hover:scale-105'}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigatePeriod('next')}
                  disabled={isTransitioning}
                  className={`h-8 w-8 p-0 transition-all ${isTransitioning ? 'opacity-50' : 'hover:scale-105'}`}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToToday}
                  className="text-xs px-2 py-1 h-8 hidden xs:inline-flex"
                >
                  Today
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={goToToday}
                  className="text-xs px-2 py-1 h-8 xs:hidden"
                >
                  T
                </Button>
                <Button 
                  variant={hideArchived ? 'default' : 'outline'}
                  size="sm" 
                  onClick={() => setHideArchived(!hideArchived)}
                  className="text-xs px-3 py-1 h-8 transition-colors hidden xs:inline-flex"
                  title={hideArchived ? 'Show archived projects' : 'Hide archived projects'}
                >
                  {hideArchived ? 'Show Archived' : 'Hide Archived'}
                </Button>
                <Button 
                  variant={hideArchived ? 'default' : 'outline'}
                  size="sm" 
                  onClick={() => setHideArchived(!hideArchived)}
                  className="text-xs px-2 py-1 h-8 xs:hidden"
                  title={hideArchived ? 'Show archived projects' : 'Hide archived projects'}
                >
                  {hideArchived ? 'S' : 'H'}
                </Button>
              </>
            )}
            {timeView === 'week' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => scrollToToday(false)}
                  className="text-xs px-3 py-1 h-8 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                  title="Scroll to today's date"
                >
                  <Calendar className="h-3 w-3 mr-1" />
                  Today
                </Button>
                <Button 
                  variant={hideArchived ? 'default' : 'outline'}
                  size="sm" 
                  onClick={() => setHideArchived(!hideArchived)}
                  className="text-xs px-3 py-1 h-8 transition-colors"
                  title={hideArchived ? 'Show archived projects' : 'Hide archived projects'}
                >
                  {hideArchived ? 'Show Archived' : 'Hide Archived'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Timeline View - Week (Desktop: Google Sheets style, Mobile: Calendar grid) */}
      {timeView === 'week' && (
        <>
          {/* Desktop: Google Sheets Timeline Style */}
          <div className="hidden md:block bg-card border rounded-lg overflow-hidden">
            {/* Fixed Header */}
            <div className="flex border-b bg-muted sticky top-0 z-20">
              {/* Left Column Header */}
              <div className="w-48 flex-shrink-0 border-r bg-muted px-4 py-3">
                <div className="text-sm font-semibold text-foreground">Verticals</div>
              </div>
              {/* Scrollable Date Headers */}
              <div 
                ref={headerScrollRef}
                className="flex-1 overflow-x-auto scrollbar-hide"
                onScroll={handleHeaderScroll}
                onWheel={handleWheel}
              >
                <div className="flex min-w-max">
                  {timeSlots.map((slot) => {
                    const isToday = slot.toDateString() === new Date().toDateString();
                    return (
                      <div 
                        key={slot.toISOString()} 
                        className={`w-32 flex-shrink-0 border-r last:border-r-0 px-3 py-3 text-center transition-colors ${isToday ? 'bg-blue-100 dark:bg-blue-950' : ''}`}
                      >
                        <div className={`text-xs ${isToday ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-muted-foreground'}`}>
                          {slot.toLocaleDateString('en-US', { weekday: 'short' })}
                        </div>
                        <div className={`text-sm font-medium ${isToday ? 'text-blue-700 dark:text-blue-300' : 'text-foreground'}`}>
                          {slot.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                        {isToday && (
                          <div className="w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full mx-auto mt-1"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex max-h-[600px] overflow-y-auto relative">
              {/* Horizontal Border Lines Overlay */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {verticals.map((vertical, verticalIndex) => {
                  const verticalProjects = projectsByVertical[vertical];
                  const rowHeight = Math.max(60, verticalProjects.length * 36 + 24);
                  const isLastVertical = verticalIndex === verticals.length - 1;
                  const topPosition = verticals.slice(0, verticalIndex).reduce((sum, v) => {
                    const vProjects = projectsByVertical[v];
                    return sum + Math.max(60, vProjects.length * 36 + 24);
                  }, 0);
                  
                  if (isLastVertical) return null;
                  
                  return (
                    <div 
                      key={`border-${vertical}`}
                      className="absolute left-0 right-0 border-b border-border"
                      style={{ top: `${topPosition + rowHeight}px` }}
                    />
                  );
                })}
              </div>

              {/* Left Column - Verticals */}
              <div className="w-48 flex-shrink-0 border-r bg-background relative z-0">
                {verticals.map((vertical, verticalIndex) => {
                  const verticalProjects = projectsByVertical[vertical];
                  const rowHeight = Math.max(60, verticalProjects.length * 36 + 24);
                  
                  return (
                    <div 
                      key={vertical}
                      className="px-4 py-3 flex items-start"
                      style={{ minHeight: `${rowHeight}px` }}
                    >
                      <div className="text-sm font-medium text-foreground text-left">
                        {vertical}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Right Column - Timeline Grid */}
              <div 
                ref={bodyScrollRef}
                className="flex-1 overflow-x-auto scrollbar-thin relative z-0"
                onScroll={handleBodyScroll}
                onWheel={handleWheel}
              >
                <div className="min-w-max">
                  {verticals.map((vertical, verticalIndex) => {
                    const verticalProjects = projectsByVertical[vertical];
                    const rowHeight = Math.max(60, verticalProjects.length * 36 + 24);
                        
                    return (
                      <div 
                        key={vertical}
                        className="relative"
                        style={{ minHeight: `${rowHeight}px` }}
                      >
                        {/* Date Grid Background */}
                        <div className="flex absolute inset-0">
                          {timeSlots.map((slot) => {
                            const isToday = slot.toDateString() === new Date().toDateString();
                            return (
                              <div 
                                key={slot.toISOString()}
                                className={`w-32 flex-shrink-0 border-r border-border/40 last:border-r-0 transition-colors ${isToday ? 'bg-blue-100/40 dark:bg-blue-950/40' : ''}`}
                              />
                            );
                          })}
                        </div>

                        {/* Project Bars */}
                        <div className="relative p-3 space-y-2">
                          {verticalProjects.map((project, index) => {
                            const projectStart = new Date(project.start_date);
                            const projectEnd = new Date(project.due_date);
                            
                            // Calculate position
                            const startSlotIndex = timeSlots.findIndex(slot => {
                              const slotDate = new Date(slot);
                              slotDate.setHours(0, 0, 0, 0);
                              const startDate = new Date(projectStart);
                              startDate.setHours(0, 0, 0, 0);
                              return slotDate.getTime() === startDate.getTime();
                            });
                            
                            const endSlotIndex = timeSlots.findIndex(slot => {
                              const slotDate = new Date(slot);
                              slotDate.setHours(0, 0, 0, 0);
                              const endDate = new Date(projectEnd);
                              endDate.setHours(0, 0, 0, 0);
                              return slotDate.getTime() === endDate.getTime();
                            });
                            
                            // Handle projects that span outside visible range
                            const displayStartIndex = Math.max(0, startSlotIndex === -1 ? 0 : startSlotIndex);
                            const displayEndIndex = endSlotIndex === -1 ? timeSlots.length - 1 : endSlotIndex;
                            
                            const leftOffset = displayStartIndex * 128; // 128px = w-32
                            const width = (displayEndIndex - displayStartIndex + 1) * 128;
                            const bgColor = getStatusColor(project.status);
                            const urgencyColor = getDeadlineUrgencyColor(project.due_date, project.status);
                            const daysLeft = getDaysUntilDeadline(project.due_date);
                            const isDueTodayProject = daysLeft === 0 && project.status !== 'Done';
                            
                            return (
                              <div
                                key={project.id}
                                className={`absolute h-8 rounded cursor-pointer hover:opacity-80 flex items-center px-3 shadow-sm gap-2 ${isDueTodayProject && urgencyColor ? 'animate-border-pulse' : ''}`}
                                style={{
                                  backgroundColor: bgColor,
                                  color: getContrastColor(bgColor),
                                  left: `${leftOffset}px`,
                                  width: `${width}px`,
                                  top: `${12 + index * 36}px`,
                                  zIndex: 10 + index,
                                  border: urgencyColor ? `2px solid ${urgencyColor}` : '2px solid transparent',
                                  ...(isDueTodayProject && urgencyColor && {
                                    '--pulse-color': urgencyColor
                                  } as React.CSSProperties)
                                }}
                                onClick={() => onProjectClick(project)}
                                onMouseEnter={(e) => {
                                  const daysLeft = getDaysUntilDeadline(project.due_date);
                                  setTooltip({
                                    visible: true,
                                    x: e.clientX,
                                    y: e.clientY,
                                    projectName: project.project_name,
                                    startDate: projectStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                                    dueDate: projectEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                                    status: project.status,
                                    vertical: project.vertical || '',
                                    daysLeft: daysLeft
                                  });
                                }}
                                onMouseMove={(e) => {
                                  if (tooltip) {
                                    setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                                  }
                                }}
                                onMouseLeave={() => setTooltip(null)}
                              >
                                {urgencyColor && (
                                  <div 
                                    className="w-2 h-2 rounded-full flex-shrink-0 ring-1 ring-white/30"
                                    style={{ backgroundColor: urgencyColor }}
                                    title={`Urgency: ${getDaysUntilDeadline(project.due_date)} days left`}
                                  />
                                )}
                                {(() => {
                                  const badgeText = getDaysLeftBadgeText(project.due_date, project.status);
                                  return badgeText ? (
                                    <div 
                                      className="px-1.5 py-0.5 rounded text-xs font-medium flex-shrink-0"
                                      style={{ 
                                        backgroundColor: urgencyColor ? `${urgencyColor}30` : 'rgba(255,255,255,0.2)',
                                        color: getDarkerUrgencyColor(urgencyColor),
                                        border: urgencyColor ? `1px solid ${urgencyColor}60` : 'none'
                                      }}
                                    >
                                      {badgeText}
                                    </div>
                                  ) : null;
                                })()}
                                <div className="truncate text-sm font-medium flex-1">
                                  {project.project_name} - {projectEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </div>
                                {(() => {
                                  const daysLeft = getDaysUntilDeadline(project.due_date);
                                  // Show siren emoji if H-1 (1 day left) or due today (0 days left)
                                  if (daysLeft !== null && daysLeft >= 0 && daysLeft <= 1 && project.status !== 'Done') {
                                    return (
                                      <span className="text-base flex-shrink-0 animate-pulse" title={daysLeft === 0 ? 'Due Today!' : 'Due Tomorrow!'}>
                                        🚨
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Calendar Grid */}
          <div 
            ref={containerRef}
            className="md:hidden bg-card border rounded-lg overflow-hidden touch-manipulation select-none cursor-grab"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Days Header */}
            <div className="grid grid-cols-7 bg-muted border-b relative">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-50/20 dark:via-blue-950/20 to-transparent opacity-30 animate-pulse pointer-events-none"></div>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="px-2 py-3 text-center font-medium text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-border last:border-r-0">
                  <span className="text-xs">{day}</span>
                </div>
              ))}
            </div>
            
            {/* Calendar Body */}
            <div className="relative">
              {/* Date Grid */}
              <div className="grid grid-cols-7">
                {timeSlots.map((slot, index) => {
                  const isToday = slot.toDateString() === new Date().toDateString();
                  
                  return (
                    <div 
                      key={slot.toISOString()} 
                      className="h-32 px-2 py-2 border-r border-b last:border-r-0 bg-card relative"
                    >
                      <div className={`text-sm ${
                        isToday 
                          ? 'bg-blue-600 dark:bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center font-semibold' 
                          : 'text-gray-900 dark:text-white font-medium'
                      }`}>
                        {slot.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Project Bars Overlay */}
              <div className="absolute inset-0 pointer-events-none">
                {periodProjects.map((project, projectIndex) => {
                  const projectStart = new Date(project.start_date);
                  const projectEnd = new Date(project.due_date);
                  
                  // Normalize dates
                  const normalizeDate = (date: Date) => {
                    const normalized = new Date(date);
                    normalized.setHours(0, 0, 0, 0);
                    return normalized;
                  };
                  
                  const normalizedStart = normalizeDate(projectStart);
                  const normalizedEnd = normalizeDate(projectEnd);
                  
                  // Calculate which row and columns this project spans
                  const startSlotIndex = timeSlots.findIndex(slot => {
                    const slotDate = normalizeDate(slot);
                    return slotDate.getTime() === normalizedStart.getTime();
                  });
                  
                  const endSlotIndex = timeSlots.findIndex(slot => {
                    const slotDate = normalizeDate(slot);
                    return slotDate.getTime() === normalizedEnd.getTime();
                  });
                  
                  if (startSlotIndex === -1 || endSlotIndex === -1) return null;
                  
                  const startRow = Math.floor(startSlotIndex / 7);
                  const endRow = Math.floor(endSlotIndex / 7);
                  const startCol = startSlotIndex % 7;
                  const endCol = endSlotIndex % 7;
                  
                  const cellHeight = 128; // h-32 = 128px
                  const projectBarHeight = 24;
                  const topMargin = 28; // Space for date number
                  
                  // Calculate vertical stacking for multiple projects on same date
                  const projectsOnSameStartDate = periodProjects.filter((p, idx) => {
                    if (idx >= projectIndex) return false;
                    const pStart = normalizeDate(new Date(p.start_date));
                    return pStart.getTime() === normalizedStart.getTime();
                  });
                  const stackOffset = projectsOnSameStartDate.length * (projectBarHeight + 2);
                  
                  const bgColor = getStatusColor(project.status);
                  const urgencyColor = getDeadlineUrgencyColor(project.due_date, project.status);
                  const daysLeft = getDaysUntilDeadline(project.due_date);
                  const isDueTodayProject = daysLeft === 0 && project.status !== 'Done';
                  
                  // Handle multi-row projects
                  if (startRow === endRow) {
                    // Single row project
                    const leftPercent = (startCol / 7) * 100;
                    const widthPercent = ((endCol - startCol + 1) / 7) * 100;
                    const topOffset = startRow * cellHeight + topMargin + stackOffset;
                    
                    return (
                      <div
                        key={project.id}
                        className={`absolute pointer-events-auto cursor-pointer shadow-sm hover:opacity-80 ${isDueTodayProject && urgencyColor ? 'animate-border-pulse' : ''}`}
                        style={{
                          backgroundColor: bgColor,
                          color: getTextColor(bgColor),
                          top: `${topOffset}px`,
                          left: `calc(${leftPercent}% + 4px)`,
                          width: `calc(${widthPercent}% - 8px)`,
                          height: `${projectBarHeight}px`,
                          zIndex: 10 + projectIndex,
                          borderRadius: '6px',
                          fontSize: '10px',
                          fontWeight: '500',
                          padding: '2px 4px',
                          display: 'flex',
                          alignItems: 'center',
                          overflow: 'hidden',
                          boxSizing: 'border-box',
                          border: urgencyColor ? `2px solid ${urgencyColor}` : 'none',
                          ...(isDueTodayProject && urgencyColor && {
                            '--pulse-color': urgencyColor
                          } as React.CSSProperties)
                        }}
                        onClick={() => onProjectClick(project)}
                      >
                        <span className="truncate">
                          {project.project_name} - {projectEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  } else {
                    // Multi-row project - create segments for each row
                    const segments = [];
                    for (let row = startRow; row <= endRow; row++) {
                      const isFirstRow = row === startRow;
                      const isLastRow = row === endRow;
                      
                      const segmentStartCol = isFirstRow ? startCol : 0;
                      const segmentEndCol = isLastRow ? endCol : 6;
                      
                      const leftPercent = (segmentStartCol / 7) * 100;
                      const widthPercent = ((segmentEndCol - segmentStartCol + 1) / 7) * 100;
                      const topOffset = row * cellHeight + topMargin + (isFirstRow ? stackOffset : 0);
                      
                      segments.push(
                        <div
                          key={`${project.id}-row-${row}`}
                          className={`absolute pointer-events-auto cursor-pointer shadow-sm hover:opacity-80 ${isDueTodayProject && urgencyColor ? 'animate-border-pulse' : ''}`}
                          style={{
                            backgroundColor: bgColor,
                            color: getTextColor(bgColor),
                            top: `${topOffset}px`,
                            left: `calc(${leftPercent}% + 4px)`,
                            width: `calc(${widthPercent}% - 8px)`,
                            height: `${projectBarHeight}px`,
                            zIndex: 10 + projectIndex,
                            borderRadius: '6px',
                            fontSize: '10px',
                            fontWeight: '500',
                            padding: '2px 4px',
                            display: 'flex',
                            alignItems: 'center',
                            overflow: 'hidden',
                            boxSizing: 'border-box',
                            border: urgencyColor ? `2px solid ${urgencyColor}` : 'none',
                            ...(isDueTodayProject && urgencyColor && {
                              '--pulse-color': urgencyColor
                            } as React.CSSProperties)
                          }}
                          onClick={() => onProjectClick(project)}
                        >
                          <span className="truncate">
                            {isFirstRow ? `${project.project_name} - ${projectEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                          </span>
                        </div>
                      );
                    }
                    return segments;
                  }
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Calendar Grid - Month View */}
      {timeView === 'month' && (
        <div 
          ref={containerRef}
          className="bg-card border rounded-lg overflow-hidden"
        >

          {/* Days Header */}
          <div className="grid grid-cols-7 bg-muted border-b">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="px-2 sm:px-4 py-2 sm:py-3 text-center text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 border-r border-gray-200 dark:border-border last:border-r-0">
                <span className="hidden sm:inline">{day}</span>
                <span className="sm:hidden">{day.slice(0, 1)}</span>
              </div>
            ))}
          </div>
          
          {/* Calendar Body */}
          <div className="relative">
            {/* Render calendar with adaptive cell heights */}
            {(() => {
              const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
              const projectBarHeight = isMobile ? 14 : 18;
              const barSpacing = isMobile ? 16 : 20;
              const dateNumberHeight = isMobile ? 28 : 36; // Height reserved for date number
              const readabilitySpace = isMobile ? 20 : 30; // Space below date number for readability
              const bottomMargin = isMobile ? 8 : 12; // Bottom margin for project bars
              const minCellHeight = isMobile ? 80 : 100; // Minimum cell height
              
              // Helper to normalize dates
              const normalizeDate = (date: Date) => {
                const normalized = new Date(date);
                normalized.setHours(0, 0, 0, 0);
                return normalized;
              };
              
              // Calculate number of projects per week row
              const weeksCount = Math.ceil(timeSlots.length / 7);
              const projectsPerWeek = new Array(weeksCount).fill(0);
              
              // Count projects in each week
              periodProjects.forEach(project => {
                if (!project.start_date || !project.due_date) return;
                
                const projectStart = normalizeDate(new Date(project.start_date));
                const projectEnd = normalizeDate(new Date(project.due_date));
                
                for (let week = 0; week < weeksCount; week++) {
                  const weekStart = week * 7;
                  const weekEnd = Math.min(weekStart + 6, timeSlots.length - 1);
                  
                  const weekStartDate = normalizeDate(timeSlots[weekStart]);
                  const weekEndDate = normalizeDate(timeSlots[weekEnd]);
                  
                  if (projectStart <= weekEndDate && projectEnd >= weekStartDate) {
                    projectsPerWeek[week]++;
                  }
                }
              });
              
              // Calculate adaptive height for each week
              // Formula: dateNumberHeight + readabilitySpace + (projectCount * barSpacing) + bottomMargin
              const weekHeights = projectsPerWeek.map(count => {
                if (count === 0) return minCellHeight;
                const requiredHeight = dateNumberHeight + readabilitySpace + (count * barSpacing) + bottomMargin;
                return Math.max(minCellHeight, requiredHeight);
              });
              
              return (
                <>
                  {/* Date Grid with adaptive heights */}
                  <div className="grid grid-cols-7">
                    {timeSlots.map((slot, index) => {
                      const isToday = slot.toDateString() === new Date().toDateString();
                      const isCurrentMonth = slot.getMonth() === currentDate.getMonth();
                      const weekIndex = Math.floor(index / 7);
                      const cellHeight = weekHeights[weekIndex];
                      
                      return (
                        <div 
                          key={slot.toISOString()} 
                          className="px-2 sm:px-3 py-2 sm:py-3 border-r border-b last:border-r-0 bg-card relative"
                          style={{ height: `${cellHeight}px` }}
                        >
                          <div className={`text-xs sm:text-sm ${
                            isToday 
                              ? 'bg-blue-600 dark:bg-blue-500 text-white w-5 h-5 sm:w-7 sm:h-7 rounded-full flex items-center justify-center font-semibold text-xs' 
                              : isCurrentMonth 
                                ? 'text-gray-900 dark:text-white font-medium' 
                                : 'text-gray-400 dark:text-gray-600'
                          }`}>
                            {slot.getDate()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
            
                  {/* Project Bars Overlay */}
                  <div className="absolute inset-0 pointer-events-none">
              {periodProjects.map((project, projectIndex) => {
                const projectStart = new Date(project.start_date);
                const projectEnd = new Date(project.due_date);
                
                const normalizedStart = normalizeDate(projectStart);
                const normalizedEnd = normalizeDate(projectEnd);
                const calendarStart = normalizeDate(timeSlots[0]);
                
                // Calculate which rows and columns this project spans
                const segments: Array<{
                  row: number;
                  startCol: number;
                  endCol: number;
                  isStart: boolean;
                  isEnd: boolean;
                }> = [];
                
                for (let week = 0; week < Math.ceil(timeSlots.length / 7); week++) {
                  const weekStart = week * 7;
                  const weekEnd = Math.min(weekStart + 6, timeSlots.length - 1);
                  
                  const weekStartDate = normalizeDate(timeSlots[weekStart]);
                  const weekEndDate = normalizeDate(timeSlots[weekEnd]);
                  
                  if (normalizedStart <= weekEndDate && normalizedEnd >= weekStartDate) {
                    let startCol = 0;
                    let endCol = 6;
                    
                    // Find exact start and end columns
                    for (let day = 0; day < 7; day++) {
                      const dayIndex = weekStart + day;
                      if (dayIndex >= timeSlots.length) break;
                      
                      const dayDate = normalizeDate(timeSlots[dayIndex]);
                      
                      if (dayDate.getTime() === normalizedStart.getTime()) {
                        startCol = day;
                      }
                      if (dayDate.getTime() === normalizedEnd.getTime()) {
                        endCol = day;
                      }
                      
                      // For spans that start before or end after this week
                      if (normalizedStart < weekStartDate && dayDate.getTime() === weekStartDate.getTime()) {
                        startCol = day;
                      }
                      if (normalizedEnd > weekEndDate && dayDate.getTime() === weekEndDate.getTime()) {
                        endCol = day;
                      }
                    }
                    
                    const isStart = normalizedStart >= weekStartDate;
                    const isEnd = normalizedEnd <= weekEndDate;
                    
                    segments.push({ row: week, startCol, endCol, isStart, isEnd });
                  }
                }
                
                return segments.map(({ row, startCol, endCol, isStart, isEnd }, segmentIndex) => {
                  // Calculate proper stacking based on projects that overlap in this cell
                  // Count how many projects appear BEFORE this one in the same week row
                  const projectsInSameWeek = periodProjects.filter((p, idx) => {
                    if (idx >= projectIndex) return false;
                    if (!p.start_date || !p.due_date) return false;
                    
                    const pStart = new Date(p.start_date);
                    const pEnd = new Date(p.due_date);
                    pStart.setHours(0, 0, 0, 0);
                    pEnd.setHours(0, 0, 0, 0);
                    
                    const weekStartDate = normalizeDate(timeSlots[row * 7]);
                    const weekEndDate = normalizeDate(timeSlots[Math.min(row * 7 + 6, timeSlots.length - 1)]);
                    
                    // Check if this project overlaps with the current week
                    return pStart <= weekEndDate && pEnd >= weekStartDate;
                  });
                  
                  // Calculate position from bottom of cell using adaptive heights
                  // Calculate bottom offset: distance from absolute bottom of entire calendar
                  let cumulativeHeightFromBottom = bottomMargin;
                  
                  // Add heights of all weeks below current row
                  for (let i = weeksCount - 1; i > row; i--) {
                    cumulativeHeightFromBottom += weekHeights[i];
                  }
                  
                  const stackOffset = projectsInSameWeek.length * barSpacing;
                  const bottomOffset = cumulativeHeightFromBottom + stackOffset;
                  
                  const leftPercent = (startCol / 7) * 100;
                  const widthPercent = ((endCol - startCol + 1) / 7) * 100;
                  const bgColor = getStatusColor(project.status);
                  const urgencyColor = getDeadlineUrgencyColor(project.due_date, project.status);
                  const daysLeft = getDaysUntilDeadline(project.due_date);
                  const isDueTodayProject = daysLeft === 0 && project.status !== 'Done';
                  
                  return (
                    <div
                      key={`${project.id}-${segmentIndex}`}
                      className={`absolute pointer-events-auto cursor-pointer font-medium ${isDueTodayProject && urgencyColor ? 'animate-border-pulse' : ''}`}
                      style={{
                        backgroundColor: bgColor,
                        color: getTextColor(bgColor),
                        bottom: `${bottomOffset}px`,
                        left: `calc(${leftPercent}% + ${isMobile ? 4 : 8}px)`,
                        width: `calc(${widthPercent}% - ${isMobile ? 8 : 16}px)`,
                        height: `${projectBarHeight}px`,
                        zIndex: 10 + projectIndex,
                        borderRadius: isStart && isEnd ? '4px' : 
                                     isStart ? '4px 0 0 4px' : 
                                     isEnd ? '0 4px 4px 0' : '0',
                        fontSize: isMobile ? '9px' : '11px',
                        padding: isMobile ? '1px 4px' : '2px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: isMobile ? '2px' : '6px',
                        overflow: 'hidden',
                        boxSizing: 'border-box',
                        border: urgencyColor ? `2px solid ${urgencyColor}` : 'none',
                        ...(isDueTodayProject && urgencyColor && {
                          '--pulse-color': urgencyColor
                        } as React.CSSProperties)
                      }}
                      onClick={() => onProjectClick(project)}
                      onMouseEnter={(e) => {
                        if (window.innerWidth >= 640) {
                          setTooltip({
                            visible: true,
                            x: e.clientX,
                            y: e.clientY,
                            projectName: project.project_name,
                            startDate: projectStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                            dueDate: projectEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                            status: project.status,
                            vertical: project.vertical || ''
                          });
                        }
                      }}
                      onMouseMove={(e) => {
                        if (window.innerWidth >= 640 && tooltip) {
                          setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
                        }
                      }}
                      onMouseLeave={() => setTooltip(null)}
                    >
                      <span className="truncate">
                        {isStart ? `${project.project_name} - ${projectEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                      </span>
                    </div>
                  );
                });
              })}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Tooltip */}
      {tooltip && tooltip.visible && (
        <div
          className="fixed pointer-events-none z-[9999] bg-gray-900 dark:bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg dark:shadow-[0_8px_16px_rgba(0,0,0,0.6)] text-sm border border-gray-700 dark:border-gray-600"
          style={{
            left: `${tooltip.x + 12}px`,
            top: `${tooltip.y + 12}px`,
            maxWidth: '280px'
          }}
        >
          {/* Header with Vertical badge and Days Left badge */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              {tooltip.vertical && (
                <div 
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: getVerticalColor(tooltip.vertical),
                    color: getContrastColor(getVerticalColor(tooltip.vertical))
                  }}
                >
                  {tooltip.vertical}
                </div>
              )}
            </div>
            {(() => {
              const daysLeft = tooltip.daysLeft;
              if (daysLeft === null || tooltip.status === 'Done') return null;
              
              // Determine badge styling based on urgency
              let badgeColor = '#3B82F6'; // Blue for > 14 days
              let badgeText = '';
              
              if (daysLeft < 0) {
                badgeColor = '#DC2626'; // Dark red for overdue
                badgeText = `${Math.abs(daysLeft)}d overdue`;
              } else if (daysLeft === 0) {
                badgeColor = '#EF4444'; // Red for due today
                badgeText = 'Due Today';
              } else if (daysLeft === 1) {
                badgeColor = '#F97316'; // Orange for tomorrow (H-1)
                badgeText = '1d left';
              } else if (daysLeft <= 3) {
                badgeColor = '#EF4444'; // Red for <= 3 days
                badgeText = `${daysLeft}d left`;
              } else if (daysLeft <= 7) {
                badgeColor = '#EAB308'; // Yellow for 4-7 days
                badgeText = `${daysLeft}d left`;
              } else if (daysLeft <= 14) {
                badgeColor = '#3B82F6'; // Blue for 8-14 days
                badgeText = `${daysLeft}d left`;
              }
              
              if (!badgeText) return null;
              
              return (
                <div 
                  className="inline-block px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: badgeColor,
                    color: '#FFFFFF'
                  }}
                >
                  {badgeText}
                </div>
              );
            })()}
          </div>
          
          <div className="font-semibold mb-1">{tooltip.projectName}</div>
          <div className="text-xs text-gray-300 dark:text-gray-400 space-y-0.5">
            <div>Start: {tooltip.startDate}</div>
            <div>Due: {tooltip.dueDate}</div>
            <div className="flex items-center gap-2 mt-1">
              <span>Status:</span>
              <span className="px-2 py-0.5 rounded text-xs" style={{
                backgroundColor: getStatusColor(tooltip.status),
                color: getTextColor(getStatusColor(tooltip.status))
              }}>
                {tooltip.status}
              </span>
            </div>
          </div>
        </div>
      )}
      </div>
      {/* End Desktop wrapper */}
    </div>
  );
}