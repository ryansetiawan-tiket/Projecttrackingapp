import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check } from 'lucide-react';

interface TypeColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  trigger: React.ReactNode;
}

export function TypeColorPicker({ color, onChange, trigger }: TypeColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Preset colors untuk type backgrounds (lebih gelap dari vertical colors)
  const typeColors = [
    '#dc2626', '#ea580c', '#d97706', '#ca8a04',
    '#65a30d', '#16a34a', '#059669', '#0891b2',
    '#0284c7', '#2563eb', '#4f46e5', '#7c3aed',
    '#9333ea', '#c026d3', '#db2777', '#e11d48'
  ];

  const handleColorSelect = (selectedColor: string) => {
    onChange(selectedColor);
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">
            Choose type color
          </div>
          
          <div className="grid grid-cols-4 gap-2">
            {typeColors.map((colorOption) => (
              <button
                key={colorOption}
                type="button"
                className="relative w-8 h-8 rounded border-2 border-gray-200 hover:border-gray-400 hover:scale-105 transition-all"
                style={{ backgroundColor: colorOption }}
                onClick={() => handleColorSelect(colorOption)}
                title={colorOption}
              >
                {color === colorOption && (
                  <Check className="w-3 h-3 absolute inset-0 m-auto text-white" />
                )}
              </button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}