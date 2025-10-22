import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { ArrowLeft, Copy, ExternalLink, Share2, Check, FolderIcon, FileIcon, Download, ChevronDown, Info, X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, MessageCircle, Eye, Search, ArrowUp, Upload } from 'lucide-react';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { Project, GDriveAsset, Collaborator, ActionableItem } from '../types/project';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';
import { ProjectDetailSidebar } from './ProjectDetailSidebar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ContactAdminDialog } from './ContactAdminDialog';
import { AddGDriveBulkDialog } from './AddGDriveBulkDialog';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';
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
  type GDriveTreeNode
} from '../utils/gdriveUtils';

// Default folder preview image - Google Drive folder icon
const DEFAULT_FOLDER_PREVIEW = 'https://snymazdqexjovkdvepso.supabase.co/storage/v1/object/public/gdrive_previews/google_drive_folder_icon_for_windows_11_by_mr_celo_deoprbs.ico';

interface GDrivePageProps {
  project: Project;
  collaborators: Collaborator[];
  onBack: () => void;
  onEdit: (project: Project) => void;
  onUpdateProject?: (id: string, projectData: Partial<Project>) => void; // Direct save without opening dialog
  onNavigateToGDrive: (projectId: string) => void;
  onNavigateToLightroom?: (projectId: string) => void;
  onViewImages?: (projectId: string, assetId: string) => void;
  isPublicView?: boolean; // For stakeholder access
}

