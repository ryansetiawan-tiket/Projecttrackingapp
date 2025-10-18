import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Image as ImageIcon, Target, X, Link as LinkIcon } from 'lucide-react';
import { FileTreeItemProps } from './types';
import { AssignAssetPopover, AssetAssignmentBadge } from './AssignAssetPopover';
import { cn } from '../ui/utils';

export function FileTreeItem({
  item,
  depth,
  actionableItems,
  onUpdate,
  onRemove
}: FileTreeItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  
  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdate(item.tempId, { name: editName.trim() });
      setIsEditing(false);
    }
  };
  
  return (
    <div 
      className="border rounded-lg p-3 mb-2 hover:border-primary/50 transition-colors"
      style={{ marginLeft: `${depth * 24}px` }}
    >
      <div className="flex items-start gap-3">
        {/* Thumbnail preview */}
        <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.previewUrl ? (
            <img 
              src={item.previewUrl} 
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        
        {/* File info */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* File name */}
          <div>
            <Label className="text-xs">File Name</Label>
            {isEditing ? (
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') {
                    setEditName(item.name);
                    setIsEditing(false);
                  }
                }}
                className="h-7 mt-1"
                autoFocus
              />
            ) : (
              <p 
                className="text-sm truncate cursor-pointer hover:text-primary mt-1"
                onClick={() => setIsEditing(true)}
                title="Click to edit"
              >
                {item.name}
              </p>
            )}
          </div>
          
          {/* Google Drive Link (optional) */}
          <div>
            <Label className="text-xs flex items-center gap-1">
              <LinkIcon className="h-3 w-3" />
              Google Drive Link <span className="text-muted-foreground">(Optional - inherit from parent)</span>
            </Label>
            <Input
              type="url"
              placeholder="https://drive.google.com/file/..."
              value={item.gdrive_link}
              onChange={(e) => onUpdate(item.tempId, { gdrive_link: e.target.value })}
              className="h-7 mt-1"
            />
          </div>
          
          {/* Asset assignment */}
          <div className="flex items-center gap-2">
            {item.asset_id ? (
              <AssetAssignmentBadge
                assetId={item.asset_id}
                actionableItems={actionableItems}
                onRemove={() => onUpdate(item.tempId, { asset_id: undefined })}
              />
            ) : (
              <AssignAssetPopover
                actionableItems={actionableItems}
                selectedAssetId={item.asset_id}
                onSelect={(assetId) => onUpdate(item.tempId, { asset_id: assetId })}
                trigger={
                  <Button variant="outline" size="sm" className="h-7">
                    <Target className="h-3 w-3 mr-1" />
                    Assign to Asset
                  </Button>
                }
              />
            )}
          </div>
        </div>
        
        {/* Remove button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 hover:text-destructive flex-shrink-0"
          onClick={() => onRemove(item.tempId)}
          title="Remove file"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
