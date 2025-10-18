import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Progress } from './ui/progress';
import { Plus, Upload, RefreshCw, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Project, GDriveAsset } from '../types/project';
import { toast } from 'sonner@2.0.3';
import { DragDropZone } from './gdrive-bulk-upload/DragDropZone';
import { FolderStructureEditor } from './gdrive-bulk-upload/FolderStructureEditor';
import { FileCardsEditor } from './gdrive-bulk-upload/FileCardsEditor';
import { UploadItem, UploadMode } from './gdrive-bulk-upload/types';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AddGDriveAssetDialogProps {
  projects: Project[];
  onProjectUpdate?: (id: string, data: Partial<Project>) => void;
  prefilledProjectId?: string; // 🆕 Pre-fill project when opened from specific project
  open?: boolean; // 🆕 Controlled open state
  onOpenChange?: (open: boolean) => void; // 🆕 Controlled open state handler
}

export function AddGDriveAssetDialog({ 
  projects, 
  onProjectUpdate,
  prefilledProjectId,
  open: controlledOpen,
  onOpenChange
}: AddGDriveAssetDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<UploadMode>('idle');
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  // 🆕 Set prefilled project when dialog opens
  useEffect(() => {
    if (open && prefilledProjectId) {
      setSelectedProjectId(prefilledProjectId);
    }
  }, [open, prefilledProjectId]);
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  const actionableItems = selectedProject?.actionable_items || [];
  
  // Sort projects alphabetically
  const sortedProjects = [...projects].sort((a, b) => 
    a.project_name.localeCompare(b.project_name)
  );
  
  const handleReset = () => {
    setSelectedProjectId('');
    setUploadMode('idle');
    setUploadItems([]);
    setUploadProgress(0);
    
    // Cleanup object URLs
    uploadItems.forEach(item => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
  };
  
  const handleClose = () => {
    handleReset();
    setOpen(false);
  };
  
  const handleFolderDrop = (items: UploadItem[]) => {
    setUploadMode('folder');
    setUploadItems(items);
  };
  
  const handleFilesDrop = (items: UploadItem[]) => {
    setUploadMode('files');
    setUploadItems(items);
  };
  
  const handleReupload = () => {
    // Cleanup old preview URLs
    uploadItems.forEach(item => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    
    setUploadMode('idle');
    setUploadItems([]);
  };
  
  // Validate before upload
  const validateItems = (): boolean => {
    let isValid = true;
    const updatedItems = uploadItems.map(item => {
      const errors: UploadItem['errors'] = {};
      
      // Name required
      if (!item.name.trim()) {
        errors.name = 'Name is required';
        isValid = false;
      }
      
      // Folder link required
      if (item.type === 'folder' && !item.gdrive_link.trim()) {
        errors.gdrive_link = 'Google Drive link is required for folders';
        isValid = false;
      }
      
      return { ...item, errors: Object.keys(errors).length > 0 ? errors : undefined };
    });
    
    setUploadItems(updatedItems);
    return isValid;
  };
  
  // Get inherited link from parent
  const getInheritedLink = (item: UploadItem, allItems: UploadItem[]): string => {
    if (item.gdrive_link) return item.gdrive_link;
    if (!item.parentTempId) return '';
    
    const parent = allItems.find(i => i.tempId === item.parentTempId);
    if (!parent) return '';
    
    return getInheritedLink(parent, allItems); // Recursive
  };
  
  // Get inherited asset_id from parent
  const getInheritedAssetId = (item: UploadItem, allItems: UploadItem[]): string | undefined => {
    if (item.asset_id) return item.asset_id;
    if (!item.parentTempId) return undefined;
    
    const parent = allItems.find(i => i.tempId === item.parentTempId);
    if (!parent) return undefined;
    
    return getInheritedAssetId(parent, allItems); // Recursive
  };
  
  // Map temp ID to final ID (after creating hierarchy)
  const tempIdToFinalIdMap = new Map<string, string>();
  
  // Upload files to Supabase Storage via backend endpoint
  const uploadFilesToStorage = async (
    filesToUpload: UploadItem[]
  ): Promise<Map<string, string>> => {
    const results = new Map<string, string>(); // tempId -> signedUrl
    let completed = 0;
    
    for (const item of filesToUpload) {
      if (!item.file) continue;
      
      try {
        // Generate unique asset ID for this file
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substr(2, 9);
        const assetId = `${timestamp}-${randomStr}`;
        
        // Upload to backend endpoint (like GDriveAssetManager does)
        const formData = new FormData();
        formData.append('file', item.file);
        formData.append('projectId', selectedProjectId);
        formData.append('assetId', assetId);
        
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
          const errorText = await response.text();
          throw new Error(`Upload failed: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        
        if (data.signedUrl) {
          results.set(item.tempId, data.signedUrl);
        }
        
        completed++;
        setUploadProgress(Math.round((completed / filesToUpload.length) * 100));
        
      } catch (error) {
        console.error(`Upload failed for ${item.name}:`, error);
        toast.error(`Failed to upload ${item.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    return results;
  };
  
  const handleSubmit = async () => {
    // Validate
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }
    
    if (uploadItems.length === 0) {
      toast.error('No files to upload');
      return;
    }
    
    if (!validateItems()) {
      toast.error('Please fix validation errors');
      return;
    }
    
    if (!selectedProject) {
      toast.error('Project not found');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    
    try {
      // Filter files to upload
      const filesToUpload = uploadItems.filter(item => item.type === 'file');
      
      // Upload files to Supabase Storage
      const uploadedFiles = await uploadFilesToStorage(filesToUpload);
      
      // Create final GDriveAsset structure
      const finalAssets: GDriveAsset[] = [];
      
      // Process items in order (folders first, then files)
      const folders = uploadItems.filter(i => i.type === 'folder');
      const files = uploadItems.filter(i => i.type === 'file');
      
      // Create folders first
      folders.forEach((item, index) => {
        const finalId = `gdrive-${Date.now()}-${index}`;
        tempIdToFinalIdMap.set(item.tempId, finalId);
        
        finalAssets.push({
          id: finalId,
          asset_name: item.name,
          asset_type: 'folder',
          gdrive_link: item.gdrive_link,
          parent_id: item.parentTempId 
            ? (tempIdToFinalIdMap.get(item.parentTempId) || null)
            : null,
          asset_id: item.asset_id || getInheritedAssetId(item, uploadItems),
          created_at: new Date().toISOString()
        });
      });
      
      // Create files
      files.forEach((item, index) => {
        const finalId = `gdrive-${Date.now()}-${folders.length + index}`;
        const signedUrl = uploadedFiles.get(item.tempId);
        
        finalAssets.push({
          id: finalId,
          asset_name: item.name,
          asset_type: 'file',
          gdrive_link: item.gdrive_link || getInheritedLink(item, uploadItems),
          parent_id: item.parentTempId 
            ? (tempIdToFinalIdMap.get(item.parentTempId) || null)
            : null,
          asset_id: item.asset_id || getInheritedAssetId(item, uploadItems),
          preview_url: signedUrl,
          preview_urls: signedUrl ? [signedUrl] : undefined,
          created_at: new Date().toISOString()
        });
      });
      
      // Update project
      const updatedAssets = [...(selectedProject.gdrive_assets || []), ...finalAssets];
      
      if (onProjectUpdate) {
        await onProjectUpdate(selectedProjectId, {
          gdrive_assets: updatedAssets
        });
      }
      
      toast.success(`${finalAssets.length} assets added to ${selectedProject.project_name}`);
      handleClose();
      
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload assets');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Show trigger button only if not using controlled state */}
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add GDrive Asset
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Google Drive Assets</DialogTitle>
          <DialogDescription>
            Upload files or folders to Google Drive assets. Drag and drop to auto-detect folder structure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Project Selector */}
          <div className="space-y-2">
            <Label htmlFor="project_selector">
              Select Project <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
              disabled={uploading}
            >
              <SelectTrigger id="project_selector">
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {sortedProjects.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No projects available</div>
                ) : (
                  sortedProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Show drag & drop or editors */}
          {selectedProjectId && (
            <>
              {uploadMode === 'idle' ? (
                <DragDropZone
                  onFolderDrop={handleFolderDrop}
                  onFilesDrop={handleFilesDrop}
                />
              ) : (
                <>
                  {/* Re-upload button */}
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleReupload}
                      disabled={uploading}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-upload Files
                    </Button>
                  </div>
                  
                  {/* Editor based on mode */}
                  {uploadMode === 'folder' ? (
                    <FolderStructureEditor
                      items={uploadItems}
                      actionableItems={actionableItems}
                      onChange={setUploadItems}
                    />
                  ) : (
                    <FileCardsEditor
                      items={uploadItems}
                      existingFolders={uploadItems.filter(i => i.type === 'folder')}
                      actionableItems={actionableItems}
                      onChange={setUploadItems}
                    />
                  )}
                </>
              )}
            </>
          )}
          
          {/* Upload progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Uploading assets...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
          
          {/* Validation errors summary */}
          {uploadMode !== 'idle' && !uploading && (
            (() => {
              const errorCount = uploadItems.filter(
                i => i.errors && Object.keys(i.errors).length > 0
              ).length;
              
              return errorCount > 0 ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {errorCount} validation error{errorCount === 1 ? '' : 's'} found. 
                    Please fix highlighted fields before uploading.
                  </AlertDescription>
                </Alert>
              ) : null;
            })()
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          {uploadMode !== 'idle' && (
            <Button 
              variant="default" 
              onClick={handleSubmit}
              disabled={!selectedProjectId || uploadItems.length === 0 || uploading}
            >
              <Upload className="h-4 w-4 mr-2" />
              Upload {uploadItems.length} Asset{uploadItems.length === 1 ? '' : 's'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
