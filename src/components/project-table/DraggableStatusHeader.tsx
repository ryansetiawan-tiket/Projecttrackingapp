/**
 * DraggableStatusHeader Component
 * 
 * Draggable status group header for inline reordering in Table view.
 * Allows users to reorder status groups without going to Settings page.
 */

import { useDrag, useDrop } from 'react-dnd';
import { GripVertical, ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { Badge } from '../ui/badge';

const ITEM_TYPE = 'STATUS_GROUP';

interface DraggableStatusHeaderProps {
  status: string;
  index: number;
  isOpen: boolean;
  projectCount: number;
  urgencyBadge?: {
    text: string;
    variant: 'destructive' | 'warning' | 'default';
  } | null;
  statusColor: string;
  onMove: (fromIndex: number, toIndex: number) => void;
  onToggle: () => void;
  onCreateProject?: () => void;
  isPublicView?: boolean;
}

interface DragItem {
  status: string;
  index: number;
}

export function DraggableStatusHeader({
  status,
  index,
  isOpen,
  projectCount,
  urgencyBadge,
  statusColor,
  onMove,
  onToggle,
  onCreateProject,
  isPublicView = false
}: DraggableStatusHeaderProps) {
  const [{ isDragging }, drag, preview] = useDrag({
    type: ITEM_TYPE,
    item: { status, index },
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
      <div className="flex items-center gap-3 flex-1 p-[0px] mt-[0px] mr-[0px] mb-[0px] ml-[-25px]">
        {/* Drag Handle - pojok kiri */}
        <div
          ref={(node) => {
            drag(node);
            drop(node);
          }}
          className="cursor-grab active:cursor-grabbing opacity-0 group-hover/header:opacity-100 transition-opacity p-[0px] mt-[0px] mr-[0px] mb-[0px] ml-[8px]"
          onClick={(e) => e.stopPropagation()}
          title="Drag to reorder"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>

        {/* Chevron Icon */}
        <div className="p-[0px] mt-[0px] mr-[0px] mb-[0px] ml-[-4px]">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </div>

        {/* Status Name */}
        <h3 
          className="font-mono font-medium" 
          style={{ color: statusColor }}
        >
          {status}
        </h3>

        {/* Project Count Badge */}
        <Badge 
          variant="secondary" 
          className={status === 'Draft' 
            ? 'text-xs bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700'
            : 'text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700'
          }
        >
          {projectCount} {projectCount === 1 ? 'project' : 'projects'}
        </Badge>
        
        {/* Urgency Badge - only show when collapsed and not Done */}
        {!isOpen && status !== 'Done' && urgencyBadge && (
          <Badge 
            variant={urgencyBadge.variant === 'destructive' ? 'destructive' : urgencyBadge.variant === 'warning' ? 'default' : 'secondary'}
            className={
              urgencyBadge.variant === 'destructive'
                ? 'text-xs bg-red-100 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700'
                : urgencyBadge.variant === 'warning'
                ? 'text-xs bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700'
                : 'text-xs bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-300 dark:border-slate-700'
            }
          >
            {urgencyBadge.text}
          </Badge>
        )}
        
        {/* Plus Button - Create New Project */}
        {!isPublicView && onCreateProject && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              onCreateProject();
            }}
            className="p-0.5 rounded hover:bg-muted/50 transition-colors opacity-60 hover:opacity-100 cursor-pointer"
            title={`Create new project with status ${status}`}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();
                onCreateProject();
              }
            }}
          >
            <Plus className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
