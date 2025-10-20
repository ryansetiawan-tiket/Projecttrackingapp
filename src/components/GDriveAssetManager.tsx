import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { 
  Plus, Trash2, ExternalLink, Pencil, Check, X, 
  FolderIcon, FileIcon, Grid3x3, List, Loader2, 
  ChevronRight, ChevronDown, FolderOpen,
  ChevronsDown, ChevronsUp, Search, FolderPlus 
} from 'lucide-react';
import { GDriveAsset, GDrivePreview, ActionableItem } from '../types/project';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { 
  buildTree, 
  getRootAssets, 
  getAllDescendants,
  getFolderItemCount,
  getAvailableParentFolders,
  validateNestingDepth,
  normalizeGDriveAssets,
  MAX_NESTING_DEPTH,
  type GDriveTreeNode
} from '../utils/gdriveUtils';

interface GDriveAssetManagerProps {
  assets: GDriveAsset[];
  onChange: (assets: GDriveAsset[]) => void;
  projectId: string;
  actionableItems?: ActionableItem[];
  onClose?: () => void; // Optional callback to hide/close the section
}

// Preview item with blob URL for local preview before upload
interface PreviewItem {
  id: string;
  name: string; // Editable name (max 100 chars)
  file?: File; // Temporary file before upload
  blobUrl?: string; // Temporary blob URL for preview
  url?: string; // Final URL after upload
}

type ViewMode = 'grid' | 'list';

