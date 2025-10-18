import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Card, CardContent } from './ui/card';
import { 
  ExternalLink, 
  Calendar, 
  User, 
  Clock, 
  Target, 
  Edit,
  X,
  CheckCircle,
  Circle,
  FileText,
  Link as LinkIcon
} from 'lucide-react';
import { Project, Collaborator } from '../types/project';
import { useColors } from './ColorContext';
import { getContrastColor } from '../utils/colorUtils';
import { DateWithQuarter } from './DateWithQuarter';

interface ProjectInfoProps {
  project: Project;
  collaborators: Collaborator[];
  onClose: () => void;
  onEdit: (project: Project) => void;
}

export function ProjectInfo({
  project,
  collaborators,
  onClose,
  onEdit
}: ProjectInfoProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const { verticalColors, typeColors } = useColors();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Helper functions removed - using DateWithQuarter component instead

  const getQuarter = (dateString?: string | null) => {
    if (!dateString || dateString === '' || dateString === null || dateString === undefined) {
      return 'Q?';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Q?';
      }
      
      const month = date.getMonth();
      const year = date.getFullYear();
      const quarter = Math.floor(month / 3) + 1;
      
      return `Q${quarter} ${year}`;
    } catch (error) {
      console.warn('Error calculating quarter:', dateString, error);
      return 'Q?';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Not Started':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'In Progress':
        return 'bg-[#FFE5A0] text-[#8B6914] border-[#FFD666]';
      case 'Done':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Canceled':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'On List Lightroom':
        return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'On Review':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Progress':
        return <Clock className="h-4 w-4" />;
      case 'Done':
        return <Target className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const renderProjectInfo = () => (
    <div className="space-y-6 min-h-full">
      {/* Header with Title and Edit Button */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{project.project_name}</h2>
          <div className="flex flex-wrap items-center gap-2">
            {project.vertical && (
              <Badge 
                className="text-sm font-medium px-3 py-1"
                style={{ 
                  backgroundColor: verticalColors[project.vertical] || '#6b7280',
                  color: getContrastColor(verticalColors[project.vertical] || '#6b7280'),
                  border: 'none'
                }}
              >
                {project.vertical}
              </Badge>
            )}
            <Badge 
              className={`text-sm font-medium px-3 py-1 flex items-center gap-2 ${getStatusColor(project.status)}`}
              variant="outline"
            >
              {getStatusIcon(project.status)}
              {project.status}
            </Badge>
            <Badge 
              className="text-sm font-mono bg-blue-50 text-blue-700 border-blue-200"
              variant="outline"
            >
              {getQuarter(project.start_date || project.due_date)}
            </Badge>
          </div>
        </div>
        <Button
          onClick={() => onEdit(project)}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Project
        </Button>
      </div>

      {/* Project Types */}
      {((project.types && project.types.length > 0) || project.type) && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Types
            </h3>
            <div className="flex flex-wrap gap-2">
              {project.types && project.types.length > 0 ? (
                project.types.map((type, index) => (
                  <Badge 
                    key={index}
                    className="text-sm font-medium px-3 py-1 border-0" 
                    style={{ 
                      backgroundColor: typeColors[type] || '#6b7280',
                      color: getContrastColor(typeColors[type] || '#6b7280')
                    }}
                  >
                    {type}
                  </Badge>
                ))
              ) : project.type ? (
                <Badge 
                  className="text-sm font-medium px-3 py-1 border-0" 
                  style={{ 
                    backgroundColor: typeColors[project.type] || '#6b7280',
                    color: getContrastColor(typeColors[project.type] || '#6b7280')
                  }}
                >
                  {project.type}
                </Badge>
              ) : null}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card>
        <CardContent className="p-4">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Timeline
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Start Date</p>
                <p className="font-semibold text-gray-900">
                  <DateWithQuarter dateString={project.start_date} fallbackText="Not set" />
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Target className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 uppercase tracking-wide">Due Date</p>
                <p className="font-semibold text-gray-900">
                  <DateWithQuarter dateString={project.due_date} fallbackText="Not set" />
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collaborators */}
      {project.collaborators && project.collaborators.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Collaborators ({project.collaborators.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {project.collaborators.map((collaborator, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {(collaborator.nickname || collaborator.name)?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {collaborator.nickname || collaborator.name}
                      {collaborator.nickname && (
                        <span className="text-sm text-gray-500 ml-1">({collaborator.name})</span>
                      )}
                    </p>
                    <p className="text-sm text-gray-500">{collaborator.role || 'Collaborator'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tasks/Actionable Items */}
      {project.actionable_items && project.actionable_items.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tasks ({project.actionable_items.filter(item => item.status === 'Done' || item.is_completed).length}/{project.actionable_items.length} completed)
            </h3>
            <div className="space-y-3">
              {project.actionable_items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {item.is_completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  )}
                  <span className={`flex-1 ${item.is_completed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                    {item.title}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Progress bar */}
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-green-500 transition-all duration-300"
                  style={{ 
                    width: `${(project.actionable_items.filter(item => item.status === 'Done' || item.is_completed).length / project.actionable_items.length) * 100}%`
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links */}
      {project.links && (project.links.labeled?.length || Object.keys(project.links).filter(k => k !== 'labeled').length > 0) && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Links & Resources
            </h3>
            <div className="space-y-3">
              {/* Show labeled links first */}
              {project.links.labeled && project.links.labeled.map((link) => (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
                >
                  <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{link.label}</p>
                    <p className="text-sm text-blue-600 hover:text-blue-800 truncate">
                      {link.url}
                    </p>
                  </div>
                </a>
              ))}
              
              {/* Show legacy links (backward compatibility) */}
              {Object.entries(project.links)
                .filter(([key]) => key !== 'labeled' && key !== 'other')
                .map(([key, url]) => url && (
                  <a
                    key={key}
                    href={url as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors group"
                  >
                    <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 group-hover:text-blue-600" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium capitalize">{key.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-blue-600 hover:text-blue-800 truncate">
                        {url as string}
                      </p>
                    </div>
                  </a>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Project Description */}
      {project.description && project.description.trim() && (
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Project Description
            </h3>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 whitespace-pre-wrap">{project.description}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-6 flex flex-col gap-0" aria-describedby={undefined}>
          <DialogHeader className="pr-8 mb-4">
            <DialogTitle>Project Details</DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto -mx-6 px-6 flex-1">
            {renderProjectInfo()}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={true} onOpenChange={onClose}>
      <DrawerContent className="h-[100vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0 flex items-center justify-between border-b">
          <DrawerTitle>Project Details</DrawerTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-safe">
          {renderProjectInfo()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}