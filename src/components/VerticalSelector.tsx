import React from 'react';
import { ChevronDown, Plus } from 'lucide-react';
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
  // Ensure value is always a string, never an event object or other type
  const safeValue = React.useMemo(() => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    // If value is an object or anything else, extract the string if possible
    if (typeof value === 'object' && value !== null) {
      // Check if it has a common string property
      if ('value' in value && typeof value.value === 'string') return value.value;
      if ('label' in value && typeof value.label === 'string') return value.label;
      if ('name' in value && typeof value.name === 'string') return value.name;
      console.warn('[VerticalSelector] Received object instead of string. Type:', typeof value, 'Constructor:', value.constructor?.name);
      return '';
    }
    return String(value);
  }, [value]);
  
  const currentColor = safeValue ? verticalColors[safeValue] || '#3b82f6' : '#9ca3af';

  const handleVerticalChange = (vertical: string) => {
    // Only pass the string value, never an event object
    onChange(vertical);
  };

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button 
            type="button"
            className="w-full h-12 border-2 border-border rounded-lg px-3 bg-background hover:bg-muted hover:border-primary/50 transition-all cursor-pointer group focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
          >
            <div className="flex items-center justify-between gap-2">
              {/* Vertical Display */}
              {safeValue ? (
                <span
                  className="inline-flex items-center justify-center rounded-md px-2.5 py-1 text-sm font-medium"
                  style={{
                    backgroundColor: currentColor,
                    color: getContrastColor(currentColor)
                  }}
                >
                  {typeof safeValue === 'string' ? safeValue : (safeValue ? String(safeValue) : '')}
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">Choose</span>
              )}

              {/* Chevron Icon */}
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
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
  );
}
