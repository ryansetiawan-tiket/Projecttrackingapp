import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Palette, Check } from 'lucide-react';
import { Input } from './ui/input';

interface VerticalColorPickerProps {
  vertical: string;
  currentColor: string;
  onColorChange: (vertical: string, color: string) => void;
}

export function VerticalColorPicker({ vertical, currentColor, onColorChange }: VerticalColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customColor, setCustomColor] = useState(currentColor);

  // Expanded preset colors organized by color families
  const colorCategories = [
    {
      name: 'Warm Pastels',
      colors: ['#fef3c7', '#fde68a', '#fef08a', '#fef9c3', '#fef4e9', '#fed7aa', '#fecaca', '#fed7d7', '#fecdd3', '#fbcfe8']
    },
    {
      name: 'Cool Pastels',
      colors: ['#bfdbfe', '#dbeafe', '#e0e7ff', '#c7d2fe', '#ddd6fe', '#e9d5ff', '#f3e8ff', '#d1fae5', '#bbf7d0', '#a7f3d0']
    },
    {
      name: 'Vibrant',
      colors: ['#fbbf24', '#f59e0b', '#fb923c', '#f97316', '#ef4444', '#dc2626', '#ec4899', '#d946ef', '#a855f7', '#8b5cf6']
    },
    {
      name: 'Rich',
      colors: ['#14b8a6', '#0d9488', '#06b6d4', '#0891b2', '#3b82f6', '#2563eb', '#6366f1', '#7c3aed', '#10b981', '#059669']
    },
    {
      name: 'Muted',
      colors: ['#fef2f2', '#fff7ed', '#fffbeb', '#f0fdf4', '#ecfdf5', '#f0fdfa', '#f0f9ff', '#eff6ff', '#faf5ff', '#fdf4ff']
    },
    {
      name: 'Neutrals',
      colors: ['#f5f5f5', '#e5e5e5', '#d4d4d4', '#a3a3a3', '#737373', '#525252', '#404040', '#262626', '#171717', '#0a0a0a']
    }
  ];

  const handleColorSelect = (color: string) => {
    onColorChange(vertical, color);
    setCustomColor(color);
    setIsOpen(false);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
  };

  const handleCustomColorSubmit = () => {
    if (/^#[0-9A-F]{6}$/i.test(customColor)) {
      onColorChange(vertical, customColor);
      setIsOpen(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 border-2 hover:border-primary cursor-pointer"
          style={{ backgroundColor: currentColor, pointerEvents: 'auto' }}
          title={`Change color for ${vertical}`}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
        >
          <Palette className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 max-h-[500px] overflow-y-auto" align="end">
        <div className="space-y-4">
          <div className="text-sm font-medium">
            Choose color
          </div>
          
          {/* Current Color Preview */}
          <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
            <div 
              className="w-8 h-8 rounded border-2 border-border flex-shrink-0"
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-xs font-mono text-muted-foreground">{currentColor.toUpperCase()}</span>
          </div>
          
          {/* Color Categories */}
          <div className="space-y-3">
            {colorCategories.map((category) => (
              <div key={category.name}>
                <div className="text-xs text-muted-foreground mb-1.5">{category.name}</div>
                <div className="grid grid-cols-10 gap-1.5">
                  {category.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="relative w-6 h-6 rounded border border-border hover:border-primary hover:scale-110 transition-all"
                      style={{ backgroundColor: color }}
                      onClick={() => handleColorSelect(color)}
                      title={color}
                    >
                      {currentColor === color && (
                        <Check className="w-3 h-3 absolute inset-0 m-auto text-white drop-shadow-md" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {/* Custom Color Input */}
          <div className="pt-3 border-t space-y-2">
            <div className="text-xs text-muted-foreground">Custom Color</div>
            <div className="flex gap-2">
              <input
                type="color"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                className="w-12 h-9 rounded border border-border cursor-pointer bg-transparent"
              />
              <Input
                type="text"
                value={customColor}
                onChange={(e) => handleCustomColorChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCustomColorSubmit()}
                placeholder="#000000"
                className="flex-1 font-mono text-xs h-9"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleCustomColorSubmit}
                className="h-9"
              >
                Apply
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}