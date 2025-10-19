import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Plus, Link as LinkIcon } from 'lucide-react';
import { ProjectLinks } from '../../types/project';
import { getIconById } from '../../utils/premadeIcons';

interface LinksCellProps {
  links: ProjectLinks;
  linkLabels: Array<{ label: string; icon_type?: string; icon_value?: string }>;
  onAddLink?: () => void;
  isHovered?: boolean;
}

// Helper function to get icon for a link
const getLinkIcon = (
  label: string, 
  linkLabels: Array<{ label: string; icon_type?: string; icon_value?: string }>
) => {
  const labelLower = label.toLowerCase();
  
  // Find matching link label from database
  const linkLabel = linkLabels.find(
    ll => ll?.label && ll.label.toLowerCase() === labelLower
  );
  
  // If has custom icon from database
  if (linkLabel?.icon_type === 'svg' && linkLabel.icon_value) {
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: linkLabel.icon_value }} 
        className="w-5 h-5 flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto" 
      />
    );
  }
  
  if (linkLabel?.icon_type === 'emoji' && linkLabel.icon_value) {
    return <span className="text-lg">{linkLabel.icon_value}</span>;
  }
  
  // Check if label matches a preset icon
  const presetIcon = getIconById(labelLower) || 
                     getIconById(labelLower.replace(/\s+/g, '-'));
  
  if (presetIcon) {
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: presetIcon.svg }} 
        className="w-5 h-5 flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto" 
      />
    );
  }
  
  // Fallback to LinkIcon
  return <LinkIcon className="h-4 w-4" />;
};

export function LinksCell({ links, linkLabels, onAddLink, isHovered }: LinksCellProps) {
  // Sort links alphabetically by label
  const sortedLinks = links?.labeled ? [...links.labeled].sort((a, b) => 
    (a.label || '').localeCompare(b.label || '')
  ) : [];

  // Empty state with hover
  if (sortedLinks.length === 0) {
    return (
      <div className="relative inline-flex items-center justify-center group">
        {/* Dash - always visible, hides on hover */}
        <span className="text-xs text-muted-foreground group-hover:opacity-0 transition-opacity">-</span>
        
        {/* Plus button - hidden by default, shows on hover */}
        {onAddLink && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute h-7 w-7 p-0 rounded-full hover:bg-accent transition-all duration-200 hover:scale-105 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddLink();
                  }}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add link</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-1 items-center relative">
        {sortedLinks.length > 0 ? (
          <>
            {sortedLinks.slice(0, 2).map((link) => {
              // Safety check for link.label
              if (!link.label) return null;
              
              return (
                <Tooltip key={link.id}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(link.url, '_blank');
                      }}
                    >
                      {getLinkIcon(link.label, linkLabels)}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{link.label}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
            {sortedLinks.length > 2 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs h-6 px-2 cursor-help">
                    +{sortedLinks.length - 2}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <div className="space-y-1">
                    {sortedLinks.slice(2).map((link) => (
                      <div key={link.id}>{link.label}</div>
                    ))}
                  </div>
                </TooltipContent>
              </Tooltip>
            )}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
        
        {/* Plus button - Absolute positioned, shows on hover when there are existing links */}
        {onAddLink && sortedLinks.length > 0 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`absolute -right-8 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full hover:bg-accent transition-opacity ${
                  isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onAddLink();
                }}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add link</p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  );
}