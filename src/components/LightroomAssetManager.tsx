import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Plus, Trash2, ExternalLink, Image as ImageIcon, Pencil, Check, X } from 'lucide-react';
import { LightroomAsset, ActionableItem } from '../types/project';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';

interface LightroomAssetManagerProps {
  assets: LightroomAsset[];
  onChange: (assets: LightroomAsset[]) => void;
  actionableItems?: ActionableItem[]; // Assets to associate with lightroom files
  onClose?: () => void; // Optional callback to hide/close the section
}

export function LightroomAssetManager({ assets, onChange, actionableItems = [], onClose }: LightroomAssetManagerProps) {
  const [newAsset, setNewAsset] = useState({
    asset_name: '',
    lightroom_url: '',
    gdrive_url: '',
    asset_id: ''
  });
  
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<{
    asset_name: string;
    lightroom_url: string;
    gdrive_url: string;
    asset_id: string;
  } | null>(null);
  
  // Check if there are assets available
  const hasAssets = actionableItems.length > 0;
  
  // Helper function to get asset title by ID
  const getAssetTitle = (assetId?: string) => {
    if (!assetId) return null;
    const asset = actionableItems.find(a => a.id === assetId);
    return asset?.title || null;
  };

  const handleAddAsset = () => {
    if (!newAsset.asset_name.trim()) {
      toast.error('Asset name is required');
      return;
    }

    const asset: LightroomAsset = {
      id: `asset-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      asset_name: newAsset.asset_name.trim(),
      lightroom_url: newAsset.lightroom_url.trim() || undefined,
      gdrive_url: newAsset.gdrive_url.trim() || undefined,
      asset_id: newAsset.asset_id || undefined,
      created_at: new Date().toISOString()
    };

    const updatedAssets = [...assets, asset];
    onChange(updatedAssets);
    setNewAsset({
      asset_name: '',
      lightroom_url: '',
      gdrive_url: '',
      asset_id: ''
    });
    toast.success('Asset added successfully');
  };

  const handleRemoveAsset = (id: string) => {
    onChange(assets.filter(asset => asset.id !== id));
    toast.success('Asset removed');
  };

  const handleStartEdit = (asset: LightroomAsset) => {
    setEditingAssetId(asset.id);
    setEditingAsset({
      asset_name: asset.asset_name,
      lightroom_url: asset.lightroom_url || '',
      gdrive_url: asset.gdrive_url || '',
      asset_id: asset.asset_id || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingAssetId(null);
    setEditingAsset(null);
  };

  const handleSaveEdit = () => {
    if (!editingAssetId || !editingAsset) return;

    if (!editingAsset.asset_name.trim()) {
      toast.error('Asset name is required');
      return;
    }

    const updatedAssets = assets.map(asset => {
      if (asset.id === editingAssetId) {
        return {
          ...asset,
          asset_name: editingAsset.asset_name.trim(),
          lightroom_url: editingAsset.lightroom_url.trim() || undefined,
          gdrive_url: editingAsset.gdrive_url.trim() || undefined,
          asset_id: editingAsset.asset_id || undefined
        };
      }
      return asset;
    });

    onChange(updatedAssets);
    setEditingAssetId(null);
    setEditingAsset(null);
    toast.success('Asset updated successfully');
  };

  const isValidUrl = (url: string) => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Lightroom Assets</Label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {assets.length} {assets.length === 1 ? 'asset' : 'assets'}
          </span>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
              title="Hide section"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Existing Assets List */}
      {assets.length > 0 && (
        <div className="space-y-2">
          {assets.map((asset) => (
            <Card key={asset.id} className="border-2 border-border dark:border-border transition-colors">
              <CardContent className="p-4">
                {editingAssetId === asset.id && editingAsset ? (
                  // Edit Mode
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      {/* Thumbnail Preview */}
                      <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {editingAsset.lightroom_url && isValidUrl(editingAsset.lightroom_url) ? (
                          <img 
                            src={editingAsset.lightroom_url} 
                            alt={editingAsset.asset_name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : null}
                        {(!editingAsset.lightroom_url || !isValidUrl(editingAsset.lightroom_url)) && (
                          <ImageIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>

                      {/* Edit Form */}
                      <div className="flex-1 space-y-2">
                        <div>
                          <Label htmlFor={`edit-name-${asset.id}`} className="text-sm">
                            Asset Name <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id={`edit-name-${asset.id}`}
                            placeholder="e.g., Hero Illustration"
                            value={editingAsset.asset_name}
                            onChange={(e) => setEditingAsset({ ...editingAsset, asset_name: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEdit();
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor={`edit-lightroom-${asset.id}`} className="text-sm">
                            Lightroom Link <span className="text-muted-foreground">(Optional)</span>
                          </Label>
                          <Input
                            id={`edit-lightroom-${asset.id}`}
                            type="url"
                            placeholder="https://lightroom.company.com/..."
                            value={editingAsset.lightroom_url}
                            onChange={(e) => setEditingAsset({ ...editingAsset, lightroom_url: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEdit();
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                          />
                        </div>

                        <div>
                          <Label htmlFor={`edit-gdrive-${asset.id}`} className="text-sm">
                            Google Drive Link <span className="text-muted-foreground">(Optional)</span>
                          </Label>
                          <Input
                            id={`edit-gdrive-${asset.id}`}
                            type="url"
                            placeholder="https://drive.google.com/..."
                            value={editingAsset.gdrive_url}
                            onChange={(e) => setEditingAsset({ ...editingAsset, gdrive_url: e.target.value })}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSaveEdit();
                              } else if (e.key === 'Escape') {
                                handleCancelEdit();
                              }
                            }}
                          />
                        </div>

                        {/* Asset Selector - Only show if assets are available */}
                        {hasAssets && (
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <Label htmlFor={`edit-asset-${asset.id}`} className="text-sm">
                                Associated Asset <span className="text-muted-foreground">(Optional)</span>
                              </Label>
                              {editingAsset.asset_id && (
                                <button
                                  type="button"
                                  onClick={() => setEditingAsset({ ...editingAsset, asset_id: '' })}
                                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                            <Select
                              value={editingAsset.asset_id || undefined}
                              onValueChange={(value) => setEditingAsset({ ...editingAsset, asset_id: value })}
                            >
                              <SelectTrigger id={`edit-asset-${asset.id}`}>
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
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={handleSaveEdit}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-start gap-3">
                    {/* Thumbnail Preview from Lightroom */}
                    <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {asset.lightroom_url && isValidUrl(asset.lightroom_url) ? (
                        <img 
                          src={asset.lightroom_url} 
                          alt={asset.asset_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // If image fails to load, hide it and show icon
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : null}
                      {(!asset.lightroom_url || !isValidUrl(asset.lightroom_url)) && (
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>

                    {/* Asset Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{asset.asset_name}</p>
                      
                      {/* Show associated asset if available */}
                      {asset.asset_id && getAssetTitle(asset.asset_id) && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Asset: {getAssetTitle(asset.asset_id)}
                        </p>
                      )}
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {asset.lightroom_url && (
                          <a
                            href={asset.lightroom_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Lightroom
                          </a>
                        )}
                        {asset.gdrive_url && (
                          <a
                            href={asset.gdrive_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Google Drive
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStartEdit(asset)}
                        title="Edit asset"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveAsset(asset.id)}
                        title="Delete asset"
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add New Asset Form */}
      <Card className="border-dashed">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="asset_name" className="text-sm">
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

              <div className="space-y-1.5">
                <Label htmlFor="lightroom_url" className="text-sm">
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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gdrive_url" className="text-sm">
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

            {/* Asset Selector - Only show if assets are available */}
            {hasAssets && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="new_lightroom_asset" className="text-sm">
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
                  <SelectTrigger id="new_lightroom_asset">
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAsset}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Asset
            </Button>
          </div>
        </CardContent>
      </Card>

      {assets.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">
          No assets added yet. Add your first Lightroom asset above.
        </p>
      )}
    </div>
  );
}
