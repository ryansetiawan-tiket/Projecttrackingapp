import { useMemo } from 'react';
import { Project } from '../../types/project';
import { Status } from '../../types/status';
import { StatsCard } from './StatsCard';
import { FolderOpen, Image, Package, Folder, File } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatsAssetsProps {
  projects: Project[];
  statuses: Status[];
}

interface AssetStats {
  totalAssets: number;
  gdriveAssets: number;
  lightroomAssets: number;
  gdriveFiles: number;
  gdriveFolders: number;
  lightroomFiles: number;
  lightroomFolders: number;
  projectsWithAssets: number;
  avgAssetsPerProject: number;
}

interface AssetStatusData {
  status: string;
  count: number;
  fill: string;
}

interface AssetTypeData {
  name: string;
  value: number;
  fill: string;
}

interface ProjectAssetData {
  projectName: string;
  assetCount: number;
  type: string;
}

export function StatsAssets({ projects, statuses }: StatsAssetsProps) {
  const assetStats = useMemo<AssetStats>(() => {
    let totalGDrive = 0;
    let totalLightroom = 0;
    let gdriveFiles = 0;
    let gdriveFolders = 0;
    let lightroomFiles = 0;
    let lightroomFolders = 0;
    let projectsWithAssets = 0;

    projects.forEach(project => {
      const gdriveAssets = project.gdrive_assets || [];
      const lightroomAssets = project.lightroom_assets || [];
      
      // Count GDrive assets
      gdriveAssets.forEach(asset => {
        if (asset.asset_type === 'folder') {
          gdriveFolders++;
        } else {
          gdriveFiles++;
        }
        totalGDrive++;
      });

      // Count Lightroom assets
      lightroomAssets.forEach(asset => {
        if (asset.asset_type === 'folder') {
          lightroomFolders++;
        } else {
          lightroomFiles++;
        }
        totalLightroom++;
      });

      // Count projects with assets
      if (gdriveAssets.length > 0 || lightroomAssets.length > 0) {
        projectsWithAssets++;
      }
    });

    const totalAssets = totalGDrive + totalLightroom;
    const avgAssetsPerProject = projectsWithAssets > 0 ? totalAssets / projectsWithAssets : 0;

    return {
      totalAssets,
      gdriveAssets: totalGDrive,
      lightroomAssets: totalLightroom,
      gdriveFiles,
      gdriveFolders,
      lightroomFiles,
      lightroomFolders,
      projectsWithAssets,
      avgAssetsPerProject
    };
  }, [projects]);

  // Assets by Platform (GDrive vs Lightroom)
  const assetsByPlatform = useMemo<AssetTypeData[]>(() => {
    return [
      {
        name: 'Google Drive',
        value: assetStats.gdriveAssets,
        fill: 'hsl(210, 70%, 50%)'
      },
      {
        name: 'Lightroom',
        value: assetStats.lightroomAssets,
        fill: 'hsl(230, 70%, 60%)'
      }
    ].filter(item => item.value > 0);
  }, [assetStats]);

  // Files vs Folders Distribution
  const filesVsFolders = useMemo<AssetTypeData[]>(() => {
    const totalFiles = assetStats.gdriveFiles + assetStats.lightroomFiles;
    const totalFolders = assetStats.gdriveFolders + assetStats.lightroomFolders;
    
    return [
      {
        name: 'Files',
        value: totalFiles,
        fill: 'hsl(150, 60%, 50%)'
      },
      {
        name: 'Folders',
        value: totalFolders,
        fill: 'hsl(45, 70%, 55%)'
      }
    ].filter(item => item.value > 0);
  }, [assetStats]);

  // Top Projects by Asset Count
  const topProjectsByAssets = useMemo<ProjectAssetData[]>(() => {
    return projects
      .map(project => {
        const gdriveCount = (project.gdrive_assets || []).length;
        const lightroomCount = (project.lightroom_assets || []).length;
        const totalCount = gdriveCount + lightroomCount;

        return {
          projectName: project.project_name,
          assetCount: totalCount,
          type: project.type || 'No Type'
        };
      })
      .filter(p => p.assetCount > 0)
      .sort((a, b) => b.assetCount - a.assetCount)
      .slice(0, 10);
  }, [projects]);

  // Assets by Project Type
  const assetsByProjectType = useMemo(() => {
    const typeMap = new Map<string, number>();

    projects.forEach(project => {
      const assetCount = (project.gdrive_assets || []).length + (project.lightroom_assets || []).length;
      if (assetCount > 0) {
        const type = project.type || 'No Type';
        typeMap.set(type, (typeMap.get(type) || 0) + assetCount);
      }
    });

    return Array.from(typeMap.entries())
      .map(([type, count]) => ({
        type,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [projects]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Assets"
          value={assetStats.totalAssets}
          icon={Package}
          subtitle="All deliverables"
        />
        
        <StatsCard
          title="Google Drive"
          value={assetStats.gdriveAssets}
          icon={FolderOpen}
          subtitle={`${assetStats.gdriveFiles} files, ${assetStats.gdriveFolders} folders`}
        />
        
        <StatsCard
          title="Lightroom"
          value={assetStats.lightroomAssets}
          icon={Image}
          subtitle={`${assetStats.lightroomFiles} files, ${assetStats.lightroomFolders} folders`}
        />
        
        <StatsCard
          title="Avg per Project"
          value={assetStats.avgAssetsPerProject.toFixed(1)}
          icon={Package}
          subtitle={`${assetStats.projectsWithAssets} projects with assets`}
        />
      </div>

      {/* Charts Row 1 - Platform and File Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Platform */}
        {assetsByPlatform.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="mb-4">Assets by Platform</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={assetsByPlatform}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {assetsByPlatform.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Files vs Folders */}
        {filesVsFolders.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <h3 className="mb-4">Files vs Folders</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={filesVsFolders}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {filesVsFolders.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Assets by Project Type */}
      {assetsByProjectType.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="mb-4">Assets by Project Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={assetsByProjectType}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" name="Asset Count" fill="hsl(210, 70%, 50%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Top Projects by Asset Count */}
      {topProjectsByAssets.length > 0 && (
        <div className="bg-card rounded-lg border p-6">
          <h3 className="mb-4">Top Projects by Asset Count</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProjectsByAssets} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="projectName" type="category" width={150} />
              <Tooltip />
              <Legend />
              <Bar dataKey="assetCount" name="Assets" fill="hsl(210, 70%, 50%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Empty State */}
      {assetStats.totalAssets === 0 && (
        <div className="text-center text-muted-foreground py-12 bg-card rounded-lg border">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No assets found in projects</p>
          <p className="text-sm mt-2">Start adding GDrive or Lightroom assets to see statistics</p>
        </div>
      )}
    </div>
  );
}
