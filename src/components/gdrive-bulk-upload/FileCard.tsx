import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent } from '../ui/card';
import { Image as ImageIcon, Target, X, Link as LinkIcon, Folder } from 'lucide-react';
import { FileCardProps } from './types';
import { AssignAssetPopover, AssetAssignmentBadge } from './AssignAssetPopover';

export function FileCard({
  item,
  existingFolders,
  actionableItems,
  onUpdate,
  onRemove
}: FileCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(item.name);
  
  const handleSaveName = () => {
    if (editName.trim()) {
      onUpdate(item.tempId, { name: editName.trim() });
      setIsEditingName(false);
    }
  };
  
  // Get parent folder name for display
  const parentFolder = existingFolders.find(f => f.tempId === item.parentTempId);
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Thumbnail */}
        <div className="w-full aspect-video rounded-md bg-muted flex items-center justify-center overflow-hidden">
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
            <ImageIcon className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        
        {/* File name */}
        <div>
          <Label className="text-xs">File Name</Label>
          {isEditingName ? (
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveName();
                if (e.key === 'Escape') {
                  setEditName(item.name);
                  setIsEditingName(false);
                }
              }}
              className="h-8 mt-1"
              autoFocus
            />
          ) : (
            <p 
              className="text-sm truncate cursor-pointer hover:text-primary mt-1 p-2 rounded hover:bg-muted"
              onClick={() => setIsEditingName(true)}
              title="Click to edit"
            >
              {item.name}
            </p>
          )}
        </div>
        
        {/* Parent folder selector */}
        {existingFolders.length > 0 && (
          <div>
            <Label className="text-xs flex items-center gap-1">
              <Folder className="h-3 w-3" />
              Parent Folder <span className="text-muted-foreground">(Optional)</span>
            </Label>
            <Select
              value={item.parentTempId || '__none__'}
              onValueChange={(value) => onUpdate(item.tempId, { parentTempId: value === '__none__' ? null : value })}
            >
              <SelectTrigger className="h-8 mt-1">
                <SelectValue placeholder="None (root level)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">None (root level)</SelectItem>
                {existingFolders.map(folder => (
                  <SelectItem key={folder.tempId} value={folder.tempId}>
                    {folder.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        
        {/* Google Drive link */}
        <div>
          <Label className="text-xs flex items-center gap-1">
            <LinkIcon className="h-3 w-3" />
            Google Drive Link <span className="text-muted-foreground">(Optional)</span>
          </Label>
          <Input
            type="url"
            placeholder={parentFolder ? "Inherit from parent folder" : "https://drive.google.com/file/..."}
            value={item.gdrive_link}
            onChange={(e) => onUpdate(item.tempId, { gdrive_link: e.target.value })}
            className="h-8 mt-1"
          />
          {parentFolder && !item.gdrive_link && (
            <p className="text-xs text-muted-foreground mt-1">
              Will inherit from: {parentFolder.name}
            </p>
          )}
        </div>
        
        {/* Asset assignment */}
        <div>
          <Label className="text-xs">Associated Asset</Label>
          <div className="mt-1">
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
                  <Button variant="outline" size="sm" className="w-full h-8">
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
          variant="outline"
          size="sm"
          className="w-full h-8 text-destructive hover:text-destructive"
          onClick={() => onRemove(item.tempId)}
        >
          <X className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </CardContent>
    </Card>
  );
}
