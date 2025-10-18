import { useState } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card } from './ui/card';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { FilterOptions, Collaborator, ProjectStatus } from '../types/project';
import { useStatusContext } from './StatusContext';

interface ProjectFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  filterOptions: {
    verticals: string[];
    types: string[];
    tags: string[];
  };
  collaborators: Collaborator[];
  isMobile?: boolean; // Hide filter popover on mobile
}

export function ProjectFilters({
  filters,
  onFiltersChange,
  filterOptions,
  collaborators,
  isMobile = false
}: ProjectFiltersProps) {
  const { statuses } = useStatusContext();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof FilterOptions, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  );

  const activeFilterCount = Object.values(filters).filter(value => 
    value !== undefined && value !== '' && 
    (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  // Get status options from context, sorted by order
  const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);
  const statusOptions = sortedStatuses.map(s => s.name) as ProjectStatus[];

  return (
    <div className="space-y-4">
      {/* Main Search Bar with Integrated Filter */}
      <div className="relative flex items-center bg-muted/50 rounded-xl border border-border/50 p-1">
        <div className="flex items-center flex-1">
          <Search className="ml-3 h-5 w-5 text-muted-foreground/70" />
          <Input
            placeholder="Search projects, collaborators, or notes..."
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="flex-1 border-0 bg-transparent pl-3 pr-3 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/70"
          />
        </div>
        
        {/* Filter Popover - Desktop Only */}
        {!isMobile && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="mr-1 flex items-center gap-2 text-muted-foreground hover:text-foreground"
              >
                <Filter className="h-4 w-4" />
                <ChevronDown className="h-3 w-3" />
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-1 h-5 min-w-5 text-xs">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
            <div className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="h-auto p-0 text-muted-foreground hover:text-foreground"
                  >
                    Clear all
                  </Button>
                )}
              </div>
              
              <div className="space-y-3">
                {/* Vertical Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Vertical</label>
                  <Select
                    value={filters.vertical || 'all'}
                    onValueChange={(value) => handleFilterChange('vertical', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Verticals</SelectItem>
                      {filterOptions.verticals.map(vertical => (
                        <SelectItem key={vertical} value={vertical}>
                          {vertical}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Type</label>
                  <Select
                    value={filters.type || 'all'}
                    onValueChange={(value) => handleFilterChange('type', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {filterOptions.types.map(type => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Status</label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : (value as ProjectStatus))}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {statusOptions.map(status => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Collaborator Filter */}
                <div>
                  <label className="text-sm font-medium mb-1 block">Collaborator</label>
                  <Select
                    value={filters.collaborator || 'all'}
                    onValueChange={(value) => handleFilterChange('collaborator', value === 'all' ? undefined : value)}
                  >
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="All" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Collaborators</SelectItem>
                      {collaborators.map(collaborator => (
                        <SelectItem key={collaborator.id} value={collaborator.name}>
                          {collaborator.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        )}
      </div>

      {/* Active Filters Display - Desktop Only */}
      {!isMobile && hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.vertical && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="text-xs opacity-60">Vertical:</span> {filters.vertical}
              <button
                onClick={() => handleFilterChange('vertical', undefined)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.type && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="text-xs opacity-60">Type:</span> {filters.type}
              <button
                onClick={() => handleFilterChange('type', undefined)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="text-xs opacity-60">Status:</span> {filters.status}
              <button
                onClick={() => handleFilterChange('status', undefined)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.collaborator && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <span className="text-xs opacity-60">Collaborator:</span> {filters.collaborator}
              <button
                onClick={() => handleFilterChange('collaborator', undefined)}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}