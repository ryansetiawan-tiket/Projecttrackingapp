import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ChevronRight, ChevronDown, Folder, Target, X, Users } from 'lucide-react';
import { FolderTreeItemProps } from './types';
import { AssignAssetPopover, AssetAssignmentBadge } from './AssignAssetPopover';
import { cn } from '../ui/utils';

export function FolderTreeItem({
  item,
  items,
  depth,
  actionableItems,
  onUpdate,
  onRemove,
  onToggleExpand,
  onBatchAssign
}: FolderTreeItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  
  const hasChildren = items.some(i => i.parentTempId === item.tempId);
  const childrenCount = items.filter(i => i.parentTempId === item.tempId).length;
  
  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdate(item.tempId, { name: editName.trim() });
      setIsEditing(false);
    }
  };
  
  const handleBatchAssign = () => {
    // Open a dialog or popover for batch assignment
    // For now, we'll use the same popover
  };
  
  return (
    <div className="group">
      <div 
        className={cn(
          "border rounded-lg p-3 mb-2 transition-colors",
          item.errors?.gdrive_link ? "border-red-500 bg-red-50 dark:bg-red-950/20" : "border-border hover:border-primary/50"
        )}
        style={{ marginLeft: `${depth * 24}px` }}
      >
        {/* Header row */}
        <div className="flex items-start gap-2 mb-2">
          {/* Expand/Collapse button */}
          {hasChildren && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => onToggleExpand(item.tempId)}
            >
              {item.expanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          )}
          
          {/* Folder icon */}
          <Folder className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          
          {/* Folder name */}
          <div className="flex-1 min-w-0">
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
                className="h-7"
                autoFocus
              />
            ) : (
              <p 
                className="truncate cursor-pointer hover:text-primary"
                onClick={() => setIsEditing(true)}
                title="Click to edit"
              >
                {item.name}
                {hasChildren && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ({childrenCount} item{childrenCount === 1 ? '' : 's'})
                  </span>
                )}
              </p>
            )}
          </div>
          
          {/* Action buttons */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Assign to asset */}
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
                  <Button variant="ghost" size="sm" className="h-7 px-2" title="Assign to asset">
                    <Target className="h-4 w-4" />
                  </Button>
                }
              />
            )}
            
            {/* Batch assign children */}
            {hasChildren && (
              <AssignAssetPopover
                actionableItems={actionableItems}
                selectedAssetId={undefined}
                onSelect={(assetId) => onBatchAssign(item.tempId, assetId)}
                trigger={
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 px-2" 
                    title="Assign all children to asset"
                  >
                    <Users className="h-4 w-4" />
                  </Button>
                }
              />
            )}
            
            {/* Remove */}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 hover:text-destructive"
              onClick={() => onRemove(item.tempId)}
              title="Remove folder"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Google Drive Link input */}
        <div className="space-y-1 ml-7">
          <Label className="text-xs">
            Google Drive Link <span className="text-destructive">*</span>
          </Label>
          <Input
            type="url"
            placeholder="https://drive.google.com/folders/..."
            value={item.gdrive_link}
            onChange={(e) => {
              const value = e.target.value;
              const errors = { ...item.errors };
              
              if (value.trim()) {
                delete errors.gdrive_link;
              } else {
                errors.gdrive_link = 'Required';
              }
              
              onUpdate(item.tempId, { 
                gdrive_link: value,
                errors: Object.keys(errors).length > 0 ? errors : undefined
              });
            }}
            className={cn(
              "h-8",
              item.errors?.gdrive_link && "border-red-500"
            )}
          />
          {item.errors?.gdrive_link && (
            <p className="text-xs text-red-500">{item.errors.gdrive_link}</p>
          )}
        </div>
      </div>
    </div>
  );
}
