import { useMemo } from 'react';
import { Project } from '../../types/project';
import { StatsCard } from './StatsCard';
import { Calendar, Clock, AlertCircle, TrendingUp, CalendarCheck, CalendarDays } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from '../ui/badge';
import { getQuarterFromDate, getQuarterString } from '../../utils/statsCalculations';

interface StatsTimelineProps {
  projects: Project[];
}

interface QuarterData {
  quarter: string;
  starting: number;
  ending: number;
}

interface MonthData {
  month: string;
  projects: number;
}

interface DurationData {
  range: string;
  count: number;
}

interface UpcomingDeadline {
  id: string;
  project_name: string;
  due_date: string;
  status: string;
  daysUntil: number;
  vertical: string;
}

export function StatsTimeline({ projects }: StatsTimelineProps) {
  // Calculate timeline statistics
  const timelineStats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let overdueCount = 0;
    let upcomingWeek = 0;
    let upcomingMonth = 0;
    let totalDuration = 0;
    let projectsWithDates = 0;

    projects.forEach(project => {
      if (!project.due_date) return;

      const dueDate = new Date(project.due_date);
      const isCompleted = project.status === 'Done' || project.status === 'Completed';
      
      // Only count as overdue if not completed
      if (dueDate < today && !isCompleted) {
        overdueCount++;
      }

      // Upcoming deadlines
      const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntil >= 0 && daysUntil <= 7 && !isCompleted) {
        upcomingWeek++;
      }
      if (daysUntil >= 0 && daysUntil <= 30 && !isCompleted) {
        upcomingMonth++;
      }

      // Calculate duration
      if (project.start_date && project.due_date) {
        const startDate = new Date(project.start_date);
        const duration = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        if (duration > 0) {
          totalDuration += duration;
          projectsWithDates++;
        }
      }
    });

    const avgDuration = projectsWithDates > 0 ? Math.round(totalDuration / projectsWithDates) : 0;

    return {
      overdueCount,
      upcomingWeek,
      upcomingMonth,
      avgDuration,
      totalProjects: projects.length
    };
  }, [projects]);

  // Projects by quarter
  const projectsByQuarter = useMemo<QuarterData[]>(() => {
    const quarterMap = new Map<string, { starting: number; ending: number }>();

    projects.forEach(project => {
      if (project.start_date) {
        const { quarter, year } = getQuarterFromDate(project.start_date);
        const quarterLabel = getQuarterString(quarter, year);
        if (!quarterMap.has(quarterLabel)) {
          quarterMap.set(quarterLabel, { starting: 0, ending: 0 });
        }
        quarterMap.get(quarterLabel)!.starting++;
      }

      if (project.due_date) {
        const { quarter, year } = getQuarterFromDate(project.due_date);
        const quarterLabel = getQuarterString(quarter, year);
        if (!quarterMap.has(quarterLabel)) {
          quarterMap.set(quarterLabel, { starting: 0, ending: 0 });
        }
        quarterMap.get(quarterLabel)!.ending++;
      }
    });

    // Sort quarters chronologically
    return Array.from(quarterMap.entries())
      .map(([quarter, data]) => ({
        quarter,
        starting: data.starting,
        ending: data.ending
      }))
      .sort((a, b) => {
        // Extract year and quarter number for sorting
        const [aQ, aY] = a.quarter.split(' ');
        const [bQ, bY] = b.quarter.split(' ');
        const aYear = parseInt(aY);
        const bYear = parseInt(bY);
        if (aYear !== bYear) return aYear - bYear;
        return parseInt(aQ.substring(1)) - parseInt(bQ.substring(1));
      });
  }, [projects]);

  // Projects by month (last 12 months)
  const projectsByMonth = useMemo<MonthData[]>(() => {
    const now = new Date();
    const months: MonthData[] = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const count = projects.filter(project => {
        if (!project.start_date) return false;
        const projectDate = new Date(project.start_date);
        return projectDate.getMonth() === date.getMonth() && 
               projectDate.getFullYear() === date.getFullYear();
      }).length;

      months.push({ month: monthKey, projects: count });
    }

    return months;
  }, [projects]);

  // Duration distribution
  const durationDistribution = useMemo<DurationData[]>(() => {
    const ranges = [
      { min: 0, max: 7, label: '< 1 week' },
      { min: 8, max: 14, label: '1-2 weeks' },
      { min: 15, max: 30, label: '2-4 weeks' },
      { min: 31, max: 60, label: '1-2 months' },
      { min: 61, max: 90, label: '2-3 months' },
      { min: 91, max: Infinity, label: '3+ months' }
    ];

    const distribution = ranges.map(range => ({
      range: range.label,
      count: projects.filter(p => {
        if (!p.start_date || !p.due_date) return false;
        const startDate = new Date(p.start_date);
        const dueDate = new Date(p.due_date);
        const duration = Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return duration >= range.min && duration <= range.max;
      }).length
    }));

    return distribution.filter(d => d.count > 0);
  }, [projects]);

  // Upcoming deadlines (next 14 days)
  const upcomingDeadlines = useMemo<UpcomingDeadline[]>(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return projects
      .filter(p => {
        if (!p.due_date) return false;
        const dueDate = new Date(p.due_date);
        const isCompleted = p.status === 'Done' || p.status === 'Completed';
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return daysUntil >= 0 && daysUntil <= 14 && !isCompleted;
      })
      .map(p => {
        const dueDate = new Date(p.due_date);
        const daysUntil = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: p.id,
          project_name: p.project_name,
          due_date: p.due_date,
          status: p.status,
          daysUntil,
          vertical: p.vertical
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 10);
  }, [projects]);

  // Overdue projects
  const overdueProjects = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    return projects
      .filter(p => {
        if (!p.due_date) return false;
        const dueDate = new Date(p.due_date);
        const isCompleted = p.status === 'Done' || p.status === 'Completed';
        return dueDate < today && !isCompleted;
      })
      .map(p => {
        const dueDate = new Date(p.due_date);
        const daysOverdue = Math.ceil((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return {
          id: p.id,
          project_name: p.project_name,
          due_date: p.due_date,
          status: p.status,
          daysOverdue,
          vertical: p.vertical
        };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue)
      .slice(0, 10);
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Overdue Projects"
          value={timelineStats.overdueCount}
          icon={AlertCircle}
          subtitle={timelineStats.overdueCount > 0 ? 'Need attention' : 'All on track'}
        />
        
        <StatsCard
          title="Due This Week"
          value={timelineStats.upcomingWeek}
          icon={CalendarCheck}
          subtitle="Next 7 days"
        />
        
        <StatsCard
          title="Due This Month"
          value={timelineStats.upcomingMonth}
          icon={CalendarDays}
          subtitle="Next 30 days"
        />
        
        <StatsCard
          title="Avg Duration"
          value={timelineStats.avgDuration}
          icon={Clock}
          subtitle="days per project"
          isDuration={true}
        />
      </div>

      {/* Overdue Projects Alert */}
      {overdueProjects.length > 0 && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 md:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-destructive text-sm md:text-base">
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5" />
            Overdue Projects
          </h3>
          <div className="space-y-2">
            {overdueProjects.map(project => (
              <div key={project.id} className="flex items-start sm:items-center gap-2 p-2 rounded bg-background/50 flex-col sm:flex-row">
                <div className="flex-1 min-w-0 w-full">
                  <p className="font-medium truncate text-sm md:text-base">{project.project_name}</p>
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground flex-wrap mt-1">
                    <Badge variant="outline" className="text-[10px] md:text-xs px-1 md:px-2">{project.vertical}</Badge>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-[10px] md:text-xs">Due {new Date(project.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge variant="destructive" className="text-[10px] md:text-xs shrink-0 self-start sm:self-auto sm:ml-2">
                  {project.daysOverdue} days overdue
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Deadlines */}
      {upcomingDeadlines.length > 0 && (
        <div className="bg-card rounded-lg border p-4 md:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-sm md:text-base">
            <Calendar className="h-4 w-4 md:h-5 md:w-5" />
            Upcoming Deadlines (Next 14 Days)
          </h3>
          <div className="space-y-2">
            {upcomingDeadlines.map(project => (
              <div key={project.id} className="flex items-start sm:items-center gap-2 p-2 rounded hover:bg-muted/50 transition-colors flex-col sm:flex-row">
                <div className="flex-1 min-w-0 w-full">
                  <p className="font-medium truncate text-sm md:text-base">{project.project_name}</p>
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground flex-wrap mt-1">
                    <Badge variant="outline" className="text-[10px] md:text-xs px-1 md:px-2">{project.vertical}</Badge>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-[10px] md:text-xs">Due {new Date(project.due_date).toLocaleDateString()}</span>
                  </div>
                </div>
                <Badge 
                  variant={project.daysUntil <= 3 ? 'destructive' : project.daysUntil <= 7 ? 'default' : 'secondary'}
                  className="text-[10px] md:text-xs shrink-0 self-start sm:self-auto sm:ml-2"
                >
                  {project.daysUntil === 0 ? 'Today' : project.daysUntil === 1 ? 'Tomorrow' : `${project.daysUntil} days`}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-6">
        {/* Projects by Quarter */}
        {projectsByQuarter.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="mb-4">Projects by Quarter</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectsByQuarter}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="starting" name="Starting" fill="hsl(150, 60%, 50%)" />
                <Bar dataKey="ending" name="Ending" fill="hsl(210, 70%, 50%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Starts by Month */}
        {projectsByMonth.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="mb-4">Project Starts (Last 12 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={projectsByMonth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="projects" name="Projects" stroke="hsl(210, 70%, 50%)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Duration Distribution */}
        {durationDistribution.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="mb-4">Project Duration Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={durationDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Projects" fill="hsl(210, 70%, 50%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Empty State */}
      {projects.length === 0 && (
        <div className="text-center text-muted-foreground py-12 bg-card rounded-lg border">
          <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No timeline data available</p>
          <p className="text-sm mt-2">Start creating projects to see timeline statistics</p>
        </div>
      )}
    </div>
  );
}