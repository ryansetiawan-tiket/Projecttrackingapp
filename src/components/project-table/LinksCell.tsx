import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Plus } from 'lucide-react';
import { ProjectLinks } from '../../types/project';

// Figma Logo Icon Component
const FigmaIcon = () => (
  <svg width="15" height="22.5" viewBox="0 0 12 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-4 h-6">
    <path d="M3 18C4.65685 18 6 16.6569 6 15V12H3C1.34315 12 0 13.3431 0 15C0 16.6569 1.34315 18 3 18Z" fill="#0ACF83"/>
    <path d="M0 9C0 7.34315 1.34315 6 3 6H6V12H3C1.34315 12 0 10.6569 0 9Z" fill="#A259FF"/>
    <path d="M0 3C0 1.34315 1.34315 0 3 0H6V6H3C1.34315 6 0 4.65685 0 3Z" fill="#F24E1E"/>
    <path d="M6 0H9C10.6569 0 12 1.34315 12 3C12 4.65685 10.6569 6 9 6H6V0Z" fill="#FF7262"/>
    <path d="M12 9C12 10.6569 10.6569 12 9 12C7.34315 12 6 10.6569 6 9C6 7.34315 7.34315 6 9 6C10.6569 6 12 7.34315 12 9Z" fill="#1ABCFE"/>
  </svg>
);

// Google Sheets Logo Icon Component
const GoogleSheetsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <path d="M9.5 0H2.5C1.67 0 1 0.67 1 1.5V14.5C1 15.33 1.67 16 2.5 16H13.5C14.33 16 15 15.33 15 14.5V4.5L9.5 0Z" fill="#0F9D58"/>
    <path d="M4 7H12V13H4V7Z" fill="#F1F1F1"/>
    <path d="M4 9.5H7V11H4V9.5ZM8.5 9.5H12V11H8.5V9.5ZM4 7H7V8.5H4V7ZM8.5 7H12V8.5H8.5V7ZM4 11.5H7V13H4V11.5ZM8.5 11.5H12V13H8.5V11.5Z" fill="#0F9D58"/>
    <path d="M9.5 0V3C9.5 4.1 10.4 4.5 11 4.5H15L9.5 0Z" fill="#87CEAC"/>
  </svg>
);

interface LinksCellProps {
  links: ProjectLinks;
  linkLabels: Array<{ name: string; icon_type?: string; icon_data?: string }>;
  onAddLink?: () => void;
}

export function LinksCell({ links, linkLabels, onAddLink }: LinksCellProps) {
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
      <div className="flex flex-wrap gap-1">
        {sortedLinks.length > 0 ? (
          <>
            {sortedLinks.slice(0, 2).map((link) => {
            // Safety check for link.label
            if (!link.label) return null;
            
            const labelLower = link.label.toLowerCase();
            
            // Find matching link label from database
            const linkLabel = linkLabels.find(
              ll => ll?.name && ll.name.toLowerCase() === labelLower
            );
            
            // Determine if this should be rendered as icon or text
            const isIconLink = linkLabel?.icon_type === 'svg' || linkLabel?.icon_type === 'emoji' ||
                             labelLower === 'figma' || 
                             labelLower === 'gsheet' || 
                             labelLower === 'gsheets' || 
                             labelLower === 'google sheets' || 
                             labelLower === 'google sheet';
            
            return (
              <Tooltip key={link.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isIconLink ? 'h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white' : 'h-6 px-2 text-xs hover:scale-105 active:scale-95 transition-all duration-200'}
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(link.url, '_blank');
                    }}
                  >
                    {linkLabel?.icon_type === 'svg' && linkLabel.icon_data ? (
                      <div dangerouslySetInnerHTML={{ __html: linkLabel.icon_data }} className="w-5 h-5" />
                    ) : linkLabel?.icon_type === 'emoji' && linkLabel.icon_data ? (
                      <span className="text-lg">{linkLabel.icon_data}</span>
                    ) : labelLower === 'figma' ? (
                      <FigmaIcon />
                    ) : (labelLower === 'gsheet' || 
                         labelLower === 'gsheets' || 
                         labelLower === 'google sheets' || 
                         labelLower === 'google sheet') ? (
                      <GoogleSheetsIcon />
                    ) : (
                      link.label
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{link.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
          {sortedLinks.length > 2 && (
            <Badge variant="outline" className="text-xs h-6 px-2">
              +{sortedLinks.length - 2}
            </Badge>
          )}
          </>
        ) : (
          <span className="text-xs text-muted-foreground">-</span>
        )}
      </div>
    </TooltipProvider>
  );
}
