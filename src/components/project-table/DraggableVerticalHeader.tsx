/**
 * DraggableVerticalHeader Component
 * 
 * Draggable vertical group header for inline reordering in Table view.
 * Allows users to reorder vertical groups without going to Settings page.
 */

import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, ChevronDown, ChevronRight } from 'lucide-react';
import { Badge } from '../ui/badge';

const ITEM_TYPE = 'VERTICAL_GROUP';

interface DraggableVerticalHeaderProps {
  vertical: string;
  index: number;
  isOpen: boolean;
  projectCount: number;
  verticalColor: string;
  onMove: (fromIndex: number, toIndex: number) => void;
  onToggle: () => void;
}

interface DragItem {
  vertical: string;
  index: number;
}

export function DraggableVerticalHeader({
  vertical,
  index,
  isOpen,
  projectCount,
  verticalColor,
  onMove,
  onToggle
}: DraggableVerticalHeaderProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { vertical, index },
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
      ref={preview}
      className={`
        group/header
        flex items-center justify-between px-6 py-4 
        hover:bg-black/5 dark:hover:bg-white/5 
        transition-colors bg-[rgba(0,0,0,0)]
        cursor-pointer
        ${isDragging ? 'opacity-50' : ''}
        ${isOver && canDrop ? 'border-t-2 border-primary' : ''}
      `}
      onClick={onToggle}
    >
      <div className="flex items-center gap-3 flex-1">
        {/* Drag Handle - pojok kiri */}
        <div
          ref={(node) => {
            drag(node);
            drop(node);
          }}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover/header:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Chevron Icon */}
        <div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Vertical Name with Color Indicator */}
        <div className="flex items-center gap-2">
          <div 
            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: verticalColor }}
          />
          <h3 
            className="font-mono font-medium uppercase tracking-wide"
            style={{ color: verticalColor }}
          >
            {vertical}
          </h3>
        </div>

        {/* Project Count Badge */}
        <Badge 
          variant="secondary" 
          className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700"
        >
          {projectCount} {projectCount === 1 ? 'project' : 'projects'}
        </Badge>
      </div>
    </div>
  );
}
