import { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, Copy, ExternalLink, Image as ImageIcon, Share2, Check, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Info, ChevronDown, MessageCircle, FolderIcon, Search, ArrowUp } from 'lucide-react';
import { Project, LightroomAsset, Collaborator, ActionableItem } from '../types/project';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { ProjectDetailSidebar } from './ProjectDetailSidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ContactAdminDialog } from './ContactAdminDialog';
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
import { 
  buildTree, 
  getRootAssets,
  getAllDescendants,
  getParentChain,
  getFolderItemCount,
  normalizeLightroomAssets,
  type LightroomTreeNode
} from '../utils/lightroomUtils';

interface LightroomPageProps {
  project: Project;
  collaborators: Collaborator[];
  onBack: () => void;
  onEdit: (project: Project) => void;
  onNavigateToLightroom: (projectId: string) => void;
  onNavigateToGDrive?: (projectId: string) => void;
  isPublicView?: boolean; // For stakeholder access
}

export function LightroomPage({ project, collaborators, onBack, onEdit, onNavigateToLightroom, onNavigateToGDrive, isPublicView = false }: LightroomPageProps) {
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [detailSidebarOpen, setDetailSidebarOpen] = useState(false);
  const [groupByAsset, setGroupByAsset] = useState(false);
  const [filterAssetId, setFilterAssetId] = useState<string>('all');
  const [openAssets, setOpenAssets] = useState<Set<string>>(new Set());
  
  // 🆕 NESTED FOLDERS: Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null = root level
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const gridRef = useRef<HTMLDivElement>(null);
  const [copiedFolderIds, setCopiedFolderIds] = useState<Set<string>>(new Set());

  const lightroomAssets = normalizeLightroomAssets(project.lightroom_assets || []); // 🔧 Normalize for backward compatibility
  const assets = project.actionable_items || [];
  const hasAssets = assets.length > 0;
  
  // Initialize all assets as open
  useEffect(() => {
    if (groupByAsset) {
      const assetIds = new Set<string>();
      // Add asset IDs from lightroom assets
      lightroomAssets.forEach(lrAsset => {
        if (lrAsset.asset_id) assetIds.add(lrAsset.asset_id);
      });
      // Always add "no-asset" group
      assetIds.add('no-asset');
      setOpenAssets(assetIds);
    }
  }, [groupByAsset, lightroomAssets]);

  const toggleAsset = (assetId: string) => {
    setOpenAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  // 🆕 NESTED FOLDERS: Get assets for current folder (filtered by folder navigation)
  const currentFolderAssets = currentFolderId === null
    ? getRootAssets(lightroomAssets)
    : lightroomAssets.filter(asset => asset.parent_id === currentFolderId);
  
  // 🆕 NESTED FOLDERS: Apply search filter (searches across all levels)
  const searchFilteredAssets = searchQuery.trim()
    ? lightroomAssets.filter(asset => 
        asset.asset_name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : currentFolderAssets;

  // Filter lightroom assets by selected asset
  const filteredLightroomAssets = filterAssetId === 'all' 
    ? searchFilteredAssets 
    : filterAssetId === 'no-asset'
    ? searchFilteredAssets.filter(lrAsset => !lrAsset.asset_id)
    : searchFilteredAssets.filter(lrAsset => lrAsset.asset_id === filterAssetId);

  // Group lightroom assets by asset
  const groupedLightroomAssets = groupByAsset ? (() => {
    const groups: Record<string, LightroomAsset[]> = {};
    
    filteredLightroomAssets.forEach(lrAsset => {
      const assetId = lrAsset.asset_id || 'no-asset';
      if (!groups[assetId]) {
        groups[assetId] = [];
      }
      groups[assetId].push(lrAsset);
    });
    
    return groups;
  })() : null;

  // Get asset title by ID
  const getAssetTitle = (assetId?: string) => {
    if (!assetId || assetId === 'no-asset') return 'No Asset';
    const asset = assets.find(a => a.id === assetId);
    return asset?.title || 'Unknown Asset';
  };

  // 🆕 NESTED FOLDERS: Navigation functions
  const navigateToFolder = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchQuery(''); // Clear search when navigating
    setFocusedIndex(-1);
  };

  const navigateUp = () => {
    if (currentFolderId === null) return;
    
    const currentFolder = lightroomAssets.find(a => a.id === currentFolderId);
    if (currentFolder) {
      setCurrentFolderId(currentFolder.parent_id || null);
      setSearchQuery('');
      setFocusedIndex(-1);
    }
  };

  // 🆕 NESTED FOLDERS: Get breadcrumb path
  const folderPath = currentFolderId ? getParentChain(lightroomAssets, currentFolderId) : [];
  const currentFolder = currentFolderId ? lightroomAssets.find(a => a.id === currentFolderId) : null;

  const selectedLightroomAsset = selectedAssetIndex !== null ? filteredLightroomAssets[selectedAssetIndex] : null;
  
  // Minimum swipe distance (in px)
  const minSwipeDistance = 50;

  // Keyboard navigation and mouse wheel zoom for lightbox
  useEffect(() => {
    if (selectedAssetIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        navigateToPrevious();
      } else if (e.key === 'ArrowRight') {
        navigateToNext();
      }
    };

    const handleWheel = (e: WheelEvent) => {
      // Prevent default scroll behavior and zoom directly
      e.preventDefault();
      
      // Zoom in/out based on wheel direction
      if (e.deltaY < 0) {
        // Scroll up = zoom in
        setZoomLevel(prev => Math.min(prev + 0.1, 3));
      } else {
        // Scroll down = zoom out
        setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: false });
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [selectedAssetIndex, filteredLightroomAssets.length]);

  const openLightbox = (index: number) => {
    setSelectedAssetIndex(index);
    setZoomLevel(1);
  };

  const closeLightbox = () => {
    setSelectedAssetIndex(null);
    setZoomLevel(1);
  };

  const navigateToPrevious = () => {
    if (selectedAssetIndex === null) return;
    setSelectedAssetIndex((selectedAssetIndex - 1 + filteredLightroomAssets.length) % filteredLightroomAssets.length);
    setZoomLevel(1);
  };

  const navigateToNext = () => {
    if (selectedAssetIndex === null) return;
    setSelectedAssetIndex((selectedAssetIndex + 1) % filteredLightroomAssets.length);
    setZoomLevel(1);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
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
      navigateToNext();
    } else if (isRightSwipe) {
      navigateToPrevious();
    }
  };

  const copyToClipboardFallback = (text: string): boolean => {
    try {
      // Create textarea element
      const textarea = document.createElement('textarea');
      textarea.value = text;
      
      // Make it invisible but not display:none (which prevents selection)
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
      
      // Focus and select text
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      
      // Try to copy
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textarea);
      
      return successful;
    } catch (err) {
      console.error('Fallback copy error:', err);
      return false;
    }
  };

  const handleCopyName = async (name: string) => {
    console.log('Attempting to copy name:', name);
    
    // Try modern Clipboard API first
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(name);
        toast.success('Asset name copied!');
        console.log('✓ Copy name success (Clipboard API)');
        return;
      }
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error);
    }
    
    // Fallback to execCommand
    const success = copyToClipboardFallback(name);
    if (success) {
      toast.success('Asset name copied!');
      console.log('✓ Copy name success (fallback)');
    } else {
      toast.error('Failed to copy name');
      console.error('✗ Copy name failed');
    }
  };

  const handleCopyLightroomLink = async (url: string) => {
    console.log('Attempting to copy link:', url);
    
    // Try modern Clipboard API first
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied!');
        console.log('✓ Copy link success (Clipboard API)');
        return;
      }
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error);
    }
    
    // Fallback to execCommand
    const success = copyToClipboardFallback(url);
    if (success) {
      toast.success('Link copied!');
      console.log('✓ Copy link success (fallback)');
    } else {
      toast.error('Failed to copy link');
      console.error('✗ Copy link failed');
    }
  };

  const handleShareLink = async () => {
    const shareUrl = `${window.location.origin}?lightroom=${project.id}`;
    console.log('Attempting to copy share link:', shareUrl);
    
    // Try modern Clipboard API first
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        toast.success('Share link copied!');
        console.log('✓ Copy share link success (Clipboard API)');
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error);
    }
    
    // Fallback to execCommand
    const success = copyToClipboardFallback(shareUrl);
    if (success) {
      setCopied(true);
      toast.success('Share link copied!');
      console.log('✓ Copy share link success (fallback)');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy share link');
      console.error('✗ Copy share link failed');
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

  // Render asset card
  const renderAssetCard = (asset: LightroomAsset, index: number) => (
    <Card
      key={asset.id}
      className="group overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => openLightbox(index)}
    >
      <CardContent className="p-0">
        {/* Thumbnail from Lightroom Link */}
        <div className="aspect-square bg-muted flex items-center justify-center overflow-hidden relative">
          {asset.lightroom_url && isValidUrl(asset.lightroom_url) ? (
            <img
              src={asset.lightroom_url}
              alt={asset.asset_name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={(e) => {
                // If image fails to load, hide it
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : null}
          {(!asset.lightroom_url || !isValidUrl(asset.lightroom_url)) && (
            <ImageIcon className="h-16 w-16 text-muted-foreground" />
          )}
          
          {/* Asset Badge - Top Left Corner */}
          {!groupByAsset && asset.asset_id && (
            <div className="absolute top-2 left-2">
              <Badge variant="secondary" className="text-xs bg-black/60 text-white border-0 backdrop-blur-sm">
                {getAssetTitle(asset.asset_id)}
              </Badge>
            </div>
          )}
        </div>

        {/* Asset Info */}
        <div className="p-4 space-y-3">
          <h3 className="font-medium truncate text-center">{asset.asset_name}</h3>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {/* Copy Name Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyName(asset.asset_name);
              }}
              className="text-xs px-2 py-1 rounded-md bg-secondary/10 text-secondary-foreground hover:bg-secondary/20 transition-colors flex items-center gap-1"
            >
              <Copy className="h-3 w-3" />
              Copy Name
            </button>
            
            {/* Copy Link Button */}
            {asset.lightroom_url && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLightroomLink(asset.lightroom_url!);
                }}
                className="text-xs px-2 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center gap-1"
              >
                <Copy className="h-3 w-3" />
                Copy Link
              </button>
            )}
            
            {/* GDrive Button */}
            {asset.gdrive_url && (
              <a
                href={asset.gdrive_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-xs px-2 py-1 rounded-md bg-accent text-accent-foreground hover:bg-accent/80 transition-colors flex items-center gap-1"
              >
                <ExternalLink className="h-3 w-3" />
                GDrive
              </a>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {!isPublicView && (
                <>
                  {/* Back Button - Icon only on mobile */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onBack}
                    className="sm:hidden"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {/* Back Button - With text on desktop */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onBack}
                    className="hidden sm:flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <div className="h-5 w-px bg-border" />
                </>
              )}
              <div>
                <h1 className="text-xl font-semibold">{project.project_name}</h1>
                <p className="text-sm text-muted-foreground">
                  Lightroom Assets
                  {isPublicView && (
                    <span className="ml-2 text-xs text-muted-foreground/70">
                      (View Only)
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {/* Last Updated Info - Desktop only */}
              {project.updated_at && (
                <>
                  <p className="text-xs text-muted-foreground/70 hidden sm:block">
                    Updated: {new Date(project.updated_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                  <div className="h-5 w-px bg-border hidden sm:block" />
                </>
              )}
              
              {/* Project Details Button - Mobile (icon only) */}
              <Button
                variant="outline"
                size="icon"
                onClick={() => setDetailSidebarOpen(true)}
                className="sm:hidden"
              >
                <Info className="h-4 w-4" />
              </Button>
              
              {/* Project Details Button - Desktop */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDetailSidebarOpen(true)}
                className="hidden sm:flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                Project Details
              </Button>

              {/* Share Button - Only for authenticated users */}
              {!isPublicView && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowShareDialog(true)}
                  className="flex items-center gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
              )}
              
              {/* Contact Admin Button - Always visible for all users */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowContactDialog(true)}
                className="flex items-center gap-2"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Contact Admin</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      {assets.length > 0 && hasAssets && (
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              {/* Filter by Asset */}
              <div className="flex items-center gap-2">
                <Label htmlFor="filter-asset" className="text-sm whitespace-nowrap">
                  Filter by Asset:
                </Label>
                <Select value={filterAssetId} onValueChange={setFilterAssetId}>
                  <SelectTrigger id="filter-asset" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assets</SelectItem>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Group by Asset Toggle with Last Updated (Mobile) */}
              <div className="flex items-center justify-between gap-4 sm:justify-start sm:gap-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="group-by-asset" className="text-sm whitespace-nowrap">
                    Group by Asset
                  </Label>
                  <button
                    id="group-by-asset"
                    onClick={() => setGroupByAsset(!groupByAsset)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      groupByAsset ? 'bg-primary' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        groupByAsset ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                
                {/* Last Updated Info - Mobile only */}
                {project.updated_at && (
                  <p className="text-xs text-muted-foreground/70 sm:hidden whitespace-nowrap">
                    Updated: {new Date(project.updated_at).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {filteredLightroomAssets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {assets.length === 0 
                  ? 'No Lightroom assets available for this project'
                  : 'No assets found for the selected filter'
                }
              </p>
              {!isPublicView && assets.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Add assets in the project edit page
                </p>
              )}
            </CardContent>
          </Card>
        ) : groupByAsset && groupedLightroomAssets ? (
          // Grouped by Asset View
          <div className="space-y-4">
            {Object.keys(groupedLightroomAssets).map((assetId) => {
              const assetLightroomAssets = groupedLightroomAssets[assetId];
              const isOpen = openAssets.has(assetId);
              
              return (
                <Card key={assetId}>
                  <Collapsible open={isOpen} onOpenChange={() => toggleAsset(assetId)}>
                    {/* Asset Header */}
                    <div className="border-b border-border bg-muted/30">
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-center justify-between px-6 py-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <div className="flex items-center gap-3">
                            <ChevronDown 
                              className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${
                                isOpen ? '' : '-rotate-90'
                              }`}
                            />
                            <h3 className="font-medium">{getAssetTitle(assetId)}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {assetLightroomAssets.length} {assetLightroomAssets.length === 1 ? 'image' : 'images'}
                            </Badge>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                    </div>

                    {/* Asset Lightroom Images */}
                    <CollapsibleContent>
                      <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {assetLightroomAssets.map((lrAsset, idx) => {
                            // Find the original index in filteredLightroomAssets for lightbox navigation
                            const originalIndex = filteredLightroomAssets.findIndex(a => a.id === lrAsset.id);
                            return renderAssetCard(lrAsset, originalIndex);
                          })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        ) : (
          // Grid View (Default)
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredLightroomAssets.map((lrAsset, index) => renderAssetCard(lrAsset, index))}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedAssetIndex !== null && (
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
          {filteredLightroomAssets.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToPrevious();
                }}
                className="hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-neutral-800/90 hover:bg-neutral-700/90 backdrop-blur-md text-white transition-colors shadow-lg"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-7 w-7" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToNext();
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
              <h3 className="text-white text-sm sm:text-base font-normal mb-3 text-center break-all">{selectedLightroomAsset.asset_name}</h3>
              
              {/* Show asset badge in lightbox */}
              {selectedLightroomAsset.asset_id && (
                <div className="flex justify-center mb-3">
                  <Badge variant="secondary" className="text-xs">
                    Asset: {getAssetTitle(selectedLightroomAsset.asset_id)}
                  </Badge>
                </div>
              )}
              
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyName(selectedLightroomAsset.asset_name);
                  }}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-neutral-700/80 hover:bg-neutral-600/80 text-white transition-colors flex items-center gap-2 touch-manipulation text-sm"
                >
                  <Copy className="h-4 w-4" />
                  Copy Name
                </button>
                {selectedLightroomAsset.lightroom_url && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLightroomLink(selectedLightroomAsset.lightroom_url!);
                    }}
                    className="px-3 sm:px-4 py-2 rounded-lg bg-neutral-700/80 hover:bg-neutral-600/80 text-white transition-colors flex items-center gap-2 touch-manipulation text-sm"
                  >
                    <Copy className="h-4 w-4" />
                    Copy Link
                  </button>
                )}
              </div>
              <p className="text-xs text-white/60 text-center">
                Created: {new Date(selectedLightroomAsset.created_at).toLocaleDateString('en-US', { 
                  month: '2-digit', 
                  day: '2-digit', 
                  year: 'numeric' 
                })}
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
          {filteredLightroomAssets.length > 1 && (
            <div className="absolute top-2 sm:top-4 left-4 z-50">
              <div className="bg-neutral-800/90 backdrop-blur-md rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                <span className="text-white text-xs sm:text-sm">
                  {selectedAssetIndex! + 1} / {filteredLightroomAssets.length}
                </span>
              </div>
            </div>
          )}
          
          {/* Swipe hint - only show on mobile */}
          {filteredLightroomAssets.length > 1 && (
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
              {selectedLightroomAsset.lightroom_url && isValidUrl(selectedLightroomAsset.lightroom_url) ? (
                <img
                  src={selectedLightroomAsset.lightroom_url}
                  alt={selectedLightroomAsset.asset_name}
                  className="max-w-full max-h-[calc(100vh-10rem)] sm:max-h-[calc(100vh-8rem)] object-contain select-none"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  draggable={false}
                />
              ) : (
                <div className="flex items-center justify-center w-64 h-64 sm:w-96 sm:h-96">
                  <ImageIcon className="h-16 w-16 sm:h-24 sm:w-24 text-white/50" />
                </div>
              )}
            </div>
          </div>


          {/* Mobile Action Bar - Fixed at bottom */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md border-t border-white/10 p-4 safe-area-inset">
            {selectedLightroomAsset.asset_id && (
              <div className="flex justify-center mb-2">
                <Badge variant="secondary" className="text-xs">
                  Asset: {getAssetTitle(selectedLightroomAsset.asset_id)}
                </Badge>
              </div>
            )}
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyName(selectedLightroomAsset.asset_name);
                }}
                className="flex-1 px-3 py-2.5 rounded-lg bg-neutral-700/80 active:bg-neutral-600/80 text-white transition-colors flex items-center justify-center gap-2 touch-manipulation text-sm"
              >
                <Copy className="h-4 w-4" />
                Copy Name
              </button>
              {selectedLightroomAsset.lightroom_url && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLightroomLink(selectedLightroomAsset.lightroom_url!);
                  }}
                  className="flex-1 px-3 py-2.5 rounded-lg bg-neutral-700/80 active:bg-neutral-600/80 text-white transition-colors flex items-center justify-center gap-2 touch-manipulation text-sm"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </button>
              )}
            </div>
            <p className="text-xs text-white/50 text-center">
              {selectedLightroomAsset.asset_name}
            </p>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Lightroom Assets</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Share this link with stakeholders to give them access to view all Lightroom assets for this project.
            </p>

            <div className="space-y-2">
              <Label>Shareable Link</Label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={`${window.location.origin}?lightroom=${project.id}`}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShareLink}
                  className="flex items-center gap-2"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> Anyone with this link can view the Lightroom assets for this project. The link is <strong>read-only</strong> — viewers cannot edit, delete, or navigate to other pages.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Admin Dialog */}
      <ContactAdminDialog
        open={showContactDialog}
        onOpenChange={setShowContactDialog}
      />

      {/* Project Detail Sidebar */}
      <ProjectDetailSidebar
        project={project}
        collaborators={collaborators}
        isOpen={detailSidebarOpen}
        onClose={() => setDetailSidebarOpen(false)}
        onEdit={onEdit}
        onNavigateToLightroom={onNavigateToLightroom}
        onNavigateToGDrive={onNavigateToGDrive}
        isReadOnly={isPublicView}
      />
    </div>
  );
}
