/**
 * GDrivePreviewGalleryPage - Gallery view for all GDrive previews in a project
 * 
 * Features:
 * - Grid/List view toggle
 * - Display all preview images from all GDrive assets
 * - Copy preview name functionality
 * - Breadcrumb navigation
 * - Filter by Asset and Type
 * - Folder info section
 * - Mobile-friendly design
 */

import { useState, useEffect } from 'react';
import { ArrowLeft, Grid2x2, List, Copy, ExternalLink, Folder, Eye, EyeOff, Image, ZoomIn, ZoomOut, FolderIcon, FileIcon } from 'lucide-react';
import { Project, GDriveAsset, GDrivePreview, ActionableItem } from '../types/project';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Label } from './ui/label';
import { toast } from 'sonner@2.0.3';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from './ui/breadcrumb';
import { getParentChain } from '../utils/gdriveUtils';

interface GDrivePreviewGalleryPageProps {
  project: Project;
  assetId?: string | null;
  allGDriveAssets?: GDriveAsset[];
  actionableItems?: ActionableItem[];
  onBack: () => void;
  onNavigateToFolder?: (assetId: string | null) => void;
  isPublicView?: boolean;
}

interface FlatPreview {
  url: string;
  name?: string;
  assetName: string;
  assetLink: string;
  assetType: 'file' | 'folder';
  gdriveAssetId: string;
  actionableItemId?: string;
}

const DEFAULT_FOLDER_PREVIEW = 
  'https://snymazdqexjovkdvepso.supabase.co/storage/v1/object/public/gdrive_previews/google_drive_folder_icon_for_windows_11_by_mr_celo_deoprbs.ico';

