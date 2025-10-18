/**
 * GDriveOverview - Google Drive Assets Tab
 * 
 * Thin wrapper around AssetOverview with GDrive-specific configuration
 */

import { AssetOverview } from './AssetOverview';
import { AssetOverviewConfig } from './asset-overview/types';
import { Project, GDriveAsset } from '../types/project';
import { FileIcon, FolderIcon } from 'lucide-react';
import { Badge } from './ui/badge';
import { AddGDriveAssetDialog } from './AddGDriveAssetDialog';

const DEFAULT_FOLDER_PREVIEW = 
  'https://snymazdqexjovkdvepso.supabase.co/storage/v1/object/public/gdrive_previews/google_drive_folder_icon_for_windows_11_by_mr_celo_deoprbs.ico';

interface GDriveOverviewProps {
  projects: Project[];
  onNavigateToProject: (projectId: string) => void;
  onProjectDetail: (project: Project) => void;
  onProjectUpdate?: (id: string, data: Partial<Project>) => void;
  isPublicView?: boolean;
  searchQuery?: string;
  onViewImages?: (projectId: string) => void;
}

export function GDriveOverview({
  projects,
  onNavigateToProject,
  onProjectDetail,
  onProjectUpdate,
  isPublicView = false,
  searchQuery = '',
  onViewImages,
}: GDriveOverviewProps) {
  const config: AssetOverviewConfig<GDriveAsset> = {
    assetKey: 'gdrive_assets',
    storagePrefix: 'gdrive',
    
    getPreviewUrl: (asset) => {
      // Custom preview - filter out default folder icon
      if (asset.preview_url && asset.preview_url !== DEFAULT_FOLDER_PREVIEW) {
        return asset.preview_url;
      }
      if (asset.preview_urls && asset.preview_urls.length > 0) {
        const firstPreview = asset.preview_urls[0];
        // Backward compatibility: check if old format (string) or new format (object)
        const url = typeof firstPreview === 'string' ? firstPreview : firstPreview.url;
        // 🆕 Filter out default folder preview
        if (url === DEFAULT_FOLDER_PREVIEW) return null;
        return url;
      }
      // 🆕 Don't show default folder icon - return null
      return null;
    },
    
    getPreviewUrls: (asset) => {
      // Return all preview URLs for an asset
      if (asset.preview_urls && asset.preview_urls.length > 0) {
        // Backward compatibility: convert to string array
        const urls = asset.preview_urls.map(preview => 
          typeof preview === 'string' ? preview : preview.url
        );
        // 🆕 Filter out default folder preview icons from carousel
        return urls.filter(url => url !== DEFAULT_FOLDER_PREVIEW);
      }
      if (asset.preview_url && asset.preview_url !== DEFAULT_FOLDER_PREVIEW) {
        return [asset.preview_url];
      }
      // 🆕 Don't show default folder icon in carousel - return empty array
      return [];
    },
    
    getCopyableLink: (asset) => {
      return asset.gdrive_link || null;
    },
    
    getAssetCount: (assets) => {
      const fileCount = assets.filter(a => a.asset_type === 'file').length;
      const folderCount = assets.filter(a => a.asset_type === 'folder').length;
      
      if (fileCount > 0 && folderCount > 0) {
        return `${fileCount} file${fileCount === 1 ? '' : 's'} & ${folderCount} folder${folderCount === 1 ? '' : 's'}`;
      } else if (folderCount > 0) {
        return `${folderCount} folder${folderCount === 1 ? '' : 's'}`;
      } else {
        return `${fileCount} file${fileCount === 1 ? '' : 's'}`;
      }
    },
    
    EmptyIcon: FileIcon,
    
    onAssetClick: (project, assetIndex, previewIndex, openLightbox) => {
      const asset = project.gdrive_assets?.[assetIndex];
      
      // Smart behavior: folders without preview open directly
      if (asset?.asset_type === 'folder' && !asset.preview_url && (!asset.preview_urls || asset.preview_urls.length === 0)) {
        window.open(asset.gdrive_link, '_blank', 'noopener,noreferrer');
        return;
      }
      
      // Files and folders with preview open lightbox
      openLightbox(project, assetIndex, previewIndex);
    },
    
    hasTypeBadges: true,
    
    renderAssetBadge: (asset) => {
      return (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering lightbox
            if (asset.gdrive_link) {
              window.open(asset.gdrive_link, '_blank');
            }
          }}
          className="inline-flex"
        >
          <Badge 
            variant="secondary" 
            className="text-xs flex items-center gap-1 bg-background/90 backdrop-blur-sm cursor-pointer hover:bg-background transition-colors"
          >
            {asset.asset_type === 'folder' ? (
              <>
                <FolderIcon className="h-3 w-3" />
                Folder
              </>
            ) : (
              <>
                <FileIcon className="h-3 w-3" />
                File
              </>
            )}
          </Badge>
        </button>
      );
    },
    
    // 🆕 Don't set default folder preview - we filter it out anyway
    defaultPreviewUrl: undefined,
  };

  return (
    <AssetOverview
      projects={projects}
      onNavigateToProject={onNavigateToProject}
      onProjectDetail={onProjectDetail}
      config={config}
      isPublicView={isPublicView}
      searchQuery={searchQuery}
      onViewImages={onViewImages}
      headerActions={
        !isPublicView && onProjectUpdate ? (
          <AddGDriveAssetDialog 
            projects={projects} 
            onProjectUpdate={onProjectUpdate}
          />
        ) : undefined
      }
    />
  );
}
