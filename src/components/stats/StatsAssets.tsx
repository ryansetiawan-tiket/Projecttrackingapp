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

        // Get first type for display purposes
        let displayType = 'No Type';
        if (project.types && Array.isArray(project.types) && project.types.length > 0) {
          displayType = project.types[0];
        } else if (project.type) {
          displayType = project.type;
        }

        return {
          projectName: project.project_name,
          assetCount: totalCount,
          type: displayType
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
        // Handle both new format (types array) and old format (single type)
        if (project.types && Array.isArray(project.types) && project.types.length > 0) {
          // New format: distribute asset count across all types
          project.types.forEach(type => {
            const typeName = type || 'No Type';
            typeMap.set(typeName, (typeMap.get(typeName) || 0) + assetCount);
          });
        } else {
          // Old format: single type (backward compatibility)
          const type = project.type || 'No Type';
          typeMap.set(type, (typeMap.get(type) || 0) + assetCount);
        }
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

  // Fun subtitles based on data
  const getTotalAssetsSubtitle = () => {
    const count = assetStats.totalAssets;
    if (count === 0) return "time to start collecting!";
    if (count === 1) return "one is better than zero! 🎉";
    if (count < 5) return "just getting started 🌱";
    if (count < 10) return "baby steps to greatness!";
    if (count < 25) return "building up nicely 📈";
    if (count < 50) return "nice little collection!";
    if (count < 100) return "that's a lot of files to keep track of 👀";
    if (count < 200) return "impressive file hoard! 📚";
    if (count < 500) return "you're basically a digital librarian now 📖";
    return "asset empire unlocked! 🏰";
  };

  const getGDriveSubtitle = () => {
    const count = assetStats.gdriveAssets;
    if (count === 0) return "no GDrive assets yet";
    if (count === 1) return "one lonely file 🥺";
    const ratio = assetStats.totalAssets > 0 ? count / assetStats.totalAssets : 0;
    if (ratio > 0.9) return "basically 100% GDrive at this point ⭐";
    if (ratio > 0.8) return "clearly the favorite child ⭐";
    if (ratio > 0.6) return "the main hub 📂";
    if (ratio > 0.4) return "solid GDrive game 💪";
    if (count < 5) return "room to grow! 🌱";
    return `${assetStats.gdriveFiles} files, ${assetStats.gdriveFolders} folders`;
  };

  const getLightroomSubtitle = () => {
    const count = assetStats.lightroomAssets;
    if (count === 0) return "no Lightroom assets yet";
    if (count === 1) return "one precious photo! 📸";
    const ratio = assetStats.totalAssets > 0 ? count / assetStats.totalAssets : 0;
    if (ratio > 0.8) return "Lightroom enthusiast spotted! 📸";
    if (ratio > 0.5) return "photo powerhouse! 📸";
    if (ratio < 0.1) return "the underdog! 🐶";
    if (ratio < 0.2) return "still trying to catch up! 🏃";
    if (count < 5) return "just warming up 🔥";
    return `${assetStats.lightroomFiles} files, ${assetStats.lightroomFolders} folders`;
  };

  const getAvgSubtitle = () => {
    const avg = assetStats.avgAssetsPerProject;
    if (avg === 0) return "no projects with assets yet";
    if (avg < 2) return "super minimal vibes ✨";
    if (avg < 5) return "keeping it minimal ✨";
    if (avg < 8) return "nice and balanced 👌";
    if (avg < 10) return "healthy amount per project!";
    if (avg < 15) return "solid collection rate 📦";
    if (avg < 20) return "pretty solid hoarding rate 📦";
    if (avg < 30) return "asset collector extraordinaire! 🎯";
    return "you might have a hoarding problem... kidding! 😅";
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Assets"
          value={assetStats.totalAssets}
          icon={Package}
          subtitle={getTotalAssetsSubtitle()}
        />
        
        <StatsCard
          title="Google Drive"
          value={assetStats.gdriveAssets}
          icon={FolderOpen}
          subtitle={getGDriveSubtitle()}
        />
        
        <StatsCard
          title="Lightroom"
          value={assetStats.lightroomAssets}
          icon={Image}
          subtitle={getLightroomSubtitle()}
        />
        
        <StatsCard
          title="Avg per Project"
          value={assetStats.avgAssetsPerProject.toFixed(1)}
          icon={Package}
          subtitle={getAvgSubtitle()}
        />
      </div>

      {/* Charts Row 1 - Platform and File Type Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Platform */}
        {assetsByPlatform.length > 0 && (
          <div className="bg-card rounded-lg border p-6">
            <div className="mb-4">
              <h3 className="mb-1">📍 Where Your Files Actually Live</h3>
              <p className="text-sm text-muted-foreground">
                {assetStats.gdriveAssets > assetStats.lightroomAssets 
                  ? "GDrive's winning the storage wars"
                  : assetStats.lightroomAssets > assetStats.gdriveAssets
                  ? "Lightroom's got the crown!"
                  : "Perfectly balanced, as all things should be"}
              </p>
            </div>
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
            <div className="mb-4">
              <h3 className="mb-1">🗂️ Chaos vs Organization</h3>
              <p className="text-sm text-muted-foreground">
                {(() => {
                  const totalFiles = assetStats.gdriveFiles + assetStats.lightroomFiles;
                  const totalFolders = assetStats.gdriveFolders + assetStats.lightroomFolders;
                  const ratio = totalFolders > 0 ? totalFiles / totalFolders : 0;
                  if (ratio > 10) return "Lots of files, minimal folders—bold strategy!";
                  if (ratio > 5) return "Good folder-to-file ratio, you're organized!";
                  if (ratio < 2) return "Folder enthusiast detected 📁";
                  return "Nice balance between structure and content";
                })()}
              </p>
            </div>
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
          <div className="mb-4">
            <h3 className="mb-1">🎨 What You Make the Most</h3>
            <p className="text-sm text-muted-foreground">
              {(() => {
                const topType = assetsByProjectType[0];
                const totalTypeAssets = assetsByProjectType.reduce((sum, t) => sum + t.count, 0);
                const topPercent = (topType.count / totalTypeAssets * 100).toFixed(0);
                if (assetsByProjectType.length === 1) {
                  return `All-in on ${topType.type}—focus is key! 🎯`;
                }
                return `${topType.type} dominates with ${topPercent}% of your assets`;
              })()}
            </p>
          </div>
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
          <div className="mb-4">
            <h3 className="mb-1">🏆 The Most File-Hungry Projects</h3>
            <p className="text-sm text-muted-foreground">
              {(() => {
                const topProject = topProjectsByAssets[0];
                const secondProject = topProjectsByAssets[1];
                if (!secondProject) {
                  return `${topProject.projectName} stands alone with ${topProject.assetCount} assets`;
                }
                const gap = topProject.assetCount - secondProject.assetCount;
                if (gap > 20) {
                  return `${topProject.projectName} absolutely crushing it with ${topProject.assetCount} assets!`;
                }
                return `${topProject.projectName} leads the pack with ${topProject.assetCount} assets`;
              })()}
            </p>
          </div>
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
          <p className="mb-2">No assets found yet! 📦</p>
          <p className="text-sm">
            Start adding GDrive or Lightroom assets to your projects
          </p>
          <p className="text-sm mt-1 text-muted-foreground/70">
            (Pro tip: Assets make everything better ✨)
          </p>
        </div>
      )}
    </div>
  );
}