export function GDrivePreviewGalleryPage({ 
  project,
  assetId,
  allGDriveAssets = [],
  actionableItems = [],
  onBack,
  onNavigateToFolder,
  isPublicView = false 
}: GDrivePreviewGalleryPageProps) {
  // View mode state - persisted to localStorage
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gdrive-gallery-view-mode');
      return saved === 'list' ? 'list' : 'grid';
    }
    return 'grid';
  });

  // Filter states
  const [filterAssetId, setFilterAssetId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'file' | 'folder'>('all');

  // Show details state - persisted to localStorage
  const [showDetails, setShowDetails] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('gdrive-gallery-show-details');
      return saved === 'true' ? true : false; // Default to false (hidden)
    }
    return false;
  });

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);

  const toggleViewMode = () => {
    const newMode = viewMode === 'grid' ? 'list' : 'grid';
    setViewMode(newMode);
    localStorage.setItem('gdrive-gallery-view-mode', newMode);
  };

  const toggleShowDetails = () => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);
    localStorage.setItem('gdrive-gallery-show-details', String(newShowDetails));
  };

  // Get current asset (folder/file being viewed)
  const currentAsset = assetId 
    ? (allGDriveAssets.length > 0 ? allGDriveAssets : project.gdrive_assets || []).find((a: GDriveAsset) => a.id === assetId)
    : null;

  // Get breadcrumbs for navigation
  const getBreadcrumbs = () => {
    if (!currentAsset) {
      return [{ id: null, name: 'All Images' }];
    }
    
    const assetsArray = allGDriveAssets.length > 0 ? allGDriveAssets : project.gdrive_assets || [];
    const parentChain = getParentChain(assetsArray, currentAsset.id);
    return [
      { id: null, name: 'Google Drive' },
      ...parentChain.map(asset => ({ id: asset.id, name: asset.asset_name })),
      { id: currentAsset.id, name: currentAsset.asset_name } // Add current asset at the end
    ];
  };

  // Filter assets by assetId if provided
  // If assetId is provided, show children of that folder (items with parent_folder_id === assetId)
  // If no assetId, show root items (items with parent_folder_id === null or undefined)
  const filteredAssets = assetId 
    ? (allGDriveAssets.length > 0 ? allGDriveAssets : project.gdrive_assets || []).filter((asset: GDriveAsset) => asset.parent_folder_id === assetId)
    : (allGDriveAssets.length > 0 ? allGDriveAssets : project.gdrive_assets || []).filter((asset: GDriveAsset) => !asset.parent_folder_id);

  // Flatten all previews from filtered assets
  const allPreviews: FlatPreview[] = filteredAssets.flatMap((asset: GDriveAsset) => {
    const previews: FlatPreview[] = [];
    
    // Handle preview_urls (new format with names)
    if (asset.preview_urls && asset.preview_urls.length > 0) {
      asset.preview_urls.forEach((preview) => {
        if (typeof preview === 'string') {
          // Backward compatibility: old format (string)
          previews.push({
            url: preview,
            name: undefined,
            assetName: asset.asset_name,
            assetLink: asset.gdrive_link,
            assetType: asset.asset_type,
            gdriveAssetId: asset.id,
            actionableItemId: asset.actionable_item_id,
          });
        } else {
          // New format: object with url and name
          previews.push({
            url: preview.url,
            name: preview.name,
            assetName: asset.asset_name,
            assetLink: asset.gdrive_link,
            assetType: asset.asset_type,
            gdriveAssetId: asset.id,
            actionableItemId: asset.actionable_item_id,
          });
        }
      });
    }
    // Handle single preview_url (backward compatibility)
    else if (asset.preview_url) {
      previews.push({
        url: asset.preview_url,
        name: undefined,
        assetName: asset.asset_name,
        assetLink: asset.gdrive_link,
        assetType: asset.asset_type,
        gdriveAssetId: asset.id,
        actionableItemId: asset.actionable_item_id,
      });
    }
    // No custom preview - use default for folders
    else if (asset.asset_type === 'folder') {
      previews.push({
        url: DEFAULT_FOLDER_PREVIEW,
        name: undefined,
        assetName: asset.asset_name,
        assetLink: asset.gdrive_link,
        assetType: asset.asset_type,
        gdriveAssetId: asset.id,
        actionableItemId: asset.actionable_item_id,
      });
    }
    
    return previews;
  });

  // Apply filters
  const filteredPreviews = allPreviews.filter((preview) => {
    // Filter by asset
    if (filterAssetId !== 'all') {
      if (filterAssetId === 'no-asset') {
        if (preview.actionableItemId) return false;
      } else {
        if (preview.actionableItemId !== filterAssetId) return false;
      }
    }
    
    // Filter by type
    if (filterType !== 'all') {
      if (preview.assetType !== filterType) return false;
    }
    
    return true;
  });

  // Get unique assets for filter dropdown
  const assets = actionableItems.filter(item => 
    allPreviews.some(p => p.actionableItemId === item.id)
  );
  const hasAssets = assets.length > 0;

  const handleCopyName = async (name: string | undefined, assetName: string) => {
    const textToCopy = name || assetName;
    
    try {
      // Try modern Clipboard API first
      await navigator.clipboard.writeText(textToCopy);
      toast.success(`Copied: ${textToCopy}`);
    } catch (err) {
      // Fallback for when Clipboard API is blocked
      try {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          toast.success(`Copied: ${textToCopy}`);
        } else {
          toast.error('Failed to copy to clipboard');
        }
      } catch (fallbackErr) {
        console.error('Copy failed:', fallbackErr);
        toast.error('Failed to copy to clipboard');
      }
    }
  };

  const handleCopyLink = async (link: string) => {
    try {
      // Try modern Clipboard API first
      await navigator.clipboard.writeText(link);
      toast.success('GDrive link copied!');
    } catch (err) {
      // Fallback for when Clipboard API is blocked
      try {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        textarea.style.top = '-999999px';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        const successful = document.execCommand('copy');
        document.body.removeChild(textarea);
        
        if (successful) {
          toast.success('GDrive link copied!');
        } else {
          toast.error('Failed to copy link');
        }
      } catch (fallbackErr) {
        console.error('Copy failed:', fallbackErr);
        toast.error('Failed to copy link');
      }
    }
  };

  const handleOpenGDrive = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const handleOpenLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const handleCloseLightbox = () => {
    setLightboxOpen(false);
    setZoomLevel(1); // Reset zoom when closing
  };

  const handleNextImage = () => {
    setLightboxIndex((prev) => (prev + 1) % filteredPreviews.length);
    setZoomLevel(1); // Reset zoom when changing image
  };

  const handlePrevImage = () => {
    setLightboxIndex((prev) => (prev - 1 + filteredPreviews.length) % filteredPreviews.length);
    setZoomLevel(1); // Reset zoom when changing image
  };

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3)); // Max 3x zoom
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5)); // Min 0.5x zoom
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') {
      handleNextImage();
    } else if (e.key === 'ArrowLeft') {
      handlePrevImage();
    } else if (e.key === 'Escape') {
      handleCloseLightbox();
    }
  };

  // Global keyboard listener for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNextImage();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrevImage();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseLightbox();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [lightboxOpen, lightboxIndex, filteredPreviews.length]);

  // Mouse wheel zoom listener for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleWheel = (e: WheelEvent) => {
      // Check if user is scrolling over the image area
      const target = e.target as HTMLElement;
      if (target.tagName === 'IMG' || target.closest('.lightbox-image-container')) {
        e.preventDefault();
        
        if (e.deltaY < 0) {
          // Scroll up = zoom in
          handleZoomIn();
        } else if (e.deltaY > 0) {
          // Scroll down = zoom out
          handleZoomOut();
        }
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [lightboxOpen]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="min-w-0 flex-1">
                <h1 className="truncate">Preview Images</h1>
                <p className="text-sm text-muted-foreground">
                  {filteredPreviews.length} image{filteredPreviews.length !== 1 ? 's' : ''}
                  {filteredPreviews.length !== allPreviews.length && ` (${allPreviews.length} total)`}
                </p>
              </div>
            </div>
            
            {/* View Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Show/Hide Details Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleShowDetails}
                title={showDetails ? 'Hide details' : 'Show details'}
              >
                {showDetails ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              
              {/* Grid/List Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={toggleViewMode}
              >
                {viewMode === 'grid' ? (
                  <>
                    <List className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">List</span>
                  </>
                ) : (
                  <>
                    <Grid2x2 className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Grid</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Filters Row */}

        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs & Folder Info */}
        {currentAsset && (
          <div className="mb-4 p-4 rounded-lg bg-muted/30 border border-dashed">
            <div className="space-y-3">
              {/* Breadcrumbs Navigation */}
              <Breadcrumb>
                <BreadcrumbList>
                  {getBreadcrumbs().map((crumb, index) => {
                    const isLast = index === getBreadcrumbs().length - 1;
                    return (
                      <div key={crumb.id || 'root'} className="contents">
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              onClick={() => {
                                if (crumb.id === null) {
                                  // Root - go back to GDrive page
                                  onBack();
                                } else if (onNavigateToFolder) {
                                  // Navigate to specific folder
                                  onNavigateToFolder(crumb.id);
                                }
                              }}
                              className="cursor-pointer"
                            >
                              {crumb.name}
                            </BreadcrumbLink>
                          )}
                        </BreadcrumbItem>
                        {!isLast && <BreadcrumbSeparator />}
                      </div>
                    );
                  })}
                </BreadcrumbList>
              </Breadcrumb>
              
              {/* Folder Info & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentAsset.asset_type === 'folder' ? (
                    <FolderIcon className="h-5 w-5 text-primary" />
                  ) : (
                    <FileIcon className="h-5 w-5 text-primary" />
                  )}
                  <div>
                    <h2 className="font-medium">
                      {currentAsset.asset_name}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {filteredPreviews.length} preview image{filteredPreviews.length !== 1 ? 's' : ''}
                      {filteredPreviews.length !== allPreviews.length && ` (${allPreviews.length} total)`}
                    </p>
                  </div>
                </div>
                {currentAsset.gdrive_link && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(currentAsset.gdrive_link, '_blank', 'noopener,noreferrer')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in GDrive
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {allPreviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Grid2x2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No preview images</p>
            <p className="text-sm text-muted-foreground">
              This {currentAsset ? currentAsset.asset_type : 'project'} doesn't have any preview images yet
            </p>
          </div>
        ) : filteredPreviews.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Grid2x2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground mb-2">No images match the filters</p>
            <p className="text-sm text-muted-foreground">
              Try adjusting your filters to see more images
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPreviews.map((preview, index) => (
              <Card key={index} className="overflow-hidden group">
                {/* Header - Only shown when details are hidden */}
                {!showDetails && (
                  <div className="bg-muted/50 dark:bg-muted/30 px-3 py-2 flex items-center gap-2 border-b border-border/50">
                    <Image className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <p className="text-xs truncate flex-1">
                      {preview.name || preview.assetName}
                    </p>
                  </div>
                )}
                
                {/* Image - Click to open lightbox */}
                <div 
                  className="aspect-square bg-muted relative overflow-hidden cursor-pointer"
                  onClick={() => handleOpenLightbox(index)}
                  title="Click to view fullscreen"
                >
                  <ImageWithFallback
                    src={preview.url}
                    alt={preview.name || preview.assetName}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  
                  {/* Zoom indicator on hover */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 dark:bg-black/90 rounded-full p-3">
                      <svg className="h-5 w-5 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Info - Conditional rendering based on showDetails */}
                {showDetails && (
                  <div className="p-3 space-y-2">
                    {/* Image Name (if available) */}
                    {preview.name && (
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Image Name</p>
                        <p className="text-sm truncate">{preview.name}</p>
                      </div>
                    )}
                    
                    {/* Asset Name */}
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Asset Name</p>
                      <p className="text-sm truncate">{preview.assetName}</p>
                    </div>
                    
                    {/* Asset Type Badge */}
                    <Badge variant="secondary" className="text-xs">
                      {preview.assetType === 'folder' ? 'Folder' : 'File'}
                    </Badge>
                    
                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleCopyName(preview.name, preview.assetName)}
                      >
                        <Copy className="h-3 w-3 mr-1.5" />
                        Copy Name
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenGDrive(preview.assetLink)}
                      >
                        <Folder className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="space-y-3">
            {filteredPreviews.map((preview, index) => (
              <Card key={index} className="overflow-hidden group">
                <div className="flex gap-4 p-4">
                  <div className="flex flex-col gap-2 shrink-0">
                    {/* Thumbnail - Click to open lightbox */}
                    <div 
                      className="w-24 h-24 bg-muted rounded-lg overflow-hidden cursor-pointer relative"
                      onClick={() => handleOpenLightbox(index)}
                      title="Click to view fullscreen"
                    >
                      <ImageWithFallback
                        src={preview.url}
                        alt={preview.name || preview.assetName}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Zoom indicator on hover */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 dark:bg-black/90 rounded-full p-2">
                          <svg className="h-4 w-4 text-black dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    {/* Preview Name - Only shown when details are hidden */}
                    {!showDetails && (
                      <div className="w-24 flex items-center gap-1.5">
                        <Image className="h-3 w-3 shrink-0 text-muted-foreground" />
                        <p className="text-xs truncate flex-1">
                          {preview.name || preview.assetName}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Info - Conditional rendering based on showDetails */}
                  {showDetails && (
                    <>
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* Preview Name (if available) */}
                        {preview.name && (
                          <div>
                            <p className="text-xs text-muted-foreground">Preview Name</p>
                            <p className="text-sm truncate">{preview.name}</p>
                          </div>
                        )}
                        
                        {/* Asset Name */}
                        <div>
                          <p className="text-xs text-muted-foreground">Asset Name</p>
                          <p className="text-sm truncate">{preview.assetName}</p>
                        </div>
                        
                        {/* Asset Type Badge */}
                        <Badge variant="secondary" className="text-xs">
                          {preview.assetType === 'folder' ? 'Folder' : 'File'}
                        </Badge>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyName(preview.name, preview.assetName)}
                        >
                          <Copy className="h-3 w-3 mr-1.5" />
                          <span className="hidden sm:inline">Copy</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenGDrive(preview.assetLink)}
                        >
                          <Folder className="h-3 w-3 mr-1.5" />
                          <span className="hidden sm:inline">Open</span>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxOpen && filteredPreviews.length > 0 && (
        <div 
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={handleCloseLightbox}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          {/* Close Button */}
          <button
            onClick={handleCloseLightbox}
            className="absolute top-4 right-4 z-50 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            title="Close (Esc)"
          >
            <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Previous Button */}
          {filteredPreviews.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrevImage();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Previous (←)"
            >
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Image Container */}
          <div 
            className="lightbox-image-container max-w-[90vw] max-h-[90vh] flex items-center justify-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <ImageWithFallback
              src={filteredPreviews[lightboxIndex].url}
              alt={filteredPreviews[lightboxIndex].name || filteredPreviews[lightboxIndex].assetName}
              className="max-w-full max-h-[80vh] object-contain transition-transform duration-200 cursor-zoom-in"
              style={{ transform: `scale(${zoomLevel})` }}
              onClick={handleResetZoom}
            />
          </div>

          {/* Bottom Info Panel & Zoom Controls - Desktop Only */}
          <div className="hidden sm:flex absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 flex-col items-center gap-3">
            {/* Info Panel */}
            <div className="bg-neutral-800/90 backdrop-blur-md rounded-xl p-4 sm:p-5 max-w-xl shadow-2xl group">
              {/* Preview Name - Only show if current preview has a name */}
              {filteredPreviews[lightboxIndex].name && (
                <div className="mb-3 flex items-center justify-center gap-2">
                  <div className="flex-1 max-w-sm">
                    <div className="bg-neutral-700/60 rounded-lg px-3 py-2 text-center">
                      <p className="text-white/90 text-sm truncate">{filteredPreviews[lightboxIndex].name}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyName(filteredPreviews[lightboxIndex].name, filteredPreviews[lightboxIndex].assetName);
                    }}
                    className="p-2 rounded-lg bg-neutral-700/80 hover:bg-neutral-600/80 text-white transition-colors touch-manipulation"
                    title="Copy preview name"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLink(filteredPreviews[lightboxIndex].assetLink);
                  }}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-neutral-700/80 hover:bg-neutral-600/80 text-white transition-colors flex items-center gap-2 touch-manipulation text-sm"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenGDrive(filteredPreviews[lightboxIndex].assetLink);
                  }}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-neutral-700/80 hover:bg-neutral-600/80 text-white transition-colors flex items-center gap-2 touch-manipulation text-sm"
                >
                  <GoogleDriveIcon className="h-4 w-4" />
                  GDrive
                </button>
              </div>
              <p className="text-xs text-white/60 text-center">
                {lightboxIndex + 1} / {filteredPreviews.length}
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
                Scroll to zoom
              </div>
            </div>
          </div>

          {/* Next Button */}
          {filteredPreviews.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNextImage();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              title="Next (→)"
            >
              <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
