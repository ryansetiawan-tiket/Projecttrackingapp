import { useState } from 'react';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Check } from 'lucide-react';

interface SimpleColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  trigger: React.ReactNode;
}

export function SimpleColorPicker({ color, onChange, trigger }: SimpleColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Preset colors for illustration types
  const presetColors = [
    '#ff6b6b', '#ee5a24', '#ff9f43', '#feca57', '#ff6348',
    '#ff4757', '#c44569', '#f8b500', '#e55039', '#fa983a',
    '#eb2f06', '#b71540', '#6c5ce7', '#a55eea', '#26de81',
    '#2ed573', '#20bf6b', '#0abde3', '#00a8ff', '#3742fa',
    '#2f3542', '#57606f', '#747d8c', '#a4b0be', '#57606f'
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
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          <div className="text-sm font-medium">
            Choose Type Color
          </div>
          
          {/* Current Color Preview */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded">
            <div 
              className="w-6 h-6 rounded border"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm font-mono">{color}</span>
          </div>
          
          {/* Color Grid */}
          <div className="grid grid-cols-5 gap-2">
            {presetColors.map((colorOption) => (
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
          
          {/* Custom Color Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Custom Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="w-12 h-8 rounded border cursor-pointer"
              />
              <input
                type="text"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                placeholder="#000000"
                className="flex-1 px-2 py-1 border rounded text-sm font-mono"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}