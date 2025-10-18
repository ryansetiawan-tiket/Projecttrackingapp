/**
 * Asset Overview - Type Definitions
 * 
 * Generic types for the shared AssetOverview component
 * Supports both LightroomAsset and GDriveAsset types
 */

import { Project, LightroomAsset, GDriveAsset } from '../../types/project';
import { ComponentType, ReactNode } from 'react';

/**
 * Base asset interface that both LightroomAsset and GDriveAsset extend
 */
export interface BaseAsset {
  id: string;
  asset_name: string;
}

/**
 * Configuration for asset-specific behavior and rendering
 */
export interface AssetOverviewConfig<T extends BaseAsset> {
  /**
   * Key to access assets in Project type
   * e.g., 'lightroom_assets' or 'gdrive_assets'
   */
  assetKey: 'lightroom_assets' | 'gdrive_assets';
  
  /**
   * Prefix for localStorage keys
   * e.g., 'lightroom' or 'gdrive'
   */
  storagePrefix: string;
  
  /**
   * Function to get preview URL for an asset
   */
  getPreviewUrl: (asset: T) => string | null;
  
  /**
   * Function to get ALL preview URLs for an asset (for multiple previews support)
   * Returns array of preview URLs. Falls back to single preview if not provided.
   */
  getPreviewUrls?: (asset: T) => string[];
  
  /**
   * Function to get copyable link URL for an asset
   */
  getCopyableLink?: (asset: T) => string | null;
  
  /**
   * Function to generate asset count text
   */
  getAssetCount: (assets: T[]) => string;
  
  /**
   * Icon component to show for empty state
   */
  EmptyIcon: ComponentType<{ className?: string }>;
  
  /**
   * Handler for when an asset is clicked
   * Receives the project, asset index, preview index, and the default lightbox opener
   */
  onAssetClick: (
    project: Project,
    assetIndex: number,
    previewIndex: number,
    openLightbox: (project: Project, assetIndex: number, previewIndex: number) => void
  ) => void;
  
  /**
   * Optional: Whether to show type badges (e.g., folder/file icons)
   */
  hasTypeBadges?: boolean;
  
  /**
   * Optional: Render custom badge for an asset
   */
  renderAssetBadge?: (asset: T) => ReactNode;
  
  /**
   * Optional: Default preview URL (e.g., for folders without custom preview)
   */
  defaultPreviewUrl?: string;
}

/**
 * Props for the AssetOverview component
 */
export interface AssetOverviewProps<T extends BaseAsset> {
  projects: Project[];
  onNavigateToProject: (projectId: string) => void;
  onProjectDetail: (project: Project) => void;
  config: AssetOverviewConfig<T>;
  isPublicView?: boolean;
  searchQuery?: string;
  onViewImages?: (projectId: string) => void; // Optional: for "View Images" button
  headerActions?: ReactNode; // Optional: Custom action buttons in header (e.g., Add Asset button)
}

/**
 * State for the lightbox
 */
export interface LightboxState<T extends BaseAsset> {
  projectId: string;
  assetIndex: number;
  previewIndex: number; // Which preview within the asset (for multiple previews)
  assets: T[];
  projectName: string;
}

/**
 * Flattened preview item for grid display
 */
export interface FlattenedPreview<T extends BaseAsset> {
  project: Project;
  asset: T;
  assetIndex: number; // Index in project's assets array
  previewUrl: string;
  previewIndex: number; // Index of this preview (0 for single preview assets)
  totalPreviews: number; // Total number of previews for this asset
}

/**
 * Props for the AssetCard subcomponent
 */
export interface AssetCardProps<T extends BaseAsset> {
  project: Project;
  assets: T[];
  showPreview: boolean;
  mobileGridCols: 1 | 2;
  onNavigateToProject: (id: string) => void;
  onProjectDetail: (project: Project) => void;
  onThumbnailClick: (index: number) => void;
  config: AssetOverviewConfig<T>;
}
