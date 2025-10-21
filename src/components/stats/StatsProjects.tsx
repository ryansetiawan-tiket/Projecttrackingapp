import { useMemo } from 'react';
import { Project } from '../../types/project';
import { Vertical } from '../../hooks/useVerticals';
import { StatsCard } from './StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from 'recharts';
import { TrendingUp, Clock, Calendar } from 'lucide-react';
import {
  calculatePercentage,
  calculateDaysBetween,
  isProjectCompleted,
  isValidDate
} from '../../utils/statsCalculations';
import { formatForPieChart, formatForBarChart, CHART_COLOR_ARRAY } from '../../utils/chartHelpers';

interface StatsProjectsProps {
  projects: Project[];
  statuses: any[];
  types: string[];
  typeColors: Record<string, string>;
  verticals: Vertical[];
}

export function StatsProjects({ projects, statuses, types, typeColors, verticals }: StatsProjectsProps) {
  const stats = useMemo(() => {
    const totalProjects = projects.length;
    
    // Helper functions to get colors from arrays
    const getStatusColor = (statusName: string, statuses: any[]) => {
      const status = statuses.find(s => s.name === statusName);
      return status?.color || 'hsl(0, 0%, 50%)';
    };
    
    const getVerticalColor = (verticalName: string, verticals: Vertical[]) => {
      const vertical = verticals.find(v => v.name === verticalName);
      return vertical?.color || 'hsl(0, 0%, 50%)';
    };
    
    const getTypeColor = (typeName: string, typeColors: Record<string, string>) => {
      return typeColors[typeName] || 'hsl(0, 0%, 50%)';
    };
    
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
        color: getVerticalColor(vertical, verticals),
        count,
        percentage: calculatePercentage(count, totalProjects)
      }))
      .sort((a, b) => b.count - a.count);
    
    // ============================================================================
    // TYPE DISTRIBUTION
    // ============================================================================
    const typeMap = new Map<string, number>();
    projects.forEach(project => {
      // Handle both single type and multiple types (types array)
      if (project.types && Array.isArray(project.types) && project.types.length > 0) {
        // New format: multiple types
        project.types.forEach(type => {
          const typeName = type || 'No Type';
          typeMap.set(typeName, (typeMap.get(typeName) || 0) + 1);
        });
      } else {
        // Old format: single type (backward compatibility)
        const type = project.type || 'No Type';
        typeMap.set(type, (typeMap.get(type) || 0) + 1);
      }
    });
    
    const byType = Array.from(typeMap.entries())
      .map(([type, count]) => ({
        type,
        color: getTypeColor(type, typeColors),
        count,
        percentage: calculatePercentage(count, totalProjects)
      }))
      .sort((a, b) => b.count - a.count);
    
    // ============================================================================
    // DURATION STATISTICS
    // ============================================================================
    const durations = projects
      .filter(p => p.start_date && p.due_date && isValidDate(p.start_date) && isValidDate(p.due_date))
      .map(p => ({
        name: p.project_name || p.id,
        days: calculateDaysBetween(p.start_date!, p.due_date!)
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
      duration: {
        average: averageDuration,
        longest,
        shortest
      },
      activeProjects,
      completedProjects
    };
  }, [projects, statuses, types, typeColors, verticals]);
  
  return (
    <div className="space-y-6">
      {/* Active & Completed Projects */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <StatsCard
          title="Active Projects"
          value={stats.activeProjects}
          icon={TrendingUp}
          subtitle={`${calculatePercentage(stats.activeProjects, projects.length)}% of total`}
        />
        
        <StatsCard
          title="Completed Projects"
          value={stats.completedProjects}
          icon={Calendar}
          subtitle={`${calculatePercentage(stats.completedProjects, projects.length)}% of total`}
        />
      </div>
      
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
      
      {/* Duration Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Average Duration"
          value={stats.duration.average > 0 ? stats.duration.average : 'N/A'}
          icon={Clock}
          subtitle={stats.duration.average > 0 ? 'Per project' : 'No data'}
          isDuration={stats.duration.average > 0}
        />
        
        <StatsCard
          title="Longest Project"
          value={stats.duration.longest ? stats.duration.longest.days : 'N/A'}
          icon={TrendingUp}
          subtitle={stats.duration.longest ? stats.duration.longest.name : 'No data'}
          isDuration={!!stats.duration.longest}
        />
        
        <StatsCard
          title="Shortest Project"
          value={stats.duration.shortest ? stats.duration.shortest.days : 'N/A'}
          icon={Calendar}
          subtitle={stats.duration.shortest ? stats.duration.shortest.name : 'No data'}
          isDuration={!!stats.duration.shortest}
        />
      </div>
      

    </div>
  );
}