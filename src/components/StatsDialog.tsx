import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { BarChart3, FolderOpen, Image, Users, Calendar } from 'lucide-react';
import { useProjects } from '../hooks/useProjects';
import { useStatuses } from '../hooks/useStatuses';
import { useTypes } from '../hooks/useTypes';
import { useVerticals } from '../hooks/useVerticals';
import { StatsOverview } from './stats/StatsOverview';
import { StatsProjects } from './stats/StatsProjects';
import { StatsAssets } from './stats/StatsAssets';
import { StatsCollaboration } from './stats/StatsCollaboration';
import { StatsTimeline } from './stats/StatsTimeline';
import { Skeleton } from './ui/skeleton';

interface StatsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StatsDialog({ open, onOpenChange }: StatsDialogProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { projects, loading: projectsLoading } = useProjects();
  const { statuses } = useStatuses();
  const { types, typeColors } = useTypes();
  const { verticals } = useVerticals();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Statistics
          </DialogTitle>
        </DialogHeader>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <div className="px-6">
            <TabsList className="grid w-full grid-cols-5">
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
          </div>
          
          <ScrollArea className="h-[calc(90vh-180px)]">
            <div className="px-6 pb-6">
              {projectsLoading ? (
                <LoadingSkeleton />
              ) : (
                <>
                  <TabsContent value="overview" className="mt-6">
                    <StatsOverview projects={projects} statuses={statuses} verticals={verticals} />
                  </TabsContent>
                  
                  <TabsContent value="projects" className="mt-6">
                    <StatsProjects projects={projects} statuses={statuses} types={types} typeColors={typeColors} verticals={verticals} />
                  </TabsContent>
                  
                  <TabsContent value="assets" className="mt-6">
                    <StatsAssets projects={projects} statuses={statuses} />
                  </TabsContent>
                  
                  <TabsContent value="collaboration" className="mt-6">
                    <StatsCollaboration projects={projects} />
                  </TabsContent>
                  
                  <TabsContent value="timeline" className="mt-6">
                    <StatsTimeline projects={projects} />
                  </TabsContent>
                </>
              )}
            </div>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 mt-6">
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