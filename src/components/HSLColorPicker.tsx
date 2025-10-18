import { useState, useEffect, useRef } from 'react';
import { Slider } from './ui/slider';

interface HSLColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
}

// Convert hex to HSL
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

// Convert HSL to hex
function hslToHex(h: number, s: number, l: number): string {
  h = h / 360;
  s = s / 100;
  l = l / 100;

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }

  const toHex = (c: number) => {
    const hex = Math.round(c * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function HSLColorPicker({ currentColor, onColorChange }: HSLColorPickerProps) {
  const [hsl, setHsl] = useState<[number, number, number]>([200, 80, 85]);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // Initialize HSL from current color
  useEffect(() => {
    if (currentColor) {
      const [h, s, l] = hexToHsl(currentColor);
      setHsl([h, s, l]);
    }
  }, [currentColor]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const updateColor = (newHsl: [number, number, number], immediate: boolean = false) => {
    setHsl(newHsl);
    const hexColor = hslToHex(newHsl[0], newHsl[1], newHsl[2]);
    
    // Clear existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    if (immediate) {
      // For quick presets, update immediately
      onColorChange(hexColor);
    } else {
      // For sliders, debounce the callback to avoid too many toast notifications
      debounceRef.current = setTimeout(() => {
        onColorChange(hexColor);
      }, 300); // Wait 300ms after user stops moving slider
    }
  };

  const [h, s, l] = hsl;
  const previewColor = hslToHex(h, s, l);

  return (
    <div className="space-y-4">
      {/* Color Preview */}
      <div className="flex items-center gap-3">
        <div 
          className="w-16 h-8 rounded border-2 border-gray-300"
          style={{ backgroundColor: previewColor }}
        />
        <div className="text-sm font-mono text-muted-foreground">
          {previewColor.toUpperCase()}
        </div>
      </div>

      {/* Hue Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Hue</label>
          <span className="text-sm text-muted-foreground">{h}°</span>
        </div>
        <div className="relative">
          <div 
            className="h-2 rounded-full mb-2"
            style={{
              background: 'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)'
            }}
          />
          <Slider
            value={[h]}
            onValueChange={([value]) => updateColor([value, s, l])}
            max={360}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Saturation Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Saturation</label>
          <span className="text-sm text-muted-foreground">{s}%</span>
        </div>
        <div className="relative">
          <div 
            className="h-2 rounded-full mb-2"
            style={{
              background: `linear-gradient(to right, hsl(${h}, 0%, ${l}%), hsl(${h}, 100%, ${l}%))`
            }}
          />
          <Slider
            value={[s]}
            onValueChange={([value]) => updateColor([h, value, l])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Lightness Slider */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Lightness</label>
          <span className="text-sm text-muted-foreground">{l}%</span>
        </div>
        <div className="relative">
          <div 
            className="h-2 rounded-full mb-2"
            style={{
              background: `linear-gradient(to right, hsl(${h}, ${s}%, 0%), hsl(${h}, ${s}%, 50%), hsl(${h}, ${s}%, 100%))`
            }}
          />
          <Slider
            value={[l]}
            onValueChange={([value]) => updateColor([h, s, value])}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Quick presets */}
      <div className="pt-2 border-t">
        <div className="text-sm font-medium mb-2">Quick Colors</div>
        <div className="grid grid-cols-8 gap-1.5">
          {[
            '#fef3c7', '#fecaca', '#e9d5ff', '#bfdbfe',
            '#bbf7d0', '#fed7aa', '#fbcfe8', '#ddd6fe'
          ].map((color) => (
            <button
              key={color}
              type="button"
              className="w-6 h-6 rounded border border-gray-300 hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
              onClick={() => {
                const [newH, newS, newL] = hexToHsl(color);
                updateColor([newH, newS, newL], true); // immediate update for presets
              }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}