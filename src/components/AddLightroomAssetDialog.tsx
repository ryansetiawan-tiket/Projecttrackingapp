import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Plus, Image as ImageIcon } from 'lucide-react';
import { LightroomAsset, ActionableItem, Project } from '../types/project';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface AddLightroomAssetDialogProps {
  projects: Project[];
  onProjectUpdate?: (id: string, data: Partial<Project>) => void;
  prefilledProjectId?: string; // 🆕 Pre-fill project when opened from specific project
  open?: boolean; // 🆕 Controlled open state
  onOpenChange?: (open: boolean) => void; // 🆕 Controlled open state handler
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

    if (!selectedProject) {
      toast.error('Project not found');
      return;
    }

    // Create new asset
    const asset: LightroomAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      asset_name: newAsset.asset_name.trim(),
      lightroom_url: newAsset.lightroom_url.trim() || undefined,
      gdrive_url: newAsset.gdrive_url.trim() || undefined,
      asset_id: newAsset.asset_id || undefined,
      created_at: new Date().toISOString()
    };

    // Update project with new asset
    const updatedAssets = [...(selectedProject.lightroom_assets || []), asset];
    
    try {
      if (onProjectUpdate) {
        await onProjectUpdate(selectedProjectId, {
          lightroom_assets: updatedAssets
        });
      }
      
      toast.success(`Asset added to ${selectedProject.project_name}`);
      handleReset();
      setOpen(false);
    } catch (error) {
      console.error('Error adding asset:', error);
      toast.error('Failed to add asset');
    }
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
              {/* Asset Name */}
              <div className="space-y-2">
                <Label htmlFor="asset_name">
                  Asset Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="asset_name"
                  placeholder="e.g., Hero Illustration"
                  value={newAsset.asset_name}
                  onChange={(e) => setNewAsset({ ...newAsset, asset_name: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAsset();
                    }
                  }}
                />
              </div>

              {/* Lightroom URL */}
              <div className="space-y-2">
                <Label htmlFor="lightroom_url">
                  Lightroom Link <span className="text-muted-foreground">(Optional)</span>
                </Label>
                <Input
                  id="lightroom_url"
                  type="url"
                  placeholder="https://lightroom.company.com/..."
                  value={newAsset.lightroom_url}
                  onChange={(e) => setNewAsset({ ...newAsset, lightroom_url: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddAsset();
                    }
                  }}
                />
              </div>

              {/* Google Drive URL */}
              <div className="space-y-2">
                <Label htmlFor="gdrive_url">
                  Google Drive Link <span className="text-muted-foreground">(Optional)</span>
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
                      Associated Asset <span className="text-muted-foreground">(Optional)</span>
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

              {/* Preview if URL is provided */}
              {newAsset.lightroom_url && (
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="w-full h-48 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                    <img 
                      src={newAsset.lightroom_url} 
                      alt="Preview"
                      className="max-w-full max-h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    {!newAsset.lightroom_url && (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
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
            disabled={!selectedProjectId || !newAsset.asset_name.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Asset
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
