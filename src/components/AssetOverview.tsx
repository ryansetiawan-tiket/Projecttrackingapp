/**
 * AssetOverview - Generic Asset Overview Component
 * 
 * Shared component for both Lightroom and GDrive overview tabs
 * Uses configuration pattern for asset-specific behavior
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, Copy, Columns2, SquareStack, Filter, Grid2x2, List, Eye, EyeOff } from 'lucide-react';
import { Project } from '../types/project';
import { Badge } from './ui/badge';
import Slider from 'react-slick';
import { toast } from 'sonner@2.0.3';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Button } from './ui/button';
import { useColors } from './ColorContext';
import type { BaseAsset, AssetOverviewConfig, AssetOverviewProps, LightboxState, FlattenedPreview } from './asset-overview/types';

export function AssetOverview<T extends BaseAsset>({ 
  projects, 
  onNavigateToProject, 
  onProjectDetail, 
  config,
  isPublicView = false,
  searchQuery = '',
  onViewImages,
  headerActions
}: AssetOverviewProps<T>) {
  const [lightboxState, setLightboxState] = useState<LightboxState<T> | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // Shared state across both tabs (Lightroom & GDrive)
  // These settings provide consistent UX across asset types
  
  // Grid columns state (mobile only) - SHARED between tabs
  const [mobileGridCols, setMobileGridCols] = useState<1 | 2>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('asset-overview-mobile-grid-cols');
      return saved === '1' ? 1 : 2;
    }
    return 2;
  });
  
  // Grouping state - SHARED between tabs
  const [groupByVertical, setGroupByVertical] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('asset-overview-group-by-vertical');
      return saved === 'true';
    }
    return false;
  });
  
  // Preview visibility state - SHARED between tabs
  const [showPreview, setShowPreview] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('asset-overview-show-preview');
      return saved !== 'false'; // Default to true
    }
    return true;
  });
  
  // Vertical filter state - SEPARATE per tab (different content per tab)
  const [selectedVertical, setSelectedVertical] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(`${config.storagePrefix}-vertical-filter`) || 'all';
    }
    return 'all';
  });
  
  // Sort by state - SHARED between tabs
  type SortOption = 'created-date' | 'created-date-oldest' | 'start-date' | 'due-date' | 'project-name';
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('asset-overview-sort-by') as SortOption;
      return saved || 'created-date';
    }
    return 'created-date';
  });
  
  // Toggle mobile grid - SHARED state
  const toggleMobileGrid = () => {
    const newCols = mobileGridCols === 1 ? 2 : 1;
    setMobileGridCols(newCols);
    localStorage.setItem('asset-overview-mobile-grid-cols', String(newCols));
  };
  
  // Toggle grouping - SHARED state
  const toggleGroupByVertical = () => {
    const newValue = !groupByVertical;
    setGroupByVertical(newValue);
    localStorage.setItem('asset-overview-group-by-vertical', String(newValue));
  };
  
  // Toggle preview visibility - SHARED state
  const togglePreview = () => {
    const newValue = !showPreview;
    setShowPreview(newValue);
    localStorage.setItem('asset-overview-show-preview', String(newValue));
  };
  
  // Change vertical filter - SEPARATE per tab
  const handleVerticalChange = (vertical: string) => {
    setSelectedVertical(vertical);
    localStorage.setItem(`${config.storagePrefix}-vertical-filter`, vertical);
  };
  
  // Change sort option - SHARED state
  const handleSortChange = (sort: SortOption) => {
    setSortBy(sort);
    localStorage.setItem('asset-overview-sort-by', sort);
  };

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Lightbox functions with preview index support
  const openLightbox = (project: Project, assetIndex: number, previewIndex: number = 0) => {
    const assets = (project[config.assetKey] as T[]) || [];
    setLightboxState({
      projectId: project.id,
      assetIndex,
      previewIndex,
      assets,
      projectName: project.project_name,
    });
    setZoomLevel(1);
  };

  const closeLightbox = () => {
    setLightboxState(null);
    setZoomLevel(1);
  };

  // Helper to get preview URLs for current asset
  const getAssetPreviewUrls = (asset: T): string[] => {
    if (config.getPreviewUrls) {
      return config.getPreviewUrls(asset);
    }
    // Fallback to single preview
    const singleUrl = config.getPreviewUrl(asset);
    return singleUrl ? [singleUrl] : [];
  };

  const navigateToPreviousPreview = () => {
    if (!lightboxState) return;
    const currentAsset = lightboxState.assets[lightboxState.assetIndex];
    const previewUrls = getAssetPreviewUrls(currentAsset);
    
    if (lightboxState.previewIndex > 0) {
      // Navigate to previous preview in same asset
      setLightboxState({
        ...lightboxState,
        previewIndex: lightboxState.previewIndex - 1,
      });
    } else {
      // Already at first preview - navigate to previous asset's last preview
      const prevAssetIndex = (lightboxState.assetIndex - 1 + lightboxState.assets.length) % lightboxState.assets.length;
      const prevAsset = lightboxState.assets[prevAssetIndex];
      const prevPreviewUrls = getAssetPreviewUrls(prevAsset);
      
      setLightboxState({
        ...lightboxState,
        assetIndex: prevAssetIndex,
        previewIndex: prevPreviewUrls.length - 1,
      });
    }
    setZoomLevel(1);
  };

  const navigateToNextPreview = () => {
    if (!lightboxState) return;
    const currentAsset = lightboxState.assets[lightboxState.assetIndex];
    const previewUrls = getAssetPreviewUrls(currentAsset);
    
    if (lightboxState.previewIndex < previewUrls.length - 1) {
      // Navigate to next preview in same asset
      setLightboxState({
        ...lightboxState,
        previewIndex: lightboxState.previewIndex + 1,
      });
    } else {
      // Already at last preview - navigate to next asset's first preview
      const nextAssetIndex = (lightboxState.assetIndex + 1) % lightboxState.assets.length;
      
      setLightboxState({
        ...lightboxState,
        assetIndex: nextAssetIndex,
        previewIndex: 0,
      });
    }
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.5, 0.5));
  };

  // Touch handlers for swipe navigation
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      navigateToNextPreview();
    } else if (isRightSwipe) {
      navigateToPreviousPreview();
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxState) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        navigateToPreviousPreview();
      } else if (e.key === 'ArrowRight') {
        navigateToNextPreview();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        setZoomLevel((prev) => Math.min(prev + 0.1, 3));
      } else {
        setZoomLevel((prev) => Math.max(prev - 0.1, 0.5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [lightboxState]);

  // Copy to clipboard helper
  const copyToClipboardFallback = (text: string): boolean => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.top = '0';
      textarea.style.left = '0';
      textarea.style.width = '2em';
      textarea.style.height = '2em';
      textarea.style.padding = '0';
      textarea.style.border = 'none';
      textarea.style.outline = 'none';
      textarea.style.boxShadow = 'none';
      textarea.style.background = 'transparent';
      textarea.style.opacity = '0';
      
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      const successful = document.execCommand('copy');
      document.body.removeChild(textarea);
      
      return successful;
    } catch (err) {
      console.error('Fallback copy error:', err);
      return false;
    }
  };

  const handleCopyName = async (name: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(name);
        toast.success('Asset name copied!');
        return;
      }
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error);
    }
    
    const success = copyToClipboardFallback(name);
    if (success) {
      toast.success('Asset name copied!');
    } else {
      toast.error('Failed to copy name');
    }
  };

  const handleCopyLink = async (url: string) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
        return;
      }
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error);
    }
    
    const success = copyToClipboardFallback(url);
    if (success) {
      toast.success('Link copied!');
    } else {
      toast.error('Failed to copy link');
    }
  };

  const isValidUrl = (url: string | undefined) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Get unique verticals from all projects with assets (before filtering)
  const verticals = Array.from(new Set(
    projects
      .filter(p => {
        const assets = p[config.assetKey];
        return assets && Array.isArray(assets) && assets.length > 0;
      })
      .map(p => p.vertical)
      .filter((v): v is string => !!v)
  )).sort();

  // Helper function to flatten all previews from all projects
  const flattenPreviews = (projects: Project[]): FlattenedPreview<T>[] => {
    const flattened: FlattenedPreview<T>[] = [];
    
    projects.forEach(project => {
      const assets = (project[config.assetKey] as T[]) || [];
      
      assets.forEach((asset, assetIndex) => {
        const previewUrls = config.getPreviewUrls 
          ? config.getPreviewUrls(asset)
          : (config.getPreviewUrl(asset) ? [config.getPreviewUrl(asset)!] : []);
        
        // Create a flattened preview for each preview URL
        previewUrls.forEach((previewUrl, previewIndex) => {
          flattened.push({
            project,
            asset,
            assetIndex,
            previewUrl,
            previewIndex,
            totalPreviews: previewUrls.length,
          });
        });
      });
    });
    
    return flattened;
  };

  // Filter projects that have assets
  let projectsWithAssets = projects.filter(p => {
    const assets = p[config.assetKey];
    return assets && Array.isArray(assets) && assets.length > 0;
  });
  
  // Apply search filter - search in project name, description, and collaborator names
  if (searchQuery.trim()) {
    const searchLower = searchQuery.toLowerCase();
    projectsWithAssets = projectsWithAssets.filter(p => {
      // Search in project name
      const matchesName = p.project_name?.toLowerCase().includes(searchLower);
      
      // Search in description
      const matchesDescription = (p.description || '').toLowerCase().includes(searchLower);
      
      // Search in collaborator names
      const matchesCollaborator = p.collaborators?.some(collab => 
        collab.name?.toLowerCase().includes(searchLower)
      );
      
      return matchesName || matchesDescription || matchesCollaborator;
    });
  }
  
  // Apply vertical filter
  if (selectedVertical !== 'all') {
    projectsWithAssets = projectsWithAssets.filter(p => p.vertical === selectedVertical);
  }
  
  // Apply sorting
  projectsWithAssets = [...projectsWithAssets].sort((a, b) => {
    switch (sortBy) {
      case 'created-date': {
        // Newest created first (descending)
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA; // Newest first
      }
      case 'created-date-oldest': {
        // Oldest created first (ascending)
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB; // Oldest first
      }
      case 'start-date': {
        // Earliest start date first
        const dateA = a.start_date ? new Date(a.start_date).getTime() : Infinity;
        const dateB = b.start_date ? new Date(b.start_date).getTime() : Infinity;
        return dateA - dateB;
      }
      case 'due-date': {
        // Earliest due date first
        const dateA = a.due_date ? new Date(a.due_date).getTime() : Infinity;
        const dateB = b.due_date ? new Date(b.due_date).getTime() : Infinity;
        return dateA - dateB;
      }
      case 'project-name': {
        // Alphabetical by project name
        return (a.project_name || '').localeCompare(b.project_name || '');
      }
      default:
        return 0;
    }
  });
  
  // Group projects by vertical if enabled
  const groupedByVertical: Record<string, Project[]> = {};
  if (groupByVertical) {
    projectsWithAssets.forEach(project => {
      const vertical = project.vertical || 'Uncategorized';
      if (!groupedByVertical[vertical]) {
        groupedByVertical[vertical] = [];
      }
      groupedByVertical[vertical].push(project);
    });
  }

  // Render filter bar
  const renderFilterBar = () => (
    <div className="sticky top-0 z-30 bg-background border-b border-border">
      <div className="container mx-auto px-4 py-3">
        {/* Mobile: Stack vertically, Desktop: Horizontal */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          {/* Left: Filters and Sort - Mobile: Stack, Desktop: Row */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
            {/* Row 1: Vertical Filter (always first) */}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground hidden sm:block flex-shrink-0" />
              <Select value={selectedVertical} onValueChange={handleVerticalChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="All Verticals" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Verticals</SelectItem>
                  {verticals.map(vertical => (
                    <SelectItem key={vertical} value={vertical}>
                      {vertical}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Row 2 (Mobile) / Same Row (Desktop): Sort By Dropdown */}
            <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created-date">Created Date (Newest)</SelectItem>
                <SelectItem value="created-date-oldest">Created Date (Oldest)</SelectItem>
                <SelectItem value="start-date">Start Date</SelectItem>
                <SelectItem value="due-date">Due Date</SelectItem>
                <SelectItem value="project-name">Project Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Right: Controls Group */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Preview Toggle */}
            <Button
              variant={showPreview ? 'default' : 'outline'}
              size="sm"
              onClick={togglePreview}
              className="gap-2"
              title={showPreview ? 'Hide Previews' : 'Show Previews'}
            >
              {showPreview ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              <span className="hidden md:inline">
                {showPreview ? 'Preview' : 'Hidden'}
              </span>
            </Button>
            
            {/* Mobile Grid Toggle - Only show on mobile when preview is shown */}
            {showPreview && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleMobileGrid}
                className="md:hidden gap-2"
                title={`Switch to ${mobileGridCols === 1 ? '2' : '1'} column layout`}
              >
                {mobileGridCols === 1 ? (
                  <Columns2 className="h-4 w-4" />
                ) : (
                  <SquareStack className="h-4 w-4" />
                )}
              </Button>
            )}
            
            {/* Group Toggle */}
            <Button
              variant={groupByVertical ? 'default' : 'outline'}
              size="sm"
              onClick={toggleGroupByVertical}
              className="gap-2"
              title={groupByVertical ? 'Grouped by Vertical' : 'Grid View'}
            >
              {groupByVertical ? <List className="h-4 w-4" /> : <Grid2x2 className="h-4 w-4" />}
              <span className="hidden md:inline">
                {groupByVertical ? 'Grouped' : 'Grid'}
              </span>
            </Button>
            
            {/* Custom Header Actions (e.g., Add Asset button) */}
            {headerActions}
          </div>
        </div>
      </div>
    </div>
  );

  if (projectsWithAssets.length === 0) {
    return (
      <>
        {renderFilterBar()}
        <div className="container mx-auto px-4 py-12">
          <div className="text-center">
            <p className="text-muted-foreground">
              {searchQuery.trim() 
                ? `No assets found matching "${searchQuery}"`
                : selectedVertical !== 'all' 
                  ? `No assets found for ${selectedVertical}`
                  : 'No projects with assets found.'}
            </p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {renderFilterBar()}
      
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {groupByVertical ? (
          // Grouped by vertical
          <div className="space-y-8">
            {Object.keys(groupedByVertical).sort().map(vertical => (
              <div key={vertical}>
                <h3 className="mb-4 px-1">{vertical}</h3>
                <div className={`grid ${
                  showPreview 
                    ? `${mobileGridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'} md:grid-cols-3 lg:grid-cols-4` 
                    : 'grid-cols-1'
                } gap-2 md:gap-6`}>
                  {groupedByVertical[vertical].map((project) => (
                    <ProjectAssetCard
                      key={project.id}
                      project={project}
                      onNavigateToProject={onNavigateToProject}
                      onProjectDetail={onProjectDetail}
                      onThumbnailClick={(assetIndex, previewIndex) => config.onAssetClick(project, assetIndex, previewIndex, openLightbox)}
                      showPreview={showPreview}
                      config={config}
                      onViewImages={onViewImages}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Flat grid
          <div className={`grid ${
            showPreview 
              ? `${mobileGridCols === 1 ? 'grid-cols-1' : 'grid-cols-2'} md:grid-cols-3 lg:grid-cols-4` 
              : 'grid-cols-1'
          } gap-2 md:gap-6`}>
            {projectsWithAssets.map((project) => (
              <ProjectAssetCard
                key={project.id}
                project={project}
                onNavigateToProject={onNavigateToProject}
                onProjectDetail={onProjectDetail}
                onThumbnailClick={(assetIndex, previewIndex) => config.onAssetClick(project, assetIndex, previewIndex, openLightbox)}
                showPreview={showPreview}
                config={config}
                onViewImages={onViewImages}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {lightboxState && (() => {
        const currentAsset = lightboxState.assets[lightboxState.assetIndex];
        const previewUrls = getAssetPreviewUrls(currentAsset);
        const imageUrl = previewUrls[lightboxState.previewIndex] || '';
        
        // Calculate total preview count and current position across all assets
        let totalPreviewCount = 0;
        let currentPreviewPosition = 0;
        lightboxState.assets.forEach((asset, assetIdx) => {
          const urls = getAssetPreviewUrls(asset);
          if (assetIdx < lightboxState.assetIndex) {
            totalPreviewCount += urls.length;
          } else if (assetIdx === lightboxState.assetIndex) {
            currentPreviewPosition = totalPreviewCount + lightboxState.previewIndex + 1;
            totalPreviewCount += urls.length;
          } else {
            totalPreviewCount += urls.length;
          }
        });

        return (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 p-2 sm:p-2.5 rounded-full bg-neutral-800/90 hover:bg-neutral-700/90 backdrop-blur-md text-white transition-colors touch-manipulation shadow-lg"
              aria-label="Close lightbox"
            >
              <X className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Navigation Buttons - Hidden on mobile, use swipe instead */}
            {totalPreviewCount > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToPreviousPreview();
                  }}
                  className="hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-neutral-800/90 hover:bg-neutral-700/90 backdrop-blur-md text-white transition-colors shadow-lg"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToNextPreview();
                  }}
                  className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-neutral-800/90 hover:bg-neutral-700/90 backdrop-blur-md text-white transition-colors shadow-lg"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            )}

            {/* Bottom Controls Stack - Desktop only */}
            <div className="hidden sm:flex absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 flex-col items-center gap-3">
              {/* Info Panel */}
              <div className="bg-neutral-800/90 backdrop-blur-md rounded-xl p-4 sm:p-5 max-w-xl shadow-2xl">
                <h3 className="text-white text-sm sm:text-base font-normal mb-3 text-center break-all">{currentAsset.asset_name}</h3>
                
                {config.renderAssetBadge && (
                  <div className="flex justify-center mb-3">
                    {config.renderAssetBadge(currentAsset)}
                  </div>
                )}
                
                <div className="flex items-center justify-center gap-2 mb-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyName(currentAsset.asset_name);
                    }}
                    className="px-3 sm:px-4 py-2 rounded-lg bg-neutral-700/80 hover:bg-neutral-600/80 text-white transition-colors flex items-center gap-2 touch-manipulation text-sm"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Name
                  </button>
                  {config.getCopyableLink && config.getCopyableLink(currentAsset) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyLink(config.getCopyableLink!(currentAsset)!);
                      }}
                      className="px-3 sm:px-4 py-2 rounded-lg bg-neutral-700/80 hover:bg-neutral-600/80 text-white transition-colors flex items-center gap-2 touch-manipulation text-sm"
                    >
                      <Copy className="h-4 w-4" />
                      Copy Link
                    </button>
                  )}
                </div>
                <p className="text-xs text-white/60 text-center">
                  {lightboxState.projectName}
                  {totalPreviewCount > 1 && ` • Image ${currentPreviewPosition} of ${totalPreviewCount}`}
                </p>
              </div>

              {/* Zoom Controls */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-3 bg-neutral-800/90 backdrop-blur-md rounded-full px-4 py-3 shadow-lg">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomOut();
                    }}
                    className="p-2 rounded-full hover:bg-neutral-700/80 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                    disabled={zoomLevel <= 0.5}
                    aria-label="Zoom out"
                  >
                    <ZoomOut className="h-5 w-5" />
                  </button>
                  <span className="text-white text-sm min-w-[60px] text-center font-medium">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleZoomIn();
                    }}
                    className="p-2 rounded-full hover:bg-neutral-700/80 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                    disabled={zoomLevel >= 3}
                    aria-label="Zoom in"
                  >
                    <ZoomIn className="h-5 w-5" />
                  </button>
                </div>
                {/* Desktop hint */}
                <div className="text-white/40 text-xs">
                  Scroll to zoom • Arrow keys to navigate • ESC to close
                </div>
              </div>
            </div>

            {/* Mobile Zoom Controls - Simple version */}
            <div className="sm:hidden absolute bottom-32 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 bg-neutral-800/90 backdrop-blur-md rounded-full px-4 py-3 shadow-lg">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  className="p-2 rounded-full hover:bg-neutral-700/80 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                  disabled={zoomLevel <= 0.5}
                  aria-label="Zoom out"
                >
                  <ZoomOut className="h-5 w-5" />
                </button>
                <span className="text-white text-sm min-w-[60px] text-center font-medium">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  className="p-2 rounded-full hover:bg-neutral-700/80 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                  disabled={zoomLevel >= 3}
                  aria-label="Zoom in"
                >
                  <ZoomIn className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Image Counter */}
            {totalPreviewCount > 1 && (
              <div className="absolute top-2 sm:top-4 left-4 z-50">
                <div className="bg-neutral-800/90 backdrop-blur-md rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                  <span className="text-white text-xs sm:text-sm">
                    Image {currentPreviewPosition} / {totalPreviewCount}
                  </span>
                </div>
              </div>
            )}
            
            {/* Swipe hint - only show on mobile */}
            {totalPreviewCount > 1 && (
              <div className="sm:hidden absolute top-2 right-4 z-50 text-white/50 text-xs flex items-center gap-1 bg-neutral-800/90 backdrop-blur-md rounded-full px-3 py-1.5">
                <ChevronLeft className="h-3 w-3" />
                <span>Swipe</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            )}

            {/* Main Image Container */}
            <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-16 overflow-auto">
              <div 
                className="relative"
                style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
                onClick={(e) => e.stopPropagation()}
              >
                {imageUrl && isValidUrl(imageUrl) ? (
                  <img
                    src={imageUrl}
                    alt={currentAsset.asset_name}
                    className="max-w-full max-h-[calc(100vh-10rem)] sm:max-h-[calc(100vh-8rem)] object-contain select-none"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    draggable={false}
                  />
                ) : (
                  <div className="flex items-center justify-center w-64 h-64 sm:w-96 sm:h-96">
                    <config.EmptyIcon className="h-32 w-32 text-white/30" />
                  </div>
                )}
              </div>
            </div>

            {/* Mobile Action Bar - Fixed at bottom */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md border-t border-white/10 p-4 safe-area-inset">
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyName(currentAsset.asset_name);
                  }}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-neutral-700/80 active:bg-neutral-600/80 text-white transition-colors flex items-center justify-center gap-2 touch-manipulation text-sm"
                >
                  <Copy className="h-4 w-4" />
                  Copy Name
                </button>
                {config.getCopyableLink && config.getCopyableLink(currentAsset) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink(config.getCopyableLink!(currentAsset)!);
                    }}
                    className="flex-1 px-3 py-2.5 rounded-lg bg-neutral-700/80 active:bg-neutral-600/80 text-white transition-colors flex items-center justify-center gap-2 touch-manipulation text-sm"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </button>
                )}
              </div>
              <p className="text-xs text-white/50 text-center">
                {currentAsset.asset_name}
              </p>
              <p className="text-xs text-white/40 text-center mt-1">
                {lightboxState.projectName}
                {totalPreviewCount > 1 && ` • ${currentPreviewPosition} / ${totalPreviewCount}`}
              </p>
            </div>
          </div>
        );
      })()}
      

    </>
  );
}

// Project Card with Carousel Component - Flattens all previews into carousel
interface ProjectAssetCardProps<T extends BaseAsset> {
  project: Project;
  onNavigateToProject: (id: string) => void;
  onProjectDetail: (project: Project) => void;
  onThumbnailClick: (assetIndex: number, previewIndex: number) => void;
  showPreview: boolean;
  config: AssetOverviewConfig<T>;
  onViewImages?: (projectId: string) => void;
}

function ProjectAssetCard<T extends BaseAsset>({ 
  project, 
  onNavigateToProject, 
  onProjectDetail, 
  onThumbnailClick, 
  showPreview = true,
  config,
  onViewImages
}: ProjectAssetCardProps<T>) {
  const { verticalColors } = useColors();
  const sliderRef = useRef<Slider>(null);
  const carouselContainerRef = useRef<HTMLDivElement>(null);
  const assets = (project[config.assetKey] as T[]) || [];
  
  // Flatten all previews from all assets into single carousel
  const flattenedPreviews: FlattenedPreview<T>[] = [];
  assets.forEach((asset, assetIndex) => {
    const previewUrls = config.getPreviewUrls 
      ? config.getPreviewUrls(asset)
      : (config.getPreviewUrl(asset) ? [config.getPreviewUrl(asset)!] : []);
    
    previewUrls.forEach((previewUrl, previewIndex) => {
      flattenedPreviews.push({
        project,
        asset,
        assetIndex,
        previewUrl,
        previewIndex,
        totalPreviews: previewUrls.length,
      });
    });
  });
  
  const hasMultiplePreviews = flattenedPreviews.length > 1;
  const [currentSlide, setCurrentSlide] = useState(0);

  // Mouse wheel scroll for carousel - horizontal only with throttle
  useEffect(() => {
    const container = carouselContainerRef.current;
    if (!container || !hasMultiplePreviews) return;

    let isScrolling = false;
    let scrollTimeout: ReturnType<typeof setTimeout>;

    const handleWheel = (e: WheelEvent) => {
      // Only respond to horizontal scroll (trackpad left/right swipe)
      const deltaX = e.deltaX;
      
      // Ignore if not horizontal scroll or already scrolling
      if (Math.abs(deltaX) < 10 || isScrolling) {
        return;
      }
      
      // Prevent default scroll
      e.preventDefault();
      
      // Set scrolling flag to prevent multiple triggers
      isScrolling = true;
      
      if (deltaX > 0) {
        // Scroll right - next slide
        sliderRef.current?.slickNext();
      } else if (deltaX < 0) {
        // Scroll left - previous slide
        sliderRef.current?.slickPrev();
      }
      
      // Reset scrolling flag after delay (longer than slide animation)
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        isScrolling = false;
      }, 400); // Slightly longer than slide speed (300ms)
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
      clearTimeout(scrollTimeout);
    };
  }, [hasMultiplePreviews]);

  const settings = {
    dots: true,
    infinite: flattenedPreviews.length > 1,
    speed: 300,
    slidesToShow: 1,
    slidesToScroll: 1,
    swipe: true,
    swipeToSlide: true,
    touchThreshold: 10,
    arrows: false,
    draggable: false,
    beforeChange: (_current: number, next: number) => setCurrentSlide(next),
    customPaging: () => <div />,
    appendDots: (dots: React.ReactNode) => (
      <div className="carousel-dots-container p-[0px] mt-[1px] mr-[0px] mb-[0px] ml-[0px]">
        {dots}
      </div>
    )
  };
  
  // Helper to get asset count text
  const getAssetCountText = () => {
    if (assets.length === 0) return 'No assets';
    
    // Show total preview count if flattened
    if (flattenedPreviews.length > assets.length) {
      return `${flattenedPreviews.length} preview${flattenedPreviews.length === 1 ? '' : 's'}`;
    }
    
    return config.getAssetCount(assets);
  };

  // If preview is hidden, render simplified card
  if (!showPreview) {
    return (
      <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
        {/* Header Only - Simple Style */}
        <div
          onClick={() => onNavigateToProject(project.id)}
          className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
        >
          {/* Vertical Badge + Project Name */}
          <div className="flex items-start gap-2 mb-2">
            {/* Vertical Badge */}
            {project.vertical && (
              <Badge
                className="flex-shrink-0 mt-0.5"
                style={{
                  backgroundColor: verticalColors[project.vertical] || '#bfdbfe',
                  color: '#000000',
                  borderColor: 'transparent',
                  opacity: 0.5,
                }}
              >
                {project.vertical}
              </Badge>
            )}
            
            {/* Project Name */}
            <h3 className="line-clamp-2 flex-1">{project.project_name}</h3>
          </div>
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{config.getAssetCount(assets)}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onProjectDetail(project);
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/50"
              aria-label="View project details"
            >
              <span>Detail</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Header - Clickable to navigate to project */}
      <div
        onClick={() => onNavigateToProject(project.id)}
        className="p-4 pb-3 cursor-pointer hover:bg-muted/30 transition-colors border-b relative"
      >
        {/* Project Name + Vertical Badge (Right-aligned) */}
        <div className="flex items-start justify-between gap-2 min-h-[3rem]">
          {/* Project Name */}
          <h3 className="line-clamp-2 flex-1">{project.project_name}</h3>
          
          {/* Vertical Badge - Right Aligned */}
          {project.vertical && (
            <Badge
              variant="outline"
              className="flex-shrink-0 mt-0.5"
              style={{
                backgroundColor: 'transparent',
                color: verticalColors[project.vertical] || '#bfdbfe',
                borderColor: 'transparent',
              }}
            >
              {project.vertical}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center justify-between mt-1">
          <p className="text-sm text-muted-foreground">{config.getAssetCount(assets)}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onProjectDetail(project);
            }}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded hover:bg-muted/50"
            aria-label="View project details"
          >
            <span>Detail</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <CardContent className="p-2 md:p-3">
        <div 
          ref={carouselContainerRef}
          className="asset-preview-carousel"
        >
          {flattenedPreviews.length === 0 ? (
            // No assets
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <div className="aspect-square flex items-center justify-center">
                <config.EmptyIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>
          ) : hasMultiplePreviews ? (
            // Multiple previews - Carousel (flattened from all assets)
            <>
              {/* Carousel - Each slide has its own rounded container */}
              <div className="relative">
                {/* Navigation Buttons */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sliderRef.current?.slickPrev();
                  }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-background/95 border border-border shadow-lg opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity hover:bg-accent"
                  aria-label="Previous"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    sliderRef.current?.slickNext();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-9 w-9 flex items-center justify-center rounded-full bg-background/95 border border-border shadow-lg opacity-0 group-hover:opacity-100 md:group-hover:opacity-100 transition-opacity hover:bg-accent"
                  aria-label="Next"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
                
                {/* Slide counter badge - shows total preview count (flattened) */}
                <div className="absolute top-2 right-2 z-20 px-2 py-0.5 rounded-full bg-background/80 backdrop-blur-sm text-xs pointer-events-none">
                  {currentSlide + 1}/{flattenedPreviews.length}
                </div>

                <Slider ref={sliderRef} {...settings}>
                {flattenedPreviews.map((preview, index) => {
                  return (
                    <div key={`${preview.asset.id}-${preview.previewIndex}`}>
                      <div className="relative bg-muted rounded-lg overflow-hidden">
                        <div
                          onClick={() => onThumbnailClick(preview.assetIndex, preview.previewIndex)}
                          className="relative aspect-square cursor-pointer"
                        >
                          {preview.previewUrl ? (
                            <img
                              src={preview.previewUrl}
                              alt={preview.asset.asset_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <config.EmptyIcon className="h-16 w-16 text-muted-foreground" />
                            </div>
                          )}
                          
                          {/* Asset badge overlay */}
                          {config.hasTypeBadges && config.renderAssetBadge && (
                            <div className="absolute bottom-2 left-2">
                              {config.renderAssetBadge(preview.asset)}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </Slider>
              </div>
            </>
          ) : (
            // Single preview
            <div className="relative bg-muted rounded-lg overflow-hidden">
              <div
                onClick={() => onThumbnailClick(flattenedPreviews[0].assetIndex, flattenedPreviews[0].previewIndex)}
                className="relative aspect-square cursor-pointer"
              >
              {(() => {
                const preview = flattenedPreviews[0];
                return preview.previewUrl ? (
                  <img
                    src={preview.previewUrl}
                    alt={preview.asset.asset_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <config.EmptyIcon className="h-16 w-16 text-muted-foreground" />
                  </div>
                );
              })()}
              
                {/* Asset badge overlay */}
                {config.hasTypeBadges && config.renderAssetBadge && (
                  <div className="absolute bottom-2 left-2">
                    {config.renderAssetBadge(flattenedPreviews[0].asset)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
