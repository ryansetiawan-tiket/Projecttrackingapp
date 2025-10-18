import { FileCardsEditorProps, UploadItem } from './types';
import { FileCard } from './FileCard';

export function FileCardsEditor({
  items,
  existingFolders,
  actionableItems,
  onChange
}: FileCardsEditorProps) {
  const handleUpdate = (tempId: string, updates: Partial<UploadItem>) => {
    onChange(items.map(item => 
      item.tempId === tempId 
        ? { ...item, ...updates }
        : item
    ));
  };
  
  const handleRemove = (tempId: string) => {
    onChange(items.filter(item => item.tempId !== tempId));
  };
  
  return (
    <div className="space-y-4">
      {/* Header with count */}
      <div className="text-sm text-muted-foreground">
        {items.length} file{items.length === 1 ? '' : 's'} ready to upload
      </div>
      
      {/* Grid of file cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[500px] overflow-y-auto">
        {items.map(item => (
          <FileCard
            key={item.tempId}
            item={item}
            existingFolders={existingFolders}
            actionableItems={actionableItems}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}
