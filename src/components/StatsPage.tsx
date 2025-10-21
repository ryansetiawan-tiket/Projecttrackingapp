import { useState, useMemo } from 'react';
import { ArrowLeft, BarChart3, FolderOpen, Image, Users, Calendar, TrendingUp } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useProjects } from '../hooks/useProjects';
import { useStatuses } from '../hooks/useStatuses';
import { useTypes } from '../hooks/useTypes';
import { useVerticals } from '../hooks/useVerticals';
import { StatsOverview } from './stats/StatsOverview';
import { StatsProjects } from './stats/StatsProjects';
import { StatsAssets } from './stats/StatsAssets';
import { StatsCollaboration } from './stats/StatsCollaboration';
import { StatsTimeline } from './stats/StatsTimeline';
import { StatsDateFilter, DateRange } from './stats/StatsDateFilter';
import { Skeleton } from './ui/skeleton';
import { useIsMobile } from './ui/use-mobile';
import { Project } from '../types/project';

interface StatsPageProps {
  onBack: () => void;
}

export function StatsPage({ onBack }: StatsPageProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const isMobile = useIsMobile();
  const { projects, loading: projectsLoading } = useProjects();
  const { statuses } = useStatuses();
  const { types, typeColors } = useTypes();
  const { verticals } = useVerticals();

  // Filter projects based on date range
  const filteredProjects = useMemo(() => {
    if (!dateRange) {
      return projects; // All time - no filter
    }

    return projects.filter(project => {
      // Use start_date as primary filter, fallback to completed_at
      const projectDate = project.start_date 
        ? new Date(project.start_date)
        : project.completed_at 
          ? new Date(project.completed_at)
          : null;

      if (!projectDate) {
        return false; // Exclude projects without dates
      }

      return projectDate >= dateRange.start && projectDate <= dateRange.end;
    });
  }, [projects, dateRange]);

  // Extract unique collaborators from all projects
  const allCollaborators = useMemo(() => {
    const collabMap = new Map();
    projects.forEach(project => {
      project.collaborators?.forEach(collab => {
        // Handle both string IDs and collaborator objects
        const collabObj = typeof collab === 'string' ? { id: collab, name: collab } : collab;
        if (!collabMap.has(collabObj.id)) {
          collabMap.set(collabObj.id, collabObj);
        }
      });
    });
    return Array.from(collabMap.values());
  }, [projects]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - Same pattern as SettingsPage */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border safe-area-inset">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Back Button - Icon only on mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="md:hidden"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {/* Back Button - With text on desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hidden md:flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg md:text-xl">Statistics</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-7xl pb-safe">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          {/* Tabs List */}
          <TabsList className={isMobile ? "grid w-full grid-cols-5 mb-4" : "inline-flex mb-4"}>
            <TabsTrigger value="overview" className="flex items-center gap-1.5">
              <BarChart3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-1.5">
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Projects</span>
            </TabsTrigger>
            <TabsTrigger value="assets" className="flex items-center gap-1.5">
              <Image className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Assets</span>
            </TabsTrigger>
            <TabsTrigger value="collaboration" className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Collab</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
          </TabsList>

          {/* Date Filter - Below Tabs */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <StatsDateFilter 
                projects={projects}
                onDateRangeChange={setDateRange}
              />
              
              {/* Active Filter Indicator */}
              {dateRange ? (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-start gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm text-muted-foreground">Showing data for:</span>
                        <Badge variant="secondary" className="font-medium">
                          {dateRange.label}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        <span className="font-medium text-foreground">{filteredProjects.length}</span> of {projects.length} projects in this period
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm text-muted-foreground">Showing:</span>
                      <Badge variant="outline">All Time</Badge>
                      <span className="text-xs text-muted-foreground">({projects.length} total projects)</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tab Contents */}
          {projectsLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              <TabsContent value="overview" className="mt-0">
                <StatsOverview 
                  projects={filteredProjects} 
                  statuses={statuses} 
                  verticals={verticals}
                  collaborators={allCollaborators}
                />
              </TabsContent>
              
              <TabsContent value="projects" className="mt-0">
                <StatsProjects projects={filteredProjects} statuses={statuses} types={types} typeColors={typeColors} verticals={verticals} />
              </TabsContent>
              
              <TabsContent value="assets" className="mt-0">
                <StatsAssets projects={filteredProjects} statuses={statuses} />
              </TabsContent>
              
              <TabsContent value="collaboration" className="mt-0">
                <StatsCollaboration projects={filteredProjects} />
              </TabsContent>
              
              <TabsContent value="timeline" className="mt-0">
                <StatsTimeline projects={filteredProjects} />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
      <Skeleton className="h-48 w-full" />
      <Skeleton className="h-48 w-full" />
    </div>
  );
}
