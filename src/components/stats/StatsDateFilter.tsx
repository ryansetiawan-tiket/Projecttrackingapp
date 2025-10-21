import { useState, useEffect, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Project } from '../../types/project';

export type PeriodType = 'all' | 'year' | 'half' | 'quarter' | 'month' | 'week';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

interface AvailableMonth {
  year: number;
  month: number; // 0-11
  label: string;
  count: number;
}

interface AvailableWeek {
  weekNum: number;
  start: Date;
  end: Date;
  label: string;
  count: number;
}

interface StatsDateFilterProps {
  projects: Project[];
  onDateRangeChange: (range: DateRange | null) => void;
}

export function StatsDateFilter({ projects, onDateRangeChange }: StatsDateFilterProps) {
  const [periodType, setPeriodType] = useState<PeriodType>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedHalf, setSelectedHalf] = useState<'H1' | 'H2'>('H1');
  const [selectedQuarter, setSelectedQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>(''); // year-month format
  const [selectedWeekMonth, setSelectedWeekMonth] = useState<string>(''); // year-month for week selector
  const [selectedWeekNum, setSelectedWeekNum] = useState<number>(1);

  // Extract available years from projects
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    projects.forEach(project => {
      const dates = [project.start_date, project.due_date, project.completed_at].filter(Boolean);
      dates.forEach(date => {
        if (date) years.add(new Date(date).getFullYear());
      });
    });
    
    if (years.size === 0) years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [projects]);

  // Extract available halves (H1/H2) per year
  const availableHalves = useMemo(() => {
    const halves = new Map<string, number>(); // key: "year-half", value: count
    
    projects.forEach(project => {
      const date = project.start_date || project.completed_at;
      if (!date) return;
      
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const half = month < 6 ? 'H1' : 'H2';
      const key = `${year}-${half}`;
      
      halves.set(key, (halves.get(key) || 0) + 1);
    });
    
    return halves;
  }, [projects]);

  // Extract available quarters per year
  const availableQuarters = useMemo(() => {
    const quarters = new Map<string, number>();
    
    projects.forEach(project => {
      const date = project.start_date || project.completed_at;
      if (!date) return;
      
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const quarter = Math.floor(month / 3) + 1;
      const key = `${year}-Q${quarter}`;
      
      quarters.set(key, (quarters.get(key) || 0) + 1);
    });
    
    return quarters;
  }, [projects]);

  // Extract available months with project counts
  const availableMonths = useMemo((): AvailableMonth[] => {
    const monthsMap = new Map<string, number>();
    
    projects.forEach(project => {
      const date = project.start_date || project.completed_at;
      if (!date) return;
      
      const d = new Date(date);
      const year = d.getFullYear();
      const month = d.getMonth();
      const key = `${year}-${month}`;
      
      monthsMap.set(key, (monthsMap.get(key) || 0) + 1);
    });
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    return Array.from(monthsMap.entries())
      .map(([key, count]) => {
        const [year, month] = key.split('-').map(Number);
        return {
          year,
          month,
          label: `${monthNames[month]} ${year}`,
          count
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }, [projects]);

  // Extract available weeks for selected month
  const availableWeeks = useMemo((): AvailableWeek[] => {
    if (!selectedWeekMonth) return [];
    
    const [year, month] = selectedWeekMonth.split('-').map(Number);
    
    // Get all projects in this month
    const monthProjects = projects.filter(project => {
      const date = project.start_date || project.completed_at;
      if (!date) return false;
      
      const d = new Date(date);
      return d.getFullYear() === year && d.getMonth() === month;
    });
    
    if (monthProjects.length === 0) return [];
    
    // Group projects by week
    const weeksMap = new Map<number, { start: Date; end: Date; count: number }>();
    
    monthProjects.forEach(project => {
      const date = project.start_date || project.completed_at;
      if (!date) return;
      
      const d = new Date(date);
      const weekNum = getWeekOfMonth(d);
      
      if (!weeksMap.has(weekNum)) {
        const { start, end } = getWeekRange(year, month, weekNum);
        weeksMap.set(weekNum, { start, end, count: 0 });
      }
      
      const week = weeksMap.get(weekNum)!;
      week.count++;
    });
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    
    return Array.from(weeksMap.entries())
      .map(([weekNum, { start, end, count }]) => ({
        weekNum,
        start,
        end,
        label: `Week ${weekNum} - ${monthNames[month]} ${year}`,
        count
      }))
      .sort((a, b) => a.weekNum - b.weekNum);
  }, [projects, selectedWeekMonth]);

  // Get available halves for selected year
  const yearHalves = useMemo(() => {
    return ['H1', 'H2'].filter(half => 
      availableHalves.has(`${selectedYear}-${half}`)
    );
  }, [selectedYear, availableHalves]);

  // Get available quarters for selected year
  const yearQuarters = useMemo(() => {
    return ['Q1', 'Q2', 'Q3', 'Q4'].filter(quarter => 
      availableQuarters.has(`${selectedYear}-${quarter}`)
    );
  }, [selectedYear, availableQuarters]);

  // Get available months for week selection
  const monthsForWeekSelection = useMemo(() => {
    return availableMonths.filter(m => m.year === selectedYear);
  }, [availableMonths, selectedYear]);

  // Generate date range based on selections
  useEffect(() => {
    if (periodType === 'all') {
      onDateRangeChange(null);
      return;
    }

    let start: Date;
    let end: Date;
    let label: string;

    try {
      switch (periodType) {
        case 'year':
          start = new Date(selectedYear, 0, 1);
          end = new Date(selectedYear, 11, 31, 23, 59, 59);
          label = `${selectedYear}`;
          break;

        case 'half':
          if (selectedHalf === 'H1') {
            start = new Date(selectedYear, 0, 1);
            end = new Date(selectedYear, 5, 30, 23, 59, 59);
            label = `H1 ${selectedYear}`;
          } else {
            start = new Date(selectedYear, 6, 1);
            end = new Date(selectedYear, 11, 31, 23, 59, 59);
            label = `H2 ${selectedYear}`;
          }
          break;

        case 'quarter':
          const quarterMonths = {
            Q1: [0, 2],
            Q2: [3, 5],
            Q3: [6, 8],
            Q4: [9, 11],
          };
          const [startMonth, endMonth] = quarterMonths[selectedQuarter];
          start = new Date(selectedYear, startMonth, 1);
          end = new Date(selectedYear, endMonth + 1, 0, 23, 59, 59);
          label = `${selectedQuarter} ${selectedYear}`;
          break;

        case 'month':
          if (!selectedMonthKey) return;
          const [mYear, mMonth] = selectedMonthKey.split('-').map(Number);
          start = new Date(mYear, mMonth, 1);
          end = new Date(mYear, mMonth + 1, 0, 23, 59, 59);
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                             'July', 'August', 'September', 'October', 'November', 'December'];
          label = `${monthNames[mMonth]} ${mYear}`;
          break;

        case 'week':
          if (!selectedWeekMonth || !selectedWeekNum) return;
          const selectedWeek = availableWeeks.find(w => w.weekNum === selectedWeekNum);
          if (!selectedWeek) return;
          
          start = selectedWeek.start;
          end = selectedWeek.end;
          label = selectedWeek.label;
          break;

        default:
          return;
      }

      onDateRangeChange({ start, end, label });
    } catch (error) {
      console.error('Error calculating date range:', error);
      onDateRangeChange(null);
    }
  }, [periodType, selectedYear, selectedHalf, selectedQuarter, selectedMonthKey, selectedWeekMonth, selectedWeekNum, availableWeeks, onDateRangeChange]);

  // Reset selections when period type changes
  useEffect(() => {
    if (periodType === 'month' && availableMonths.length > 0) {
      setSelectedMonthKey(`${availableMonths[0].year}-${availableMonths[0].month}`);
    }
    if (periodType === 'week') {
      if (monthsForWeekSelection.length > 0) {
        const firstMonth = monthsForWeekSelection[0];
        setSelectedWeekMonth(`${firstMonth.year}-${firstMonth.month}`);
      }
    }
    if (periodType === 'half' && yearHalves.length > 0) {
      setSelectedHalf(yearHalves[0] as 'H1' | 'H2');
    }
    if (periodType === 'quarter' && yearQuarters.length > 0) {
      setSelectedQuarter(yearQuarters[0] as 'Q1' | 'Q2' | 'Q3' | 'Q4');
    }
  }, [periodType, availableMonths, monthsForWeekSelection, yearHalves, yearQuarters]);

  // Set first available week when month changes
  useEffect(() => {
    if (availableWeeks.length > 0) {
      setSelectedWeekNum(availableWeeks[0].weekNum);
    }
  }, [availableWeeks]);

  return (
    <div className="space-y-3">
      {/* Period Type Selector */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Time Period</Label>
          <Select value={periodType} onValueChange={(value) => setPeriodType(value as PeriodType)}>
            <SelectTrigger className="w-full">
              <div className="flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="year">Year</SelectItem>
              <SelectItem value="half">Half (H1/H2)</SelectItem>
              <SelectItem value="quarter">Quarter</SelectItem>
              <SelectItem value="month">Month</SelectItem>
              <SelectItem value="week">Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Specific Period Selector */}
        {periodType !== 'all' && (
          <div className="flex-1">
            <Label className="text-xs text-muted-foreground mb-1.5 block">Select Period</Label>
            
            {/* Year */}
            {periodType === 'year' && (
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Half */}
            {periodType === 'half' && (
              <div className="flex gap-2">
                <Select value={selectedHalf} onValueChange={(value) => setSelectedHalf(value as 'H1' | 'H2')}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearHalves.map(half => (
                      <SelectItem key={half} value={half}>{half}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Quarter */}
            {periodType === 'quarter' && (
              <div className="flex gap-2">
                <Select value={selectedQuarter} onValueChange={(value) => setSelectedQuarter(value as 'Q1' | 'Q2' | 'Q3' | 'Q4')}>
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearQuarters.map(quarter => (
                      <SelectItem key={quarter} value={quarter}>{quarter}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Month */}
            {periodType === 'month' && (
              <Select value={selectedMonthKey} onValueChange={setSelectedMonthKey}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {availableMonths.map(month => (
                    <SelectItem key={`${month.year}-${month.month}`} value={`${month.year}-${month.month}`}>
                      {month.label} <span className="text-xs text-muted-foreground ml-1">({month.count})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {/* Week - Two step selection */}
            {periodType === 'week' && (
              <div className="space-y-2">
                {/* Month selector for week */}
                <Select value={selectedWeekMonth} onValueChange={setSelectedWeekMonth}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select month" />
                  </SelectTrigger>
                  <SelectContent>
                    {monthsForWeekSelection.map(month => (
                      <SelectItem key={`${month.year}-${month.month}`} value={`${month.year}-${month.month}`}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {/* Week selector within month */}
                {selectedWeekMonth && availableWeeks.length > 0 && (
                  <Select value={selectedWeekNum.toString()} onValueChange={(value) => setSelectedWeekNum(parseInt(value))}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWeeks.map(week => (
                        <SelectItem key={week.weekNum} value={week.weekNum.toString()}>
                          {week.label} <span className="text-xs text-muted-foreground ml-1">({week.count})</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Helper functions
function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const firstDayOfWeek = firstDay.getDay(); // 0 = Sunday
  
  // Adjust for weeks starting on Monday
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  const weekNum = Math.ceil((dayOfMonth + offset) / 7);
  
  return weekNum;
}

function getWeekRange(year: number, month: number, weekNum: number): { start: Date; end: Date } {
  const firstDay = new Date(year, month, 1);
  const firstDayOfWeek = firstDay.getDay();
  const offset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  // Calculate start of the week
  const startDay = (weekNum - 1) * 7 - offset + 1;
  const start = new Date(year, month, startDay);
  
  // Ensure start is not before month start
  if (start < firstDay) {
    start.setTime(firstDay.getTime());
  }
  
  // Calculate end of the week
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  
  // Ensure end is not after month end
  const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);
  if (end > lastDay) {
    end.setTime(lastDay.getTime());
  }
  
  return { start, end };
}
