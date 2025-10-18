import { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from '../ui/drawer';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Filter, X, Check } from 'lucide-react';
import { Collaborator } from '../../types/project';
import { useColors } from '../ColorContext';
import { cn } from '../ui/utils';

export interface MobileFilterState {
  year: string;
  quarter: string;
  vertical: string;
  type: string;
  collaborator: string;
  groupBy: 'status' | 'vertical';
}

interface MobileFiltersProps {
  filters: MobileFilterState;
  onFiltersChange: (filters: MobileFilterState) => void;
  availableYears: number[];
  availableQuarters: string[];
  availableVerticals: string[];
  availableTypes: string[];
  collaborators: Collaborator[];
}

export function MobileFilters({
  filters,
  onFiltersChange,
  availableYears,
  availableQuarters,
  availableVerticals,
  availableTypes,
  collaborators
}: MobileFiltersProps) {
  const [open, setOpen] = useState(false);
  const { verticalColors, typeColors } = useColors();

  const handleFilterChange = (key: keyof MobileFilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset quarter when year changes
    if (key === 'year') {
      newFilters.quarter = 'all';
    }
    
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const currentYear = new Date().getFullYear().toString();
    onFiltersChange({
      year: currentYear,
      quarter: 'all',
      vertical: 'all',
      type: 'all',
      collaborator: 'all',
      groupBy: filters.groupBy
    });
  };

  // Count active filters (excluding year and groupBy)
  const activeFilterCount = [
    filters.quarter !== 'all' ? 1 : 0,
    filters.vertical !== 'all' ? 1 : 0,
    filters.type !== 'all' ? 1 : 0,
    filters.collaborator !== 'all' ? 1 : 0
  ].reduce((a, b) => a + b, 0);

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1.5 -right-1.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="h-[90vh] p-0">
        <DrawerHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DrawerTitle className="text-xl">Filters & Grouping</DrawerTitle>
              {activeFilterCount > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {activeFilterCount} active filter{activeFilterCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeFilterCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearAllFilters}
                  className="text-destructive hover:text-destructive"
                >
                  Reset all
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                className="h-8 w-8 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DrawerHeader>

        <ScrollArea className="h-[calc(90vh-88px)]">
          <div className="px-6 py-6 space-y-8">
            {/* Group By */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-foreground">Group By</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={filters.groupBy === 'status' ? 'default' : 'outline'}
                  size="lg"
                  className={cn(
                    "w-full justify-center h-11",
                    filters.groupBy === 'status' && "shadow-sm"
                  )}
                  onClick={() => handleFilterChange('groupBy', 'status')}
                >
                  {filters.groupBy === 'status' && <Check className="h-4 w-4 mr-2" />}
                  Status
                </Button>
                <Button
                  variant={filters.groupBy === 'vertical' ? 'default' : 'outline'}
                  size="lg"
                  className={cn(
                    "w-full justify-center h-11",
                    filters.groupBy === 'vertical' && "shadow-sm"
                  )}
                  onClick={() => handleFilterChange('groupBy', 'vertical')}
                >
                  {filters.groupBy === 'vertical' && <Check className="h-4 w-4 mr-2" />}
                  Vertical
                </Button>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Year Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-semibold text-foreground">Year</Label>
                {filters.year !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => handleFilterChange('year', 'all')}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={filters.year === 'all' ? 'default' : 'outline'}
                  size="lg"
                  className={cn(
                    "w-full h-11",
                    filters.year === 'all' && "shadow-sm"
                  )}
                  onClick={() => handleFilterChange('year', 'all')}
                >
                  All
                </Button>
                {availableYears.map((year) => (
                  <Button
                    key={year}
                    variant={filters.year === year.toString() ? 'default' : 'outline'}
                    size="lg"
                    className={cn(
                      "w-full h-11",
                      filters.year === year.toString() && "shadow-sm"
                    )}
                    onClick={() => handleFilterChange('year', year.toString())}
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Quarter Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-semibold text-foreground">Quarter</Label>
                {filters.quarter !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => handleFilterChange('quarter', 'all')}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={filters.quarter === 'all' ? 'default' : 'outline'}
                  size="lg"
                  className={cn(
                    "w-full h-11",
                    filters.quarter === 'all' && "shadow-sm"
                  )}
                  onClick={() => handleFilterChange('quarter', 'all')}
                >
                  All
                </Button>
                {availableQuarters.map((quarter) => (
                  <Button
                    key={quarter}
                    variant={filters.quarter === quarter ? 'default' : 'outline'}
                    size="lg"
                    className={cn(
                      "w-full h-11",
                      filters.quarter === quarter && "shadow-sm"
                    )}
                    onClick={() => handleFilterChange('quarter', quarter)}
                  >
                    {quarter}
                  </Button>
                ))}
              </div>
            </div>

            <Separator className="my-6" />

            {/* Vertical Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-semibold text-foreground">Vertical</Label>
                {filters.vertical !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => handleFilterChange('vertical', 'all')}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              <Select value={filters.vertical} onValueChange={(value) => handleFilterChange('vertical', value)}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select vertical">
                    {filters.vertical === 'all' ? 'All Verticals' : (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-background shadow-sm flex-shrink-0"
                          style={{ backgroundColor: verticalColors[filters.vertical] || '#6b7280' }}
                        />
                        <span>{filters.vertical}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verticals</SelectItem>
                  {availableVerticals.map((vertical) => (
                    <SelectItem key={vertical} value={vertical}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-background shadow-sm flex-shrink-0"
                          style={{ backgroundColor: verticalColors[vertical] || '#6b7280' }}
                        />
                        <span>{vertical}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-6" />

            {/* Type Filter */}
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-semibold text-foreground">Type</Label>
                {filters.type !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => handleFilterChange('type', 'all')}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              <Select value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select type">
                    {filters.type === 'all' ? 'All Types' : (
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-background shadow-sm flex-shrink-0"
                          style={{ backgroundColor: typeColors[filters.type] || '#6b7280' }}
                        />
                        <span>{filters.type}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-background shadow-sm flex-shrink-0"
                          style={{ backgroundColor: typeColors[type] || '#6b7280' }}
                        />
                        <span>{type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator className="my-6" />

            {/* Collaborator Filter */}
            <div className="space-y-3 pb-4">
              <div className="flex items-center justify-between mb-1">
                <Label className="text-sm font-semibold text-foreground">Collaborator</Label>
                {filters.collaborator !== 'all' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => handleFilterChange('collaborator', 'all')}
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
              <Select value={filters.collaborator} onValueChange={(value) => handleFilterChange('collaborator', value)}>
                <SelectTrigger className="w-full h-12">
                  <SelectValue placeholder="Select collaborator">
                    {filters.collaborator === 'all' ? 'All Collaborators' : (() => {
                      const collab = collaborators.find(c => c.id === filters.collaborator);
                      return collab ? (collab.nickname || collab.name) : 'All Collaborators';
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Collaborators</SelectItem>
                  {collaborators.map((collab) => (
                    <SelectItem key={collab.id} value={collab.id}>
                      {collab.nickname || collab.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </ScrollArea>
      </DrawerContent>
    </Drawer>
  );
}
