/**
 * Utility functions for date filtering in Statistics
 */

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

/**
 * Get the start and end date for a given year
 */
export function getYearRange(year: number): DateRange {
  return {
    start: new Date(year, 0, 1),
    end: new Date(year, 11, 31, 23, 59, 59),
    label: `${year}`
  };
}

/**
 * Get the start and end date for a given half (H1 or H2)
 */
export function getHalfRange(year: number, half: 'H1' | 'H2'): DateRange {
  if (half === 'H1') {
    return {
      start: new Date(year, 0, 1),
      end: new Date(year, 5, 30, 23, 59, 59),
      label: `H1 ${year}`
    };
  } else {
    return {
      start: new Date(year, 6, 1),
      end: new Date(year, 11, 31, 23, 59, 59),
      label: `H2 ${year}`
    };
  }
}

/**
 * Get the start and end date for a given quarter
 */
export function getQuarterRange(year: number, quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4'): DateRange {
  const quarterMonths: Record<string, [number, number]> = {
    Q1: [0, 2],
    Q2: [3, 5],
    Q3: [6, 8],
    Q4: [9, 11],
  };
  
  const [startMonth, endMonth] = quarterMonths[quarter];
  
  return {
    start: new Date(year, startMonth, 1),
    end: new Date(year, endMonth + 1, 0, 23, 59, 59), // Last day of month
    label: `${quarter} ${year}`
  };
}

/**
 * Get the start and end date for a given month
 */
export function getMonthRange(year: number, month: number): DateRange {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  return {
    start: new Date(year, month, 1),
    end: new Date(year, month + 1, 0, 23, 59, 59), // Last day of month
    label: `${monthNames[month]} ${year}`
  };
}

/**
 * Get the start and end date for a given week number
 */
export function getWeekRange(year: number, weekNumber: number): DateRange {
  // Calculate week start (assuming week starts on Monday)
  const firstDayOfYear = new Date(year, 0, 1);
  const daysToMonday = (8 - firstDayOfYear.getDay()) % 7;
  const firstMonday = new Date(year, 0, 1 + daysToMonday);
  
  const start = new Date(firstMonday);
  start.setDate(start.getDate() + (weekNumber - 1) * 7);
  
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59);
  
  return {
    start,
    end,
    label: `Week ${weekNumber}, ${year}`
  };
}

/**
 * Get the number of weeks in a given year
 */
export function getWeeksInYear(year: number): number {
  const lastDay = new Date(year, 11, 31);
  const firstDay = new Date(year, 0, 1);
  const days = Math.ceil((lastDay.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24));
  return Math.ceil(days / 7);
}

/**
 * Check if a date falls within a date range
 */
export function isDateInRange(date: Date | string | null | undefined, range: DateRange): boolean {
  if (!date) return false;
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj >= range.start && dateObj <= range.end;
}

/**
 * Format a date range for display
 */
export function formatDateRange(range: DateRange): string {
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  };
  
  return `${range.start.toLocaleDateString('en-US', options)} - ${range.end.toLocaleDateString('en-US', options)}`;
}
