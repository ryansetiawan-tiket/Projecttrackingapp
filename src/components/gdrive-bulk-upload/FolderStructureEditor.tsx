import { Button } from '../ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { FolderStructureEditorProps, UploadItem } from './types';
import { FolderTreeItem } from './FolderTreeItem';
import { FileTreeItem } from './FileTreeItem';

export function FolderStructureEditor({
  items,
  actionableItems,
  onChange
}: FolderStructureEditorProps) {
  // Get root items (no parent)
  const rootItems = items.filter(item => item.parentTempId === null);
  
  const handleUpdate = (tempId: string, updates: Partial<UploadItem>) => {
    onChange(items.map(item => 
      item.tempId === tempId 
        ? { ...item, ...updates }
        : item
    ));
  };
  
  const handleRemove = (tempId: string) => {
    // Remove item and all its children recursively
    const toRemove = new Set<string>();
    
    const collectChildren = (id: string) => {
      toRemove.add(id);
      items.forEach(item => {
        if (item.parentTempId === id) {
          collectChildren(item.tempId);
        }
      });
    };
    
    collectChildren(tempId);
    onChange(items.filter(item => !toRemove.has(item.tempId)));
  };
  
  const handleToggleExpand = (tempId: string) => {
    handleUpdate(tempId, { 
      expanded: !items.find(i => i.tempId === tempId)?.expanded 
    });
  };
  
  const handleBatchAssign = (folderTempId: string, assetId: string | undefined) => {
    // Get all children (files and folders) recursively
    const childrenIds = new Set<string>();
    
    const collectChildren = (parentId: string) => {
      items.forEach(item => {
        if (item.parentTempId === parentId) {
          childrenIds.add(item.tempId);
          collectChildren(item.tempId); // Recursive
        }
      });
    };
    
    collectChildren(folderTempId);
    
    // Update all children
    onChange(items.map(item => 
      childrenIds.has(item.tempId)
        ? { ...item, asset_id: assetId }
        : item
    ));
  };
  
  const expandAll = () => {
    onChange(items.map(item => 
      item.type === 'folder' 
        ? { ...item, expanded: true }
        : item
    ));
  };
  
  const collapseAll = () => {
    onChange(items.map(item => 
      item.type === 'folder' 
        ? { ...item, expanded: false }
        : item
    ));
  };
  
  // Count stats
  const folderCount = items.filter(i => i.type === 'folder').length;
  const fileCount = items.filter(i => i.type === 'file').length;
  const errorCount = items.filter(i => i.errors && Object.keys(i.errors).length > 0).length;
  
  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Detected: {folderCount} folder{folderCount === 1 ? '' : 's'}, {fileCount} file{fileCount === 1 ? '' : 's'}
          {errorCount > 0 && (
            <span className="text-red-500 ml-2">
              • {errorCount} validation error{errorCount === 1 ? '' : 's'}
            </span>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            <ChevronDown className="h-4 w-4 mr-1" />
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            <ChevronRight className="h-4 w-4 mr-1" />
            Collapse All
          </Button>
        </div>
      </div>
      
      {/* Tree view */}
      <div className="max-h-[500px] overflow-y-auto border rounded-lg p-4 space-y-2">
        {rootItems.map(item => (
          <TreeNode
            key={item.tempId}
            item={item}
            items={items}
            depth={0}
            actionableItems={actionableItems}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
            onToggleExpand={handleToggleExpand}
            onBatchAssign={handleBatchAssign}
          />
        ))}
      </div>
    </div>
  );
}

// Recursive tree node component
function TreeNode({
  item,
  items,
  depth,
  actionableItems,
  onUpdate,
  onRemove,
  onToggleExpand,
  onBatchAssign
}: {
  item: UploadItem;
  items: UploadItem[];
  depth: number;
  actionableItems: any[];
  onUpdate: (tempId: string, updates: Partial<UploadItem>) => void;
  onRemove: (tempId: string) => void;
  onToggleExpand: (tempId: string) => void;
  onBatchAssign: (folderTempId: string, assetId: string | undefined) => void;
}) {
  const children = items.filter(i => i.parentTempId === item.tempId);
  const hasChildren = children.length > 0;
  
  return (
    <div>
      {/* Current item */}
      {item.type === 'folder' ? (
        <FolderTreeItem
          item={item}
          items={items}
          depth={depth}
          actionableItems={actionableItems}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onToggleExpand={onToggleExpand}
          onBatchAssign={onBatchAssign}
        />
      ) : (
        <FileTreeItem
          item={item}
          depth={depth}
          actionableItems={actionableItems}
          onUpdate={onUpdate}
          onRemove={onRemove}
        />
      )}
      
      {/* Children (if expanded) */}
      {item.expanded && hasChildren && (
        <div>
          {children.map(child => (
            <TreeNode
              key={child.tempId}
              item={child}
              items={items}
              depth={depth + 1}
              actionableItems={actionableItems}
              onUpdate={onUpdate}
              onRemove={onRemove}
              onToggleExpand={onToggleExpand}
              onBatchAssign={onBatchAssign}
            />
          ))}
        </div>
      )}
    </div>
  );
}
