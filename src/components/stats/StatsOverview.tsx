import { useMemo } from 'react';
import { Project } from '../../types/project';
import { Vertical } from '../../hooks/useVerticals';
import { StatsCard } from './StatsCard';
import { FolderOpen, Image, Users, CheckCircle, TrendingUp, Lightbulb, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { 
  isProjectCompleted, 
  getTotalAssetsForProject,
  calculatePercentage,
  isWithinLastNDays,
  getTotalActionsForProject
} from '../../utils/statsCalculations';

interface StatsOverviewProps {
  projects: Project[];
  statuses: any[];
  verticals: Vertical[];
}

export function StatsOverview({ projects, statuses, verticals }: StatsOverviewProps) {
  const stats = useMemo(() => {
    // Helper function to get vertical color
    const getVerticalColor = (verticalName: string) => {
      const vertical = verticals.find(v => v.name === verticalName);
      return vertical?.color || 'hsl(0, 0%, 50%)';
    };
    
    // Total Projects
    const totalProjects = projects.length;
    
    // Total Assets
    const totalAssets = projects.reduce((sum, project) => 
      sum + getTotalAssetsForProject(project), 0
    );
    
    // Total Collaborators (unique)
    const collaboratorSet = new Set<string>();
    projects.forEach(project => {
      project.collaborators?.forEach(c => collaboratorSet.add(c.id));
    });
    const totalCollaborators = collaboratorSet.size;
    
    // Completion Rate
    const completedProjects = projects.filter(p => isProjectCompleted(p)).length;
    const completionRate = calculatePercentage(completedProjects, totalProjects);
    
    // Most Active Vertical
    const verticalMap = new Map<string, number>();
    projects.forEach(project => {
      if (project.vertical) {
        verticalMap.set(project.vertical, (verticalMap.get(project.vertical) || 0) + 1);
      }
    });
    
    let mostActiveVertical = null;
    if (verticalMap.size > 0) {
      const [name, count] = Array.from(verticalMap.entries())
        .sort((a, b) => b[1] - a[1])[0];
      mostActiveVertical = {
        name,
        count,
        color: getVerticalColor(name)
      };
    }
    
    // Average Assets per Project
    const averageAssetsPerProject = totalProjects > 0 
      ? Math.round((totalAssets / totalProjects) * 10) / 10 
      : 0;
    
    // Most Common Status
    const statusMap = new Map<string, number>();
    projects.forEach(project => {
      if (project.status) {
        statusMap.set(project.status, (statusMap.get(project.status) || 0) + 1);
      }
    });
    
    let mostCommonStatus = null;
    if (statusMap.size > 0) {
      const [name, count] = Array.from(statusMap.entries())
        .sort((a, b) => b[1] - a[1])[0];
      const statusObj = statuses.find(s => s.name === name);
      mostCommonStatus = {
        name,
        count,
        color: statusObj?.color || 'hsl(0, 0%, 50%)'
      };
    }
    
    // Recent Activity (Last 7 Days)
    const projectsCreated = projects.filter(p => 
      p.created_at && isWithinLastNDays(p.created_at, 7)
    ).length;
    
    const assetsAdded = projects.reduce((sum, project) => {
      let count = 0;
      
      // File assets (actionable items)
      project.actionable_items?.forEach(asset => {
        if (asset.created_at && isWithinLastNDays(asset.created_at, 7)) {
          count++;
        }
      });
      
      // Lightroom assets
      project.lightroomAssets?.forEach(asset => {
        if (asset.created_at && isWithinLastNDays(asset.created_at, 7)) {
          count++;
        }
      });
      
      // GDrive assets
      project.gdriveAssets?.forEach(asset => {
        if (asset.created_at && isWithinLastNDays(asset.created_at, 7)) {
          count++;
        }
      });
      
      return sum + count;
    }, 0);
    
    const actionsCompleted = projects.reduce((sum, project) => {
      let count = 0;
      
      // Count completed actions from all asset types
      const allAssets = [
        ...(project.actionable_items || []),
        ...(project.lightroomAssets || []),
        ...(project.gdriveAssets || [])
      ];
      
      allAssets.forEach(asset => {
        asset.actions?.forEach(action => {
          if (action.completed || action.status === 'done') {
            count++;
          }
        });
      });
      
      return sum + count;
    }, 0);
    
    return {
      totalProjects,
      totalAssets,
      totalCollaborators,
      completionRate,
      mostActiveVertical,
      averageAssetsPerProject,
      mostCommonStatus,
      recentActivity: {
        projectsCreated,
        assetsAdded,
        actionsCompleted
      }
    };
  }, [projects, statuses, verticals]);
  
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Projects"
          value={stats.totalProjects}
          subtitle="All time"
          icon={FolderOpen}
        />
        
        <StatsCard
          title="Total Assets"
          value={stats.totalAssets.toLocaleString()}
          subtitle={`Avg ${stats.averageAssetsPerProject} per project`}
          icon={Image}
        />
        
        <StatsCard
          title="Collaborators"
          value={stats.totalCollaborators}
          subtitle="Unique team members"
          icon={Users}
        />
        
        <StatsCard
          title="Completion Rate"
          value={`${stats.completionRate}%`}
          icon={CheckCircle}
        >
          <Progress value={stats.completionRate} className="h-2 mt-2" />
        </StatsCard>
      </div>
      
      {/* Quick Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Quick Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.mostActiveVertical && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Most Active Vertical:</span>
              <div className="flex items-center gap-2">
                <Badge 
                  style={{ 
                    backgroundColor: stats.mostActiveVertical.color,
                    color: 'white'
                  }}
                >
                  {stats.mostActiveVertical.name}
                </Badge>
                <span className="text-sm font-medium">
                  ({stats.mostActiveVertical.count} projects)
                </span>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Average Assets per Project:</span>
            <span className="text-sm font-medium">{stats.averageAssetsPerProject}</span>
          </div>
          
          {stats.mostCommonStatus && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Most Common Status:</span>
              <div className="flex items-center gap-2">
                <Badge 
                  style={{ 
                    backgroundColor: stats.mostCommonStatus.color,
                    color: 'white'
                  }}
                >
                  {stats.mostCommonStatus.name}
                </Badge>
                <span className="text-sm font-medium">
                  ({stats.mostCommonStatus.count} projects)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Recent Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Projects Created</span>
            </div>
            <span className="text-sm font-medium">{stats.recentActivity.projectsCreated}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Assets Added</span>
            </div>
            <span className="text-sm font-medium">{stats.recentActivity.assetsAdded}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Actions Completed</span>
            </div>
            <span className="text-sm font-medium">{stats.recentActivity.actionsCompleted}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}