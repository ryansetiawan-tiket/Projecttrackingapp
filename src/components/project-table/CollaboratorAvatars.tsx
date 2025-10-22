import { useState } from 'react';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { UserPlus, Search, Users } from 'lucide-react';
import { Collaborator, ProjectCollaborator } from '../../types/project';
import { openSlackDirectMessage } from '../../utils/slackUtils';

interface CollaboratorAvatarsProps {
  projectId: string;
  projectCollaborators: ProjectCollaborator[];
  allCollaborators: Collaborator[];
  isPublicView: boolean;
  isHovered: boolean;
  onUpdate: (collaborators: ProjectCollaborator[]) => void;
  compactMode?: boolean;
}

// Helper: Get layout classes based on collaborator count
function getLayoutClasses(count: number): string {
  switch (count) {
    case 1:
      return 'flex justify-center'; // Single centered
    case 2:
      return 'flex justify-center gap-3'; // Two side-by-side
    case 3:
      return 'flex justify-center gap-3'; // Three horizontal
    case 4:
      return 'grid grid-cols-2 gap-3 justify-items-center'; // 2×2 grid
    case 5:
      // Custom 3+2 layout: handled separately
      return '';
    case 6:
      return 'grid grid-cols-3 gap-3 justify-items-center'; // 3×2 grid
    default:
      // 7+ will be handled as 5 visible + overflow
      return '';
  }
}

// Helper: Individual collaborator avatar component
interface CollaboratorItemProps {
  collab: ProjectCollaborator;
  index: number;
  compactMode?: boolean;
}

function CollaboratorItem({ collab, index, compactMode = false }: CollaboratorItemProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (collab.profile_url) {
                openSlackDirectMessage(collab.profile_url);
              }
            }}
            disabled={!collab.profile_url}
            className={`${
              collab.profile_url 
                ? 'cursor-pointer hover:scale-110 transition-transform' 
                : 'cursor-default'
            }`}
          >
            <Avatar className="h-9 w-9 border-2 border-border">
              {collab.photo_url ? (
                <img 
                  src={collab.photo_url} 
                  alt={collab.name}
                  className="w-full h-full object-cover rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              <AvatarFallback className="text-xs">
                {collab.name ? collab.name.charAt(0).toUpperCase() : '?'}
              </AvatarFallback>
            </Avatar>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-center">
            <div className="font-medium">{collab.name}</div>
            {collab.role && (
              <div className="text-xs text-muted-foreground">{collab.role}</div>
            )}
            {collab.profile_url && (
              <div className="text-xs text-muted-foreground mt-0.5">Click to chat on Slack</div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
      {!compactMode && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (collab.profile_url) {
              openSlackDirectMessage(collab.profile_url);
            }
          }}
          disabled={!collab.profile_url}
          className={`text-[10px] leading-tight max-w-[50px] truncate ${
            collab.profile_url 
              ? 'text-foreground hover:text-primary cursor-pointer transition-colors' 
              : 'text-foreground cursor-default'
          }`}
          title={collab.profile_url ? `Chat with ${collab.name}` : collab.nickname || collab.name}
        >
          {collab.nickname || collab.name}
        </button>
      )}
    </div>
  );
}

// Overflow indicator component (+N badge with popover)
interface OverflowIndicatorProps {
  overflowCollaborators: ProjectCollaborator[];
  overflowCount: number;
}

