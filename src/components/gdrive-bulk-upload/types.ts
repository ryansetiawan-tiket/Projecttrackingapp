/**
 * Types for GDrive Bulk Upload Feature
 * Supports both folder structure detection and individual file upload
 */

import { ActionableItem } from '../../types/project';

export type UploadMode = 'folder' | 'files' | 'idle';

export interface UploadItem {
  // Temporary ID for UI tracking (before DB save)
  tempId: string;
  
  // Basic info
  name: string;
  type: 'folder' | 'file';
  
  // File data (only for type='file')
  file?: File;
  previewUrl?: string; // ObjectURL for local preview
  
  // Hierarchy (null = root level)
  parentTempId: string | null;
  
  // Metadata (editable)
  gdrive_link: string;
  asset_id?: string; // Associated actionable item
  
  // Tree UI state
  expanded?: boolean; // For folders
  
  // Validation
  errors?: {
    name?: string;
    gdrive_link?: string;
  };
}

export interface FolderTreeItemProps {
  item: UploadItem;
  items: UploadItem[]; // All items (for finding children)
  depth: number; // Indentation level
  actionableItems: ActionableItem[];
  onUpdate: (tempId: string, updates: Partial<UploadItem>) => void;
  onRemove: (tempId: string) => void;
  onToggleExpand: (tempId: string) => void;
  onBatchAssign: (folderTempId: string, assetId: string | undefined) => void;
}

export interface FileTreeItemProps {
  item: UploadItem;
  depth: number;
  actionableItems: ActionableItem[];
  onUpdate: (tempId: string, updates: Partial<UploadItem>) => void;
  onRemove: (tempId: string) => void;
}

export interface FileCardProps {
  item: UploadItem;
  existingFolders: UploadItem[]; // For parent dropdown
  actionableItems: ActionableItem[];
  onUpdate: (tempId: string, updates: Partial<UploadItem>) => void;
  onRemove: (tempId: string) => void;
}

export interface AssignAssetPopoverProps {
  actionableItems: ActionableItem[];
  selectedAssetId?: string;
  onSelect: (assetId: string | undefined) => void;
  trigger: React.ReactNode;
}

export interface DragDropZoneProps {
  onFolderDrop: (items: UploadItem[]) => void;
  onFilesDrop: (items: UploadItem[]) => void;
}

export interface FolderStructureEditorProps {
  items: UploadItem[];
  actionableItems: ActionableItem[];
  onChange: (items: UploadItem[]) => void;
}

export interface FileCardsEditorProps {
  items: UploadItem[];
  existingFolders: UploadItem[];
  actionableItems: ActionableItem[];
  onChange: (items: UploadItem[]) => void;
}
