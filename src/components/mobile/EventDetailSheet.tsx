import { Project } from '../../types/project';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '../ui/drawer';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, User, Tag, Link as LinkIcon, FileText, X } from 'lucide-react';
import { cn } from '../ui/utils';
import { DateWithQuarter } from '../DateWithQuarter';

interface EventDetailSheetProps {
  project: Project | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (project: Project) => void;
  onMarkDone?: (project: Project) => void;
  statusColor: string;
}

export function EventDetailSheet({
  project,
  isOpen,
  onClose,
  onEdit,
  onMarkDone,
  statusColor
}: EventDetailSheetProps) {
  if (!project) return null;



  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[85vh]">
        {/* Handle bar */}
        <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mt-4 mb-2" />
        
        <DrawerHeader className="text-left pb-4 border-b">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-xl pr-8">
                {project.project_name}
              </DrawerTitle>
              <DrawerDescription className="mt-2 text-sm text-muted-foreground">
                {(project.vertical || project.type) ? (
                  <>
                    {project.vertical}
                    {project.type && project.vertical && ' • '}
                    {project.type}
                  </>
                ) : (
                  'View project details'
                )}
              </DrawerDescription>
            </div>
            <DrawerClose className="absolute top-4 right-4 rounded-full p-2 hover:bg-accent touch-manipulation">
              <X className="h-4 w-4" />
            </DrawerClose>
          </div>
        </DrawerHeader>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-4">
          {/* Status Badge */}
          <div>
            <span 
              className="inline-flex items-center px-3 py-1.5 rounded-lg font-medium text-sm"
              style={{ 
                backgroundColor: statusColor + '20',
                color: statusColor
              }}
            >
              {project.status}
            </span>
          </div>

          {/* Date Range */}
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-medium text-foreground mb-1">Timeline</div>
              <div className="text-sm text-muted-foreground">
                <div><DateWithQuarter dateString={project.start_date} fallbackText="Not set" /></div>
                <div className="text-xs my-0.5">to</div>
                <div><DateWithQuarter dateString={project.due_date} fallbackText="Not set" /></div>
              </div>
            </div>
          </div>

          {/* Sprint */}
          {project.sprint && (
            <div className="flex items-start gap-3">
              <Tag className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground mb-1">Sprint</div>
                <div className="text-sm text-muted-foreground">{project.sprint}</div>
              </div>
            </div>
          )}

          {/* Collaborators */}
          {project.collaborators && project.collaborators.length > 0 && (
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground mb-2">Collaborators</div>
                <div className="flex flex-wrap gap-2">
                  {project.collaborators.map((collab, index) => (
                    <Badge key={collab.id || index} variant="secondary" className="text-xs">
                      {collab.nickname || collab.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Figma Link */}
          {project.figma_link && (
            <div className="flex items-start gap-3">
              <LinkIcon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground mb-1">Figma</div>
                <a
                  href={project.figma_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  Open in Figma
                </a>
              </div>
            </div>
          )}

          {/* Lightroom Link */}
          {project.lightroom && (
            <div className="flex items-start gap-3">
              <LinkIcon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground mb-1">Lightroom</div>
                <a
                  href={project.lightroom}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline break-all"
                >
                  Open in Lightroom
                </a>
              </div>
            </div>
          )}

          {/* Other Links */}
          {project.other_links && project.other_links.length > 0 && (
            <div className="flex items-start gap-3">
              <LinkIcon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground mb-2">Other Links</div>
                <div className="space-y-2">
                  {project.other_links.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-blue-600 hover:underline break-all"
                    >
                      {link.label || link.url}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {project.description && (
            <div className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground mb-1">Description</div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {project.description}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <DrawerFooter className="border-t pt-4">
          <div className="flex gap-2">
            {onEdit && (
              <Button
                onClick={() => {
                  onEdit(project);
                  onClose();
                }}
                className="flex-1 h-12 touch-manipulation"
                variant="outline"
              >
                Edit Project
              </Button>
            )}
            {onMarkDone && project.status !== 'Done' && (
              <Button
                onClick={() => {
                  onMarkDone(project);
                  onClose();
                }}
                className="flex-1 h-12 touch-manipulation"
                style={{ 
                  backgroundColor: statusColor,
                  color: 'white'
                }}
              >
                Mark as Done
              </Button>
            )}
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
