import { useState } from 'react';
import { Status } from '../types/status';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card } from './ui/card';
import { Switch } from './ui/switch';
import { SimpleColorPicker } from './SimpleColorPicker';
import { Trash2, Plus, GripVertical } from 'lucide-react';
import { getContrastColor } from '../utils/colorUtils';
import { toast } from 'sonner@2.0.3';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface StatusManagerProps {
  statuses: Status[];
  onUpdate: (id: string, updates: Partial<Status>) => Promise<void>;
  onCreate: (data: Omit<Status, 'id' | 'order'>) => Promise<Status>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (statuses: Status[]) => Promise<void>;
}

export function StatusManager({
  statuses,
  onUpdate,
  onCreate,
  onDelete,
  onReorder,
}: StatusManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editTextColor, setEditTextColor] = useState('');
  const [editUseAutoContrast, setEditUseAutoContrast] = useState(true);
  const [editDisplayIn, setEditDisplayIn] = useState<'table' | 'archive'>('table');
  const [editIsManual, setEditIsManual] = useState(false);
  const [editAutoTrigger, setEditAutoTrigger] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#3B82F6');
  const [newTextColor, setNewTextColor] = useState('#FFFFFF');
  const [newUseAutoContrast, setNewUseAutoContrast] = useState(true);
  const [newDisplayIn, setNewDisplayIn] = useState<'table' | 'archive'>('table');
  const [newIsManual, setNewIsManual] = useState(false);
  const [newAutoTrigger, setNewAutoTrigger] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const sortedStatuses = [...statuses].sort((a, b) => a.order - b.order);

  const handleEdit = (status: Status) => {
    setEditingId(status.id);
    setEditName(status.name);
    setEditColor(status.color);
    setEditTextColor(status.textColor || '#FFFFFF');
    setEditUseAutoContrast(status.useAutoContrast ?? true);
    setEditDisplayIn(status.displayIn);
    setEditIsManual(status.is_manual ?? false);
    setEditAutoTrigger(status.auto_trigger_from_action ?? false);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) {
      toast.error('Status name is required');
      return;
    }

    try {
      await onUpdate(editingId, {
        name: editName.trim(),
        color: editColor,
        textColor: editUseAutoContrast ? undefined : editTextColor,
        useAutoContrast: editUseAutoContrast,
        displayIn: editDisplayIn,
        is_manual: editIsManual,
        auto_trigger_from_action: editAutoTrigger,
      });
      setEditingId(null);
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditColor('');
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      toast.error('Status name is required');
      return;
    }

    try {
      await onCreate({
        name: newName.trim(),
        color: newColor,
        textColor: newUseAutoContrast ? undefined : newTextColor,
        useAutoContrast: newUseAutoContrast,
        displayIn: newDisplayIn,
        is_manual: newIsManual,
        auto_trigger_from_action: newAutoTrigger,
      });
      setIsCreating(false);
      setNewName('');
      setNewColor('#3B82F6');
      setNewTextColor('#FFFFFF');
      setNewUseAutoContrast(true);
      setNewDisplayIn('table');
      setNewIsManual(false);
      setNewAutoTrigger(false);
      toast.success('Status created successfully');
    } catch (error) {
      toast.error('Failed to create status');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDelete(id);
      setDeleteConfirm(null);
      toast.success('Status deleted successfully');
    } catch (error) {
      toast.error('Failed to delete status');
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
    
    if (dragIndex === dropIndex) return;

    const newStatuses = [...sortedStatuses];
    const [draggedItem] = newStatuses.splice(dragIndex, 1);
    newStatuses.splice(dropIndex, 0, draggedItem);

    try {
      await onReorder(newStatuses);
      toast.success('Status order updated');
    } catch (error) {
      toast.error('Failed to reorder statuses');
    }
  };

  // Fix missing is_manual fields (diagnostic tool)
  const fixMissingManualFields = async () => {
    try {
      const statusesToFix = statuses.filter(s => s.is_manual === undefined);
      
      if (statusesToFix.length === 0) {
        toast.success('All statuses have is_manual field!');
        console.log('[StatusManager] All statuses OK:', statuses.map(s => ({ name: s.name, is_manual: s.is_manual })));
        return;
      }
      
      console.log(`[StatusManager] Fixing ${statusesToFix.length} statuses...`);
      
      const commonManualNames = ['done', 'canceled', 'cancelled', 'on hold', 'hold', 'review', 'on review', 'in review', 'babysit', 'lightroom', 'light room', 'lr', 'on list lightroom', 'in queue lightroom', 'queue lightroom', 'lightroom queue', 'lr queue'];
      
      for (const status of statusesToFix) {
        const isManual = commonManualNames.includes(status.name.toLowerCase().trim());
        console.log(`[StatusManager] Setting is_manual=${isManual} for "${status.name}"`);
        await onUpdate(status.id, { is_manual: isManual });
      }
      
      toast.success(`Fixed ${statusesToFix.length} status(es)!`);
    } catch (error) {
      console.error('Failed to fix statuses:', error);
      toast.error('Failed to fix statuses');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Status Management</h3>
          <p className="text-sm text-muted-foreground">
            Manage project statuses, colors, and where they appear
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={fixMissingManualFields}
            size="sm"
            variant="outline"
          >
            🔧 Fix Missing Fields
          </Button>
          <Button
            onClick={() => setIsCreating(true)}
            size="sm"
            disabled={isCreating}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Status
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {/* Create new status */}
        {isCreating && (
          <Card className="p-4 bg-muted/50">
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="new-status-name">Status Name</Label>
                  <Input
                    id="new-status-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g., In Review"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="new-status-display">Display In</Label>
                  <Select value={newDisplayIn} onValueChange={(v) => setNewDisplayIn(v as 'table' | 'archive')}>
                    <SelectTrigger id="new-status-display" className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="table">Table View</SelectItem>
                      <SelectItem value="archive">Archive View</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <Label>Badge Background Color</Label>
                  <div className="mt-2">
                    <SimpleColorPicker
                      color={newColor}
                      onChange={setNewColor}
                      trigger={
                        <Button type="button" variant="outline" className="w-full justify-start gap-2">
                          <div
                            className="w-5 h-5 rounded border"
                            style={{ backgroundColor: newColor }}
                          />
                          <span>Choose Background</span>
                        </Button>
                      }
                    />
                  </div>
                </div>
                
                {/* Text Color Controls */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Label Text Color</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Auto Contrast</span>
                      <Switch
                        checked={newUseAutoContrast}
                        onCheckedChange={setNewUseAutoContrast}
                      />
                    </div>
                  </div>
                  {!newUseAutoContrast && (
                    <div className="mt-2">
                      <SimpleColorPicker
                        color={newTextColor}
                        onChange={setNewTextColor}
                        trigger={
                          <Button type="button" variant="outline" className="w-full justify-start gap-2">
                            <div
                              className="w-5 h-5 rounded border"
                              style={{ backgroundColor: newTextColor }}
                            />
                            <span>Choose Text Color</span>
                          </Button>
                        }
                      />
                    </div>
                  )}
                </div>
                
                {/* Preview Badge */}
                <div>
                  <Label className="text-xs text-muted-foreground">Preview</Label>
                  <div className="mt-1">
                    <div
                      className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: newColor,
                        color: newUseAutoContrast ? getContrastColor(newColor) : newTextColor,
                      }}
                    >
                      {newName || 'Preview'}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
                  <Switch
                    id="new-is-manual"
                    checked={newIsManual}
                    onCheckedChange={setNewIsManual}
                  />
                  <div className="flex-1">
                    <Label htmlFor="new-is-manual" className="cursor-pointer">
                      Manual Status
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Preserves user selection, won't auto-calculate from asset progress
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
                  <Switch
                    id="new-auto-trigger"
                    checked={newAutoTrigger}
                    onCheckedChange={setNewAutoTrigger}
                  />
                  <div className="flex-1">
                    <Label htmlFor="new-auto-trigger" className="cursor-pointer">
                      🎯 Auto-Trigger from Action
                    </Label>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      When user checks asset action with matching name, auto-update project to this status
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreate} size="sm">
                  Create Status
                </Button>
                <Button
                  onClick={() => {
                    setIsCreating(false);
                    setNewName('');
                    setNewColor('#3B82F6');
                    setNewDisplayIn('table');
                    setNewIsManual(false);
                    setNewAutoTrigger(false);
                  }}
                  variant="ghost"
                  size="sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Existing statuses */}
        {sortedStatuses.map((status, index) => (
          <Card
            key={status.id}
            className="p-4 hover:bg-muted/50 transition-colors"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            {editingId === status.id ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor={`edit-name-${status.id}`}>Status Name</Label>
                    <Input
                      id={`edit-name-${status.id}`}
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`edit-display-${status.id}`}>Display In</Label>
                    <Select value={editDisplayIn} onValueChange={(v) => setEditDisplayIn(v as 'table' | 'archive')}>
                      <SelectTrigger id={`edit-display-${status.id}`} className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="table">Table View</SelectItem>
                        <SelectItem value="archive">Archive View</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Badge Background Color</Label>
                    <div className="mt-2">
                      <SimpleColorPicker
                        color={editColor}
                        onChange={setEditColor}
                        trigger={
                          <Button type="button" variant="outline" className="w-full justify-start gap-2">
                            <div
                              className="w-5 h-5 rounded border"
                              style={{ backgroundColor: editColor }}
                            />
                            <span>Choose Background</span>
                          </Button>
                        }
                      />
                    </div>
                  </div>
                  
                  {/* Text Color Controls */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label>Label Text Color</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Auto Contrast</span>
                        <Switch
                          checked={editUseAutoContrast}
                          onCheckedChange={setEditUseAutoContrast}
                        />
                      </div>
                    </div>
                    {!editUseAutoContrast && (
                      <div className="mt-2">
                        <SimpleColorPicker
                          color={editTextColor}
                          onChange={setEditTextColor}
                          trigger={
                            <Button type="button" variant="outline" className="w-full justify-start gap-2">
                              <div
                                className="w-5 h-5 rounded border"
                                style={{ backgroundColor: editTextColor }}
                              />
                              <span>Choose Text Color</span>
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </div>
                  
                  {/* Preview Badge */}
                  <div>
                    <Label className="text-xs text-muted-foreground">Preview</Label>
                    <div className="mt-1">
                      <div
                        className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: editColor,
                          color: editUseAutoContrast ? getContrastColor(editColor) : editTextColor,
                        }}
                      >
                        {editName}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
                    <Switch
                      id={`edit-is-manual-${status.id}`}
                      checked={editIsManual}
                      onCheckedChange={setEditIsManual}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`edit-is-manual-${status.id}`} className="cursor-pointer">
                        Manual Status
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Preserves user selection, won't auto-calculate from asset progress
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg bg-muted/30">
                    <Switch
                      id={`edit-auto-trigger-${status.id}`}
                      checked={editAutoTrigger}
                      onCheckedChange={setEditAutoTrigger}
                    />
                    <div className="flex-1">
                      <Label htmlFor={`edit-auto-trigger-${status.id}`} className="cursor-pointer">
                        🎯 Auto-Trigger from Action
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        When user checks asset action with matching name, auto-update project to this status
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleSaveEdit} size="sm">
                    Save Changes
                  </Button>
                  <Button onClick={handleCancelEdit} variant="ghost" size="sm">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="cursor-grab text-muted-foreground hover:text-foreground">
                  <GripVertical className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div
                      className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: status.color,
                        color: getContrastColor(status.color),
                      }}
                    >
                      {status.name}
                    </div>
                    
                    {/* Visual Indicators for Quick Scanning */}
                    <div className="flex items-center gap-1.5">
                      {status.is_manual && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[10px] font-medium border border-blue-200 dark:border-blue-800">
                          <span>🖐️</span>
                          <span>Manual</span>
                        </div>
                      )}
                      {status.auto_trigger_from_action && (
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-[10px] font-medium border border-purple-200 dark:border-purple-800">
                          <span>🎯</span>
                          <span>Auto-Trigger</span>
                        </div>
                      )}
                    </div>
                    
                    <span className="text-xs text-muted-foreground">
                      Displays in: <span className="font-medium">{status.displayIn === 'table' ? 'Table' : 'Archive'}</span>
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleEdit(status)}
                    variant="ghost"
                    size="sm"
                  >
                    Edit
                  </Button>
                  <Button
                    onClick={() => setDeleteConfirm(status.id)}
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Status?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this status? Projects with this status may need to be updated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirm(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
