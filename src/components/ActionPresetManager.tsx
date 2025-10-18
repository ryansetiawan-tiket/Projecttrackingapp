import { useState } from 'react';
import { useActionPresets } from './ActionPresetContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, X, Edit2, Check, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { toast } from 'sonner@2.0.3';

export function ActionPresetManager() {
  const { presets, addPreset, removePreset, updatePreset, loading, canEdit } = useActionPresets();
  const [newPreset, setNewPreset] = useState('');
  const [editingPreset, setEditingPreset] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');

  const handleAdd = async () => {
    if (!canEdit) {
      toast.error('Only administrators can modify action presets');
      return;
    }
    const trimmed = newPreset.trim();
    if (trimmed) {
      try {
        await addPreset(trimmed);
        setNewPreset('');
        toast.success('Preset added successfully');
      } catch (error) {
        toast.error('Failed to add preset');
      }
    }
  };

  const startEditing = (preset: string) => {
    if (!canEdit) {
      toast.error('Only administrators can modify action presets');
      return;
    }
    setEditingPreset(preset);
    setEditingValue(preset);
  };

  const saveEdit = async () => {
    if (editingPreset && editingValue.trim()) {
      try {
        await updatePreset(editingPreset, editingValue.trim());
        setEditingPreset(null);
        setEditingValue('');
        toast.success('Preset updated successfully');
      } catch (error) {
        toast.error('Failed to update preset');
      }
    }
  };

  const handleRemove = async (preset: string) => {
    if (!canEdit) {
      toast.error('Only administrators can modify action presets');
      return;
    }
    try {
      await removePreset(preset);
      toast.success('Preset removed successfully');
    } catch (error) {
      toast.error('Failed to remove preset');
    }
  };

  const cancelEdit = () => {
    setEditingPreset(null);
    setEditingValue('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Action Presets {!canEdit && <span className="text-muted-foreground">(Admin only)</span>}
        </CardTitle>
        <CardDescription>
          Manage preset actions that can be quickly added to assets
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && (
          <>
        {/* Add New Preset */}
        <div className="flex gap-2">
          <Input
            placeholder="New preset action..."
            value={newPreset}
            onChange={(e) => setNewPreset(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
            }}
            disabled={!canEdit}
          />
          <Button onClick={handleAdd} disabled={!newPreset.trim() || !canEdit}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>

        {/* Preset List */}
        <div className="space-y-2">
          {presets.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No presets yet. Add your first preset action above.
            </p>
          ) : (
            presets.map((preset) => (
              <div key={preset} className="flex items-center gap-2 group">
                {editingPreset === preset ? (
                  <>
                    <Input
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveEdit();
                        if (e.key === 'Escape') cancelEdit();
                      }}
                      className="flex-1"
                      autoFocus
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={saveEdit}
                      className="shrink-0"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEdit}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary" className="flex-1 justify-start">
                      {preset}
                    </Badge>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(preset)}
                        disabled={!canEdit}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemove(preset)}
                        className="text-destructive hover:text-destructive"
                        disabled={!canEdit}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
        </>
        )}
      </CardContent>
    </Card>
  );
}
