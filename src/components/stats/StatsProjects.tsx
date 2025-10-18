import { useMemo } from 'react';
import { Project } from '../../types/project';
import { StatsCard } from './StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, Clock, Calendar } from 'lucide-react';
import {
  getQuarterFromDate,
  getStatusColor,
  getVerticalColor,
  getTypeColor,
  calculatePercentage,
  calculateDaysBetween,
  isProjectCompleted,
  isValidDate,
  getQuarterString
} from '../../utils/statsCalculations';
import { formatForPieChart, formatForBarChart, CHART_COLORS } from '../../utils/chartHelpers';

interface StatsProjectsProps {
  projects: Project[];
  statuses: any[];
  types: any[];
}

export function StatsProjects({ projects, statuses, types }: StatsProjectsProps) {
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    
    // ============================================================================
    // STATUS DISTRIBUTION
    // ============================================================================
    const statusMap = new Map<string, number>();
    projects.forEach(project => {
      const status = project.status || 'No Status';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });
    
    const byStatus = Array.from(statusMap.entries())
      .map(([status, count]) => ({
        status,
        color: getStatusColor(status, statuses),
        count,
        percentage: calculatePercentage(count, totalProjects)
      }))
      .sort((a, b) => b.count - a.count);
    
    // ============================================================================
    // VERTICAL DISTRIBUTION
    // ============================================================================
    const verticalMap = new Map<string, number>();
    projects.forEach(project => {
      const vertical = project.vertical || 'No Vertical';
      verticalMap.set(vertical, (verticalMap.get(vertical) || 0) + 1);
    });
    
    const byVertical = Array.from(verticalMap.entries())
      .map(([vertical, count]) => ({
        vertical,
        color: getVerticalColor(vertical),
        count,
        percentage: calculatePercentage(count, totalProjects)
      }))
      .sort((a, b) => b.count - a.count);
    
    // ============================================================================
    // TYPE DISTRIBUTION
    // ============================================================================
    const typeMap = new Map<string, number>();
    projects.forEach(project => {
      const type = project.type || 'No Type';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });
    
    const byType = Array.from(typeMap.entries())
      .map(([type, count]) => ({
        type,
        color: getTypeColor(type, types),
        count,
        percentage: calculatePercentage(count, totalProjects)
      }))
      .sort((a, b) => b.count - a.count);
    
    // ============================================================================
    // QUARTER DISTRIBUTION
    // ============================================================================
    const quarterMap = new Map<string, { quarter: string; year: number; quarterNumber: number; count: number; projects: string[] }>();
    
    projects.forEach(project => {
      if (project.start_date && isValidDate(project.start_date)) {
        const { quarter, year } = getQuarterFromDate(project.start_date);
        const key = getQuarterString(quarter, year);
        
        if (!quarterMap.has(key)) {
          quarterMap.set(key, {
            quarter: key,
            year,
            quarterNumber: quarter,
            count: 0,
            projects: []
          });
        }
        
        const dist = quarterMap.get(key)!;
        dist.count++;
        dist.projects.push(project.project_name || project.id);
      }
    });
    
    const byQuarter = Array.from(quarterMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.quarterNumber - a.quarterNumber;
      })
      .slice(0, 8); // Last 8 quarters
    
    // ============================================================================
    // DURATION STATISTICS
    // ============================================================================
    const durations = projects
      .filter(p => p.start_date && p.end_date && isValidDate(p.start_date) && isValidDate(p.end_date))
      .map(p => ({
        name: p.project_name || p.id,
        days: calculateDaysBetween(p.start_date!, p.end_date!)
      }))
      .filter(d => d.days > 0);
    
    const averageDuration = durations.length > 0
      ? Math.round(durations.reduce((sum, d) => sum + d.days, 0) / durations.length)
      : 0;
    
    const longest = durations.length > 0
      ? durations.reduce((max, d) => d.days > max.days ? d : max)
      : null;
    
    const shortest = durations.length > 0
      ? durations.reduce((min, d) => d.days < min.days ? d : min)
      : null;
    
    // ============================================================================
    // OTHER STATS
    // ============================================================================
    const activeProjects = projects.filter(p => !isProjectCompleted(p)).length;
    const completedProjects = projects.filter(p => isProjectCompleted(p)).length;
    
    return {
      byStatus,
      byVertical,
      byType,
      byQuarter,
      duration: {
        average: averageDuration,
        longest,
        shortest
      },
      activeProjects,
      completedProjects
    };
  }, [projects, statuses, types]);
  
  return (
    <div className="space-y-6">
      {/* Status Distribution - Horizontal Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.byStatus.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, stats.byStatus.length * 40)}>
              <BarChart data={stats.byStatus} layout="vertical" margin={{ left: 100, right: 30 }}>
                <XAxis type="number" />
                <YAxis dataKey="status" type="category" width={90} />
                <Tooltip
                  formatter={(value: number, name: string, props: any) => [
                    `${value} projects (${props.payload.percentage}%)`,
                    ''
                  ]}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No status data available
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Vertical & Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vertical Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Vertical Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byVertical.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.byVertical}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.byVertical.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value} projects (${props.payload.percentage}%)`,
                        props.payload.vertical
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend */}
                <div className="mt-4 space-y-2">
                  {stats.byVertical.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate">{entry.vertical}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {entry.count} ({entry.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No vertical data available
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Type Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byType.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.byType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ percentage }) => `${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {stats.byType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string, props: any) => [
                        `${value} projects (${props.payload.percentage}%)`,
                        props.payload.type
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                
                {/* Legend */}
                <div className="mt-4 space-y-2">
                  {stats.byType.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-sm"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate">{entry.type}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {entry.count} ({entry.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No type data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Quarter Distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Projects by Quarter (Last 8 Quarters)</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.byQuarter.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byQuarter} margin={{ bottom: 20 }}>
                <XAxis dataKey="quarter" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => [`${value} projects`, '']}
                  labelFormatter={(label) => label}
                />
                <Bar dataKey="count" fill={CHART_COLORS.chart1} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              No quarter data available
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Duration Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Average Duration"
          value={stats.duration.average > 0 ? `${stats.duration.average} days` : 'N/A'}
          icon={Clock}
          subtitle={stats.duration.average > 0 ? 'Per project' : 'No data'}
        />
        
        <StatsCard
          title="Longest Project"
          value={stats.duration.longest ? `${stats.duration.longest.days} days` : 'N/A'}
          icon={TrendingUp}
          subtitle={stats.duration.longest ? stats.duration.longest.name : 'No data'}
        />
        
        <StatsCard
          title="Shortest Project"
          value={stats.duration.shortest ? `${stats.duration.shortest.days} days` : 'N/A'}
          icon={Calendar}
          subtitle={stats.duration.shortest ? stats.duration.shortest.name : 'No data'}
        />
      </div>
      
      {/* Active vs Completed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard
          title="Active Projects"
          value={stats.activeProjects}
          subtitle={`${calculatePercentage(stats.activeProjects, projects.length)}% of total`}
        />
        
        <StatsCard
          title="Completed Projects"
          value={stats.completedProjects}
          subtitle={`${calculatePercentage(stats.completedProjects, projects.length)}% of total`}
        />
      </div>
    </div>
  );
}
