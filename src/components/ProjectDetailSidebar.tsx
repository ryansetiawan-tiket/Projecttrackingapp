import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from './ui/sheet';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from './ui/drawer';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Progress } from './ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
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
  Link as LinkIcon,
  Flag,
  Users,
  ImageIcon,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  Package
} from 'lucide-react';
import { LightroomIcon } from './icons/LightroomIcon';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import Slider from 'react-slick';
import { Project, Collaborator, ActionableItem } from '../types/project';
import { useColors } from './ColorContext';
import { getContrastColor } from '../utils/colorUtils';
import { useLinkLabels } from '../hooks/useLinkLabels';
import { useState, useEffect } from 'react';
import { AssetActionManager } from './AssetActionManager';
import { calculateAssetProgress } from '../utils/taskProgress';
import { formatQuarterBadge } from '../utils/quarterUtils';

// Asset Collapsible Item Component
interface AssetCollapsibleItemProps {
  asset: ActionableItem;
  completedActions: number;
  totalActions: number;
  hasActions: boolean;
  defaultOpen: boolean;
  getStatusColor: (status: string) => string;
  isOpen?: boolean; // Controlled open state from parent
  onOpenChange?: (open: boolean) => void; // Callback when open changes
  onAllActionsCompleted?: () => void; // Callback when all actions completed
}

