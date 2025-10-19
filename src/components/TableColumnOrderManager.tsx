/**
 * TableColumnOrderManager Component (v2.4.0)
 * Visual interface for managing table column order with drag & drop
 */

import { useState, useEffect } from 'react';
import { GripVertical, Lock, RotateCcw, Info } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Switch } from './ui/switch';
import { TableColumn, TableColumnId, DEFAULT_TABLE_COLUMNS } from '../types/project';
import { reorderColumns, getColumnOrderIds, applyColumnOrder, toggleColumnVisibility, getColumnVisibility } from '../utils/columnOrderUtils';
import { projectId } from '../utils/supabase/info';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';

interface DraggableColumnItemProps {
  column: TableColumn;
  index: number;
  onDragStart: (index: number) => void;
  onDragEnter: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onToggleVisibility: (columnId: TableColumnId) => void;
  isAdmin: boolean;
}

function DraggableColumnItem({
  column,
  index,
  onDragStart,
  onDragEnter,
  onDragEnd,
  isDragging,
  onToggleVisibility,
  isAdmin,
}: DraggableColumnItemProps) {
  return (
    <div
      draggable={!column.locked && isAdmin}
      onDragStart={() => !column.locked && isAdmin && onDragStart(index)}
      onDragEnter={() => !column.locked && isAdmin && onDragEnter(index)}
      onDragEnd={onDragEnd}
      className={`
        group relative flex items-center gap-3 p-3 rounded-lg border bg-card
        ${!column.visible ? 'opacity-50' : ''}
        ${column.locked || !isAdmin ? 'cursor-default' : 'cursor-grab active:cursor-grabbing hover:border-primary/50'}
        ${isDragging ? 'opacity-30' : ''}
        transition-all duration-200
      `}
    >
      {/* Drag Handle or Lock Icon */}
      <div className="flex-shrink-0">
        {column.locked ? (
          <Lock className="h-4 w-4 text-muted-foreground" />
        ) : (
          <GripVertical className={`h-5 w-5 text-muted-foreground ${isAdmin ? 'group-hover:text-primary' : ''} transition-colors`} />
        )}
      </div>

      {/* Column Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium truncate">{column.label}</span>
          {column.locked && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              Locked
            </Badge>
          )}
          {!column.visible && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-dashed">
              Hidden
            </Badge>
          )}
        </div>
        {column.locked && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Always visible and cannot be reordered
          </p>
        )}
      </div>

      {/* Visibility Toggle */}
      <Switch
        checked={column.visible}
        onCheckedChange={() => onToggleVisibility(column.id)}
        disabled={column.locked || !isAdmin}
        className="data-[state=checked]:bg-primary"
      />

      {/* Position Badge */}
      <Badge variant="outline" className="text-xs px-2 py-0.5 font-mono">
        {index + 1}
      </Badge>
    </div>
  );
}

export function TableColumnOrderManager() {
  const { accessToken, isAdmin } = useAuth();
  const [columns, setColumns] = useState<TableColumn[]>(DEFAULT_TABLE_COLUMNS);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Load column order from database
  useEffect(() => {
    if (!accessToken) {
      setColumns(DEFAULT_TABLE_COLUMNS);
      setIsLoading(false);
      return;
    }

    const loadColumnOrder = async () => {
      try {
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/table-column-order`,
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );

        if (!response.ok) {
          console.error('Failed to load column order:', response.statusText);
          setColumns(DEFAULT_TABLE_COLUMNS);
          setIsLoading(false);
          return;
        }

        const data = await response.json();
        
        if (data.columnOrder) {
          setColumns(applyColumnOrder(data.columnOrder, data.columnVisibility));
        } else {
          setColumns(DEFAULT_TABLE_COLUMNS);
        }
      } catch (error) {
        console.error('Error loading column order:', error);
        setColumns(DEFAULT_TABLE_COLUMNS);
      } finally {
        setIsLoading(false);
      }
    };

    loadColumnOrder();
  }, [accessToken]);

  // Save column order and visibility to database
  const saveColumnOrder = async (newColumns: TableColumn[]) => {
    if (!accessToken || !isAdmin) return;

    setIsSaving(true);
    try {
      const newOrder = getColumnOrderIds(newColumns);
      const newVisibility = getColumnVisibility(newColumns);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/table-column-order`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            columnOrder: newOrder,
            columnVisibility: newVisibility 
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to save column order');
      }

      toast.success('Column order saved successfully');
    } catch (error) {
      console.error('Error saving column order:', error);
      toast.error('Failed to save column order');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle visibility toggle
  const handleToggleVisibility = (columnId: TableColumnId) => {
    if (!isAdmin) return;

    const newColumns = toggleColumnVisibility(columns, columnId);
    
    // Check if visibility actually changed
    if (JSON.stringify(newColumns) === JSON.stringify(columns)) {
      const column = columns.find(col => col.id === columnId);
      if (column?.locked) {
        toast.error('Cannot hide the Project column');
      } else {
        toast.error('At least one column must be visible');
      }
      return;
    }
    
    setColumns(newColumns);
    saveColumnOrder(newColumns);
  };

  // Handle drag operations
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragEnter = (index: number) => {
    if (draggedIndex === null || draggedIndex === index) return;
    if (columns[draggedIndex].locked || columns[index].locked) return;

    const newColumns = reorderColumns(columns, draggedIndex, index);
    setColumns(newColumns);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && isAdmin) {
      saveColumnOrder(columns);
    }
    setDraggedIndex(null);
  };

  // Reset to default order
  const handleReset = async () => {
    if (!accessToken || !isAdmin) return;

    setIsResetting(true);
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/table-column-order`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to reset column order');
      }
      
      setColumns(DEFAULT_TABLE_COLUMNS);
      toast.success('Column order reset to default');
    } catch (error) {
      console.error('Error resetting column order:', error);
      toast.error('Failed to reset column order');
    } finally {
      setIsResetting(false);
    }
  };

  // Check if current order is custom
  const isCustomOrder = JSON.stringify(getColumnOrderIds(columns)) !== 
                       JSON.stringify(getColumnOrderIds(DEFAULT_TABLE_COLUMNS));

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Table Column Order</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              Table Column Order
              {isSaving && (
                <Badge variant="secondary" className="text-xs">
                  Saving...
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-1">
              Drag and drop to reorder table columns. Toggle visibility to show/hide columns. Changes are saved automatically.
            </CardDescription>
          </div>
          {isCustomOrder && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={isResetting}
              className="flex items-center gap-2 flex-shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
              {isResetting ? 'Resetting...' : 'Reset to Default'}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Admin-Only Notice */}
        {!isAdmin && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              🔒 Only admins can modify column order
            </AlertDescription>
          </Alert>
        )}

        {/* Custom Order Badge */}
        {isCustomOrder && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <Info className="h-4 w-4 text-primary flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              You are using a custom column order. Click <strong>Reset to Default</strong> to restore the original order.
            </p>
          </div>
        )}

        {/* Column List */}
        <div className="space-y-2">
          {columns.map((column, index) => (
            <DraggableColumnItem
              key={column.id}
              column={column}
              index={index}
              onDragStart={handleDragStart}
              onDragEnter={handleDragEnter}
              onDragEnd={handleDragEnd}
              isDragging={draggedIndex === index}
              onToggleVisibility={handleToggleVisibility}
              isAdmin={isAdmin}
            />
          ))}
        </div>

        {/* Help Text */}
        <div className="rounded-lg bg-muted/30 border border-border p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Tip:</strong> The "Project" column is locked, always visible, and always appears first. 
            You can reorder other columns by dragging and toggle their visibility with the switch.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
