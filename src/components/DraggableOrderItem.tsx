/**
 * DraggableOrderItem Component
 * 
 * Reusable drag & drop item component for ordering lists.
 * Used in both Status and Vertical group order managers.
 */

import { useDrag, useDrop } from 'react-dnd';
import { GripVertical } from 'lucide-react';

const ITEM_TYPE = 'ORDER_ITEM';

interface DraggableOrderItemProps {
  id: string;
  name: string;
  index: number;
  color?: string;
  onMove: (fromIndex: number, toIndex: number) => void;
}

interface DragItem {
  id: string;
  index: number;
}

export function DraggableOrderItem({
  id,
  name,
  index,
  color,
  onMove
}: DraggableOrderItemProps) {
  const [{ isDragging }, drag] = useDrag({
    type: ITEM_TYPE,
    item: { id, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging()
    })
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: ITEM_TYPE,
    hover: (item: DragItem) => {
      if (item.index !== index) {
        onMove(item.index, index);
        item.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop()
    })
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`
        flex items-center gap-3 p-3 bg-card border rounded-lg 
        hover:bg-accent/50 transition-colors group cursor-move
        ${isDragging ? 'opacity-50' : ''}
        ${isOver && canDrop ? 'border-primary border-2 bg-primary/5' : ''}
      `}
    >
      {/* Drag Handle */}
      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
      
      {/* Order Number */}
      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs">
        {index + 1}
      </div>
      
      {/* Item Name */}
      <div className="flex-1 text-sm">
        {name}
      </div>
      
      {/* Color Indicator (if provided) */}
      {color && (
        <div 
          className="w-3 h-3 rounded-full border" 
          style={{ backgroundColor: color }}
        />
      )}
    </div>
  );
}