export function GDrivePage({ project, collaborators, onBack, onEdit, onUpdateProject, onNavigateToGDrive, onNavigateToLightroom, onViewImages, isPublicView = false }: GDrivePageProps) {
  // 🔐 Get auth context for permission checks
  const { isAdmin } = useAuth();
  
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showContactDialog, setShowContactDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const [detailSidebarOpen, setDetailSidebarOpen] = useState(false);
  const [groupByAsset, setGroupByAsset] = useState(false);
  const [filterAssetId, setFilterAssetId] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all'); // New: filter by type
  const [openAssets, setOpenAssets] = useState<Set<string>>(new Set());
  const [selectedAssetIndex, setSelectedAssetIndex] = useState<number | null>(null);
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0); // NEW: For carousel within folder
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  // 🆕 PHASE 4: Folder navigation state
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null); // null = root level
  
  // 🆕 PHASE 5: Search and keyboard navigation
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [focusedIndex, setFocusedIndex] = useState<number>(-1);
  const gridRef = useRef<HTMLDivElement>(null);
  
  // 🆕 Folder quick actions state
  const [copiedFolderIds, setCopiedFolderIds] = useState<Set<string>>(new Set());
  
  // 🆕 Bulk upload dialog state
  const [bulkUploadDialogOpen, setBulkUploadDialogOpen] = useState(false);

  const gdriveAssets = project.gdrive_assets || [];
  const assets = project.actionable_items || [];
  const hasAssets = assets.length > 0;
  
  // Initialize all assets as open
  useEffect(() => {
    if (groupByAsset) {
      const assetIds = new Set<string>();
      // Add asset IDs from gdrive assets
      gdriveAssets.forEach(gdAsset => {
        if (gdAsset.asset_id) assetIds.add(gdAsset.asset_id);
      });
      // Always add "no-asset" group
      assetIds.add('no-asset');
      setOpenAssets(assetIds);
    }
  }, [groupByAsset, gdriveAssets]);

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

  // 🆕 PHASE 5: Memoized filtered gdrive assets with search
  const filteredGDriveAssets = useMemo(() => {
    let filtered = gdriveAssets;
    
    // 🎯 RECURSIVE SEARCH: Search across all nested folders and files
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      
      // Helper function to recursively search descendants
      const matchesSearchRecursive = (asset: GDriveAsset): boolean => {
        // Check if current asset name matches
        if (asset.asset_name.toLowerCase().includes(query)) {
          return true;
        }
        
        // If folder, check all descendants recursively
        if (asset.asset_type === 'folder') {
          const descendants = getAllDescendants(gdriveAssets, asset.id);
          return descendants.some(desc => 
            desc.asset_name.toLowerCase().includes(query)
          );
        }
        
        return false;
      };
      
      // Filter to show assets that match OR contain matching descendants
      filtered = filtered.filter(matchesSearchRecursive);
      
      // When searching, ignore folder navigation - show all matches
      // Don't apply currentFolderId filter
    } else {
      // Filter by current folder (only when NOT searching)
      if (currentFolderId === null) {
        // Show only root-level assets (no parent)
        filtered = filtered.filter(gdAsset => !gdAsset.parent_id);
      } else {
        // Show only children of current folder
        filtered = filtered.filter(gdAsset => gdAsset.parent_id === currentFolderId);
      }
    }
    
    // Filter by asset
    if (filterAssetId === 'no-asset') {
      filtered = filtered.filter(gdAsset => !gdAsset.asset_id);
    } else if (filterAssetId !== 'all') {
      filtered = filtered.filter(gdAsset => gdAsset.asset_id === filterAssetId);
    }
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(gdAsset => gdAsset.asset_type === filterType);
    }
    
    return filtered;
  }, [gdriveAssets, currentFolderId, filterAssetId, filterType, searchQuery]);

  // 🆕 Separate folders and files for search results display
  const { searchFolders, searchFiles, combinedSearchAssets } = useMemo(() => {
    if (!searchQuery.trim()) {
      return { searchFolders: [], searchFiles: [], combinedSearchAssets: [] };
    }
    
    const folders = filteredGDriveAssets.filter(asset => asset.asset_type === 'folder');
    const files = filteredGDriveAssets.filter(asset => asset.asset_type === 'file');
    
    // Combined for keyboard navigation: folders first, then files
    const combined = [...folders, ...files];
    
    return { searchFolders: folders, searchFiles: files, combinedSearchAssets: combined };
  }, [filteredGDriveAssets, searchQuery]);

  // 🆕 PHASE 5: Memoized grouped gdrive assets
  const groupedGDriveAssets = useMemo(() => {
    if (!groupByAsset) return null;
    
    const groups: Record<string, GDriveAsset[]> = {};
    
    filteredGDriveAssets.forEach(gdAsset => {
      const assetId = gdAsset.asset_id || 'no-asset';
      if (!groups[assetId]) {
        groups[assetId] = [];
      }
      groups[assetId].push(gdAsset);
    });
    
    return groups;
  }, [groupByAsset, filteredGDriveAssets]);

  // Get asset title by ID
  const getAssetTitle = (assetId?: string) => {
    if (!assetId || assetId === 'no-asset') return 'No Asset';
    const asset = assets.find(a => a.id === assetId);
    return asset?.title || 'Unknown Asset';
  };

  // 🆕 PHASE 4: Folder navigation helpers
  const getCurrentFolder = (): GDriveAsset | null => {
    if (!currentFolderId) return null;
    return gdriveAssets.find(a => a.id === currentFolderId) || null;
  };

  // 🆕 PHASE 5: Memoized breadcrumbs
  const getBreadcrumbs = useMemo((): Array<{ id: string | null; name: string }> => {
    if (!currentFolderId) {
      return [{ id: null, name: 'Google Drive' }];
    }
    
    // Get parent chain (all folders from root to parent of current folder)
    const chain = getParentChain(gdriveAssets, currentFolderId);
    
    // Get current folder
    const currentFolder = gdriveAssets.find(a => a.id === currentFolderId);
    
    // Build breadcrumbs: Google Drive > Parent Chain > Current Folder
    return [
      { id: null, name: 'Google Drive' },
      ...chain.map(folder => ({ id: folder.id, name: folder.asset_name })),
      // Add current folder to breadcrumbs
      ...(currentFolder ? [{ id: currentFolder.id, name: currentFolder.asset_name }] : [])
    ];
  }, [currentFolderId, gdriveAssets]);

  // 🆕 PHASE 5: Optimized navigation callbacks
  const navigateToFolder = useCallback((folderId: string | null) => {
    setCurrentFolderId(folderId);
    setSearchQuery(''); // Clear search when navigating
    setFocusedIndex(-1); // Reset keyboard focus
  }, []);

  const navigateToParent = useCallback(() => {
    const currentFolder = getCurrentFolder();
    if (currentFolder) {
      navigateToFolder(currentFolder.parent_id || null);
    }
  }, [currentFolderId, gdriveAssets, navigateToFolder]);

  // 🆕 Smart back handler: Navigate to parent folder or return to dashboard
  const handleSmartBack = useCallback(() => {
    if (currentFolderId !== null) {
      // Currently in a folder, navigate to parent
      navigateToParent();
    } else {
      // At root level, return to dashboard
      onBack();
    }
  }, [currentFolderId, navigateToParent, onBack]);

  const handleFolderClick = useCallback((folderId: string) => {
    // Navigate into the folder
    navigateToFolder(folderId);
    // Scroll to top when navigating
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigateToFolder]);

  // 🆕 Folder quick action handlers
  const handleCopyFolderLink = useCallback(async (e: React.MouseEvent, asset: GDriveAsset) => {
    e.stopPropagation(); // Prevent card click
    
    if (!asset.gdrive_link) {
      toast.error('No GDrive link available');
      return;
    }
    
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(asset.gdrive_link);
        setCopiedFolderIds(prev => new Set(prev).add(asset.id));
        toast.success('Link copied!');
        
        // Reset copied state after 2s
        setTimeout(() => {
          setCopiedFolderIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(asset.id);
            return newSet;
          });
        }, 2000);
        return;
      }
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
    }
    
    // Fallback method
    const success = copyToClipboardFallback(asset.gdrive_link);
    if (success) {
      setCopiedFolderIds(prev => new Set(prev).add(asset.id));
      toast.success('Link copied!');
      
      // Reset copied state after 2s
      setTimeout(() => {
        setCopiedFolderIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(asset.id);
          return newSet;
        });
      }, 2000);
    } else {
      toast.error('Failed to copy link');
    }
  }, []);

  const handleOpenFolderInGDrive = useCallback((e: React.MouseEvent, asset: GDriveAsset) => {
    e.stopPropagation(); // Prevent card click
    
    if (asset.gdrive_link) {
      window.open(asset.gdrive_link, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('No GDrive link available');
    }
  }, []);

  // 🆕 Bulk upload handler
  const handleBulkUploadSave = useCallback(async (newAssets: any[], onProgress?: (current: number, total: number) => void) => {
    try {
      console.log('[GDrivePage] Starting bulk upload save...', { assetCount: newAssets.length });
      
      // Count total files to upload
      const totalFilesToUpload = newAssets.filter(a => a._file && a._file instanceof File).length;
      let uploadedFilesCount = 0;
      
      // Initialize progress
      if (onProgress && totalFilesToUpload > 0) {
        onProgress(0, totalFilesToUpload);
      }
      
      // Map temp IDs to real IDs for nested hierarchy
      const tempIdToRealId = new Map<string, string>();
      
      // First pass: generate real IDs, upload files, and map temp IDs
      const assetsWithIds: GDriveAsset[] = [];
      
      for (const asset of newAssets) {
        console.log('[GDrivePage] Processing asset:', { 
          name: asset.asset_name, 
          type: asset.asset_type,
          hasFile: !!asset._file,
          fileType: asset._file?.type,
          fileSize: asset._file?.size
        });
        
        const realId = `gdrive_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        if (asset._tempId) {
          tempIdToRealId.set(asset._tempId, realId);
        }
        
        // Upload preview file if exists
        let uploadedPreviewUrl: string | null = null;
        if (asset._file && asset._file instanceof File) {
          try {
            console.log('[GDrivePage] Uploading file to Supabase Storage...', { 
              assetId: realId,
              fileName: asset._file.name 
            });
            
            // Upload file to Supabase Storage
            const formData = new FormData();
            formData.append('file', asset._file);
            formData.append('projectId', project.id);
            formData.append('assetId', realId);

            const response = await fetch(
              `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/gdrive/upload-preview`,
              {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${publicAnonKey}`
                },
                body: formData
              }
            );

            if (response.ok) {
              const data = await response.json();
              uploadedPreviewUrl = data.signedUrl;
              console.log('[GDrivePage] ✅ File uploaded successfully!', { 
                assetId: realId,
                signedUrl: uploadedPreviewUrl 
              });
              
              // Update progress
              uploadedFilesCount++;
              if (onProgress) {
                onProgress(uploadedFilesCount, totalFilesToUpload);
              }
            } else {
              const errorText = await response.text();
              console.error('[GDrivePage] ❌ Failed to upload preview:', {
                status: response.status,
                statusText: response.statusText,
                error: errorText
              });
              toast.error(`Failed to upload preview for ${asset.asset_name}`);
            }
          } catch (error) {
            console.error('[GDrivePage] ❌ Error uploading preview file:', error);
            toast.error(`Error uploading preview for ${asset.asset_name}`);
          }
          
          // Cleanup blob URL after upload (if it was a blob URL)
          if (asset.preview_url && asset.preview_url.startsWith('blob:')) {
            URL.revokeObjectURL(asset.preview_url);
          }
        }
        
        const processedAsset = {
          ...asset,
          id: realId,
          parent_id: asset._parentTempId ? null : (currentFolderId || undefined), // Will be filled in second pass
          preview_url: uploadedPreviewUrl || (asset.preview_url && !asset.preview_url.startsWith('blob:') ? asset.preview_url : null),
          _tempId: undefined,
          _parentTempId: undefined,
          _file: undefined // Remove file object from final data
        };
        
        console.log('[GDrivePage] Processed asset:', {
          id: processedAsset.id,
          name: processedAsset.asset_name,
          preview_url: processedAsset.preview_url
        });
        
        assetsWithIds.push(processedAsset);
      }
      
      // Second pass: resolve parent_id references
      assetsWithIds.forEach((asset, index) => {
        const originalAsset = newAssets[index];
        if (originalAsset._parentTempId) {
          // This asset has a parent from the upload - resolve the parent's real ID
          asset.parent_id = tempIdToRealId.get(originalAsset._parentTempId) || undefined;
        } else {
          // Root level item - use current folder as parent
          asset.parent_id = currentFolderId || undefined;
        }
      });
      
      // Add to project and save directly (without opening edit dialog)
      const updatedGDriveAssets = [...gdriveAssets, ...assetsWithIds];
      
      console.log('[GDrivePage] Saving to database...', {
        totalAssets: updatedGDriveAssets.length,
        newAssets: assetsWithIds.length
      });
      
      if (onUpdateProject) {
        // Direct save without opening dialog - pass (id, data) format
        await onUpdateProject(project.id, { gdrive_assets: updatedGDriveAssets });
        console.log('[GDrivePage] ✅ Successfully saved to database!');
        toast.success(`Added ${assetsWithIds.length} item${assetsWithIds.length === 1 ? '' : 's'}`);
      } else {
        // Fallback to onEdit if onUpdateProject not provided
        onEdit({ ...project, gdrive_assets: updatedGDriveAssets });
        console.log('[GDrivePage] ✅ Successfully updated via onEdit!');
      }
    } catch (error) {
      console.error('[GDrivePage] ❌ Error in bulk upload save:', error);
      toast.error('Failed to save assets. Please try again.');
    }
  }, [gdriveAssets, project, onEdit, onUpdateProject, currentFolderId]);

  const selectedGDriveAsset = selectedAssetIndex !== null ? filteredGDriveAssets[selectedAssetIndex] : null;

  const shareableUrl = `${window.location.origin}${window.location.pathname}?gdrive=${project.id}`;

  const handleShare = () => {
    setShowShareDialog(true);
  };

  const copyShareLink = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareableUrl);
        setCopied(true);
        toast.success('Link copied to clipboard!');
        setTimeout(() => setCopied(false), 2000);
        return;
      }
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
    }
    
    // Fallback method
    const success = copyToClipboardFallback(shareableUrl);
    if (success) {
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('Failed to copy link');
    }
  };

  const handleOpenDetailSidebar = () => {
    setDetailSidebarOpen(true);
  };

  const closeDetailSidebar = () => {
    setDetailSidebarOpen(false);
  };

  // Get appropriate preview URL for asset
  const getAssetPreviewUrl = (asset: GDriveAsset): string | null => {
    // If folder with multiple previews, return first one
    if (asset.preview_urls && asset.preview_urls.length > 0) {
      const firstPreview = asset.preview_urls[0];
      // Backward compatibility: check if it's old format (string) or new format (object)
      return typeof firstPreview === 'string' ? firstPreview : firstPreview.url;
    }
    // If user set custom preview, use it
    if (asset.preview_url) {
      return asset.preview_url;
    }
    // If folder and no custom preview, use default folder image
    if (asset.asset_type === 'folder') {
      return DEFAULT_FOLDER_PREVIEW;
    }
    // File with no preview
    return null;
  };

  // Get all preview objects for an asset (for lightbox carousel with names)
  const getAssetPreviews = (asset: GDriveAsset) => {
    if (asset.preview_urls && asset.preview_urls.length > 0) {
      // Backward compatibility: convert old format (string[]) to new format (GDrivePreview[])
      return asset.preview_urls.map((preview, index) => {
        if (typeof preview === 'string') {
          // Old format: string URL
          return { id: `preview-${index}`, url: preview, name: undefined };
        } else {
          // New format: GDrivePreview object
          return preview;
        }
      });
    }
    if (asset.preview_url) {
      return [{ id: 'single-preview', url: asset.preview_url, name: undefined }];
    }
    return [];
  };

  // Get all preview URLs only (backward compat)
  const getAssetPreviewUrls = (asset: GDriveAsset): string[] => {
    return getAssetPreviews(asset).map(p => p.url);
  };

  // Clipboard fallback for older browsers
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

  // 🆕 PHASE 5: Optimized copy handlers
  const handleCopyName = useCallback(async (name: string, isPreviewName: boolean = false) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(name);
        toast.success(isPreviewName ? 'Preview name copied!' : 'Asset name copied!');
        return;
      }
    } catch (error) {
      console.warn('Clipboard API failed, trying fallback:', error);
    }
    
    const success = copyToClipboardFallback(name);
    if (success) {
      toast.success(isPreviewName ? 'Preview name copied!' : 'Asset name copied!');
    } else {
      toast.error('Failed to copy name');
    }
  }, []);

  // Copy GDrive link
  const handleCopyLink = useCallback(async (url: string) => {
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
  }, []);

  // Lightbox functions
  const openLightbox = (index: number, previewIndex: number = 0) => {
    setSelectedAssetIndex(index);
    setSelectedPreviewIndex(previewIndex); // Set which preview to show first
    setZoomLevel(1); // Reset zoom when opening
  };

  const closeLightbox = () => {
    setSelectedAssetIndex(null);
    setSelectedPreviewIndex(0); // Reset preview index
  };
  
  // NEW: Navigate between previews within the same folder
  const navigateToNextPreview = () => {
    if (selectedAssetIndex === null) return;
    const currentAsset = filteredGDriveAssets[selectedAssetIndex];
    const previewUrls = getAssetPreviewUrls(currentAsset);
    if (selectedPreviewIndex < previewUrls.length - 1) {
      setSelectedPreviewIndex(selectedPreviewIndex + 1);
      setZoomLevel(1); // Reset zoom
    }
  };

  const navigateToPreviousPreview = () => {
    if (selectedPreviewIndex > 0) {
      setSelectedPreviewIndex(selectedPreviewIndex - 1);
      setZoomLevel(1); // Reset zoom
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  const navigateToNext = () => {
    if (selectedAssetIndex !== null && selectedAssetIndex < filteredGDriveAssets.length - 1) {
      setSelectedAssetIndex(selectedAssetIndex + 1);
      setSelectedPreviewIndex(0); // Reset to first preview of next asset
      setZoomLevel(1); // Reset zoom
    }
  };

  const navigateToPrevious = () => {
    if (selectedAssetIndex !== null && selectedAssetIndex > 0) {
      setSelectedAssetIndex(selectedAssetIndex - 1);
      setSelectedPreviewIndex(0); // Reset to first preview of previous asset
      setZoomLevel(1); // Reset zoom
    }
  };

  // Touch swipe handlers - Navigate previews first, then assets
  const minSwipeDistance = 50;
  
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

    if (selectedAssetIndex === null) return;

    const currentAsset = filteredGDriveAssets[selectedAssetIndex];
    const previewUrls = getAssetPreviewUrls(currentAsset);

    if (isLeftSwipe) {
      // Swipe left = next
      if (previewUrls.length > 1 && selectedPreviewIndex < previewUrls.length - 1) {
        // Navigate to next preview within same asset
        navigateToNextPreview();
      } else {
        // At last preview or single preview, go to next asset
        navigateToNext();
      }
    } else if (isRightSwipe) {
      // Swipe right = previous
      if (previewUrls.length > 1 && selectedPreviewIndex > 0) {
        // Navigate to previous preview within same asset
        navigateToPreviousPreview();
      } else {
        // At first preview or single preview, go to previous asset
        navigateToPrevious();
      }
    }
  };

  // Keyboard navigation and mouse wheel zoom for lightbox
  useEffect(() => {
    if (selectedAssetIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        // Navigate to previous preview or asset
        const currentAsset = filteredGDriveAssets[selectedAssetIndex];
        const previewUrls = getAssetPreviewUrls(currentAsset);
        if (previewUrls.length > 1 && selectedPreviewIndex > 0) {
          // Navigate to previous preview within same asset
          navigateToPreviousPreview();
        } else {
          // At first preview or single preview, go to previous asset
          navigateToPrevious();
        }
      } else if (e.key === 'ArrowRight') {
        // Navigate to next preview or asset
        const currentAsset = filteredGDriveAssets[selectedAssetIndex];
        const previewUrls = getAssetPreviewUrls(currentAsset);
        if (previewUrls.length > 1 && selectedPreviewIndex < previewUrls.length - 1) {
          // Navigate to next preview within same asset
          navigateToNextPreview();
        } else {
          // At last preview or single preview, go to next asset
          navigateToNext();
        }
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
  }, [selectedAssetIndex, selectedPreviewIndex, filteredGDriveAssets.length]);

  // 🆕 PHASE 5: Keyboard navigation for main grid (when lightbox is closed)
  useEffect(() => {
    if (selectedAssetIndex !== null) return; // Don't intercept when lightbox is open
    if (groupByAsset) return; // Disable keyboard nav when grouping is enabled (complex navigation)

    const handleMainGridKeyDown = (e: KeyboardEvent) => {
      // Use combinedSearchAssets for keyboard navigation when searching
      const navAssets = searchQuery.trim() ? combinedSearchAssets : filteredGDriveAssets;
      const totalItems = navAssets.length;
      if (totalItems === 0) return;

      // Get grid columns count based on screen width
      const getColumnsCount = (): number => {
        const width = window.innerWidth;
        if (width >= 1280) return 4; // xl
        if (width >= 1024) return 3; // lg
        if (width >= 640) return 2;  // sm
        return 1; // mobile
      };

      const cols = getColumnsCount();

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => {
            if (prev === -1) return 0; // Start at first item
            const next = prev + cols;
            return next < totalItems ? next : prev;
          });
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => {
            if (prev === -1) return 0;
            const next = prev - cols;
            return next >= 0 ? next : prev;
          });
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex(prev => {
            if (prev === -1) return 0;
            const next = prev + 1;
            return next < totalItems ? next : prev;
          });
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex(prev => {
            if (prev === -1) return 0;
            const next = prev - 1;
            return next >= 0 ? next : prev;
          });
          break;
        case 'Enter':
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < totalItems) {
            const asset = navAssets[focusedIndex];
            if (asset.asset_type === 'folder') {
              // 🆕 UPDATED: Smart folder navigation with preview priority
              const hasChildren = gdriveAssets.some(a => a.parent_id === asset.id);
              const hasActualPreviews = (asset.preview_urls && asset.preview_urls.length > 0) || 
                (asset.preview_url && asset.preview_url !== DEFAULT_FOLDER_PREVIEW);
              
              // Priority 1: View Images if has previews
              if (hasActualPreviews && onViewImages) {
                onViewImages(project.id, asset.id);
              } else if (hasChildren) {
                // Priority 2: Navigate into folder
                handleFolderClick(asset.id);
              } else {
                // Priority 3: Open GDrive
                window.open(asset.gdrive_link, '_blank');
              }
            } else {
              const previewUrls = getAssetPreviewUrls(asset);
              if (previewUrls.length > 0) {
                openLightbox(focusedIndex);
              } else {
                window.open(asset.gdrive_link, '_blank');
              }
            }
          }
          break;
        case 'Backspace':
        case 'Escape':
          e.preventDefault();
          if (currentFolderId !== null) {
            navigateToParent();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleMainGridKeyDown);
    return () => window.removeEventListener('keydown', handleMainGridKeyDown);
  }, [selectedAssetIndex, filteredGDriveAssets, combinedSearchAssets, searchQuery, focusedIndex, groupByAsset, currentFolderId, handleFolderClick, navigateToParent]);

  // 🆕 PHASE 5: Scroll focused item into view
  useEffect(() => {
    if (focusedIndex >= 0 && gridRef.current) {
      const cards = gridRef.current.querySelectorAll('[data-card-index]');
      const focusedCard = cards[focusedIndex] as HTMLElement;
      if (focusedCard) {
        focusedCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [focusedIndex]);

  // Render asset card
  const renderAssetCard = (asset: GDriveAsset, index: number) => {
    const previewUrl = getAssetPreviewUrl(asset);
    const isFocused = focusedIndex === index;
    
    // 🆕 Check if folder has children
    const hasChildren = asset.asset_type === 'folder' 
      ? gdriveAssets.some(a => a.parent_id === asset.id)
      : false;
    
    // 🆕 Check if asset has actual preview images (not just default folder icon)
    const hasActualPreviews = asset.asset_type === 'folder'
      ? (asset.preview_urls && asset.preview_urls.length > 0) || 
        (asset.preview_url && asset.preview_url !== DEFAULT_FOLDER_PREVIEW)
      : true; // Files always show button if onViewImages exists
    
    // 🎨 NEW: Render compact card for folders without preview
    if (asset.asset_type === 'folder' && !hasActualPreviews) {
      const isCopied = copiedFolderIds.has(asset.id);
      
      return (
        <Card
          key={asset.id}
          data-card-index={index}
          className={`group overflow-hidden transition-all duration-200 cursor-pointer relative ${
            isFocused 
              ? 'ring-2 ring-primary shadow-xl scale-[1.02]' 
              : 'hover:shadow-md'
          }`}
          onClick={() => {
            // Navigate into folder
            handleFolderClick(asset.id);
          }}
        >
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              {/* Folder Icon */}
              <div className="flex-shrink-0 w-16 h-16 rounded-md bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center border border-border/50">
                <FolderIcon className="h-8 w-8 text-primary" />
              </div>
              
              {/* Folder Name */}
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{asset.asset_name}</p>
                {hasChildren && (
                  <p className="text-xs text-muted-foreground">
                    {gdriveAssets.filter(a => a.parent_id === asset.id).length} items
                  </p>
                )}
              </div>
              
              {/* Action Icon */}
              <div className="flex-shrink-0">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            
            {/* Quick Action Buttons - Bottom Right Corner */}
            <div className="absolute bottom-2 right-2 flex items-center gap-1">
              {/* Copy Link Button */}
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 bg-background/80 hover:bg-background backdrop-blur-sm border border-border/50 shadow-sm"
                onClick={(e) => handleCopyFolderLink(e, asset)}
                title="Copy GDrive link"
              >
                {isCopied ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
              
              {/* Open in GDrive Button */}
              <Button
                size="sm"
                variant="ghost"
                className="h-6 px-2 gap-1.5 bg-background/80 hover:bg-background backdrop-blur-sm border border-border/50 shadow-sm"
                onClick={(e) => handleOpenFolderInGDrive(e, asset)}
                title="Open in Google Drive"
              >
                <GoogleDriveIcon className="h-3 w-3" />
                <span className="text-xs">Open</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    
    // 🎨 Normal card for files and folders with preview
    const isCopied = copiedFolderIds.has(asset.id);
    
    return (
      <Card
        key={asset.id}
        data-card-index={index}
        className={`group overflow-hidden transition-all duration-200 ${
          isFocused 
            ? 'ring-2 ring-primary shadow-xl scale-[1.02]' 
            : 'hover:shadow-lg'
        }`}
      >
        <CardContent className="p-0">
          {/* Thumbnail from Preview or Icon */}
          <div 
            className="aspect-square bg-muted flex items-center justify-center overflow-hidden cursor-pointer relative active:scale-95 transition-transform touch-manipulation"
            onClick={() => {
              // 🆕 UPDATED: Smart folder click behavior with preview priority
              if (asset.asset_type === 'folder') {
                // Priority 1: If has preview images, go to View Images page
                if (hasActualPreviews && onViewImages) {
                  onViewImages(project.id, asset.id);
                } else if (hasChildren) {
                  // Priority 2: Navigate into folder if it has children
                  handleFolderClick(asset.id);
                } else {
                  // Priority 3: Open GDrive link if folder is empty
                  window.open(asset.gdrive_link, '_blank', 'noopener,noreferrer');
                }
                return;
              }
              
              // Files with preview: Open lightbox
              const previewUrls = getAssetPreviewUrls(asset);
              if (previewUrls.length > 0) {
                openLightbox(index);
              }
            }}
          >
            {previewUrl ? (
              <img
                src={previewUrl}
                alt={asset.asset_name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={(e) => {
                  // 🆕 UPDATED: Smart click behavior with preview priority for folders
                  e.stopPropagation();
                  
                  if (asset.asset_type === 'folder') {
                    // For folders: Priority to View Images if has previews
                    if (hasActualPreviews && onViewImages) {
                      onViewImages(project.id, asset.id);
                    } else if (hasChildren) {
                      handleFolderClick(asset.id);
                    } else {
                      window.open(asset.gdrive_link, '_blank', 'noopener,noreferrer');
                    }
                  } else {
                    // For files: Open lightbox on thumbnail click
                    const previewUrls = getAssetPreviewUrls(asset);
                    if (previewUrls.length > 0) {
                      openLightbox(index);
                    }
                  }
                }}
                onError={(e) => {
                  // If image fails to load, hide it
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <FileIcon className="h-16 w-16 text-muted-foreground opacity-40" />
            )}
          
            {/* Preview Count Badge for folders with multiple previews */}
            {asset.preview_urls && asset.preview_urls.length > 1 && (
              <div className="absolute top-2 left-2">
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-black/70 text-white border-0 backdrop-blur-sm"
                >
                  {asset.preview_urls.length} images
                </Badge>
              </div>
            )}
            
            {/* Type Badge Overlay - Clickable to GDrive */}
            <div className="absolute top-2 right-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (asset.gdrive_link) {
                    window.open(asset.gdrive_link, '_blank');
                  }
                }}
                className="inline-flex"
              >
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-black/60 text-white border-0 backdrop-blur-sm cursor-pointer hover:bg-black/80 transition-colors"
                >
                  {asset.asset_type === 'folder' ? (
                    <FolderIcon className="h-3 w-3 mr-1" />
                  ) : (
                    <FileIcon className="h-3 w-3 mr-1" />
                  )}
                  {asset.asset_type}
                </Badge>
              </button>
            </div>
            
            {/* Quick Action Buttons - Bottom Right Corner (Folders Only) */}
            {asset.asset_type === 'folder' && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1">
                {/* Copy Link Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 bg-black/60 hover:bg-black/80 backdrop-blur-sm border-0 shadow-sm"
                  onClick={(e) => handleCopyFolderLink(e, asset)}
                  title="Copy GDrive link"
                >
                  {isCopied ? (
                    <Check className="h-3 w-3 text-white" />
                  ) : (
                    <Copy className="h-3 w-3 text-white" />
                  )}
                </Button>
                
                {/* Open in GDrive Button */}
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 bg-black/60 hover:bg-black/80 backdrop-blur-sm border-0 shadow-sm"
                  onClick={(e) => handleOpenFolderInGDrive(e, asset)}
                  title="Open in Google Drive"
                >
                  <GoogleDriveIcon className="h-3 w-3 text-white" />
                </Button>
              </div>
            )}
          </div>
        
          {/* Asset Info & Actions */}
          <div className="p-4 space-y-3">
            {/* Folder Name with Icon, Copy Button, and Badge */}
            <div className="flex items-center gap-2 min-w-0">
              {/* Folder/File Icon */}
              {asset.asset_type === 'folder' ? (
                <FolderIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              ) : (
                <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              
              {/* Asset Name + Copy Button (no gap - mepet) */}
              <div className="flex items-center flex-1 min-w-0">
                {/* Asset Name */}
                <h3 className="font-medium truncate flex-1 text-left p-[0px] my-[0px] m-[0px]">{asset.asset_name}</h3>
                
                {/* Copy Name Icon Button - Shows on hover - RIGHT AFTER asset name (mepet) */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyName(asset.asset_name);
                  }}
                  className="flex-shrink-0 -ml-1 rounded-md hover:bg-secondary/50 transition-colors opacity-0 group-hover:opacity-100 p-[6px]"
                  title={`Copy ${asset.asset_type} name`}
                >
                  <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
              
              {/* Asset Badge - Inline right aligned - AFTER copy button */}
              {!groupByAsset && asset.asset_id && (
                <Badge variant="secondary" className="text-xs flex-shrink-0">
                  {getAssetTitle(asset.asset_id)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
        
        {/* Action Buttons - Full width at bottom */}
        <div className="px-4 pb-4 space-y-2">
          {/* 🆕 UPDATED: Different buttons for folders vs files */}
          {asset.asset_type === 'folder' ? (
            /* Folder Actions */
            <div className="flex gap-2">
              {/* Open Folder (navigate inside) OR Open in GDrive if empty */}
              <Button
                variant="default"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink(asset.gdrive_link);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              
              {/* Only show secondary GDrive button if folder has children */}
              {hasChildren && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(asset.gdrive_link, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <GoogleDriveIcon className="h-4 w-4 mr-2" />
                  GDrive
                </Button>
              )}
            </div>
          ) : (
            /* File Actions */
            <div className="flex gap-2 mx-[0px] my-[-26px]">
              {/* Copy Link Button */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink(asset.gdrive_link);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
              
              {/* Open in GDrive */}
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(asset.gdrive_link, '_blank', 'noopener,noreferrer');
                }}
              >
                <GoogleDriveIcon className="h-4 w-4 mr-2" />
                {(() => {
                  // Check if file inherits link from parent folder
                  if (asset.asset_type === 'file' && asset.parent_id) {
                    const parentFolder = gdriveAssets.find(a => a.id === asset.parent_id);
                    if (parentFolder && asset.gdrive_link === parentFolder.gdrive_link) {
                      return 'Open Folder';
                    }
                  }
                  return 'Open File';
                })()}
              </Button>
            </div>
          )}
          
          {/* View Images Button - Only show for folders with actual preview images */}
          {onViewImages && hasActualPreviews && asset.asset_type === 'folder' && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                onViewImages(project.id, asset.id);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              View Images
            </Button>
          )}
        </div>
      </Card>
    );
  };

  // 🆕 Render compact folder card for search results
  const renderCompactFolderCard = (folder: GDriveAsset, index: number) => {
    const hasChildren = gdriveAssets.some(a => a.parent_id === folder.id);
    const hasActualPreviews = (folder.preview_urls && folder.preview_urls.length > 0) || 
      (folder.preview_url && folder.preview_url !== DEFAULT_FOLDER_PREVIEW);
    const isFocused = focusedIndex === index;
    
    return (
      <Card
        key={folder.id}
        data-card-index={index}
        className={`group overflow-hidden transition-all duration-200 cursor-pointer ${
          isFocused 
            ? 'ring-2 ring-primary shadow-xl scale-[1.02]' 
            : 'hover:shadow-md'
        }`}
        onClick={() => {
          // Smart folder click behavior
          if (hasActualPreviews && onViewImages) {
            onViewImages(project.id, folder.id);
          } else if (hasChildren) {
            handleFolderClick(folder.id);
          } else {
            window.open(folder.gdrive_link, '_blank', 'noopener,noreferrer');
          }
        }}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-3">
            {/* Folder Icon */}
            <div className="flex-shrink-0 w-16 h-16 rounded-md bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center border border-border/50">
              <FolderIcon className="h-8 w-8 text-primary" />
            </div>
            
            {/* Folder Name */}
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{folder.asset_name}</p>
              {hasChildren && (
                <p className="text-xs text-muted-foreground">
                  {gdriveAssets.filter(a => a.parent_id === folder.id).length} items
                </p>
              )}
            </div>
            
            {/* Action Icon */}
            <div className="flex-shrink-0">
              {hasActualPreviews && onViewImages ? (
                <Eye className="h-4 w-4 text-muted-foreground" />
              ) : hasChildren ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
                    onClick={handleSmartBack}
                    className="sm:hidden"
                    aria-label="Back"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  {/* Back Button - With text on desktop */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSmartBack}
                    className="hidden sm:flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                  </Button>
                  <div className="h-5 w-px bg-border" />
                </>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-semibold">{project.project_name}</h1>
                  {isPublicView && (
                    <span className="text-xs text-muted-foreground/70">
                      (View Only)
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">Google Drive Assets</p>
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
                onClick={handleOpenDetailSidebar}
                className="sm:hidden"
              >
                <Info className="h-4 w-4" />
              </Button>
              
              {/* Project Details Button - Desktop */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenDetailSidebar}
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
                  onClick={handleShare}
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
      {(hasAssets || gdriveAssets.length > 0) && (
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-3">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              {/* Left side filters */}
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-1">
                {/* 🆕 PHASE 5: Search within folder */}
                <div className="relative flex-1 sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    type="text"
                    placeholder="Search folders, files, and nested items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-8"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
                      aria-label="Clear search"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  )}
                </div>
                {/* Filter by Asset - Only show when has actionable items */}
                {hasAssets && (
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
                        <SelectItem value="no-asset">No Asset</SelectItem>
                        {assets.map((asset) => (
                          <SelectItem key={asset.id} value={asset.id}>
                            {asset.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Filter by Type */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="filter-type" className="text-sm whitespace-nowrap">
                    Filter by Type:
                  </Label>
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger id="filter-type" className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="file">
                        <div className="flex items-center gap-2">
                          <FileIcon className="h-3 w-3" />
                          File
                        </div>
                      </SelectItem>
                      <SelectItem value="folder">
                        <div className="flex items-center gap-2">
                          <FolderIcon className="h-3 w-3" />
                          Folder
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Group by Asset Toggle - Only show when has actionable items */}
              {hasAssets && (
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
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        
        {/* 🆕 Search Results Indicator */}
        {searchQuery.trim() && (
          <div className="mb-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                <p className="text-sm">
                  Searching across <strong>all folders and files</strong> for: <strong className="text-primary">"{searchQuery}"</strong>
                </p>
              </div>
              <Badge variant="secondary" className="text-xs">
                {filteredGDriveAssets.length} {filteredGDriveAssets.length === 1 ? 'result' : 'results'}
              </Badge>
            </div>
          </div>
        )}
        
        {/* 🆕 PHASE 4: Current Folder Info */}
        {!searchQuery.trim() && (
          <div className="mb-4 p-4 rounded-lg bg-muted/30 border border-dashed">
            <div className="space-y-3">
              {/* Folder Info & Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {currentFolderId !== null && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7"
                      onClick={navigateToParent}
                      title="Go to parent folder"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                  )}
                  <FolderIcon className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-medium">
                      {getCurrentFolder()?.asset_name || 'Google Drive'}
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {filteredGDriveAssets.length} item{filteredGDriveAssets.length !== 1 ? 's' : ''} in this folder
                      {searchQuery && ' (filtered)'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {/* Add New Button - Drag & Drop Upload (Admin Only) */}
                  {!isPublicView && isAdmin && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => setBulkUploadDialogOpen(true)}
                    >
                      <Upload className="h-4 w-4" />
                      Add New
                    </Button>
                  )}
                  
                  {getCurrentFolder()?.gdrive_link && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(getCurrentFolder()!.gdrive_link, '_blank', 'noopener,noreferrer')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open in GDrive
                    </Button>
                  )}
                </div>
              </div>
              
              {/* 🆕 Breadcrumbs Navigation */}
              <Breadcrumb>
                <BreadcrumbList>
                  {getBreadcrumbs.map((crumb, index) => {
                    const isLast = index === getBreadcrumbs.length - 1;
                    return (
                      <div key={crumb.id || 'root'} className="contents">
                        <BreadcrumbItem>
                          {isLast ? (
                            <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                          ) : (
                            <BreadcrumbLink
                              onClick={() => navigateToFolder(crumb.id)}
                              className="cursor-pointer hover:bg-accent/50 px-2 py-1 rounded-md transition-colors"
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
            </div>
          </div>
        )}

        {filteredGDriveAssets.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {gdriveAssets.length === 0 
                  ? 'No Google Drive assets available for this project'
                  : searchQuery.trim()
                  ? `No results found for "${searchQuery}"`
                  : 'No assets found for the selected filter'
                }
              </p>
              {searchQuery.trim() && gdriveAssets.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Try different search terms or clear filters
                </p>
              )}
              {!isPublicView && gdriveAssets.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Add assets in the project edit page
                </p>
              )}
            </CardContent>
          </Card>
        ) : groupByAsset && groupedGDriveAssets ? (
          // Grouped by Asset View
          <div className="space-y-4">
            {Object.keys(groupedGDriveAssets).map((assetId) => {
              const assetGDriveAssets = groupedGDriveAssets[assetId];
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
                              {assetGDriveAssets.length} {assetGDriveAssets.length === 1 ? 'file' : 'files'}
                            </Badge>
                          </div>
                        </div>
                      </CollapsibleTrigger>
                    </div>

                    {/* Asset Google Drive Files */}
                    <CollapsibleContent>
                      <div className="p-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {assetGDriveAssets.map((gdAsset, idx) => {
                            // Get global index from filteredGDriveAssets
                            const globalIndex = filteredGDriveAssets.findIndex(a => a.id === gdAsset.id);
                            return renderAssetCard(gdAsset, globalIndex);
                          })}
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </Card>
              );
            })}
          </div>
        ) : searchQuery.trim() && (searchFolders.length > 0 || searchFiles.length > 0) ? (
          // 🆕 Search Results View: Folders first (compact), then Files (with previews)
          <div 
            ref={gridRef}
            className={`space-y-6 transition-opacity duration-300 ${
              isNavigating ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {/* Folders Section - Compact Cards */}
            {searchFolders.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FolderIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm text-muted-foreground">
                    Folders ({searchFolders.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {searchFolders.map((folder, index) => renderCompactFolderCard(folder, index))}
                </div>
              </div>
            )}
            
            {/* Files Section - Preview Thumbnails */}
            {searchFiles.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FileIcon className="h-4 w-4 text-muted-foreground" />
                  <h3 className="text-sm text-muted-foreground">
                    Files ({searchFiles.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {searchFiles.map((file, index) => {
                    // Calculate global index for keyboard navigation
                    const globalIndex = searchFolders.length + index;
                    return renderAssetCard(file, globalIndex);
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Grid View (Default - no search)
          <div 
            ref={gridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            {filteredGDriveAssets.map((gdAsset, index) => renderAssetCard(gdAsset, index))}
          </div>
        )}
      </div>

      {/* Share Dialog */}
      <Dialog open={showShareDialog} onOpenChange={setShowShareDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Google Drive Assets</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="share-link">Shareable Link</Label>
              <div className="flex gap-2">
                <Input
                  id="share-link"
                  value={shareableUrl}
                  readOnly
                  onClick={(e) => e.currentTarget.select()}
                />
                <Button onClick={copyShareLink} variant="outline" size="icon">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Anyone with this link can view the Google Drive assets for this project.
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
        onClose={closeDetailSidebar}
        onEdit={onEdit}
        onNavigateToLightroom={onNavigateToLightroom}
        onNavigateToGDrive={onNavigateToGDrive}
        isReadOnly={isPublicView}
      />

      {/* Lightbox Modal */}
      {selectedAssetIndex !== null && selectedGDriveAsset && (
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

          {/* Navigation Buttons - Only for image preview navigation */}
          {(() => {
            const currentPreviewUrls = getAssetPreviewUrls(selectedGDriveAsset);
            const hasMultiplePreviews = currentPreviewUrls.length > 1;
            
            return hasMultiplePreviews && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToPreviousPreview();
                  }}
                  disabled={selectedPreviewIndex === 0}
                  className="hidden sm:block absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-neutral-800/90 hover:bg-neutral-700/90 backdrop-blur-md text-white transition-colors shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-7 w-7" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToNextPreview();
                  }}
                  disabled={selectedPreviewIndex >= currentPreviewUrls.length - 1}
                  className="hidden sm:block absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-neutral-800/90 hover:bg-neutral-700/90 backdrop-blur-md text-white transition-colors shadow-lg disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Next image"
                >
                  <ChevronRight className="h-7 w-7" />
                </button>
              </>
            );
          })()}

          {/* Bottom Controls Stack - Desktop only */}
          <div className="hidden sm:flex absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-50 flex-col items-center gap-3">
            {/* Info Panel */}
            <div className="bg-neutral-800/90 backdrop-blur-md rounded-xl p-4 sm:p-5 max-w-xl shadow-2xl group">
              {/* Preview Name - Only show if current preview has a name */}
              {(() => {
                const previews = getAssetPreviews(selectedGDriveAsset);
                const currentPreview = previews[selectedPreviewIndex];
                return currentPreview?.name && (
                  <div className="mb-3 flex items-center justify-center gap-2">
                    <div className="flex-1 max-w-sm">
                      <div className="bg-neutral-700/60 rounded-lg px-3 py-2 text-center">
                        <p className="text-white/90 text-sm truncate">{currentPreview.name}</p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyName(currentPreview.name!, true);
                      }}
                      className="p-2 rounded-lg bg-neutral-700/80 hover:bg-neutral-600/80 text-white transition-colors touch-manipulation"
                      title="Copy preview name"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                );
              })()}
              
              <div className="flex items-center justify-center gap-2 mb-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyLink(selectedGDriveAsset.gdrive_link);
                  }}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-neutral-700/80 hover:bg-neutral-600/80 text-white transition-colors flex items-center gap-2 touch-manipulation text-sm"
                >
                  <Copy className="h-4 w-4" />
                  Copy Link
                </button>
                <a
                  href={selectedGDriveAsset.gdrive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="px-3 sm:px-4 py-2 rounded-lg bg-neutral-700/80 hover:bg-neutral-600/80 text-white transition-colors flex items-center gap-2 touch-manipulation text-sm"
                >
                  <GoogleDriveIcon className="h-4 w-4" />
                  GDrive
                </a>
              </div>
              <p className="text-xs text-white/60 text-center">
                Created: {new Date(selectedGDriveAsset.created_at).toLocaleDateString('en-US', { 
                  month: '2-digit', 
                  day: '2-digit', 
                  year: 'numeric' 
                })}
              </p>
            </div>

            {/* Zoom Controls with Asset Navigation */}
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-3 bg-neutral-800/90 backdrop-blur-md rounded-full px-4 py-3 shadow-lg">
                {/* Previous Asset Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToPrevious();
                  }}
                  className="p-2 rounded-full hover:bg-neutral-700/80 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                  disabled={selectedAssetIndex === 0}
                  aria-label="Previous asset"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                
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
                
                {/* Next Asset Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigateToNext();
                  }}
                  className="p-2 rounded-full hover:bg-neutral-700/80 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                  disabled={selectedAssetIndex === filteredGDriveAssets.length - 1}
                  aria-label="Next asset"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              {/* Desktop hint */}
              <div className="text-white/40 text-xs">
                Scroll to zoom • Arrow keys to navigate
              </div>
            </div>
          </div>

          {/* Mobile Zoom Controls with Asset Navigation */}
          <div className="sm:hidden absolute bottom-32 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2">
            <div className="flex items-center gap-3 bg-neutral-800/90 backdrop-blur-md rounded-full px-4 py-3 shadow-lg">
              {/* Previous Asset Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToPrevious();
                }}
                className="p-2 rounded-full hover:bg-neutral-700/80 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                disabled={selectedAssetIndex === 0}
                aria-label="Previous asset"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              
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
              
              {/* Next Asset Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigateToNext();
                }}
                className="p-2 rounded-full hover:bg-neutral-700/80 text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed touch-manipulation"
                disabled={selectedAssetIndex === filteredGDriveAssets.length - 1}
                aria-label="Next asset"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Image Counter - Only show for multiple previews */}
          {(() => {
            const previewUrls = getAssetPreviewUrls(selectedGDriveAsset);
            return previewUrls.length > 1 && (
              <div className="absolute top-2 sm:top-4 left-4 z-50">
                <div className="bg-neutral-800/90 backdrop-blur-md rounded-full px-3 sm:px-4 py-1.5 sm:py-2">
                  <span className="text-white text-xs sm:text-sm">
                    Image {selectedPreviewIndex + 1} / {previewUrls.length}
                  </span>
                </div>
              </div>
            );
          })()}
          
          {/* Swipe hint - only show on mobile if multiple images */}
          {(() => {
            const currentAsset = selectedGDriveAsset;
            const previewUrls = getAssetPreviewUrls(currentAsset);
            
            return previewUrls.length > 1 && (
              <div className="sm:hidden absolute top-2 right-4 z-50 text-white/50 text-xs flex items-center gap-1 bg-neutral-800/90 backdrop-blur-md rounded-full px-3 py-1.5">
                <ChevronLeft className="h-3 w-3" />
                <span>Swipe</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            );
          })()}

          {/* Main Image Container */}
          <div className="relative w-full h-full flex items-center justify-center p-4 sm:p-16 overflow-auto">
            <div 
              className="relative"
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.2s ease-out' }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const previewUrls = getAssetPreviewUrls(selectedGDriveAsset);
                const currentPreviewUrl = previewUrls[selectedPreviewIndex] || getAssetPreviewUrl(selectedGDriveAsset);
                
                return currentPreviewUrl ? (
                  <img
                    src={currentPreviewUrl}
                    alt={`${selectedGDriveAsset.asset_name} - Preview ${selectedPreviewIndex + 1}`}
                    className="max-w-full max-h-[calc(100vh-10rem)] sm:max-h-[calc(100vh-8rem)] object-contain select-none"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                    draggable={false}
                  />
                ) : (
                  <div className="flex items-center justify-center w-64 h-64 sm:w-96 sm:h-96">
                    <FileIcon className="h-16 w-16 sm:h-24 sm:w-24 text-white/50" />
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Mobile Action Bar - Fixed at bottom */}
          <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-neutral-900/95 backdrop-blur-md border-t border-white/10 p-4 safe-area-inset">
            {selectedGDriveAsset.asset_id && (
              <div className="flex justify-center mb-2">
                <Badge variant="secondary" className="text-xs">
                  Asset: {getAssetTitle(selectedGDriveAsset.asset_id)}
                </Badge>
              </div>
            )}
            
            {/* Preview Name - Only show if current preview has a name */}
            {(() => {
              const previews = getAssetPreviews(selectedGDriveAsset);
              const currentPreview = previews[selectedPreviewIndex];
              return currentPreview?.name && (
                <div className="mb-3 flex items-center gap-2">
                  <div className="flex-1">
                    <div className="bg-neutral-800/80 rounded-lg px-3 py-2 text-center">
                      <p className="text-white/90 text-sm truncate">{currentPreview.name}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyName(currentPreview.name!, true);
                    }}
                    className="p-2.5 rounded-lg bg-neutral-700/80 active:bg-neutral-600/80 text-white transition-colors touch-manipulation"
                    title="Copy preview name"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              );
            })()}
            
            <div className="flex items-center justify-center gap-2 mb-3">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyName(selectedGDriveAsset.asset_name);
                }}
                className="flex-1 px-3 py-2.5 rounded-lg bg-neutral-700/80 active:bg-neutral-600/80 text-white transition-colors flex items-center justify-center gap-2 touch-manipulation text-sm"
              >
                <Copy className="h-4 w-4" />
                Copy Name
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLink(selectedGDriveAsset.gdrive_link);
                }}
                className="flex-1 px-3 py-2.5 rounded-lg bg-neutral-700/80 active:bg-neutral-600/80 text-white transition-colors flex items-center justify-center gap-2 touch-manipulation text-sm"
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </button>
            </div>
            <p className="text-xs text-white/50 text-center">
              {selectedGDriveAsset.asset_name}
            </p>
          </div>
        </div>
      )}

      {/* Bulk Upload Dialog */}
      <AddGDriveBulkDialog
        open={bulkUploadDialogOpen}
        onOpenChange={setBulkUploadDialogOpen}
        actionableItems={assets}
        currentFolderId={currentFolderId}
        currentFolderName={getCurrentFolder()?.asset_name || 'Google Drive'}
        onSave={handleBulkUploadSave}
      />
    </div>
  );
}
