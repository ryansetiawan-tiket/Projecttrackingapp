import { useState } from 'react';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ChevronDown, Calendar, CheckSquare, Target, User } from 'lucide-react';
import { Project } from '../types/project';
import { getTypeColor } from '../utils/typeColors';

// Date formatting utility
const formatDate = (date: Date, format: string) => {
  const options: Intl.DateTimeFormatOptions = {};
  
  if (format === 'MMM d') {
    options.month = 'short';
    options.day = 'numeric';
  } else if (format === 'MMM d, yyyy') {
    options.month = 'short';
    options.day = 'numeric';
    options.year = 'numeric';
  }
  
  return new Intl.DateTimeFormat('en-US', options).format(date);
};

type TimeView = 'week' | 'month';

interface ProjectTimelineItemProps {
  project: Project;
  position: { left: string; width: string };
  onProjectClick: (project: Project) => void;
  timeView?: TimeView;
}

export function ProjectTimelineItem({ project, position, onProjectClick, timeView = 'week' }: ProjectTimelineItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-500';
      case 'In Progress':
        return 'bg-[#FFE5A0]';
      case 'On Review':
        return 'bg-yellow-500';
      case 'Done':
        return 'bg-green-500';
      case 'On Hold':
        return 'bg-orange-500';
      case 'Canceled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const actionableItems = project.actionable_items || [];
  const completedItems = actionableItems.filter(item => item.is_completed).length;
  const totalItems = actionableItems.length;
  const progressPercentage = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Desktop Timeline Bar */}
      <div className="hidden sm:block relative h-12 bg-muted/30 rounded-lg border border-border/50 overflow-hidden">
        <div 
          className={`absolute h-full rounded-lg cursor-pointer transition-all hover:brightness-110 ${getStatusColor(project.status)}`}
          style={{
            left: position.left,
            width: position.width,
            minWidth: timeView === 'day' ? '40px' : timeView === 'month' ? '20px' : '60px'
          }}
          onClick={() => onProjectClick(project)}
        >
          <div className={`p-2 text-white font-medium truncate ${
            timeView === 'month' ? 'text-xs' : timeView === 'day' ? 'text-sm' : 'text-xs'
          }`}>
            {timeView === 'month' ? project.project_name.substring(0, 15) + (project.project_name.length > 15 ? '...' : '') : project.project_name}
          </div>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <Card className="block sm:hidden">
        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleTrigger asChild>
            <div className="cursor-pointer hover:bg-muted/50 p-3 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-sm truncate flex-1">
                  {project.project_name}
                </div>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="outline"
                    className={`text-xs ${getStatusColor(project.status)} border-none text-white`}
                  >
                    {project.status}
                  </Badge>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </div>
              
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {project.is_draft && (
                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700">
                    Draft
                  </Badge>
                )}
                {project.vertical && (
                  <Badge variant="outline" className="text-xs">
                    {project.vertical}
                  </Badge>
                )}
                {totalItems > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {completedItems}/{totalItems} tasks
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex -space-x-1">
                  {project.collaborators.slice(0, 3).map((collaborator, idx) => (
                    <Avatar key={idx} className="h-5 w-5 border border-background">
                      <AvatarFallback className="text-xs">
                        {collaborator.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {project.collaborators.length > 3 && (
                    <div className="h-5 w-5 rounded-full bg-muted border border-background flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">
                        +{project.collaborators.length - 3}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(new Date(project.start_date), 'MMM d')} - {formatDate(new Date(project.due_date), 'MMM d')}
                </div>
              </div>
            </div>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <CardContent className="pt-0 pb-3 space-y-3">
              {/* Progress Bar */}
              {totalItems > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Progress</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300 bg-blue-500"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Actionable Items */}
              {actionableItems.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Target className="h-3 w-3" />
                    <span>Actionable Items</span>
                  </div>
                  
                  {actionableItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded-md">
                      <div className={`w-2 h-2 rounded-full ${item.is_completed ? 'bg-green-500' : 'bg-gray-400'}`} />
                      
                      <div className="flex-1">
                        <div className={`text-xs ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          {item.type && (
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                              style={{ 
                                backgroundColor: `${getTypeColor(item.type)}20`, 
                                color: getTypeColor(item.type),
                                borderColor: getTypeColor(item.type)
                              }}
                            >
                              {item.type}
                            </Badge>
                          )}
                          
                          {item.collaborator && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <User className="h-3 w-3" />
                              <span>@{item.collaborator.nickname || item.collaborator.name}</span>
                            </div>
                          )}
                          
                          {item.due_date && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span>{formatDate(new Date(item.due_date), 'MMM d')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <CheckSquare className={`h-4 w-4 ${item.is_completed ? 'text-green-600' : 'text-muted-foreground'}`} />
                    </div>
                  ))}
                </div>
              )}

              {/* Project types */}
              {project.types && project.types.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {project.types.map((type) => (
                    <Badge 
                      key={type}
                      variant="outline" 
                      className="text-xs"
                      style={{ 
                        backgroundColor: `${getTypeColor(type)}20`, 
                        color: getTypeColor(type) 
                      }}
                    >
                      {type}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Action button */}
              <div className="pt-2">
                <button
                  onClick={() => onProjectClick(project)}
                  className="w-full text-xs text-primary hover:underline"
                >
                  View Details
                </button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Desktop Actionable Items Overlay */}
      {actionableItems.length > 0 && (
        <div className="hidden sm:block">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {project.project_name} - {completedItems}/{totalItems} tasks ({progressPercentage}%)
            </span>
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {actionableItems.map((item, index) => {
              // Distribute items across the week view
              const dayIndex = index % 7;
              const itemWidth = 100 / 7;
              
              return (
                <div
                  key={item.id}
                  className={`h-6 rounded text-xs flex items-center justify-center text-white transition-all cursor-pointer hover:brightness-110 ${
                    item.is_completed ? 'bg-green-500' : item.type ? 'opacity-80' : 'bg-gray-500'
                  }`}
                  style={{
                    backgroundColor: item.type && !item.is_completed ? getTypeColor(item.type) : undefined
                  }}
                  title={`${item.title} ${item.collaborator ? `(@${item.collaborator.name})` : ''}`}
                >
                  <span className="truncate px-1">{item.title}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}