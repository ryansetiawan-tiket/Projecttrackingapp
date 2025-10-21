import { useMemo } from 'react';
import { Project } from '../../types/project';
import { Vertical } from '../../hooks/useVerticals';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  calculatePercentage,
  calculateDaysBetween,
  isProjectCompleted,
  isValidDate
} from '../../utils/statsCalculations';
import { HighlightCard } from './HighlightCard';

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
  
  // ============================================================================
  // HELPER FUNCTIONS FOR QUIRKY CAPTIONS
  // ============================================================================
  
  const getVerticalQuirk = () => {
    if (stats.byVertical.length === 0) return null;
    const top = stats.byVertical[0];
    
    const quirks = [
      `${top.vertical} projects dominating like it's their world (${top.percentage}%)`,
      `${top.vertical} taking the lead with ${top.percentage}% — clearly the favorite child`,
      `${top.vertical} crushing it at ${top.percentage}% — no competition here`,
      `${top.percentage}% ${top.vertical}? Someone's feeling very ${top.vertical.toLowerCase()}-ish lately 😎`,
    ];
    
    if (stats.byVertical.length === 1) {
      return `Only ${top.vertical}? Talk about commitment! 💯`;
    }
    
    if (top.percentage >= 50) {
      return quirks[0];
    } else if (top.percentage >= 35) {
      return quirks[1];
    } else {
      return quirks[2];
    }
  };
  
  const getTypeQuirk = () => {
    if (stats.byType.length === 0) return null;
    const top = stats.byType[0];
    
    const typeQuirks: Record<string, string[]> = {
      'Banner': [
        `Banner gang stays undefeated (${top.percentage}%) — guess we love rectangles`,
        `${top.percentage}% Banners? Rectangle supremacy confirmed 📐`,
      ],
      'Social Media': [
        `Social Media at ${top.percentage}% — someone's chronically online 📱`,
        `${top.percentage}% Social? We're basically influencers at this point 🤳`,
      ],
      'Email': [
        `Email dominating at ${top.percentage}% — inbox heroes unite 📧`,
        `${top.percentage}% Email? Somebody loves a good newsletter 💌`,
      ],
      'Video': [
        `Video leading with ${top.percentage}% — mini Spielberg vibes 🎬`,
        `${top.percentage}% Video content? Hollywood called, they're jealous 🎥`,
      ],
    };
    
    if (stats.byType.length === 1) {
      return `One type to rule them all: ${top.type}! 👑`;
    }
    
    const customQuirks = typeQuirks[top.type];
    if (customQuirks) {
      return customQuirks[0];
    }
    
    return `${top.type} at ${top.percentage}% — the clear winner here 🏆`;
  };
  
  const getDurationNarrative = (days: number, projectName: string, type: 'average' | 'longest' | 'shortest') => {
    if (type === 'average') {
      if (days <= 3) return `${days} day${days !== 1 ? 's' : ''} — speedrun mode activated ⚡`;
      if (days <= 7) return `${days} days — quick and efficient, love to see it 🚀`;
      if (days <= 14) return `${days} days — solid two-week sprint vibes 📅`;
      if (days <= 30) return `${days} days — just enough time for a mini drama series 🎭`;
      if (days <= 60) return `${days} days — a proper monthly commitment 📆`;
      return `${days} days — we're in it for the long haul 🏔️`;
    }
    
    if (type === 'longest') {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      let timeStr = '';
      
      if (months > 0 && remainingDays > 0) {
        timeStr = `${months} month${months !== 1 ? 's' : ''} ${remainingDays} day${remainingDays !== 1 ? 's' : ''}`;
      } else if (months > 0) {
        timeStr = `${months} month${months !== 1 ? 's' : ''}`;
      } else {
        timeStr = `${days} day${days !== 1 ? 's' : ''}`;
      }
      
      return (
        <>
          <span className="font-semibold text-blue-600 dark:text-blue-400">{timeStr}</span>
          {' — '}
          <span className="italic">{projectName}</span>
          {days >= 90 ? ", truly an epic saga 📖" : days >= 60 ? ", quite the journey 🗺️" : ", taking its sweet time 🐌"}
        </>
      );
    }
    
    if (type === 'shortest') {
      return (
        <>
          <span className="font-semibold text-green-600 dark:text-green-400">{days} day{days !== 1 ? 's' : ''}</span>
          {' — '}
          <span className="italic">{projectName}</span>
          {days === 1 ? ". Blink and it's done ⚡" : ". Quick work! 🏃"}
        </>
      );
    }
    
    return '';
  };
  
  const getProjectVibesRecap = () => {
    const messages: string[] = [];
    
    // Status vibe
    const activePercent = calculatePercentage(stats.activeProjects, projects.length);
    const completedPercent = calculatePercentage(stats.completedProjects, projects.length);
    
    if (completedPercent >= 70) {
      messages.push("You're on fire with completions 🔥");
    } else if (completedPercent >= 50) {
      messages.push("Nice balance of done and ongoing work 👌");
    } else if (activePercent >= 70) {
      messages.push("Lots of irons in the fire right now 🔧");
    } else {
      messages.push("Building up that project pipeline 🚀");
    }
    
    // Vertical/Type vibe
    if (stats.byVertical.length > 0 && stats.byType.length > 0) {
      const topVertical = stats.byVertical[0];
      const topType = stats.byType[0];
      
      if (topVertical.percentage >= 60 || topType.percentage >= 60) {
        messages.push(`Mostly ${topVertical.vertical} and ${topType.type} work lately — someone's found their groove 😎`);
      } else if (stats.byVertical.length >= 3 && stats.byType.length >= 3) {
        messages.push("Great variety across verticals and types — keeping it fresh! 🎨");
      } else {
        messages.push(`Focus mode: ${topVertical.vertical} × ${topType.type} combo 🎯`);
      }
    }
    
    // Duration vibe
    if (stats.duration.average > 0) {
      if (stats.duration.average <= 7) {
        messages.push("Quick turnarounds are your specialty ⚡");
      } else if (stats.duration.average >= 30) {
        messages.push("Patient with the process — marathon runner energy 🏃‍♂️");
      }
    }
    
    return messages.join(' • ');
  };
  
  return (
    <div className="space-y-6">
      {/* Active & Completed Projects - Fun Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <HighlightCard 
          emoji="🔥" 
          title="Still Cooking"
        >
          <div className="space-y-2">
            <div>
              <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.activeProjects}</span>
              <span className="text-lg text-muted-foreground ml-2">
                project{stats.activeProjects !== 1 ? 's' : ''} on the stove
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              That's {calculatePercentage(stats.activeProjects, projects.length)}% of everything you're managing. Keep cooking! 👨‍🍳
            </p>
          </div>
        </HighlightCard>
        
        <HighlightCard 
          emoji="✅" 
          title="Mission Accomplished"
        >
          <div className="space-y-2">
            <div>
              <span className="text-3xl font-bold text-green-600 dark:text-green-400">{stats.completedProjects}</span>
              <span className="text-lg text-muted-foreground ml-2">
                project{stats.completedProjects !== 1 ? 's' : ''} nailed!
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {calculatePercentage(stats.completedProjects, projects.length)}% completion rate.
              {stats.completedProjects >= 10 ? " Legend status 🏆" : stats.completedProjects >= 5 ? " Nice work! 🎉" : " Every win counts! 💪"}
            </p>
          </div>
        </HighlightCard>
      </div>
      
      {/* Vertical & Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Vertical Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">📊 Vertical Distribution</CardTitle>
            {getVerticalQuirk() && (
              <p className="text-sm text-muted-foreground italic mt-1">
                {getVerticalQuirk()}
              </p>
            )}
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
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate">{entry.vertical}</span>
                      </div>
                      <span className="text-muted-foreground flex-shrink-0 ml-2">
                        {entry.count} ({entry.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No vertical data available yet — time to categorize! 🏷️
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Type Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">🎨 Type Distribution</CardTitle>
            {getTypeQuirk() && (
              <p className="text-sm text-muted-foreground italic mt-1">
                {getTypeQuirk()}
              </p>
            )}
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
                          className="w-3 h-3 rounded-sm flex-shrink-0"
                          style={{ backgroundColor: entry.color }}
                        />
                        <span className="truncate">{entry.type}</span>
                      </div>
                      <span className="text-muted-foreground flex-shrink-0 ml-2">
                        {entry.count} ({entry.percentage}%)
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                No type data available yet — add some types! 🎯
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Duration Statistics - Fun Narrative Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <HighlightCard emoji="🕒" title="Average Duration">
          {stats.duration.average > 0 ? (
            <div className="space-y-1">
              <p className="text-base leading-relaxed">
                {getDurationNarrative(stats.duration.average, '', 'average')}
              </p>
              <p className="text-xs text-muted-foreground">Per project timeline</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No timeline data yet — start adding dates! 📅
            </p>
          )}
        </HighlightCard>
        
        <HighlightCard emoji="🐢" title="Longest Project">
          {stats.duration.longest ? (
            <div className="space-y-1">
              <p className="text-base leading-relaxed">
                {getDurationNarrative(stats.duration.longest.days, stats.duration.longest.name, 'longest')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No project durations recorded yet 🤷
            </p>
          )}
        </HighlightCard>
        
        <HighlightCard emoji="⚡" title="Shortest Project">
          {stats.duration.shortest ? (
            <div className="space-y-1">
              <p className="text-base leading-relaxed">
                {getDurationNarrative(stats.duration.shortest.days, stats.duration.shortest.name, 'shortest')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No project durations recorded yet 🤷
            </p>
          )}
        </HighlightCard>
      </div>

      {/* Project Vibes Recap - Summary Card */}
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle className="text-base">✨ Project Vibes Recap</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-base leading-relaxed">
            {getProjectVibesRecap()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
