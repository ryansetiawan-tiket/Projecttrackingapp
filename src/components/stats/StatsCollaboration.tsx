import { useMemo } from 'react';
import { Project } from '../../types/project';
import { StatsCard } from './StatsCard';
import { Users, User, Award, TrendingUp, UserCheck, Briefcase } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';

interface StatsCollaborationProps {
  projects: Project[];
}

interface CollaboratorStats {
  id: string;
  name: string;
  nickname?: string;
  photo_url?: string;
  projectCount: number;
  role: string;
  activeProjects: number;
  completedProjects: number;
}

interface RoleDistribution {
  role: string;
  count: number;
  fill: string;
}

interface ProjectCollabData {
  range: string;
  count: number;
}

export function StatsCollaboration({ projects }: StatsCollaborationProps) {
  // Calculate collaborator statistics
  const collaboratorStats = useMemo<CollaboratorStats[]>(() => {
    const collabMap = new Map<string, CollaboratorStats>();

    projects.forEach(project => {
      const collaborators = project.collaborators || [];
      const isCompleted = project.status === 'Done' || project.status === 'Completed';
      const isActive = !isCompleted && project.status !== 'Archived';

      collaborators.forEach(collab => {
        if (!collabMap.has(collab.id)) {
          collabMap.set(collab.id, {
            id: collab.id,
            name: collab.name,
            nickname: collab.nickname,
            photo_url: collab.photo_url,
            projectCount: 0,
            role: collab.role,
            activeProjects: 0,
            completedProjects: 0
          });
        }

        const stats = collabMap.get(collab.id)!;
        stats.projectCount++;
        if (isActive) stats.activeProjects++;
        if (isCompleted) stats.completedProjects++;
      });
    });

    return Array.from(collabMap.values())
      .sort((a, b) => b.projectCount - a.projectCount);
  }, [projects]);

  // Overall stats
  const overallStats = useMemo(() => {
    const totalCollaborators = collaboratorStats.length;
    const avgProjectsPerCollaborator = totalCollaborators > 0
      ? collaboratorStats.reduce((sum, c) => sum + c.projectCount, 0) / totalCollaborators
      : 0;
    
    const projectsWithCollaborators = projects.filter(p => (p.collaborators || []).length > 0).length;
    const avgCollaboratorsPerProject = projectsWithCollaborators > 0
      ? projects.reduce((sum, p) => sum + (p.collaborators || []).length, 0) / projectsWithCollaborators
      : 0;

    const activeCollaborators = collaboratorStats.filter(c => c.activeProjects > 0).length;

    return {
      totalCollaborators,
      avgProjectsPerCollaborator,
      avgCollaboratorsPerProject,
      activeCollaborators,
      projectsWithCollaborators
    };
  }, [collaboratorStats, projects]);

  // Role distribution
  const roleDistribution = useMemo<RoleDistribution[]>(() => {
    const roleMap = new Map<string, number>();
    
    collaboratorStats.forEach(collab => {
      const role = collab.role || 'No Role';
      roleMap.set(role, (roleMap.get(role) || 0) + 1);
    });

    const colors = [
      'hsl(210, 70%, 50%)',
      'hsl(150, 60%, 50%)',
      'hsl(45, 70%, 55%)',
      'hsl(280, 60%, 55%)',
      'hsl(0, 70%, 60%)',
      'hsl(180, 60%, 50%)',
      'hsl(30, 70%, 55%)',
      'hsl(260, 60%, 60%)'
    ];

    return Array.from(roleMap.entries())
      .map(([role, count], index) => ({
        role,
        count,
        fill: colors[index % colors.length]
      }))
      .sort((a, b) => b.count - a.count);
  }, [collaboratorStats]);

  // Projects by collaborator count distribution
  const projectCollabDistribution = useMemo<ProjectCollabData[]>(() => {
    const ranges = [
      { min: 0, max: 0, label: 'Solo' },
      { min: 1, max: 2, label: '1-2' },
      { min: 3, max: 5, label: '3-5' },
      { min: 6, max: 10, label: '6-10' },
      { min: 11, max: Infinity, label: '11+' }
    ];

    const distribution = ranges.map(range => ({
      range: range.label,
      count: projects.filter(p => {
        const collabCount = (p.collaborators || []).length;
        return collabCount >= range.min && collabCount <= range.max;
      }).length
    }));

    return distribution.filter(d => d.count > 0);
  }, [projects]);

  // Top collaborators
  const topCollaborators = useMemo(() => {
    return collaboratorStats.slice(0, 10);
  }, [collaboratorStats]);

  // Role workload
  const roleWorkload = useMemo(() => {
    const roleMap = new Map<string, { totalProjects: number; activeProjects: number }>();
    
    collaboratorStats.forEach(collab => {
      const role = collab.role || 'No Role';
      if (!roleMap.has(role)) {
        roleMap.set(role, { totalProjects: 0, activeProjects: 0 });
      }
      const data = roleMap.get(role)!;
      data.totalProjects += collab.projectCount;
      data.activeProjects += collab.activeProjects;
    });

    return Array.from(roleMap.entries())
      .map(([role, data]) => ({
        role,
        totalProjects: data.totalProjects,
        activeProjects: data.activeProjects
      }))
      .sort((a, b) => b.totalProjects - a.totalProjects)
      .slice(0, 8);
  }, [collaboratorStats]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Collaborators"
          value={overallStats.totalCollaborators}
          icon={Users}
          subtitle={`${overallStats.activeCollaborators} currently active`}
        />
        
        <StatsCard
          title="Avg per Project"
          value={overallStats.avgCollaboratorsPerProject.toFixed(1)}
          icon={UserCheck}
          subtitle="Average team size"
        />
        
        <StatsCard
          title="Avg per Collaborator"
          value={overallStats.avgProjectsPerCollaborator.toFixed(1)}
          icon={Briefcase}
          subtitle="Average workload"
        />
        
        <StatsCard
          title="Projects with Team"
          value={overallStats.projectsWithCollaborators}
          icon={Award}
          subtitle={`${projects.length - overallStats.projectsWithCollaborators} solo`}
        />
      </div>

      {/* Top Collaborators */}
      {topCollaborators.length > 0 && (
        <div className="bg-card rounded-lg border p-4 md:p-6">
          <h3 className="mb-4">Most Active Collaborators</h3>
          <div className="space-y-3">
            {topCollaborators.map((collab, index) => (
              <div key={collab.id} className="flex items-center gap-2 md:gap-4 p-2 md:p-3 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="text-sm md:text-lg font-semibold text-muted-foreground w-5 md:w-6 shrink-0">
                  #{index + 1}
                </div>
                
                <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                  {collab.photo_url ? (
                    <AvatarImage src={collab.photo_url} alt={collab.name} />
                  ) : (
                    <AvatarFallback className="text-xs md:text-sm">
                      {collab.nickname || collab.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 md:gap-2 flex-wrap">
                    <p className="font-medium truncate text-sm md:text-base">{collab.name}</p>
                    {collab.nickname && (
                      <span className="text-xs md:text-sm text-muted-foreground hidden sm:inline">({collab.nickname})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 md:gap-2 text-xs md:text-sm text-muted-foreground flex-wrap">
                    <Badge variant="outline" className="text-[10px] md:text-xs px-1 md:px-2">
                      {collab.role}
                    </Badge>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{collab.activeProjects} active</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="hidden sm:inline">{collab.completedProjects} completed</span>
                    <span className="sm:hidden text-[10px]">{collab.activeProjects}A / {collab.completedProjects}C</span>
                  </div>
                </div>
                
                <div className="text-right shrink-0">
                  <div className="text-lg md:text-2xl font-bold">{collab.projectCount}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">projects</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role Distribution */}
        {roleDistribution.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="mb-4">Collaborators by Role</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roleDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ role, count }) => `${role}: ${count}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {roleDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Project Collaborator Distribution */}
        {projectCollabDistribution.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="mb-4">Projects by Team Size</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={projectCollabDistribution}>
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

      {/* Role Workload */}
      {roleWorkload.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="mb-4">Workload by Role</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={roleWorkload}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="role" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalProjects" name="Total Projects" fill="hsl(210, 70%, 50%)" />
              <Bar dataKey="activeProjects" name="Active Projects" fill="hsl(150, 60%, 50%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Empty State */}
      {overallStats.totalCollaborators === 0 && (
        <div className="text-center text-muted-foreground py-12 bg-card rounded-lg border">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No collaborators found in projects</p>
          <p className="text-sm mt-2">Start adding team members to see collaboration statistics</p>
        </div>
      )}
    </div>
  );
}