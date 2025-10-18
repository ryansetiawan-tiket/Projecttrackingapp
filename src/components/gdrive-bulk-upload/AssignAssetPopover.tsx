import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Target, X } from 'lucide-react';
import { AssignAssetPopoverProps } from './types';

export function AssignAssetPopover({
  actionableItems,
  selectedAssetId,
  onSelect,
  trigger
}: AssignAssetPopoverProps) {
  const [open, setOpen] = useState(false);
  const selectedAsset = actionableItems.find(a => a.id === selectedAssetId);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger}
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-3">
          <Label>Associate with Asset</Label>
          <Select 
            value={selectedAssetId || '__none__'} 
            onValueChange={(value) => {
              onSelect(value === '__none__' ? undefined : value);
              setOpen(false);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select asset (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">None</SelectItem>
              {actionableItems.map(asset => (
                <SelectItem key={asset.id} value={asset.id}>
                  {asset.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedAssetId && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                onSelect(undefined);
                setOpen(false);
              }}
            >
              Clear Assignment
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Reusable component for showing asset assignment status
export function AssetAssignmentBadge({
  assetId,
  actionableItems,
  onRemove
}: {
  assetId?: string;
  actionableItems: any[];
  onRemove: () => void;
}) {
  if (!assetId) return null;
  
  const asset = actionableItems.find(a => a.id === assetId);
  if (!asset) return null;
  
  return (
    <Badge variant="secondary" className="gap-1">
      <Target className="h-3 w-3" />
      {asset.title}
      <X 
        className="h-3 w-3 cursor-pointer hover:text-destructive" 
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      />
    </Badge>
  );
}
