import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Plus, Check, Trash2, Pencil, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { 
  getAllVerticals, 
  addNewVertical,
  deleteVertical,
  renameVertical
} from '../utils/verticalColors';
import { VerticalColorPicker } from './VerticalColorPicker';
import { useColors } from './ColorContext';
import { getContrastColor } from '../utils/colorUtils';

interface VerticalManagerProps {
  selectedVertical?: string;
  onVerticalSelect?: (vertical: string) => void;
  onClose?: () => void;
  onDataChange?: () => void;
}

export function VerticalManager({ selectedVertical, onVerticalSelect, onClose, onDataChange }: VerticalManagerProps) {
  const [verticals, setVerticals] = useState<string[]>([]);
  const [newVerticalName, setNewVerticalName] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingVertical, setEditingVertical] = useState<string | null>(null);
  const [editedName, setEditedName] = useState('');
  
  const { verticalColors, updateVerticalColor } = useColors();

  useEffect(() => {
    loadVerticals();
  }, []);

  const loadVerticals = async () => {
    try {
      setIsLoading(true);
      const allVerticals = await getAllVerticals();
      setVerticals(allVerticals);
    } catch (error) {
      console.error('Error loading verticals:', error);
      toast.error('Failed to load verticals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewVertical = async () => {
    if (!newVerticalName.trim()) {
      toast.error('Please enter a vertical name');
      return;
    }

    const upperCaseName = newVerticalName.toUpperCase();
    
    if (verticals.includes(upperCaseName)) {
      toast.error('Vertical already exists');
      return;
    }

    try {
      await addNewVertical(upperCaseName);
      await loadVerticals(); // Reload to get fresh data
      setNewVerticalName('');
      setIsAddingNew(false);
      toast.success('Vertical added successfully');
      onDataChange?.();
    } catch (error) {
      console.error('Error adding vertical:', error);
      toast.error('Failed to add vertical');
    }
  };

  const handleStartEdit = (vertical: string) => {
    setEditingVertical(vertical);
    setEditedName(vertical);
  };

  const handleCancelEdit = () => {
    setEditingVertical(null);
    setEditedName('');
  };

  const handleSaveEdit = async (oldName: string) => {
    if (!editedName.trim()) {
      toast.error('Please enter a vertical name');
      return;
    }

    const upperCaseName = editedName.toUpperCase();
    
    if (upperCaseName === oldName) {
      // No change
      handleCancelEdit();
      return;
    }
    
    if (verticals.includes(upperCaseName)) {
      toast.error('Vertical already exists');
      return;
    }

    try {
      await renameVertical(oldName, upperCaseName);
      await loadVerticals(); // Reload to get fresh data
      setEditingVertical(null);
      setEditedName('');
      toast.success('Vertical renamed successfully');
      onDataChange?.();
    } catch (error) {
      console.error('Error renaming vertical:', error);
      toast.error('Failed to rename vertical');
    }
  };

  const handleDeleteVertical = async (vertical: string) => {
    if (!confirm(`Are you sure you want to delete "${vertical}"? This cannot be undone.`)) {
      return;
    }

    try {
      await deleteVertical(vertical);
      await loadVerticals(); // Reload to get fresh data
      toast.success('Vertical deleted successfully');
      onDataChange?.();
    } catch (error: any) {
      console.error('Error deleting vertical:', error);
      if (error.message && error.message.includes('assigned to projects')) {
        toast.error('Cannot delete vertical that is assigned to projects');
      } else {
        toast.error('Failed to delete vertical');
      }
    }
  };

  const handleColorChange = async (vertical: string, color: string) => {
    try {
      await updateVerticalColor(vertical, color);
      toast.success('Color updated successfully');
      onDataChange?.();
    } catch (error) {
      console.error('Error updating color:', error);
      toast.error('Failed to update color');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
        {/* Existing Verticals */}
        <div className="space-y-2">
          {verticals.map((vertical) => (
            <div key={vertical} className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 group transition-colors">
              {/* Color Indicator & Picker */}
              <VerticalColorPicker
                vertical={vertical}
                currentColor={verticalColors[vertical] || '#bfdbfe'}
                onColorChange={handleColorChange}
              />

              {/* Vertical Name - Editable */}
              {editingVertical === vertical ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSaveEdit(vertical);
                      } else if (e.key === 'Escape') {
                        handleCancelEdit();
                      }
                    }}
                    className="h-8 text-sm uppercase"
                    autoFocus
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/30"
                    onClick={() => handleSaveEdit(vertical)}
                  >
                    <Check className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-[#2A2A2F]"
                    onClick={handleCancelEdit}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <>
                  <Badge
                    variant="secondary"
                    className="flex-1 justify-start uppercase text-xs tracking-wide px-3 py-2"
                    style={{
                      backgroundColor: verticalColors[vertical] || '#bfdbfe',
                      color: getContrastColor(verticalColors[vertical] || '#bfdbfe'),
                      border: 'none'
                    }}
                  >
                    {vertical}
                    {selectedVertical === vertical && (
                      <Check className="ml-2 h-3 w-3" />
                    )}
                  </Badge>

                  {/* Edit Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                    onClick={() => handleStartEdit(vertical)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>

                  {/* Delete Button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                    onClick={() => handleDeleteVertical(vertical)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Add New Vertical */}
        <div className="border-t pt-4">
          {!isAddingNew ? (
            <Button
              variant="outline"
              className="w-full justify-start text-muted-foreground"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Vertical
            </Button>
          ) : (
            <div className="space-y-3">
              <Input
                placeholder="Enter new vertical name"
                value={newVerticalName}
                onChange={(e) => setNewVerticalName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddNewVertical();
                  } else if (e.key === 'Escape') {
                    setIsAddingNew(false);
                    setNewVerticalName('');
                  }
                }}
                className="uppercase"
                autoFocus
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAddNewVertical}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingNew(false);
                    setNewVerticalName('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
  );
}