function OverflowIndicator({ overflowCollaborators, overflowCount }: OverflowIndicatorProps) {
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const maxDisplayInPopover = 4;
  const displayCollabs = overflowCollaborators.slice(0, maxDisplayInPopover);
  const remainingCount = Math.max(0, overflowCount - maxDisplayInPopover);

  return (
    <div className="flex flex-col items-center gap-1">
      <Popover open={isOverflowOpen} onOpenChange={setIsOverflowOpen}>
        <PopoverTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className="cursor-pointer hover:scale-110 transition-transform"
            title={`${overflowCount} more collaborator${overflowCount > 1 ? 's' : ''}`}
          >
            <Avatar className="h-9 w-9 border-2 border-border bg-muted hover:bg-muted/80 transition-colors">
              <AvatarFallback className="text-xs font-semibold">
                +{overflowCount}
              </AvatarFallback>
            </Avatar>
          </button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-64 p-3" 
          align="center"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">Additional Members</h4>
            </div>
            
            <div className="space-y-2 max-h-56 overflow-y-auto scrollbar-thin">
              {displayCollabs.map((collab, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (collab.profile_url) {
                          openSlackDirectMessage(collab.profile_url);
                          setIsOverflowOpen(false);
                        }
                      }}
                      disabled={!collab.profile_url}
                      className={`flex items-center gap-2 w-full p-2 rounded-md ${
                        collab.profile_url
                          ? 'hover:bg-muted cursor-pointer transition-colors'
                          : 'cursor-default'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        {collab.photo_url ? (
                          <img 
                            src={collab.photo_url} 
                            alt={collab.name}
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        <AvatarFallback className="text-xs">
                          {collab.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm truncate">
                          {collab.nickname || collab.name}
                        </div>
                        {collab.nickname && (
                          <div className="text-xs text-muted-foreground truncate">
                            {collab.name}
                          </div>
                        )}
                      </div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <div className="text-center">
                      <div className="font-medium">{collab.name}</div>
                      {collab.role && (
                        <div className="text-xs text-muted-foreground">{collab.role}</div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
              {remainingCount > 0 && (
                <div className="text-center py-2 text-xs text-muted-foreground border-t">
                  +{remainingCount} more...
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <span className="text-[10px] leading-tight text-muted-foreground">
        More
      </span>
    </div>
  );
}

export function CollaboratorAvatars({
  projectId,
  projectCollaborators,
  allCollaborators,
  isPublicView,
  isHovered,
  onUpdate,
  compactMode = false
}: CollaboratorAvatarsProps) {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCollaborators = allCollaborators.filter(collab => {
    const query = searchQuery.toLowerCase();
    if (!query) return true;
    return (
      collab.name.toLowerCase().includes(query) ||
      (collab.nickname && collab.nickname.toLowerCase().includes(query))
    );
  });

  const handleToggleCollaborator = (collab: Collaborator, checked: boolean) => {
    let updatedCollaborators: ProjectCollaborator[];
    
    if (checked) {
      // Add collaborator
      updatedCollaborators = [...projectCollaborators, {
        id: collab.id,
        name: collab.name,
        nickname: collab.nickname,
        role: collab.role,
        photo_url: collab.photo_url,
        profile_url: collab.profile_url
      }];
    } else {
      // Remove collaborator
      updatedCollaborators = projectCollaborators.filter(c => c.id !== collab.id);
    }
    
    onUpdate(updatedCollaborators);
  };

  return (
    <TooltipProvider>
      <div className="relative group">
        {/* Mobile: Show avatars with photo or initials */}
        <div className="flex -space-x-1.5 md:hidden">
          {projectCollaborators?.slice(0, 3).map((collab, index) => (
            <Tooltip key={index}>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (collab.profile_url) {
                      openSlackDirectMessage(collab.profile_url);
                    }
                  }}
                  disabled={!collab.profile_url}
                  className={`${
                    collab.profile_url 
                      ? 'cursor-pointer hover:z-10 hover:scale-110 transition-transform' 
                      : 'cursor-default'
                  }`}
                >
                  <Avatar className="h-9 w-9 border-2 border-background">
                    {collab.photo_url ? (
                      <img 
                        src={collab.photo_url} 
                        alt={collab.name}
                        className="w-full h-full object-cover rounded-full"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : null}
                    <AvatarFallback className="text-xs">
                      {collab.name ? collab.name.charAt(0).toUpperCase() : '?'}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-medium">{collab.name}</div>
                  {collab.role && (
                    <div className="text-xs text-muted-foreground">Role: {collab.role}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          ))}
          {(projectCollaborators?.length || 0) > 3 && (
            <div className="h-9 w-9 rounded-full bg-muted border-2 border-background flex items-center justify-center">
              <span className="text-xs text-muted-foreground">
                +{(projectCollaborators?.length || 0) - 3}
              </span>
            </div>
          )}
        </div>
        
        {/* Desktop: Show avatars with names and Edit button */}
        <div className="hidden md:flex items-center justify-center relative w-full">
          {projectCollaborators && projectCollaborators.length > 0 ? (
            (() => {
              const totalCount = projectCollaborators.length;
              const maxVisible = 5;
              const showOverflow = totalCount > 6;
              const visibleCollabs = showOverflow 
                ? projectCollaborators.slice(0, maxVisible)
                : projectCollaborators;
              const overflowCollabs = showOverflow 
                ? projectCollaborators.slice(maxVisible)
                : [];
              const overflowCount = overflowCollabs.length;
              
              // Special handling for different counts
              if (totalCount === 5) {
                // 3+2 layout: 3 on top row, 2 on bottom row centered
                return (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex justify-center gap-3">
                      {visibleCollabs.slice(0, 3).map((collab, index) => (
                        <CollaboratorItem key={index} collab={collab} index={index} compactMode={compactMode} />
                      ))}
                    </div>
                    <div className="flex justify-center gap-3">
                      {visibleCollabs.slice(3, 5).map((collab, index) => (
                        <CollaboratorItem key={index + 3} collab={collab} index={index + 3} compactMode={compactMode} />
                      ))}
                    </div>
                  </div>
                );
              } else if (showOverflow) {
                // 7+ members: Show 5 + overflow indicator
                return (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex justify-center gap-3">
                      {visibleCollabs.slice(0, 3).map((collab, index) => (
                        <CollaboratorItem key={index} collab={collab} index={index} compactMode={compactMode} />
                      ))}
                    </div>
                    <div className="flex justify-center gap-3">
                      {visibleCollabs.slice(3, 5).map((collab, index) => (
                        <CollaboratorItem key={index + 3} collab={collab} index={index + 3} compactMode={compactMode} />
                      ))}
                      <OverflowIndicator 
                        overflowCollaborators={overflowCollabs}
                        overflowCount={overflowCount}
                      />
                    </div>
                  </div>
                );
              } else {
                // 1-4 or 6 members: Use standard layout
                const layoutClass = getLayoutClasses(totalCount);
                return (
                  <div className={layoutClass}>
                    {visibleCollabs.map((collab, index) => (
                      <CollaboratorItem key={index} collab={collab} index={index} compactMode={compactMode} />
                    ))}
                  </div>
                );
              }
            })()
          ) : (
            <div className="text-sm text-muted-foreground">No members</div>
          )}
          
          {/* Edit Button - Absolute positioned, shows on hover (hidden for public view) */}
          {!isPublicView && (
            <Popover 
              open={isPopoverOpen}
              onOpenChange={(open) => {
                setIsPopoverOpen(open);
                if (!open) {
                  setSearchQuery('');
                }
              }}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`absolute right-0 top-1/2 -translate-y-1/2 h-7 w-7 p-0 transition-opacity ${
                    isHovered || isPopoverOpen
                      ? 'opacity-100' 
                      : 'opacity-0 pointer-events-none'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-80 p-3" 
                align="start"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Edit Collaborators</h4>
                    <span className="text-xs text-muted-foreground">
                      {projectCollaborators?.length || 0} selected
                    </span>
                  </div>
                  
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search name or nickname..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 h-9 text-sm"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                    {filteredCollaborators.map((collab) => {
                      const isSelected = projectCollaborators?.some(c => c.id === collab.id) || false;
                      return (
                        <div key={collab.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`${projectId}-${collab.id}`}
                            checked={isSelected}
                            onCheckedChange={(checked) => handleToggleCollaborator(collab, !!checked)}
                          />
                          <label
                            htmlFor={`${projectId}-${collab.id}`}
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                          >
                            <Avatar className="h-8 w-8">
                              {collab.photo_url ? (
                                <img 
                                  src={collab.photo_url} 
                                  alt={collab.name}
                                  className="w-full h-full object-cover rounded-full"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              ) : null}
                              <AvatarFallback className="text-xs">
                                {collab.name.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm truncate">
                                {collab.nickname || collab.name}
                              </div>
                              {collab.nickname && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {collab.name}
                                </div>
                              )}
                            </div>
                          </label>
                        </div>
                      );
                    })}
                    {filteredCollaborators.length === 0 && (
                      <div className="text-center py-6 text-sm text-muted-foreground">
                        No collaborators found
                      </div>
                    )}
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}