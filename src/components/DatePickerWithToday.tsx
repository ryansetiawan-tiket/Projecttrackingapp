import React from 'react';
import { Calendar, CalendarCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Calendar as CalendarComponent } from './ui/calendar';

interface DatePickerWithTodayProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePickerWithToday({
  id,
  value,
  onChange,
  placeholder = "Select date",
  className = "",
  disabled = false
}: DatePickerWithTodayProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  // Convert string date to Date object for calendar (handle timezone properly)
  const selectedDate = value ? (() => {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(year, month - 1, day);
  })() : undefined;
  
  // Format today's date as YYYY-MM-DD for input value
  const getTodayString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Handle date selection from calendar (avoid timezone issues)
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      onChange(dateString);
      setIsOpen(false);
    }
  };
  
  // Handle setting today's date
  const handleSetToday = () => {
    onChange(getTodayString());
    setIsOpen(false);
  };
  
  // Clear date
  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };
  
  return (
    <div className="relative">
      {/* Regular date input for direct typing */}
      <div className="relative">
        <Input
          id={id}
          type="date"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`pr-20 date-input-no-icon ${className}`}
          disabled={disabled}
        />
        
        {/* Action buttons overlay */}
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {/* Today button */}

          
          {/* Calendar picker button */}
          <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={disabled}
                className="h-5 w-5 p-0 text-xs hover:bg-gray-50 flex items-center justify-center"
                title="Open calendar"
              >
                <Calendar className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 border-b">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSetToday}
                    className="flex-1 text-xs"
                  >
                    <CalendarCheck className="h-3 w-3 mr-1" />
                    Today
                  </Button>
                  {value && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClear}
                      className="text-xs text-muted-foreground hover:text-destructive"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div>
              <CalendarComponent
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}