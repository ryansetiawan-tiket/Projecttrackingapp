/**
 * LightroomOverview - Lightroom Assets Tab
 * 
 * Thin wrapper around AssetOverview with Lightroom-specific configuration
 */

import { AssetOverview } from './AssetOverview';
import { AssetOverviewConfig } from './asset-overview/types';
import { Project, LightroomAsset } from '../types/project';
import { Image as ImageIcon } from 'lucide-react';
import { AddLightroomAssetDialog } from './AddLightroomAssetDialog';

interface LightroomOverviewProps {
  projects: Project[];
  onNavigateToProject: (projectId: string) => void;
  onProjectDetail: (project: Project) => void;
  onProjectUpdate?: (id: string, data: Partial<Project>) => void;
  isPublicView?: boolean;
  searchQuery?: string;
}

export function LightroomOverview({
  projects,
  onNavigateToProject,
  onProjectDetail,
  onProjectUpdate,
  isPublicView = false,
  searchQuery = '',
}: LightroomOverviewProps) {
  const config: AssetOverviewConfig<LightroomAsset> = {
    assetKey: 'lightroom_assets',
    storagePrefix: 'lightroom',
    
    getPreviewUrl: (asset) => {
      return asset.lightroom_url || asset.gdrive_url || null;
    },
    
    getPreviewUrls: (asset) => {
      // Lightroom assets typically have single preview
      const url = asset.lightroom_url || asset.gdrive_url;
      return url ? [url] : [];
    },
    
    getCopyableLink: (asset) => {
      return asset.lightroom_url || null;
    },
    
    getAssetCount: (assets) => {
      return `${assets.length} asset${assets.length === 1 ? '' : 's'}`;
    },
    
    EmptyIcon: ImageIcon,
    
    onAssetClick: (project, assetIndex, previewIndex, openLightbox) => {
      // Always open lightbox for Lightroom assets
      openLightbox(project, assetIndex, previewIndex);
    },
  };

  return (
    <AssetOverview
      projects={projects}
      onNavigateToProject={onNavigateToProject}
      onProjectDetail={onProjectDetail}
      config={config}
      isPublicView={isPublicView}
      searchQuery={searchQuery}
      headerActions={
        !isPublicView && onProjectUpdate ? (
          <AddLightroomAssetDialog 
            projects={projects} 
            onProjectUpdate={onProjectUpdate}
          />
        ) : undefined
      }
    />
  );
}
