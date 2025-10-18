import { useState } from 'react';
import { Upload, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { toast } from 'sonner@2.0.3';
import { DragDropZoneProps, UploadItem } from './types';

// Max constraints
const MAX_FILES = 100;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DEPTH = 10;

export function DragDropZone({ onFolderDrop, onFilesDrop }: DragDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  
  // Check browser support for FileSystem API
  const supportsFileSystemAPI = 'webkitGetAsEntry' in DataTransferItem.prototype;
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const items = e.dataTransfer.items;
    if (!items || items.length === 0) {
      toast.error('No files detected');
      return;
    }
    
    // Check if any item is a folder
    const hasFolder = Array.from(items).some(item => {
      const entry = item.webkitGetAsEntry?.();
      return entry?.isDirectory;
    });
    
    if (hasFolder && !supportsFileSystemAPI) {
      toast.error('Folder upload is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    
    try {
      if (hasFolder) {
        // Scenario A: Folder structure
        const uploadItems = await parseFolderStructure(items);
        if (uploadItems.length > 0) {
          onFolderDrop(uploadItems);
        }
      } else {
        // Scenario B: Individual files
        const uploadItems = await parseFiles(items);
        if (uploadItems.length > 0) {
          onFilesDrop(uploadItems);
        }
      }
    } catch (error) {
      console.error('Drop error:', error);
      toast.error('Failed to process dropped items');
    }
  };
  
  return (
    <div className="space-y-4">
      {/* Browser compatibility warning */}
      {!supportsFileSystemAPI && (
        <Alert variant="default" className="border-amber-500 bg-amber-50 dark:bg-amber-950">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Limited Browser Support</AlertTitle>
          <AlertDescription>
            Folder upload requires Chrome or Edge browser. You can still upload individual files.
          </AlertDescription>
        </Alert>
      )}
      
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center transition-colors
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-muted/50'
          }
        `}
      >
        <div className="flex flex-col items-center gap-4">
          <Upload className={`h-12 w-12 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
          
          <div className="space-y-2">
            <p className="text-lg">
              {supportsFileSystemAPI 
                ? 'Drag & Drop Files or Folders'
                : 'Drag & Drop Files'
              }
            </p>
            <p className="text-sm text-muted-foreground">
              {supportsFileSystemAPI && 'Drop folder to auto-detect structure'}
            </p>
            <p className="text-sm text-muted-foreground">
              Drop files for individual upload
            </p>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1">
            <p>Max: {MAX_FILES} files, {MAX_FILE_SIZE / 1024 / 1024}MB each</p>
            <p>Images only (jpg, png, gif, webp)</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Parse folder structure recursively
async function parseFolderStructure(items: DataTransferItemList): Promise<UploadItem[]> {
  const result: UploadItem[] = [];
  let fileCount = 0;
  
  for (const item of Array.from(items)) {
    const entry = item.webkitGetAsEntry?.();
    if (!entry) continue;
    
    await traverseDirectory(entry, null, result, 0, (count) => {
      fileCount = count;
    });
  }
  
  if (fileCount > MAX_FILES) {
    toast.error(`Too many files! Maximum ${MAX_FILES} files allowed (found ${fileCount})`);
    return [];
  }
  
  return result;
}

// Recursive directory traversal
async function traverseDirectory(
  entry: FileSystemEntry,
  parentTempId: string | null,
  result: UploadItem[],
  depth: number,
  updateFileCount: (count: number) => void
): Promise<void> {
  // Max depth check
  if (depth >= MAX_DEPTH) {
    toast.warning(`Maximum folder depth (${MAX_DEPTH} levels) exceeded for: ${entry.name}`);
    return;
  }
  
  const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  if (entry.isDirectory) {
    // Add folder
    result.push({
      tempId,
      name: entry.name,
      type: 'folder',
      parentTempId,
      gdrive_link: '',
      expanded: true,
      errors: { gdrive_link: 'Required' } // Initial validation
    });
    
    // Traverse children
    const dirReader = (entry as FileSystemDirectoryEntry).createReader();
    const entries = await readEntries(dirReader);
    
    for (const childEntry of entries) {
      await traverseDirectory(childEntry, tempId, result, depth + 1, updateFileCount);
    }
    
  } else if (entry.isFile) {
    // Add file
    const fileEntry = entry as FileSystemFileEntry;
    const file = await getFile(fileEntry);
    
    // Validate: images only
    if (!file.type.startsWith('image/')) {
      toast.warning(`Skipped non-image file: ${file.name}`);
      return;
    }
    
    // Validate: max 5MB
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      toast.warning(`Skipped file > 5MB: ${file.name} (${sizeMB}MB)`);
      return;
    }
    
    // Update file count
    const currentCount = result.filter(r => r.type === 'file').length + 1;
    updateFileCount(currentCount);
    
    result.push({
      tempId,
      name: removeFileExtension(file.name),
      type: 'file',
      file,
      previewUrl: URL.createObjectURL(file),
      parentTempId,
      gdrive_link: '', // Optional, will inherit
      errors: {}
    });
  }
}

// Helper to promisify FileSystemDirectoryReader
function readEntries(dirReader: FileSystemDirectoryReader): Promise<FileSystemEntry[]> {
  return new Promise((resolve, reject) => {
    const entries: FileSystemEntry[] = [];
    
    const readBatch = () => {
      dirReader.readEntries((batch) => {
        if (batch.length === 0) {
          resolve(entries);
        } else {
          entries.push(...batch);
          readBatch(); // Continue reading (directories may return results in batches)
        }
      }, reject);
    };
    
    readBatch();
  });
}

// Helper to get File from FileEntry
function getFile(fileEntry: FileSystemFileEntry): Promise<File> {
  return new Promise((resolve, reject) => {
    fileEntry.file(resolve, reject);
  });
}

// Helper to remove file extension from name
function removeFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex === -1 || lastDotIndex === 0) {
    // No extension or hidden file (e.g., ".gitignore")
    return filename;
  }
  return filename.substring(0, lastDotIndex);
}

// Parse individual files (Scenario B)
async function parseFiles(items: DataTransferItemList): Promise<UploadItem[]> {
  const result: UploadItem[] = [];
  const files: File[] = [];
  
  // Collect all files
  for (const item of Array.from(items)) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }
  
  // Validate count
  if (files.length > MAX_FILES) {
    toast.error(`Too many files! Maximum ${MAX_FILES} files allowed (found ${files.length})`);
    return [];
  }
  
  // Process each file
  for (const file of files) {
    // Validate: images only
    if (!file.type.startsWith('image/')) {
      toast.warning(`Skipped non-image file: ${file.name}`);
      continue;
    }
    
    // Validate: max 5MB
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(1);
      toast.warning(`Skipped file > 5MB: ${file.name} (${sizeMB}MB)`);
      continue;
    }
    
    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    result.push({
      tempId,
      name: removeFileExtension(file.name),
      type: 'file',
      file,
      previewUrl: URL.createObjectURL(file),
      parentTempId: null, // Root level by default
      gdrive_link: '',
      errors: {}
    });
  }
  
  if (result.length === 0) {
    toast.error('No valid image files found');
  } else {
    toast.success(`${result.length} file${result.length === 1 ? '' : 's'} ready to upload`);
  }
  
  return result;
}