function AssetCollapsibleItem({
  asset,
  completedActions,
  totalActions,
  hasActions,
  defaultOpen,
  getStatusColor,
  isOpen: controlledIsOpen,
  onOpenChange,
  onAllActionsCompleted
}: AssetCollapsibleItemProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(defaultOpen);
  
  // Use controlled state if provided, otherwise use internal state
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const setIsOpen = onOpenChange || setInternalIsOpen;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border border-border/40 overflow-hidden bg-card/50 hover:bg-card/80 transition-colors w-full max-w-full">
        {/* Collapsible Header */}
        <CollapsibleTrigger className="w-full max-w-full">
          <div className="flex items-center justify-between gap-3 p-3 hover:bg-muted/30 transition-colors w-full max-w-full">
            {/* Left: Title + Icon */}
            <div className="flex items-center gap-2 flex-1 min-w-0 max-w-full">
              <div className="flex-shrink-0">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
                )}
              </div>
              <h4 className="text-sm font-medium truncate text-left">{asset.title}</h4>
              
              {/* Illustration Type Badge */}
              {asset.illustration_type && (
                <Badge 
                  variant="outline"
                  className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800 flex-shrink-0"
                >
                  {asset.illustration_type}
                </Badge>
              )}
            </div>
            
            {/* Right: Progress Badge + Status */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Progress Badge */}
              {hasActions && (
                <Badge 
                  variant="secondary"
                  className="text-xs px-2 py-0.5 bg-primary/5 text-primary border-primary/20"
                >
                  {Math.round((completedActions / totalActions) * 100)}%
                </Badge>
              )}
              
              {/* Status Badge */}
              <Badge 
                className={`text-xs px-2 py-0.5 border ${getStatusColor(asset.status || 'Not Started')}`}
                variant="outline"
              >
                {asset.status || 'Not Started'}
              </Badge>
            </div>
          </div>
        </CollapsibleTrigger>

        {/* Collapsible Content */}
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3 border-t border-border/30 w-full max-w-full overflow-x-hidden">
            {/* Progress Bar */}
            {hasActions && totalActions > 0 && (
              <div className="pt-3 space-y-1.5 w-full max-w-full">
                <Progress 
                  value={(completedActions / totalActions) * 100} 
                  className="h-1.5 w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground w-full max-w-full">
                  <span className="truncate">{Math.round((completedActions / totalActions) * 100)}% complete</span>
                  <span className="flex-shrink-0">{completedActions} of {totalActions} done</span>
                </div>
              </div>
            )}

            {/* Asset Actions - 2 Column Grid for Desktop */}
            {hasActions && (
              <div className="space-y-1.5 w-full max-w-full overflow-x-hidden">
                <AssetActionManager
                  actions={asset.actions || []}
                  onChange={() => {}} 
                  gridLayout={true}
                  readOnly={true}
                  compact={true}
                  hideProgress={true}
                  gridLayout={true}
                  onAllActionsCompleted={onAllActionsCompleted}
                />
              </div>
            )}

            {/* Asset Meta */}
            {(asset.collaborators && asset.collaborators.length > 0) || asset.due_date ? (
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pt-2 border-t border-border/20 w-full max-w-full">
                {asset.collaborators && asset.collaborators.length > 0 && (
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    <User className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{asset.collaborators.map(c => c.nickname || c.name).join(', ')}</span>
                  </div>
                )}
                {asset.due_date && (
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Calendar className="h-3 w-3 flex-shrink-0" />
                    <span className="whitespace-nowrap">{new Date(asset.due_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface ProjectDetailSidebarProps {
  project: Project | null;
  collaborators: Collaborator[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (project: Project) => void;
  onNavigateToLightroom?: (projectId: string) => void;
  onNavigateToGDrive?: (projectId: string) => void;
  isReadOnly?: boolean; // For public view - no editing allowed
}

export function ProjectDetailSidebar({
  project,
  collaborators,
  isOpen,
  onClose,
  onEdit,
  onNavigateToLightroom,
  onNavigateToGDrive,
  isReadOnly = false
}: ProjectDetailSidebarProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [dueDateOpen, setDueDateOpen] = useState(false);
  const [expandedAssetIds, setExpandedAssetIds] = useState<string[]>([]);
  const { verticalColors, typeColors } = useColors();
  const { linkLabels } = useLinkLabels();

  useEffect(() => {
    const checkScreenSize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Initialize expanded assets when project changes
  useEffect(() => {
    if (project && project.actionable_items) {
      // Expand first asset and assets with < 5 actions by default
      const defaultExpanded = project.actionable_items
        .filter((asset, index) => {
          const totalActions = asset.actions?.length || 0;
          return index === 0 || totalActions < 5;
        })
        .map(asset => asset.id);
      setExpandedAssetIds(defaultExpanded);
    }
  }, [project?.id]); // Re-init when project changes

  if (!project) return null;

  // Helper function to render custom icon
  const renderLinkIcon = (label: string) => {
    const linkLabel = linkLabels?.find(ll => ll.label.toLowerCase() === label.toLowerCase());
    
    if (!linkLabel) {
      return <LinkIcon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />;
    }

    if (linkLabel.icon_type === 'emoji') {
      return <span className="text-lg leading-none">{linkLabel.icon_value}</span>;
    } else if (linkLabel.icon_type === 'svg') {
      return (
        <div 
          className="w-5 h-5 flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto [&_svg]:transition-colors" 
          dangerouslySetInnerHTML={{ __html: linkLabel.icon_value }}
        />
      );
    } else {
      return <LinkIcon className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />;
    }
  };

  // Helper functions
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'Not set';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      return date.toLocaleDateString('en-US', { 
        weekday: 'short',
        month: 'short', 
        day: 'numeric', 
        year: 'numeric'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getQuarter = (dateString?: string | null) => {
    if (!dateString) return 'Q?';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Q?';
      const month = date.getMonth();
      const year = date.getFullYear();
      const quarter = Math.floor(month / 3) + 1;
      return `Q${quarter} ${year}`;
    } catch {
      return 'Q?';
    }
  };

  // Calculate working days (Mon-Fri) between two dates
  const getWorkingDays = (startDate: string | null | undefined, endDate: string | null | undefined): number | null => {
    if (!startDate || !endDate) return null;
    
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return null;
      
      let count = 0;
      const current = new Date(start);
      
      while (current <= end) {
        const dayOfWeek = current.getDay();
        // 1-5 = Monday-Friday (0 = Sunday, 6 = Saturday)
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
          count++;
        }
        current.setDate(current.getDate() + 1);
      }
      
      return count;
    } catch {
      return null;
    }
  };

  // Get days until deadline (same logic as ProjectTable)
  const getDaysUntilDeadline = (dateString: string | null | undefined): number | null => {
    if (!dateString) return null;
    
    try {
      const deadline = new Date(dateString);
      if (isNaN(deadline.getTime())) return null;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      deadline.setHours(0, 0, 0, 0);
      
      const diffTime = deadline.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      return diffDays;
    } catch {
      return null;
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

  const getCollaboratorInfo = (collabId: string | any) => {
    // Handle if collabId is not a string
    const id = typeof collabId === 'string' ? collabId : String(collabId || '');
    const collab = collaborators.find(c => c.id === id || c.nickname === id || c.name === id);
    return collab || { name: id, nickname: id };
  };

  const getInitials = (name: string | any) => {
    // Ensure name is a string and not empty
    const safeName = name && typeof name === 'string' ? name : 'N/A';
    return safeName
      .split(' ')
      .filter(n => n.length > 0)
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'NA';
  };

  // Date handling functions
  const convertToCalendarDate = (dateString?: string | null) => {
    if (!dateString) return undefined;
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      return new Date(year, month - 1, day);
    } catch {
      return undefined;
    }
  };

  const convertToDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTodayString = () => {
    const today = new Date();
    return convertToDateString(today);
  };

  const handleDateUpdate = async (dateType: 'start_date' | 'due_date', date: Date | undefined) => {
    if (!date || !project) return;
    
    const dateString = convertToDateString(date);
    
    try {
      // Update via API
      await api.updateProject(project.id, { [dateType]: dateString });
      
      // Call parent update handler if provided
      if (onProjectUpdate) {
        onProjectUpdate(project.id, { [dateType]: dateString });
      }
      
      toast.success(`${dateType === 'start_date' ? 'Start date' : 'Due date'} updated successfully`);
      
      // Close popover
      if (dateType === 'start_date') {
        setStartDateOpen(false);
      } else {
        setDueDateOpen(false);
      }
    } catch (error) {
      console.error(`Error updating ${dateType}:`, error);
      toast.error(`Failed to update ${dateType === 'start_date' ? 'start date' : 'due date'}`);
    }
  };

  const handleSetToday = async (dateType: 'start_date' | 'due_date') => {
    if (!project) return;
    
    const todayString = getTodayString();
    
    try {
      await api.updateProject(project.id, { [dateType]: todayString });
      
      if (onProjectUpdate) {
        onProjectUpdate(project.id, { [dateType]: todayString });
      }
      
      toast.success(`${dateType === 'start_date' ? 'Start date' : 'Due date'} set to today`);
      
      if (dateType === 'start_date') {
        setStartDateOpen(false);
      } else {
        setDueDateOpen(false);
      }
    } catch (error) {
      console.error(`Error setting ${dateType} to today:`, error);
      toast.error(`Failed to set ${dateType === 'start_date' ? 'start date' : 'due date'}`);
    }
  };

  const renderContent = () => (
    <ScrollArea className="h-full md:scrollbar-thin scrollbar-hide overflow-x-hidden">
      <div className="space-y-6 md:space-y-8 p-4 md:p-6 pb-6 md:pb-8 w-full max-w-full overflow-x-hidden">
        {/* Project Name & Badges */}
        <div className="space-y-3 w-full max-w-full">
          <h2 className="text-xl md:text-2xl leading-tight break-words w-full">
            {project.project_name}
          </h2>
          
          {/* Badges Row */}
          <div className="flex flex-wrap items-center gap-2 justify-between w-full max-w-full">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              {project.vertical && (
                <Badge 
                  variant="outline"
                  className="uppercase text-xs tracking-wide px-2.5 py-1 border-0 flex-shrink-0"
                  style={{ 
                    backgroundColor: 'transparent',
                    color: verticalColors[project.vertical] || '#6b7280'
                  }}
                >
                  <Flag className="h-3 w-3 mr-1.5" />
                  {project.vertical}
                </Badge>
              )}
              <Badge 
                className={`text-xs px-2.5 py-1 border flex-shrink-0 ${getStatusColor(project.status)}`}
              >
                {project.status}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-2 items-center flex-shrink-0">
              <span className="text-xs text-muted-foreground/70 whitespace-nowrap flex-shrink-0">
                {getQuarter(project.start_date || project.due_date)}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {project.description && (
          <div className="space-y-3 pb-6 border-b border-border/20 w-full max-w-full">
            <div className="flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Description
              </h3>
            </div>
            <div className="py-3 px-4 bg-muted/40 rounded-lg border border-border/50 w-full max-w-full overflow-x-hidden">
              <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words w-full">
                {project.description}
              </p>
            </div>
          </div>
        )}

        {/* Mobile: Links & Deliverables Side by Side */}
        {((project.figma_link || project.lightroom || (project.other_links && project.other_links.length > 0) || (project.links?.labeled && project.links.labeled.length > 0)) || 
          ((project.lightroom_assets && project.lightroom_assets.length > 0) || (project.gdrive_assets && project.gdrive_assets.length > 0))) && (
          <div className="md:hidden grid grid-cols-2 gap-4 pb-6 border-b border-border/20 w-full max-w-full overflow-x-hidden">
            {/* Links Column */}
            {(project.figma_link || project.lightroom || (project.other_links && project.other_links.length > 0) || (project.links?.labeled && project.links.labeled.length > 0)) && (
              <div className="space-y-3 w-full max-w-full overflow-x-hidden min-w-0">
                <div className="flex items-center gap-2 w-full max-w-full">
                  <LinkIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    Links
                  </h3>
                </div>
                <TooltipProvider>
                  {(() => {
                    // Collect all links into a single array
                    const allLinks: Array<{ 
                      id: string; 
                      url: string; 
                      label: string; 
                      icon: () => JSX.Element 
                    }> = [];
                    
                    if (project.figma_link) {
                      allLinks.push({
                        id: 'figma',
                        url: project.figma_link,
                        label: 'Figma',
                        icon: () => renderLinkIcon('Figma')
                      });
                    }
                    
                    if (project.lightroom) {
                      allLinks.push({
                        id: 'lightroom',
                        url: project.lightroom,
                        label: 'Lightroom',
                        icon: () => renderLinkIcon('Lightroom')
                      });
                    }
                    
                    if (project.other_links) {
                      project.other_links.forEach((link, index) => {
                        const matchingLabel = linkLabels?.find(ll => link.includes(ll.label.toLowerCase()));
                        const label = matchingLabel?.label || `Link ${index + 1}`;
                        allLinks.push({
                          id: `other-${index}`,
                          url: link,
                          label: label,
                          icon: () => matchingLabel ? renderLinkIcon(matchingLabel.label) : <LinkIcon className="h-5 w-5" />
                        });
                      });
                    }
                    
                    if (project.links?.labeled) {
                      project.links.labeled.forEach((link) => {
                        allLinks.push({
                          id: link.id,
                          url: link.url,
                          label: link.label,
                          icon: () => renderLinkIcon(link.label)
                        });
                      });
                    }
                    
                    // If 3 or fewer links, show static grid
                    if (allLinks.length <= 3) {
                      return (
                        <div className="flex flex-wrap gap-2">
                          {allLinks.map((link) => (
                            <div key={link.id} className="flex flex-col items-center gap-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white group"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      window.open(link.url, '_blank');
                                    }}
                                  >
                                    {link.icon()}
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{link.label}</p>
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-[10px] text-muted-foreground leading-none max-w-[44px] truncate text-center">{link.label}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    
                    // If more than 3 links, use carousel
                    const carouselSettings = {
                      dots: true,
                      infinite: false,
                      speed: 300,
                      slidesToShow: 1,
                      slidesToScroll: 1,
                      arrows: false,
                      swipeToSlide: true,
                      touchThreshold: 10,
                      customPaging: () => <div />
                    };
                    
                    // Group links into pages of 3
                    const pages: typeof allLinks[] = [];
                    for (let i = 0; i < allLinks.length; i += 3) {
                      pages.push(allLinks.slice(i, i + 3));
                    }
                    
                    return (
                      <div className="links-carousel pb-6">
                        <Slider {...carouselSettings}>
                          {pages.map((pageLinks, pageIndex) => (
                            <div key={pageIndex}>
                              <div className="flex flex-wrap gap-2 px-1">
                                {pageLinks.map((link) => (
                                  <div key={link.id} className="flex flex-col items-center gap-1">
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white group"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(link.url, '_blank');
                                          }}
                                        >
                                          {link.icon()}
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{link.label}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                    <span className="text-[10px] text-muted-foreground leading-none max-w-[44px] truncate text-center">{link.label}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </Slider>
                      </div>
                    );
                  })()}
                </TooltipProvider>
              </div>
            )}
            
            {/* Deliverables Column */}
            {((project.lightroom_assets && project.lightroom_assets.length > 0) || (project.gdrive_assets && project.gdrive_assets.length > 0)) && (
              <div className="space-y-3 w-full max-w-full overflow-hidden min-w-0">
                <div className="flex items-center gap-2 w-full max-w-full">
                  <Package className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                    Deliverables
                  </h3>
                </div>
                <TooltipProvider>
                  <div className="flex flex-wrap gap-2 w-full max-w-full overflow-hidden">
                    {project.lightroom_assets && project.lightroom_assets.length > 0 && onNavigateToLightroom && (
                      <div className="flex flex-col items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white group"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isReadOnly && onNavigateToLightroom) {
                                  onNavigateToLightroom(project.id);
                                }
                              }}
                              disabled={isReadOnly}
                            >
                              <LightroomIcon className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lightroom ({project.lightroom_assets.length} {project.lightroom_assets.length === 1 ? 'asset' : 'assets'})</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-[10px] text-muted-foreground leading-none">Lightroom</span>
                      </div>
                    )}
                    {project.gdrive_assets && project.gdrive_assets.length > 0 && onNavigateToGDrive && (
                      <div className="flex flex-col items-center gap-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white group"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isReadOnly && onNavigateToGDrive) {
                                  onNavigateToGDrive(project.id);
                                }
                              }}
                              disabled={isReadOnly}
                            >
                              <GoogleDriveIcon className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Google Drive ({project.gdrive_assets.length} {project.gdrive_assets.length === 1 ? 'asset' : 'assets'})</p>
                          </TooltipContent>
                        </Tooltip>
                        <span className="text-[10px] text-muted-foreground leading-none">GDrive</span>
                      </div>
                    )}
                  </div>
                </TooltipProvider>
              </div>
            )}
          </div>
        )}

        {/* Desktop: Links & Deliverables Section (Combined) */}
        {((project.figma_link || project.lightroom || (project.other_links && project.other_links.length > 0) || (project.links?.labeled && project.links.labeled.length > 0)) || 
          ((project.lightroom_assets && project.lightroom_assets.length > 0) || (project.gdrive_assets && project.gdrive_assets.length > 0))) && (
          <div className="hidden md:block pb-6 border-b border-border/20 w-full max-w-full">
            <div className="flex gap-8 w-full max-w-full">
              {/* Links Column */}
              {(project.figma_link || project.lightroom || (project.other_links && project.other_links.length > 0) || (project.links?.labeled && project.links.labeled.length > 0)) && (
                <div className="space-y-3 w-full max-w-full overflow-hidden min-w-0" style={{ flex: '1 1 0%' }}>
                  <div className="flex items-center gap-2 w-full max-w-full">
                    <LinkIcon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                      Links
                    </h3>
                  </div>
                  <TooltipProvider>
                    <div className="flex flex-wrap gap-3 w-full max-w-full">
                      {project.figma_link && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white group"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(project.figma_link!, '_blank');
                              }}
                            >
                              {renderLinkIcon('Figma')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Figma</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {project.lightroom && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white group"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(project.lightroom!, '_blank');
                              }}
                            >
                              {renderLinkIcon('Lightroom')}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lightroom</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {project.other_links && project.other_links.map((link, index) => {
                        // Try to find matching linkLabel by URL or use generic
                        const matchingLabel = linkLabels?.find(ll => link.includes(ll.label.toLowerCase()));
                        const label = matchingLabel?.label || `Link ${index + 1}`;
                        return (
                          <Tooltip key={index}>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white group"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(link, '_blank');
                                }}
                              >
                                {matchingLabel ? renderLinkIcon(matchingLabel.label) : <LinkIcon className="h-5 w-5" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{label}</p>
                            </TooltipContent>
                          </Tooltip>
                        );
                      })}
                      {/* New flexible structure for labeled links */}
                      {project.links?.labeled && project.links.labeled.map((link) => (
                        <Tooltip key={link.id}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white group"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(link.url, '_blank');
                              }}
                            >
                              {renderLinkIcon(link.label)}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{link.label}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </div>
                  </TooltipProvider>
                </div>
              )}
              
              {/* Deliverables Column */}
              {((project.lightroom_assets && project.lightroom_assets.length > 0) || (project.gdrive_assets && project.gdrive_assets.length > 0)) && (
                <div className="space-y-3 overflow-hidden min-w-0">
                  <div className="flex items-center gap-2 justify-end">
                    <Package className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                      Deliverables
                    </h3>
                  </div>
                  <TooltipProvider>
                    <div className={`flex flex-wrap gap-3 ${project.links && project.links.length > 0 ? 'justify-end' : 'justify-start'}`}>
                      {project.lightroom_assets && project.lightroom_assets.length > 0 && onNavigateToLightroom && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white group"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isReadOnly && onNavigateToLightroom) {
                                  onNavigateToLightroom(project.id);
                                }
                              }}
                              disabled={isReadOnly}
                            >
                              <LightroomIcon className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Lightroom ({project.lightroom_assets.length} {project.lightroom_assets.length === 1 ? 'asset' : 'assets'})</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {project.gdrive_assets && project.gdrive_assets.length > 0 && onNavigateToGDrive && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white group"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isReadOnly && onNavigateToGDrive) {
                                  onNavigateToGDrive(project.id);
                                }
                              }}
                              disabled={isReadOnly}
                            >
                              <GoogleDriveIcon className="h-5 w-5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Google Drive ({project.gdrive_assets.length} {project.gdrive_assets.length === 1 ? 'asset' : 'assets'})</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </TooltipProvider>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Timeline Section */}
        <div className="space-y-3 pb-6 border-b border-border/20 w-full max-w-full">
          <div className="flex items-center gap-2 flex-wrap w-full max-w-full">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Timeline
              </h3>
            </div>
            {/* Timeline Meta Info */}
            <div className="flex items-center gap-2 text-xs min-h-[18px]">
              {(() => {
                const workingDays = getWorkingDays(project.start_date, project.due_date);
                const daysLeft = getDaysUntilDeadline(project.due_date);
                const isUrgent = daysLeft !== null && project.status !== 'Done' && daysLeft <= 7;
                
                // Urgent state: Show "X days left (X working days)"
                if (isUrgent) {
                  const urgencyColor = 
                    daysLeft < 0 ? 'text-red-600 dark:text-red-400' :
                    daysLeft === 0 ? 'text-orange-600 dark:text-orange-400' :
                    daysLeft <= 3 ? 'text-orange-600 dark:text-orange-400' :
                    'text-yellow-600 dark:text-yellow-500';
                  
                  const urgencyText = 
                    daysLeft < 0 ? `${Math.abs(daysLeft)} days overdue` : 
                    daysLeft === 0 ? 'Due today' : 
                    `${daysLeft} days left`;
                  
                  return (
                    <>
                      <span className="opacity-50">•</span>
                      <span className={urgencyColor}>{urgencyText}</span>
                      {workingDays !== null && (
                        <span className="text-muted-foreground">({workingDays} working days)</span>
                      )}
                    </>
                  );
                }
                
                // Default state: Show only "X working days"
                if (workingDays !== null) {
                  return (
                    <>
                      <span className="opacity-50">•</span>
                      <span className="text-muted-foreground">{workingDays} working days</span>
                    </>
                  );
                }
                
                return null;
              })()}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 w-full max-w-full">
            <div className="space-y-1 min-w-0">
              <div className="text-xs text-muted-foreground">Start Date</div>
              <div className="text-sm font-medium truncate">{formatDate(project.start_date)}</div>
            </div>
            <div className="space-y-1 min-w-0">
              <div className="text-xs text-muted-foreground">Due Date</div>
              <div className="text-sm font-medium truncate">{formatDate(project.due_date)}</div>
            </div>
          </div>
          {project.sprint && (
            <div className="pt-2">
              <div className="text-xs text-muted-foreground mb-1">Sprint</div>
              <div className="text-sm font-medium">{project.sprint}</div>
            </div>
          )}
        </div>



        {/* Tasks Section */}
        {project.actionable_items && project.actionable_items.length > 0 && (() => {
          // Collect unique illustration types from project-level AND asset-level
          const typesSet = new Set<string>();
          
          // Add project-level types first
          if (Array.isArray(project.types) && project.types.length > 0) {
            project.types.forEach(type => typesSet.add(type));
          } else if (project.type) {
            typesSet.add(project.type);
          }
          
          // Then add asset-level types
          project.actionable_items.forEach(asset => {
            if (asset.type) typesSet.add(asset.type);
          });
          
          const uniqueTypes = Array.from(typesSet);
          const displayTypes = uniqueTypes.slice(0, 3); // Max 3 types
          const remainingTypes = uniqueTypes.slice(3);
          const remainingCount = remainingTypes.length;

          return (
            <div className="space-y-3 pb-6 border-b border-border/20 w-full max-w-full">
              {/* Header with Progress */}
              <div className="space-y-2 w-full max-w-full">
                <div className="flex items-center gap-2 w-full max-w-full">
                  <CheckSquare className="h-3.5 w-3.5 text-muted-foreground" />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Assets ({project.actionable_items.filter(item => item.is_completed || item.status === 'Done').length}/{project.actionable_items.length})
                  </h3>
                  {uniqueTypes.length > 0 && (
                    <TooltipProvider delayDuration={200}>
                      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
                        {displayTypes.map((type) => (
                          <Badge 
                            key={type}
                            className="text-[10px] h-4 px-1.5 border-0" 
                            style={{ 
                              backgroundColor: `${typeColors[type] || '#6b7280'}20`,
                              color: typeColors[type] || '#6b7280'
                            }}
                          >
                            {type}
                          </Badge>
                        ))}
                        {remainingCount > 0 && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex">
                                <Badge 
                                  variant="secondary"
                                  className="text-[10px] h-4 px-1.5 cursor-help"
                                >
                                  +{remainingCount}
                                </Badge>
                              </span>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="max-w-xs">
                              <p className="text-xs">
                                {remainingTypes.join(', ')}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                    </TooltipProvider>
                  )}
                </div>
              
              {/* Overall Progress Bar */}
              <div className="space-y-1.5 w-full max-w-full">
                <Progress 
                  value={(project.actionable_items.filter(item => item.is_completed || item.status === 'Done').length / project.actionable_items.length) * 100} 
                  className="h-2 w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground w-full max-w-full">
                  <span className="truncate">
                    {Math.round((project.actionable_items.filter(item => item.is_completed || item.status === 'Done').length / project.actionable_items.length) * 100)}% Complete
                  </span>
                  {project.actionable_items.length > 1 && (
                    <span className="flex-shrink-0 whitespace-nowrap">
                      {project.actionable_items.filter(item => item.is_completed || item.status === 'Done').length} of {project.actionable_items.length} done
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Asset List - Collapsible */}
            <div className="space-y-2 w-full max-w-full overflow-x-hidden">
              {project.actionable_items.map((asset, index) => {
                const progress = calculateAssetProgress(asset.actions);
                const hasActions = asset.actions && asset.actions.length > 0;
                const completedActions = asset.actions?.filter(a => a.is_completed).length || 0;
                const totalActions = asset.actions?.length || 0;
                const isExpanded = expandedAssetIds.includes(asset.id);
                
                return (
                  <AssetCollapsibleItem
                    key={asset.id}
                    asset={asset}
                    completedActions={completedActions}
                    totalActions={totalActions}
                    hasActions={hasActions}
                    defaultOpen={index === 0 || totalActions < 5}
                    getStatusColor={getStatusColor}
                    isOpen={isExpanded}
                    onOpenChange={(open) => {
                      if (open) {
                        setExpandedAssetIds(prev => [...prev, asset.id]);
                      } else {
                        setExpandedAssetIds(prev => prev.filter(id => id !== asset.id));
                      }
                    }}
                    onAllActionsCompleted={() => {
                      // Only trigger auto-collapse/expand if there are multiple assets
                      if (project.actionable_items.length > 1) {
                        console.log(`[ProjectDetailSidebar] 🎯 Asset "${asset.title}" completed! Auto-collapsing and expanding next incomplete asset...`);
                        
                        // Close current asset
                        setExpandedAssetIds(prev => prev.filter(id => id !== asset.id));
                        
                        // Find next INCOMPLETE asset (skip already completed ones)
                        const nextIncompleteAsset = project.actionable_items.slice(index + 1).find(a => {
                          // Asset is incomplete if:
                          // 1. Has no actions, OR
                          // 2. Has actions but not all completed
                          if (!a.actions || a.actions.length === 0) {
                            return true; // Empty asset = not complete
                          }
                          return a.actions.some(action => !action.is_completed);
                        });
                        
                        if (nextIncompleteAsset) {
                          console.log(`[ProjectDetailSidebar] ➡️ Opening next incomplete asset: "${nextIncompleteAsset.title}"`);
                          setTimeout(() => {
                            setExpandedAssetIds(prev => [...prev, nextIncompleteAsset.id]);
                          }, 300); // Delay to allow collapse animation to finish
                        } else {
                          console.log(`[ProjectDetailSidebar] 🎉 All assets completed! No more incomplete assets.`);
                        }
                      }
                    }}
                  />
                );
              })}
            </div>
          </div>
          );
        })()}

        {/* Collaborators */}
        {project.collaborators && project.collaborators.length > 0 && (
          <div className="space-y-3 w-full max-w-full">
            <div className="flex items-center gap-2 w-full max-w-full">
              <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider truncate">
                Collaborators
              </h3>
            </div>
            <div className="space-y-2 w-full max-w-full">
              {project.collaborators.map((collab, index) => {
                // Handle both object and string formats for backward compatibility
                const collabData = typeof collab === 'string' 
                  ? getCollaboratorInfo(collab) 
                  : collab;
                const displayName = collabData.nickname || collabData.name || 'Unknown';
                const hasProfileUrl = collabData.profile_url && collabData.profile_url.trim() !== '';
                
                const content = (
                  <>
                    <Avatar className="h-9 w-9 border-2 border-border flex-shrink-0">
                      {collabData.photo_url && (
                        <img 
                          src={collabData.photo_url} 
                          alt={displayName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <AvatarFallback className="text-xs font-medium bg-muted">
                        {getInitials(displayName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{displayName}</p>
                      {collabData.role && (
                        <p className="text-xs text-muted-foreground truncate">{collabData.role}</p>
                      )}
                    </div>
                    {hasProfileUrl && (
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                    )}
                  </>
                );
                
                if (hasProfileUrl) {
                  return (
                    <a
                      key={index}
                      href={collabData.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 py-2.5 px-3 bg-muted/30 hover:bg-muted/50 rounded-lg border border-border/30 transition-colors group cursor-pointer w-full max-w-full min-w-0"
                    >
                      {content}
                    </a>
                  );
                } else {
                  return (
                    <div key={index} className="flex items-center gap-3 py-2.5 px-3 bg-muted/30 rounded-lg border border-border/30 w-full max-w-full min-w-0">
                      {content}
                    </div>
                  );
                }
              })}
            </div>
          </div>
        )}

      </div>
    </ScrollArea>
  );

  // Desktop: Sheet (sidebar from right)
  if (isDesktop) {
    return (
      <Sheet 
        open={isOpen} 
        modal={true}
        onOpenChange={(open) => {
          if (!open) {
            // User closed sheet - call onClose which handles navigation
            onClose();
          }
        }}
      >
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-[480px] lg:max-w-[540px] p-0 flex flex-col gap-0"
          hideClose={true}
          onInteractOutside={(e) => {
            // Allow closing when clicking outside
            onClose();
          }}
        >
          {/* Header */}
          <SheetHeader className="px-6 py-5 border-b shrink-0 space-y-0">
            <div className="flex items-center justify-between gap-3">
              <SheetTitle className="text-lg">
                Project Details{isReadOnly && <span className="ml-2 text-sm text-muted-foreground">(View Only)</span>}
              </SheetTitle>
              <div className="flex items-center gap-2">
                {!isReadOnly ? (
                  <Button
                    onClick={() => onEdit(project)}
                    size="sm"
                  >
                    <Edit className="h-3.5 w-3.5 mr-1.5" />
                    Edit Project
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  className="bg-muted/50 hover:bg-muted border-border/50"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <SheetDescription className="sr-only">
              {project.project_name ? `Viewing details for ${project.project_name}` : 'View and edit project information'}
            </SheetDescription>
          </SheetHeader>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            {renderContent()}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Mobile: Drawer (from bottom)
  return (
    <Drawer 
      open={isOpen} 
      modal={true}
      onOpenChange={(open) => {
        if (!open) {
          // User closed drawer (swipe down or click outside) - call onClose which handles navigation
          onClose();
        }
      }}
    >
      <DrawerContent 
        className="max-h-[92vh] flex flex-col w-full max-w-full overflow-hidden"
        onInteractOutside={(e) => {
          // Allow closing when clicking outside
          onClose();
        }}
      >
        <DrawerHeader className="border-b shrink-0 px-4 py-3 w-full max-w-full">
          <div className="flex items-center justify-between gap-3 w-full max-w-full">
            <DrawerTitle className="text-lg">
              Project Details{isReadOnly && <span className="ml-2 text-sm text-muted-foreground">(View Only)</span>}
            </DrawerTitle>
            <div className="flex items-center gap-2">
              {!isReadOnly ? (
                <Button
                  onClick={() => onEdit(project)}
                  size="sm"
                  variant="outline"
                >
                  <Edit className="h-3.5 w-3.5 mr-1.5" />
                  Edit
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <DrawerDescription className="sr-only">
            {project.project_name ? `Viewing details for ${project.project_name}` : 'View and edit project information'}
          </DrawerDescription>
        </DrawerHeader>
        
        <div className="flex-1 overflow-hidden min-h-0 w-full max-w-full">
          {renderContent()}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