export function GDriveAssetManager({ 
  assets, 
  onChange, 
  projectId: currentProjectId, 
  actionableItems = [],
  onClose
}: GDriveAssetManagerProps) {
  const [newAsset, setNewAsset] = useState({
    asset_name: '',
    gdrive_link: '',
    asset_type: 'file' as 'file' | 'folder',
    asset_id: undefined as string | undefined,
    parent_id: null as string | null, // 🆕 NESTED FOLDERS: Parent folder ID
    previews: [] as PreviewItem[]
  });
  
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<{
    asset_name: string;
    gdrive_link: string;
    asset_type: 'file' | 'folder';
    asset_id?: string;
    parent_id?: string | null; // 🆕 NESTED FOLDERS
    previews: PreviewItem[];
  } | null>(null);
  
  const [savingAsset, setSavingAsset] = useState(false);
  const [editingPreviewId, setEditingPreviewId] = useState<string | null>(null);
  const [previewViewMode, setPreviewViewMode] = useState<ViewMode>('grid');
  
  // 🆕 NESTED FOLDERS: Expand/collapse state for tree view
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  
  // 🆕 PHASE 3: Advanced features state
  const [searchQuery, setSearchQuery] = useState('');
  const [addingChildToFolder, setAddingChildToFolder] = useState<string | null>(null); // Folder ID where we're adding child

  // Upload single preview to Supabase Storage
  const uploadPreview = async (file: File, assetId: string, index: number): Promise<string | undefined> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', currentProjectId);
      formData.append('assetId', `${assetId}-${index}`);

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

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to upload preview');
      }

      const data = await response.json();
      return data.signedUrl;
    } catch (error) {
      console.error('Upload preview error:', error);
      return undefined;
    }
  };

  // Delete preview from Supabase Storage
  const deletePreview = async (previewUrl: string): Promise<boolean> => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/gdrive/delete-preview`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ previewUrl })
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Delete preview error:', error);
      return false;
    }
  };

  // Handle file selection for previews
  const handlePreviewFileSelect = (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean = false) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const currentAssetType = isEdit ? editingAsset?.asset_type : newAsset.asset_type;
    
    // For 'file' type, only allow one preview
    if (currentAssetType === 'file' && files.length > 1) {
      toast.error('File type only supports one preview image');
      return;
    }

    // Validate files
    const validFiles: File[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} exceeds 5MB limit`);
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      e.target.value = '';
      return;
    }

    // Create preview items with blob URLs
    const newPreviews: PreviewItem[] = validFiles.map((file, idx) => {
      const fileName = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
      const blobUrl = URL.createObjectURL(file);
      return {
        id: `temp-${Date.now()}-${Math.random()}-${idx}`,
        name: fileName,
        file: file,
        blobUrl: blobUrl
      };
    });

    if (isEdit && editingAsset) {
      // For edit mode, append to existing previews
      setEditingAsset({
        ...editingAsset,
        previews: [...editingAsset.previews, ...newPreviews]
      });
    } else {
      // For new asset, replace previews
      setNewAsset({
        ...newAsset,
        previews: currentAssetType === 'file' ? [newPreviews[0]] : newPreviews
      });
    }

    // Reset file input
    e.target.value = '';
    
    toast.success(`${validFiles.length} image(s) selected`);
  };

  // Remove preview from list
  const handleRemovePreview = (previewId: string, isEdit: boolean = false) => {
    if (isEdit && editingAsset) {
      const preview = editingAsset.previews.find(p => p.id === previewId);
      if (preview?.blobUrl) {
        URL.revokeObjectURL(preview.blobUrl);
      }
      setEditingAsset({
        ...editingAsset,
        previews: editingAsset.previews.filter(p => p.id !== previewId)
      });
    } else {
      const preview = newAsset.previews.find(p => p.id === previewId);
      if (preview?.blobUrl) {
        URL.revokeObjectURL(preview.blobUrl);
      }
      setNewAsset({
        ...newAsset,
        previews: newAsset.previews.filter(p => p.id !== previewId)
      });
    }
  };

  // Update preview name (inline edit)
  const handleUpdatePreviewName = (previewId: string, newName: string, isEdit: boolean = false) => {
    // Validate max 100 chars
    if (newName.length > 100) {
      toast.error('Preview name cannot exceed 100 characters');
      return;
    }

    if (isEdit && editingAsset) {
      setEditingAsset({
        ...editingAsset,
        previews: editingAsset.previews.map(p =>
          p.id === previewId ? { ...p, name: newName } : p
        )
      });
    } else {
      setNewAsset({
        ...newAsset,
        previews: newAsset.previews.map(p =>
          p.id === previewId ? { ...p, name: newName } : p
        )
      });
    }
  };

  // Clear all previews
  const handleClearAllPreviews = (isEdit: boolean = false) => {
    const previews = isEdit ? editingAsset?.previews || [] : newAsset.previews;
    
    if (previews.length === 0) return;

    const confirmed = window.confirm(`Clear all ${previews.length} preview(s)?`);
    if (!confirmed) return;

    // Revoke all blob URLs
    previews.forEach(preview => {
      if (preview.blobUrl) {
        URL.revokeObjectURL(preview.blobUrl);
      }
    });

    if (isEdit && editingAsset) {
      setEditingAsset({ ...editingAsset, previews: [] });
    } else {
      setNewAsset({ ...newAsset, previews: [] });
    }

    toast.success('All previews cleared');
  };

  // 🆕 NESTED FOLDERS: Toggle folder expand/collapse
  const toggleFolder = (folderId: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  // 🆕 NESTED FOLDERS: Enhanced delete with cascade
  const handleRemoveAssetWithCascade = (assetId: string) => {
    const asset = assets.find(a => a.id === assetId);
    if (!asset) return;

    // 🔧 BACKWARD COMPATIBILITY: Use normalized assets for tree operations
    const normalizedForRead = normalizeGDriveAssets(assets);
    const descendants = getAllDescendants(normalizedForRead, assetId);
    const totalToDelete = descendants.length + 1; // +1 for the asset itself

    if (totalToDelete > 1) {
      // Folder with children - show cascade delete confirmation
      const confirmed = window.confirm(
        `Delete "${asset.asset_name}"?\n\n` +
        `This folder contains ${descendants.length} item(s).\n` +
        `All nested items will be permanently deleted.\n\n` +
        `This action cannot be undone.`
      );
      if (!confirmed) return;
    }

    // Delete asset and all descendants
    const idsToDelete = new Set([assetId, ...descendants.map(d => d.id)]);
    const updatedAssets = assets.filter(a => !idsToDelete.has(a.id));
    
    onChange(updatedAssets);
    toast.success(`Deleted ${totalToDelete} item(s)`);
  };

  // 🆕 PHASE 3: Expand all folders
  const expandAllFolders = () => {
    const allFolderIds = assets
      .filter(a => a.asset_type === 'folder')
      .map(a => a.id);
    setExpandedFolders(new Set(allFolderIds));
    toast.success(`Expanded ${allFolderIds.length} folder(s)`);
  };

  // 🆕 PHASE 3: Collapse all folders
  const collapseAllFolders = () => {
    setExpandedFolders(new Set());
    toast.success('Collapsed all folders');
  };

  // 🆕 PHASE 3: Start adding child to folder
  const handleAddChildToFolder = (parentFolderId: string) => {
    const parentFolder = assets.find(a => a.id === parentFolderId);
    if (!parentFolder) return;

    // 🔧 BACKWARD COMPATIBILITY: Use normalized assets for validation
    const normalizedForRead = normalizeGDriveAssets(assets);
    const validation = validateNestingDepth(normalizedForRead, parentFolderId);
    if (!validation.valid) {
      toast.error(`Cannot add child: maximum nesting depth (${MAX_NESTING_DEPTH} levels) would be exceeded`);
      return;
    }

    // Pre-fill new asset with parent
    setNewAsset({
      asset_name: '',
      gdrive_link: '',
      asset_type: 'file',
      asset_id: undefined,
      parent_id: parentFolderId,
      previews: []
    });

    // Mark that we're adding to this folder
    setAddingChildToFolder(parentFolderId);

    // Auto-expand the parent folder
    setExpandedFolders(prev => new Set(prev).add(parentFolderId));

    // Scroll to add form (slight delay for expansion animation)
    setTimeout(() => {
      const formElement = document.getElementById('add-child-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 100);
  };

  // 🆕 PHASE 3: Cancel adding child
  const handleCancelAddChild = () => {
    setAddingChildToFolder(null);
    setNewAsset({
      asset_name: '',
      gdrive_link: '',
      asset_type: 'file',
      asset_id: undefined,
      parent_id: null,
      previews: []
    });
  };

  // 🆕 PHASE 3: Check if asset matches search
  const matchesSearch = (asset: GDriveAsset): boolean => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return asset.asset_name.toLowerCase().includes(query);
  };

  // 🆕 PHASE 3: Check if any descendant matches search
  const hasMatchingDescendant = (assetId: string): boolean => {
    if (!searchQuery.trim()) return false;
    // 🔧 BACKWARD COMPATIBILITY: Use normalized assets for tree operations
    const normalizedForRead = normalizeGDriveAssets(assets);
    const descendants = getAllDescendants(normalizedForRead, assetId);
    return descendants.some(d => matchesSearch(d));
  };

  // Add new asset
  const handleAddAsset = async () => {
    if (!newAsset.asset_name.trim()) {
      toast.error('Asset name is required');
      return;
    }

    if (!newAsset.gdrive_link.trim()) {
      toast.error('Google Drive link is required');
      return;
    }

    // 🆕 NESTED FOLDERS: Validate nesting depth
    if (newAsset.parent_id) {
      const validation = validateNestingDepth(assets, newAsset.parent_id);
      if (!validation.valid) {
        toast.error(`Maximum nesting depth (${MAX_NESTING_DEPTH} levels) would be exceeded`);
        return;
      }
    }

    setSavingAsset(true);

    try {
      const assetId = `gdrive-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Upload previews if any
      const uploadedPreviews: GDrivePreview[] = [];
      
      for (let i = 0; i < newAsset.previews.length; i++) {
        const preview = newAsset.previews[i];
        if (preview.file) {
          const url = await uploadPreview(preview.file, assetId, i);
          if (url) {
            uploadedPreviews.push({
              id: `preview-${assetId}-${i}`,
              url: url,
              name: preview.name.trim() || undefined // Only save if not empty
            });
            // Revoke blob URL after upload
            if (preview.blobUrl) {
              URL.revokeObjectURL(preview.blobUrl);
            }
          }
        }
      }

      const asset: GDriveAsset = {
        id: assetId,
        asset_name: newAsset.asset_name.trim(),
        gdrive_link: newAsset.gdrive_link.trim(),
        asset_type: newAsset.asset_type,
        asset_id: newAsset.asset_id,
        parent_id: newAsset.parent_id, // 🆕 NESTED FOLDERS
        preview_url: newAsset.asset_type === 'file' && uploadedPreviews[0]?.url 
          ? uploadedPreviews[0].url 
          : undefined,
        preview_urls: newAsset.asset_type === 'folder' && uploadedPreviews.length > 0 
          ? uploadedPreviews 
          : undefined,
        created_at: new Date().toISOString()
      };

      onChange([...assets, asset]);
      
      // Reset form
      setNewAsset({
        asset_name: '',
        gdrive_link: '',
        asset_type: 'file',
        asset_id: undefined,
        parent_id: null, // 🆕 NESTED FOLDERS
        previews: []
      });

      // 🆕 PHASE 3: Clear adding child state
      setAddingChildToFolder(null);

      toast.success('Google Drive asset added successfully');
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error('Failed to add asset');
    } finally {
      setSavingAsset(false);
    }
  };

  // Start editing asset
  const handleStartEdit = (asset: GDriveAsset) => {
    setEditingAssetId(asset.id);
    
    // Convert existing preview_urls to PreviewItem format
    const existingPreviews: PreviewItem[] = [];
    
    if (asset.asset_type === 'folder' && asset.preview_urls) {
      asset.preview_urls.forEach((preview) => {
        existingPreviews.push({
          id: preview.id,
          name: preview.name || '',
          url: preview.url
        });
      });
    } else if (asset.asset_type === 'file' && asset.preview_url) {
      existingPreviews.push({
        id: 'existing-preview',
        name: '',
        url: asset.preview_url
      });
    }

    setEditingAsset({
      asset_name: asset.asset_name,
      gdrive_link: asset.gdrive_link,
      asset_type: asset.asset_type,
      asset_id: asset.asset_id,
      parent_id: asset.parent_id, // 🆕 NESTED FOLDERS
      previews: existingPreviews
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    // Revoke any blob URLs
    editingAsset?.previews.forEach(preview => {
      if (preview.blobUrl) {
        URL.revokeObjectURL(preview.blobUrl);
      }
    });

    setEditingAssetId(null);
    setEditingAsset(null);
    setEditingPreviewId(null);
  };

  // Save edited asset
  const handleSaveEdit = async () => {
    if (!editingAssetId || !editingAsset) return;

    if (!editingAsset.asset_name.trim()) {
      toast.error('Asset name is required');
      return;
    }

    if (!editingAsset.gdrive_link.trim()) {
      toast.error('Google Drive link is required');
      return;
    }

    setSavingAsset(true);

    try {
      const uploadedPreviews: GDrivePreview[] = [];

      // Upload new previews (those with file & blobUrl)
      const newPreviews = editingAsset.previews.filter(p => p.file && p.blobUrl);
      for (let i = 0; i < newPreviews.length; i++) {
        const preview = newPreviews[i];
        const url = await uploadPreview(preview.file!, editingAssetId, Date.now() + i);
        if (url) {
          uploadedPreviews.push({
            id: `preview-${editingAssetId}-${Date.now()}-${i}`,
            url: url,
            name: preview.name.trim() || undefined
          });
          // Revoke blob URL
          if (preview.blobUrl) {
            URL.revokeObjectURL(preview.blobUrl);
          }
        }
      }

      // Keep existing previews (those with url but no file)
      const existingPreviews = editingAsset.previews
        .filter(p => p.url && !p.file)
        .map(p => ({
          id: p.id,
          url: p.url!,
          name: p.name.trim() || undefined
        }));

      const allPreviews = [...existingPreviews, ...uploadedPreviews];

      const updatedAssets = assets.map(asset => {
        if (asset.id === editingAssetId) {
          return {
            ...asset,
            asset_name: editingAsset.asset_name.trim(),
            gdrive_link: editingAsset.gdrive_link.trim(),
            asset_type: editingAsset.asset_type,
            asset_id: editingAsset.asset_id,
            parent_id: editingAsset.parent_id, // 🆕 NESTED FOLDERS
            preview_url: editingAsset.asset_type === 'file' && allPreviews[0]?.url
              ? allPreviews[0].url
              : undefined,
            preview_urls: editingAsset.asset_type === 'folder' && allPreviews.length > 0
              ? allPreviews
              : undefined
          };
        }
        return asset;
      });

      onChange(updatedAssets);
      setEditingAssetId(null);
      setEditingAsset(null);
      setEditingPreviewId(null);

      toast.success('Asset updated successfully');
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.error('Failed to update asset');
    } finally {
      setSavingAsset(false);
    }
  };

  // Remove asset
  const handleRemoveAsset = (id: string) => {
    onChange(assets.filter(asset => asset.id !== id));
    toast.success('Asset removed');
  };

  // Render preview grid/list
  const renderPreviewGrid = (previews: PreviewItem[], isEdit: boolean) => {
    if (previews.length === 0) return null;

    // Auto-select view mode based on count, but allow manual override
    const shouldShowList = previews.length >= 20;
    const currentViewMode = previewViewMode;

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm">
            Previews ({previews.length})
          </Label>
          <div className="flex gap-1">
            <Button
              type="button"
              size="sm"
              variant={currentViewMode === 'grid' ? 'secondary' : 'ghost'}
              onClick={() => setPreviewViewMode('grid')}
              className="h-7 w-7 p-0"
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={currentViewMode === 'list' ? 'secondary' : 'ghost'}
              onClick={() => setPreviewViewMode('list')}
              className="h-7 w-7 p-0"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => handleClearAllPreviews(isEdit)}
              className="h-7 text-xs px-2"
            >
              Clear All
            </Button>
          </div>
        </div>

        {currentViewMode === 'grid' ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {previews.map((preview) => (
              <div key={preview.id} className="space-y-2">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted group">
                  <img
                    src={preview.blobUrl || preview.url}
                    alt={preview.name || 'Preview'}
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemovePreview(preview.id, isEdit)}
                    className="absolute top-2 right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
                {editingPreviewId === preview.id ? (
                  <div className="flex gap-1">
                    <Input
                      value={preview.name}
                      onChange={(e) => handleUpdatePreviewName(preview.id, e.target.value, isEdit)}
                      onBlur={() => setEditingPreviewId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingPreviewId(null);
                        if (e.key === 'Escape') {
                          setEditingPreviewId(null);
                        }
                      }}
                      autoFocus
                      placeholder="Preview name (optional)"
                      className="text-sm h-8"
                      maxLength={100}
                    />
                  </div>
                ) : (
                  <div
                    onClick={() => setEditingPreviewId(preview.id)}
                    className="text-sm truncate px-2 py-1 rounded hover:bg-muted cursor-text transition-colors"
                    title="Click to edit name"
                  >
                    {preview.name || <span className="text-muted-foreground italic">Click to add name</span>}
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {preview.name.length}/100
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {previews.map((preview) => (
              <div key={preview.id} className="flex items-center gap-3 p-2 rounded-lg border bg-card">
                <div className="w-20 h-20 rounded overflow-hidden bg-muted flex-shrink-0">
                  <img
                    src={preview.blobUrl || preview.url}
                    alt={preview.name || 'Preview'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  {editingPreviewId === preview.id ? (
                    <Input
                      value={preview.name}
                      onChange={(e) => handleUpdatePreviewName(preview.id, e.target.value, isEdit)}
                      onBlur={() => setEditingPreviewId(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') setEditingPreviewId(null);
                        if (e.key === 'Escape') setEditingPreviewId(null);
                      }}
                      autoFocus
                      placeholder="Preview name (optional)"
                      className="text-sm"
                      maxLength={100}
                    />
                  ) : (
                    <div
                      onClick={() => setEditingPreviewId(preview.id)}
                      className="px-2 py-1.5 rounded hover:bg-muted cursor-text transition-colors"
                      title="Click to edit name"
                    >
                      {preview.name || <span className="text-muted-foreground italic">Click to add name</span>}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground px-2">
                    {preview.name.length}/100 characters
                  </p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemovePreview(preview.id, isEdit)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 🆕 NESTED FOLDERS: Render tree node (recursive)
  const renderTreeNode = (node: GDriveTreeNode): JSX.Element => {
    const asset = node.asset;
    const isExpanded = expandedFolders.has(asset.id);
    const hasSubfolders = node.children.length > 0;
    const indentationLevel = node.depth;
    const indentPx = indentationLevel * 24; // 24px per level

    // 🆕 PHASE 3: Search filtering
    const assetMatches = matchesSearch(asset);
    const descendantMatches = hasMatchingDescendant(asset.id);
    const shouldShow = !searchQuery.trim() || assetMatches || descendantMatches;
    
    if (!shouldShow) return <></>;

    // 🆕 PHASE 3: Auto-expand if descendant matches search
    if (searchQuery.trim() && descendantMatches && asset.asset_type === 'folder' && !isExpanded) {
      // Auto-expand to show matching children
      setExpandedFolders(prev => new Set(prev).add(asset.id));
    }

    // Check if this asset is currently being edited
    if (editingAssetId === asset.id && editingAsset) {
      return renderEditForm(asset, indentPx);
    }

    // View mode
    const previewCount = asset.asset_type === 'file' ? (asset.preview_url ? 1 : 0) : (asset.preview_urls?.length || 0);
    // 🔧 BACKWARD COMPATIBILITY: Use normalized assets for tree operations
    const itemCount = asset.asset_type === 'folder' ? getFolderItemCount(normalizedAssets, asset.id) : null;

    return (
      <div key={asset.id}>
        <Card style={{ marginLeft: `${indentPx}px` }}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-3">
              {/* Preview Image - Square thumbnail */}
              {(() => {
                const previewUrl = asset.asset_type === 'file' 
                  ? asset.preview_url 
                  : (asset.preview_urls && asset.preview_urls.length > 0 
                      ? (typeof asset.preview_urls[0] === 'string' 
                          ? asset.preview_urls[0] 
                          : asset.preview_urls[0].url)
                      : undefined);
                
                if (previewUrl) {
                  return (
                    <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                      <img 
                        src={previewUrl} 
                        alt={asset.asset_name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  );
                }
                return null;
              })()}
              
              {/* Left side: Icon, name, info */}
              <div className="flex-1 min-w-0 flex items-start gap-2">
                {/* Expand/collapse button for folders with children */}
                {asset.asset_type === 'folder' && hasSubfolders && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleFolder(asset.id)}
                    className="h-6 w-6 p-0 flex-shrink-0 hover:bg-accent"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                )}
                
                {/* Icon and content */}
                <div className="flex-1 min-w-0" style={{ marginLeft: asset.asset_type === 'folder' && !hasSubfolders ? '32px' : '0' }}>
                  <div className="flex items-center gap-2 mb-2">
                    {asset.asset_type === 'folder' ? (
                      isExpanded && hasSubfolders ? (
                        <FolderOpen className="h-4 w-4 flex-shrink-0 text-primary" />
                      ) : (
                        <FolderIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      )
                    ) : (
                      <FileIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    )}
                    <h4 className="truncate">
                      {/* 🆕 PHASE 3: Highlight search matches */}
                      {searchQuery.trim() && assetMatches ? (
                        <span>
                          {asset.asset_name.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) => 
                            part.toLowerCase() === searchQuery.toLowerCase() ? (
                              <mark key={i} className="bg-yellow-300 dark:bg-yellow-600 px-0.5 rounded">
                                {part}
                              </mark>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </span>
                      ) : (
                        asset.asset_name
                      )}
                    </h4>
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                    <a
                      href={asset.gdrive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-foreground transition-colors flex items-center gap-1 truncate"
                    >
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">Open in GDrive</span>
                    </a>
                    {previewCount > 0 && (
                      <>
                        <span>•</span>
                        <span>{previewCount} preview{previewCount > 1 ? 's' : ''}</span>
                      </>
                    )}
                    {itemCount && itemCount.total > 0 && (
                      <>
                        <span>•</span>
                        <span>
                          {itemCount.total} item{itemCount.total > 1 ? 's' : ''}
                          {itemCount.folders > 0 && ` (${itemCount.folders} folder${itemCount.folders > 1 ? 's' : ''})`}
                        </span>
                      </>
                    )}
                  </div>
                  
                  {asset.asset_id && (
                    <div className="mt-2">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/5 border border-primary/10">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                        <span className="text-xs">
                          {actionableItems.find(item => item.id === asset.asset_id)?.title || 'Unknown Asset'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right side: Action buttons */}
              <div className="flex gap-2 flex-shrink-0">
                {/* 🆕 PHASE 3: Add child button for folders */}
                {asset.asset_type === 'folder' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddChildToFolder(asset.id)}
                    className="h-8 w-8 p-0 text-primary hover:text-primary"
                    title="Add child to this folder"
                  >
                    <FolderPlus className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStartEdit(asset)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveAssetWithCascade(asset.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 🆕 PHASE 3: Inline "Add Child" form */}
        {asset.asset_type === 'folder' && addingChildToFolder === asset.id && (
          <div className="mt-2" style={{ marginLeft: `${indentPx + 24}px` }} id="add-child-form">
            <Card className="border-2 border-primary/50 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FolderPlus className="h-4 w-4 text-primary" />
                  <Label className="text-primary">
                    Adding to: {asset.asset_name}
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  This asset will be created inside "{asset.asset_name}"
                </p>
                {/* Quick reference to main form below */}
                <div className="p-3 rounded-lg bg-muted/30 border border-dashed text-sm text-center">
                  <p className="text-muted-foreground">
                    Scroll down to the "Add New Asset" form below to complete the details.
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Parent is already set to: <span className="font-medium">{asset.asset_name}</span>
                  </p>
                  <div className="flex gap-2 mt-3 justify-center">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleCancelAddChild}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => {
                        // Scroll to main add form
                        const mainForm = document.getElementById('main-add-asset-form');
                        if (mainForm) {
                          mainForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          // Highlight the form briefly
                          mainForm.style.boxShadow = '0 0 0 3px rgba(var(--primary), 0.3)';
                          setTimeout(() => {
                            mainForm.style.boxShadow = '';
                          }, 1500);
                        }
                      }}
                    >
                      Go to Form
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Render children if expanded */}
        {asset.asset_type === 'folder' && isExpanded && hasSubfolders && (
          <div className="mt-2 space-y-2">
            {node.children.map((childNode) => renderTreeNode(childNode))}
          </div>
        )}
      </div>
    );
  };

  // 🆕 NESTED FOLDERS: Render edit form (with indentation)
  const renderEditForm = (asset: GDriveAsset, indentPx: number): JSX.Element => {
    if (!editingAsset) return <></>;

    return (
      <Card key={asset.id} style={{ marginLeft: `${indentPx}px` }}>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Asset Name</Label>
              <Input
                value={editingAsset.asset_name}
                onChange={(e) => setEditingAsset({ ...editingAsset, asset_name: e.target.value })}
                placeholder="e.g., Final Deliverables"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={editingAsset.asset_type}
                onValueChange={(value: 'file' | 'folder') =>
                  setEditingAsset({ ...editingAsset, asset_type: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="folder">Folder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Google Drive Link</Label>
            <Input
              value={editingAsset.gdrive_link}
              onChange={(e) => setEditingAsset({ ...editingAsset, gdrive_link: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="mt-1"
            />
          </div>

          {/* 🆕 NESTED FOLDERS: Parent folder selector */}
          <div>
            <Label>Parent Folder (Optional)</Label>
            <Select
              value={editingAsset.parent_id || 'root'}
              onValueChange={(value) => {
                setEditingAsset({
                  ...editingAsset,
                  parent_id: value === 'root' ? null : value
                });
              }}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <span className="text-muted-foreground">── Root Level (No Parent) ──</span>
                </SelectItem>
                {getAvailableParentFolders(normalizedAssets, asset.id).map((folder) => (
                  <SelectItem 
                    key={folder.id} 
                    value={folder.id}
                    disabled={folder.disabled}
                  >
                    <span style={{ marginLeft: `${folder.depth * 12}px` }}>
                      📁 {folder.name}
                      {folder.disabled && <span className="text-muted-foreground ml-2">(max depth)</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Choose a parent folder to nest this asset (max {MAX_NESTING_DEPTH} levels)
            </p>
          </div>

          <div>
            <Label>Link to Asset (Optional)</Label>
            {actionableItems.length === 0 ? (
              <div className="mt-1 p-3 rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground text-center">
                No assets available. Add assets first to link them.
              </div>
            ) : (
              <Select
                value={editingAsset.asset_id || 'none'}
                onValueChange={(value) => {
                  setEditingAsset({
                    ...editingAsset,
                    asset_id: value === 'none' ? undefined : value
                  });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an asset..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No asset linked</span>
                  </SelectItem>
                  {actionableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {actionableItems.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {actionableItems.length} asset{actionableItems.length > 1 ? 's' : ''} available
              </p>
            )}
          </div>

          <div>
            <Label>Preview Images</Label>
            <Input
              type="file"
              accept="image/*"
              multiple={editingAsset.asset_type === 'folder'}
              onChange={(e) => handlePreviewFileSelect(e, true)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {editingAsset.asset_type === 'folder'
                ? 'Select multiple images. Max 5MB each.'
                : 'Select one image. Max 5MB.'}
            </p>
          </div>

          {renderPreviewGrid(editingAsset.previews, true)}

          <div className="flex gap-2">
            <Button
              onClick={handleSaveEdit}
              disabled={savingAsset}
              className="flex-1"
            >
              {savingAsset ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Save
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancelEdit}
              disabled={savingAsset}
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // 🔧 BACKWARD COMPATIBILITY: Normalize old assets (undefined parent_id → null)
  const normalizedAssets = normalizeGDriveAssets(assets);
  
  // 🆕 NESTED FOLDERS: Build tree structure
  const tree = buildTree(normalizedAssets);

  return (
    <div className="space-y-4">
      {/* 🆕 NESTED FOLDERS: Tree View */}
      {assets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <Label>Google Drive Assets ({assets.length})</Label>
            
            {/* 🆕 PHASE 3: Expand/Collapse All buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={expandAllFolders}
                className="h-8 text-xs"
                disabled={assets.filter(a => a.asset_type === 'folder').length === 0}
              >
                <ChevronsDown className="h-3 w-3 mr-1" />
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={collapseAllFolders}
                className="h-8 text-xs"
                disabled={expandedFolders.size === 0}
              >
                <ChevronsUp className="h-3 w-3 mr-1" />
                Collapse All
              </Button>
            </div>
          </div>

          {/* 🆕 PHASE 3: Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* 🆕 PHASE 3: Search results info */}
          {searchQuery.trim() && (
            <div className="text-xs text-muted-foreground px-1">
              {(() => {
                const matchCount = assets.filter(a => matchesSearch(a)).length;
                return matchCount > 0 
                  ? `Found ${matchCount} matching asset${matchCount > 1 ? 's' : ''}`
                  : 'No matches found';
              })()}
            </div>
          )}

          {/* Tree rendering */}
          <div className="space-y-2">
            {tree.map((node) => renderTreeNode(node))}
          </div>
        </div>
      )}

      {/* OLD FLAT LIST - KEPT FOR REFERENCE (HIDDEN) */}
      {false && assets.length > 0 && (
        <div className="space-y-3">
          <Label>Google Drive Assets ({assets.length}) [OLD]</Label>
          {assets.map((asset) => {
            if (editingAssetId === asset.id && editingAsset) {
              // Edit mode
              return (
                <Card key={asset.id}>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label>Asset Name</Label>
                        <Input
                          value={editingAsset.asset_name}
                          onChange={(e) => setEditingAsset({ ...editingAsset, asset_name: e.target.value })}
                          placeholder="e.g., Final Deliverables"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={editingAsset.asset_type}
                          onValueChange={(value: 'file' | 'folder') =>
                            setEditingAsset({ ...editingAsset, asset_type: value })
                          }
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="file">File</SelectItem>
                            <SelectItem value="folder">Folder</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label>Google Drive Link</Label>
                      <Input
                        value={editingAsset.gdrive_link}
                        onChange={(e) => setEditingAsset({ ...editingAsset, gdrive_link: e.target.value })}
                        placeholder="https://drive.google.com/..."
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label>Link to Asset (Optional)</Label>
                      {actionableItems.length === 0 ? (
                        <div className="mt-1 p-3 rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground text-center">
                          No assets available. Add assets first to link them.
                        </div>
                      ) : (
                        <Select
                          value={editingAsset.asset_id || 'none'}
                          onValueChange={(value) => {
                            setEditingAsset({
                              ...editingAsset,
                              asset_id: value === 'none' ? undefined : value
                            });
                          }}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue placeholder="Select an asset..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">No asset linked</span>
                            </SelectItem>
                            {actionableItems.map((item) => (
                              <SelectItem key={item.id} value={item.id}>
                                {item.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      {actionableItems.length > 0 && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {actionableItems.length} asset{actionableItems.length > 1 ? 's' : ''} available
                        </p>
                      )}
                    </div>

                    <div>
                      <Label>Preview Images</Label>
                      <Input
                        type="file"
                        accept="image/*"
                        multiple={editingAsset.asset_type === 'folder'}
                        onChange={(e) => handlePreviewFileSelect(e, true)}
                        className="mt-1"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        {editingAsset.asset_type === 'folder'
                          ? 'Select multiple images. Max 5MB each.'
                          : 'Select one image. Max 5MB.'}
                      </p>
                    </div>

                    {renderPreviewGrid(editingAsset.previews, true)}

                    <div className="flex gap-2">
                      <Button
                        onClick={handleSaveEdit}
                        disabled={savingAsset}
                        className="flex-1"
                      >
                        {savingAsset ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={savingAsset}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            const previewCount = asset.asset_type === 'file' ? (asset.preview_url ? 1 : 0) : (asset.preview_urls?.length || 0);
            
            return (
              <Card key={asset.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {asset.asset_type === 'folder' ? (
                          <FolderIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        ) : (
                          <FileIcon className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                        )}
                        <h4 className="truncate">{asset.asset_name}</h4>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <a
                          href={asset.gdrive_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-foreground transition-colors flex items-center gap-1 truncate"
                        >
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">Open in GDrive</span>
                        </a>
                        {previewCount > 0 && (
                          <>
                            <span>•</span>
                            <span>{previewCount} preview{previewCount > 1 ? 's' : ''}</span>
                          </>
                        )}
                      </div>
                      
                      {asset.asset_id && (
                        <div className="mt-2">
                          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/5 border border-primary/10">
                            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
                            <span className="text-xs">
                              {actionableItems.find(item => item.id === asset.asset_id)?.title || 'Unknown Asset'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(asset)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAsset(asset.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add New Asset */}
      <Card 
        id="main-add-asset-form" 
        className={addingChildToFolder ? 'border-2 border-primary/50' : ''}
      >
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Label>Google Drive Assets</Label>
            <div className="flex items-center gap-2">
              {/* 🆕 PHASE 3: Show context when adding child */}
              {addingChildToFolder && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelAddChild}
                  className="h-7 text-xs"
                >
                  <X className="h-3 w-3 mr-1" />
                  Cancel Add Child
                </Button>
              )}
              {onClose && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                  title="Hide section"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          {/* 🆕 PHASE 3: Context banner when adding child */}
          {addingChildToFolder && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-start gap-2">
                <FolderPlus className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium text-primary">Adding child to:</span>{' '}
                    {assets.find(a => a.id === addingChildToFolder)?.asset_name || 'Unknown Folder'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Fill in the details below to create a new asset inside this folder
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label>Asset Name *</Label>
              <Input
                value={newAsset.asset_name}
                onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                placeholder="e.g., Final Deliverables"
                className="mt-1"
              />
            </div>
            <div>
              <Label>Type *</Label>
              <Select
                value={newAsset.asset_type}
                onValueChange={(value: 'file' | 'folder') =>
                  setNewAsset({ ...newAsset, asset_type: value, previews: [] })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="folder">Folder</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Google Drive Link *</Label>
            <Input
              value={newAsset.gdrive_link}
              onChange={(e) => setNewAsset({ ...newAsset, gdrive_link: e.target.value })}
              placeholder="https://drive.google.com/..."
              className="mt-1"
            />
          </div>

          {/* 🆕 NESTED FOLDERS: Parent folder selector */}
          <div>
            <Label>Parent Folder (Optional)</Label>
            <Select
              value={newAsset.parent_id || 'root'}
              onValueChange={(value) => {
                setNewAsset({
                  ...newAsset,
                  parent_id: value === 'root' ? null : value
                });
              }}
              disabled={!!addingChildToFolder} // 🆕 PHASE 3: Disabled when adding child
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="root">
                  <span className="text-muted-foreground">── Root Level (No Parent) ──</span>
                </SelectItem>
                {getAvailableParentFolders(normalizedAssets).map((folder) => (
                  <SelectItem 
                    key={folder.id} 
                    value={folder.id}
                    disabled={folder.disabled}
                  >
                    <span style={{ marginLeft: `${folder.depth * 12}px` }}>
                      📁 {folder.name}
                      {folder.disabled && <span className="text-muted-foreground ml-2">(max depth)</span>}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {addingChildToFolder 
                ? '🔒 Parent is locked when using "Add Child" button'
                : `Place this asset inside a folder (max ${MAX_NESTING_DEPTH} levels deep)`
              }
            </p>
          </div>

          <div>
            <Label>Link to Asset (Optional)</Label>
            {actionableItems.length === 0 ? (
              <div className="mt-1 p-3 rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground text-center">
                No assets available. Add assets first to link them.
              </div>
            ) : (
              <Select
                value={newAsset.asset_id || 'none'}
                onValueChange={(value) => {
                  setNewAsset({
                    ...newAsset,
                    asset_id: value === 'none' ? undefined : value
                  });
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select an asset..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">
                    <span className="text-muted-foreground">No asset linked</span>
                  </SelectItem>
                  {actionableItems.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {actionableItems.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {actionableItems.length} asset{actionableItems.length > 1 ? 's' : ''} available
              </p>
            )}
          </div>

          <div>
            <Label>Preview Images (Optional)</Label>
            <Input
              type="file"
              accept="image/*"
              multiple={newAsset.asset_type === 'folder'}
              onChange={(e) => handlePreviewFileSelect(e, false)}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {newAsset.asset_type === 'folder'
                ? 'Select multiple images for carousel preview. Max 5MB each.'
                : 'Select one preview image. Max 5MB.'}
            </p>
          </div>

          {renderPreviewGrid(newAsset.previews, false)}

          <Button
            onClick={handleAddAsset}
            disabled={savingAsset}
            className="w-full"
          >
            {savingAsset ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Adding Asset...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Google Drive Asset
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
