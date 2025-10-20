/**
 * DraggableTableHeader Component (v2.4.0)
 * Draggable table header for column reordering
 */

import { useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, Lock } from 'lucide-react';
import { TableColumn } from '../../types/project';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip';

const COLUMN_DRAG_TYPE = 'TABLE_COLUMN';

interface DragItem {
  index: number;
  columnId: string;
}

interface DraggableTableHeaderProps {
  column: TableColumn;
  index: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
  children: React.ReactNode;
  className?: string;
}

export function DraggableTableHeader({
  column,
  index,
  onReorder,
  children,
  className = '',
}: DraggableTableHeaderProps) {
  const ref = useRef<HTMLTableCellElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: COLUMN_DRAG_TYPE,
    item: { index, columnId: column.id },
    canDrag: !column.locked,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver, canDrop }, drop] = useDrop({
    accept: COLUMN_DRAG_TYPE,
    canDrop: (item: DragItem) => {
      // Cannot drop into position 0 (reserved for locked column)
      return index !== 0 && item.index !== index;
    },
    drop: (item: DragItem) => {
      if (item.index !== index) {
        onReorder(item.index, index);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  // Combine drag and drop refs
  drag(drop(ref));

  // Keyboard navigation for accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (column.locked) return;
    
    // Get total number of columns from context (simple approach: assume parent knows)
    const parentRow = ref.current?.parentElement;
    const totalColumns = parentRow?.children.length || 0;
    
    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        if (index > 1) {
          onReorder(index, index - 1);
        }
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (index < totalColumns - 1) {
          onReorder(index, index + 1);
        }
        break;
    }
  };

  const isValidDropTarget = isOver && canDrop;

  return (
    <th
      ref={ref}
      role="columnheader"
      aria-label={column.locked ? `${column.label} (locked)` : `${column.label} (draggable)`}
      tabIndex={column.locked ? -1 : 0}
      onKeyDown={handleKeyDown}
      className={`
        relative group/column
        h-10 py-3
        transition-all duration-200
        ${isDragging ? 'opacity-60 scale-105 shadow-2xl z-50' : 'opacity-100'}
        ${column.locked ? 'bg-muted/30 cursor-default' : 'hover:bg-muted/50 cursor-grab active:cursor-grabbing'}
        ${className}
      `}
    >
      {/* Drop indicator - left side */}
      {isValidDropTarget && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-primary z-10" />
      )}
      
      {/* Drag handle or lock icon - positioned absolutely */}
      {column.locked ? (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground/0 group-hover/column:text-muted-foreground transition-colors flex-shrink-0" />
            </TooltipTrigger>
            <TooltipContent>
              <p>This column is locked</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <GripVertical className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/0 group-hover/column:text-muted-foreground/70 transition-colors flex-shrink-0" />
      )}
      
      {/* Column content - projectName left-aligned, others centered */}
      <div className={`font-semibold ${column.id === 'projectName' ? 'text-left' : 'text-center'}`}>
        {children}
      </div>
    </th>
  );
}
