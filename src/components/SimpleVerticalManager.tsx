import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';

interface SimpleVerticalManagerProps {
  onClose: () => void;
  onVerticalAdded: () => void;
}

export function SimpleVerticalManager({ onClose, onVerticalAdded }: SimpleVerticalManagerProps) {
  const [newVerticalName, setNewVerticalName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAddVertical = async () => {
    if (!newVerticalName.trim()) {
      toast.error('Please enter a vertical name');
      return;
    }

    const upperVertical = newVerticalName.trim().toUpperCase();

    try {
      setIsLoading(true);

      // Add vertical with default color
      const response = await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/vertical-colors/${encodeURIComponent(upperVertical)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify({ color: '#bfdbfe' }), // Default blue color
      });

      if (!response.ok) {
        throw new Error('Failed to add vertical');
      }

      toast.success(`Vertical "${upperVertical}" added successfully`);
      setNewVerticalName('');
      onVerticalAdded();
      onClose();

    } catch (error) {
      console.error('Error adding vertical:', error);
      toast.error('Failed to add vertical');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Vertical Name
        </label>
        <Input
          value={newVerticalName}
          onChange={(e) => setNewVerticalName(e.target.value)}
          placeholder="Enter vertical name (e.g., MARKETING)"
          className="h-10"
          onKeyPress={(e) => {
            if (e.key === 'Enter' && !isLoading) {
              e.preventDefault();
              handleAddVertical();
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          Vertical names will be converted to uppercase
        </p>
      </div>

      <div className="flex gap-2 justify-end pt-2">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAddVertical}
          disabled={isLoading || !newVerticalName.trim()}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {isLoading ? 'Adding...' : 'Add Vertical'}
        </Button>
      </div>
    </div>
  );
}