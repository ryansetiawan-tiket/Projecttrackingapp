import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from './ui/dialog';
import { Plus, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { LightroomAsset, ActionableItem, Project } from '../types/project';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Alert, AlertDescription } from './ui/alert';

interface AddLightroomAssetDialogProps {
  projects: Project[];
  onProjectUpdate?: (id: string, data: Partial<Project>) => void;
  prefilledProjectId?: string; // 🆕 Pre-fill project when opened from specific project
  open?: boolean; // 🆕 Controlled open state
  onOpenChange?: (open: boolean) => void; // 🆕 Controlled open state handler
}

interface AssetPair {
  name: string;
  link: string;
  index: number;
}

export function AddLightroomAssetDialog({ 
  projects, 
  onProjectUpdate,
  prefilledProjectId,
  open: controlledOpen,
  onOpenChange
}: AddLightroomAssetDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newAsset, setNewAsset] = useState({
    asset_name: '',
    lightroom_url: '',
    gdrive_url: '',
    asset_id: ''
  });
  
  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  // 🆕 Set prefilled project when dialog opens
  useEffect(() => {
    if (open && prefilledProjectId) {
      setSelectedProjectId(prefilledProjectId);
    }
  }, [open, prefilledProjectId]);

  // Get selected project
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // Get actionable items from selected project
  const actionableItems: ActionableItem[] = selectedProject?.actionable_items || [];
  const hasAssets = actionableItems.length > 0;

  // Sort projects alphabetically for easier selection
  const sortedProjects = [...projects].sort((a, b) => 
    a.project_name.localeCompare(b.project_name)
  );

  // 🆕 Parse multi-line inputs into pairs
  const parseAssetPairs = (): { pairs: AssetPair[], isValid: boolean, error?: string } => {
    const names = newAsset.asset_name.trim().split('\n').map(n => n.trim()).filter(n => n);
    const links = newAsset.lightroom_url.trim().split('\n').map(l => l.trim()).filter(l => l);
    
    // If no names, return empty
    if (names.length === 0) {
      return { pairs: [], isValid: false };
    }

    // If links are provided, they must match names count
    if (links.length > 0 && names.length !== links.length) {
      return { 
        pairs: [], 
        isValid: false, 
        error: `Mismatch: ${names.length} name(s) but ${links.length} link(s)` 
      };
    }

    const pairs: AssetPair[] = names.map((name, index) => ({
      name,
      link: links[index] || '',
      index: index + 1
    }));

    return { pairs, isValid: true };
  };

  const { pairs, isValid, error } = parseAssetPairs();
  const hasMultiple = pairs.length > 1;

  const handleReset = () => {
    setSelectedProjectId('');
    setNewAsset({
      asset_name: '',
      lightroom_url: '',
      gdrive_url: '',
      asset_id: ''
    });
  };

  const handleAddAsset = async () => {
    // Validation
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }

    if (!newAsset.asset_name.trim()) {
      toast.error('Asset name is required');
      return;
    }

    if (!isValid) {
      toast.error(error || 'Invalid input');
      return;
    }

    if (!selectedProject) {
      toast.error('Project not found');
      return;
    }

    // 🆕 Create multiple assets from pairs
    const newAssets: LightroomAsset[] = pairs.map((pair) => ({
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      asset_name: pair.name,
      lightroom_url: pair.link || undefined,
      gdrive_url: newAsset.gdrive_url.trim() || undefined,
      asset_id: newAsset.asset_id || undefined,
      created_at: new Date().toISOString()
    }));

    // Update project with new assets
    const updatedAssets = [...(selectedProject.lightroom_assets || []), ...newAssets];
    
    try {
      if (onProjectUpdate) {
        await onProjectUpdate(selectedProjectId, {
          lightroom_assets: updatedAssets
        });
      }
      
      const assetWord = newAssets.length === 1 ? 'asset' : 'assets';
      toast.success(`${newAssets.length} ${assetWord} added to ${selectedProject.project_name}`);
      handleReset();
      setOpen(false);
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error('Failed to add asset');
    }
  };

  // Truncate long URLs for preview
  const truncateUrl = (url: string, maxLength = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Show trigger button only if not using controlled state */}
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Lightroom Asset
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Lightroom Asset</DialogTitle>
          <DialogDescription>
            Add assets from Lightroom to your project. You can add multiple assets at once by separating them with new lines.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Selector - MANDATORY */}
          <div className="space-y-2">
            <Label htmlFor="project_selector">
              Select Project <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
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

          {/* Show form only if project is selected */}
          {selectedProjectId && (
            <>
              {/* Asset Name - Multi-line */}
              <div className="space-y-2">
                <Label htmlFor="asset_name">
                  Asset Name <span className="text-destructive">*</span>
                  <span className="text-muted-foreground ml-2 text-xs">(One per line)</span>
                </Label>
                <Textarea
                  id="asset_name"
                  placeholder="e.g., Hero Illustration&#10;Product Banner&#10;Icon Set"
                  value={newAsset.asset_name}
                  onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              {/* Lightroom URL - Multi-line */}
              <div className="space-y-2">
                <Label htmlFor="lightroom_url">
                  Lightroom Link <span className="text-muted-foreground">(Optional, one per line)</span>
                </Label>
                <Textarea
                  id="lightroom_url"
                  placeholder="https://lightroom.company.com/asset1&#10;https://lightroom.company.com/asset2&#10;https://lightroom.company.com/asset3"
                  value={newAsset.lightroom_url}
                  onChange={(e) => setNewAsset({ ...newAsset, lightroom_url: e.target.value })}
                  rows={4}
                  className="font-mono text-sm"
                />
              </div>

              {/* 🆕 Preview Table */}
              {pairs.length > 0 && (
                <div className="space-y-2">
                  <Label>Preview ({pairs.length} {pairs.length === 1 ? 'asset' : 'assets'})</Label>
                  
                  {/* Error Alert if mismatch */}
                  {!isValid && error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* Preview Table */}
                  <div className="border rounded-md max-h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2 w-8">#</th>
                          <th className="text-left p-2 w-16">Thumbnail</th>
                          <th className="text-left p-2">Asset Name</th>
                          <th className="text-left p-2">Lightroom Link</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pairs.map((pair) => (
                          <tr key={pair.index} className="border-t">
                            <td className="p-2 text-muted-foreground">{pair.index}</td>
                            <td className="p-2">
                              {pair.link ? (
                                <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center overflow-hidden">
                                  <img 
                                    src={pair.link} 
                                    alt={pair.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.style.display = 'none';
                                      const parent = e.currentTarget.parentElement;
                                      if (parent && !parent.querySelector('.fallback-icon')) {
                                        const icon = document.createElement('div');
                                        icon.className = 'fallback-icon text-muted-foreground';
                                        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                        parent.appendChild(icon);
                                      }
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className="w-12 h-12 rounded border bg-muted flex items-center justify-center">
                                  <ImageIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                            </td>
                            <td className="p-2 font-mono text-xs">{pair.name}</td>
                            <td className="p-2 font-mono text-xs text-muted-foreground">
                              {pair.link ? (
                                <a 
                                  href={pair.link} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="hover:text-foreground underline"
                                  title={pair.link}
                                >
                                  {truncateUrl(pair.link)}
                                </a>
                              ) : (
                                <span className="italic">No link</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Google Drive URL */}
              <div className="space-y-2">
                <Label htmlFor="gdrive_url">
                  Google Drive Link <span className="text-muted-foreground">(Optional, shared for all)</span>
                </Label>
                <Input
                  id="gdrive_url"
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={newAsset.gdrive_url}
                  onChange={(e) => setNewAsset({ ...newAsset, gdrive_url: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAsset();
                    }
                  }}
                />
              </div>

              {/* Associated Asset Selector - Only show if assets are available */}
              {hasAssets && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="associated_asset">
                      Associated Asset <span className="text-muted-foreground">(Optional, shared for all)</span>
                    </Label>
                    {newAsset.asset_id && (
                      <button
                        type="button"
                        onClick={() => setNewAsset({ ...newAsset, asset_id: '' })}
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <Select
                    value={newAsset.asset_id || undefined}
                    onValueChange={(value) => setNewAsset({ ...newAsset, asset_id: value })}
                  >
                    <SelectTrigger id="associated_asset">
                      <SelectValue placeholder="Select an asset (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {actionableItems.map((actionableAsset) => (
                        <SelectItem key={actionableAsset.id} value={actionableAsset.id}>
                          {actionableAsset.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => {
              handleReset();
              setOpen(false);
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleAddAsset}
            disabled={!selectedProjectId || !newAsset.asset_name.trim() || !isValid}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add {hasMultiple ? `${pairs.length} Assets` : 'Asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}