import { Button } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Plus } from 'lucide-react';
import { LightroomIcon } from '../icons/LightroomIcon';
import { GoogleDriveIcon } from '../icons/GoogleDriveIcon';
import { LightroomAsset, GDriveAsset } from '../../types/project';

interface DeliverablesCellProps {
  lightroomAssets?: LightroomAsset[];
  gdriveAssets?: GDriveAsset[];
  onNavigateToLightroom?: () => void;
  onNavigateToGDrive?: () => void;
  onAddLightroom?: () => void;
  onAddGDrive?: () => void;
  isHovered?: boolean;
}

export function DeliverablesCell({
  lightroomAssets,
  gdriveAssets,
  onNavigateToLightroom,
  onNavigateToGDrive,
  onAddLightroom,
  onAddGDrive,
  isHovered
}: DeliverablesCellProps) {
  const hasLightroom = lightroomAssets && lightroomAssets.length > 0;
  const hasGDrive = gdriveAssets && gdriveAssets.length > 0;

  // Empty state with hover
  if (!hasLightroom && !hasGDrive) {
    return (
      <div className="relative inline-flex items-center justify-center group">
        {/* Dash - always visible, hides on hover */}
        <span className="text-xs text-muted-foreground group-hover:opacity-0 transition-opacity">-</span>
        
        {/* Plus button - hidden by default, shows on hover */}
        {(onAddLightroom || onAddGDrive) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="absolute h-7 w-7 p-0 rounded-full hover:bg-accent transition-all duration-200 hover:scale-105 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" onClick={(e) => e.stopPropagation()}>
              {onAddGDrive && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddGDrive();
                  }}
                  className="gap-2"
                >
                  <GoogleDriveIcon className="h-4 w-4" />
                  <span>Add Google Drive Assets</span>
                </DropdownMenuItem>
              )}
              {onAddLightroom && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddLightroom();
                  }}
                  className="gap-2"
                >
                  <LightroomIcon className="h-4 w-4" />
                  <span>Add Lightroom Assets</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex gap-1 items-center relative">
        {hasGDrive && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigateToGDrive) {
                    onNavigateToGDrive();
                  }
                }}
              >
                <GoogleDriveIcon className="h-5 w-5" />
                <span className="sr-only">Open Google Drive assets</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Google Drive ({gdriveAssets?.length || 0})</p>
            </TooltipContent>
          </Tooltip>
        )}
        {hasLightroom && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-9 w-9 p-0 rounded-full bg-muted/50 dark:bg-[#2A2A2F] hover:bg-muted dark:hover:bg-[#35353A] border border-border/30 dark:border-[#2E2E32] transition-all duration-200 hover:scale-105 active:scale-95 text-muted-foreground dark:text-gray-300 hover:text-foreground dark:hover:text-white"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onNavigateToLightroom) {
                    onNavigateToLightroom();
                  }
                }}
              >
                <LightroomIcon className="h-5 w-5" />
                <span className="sr-only">Open Lightroom assets</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Lightroom ({lightroomAssets?.length || 0})</p>
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Plus button - Absolute positioned, shows on hover when there are existing assets */}
        {(onAddLightroom || onAddGDrive) && (hasGDrive || hasLightroom) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`absolute -right-8 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full hover:bg-accent transition-opacity ${
                  isHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" onClick={(e) => e.stopPropagation()}>
              {onAddGDrive && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddGDrive();
                  }}
                  className="gap-2"
                >
                  <GoogleDriveIcon className="h-4 w-4" />
                  <span>Add Google Drive Assets</span>
                </DropdownMenuItem>
              )}
              {onAddLightroom && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddLightroom();
                  }}
                  className="gap-2"
                >
                  <LightroomIcon className="h-4 w-4" />
                  <span>Add Lightroom Assets</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </TooltipProvider>
  );
}