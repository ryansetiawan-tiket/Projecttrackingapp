import { Building, ChevronDown, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { getContrastColor } from '../utils/colorUtils';

interface VerticalSelectorProps {
  value: string;
  verticals: string[];
  verticalColors: Record<string, string>;
  onChange: (vertical: string) => void;
  onAddVertical: () => void;
}

export function VerticalSelector({
  value,
  verticals,
  verticalColors,
  onChange,
  onAddVertical
}: VerticalSelectorProps) {
  // Ensure value is always a string, never an event object
  const safeValue = typeof value === 'string' ? value : '';
  const currentColor = safeValue ? verticalColors[safeValue] || '#3b82f6' : '#9ca3af';

  const handleVerticalChange = (vertical: string) => {
    // Only pass the string value, never an event object
    onChange(vertical);
  };

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="flex items-center gap-2">
        <Building className="h-5 w-5 text-foreground" />
        <span className="font-medium">Vertical *</span>
      </div>

      {/* Selector Container */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            type="button"
            className="w-full border-2 border-border rounded-lg p-4 bg-input-background hover:bg-muted hover:border-primary/50 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <div className="flex items-center gap-3">
              {/* Vertical Badge/Display */}
              <div className="flex-1 flex items-center gap-2 text-left">
                {safeValue ? (
                  <span
                    className="inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium"
                    style={{
                      backgroundColor: currentColor,
                      color: getContrastColor(currentColor)
                    }}
                  >
                    {safeValue}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">Choose your vertical first</span>
                )}
              </div>

              {/* Chevron Icon */}
              <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="start" 
          className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[300px]"
          sideOffset={8}
        >
          {verticals.map((vertical) => (
            <DropdownMenuItem
              key={vertical}
              onClick={() => handleVerticalChange(vertical)}
              className="flex items-center gap-3 cursor-pointer py-3 px-4"
            >
              <div
                className="w-4 h-4 rounded-sm border flex-shrink-0"
                style={{ backgroundColor: verticalColors[vertical] || '#3b82f6' }}
              />
              <span className="flex-1">{vertical}</span>
              {safeValue === vertical && (
                <span className="text-sm text-muted-foreground">✓</span>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onAddVertical}
            className="flex items-center gap-3 cursor-pointer py-3 px-4 text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Vertical</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
