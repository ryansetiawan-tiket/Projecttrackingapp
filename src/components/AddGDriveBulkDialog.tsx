import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { toast } from 'sonner@2.0.3';
import { ActionableItem, GDriveAsset } from '../types/project';
import { DragDropZone } from './gdrive-bulk-upload/DragDropZone';
import { FileCardsEditor } from './gdrive-bulk-upload/FileCardsEditor';
import { FolderStructureEditor } from './gdrive-bulk-upload/FolderStructureEditor';
import { UploadItem, UploadMode } from './gdrive-bulk-upload/types';
import { Loader2 } from 'lucide-react';

interface AddGDriveBulkDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionableItems: ActionableItem[];
  currentFolderId: string | null; // Where to add items
  currentFolderName: string; // For display
  onSave: (newAssets: Omit<GDriveAsset, 'id'>[], onProgress?: (current: number, total: number) => void) => Promise<void>;
}

export function AddGDriveBulkDialog({
  open,
  onOpenChange,
  actionableItems,
  currentFolderId,
  currentFolderName,
  onSave
}: AddGDriveBulkDialogProps) {
  const [uploadMode, setUploadMode] = useState<UploadMode>('idle');
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
  
  // Reset state when dialog closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Cleanup blob URLs to prevent memory leaks
      uploadItems.forEach(item => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      
      // Reset state
      setUploadMode('idle');
      setUploadItems([]);
      setIsUploading(false);
      setUploadProgress({ current: 0, total: 0 });
    }
    onOpenChange(newOpen);
  };
  
  // Handle folder drop
  const handleFolderDrop = (items: UploadItem[]) => {
    setUploadMode('folder');
    setUploadItems(items);
  };
  
  // Handle files drop
  const handleFilesDrop = (items: UploadItem[]) => {
    setUploadMode('files');
    setUploadItems(items);
  };
  
  // Validate and save
  const handleSave = async () => {
    // Validate all items
    const hasErrors = uploadItems.some(item => {
      if (item.errors && Object.keys(item.errors).length > 0) {
        return true;
      }
      
      // For folders, Google Drive URL is required
      if (item.type === 'folder' && !item.gdrive_link.trim()) {
        return true;
      }
      
      return false;
    });
    
    if (hasErrors) {
      toast.error('Please fix validation errors before saving');
      return;
    }
    
    // Convert UploadItems to GDriveAssets with proper hierarchy
    // We need to process items in order: parents before children
    const tempIdToParentTempId = new Map<string, string | null>();
    
    // Build parent map
    uploadItems.forEach(item => {
      tempIdToParentTempId.set(item.tempId, item.parentTempId);
    });
    
    // Sort items: parents before children
    const sortedItems = [...uploadItems].sort((a, b) => {
      // Check if a is ancestor of b
      let current: string | null = b.parentTempId;
      while (current) {
        if (current === a.tempId) return -1; // a is ancestor of b
        current = tempIdToParentTempId.get(current) || null;
      }
      
      // Check if b is ancestor of a
      current = a.parentTempId;
      while (current) {
        if (current === b.tempId) return 1; // b is ancestor of a
        current = tempIdToParentTempId.get(current) || null;
      }
      
      // Same level: folders before files
      if (a.type === 'folder' && b.type === 'file') return -1;
      if (a.type === 'file' && b.type === 'folder') return 1;
      
      return 0;
    });
    
    // Create assets with temp parent references
    const newAssets = sortedItems.map(item => {
      const asset: Omit<GDriveAsset, 'id'> & { _tempId: string; _parentTempId: string | null; _file?: File } = {
        asset_name: item.name,
        asset_type: item.type,
        gdrive_link: item.gdrive_link || '',
        asset_id: item.asset_id || null,
        parent_id: null, // Will be filled by GDrivePage with actual IDs
        preview_url: item.type === 'file' ? (item.previewUrl || null) : null,
        preview_urls: null,
        _tempId: item.tempId,
        _parentTempId: item.parentTempId,
        _file: item.file // Include the actual File object for upload
      };
      return asset;
    });
    
    try {
      // Save all new assets and wait for upload to complete
      console.log('[AddGDriveBulkDialog] Starting save process...');
      setIsUploading(true);
      await onSave(newAssets as any, (current: number, total: number) => {
        setUploadProgress({ current, total });
      });
      console.log('[AddGDriveBulkDialog] ✅ Save completed successfully!');
      
      // Cleanup blob URLs after successful save
      uploadItems.forEach(item => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
      
      // Close dialog
      handleOpenChange(false);
      
      toast.success(`Added ${newAssets.length} item${newAssets.length === 1 ? '' : 's'} to ${currentFolderName}`);
    } catch (error) {
      console.error('[AddGDriveBulkDialog] ❌ Error during save:', error);
      toast.error('Failed to save files. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className={`max-w-4xl max-h-[90vh] overflow-y-auto ${isUploading ? 'pb-24' : ''}`}>
        <DialogHeader>
          <DialogTitle>
            {uploadMode === 'idle' && 'Add Files or Folder'}
            {uploadMode === 'files' && 'Upload Files'}
            {uploadMode === 'folder' && 'Upload Folder Structure'}
          </DialogTitle>
          <DialogDescription>
            Will be added to: <strong>{currentFolderName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {uploadMode === 'idle' && (
            <DragDropZone
              onFolderDrop={handleFolderDrop}
              onFilesDrop={handleFilesDrop}
            />
          )}
          
          {uploadMode === 'files' && (
            <>
              <FileCardsEditor
                items={uploadItems}
                existingFolders={[]} // No folders in files mode
                actionableItems={actionableItems}
                onChange={setUploadItems}
              />
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadMode('idle');
                    setUploadItems([]);
                  }}
                >
                  ← Start Over
                </Button>
              </div>
            </>
          )}
          
          {uploadMode === 'folder' && (
            <>
              <FolderStructureEditor
                items={uploadItems}
                actionableItems={actionableItems}
                onChange={setUploadItems}
              />
              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    setUploadMode('idle');
                    setUploadItems([]);
                  }}
                >
                  ← Start Over
                </Button>
              </div>
            </>
          )}
        </div>
        
        {uploadMode !== 'idle' && (
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                `Add ${uploadItems.length} Item${uploadItems.length === 1 ? '' : 's'}`
              )}
            </Button>
          </DialogFooter>
        )}
        
        {isUploading && (
          <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t p-4">
            <Progress value={uploadProgress.total > 0 ? (uploadProgress.current / uploadProgress.total * 100) : 0} className="mb-2" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Uploading {uploadProgress.current} of {uploadProgress.total} files...
              </span>
              <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}