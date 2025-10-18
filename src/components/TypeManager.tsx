import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { SimpleColorPicker } from './SimpleColorPicker';
import { 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  AlertCircle,
  Check,
  X
} from 'lucide-react';
import { useTypes } from '../hooks/useTypes';
import { useColors } from './ColorContext';
import { toast } from 'sonner@2.0.3';
import { getContrastColor } from '../utils/colorUtils';
import exampleImage from 'figma:asset/6c6390e46f100df125646a9e64ef11eb56fe4976.png';

interface TypeManagerProps {
  onClose?: () => void;
  onDataChange?: () => void;
}

export function TypeManager({ onClose, onDataChange }: TypeManagerProps) {
  const { types, typeColors, loading, error, addType, updateType, deleteType, getTypesWithColors } = useTypes();
  const { refreshTypes: globalRefreshTypes } = useColors();
  
  // Debug logging
  useEffect(() => {
    console.log('TypeManager mounted!');
    console.log('TypeManager data:', { types, typeColors, loading, error });
  }, [types, typeColors, loading, error]);
  const [isAddingType, setIsAddingType] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeColor, setNewTypeColor] = useState('#6b7280');
  const [newTextColor, setNewTextColor] = useState('#FFFFFF');
  const [newUseAutoContrast, setNewUseAutoContrast] = useState(true);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [editingTypeColor, setEditingTypeColor] = useState('#6b7280');
  const [editingTextColor, setEditingTextColor] = useState('#FFFFFF');
  const [editingUseAutoContrast, setEditingUseAutoContrast] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);

  // Handle adding new type
  const handleAddType = async () => {
    if (!newTypeName.trim()) {
      toast.error('Type name is required');
      return;
    }

    setOperationLoading(true);
    try {
      await addType(
        newTypeName.trim(), 
        newTypeColor,
        newUseAutoContrast ? undefined : newTextColor,
        newUseAutoContrast
      );
      // Global refresh to update all components using types
      await globalRefreshTypes();
      setNewTypeName('');
      setNewTypeColor('#6b7280');
      setNewTextColor('#FFFFFF');
      setNewUseAutoContrast(true);
      setIsAddingType(false);
      toast.success('Type added successfully!');
      onDataChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add type');
    } finally {
      setOperationLoading(false);
    }
  };

  // Handle updating type
  const handleUpdateType = async (oldType: string) => {
    if (!editingTypeName.trim()) {
      toast.error('Type name is required');
      return;
    }

    setOperationLoading(true);
    try {
      await updateType(
        oldType, 
        editingTypeName.trim() !== oldType ? editingTypeName.trim() : undefined,
        editingTypeColor !== typeColors[oldType] ? editingTypeColor : undefined,
        editingUseAutoContrast ? undefined : editingTextColor,
        editingUseAutoContrast
      );
      // Global refresh to update all components using types
      await globalRefreshTypes();
      setEditingType(null);
      setEditingTypeName('');
      setEditingTypeColor('#6b7280');
      setEditingTextColor('#FFFFFF');
      setEditingUseAutoContrast(true);
      toast.success('Type updated successfully!');
      onDataChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update type');
    } finally {
      setOperationLoading(false);
    }
  };

  // Handle deleting type
  const handleDeleteType = async (type: string) => {
    if (!confirm(`Are you sure you want to delete "${type}"? This action cannot be undone.`)) {
      return;
    }

    setOperationLoading(true);
    try {
      await deleteType(type);
      // Global refresh to update all components using types
      await globalRefreshTypes();
      toast.success('Type deleted successfully!');
      onDataChange?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete type');
    } finally {
      setOperationLoading(false);
    }
  };

  // Start editing type
  const startEditingType = (type: string) => {
    const typeData = getTypesWithColors().find(t => t.name === type);
    setEditingType(type);
    setEditingTypeName(type);
    setEditingTypeColor(typeColors[type] || '#6b7280');
    setEditingTextColor(typeData?.textColor || '#FFFFFF');
    setEditingUseAutoContrast(typeData?.useAutoContrast ?? true);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingType(null);
    setEditingTypeName('');
    setEditingTypeColor('#6b7280');
  };

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <span className="ml-3">Loading types...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Add New Type Section */}
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-[#1A1A1D]">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Illustration Type
          </h3>
          
          {!isAddingType ? (
            <Button 
              variant="outline" 
              onClick={() => setIsAddingType(true)}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Type
            </Button>
          ) : (
            <div className="space-y-3">
              <div>
                <Input
                  placeholder="Type name (e.g., Banner, Icon)"
                  value={newTypeName}
                  onChange={(e) => setNewTypeName(e.target.value)}
                  className="w-full"
                />
              </div>
              
              {/* Color Controls */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Badge Background Color</div>
                <SimpleColorPicker
                  color={newTypeColor}
                  onChange={setNewTypeColor}
                  trigger={
                    <Button 
                      variant="outline" 
                      className="w-full justify-start gap-2"
                    >
                      <div
                        className="w-5 h-5 rounded border"
                        style={{ backgroundColor: newTypeColor }}
                      />
                      <span>Choose Background</span>
                    </Button>
                  }
                />
              </div>
              
              {/* Text Color Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Label Text Color</div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Auto Contrast</span>
                    <div 
                      onClick={() => setNewUseAutoContrast(!newUseAutoContrast)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                        newUseAutoContrast ? 'bg-primary' : 'bg-muted'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          newUseAutoContrast ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </div>
                  </div>
                </div>
                {!newUseAutoContrast && (
                  <SimpleColorPicker
                    color={newTextColor}
                    onChange={setNewTextColor}
                    trigger={
                      <Button 
                        variant="outline" 
                        className="w-full justify-start gap-2"
                      >
                        <div
                          className="w-5 h-5 rounded border"
                          style={{ backgroundColor: newTextColor }}
                        />
                        <span>Choose Text Color</span>
                      </Button>
                    }
                  />
                )}
              </div>
              
              {/* Preview */}
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Preview</div>
                <Badge 
                  className="border-0"
                  style={{ 
                    backgroundColor: newTypeColor,
                    color: newUseAutoContrast ? getContrastColor(newTypeColor) : newTextColor
                  }}
                >
                  {newTypeName || 'Preview'}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={handleAddType} className="flex-1" disabled={operationLoading}>
                  <Check className="h-4 w-4 mr-2" />
                  {operationLoading ? 'Adding...' : 'Add Type'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsAddingType(false);
                    setNewTypeName('');
                    setNewTypeColor('#6b7280');
                    setNewTextColor('#FFFFFF');
                    setNewUseAutoContrast(true);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Existing Types List */}
        <div>
          <h3 className="font-medium mb-3">Current Illustration Types ({types.length})</h3>
          
          {types.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Palette className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No illustration types found</p>
              <p className="text-sm">Add your first type to get started</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {types.map((type) => (
                <div key={type} className="border rounded-lg p-3 bg-card">
                  {editingType === type ? (
                    // Edit mode
                    <div className="space-y-3">
                      <div>
                        <Input
                          value={editingTypeName}
                          onChange={(e) => setEditingTypeName(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      
                      {/* Color Controls */}
                      <div className="space-y-2">
                        <div className="text-sm font-medium">Badge Background Color</div>
                        <SimpleColorPicker
                          color={editingTypeColor}
                          onChange={setEditingTypeColor}
                          trigger={
                            <Button 
                              variant="outline" 
                              className="w-full justify-start gap-2"
                            >
                              <div
                                className="w-5 h-5 rounded border"
                                style={{ backgroundColor: editingTypeColor }}
                              />
                              <span>Choose Background</span>
                            </Button>
                          }
                        />
                      </div>
                      
                      {/* Text Color Controls */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">Label Text Color</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Auto Contrast</span>
                            <div 
                              onClick={() => setEditingUseAutoContrast(!editingUseAutoContrast)}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                                editingUseAutoContrast ? 'bg-primary' : 'bg-muted'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  editingUseAutoContrast ? 'translate-x-5' : 'translate-x-0.5'
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                        {!editingUseAutoContrast && (
                          <SimpleColorPicker
                            color={editingTextColor}
                            onChange={setEditingTextColor}
                            trigger={
                              <Button 
                                variant="outline" 
                                className="w-full justify-start gap-2"
                              >
                                <div
                                  className="w-5 h-5 rounded border"
                                  style={{ backgroundColor: editingTextColor }}
                                />
                                <span>Choose Text Color</span>
                              </Button>
                            }
                          />
                        )}
                      </div>
                      
                      {/* Preview */}
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Preview</div>
                        <Badge 
                          className="border-0"
                          style={{ 
                            backgroundColor: editingTypeColor,
                            color: editingUseAutoContrast ? getContrastColor(editingTypeColor) : editingTextColor
                          }}
                        >
                          {editingTypeName}
                        </Badge>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleUpdateType(type)} 
                          size="sm"
                          className="flex-1"
                          disabled={operationLoading}
                        >
                          <Check className="h-4 w-4 mr-2" />
                          {operationLoading ? 'Saving...' : 'Save'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={cancelEditing}
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge 
                          className="border-0"
                          style={{ 
                            backgroundColor: typeColors[type] || '#6b7280',
                            color: (() => {
                              const typeData = getTypesWithColors().find(t => t.name === type);
                              if (typeData && typeData.useAutoContrast === false && typeData.textColor) {
                                return typeData.textColor;
                              }
                              return getContrastColor(typeColors[type] || '#6b7280');
                            })()
                          }}
                        >
                          {type}
                        </Badge>
                        <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                          {typeColors[type] || '#6b7280'}
                        </span>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => startEditingType(type)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteType(type)}
                            className="text-red-600"
                            disabled={operationLoading}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {operationLoading ? 'Deleting...' : 'Delete'}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Example Reference */}
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-[#1A1A1D]">
          <h3 className="font-medium mb-3">Reference: Illustration Types</h3>
          <div className="flex justify-center">
            <img 
              src={exampleImage} 
              alt="Illustration types reference"
              className="max-w-full h-auto rounded border"
            />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
            Use this as a reference for creating and managing your illustration types
          </p>
        </div>

        {/* Usage Note */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Note:</strong> You cannot delete types that are currently used in projects. 
            Update or remove those projects first before deleting a type.
          </AlertDescription>
        </Alert>
      </div>
  );
}