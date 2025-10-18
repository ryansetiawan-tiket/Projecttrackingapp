import { useState, useEffect, useRef } from 'react';
import { AssetAction } from '../types/project';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Plus, X, Edit2, Check, Workflow as WorkflowIcon, Trash2, RotateCcw, GripVertical } from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { useActionPresets } from './ActionPresetContext';
import { useWorkflows } from './WorkflowContext';
import { useActionSettings } from './ActionSettingsContext';
import { useStatusContext } from './StatusContext';
import { getProgressColorValue } from '../utils/taskProgress';

const MAX_ACTIONS = 12;

// Draggable Action Item Component for Read/Write Mode
interface DraggableActionItemProps {
  action: AssetAction;
  index: number;
  readOnly: boolean;
  gridLayout: boolean;
  onMove: (fromIndex: number, toIndex: number) => void;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
}

const DraggableActionItem = ({ action, index, readOnly, gridLayout, onMove, onToggle, onRemove }: DraggableActionItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'ASSET_ACTION_ITEM',
    item: { index },
    canDrag: !readOnly,
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'ASSET_ACTION_ITEM',
    canDrop: () => !readOnly,
    hover: (item: { index: number }, monitor) => {
      if (!ref.current) return;
      
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = clientOffset!.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      onMove(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  preview(drop(ref));

  return (
    <div 
      ref={ref}
      className={`flex items-center gap-2 group/item ${readOnly ? 'cursor-default' : ''} ${action.wasAutoChecked ? 'opacity-60' : ''} ${gridLayout ? 'break-inside-avoid' : ''} transition-all ${
        isDragging ? 'opacity-50 scale-95' : ''
      } ${isOver && !readOnly ? 'bg-accent/30' : ''}`}
    >
      {!readOnly && (
        <div
          ref={drag}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors shrink-0"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      )}
      {!readOnly ? (
        <Checkbox
          checked={action.completed}
          onCheckedChange={() => onToggle(action.id)}
          className="shrink-0 h-3.5 w-3.5"
        />
      ) : (
        <div className={`w-3.5 h-3.5 rounded border shrink-0 flex items-center justify-center text-[10px] opacity-40 ${ 
          action.completed ? 'bg-muted-foreground border-muted-foreground' : 'border-muted-foreground'
        }`}>
          {action.completed && <Check className="h-2.5 w-2.5 text-background" />}
        </div>
      )}
      <span className={`text-xs flex-1 truncate ${action.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
        {action.name}
      </span>
      {!readOnly && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemove(action.id)}
          className="h-5 w-5 p-0 opacity-0 group-hover/item:opacity-100 transition-opacity text-muted-foreground hover:text-destructive flex-shrink-0"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

interface AssetActionManagerProps {
  actions: AssetAction[];
  onChange: (actions: AssetAction[]) => void;
  readOnly?: boolean;
  compact?: boolean;
  hideProgress?: boolean;
  gridLayout?: boolean;
  status?: string; // Asset status for badge display
  onAllActionsCompleted?: () => void; // Callback when last action is completed
  onStatusChange?: (newStatus: string) => void; // Callback when status should be updated based on progress
}

export function AssetActionManager({ actions, onChange, readOnly = false, compact = false, hideProgress = false, gridLayout = false, status, onAllActionsCompleted, onStatusChange }: AssetActionManagerProps) {
  const { presets } = useActionPresets();
  const { workflows } = useWorkflows();
  const { autoCheckAbove } = useActionSettings();
  const { getStatusColor, getStatusTextColor } = useStatusContext();
  const [newActionName, setNewActionName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [workflowPopoverOpen, setWorkflowPopoverOpen] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showReplaceDialog, setShowReplaceDialog] = useState(false);
  const [pendingWorkflowActions, setPendingWorkflowActions] = useState<string[]>([]);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addMenuView, setAddMenuView] = useState<'menu' | 'actions' | 'workflow'>('menu');

  // Auto-calculate and update status based on action completion
  useEffect(() => {
    if (!onStatusChange || actions.length === 0 || readOnly) return;

    const completedCount = actions.filter(a => a.completed).length;
    const totalCount = actions.length;
    
    let newStatus: string;
    
    if (completedCount === 0) {
      newStatus = 'Not Started';
    } else if (completedCount === totalCount) {
      newStatus = 'Done';
    } else {
      newStatus = 'In Progress';
    }
    
    // Only trigger callback if status actually changed
    if (newStatus !== status) {
      console.log(`[AssetActionManager] 🔄 Auto-updating status: ${status} → ${newStatus} (${completedCount}/${totalCount} completed)`);
      onStatusChange(newStatus);
    }
  }, [actions, status, onStatusChange, readOnly]);

  const addAction = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    // Check max actions limit
    if (actions.length >= MAX_ACTIONS) {
      return;
    }

    const newAction: AssetAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: trimmed,
      completed: false
    };

    onChange([...actions, newAction]);
    setNewActionName('');
    setComboboxOpen(false);
    setAddMenuOpen(false);
    setAddMenuView('menu');
  };

  const addWorkflowActions = (workflowActions: string[]) => {
    // Check if there are existing actions - show confirmation dialog
    if (actions.length > 0) {
      setPendingWorkflowActions(workflowActions);
      setWorkflowPopoverOpen(false);
      setAddMenuOpen(false);
      setShowReplaceDialog(true);
      return;
    }
    
    // No existing actions - just add workflow directly
    const newActions: AssetAction[] = workflowActions.map((actionName, index) => ({
      id: `action_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name: actionName,
      completed: false
    }));

    onChange(newActions);
    setWorkflowPopoverOpen(false);
    setAddMenuOpen(false);
    setAddMenuView('menu');
  };
  
  const confirmReplaceWithWorkflow = () => {
    const newActions: AssetAction[] = pendingWorkflowActions.map((actionName, index) => ({
      id: `action_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name: actionName,
      completed: false
    }));

    onChange(newActions);
    setShowReplaceDialog(false);
    setPendingWorkflowActions([]);
    setAddMenuOpen(false);
    setAddMenuView('menu');
  };
  
  const cancelReplaceWithWorkflow = () => {
    setShowReplaceDialog(false);
    setPendingWorkflowActions([]);
  };

  const clearAllActions = () => {
    onChange([]);
    setShowClearAllDialog(false);
  };
  
  const resetAllCheckboxes = () => {
    const resetActions = actions.map(action => ({
      ...action,
      completed: false,
      wasAutoChecked: undefined
    }));
    onChange(resetActions);
  };

  const removeAction = (id: string) => {
    onChange(actions.filter(a => a.id !== id));
  };

  // NEW: Handle reordering actions
  const handleReorderActions = (fromIndex: number, toIndex: number) => {
    const newActions = [...actions];
    const [movedItem] = newActions.splice(fromIndex, 1);
    newActions.splice(toIndex, 0, movedItem);
    onChange(newActions);
  };

  const toggleAction = (id: string) => {
    const actionIndex = actions.findIndex(a => a.id === id);
    const action = actions[actionIndex];
    
    if (!action) return;
    
    let updatedActions: AssetAction[];
    
    // If checking (not unchecking) and auto-check is enabled
    if (!action.completed && autoCheckAbove) {
      console.log(`[AssetActionManager] ⚡ Auto-checking actions above index ${actionIndex} (optimistic)`);
      
      updatedActions = new Array(actions.length);
      for (let idx = 0; idx < actions.length; idx++) {
        if (idx < actionIndex) {
          updatedActions[idx] = { ...actions[idx], completed: true, wasAutoChecked: true };
        } else if (idx === actionIndex) {
          updatedActions[idx] = { ...actions[idx], completed: true, wasAutoChecked: undefined };
        } else {
          updatedActions[idx] = actions[idx];
        }
      }
    } else {
      updatedActions = actions.map(a => 
        a.id === id ? { ...a, completed: !a.completed, wasAutoChecked: undefined } : a
      );
    }
    
    // Check if this action completion made ALL actions completed
    const allCompleted = updatedActions.every(a => a.completed);
    const wasNotAllCompleted = actions.some(a => !a.completed);
    
    // If we just completed the last action (transition from "not all" to "all")
    if (allCompleted && wasNotAllCompleted && onAllActionsCompleted) {
      console.log('[AssetActionManager] 🎯 All actions completed! Triggering callback...');
      // Trigger callback after state update
      setTimeout(() => {
        onAllActionsCompleted();
      }, 100);
    }
    
    onChange(updatedActions);
  };

  const startEditing = (action: AssetAction) => {
    setEditingId(action.id);
    setEditingName(action.name);
  };

  const saveEdit = (id: string) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      onChange(actions.map(a => 
        a.id === id ? { ...a, name: trimmed } : a
      ));
    }
    setEditingId(null);
    setEditingName('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const calculateProgress = () => {
    if (actions.length === 0) return 0;
    const completed = actions.filter(a => a.completed).length;
    return Math.round((completed / actions.length) * 100);
  };
  
  const handleAddActionFromMenu = (actionName: string) => {
    addAction(actionName);
  };
  
  const handleAddWorkflowFromMenu = (workflowActions: string[]) => {
    addWorkflowActions(workflowActions);
  };

  if (compact) {
    const progress = calculateProgress();
    
    return (
      <div className="space-y-2">
        {/* Progress Bar */}
        {actions.length > 0 && !hideProgress && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full transition-all duration-300"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: getProgressColorValue(progress)
                }}
              />
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {progress}%
            </span>
          </div>
        )}
        
        {/* Action Checkboxes & Add Button - with hover controls */}
        <div className="group/actions">
          {/* Actions + Add More in 2-column grid (6 actions per column, max 12) */}
          <DndProvider backend={HTML5Backend}>
            <div 
              className={`${
                gridLayout 
                  ? 'columns-2 gap-3 space-y-2.5' 
                  : 'space-y-2.5'
              } ${readOnly ? 'pointer-events-none' : ''}`}
            >
              {/* Existing Actions - with Drag & Drop */}
              {actions.map((action, index) => (
                <DraggableActionItem
                  key={action.id}
                  action={action}
                  index={index}
                  readOnly={readOnly}
                  gridLayout={gridLayout}
                  onMove={handleReorderActions}
                  onToggle={toggleAction}
                  onRemove={removeAction}
                />
              ))}
            
            {/* Add More Button - as grid/list item */}
            {!readOnly && actions.length > 0 && actions.length < MAX_ACTIONS && (
              <div className={`flex items-center ${gridLayout ? 'break-inside-avoid' : ''} opacity-0 group-hover/actions:opacity-100 transition-opacity`}>
                <Popover 
                  open={addMenuOpen}
                  onOpenChange={(open) => {
                    setAddMenuOpen(open);
                    if (!open) {
                      setAddMenuView('menu');
                      setNewActionName('');
                    } else {
                      setAddMenuView('menu');
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add More</span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent 
                    className={addMenuView === 'menu' ? 'w-48 p-2' : 'w-64 p-0'}
                    align="start"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {addMenuView === 'menu' && (
                      <div className="space-y-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAddMenuView('actions');
                          }}
                          className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors flex items-center gap-2"
                        >
                          <Plus className="h-3 w-3" />
                          Add Actions
                        </button>
                        {workflows.length > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAddMenuView('workflow');
                            }}
                            className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-accent transition-colors flex items-center gap-2"
                          >
                            <WorkflowIcon className="h-3 w-3" />
                            Add Workflow
                          </button>
                        )}
                      </div>
                    )}
                    
                    {addMenuView === 'actions' && (
                      <Command>
                        <CommandInput 
                          placeholder="Search or type new action..." 
                          value={newActionName}
                          onValueChange={setNewActionName}
                        />
                        <CommandList>
                          <CommandEmpty>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="w-full justify-start text-xs"
                              onClick={() => {
                                if (newActionName.trim()) {
                                  handleAddActionFromMenu(newActionName);
                                }
                              }}
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              Create "{newActionName}"
                            </Button>
                          </CommandEmpty>
                          <CommandGroup heading="Presets">
                            {presets.map((preset) => (
                              <CommandItem
                                key={preset}
                                onSelect={() => handleAddActionFromMenu(preset)}
                                className="text-xs"
                              >
                                {preset}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    )}
                    
                    {addMenuView === 'workflow' && (
                      <Command>
                        <CommandInput placeholder="Search workflows..." />
                        <CommandList>
                          <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
                            No workflows found
                          </CommandEmpty>
                          <CommandGroup heading="Available Workflows">
                            {workflows
                              .filter(w => w.actions.length <= MAX_ACTIONS)
                              .map((workflow) => (
                                <CommandItem
                                  key={workflow.id}
                                  onSelect={() => handleAddWorkflowFromMenu(workflow.actions)}
                                  className="text-xs flex-col items-start gap-1 py-2"
                                >
                                  <span className="font-medium">{workflow.name}</span>
                                  <span className="text-muted-foreground">
                                    {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
                                    {workflow.assignedTypes && workflow.assignedTypes.length > 0 && (
                                      <> • {workflow.assignedTypes.join(', ')}</>
                                    )}
                                  </span>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    )}
                  </PopoverContent>
                </Popover>
              </div>
            )}
            </div>
          </DndProvider>
          
          {/* Utility Buttons - Separate row, right-aligned, hover-only */}
          {!readOnly && actions.length > 0 && (
            <div className="flex items-center justify-end gap-1.5 mt-1.5 opacity-0 group-hover/actions:opacity-100 transition-opacity">
              <button
                onClick={resetAllCheckboxes}
                className="h-6 w-6 rounded hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Reset all checkboxes"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              
              <button
                onClick={() => setShowClearAllDialog(true)}
                className="h-6 w-6 rounded hover:bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
                title="Clear all actions"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all actions?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete all {actions.length} action{actions.length !== 1 ? 's' : ''} from this asset. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={clearAllActions}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Clear All
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Replace existing actions?</AlertDialogTitle>
              <AlertDialogDescription>
                This asset already has {actions.length} action{actions.length !== 1 ? 's' : ''}. 
                Adding a workflow will replace them with {pendingWorkflowActions.length} new action{pendingWorkflowActions.length !== 1 ? 's' : ''} from the workflow. 
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelReplaceWithWorkflow}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmReplaceWithWorkflow}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Replace Actions
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.length > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{calculateProgress()}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>
      )}

      <div 
        className={gridLayout ? 'columns-1 md:columns-2 gap-x-3 space-y-1.5' : 'space-y-2'}
        style={gridLayout ? { columnGap: '0.75rem' } : undefined}
      >
        {actions.map(action => (
          <div 
            key={action.id} 
            className={`flex items-center gap-2 group ${action.wasAutoChecked ? 'opacity-60' : ''} ${gridLayout ? 'break-inside-avoid' : ''}`}
          >
            {!readOnly ? (
              <Checkbox
                checked={action.completed}
                onCheckedChange={() => toggleAction(action.id)}
                className="shrink-0"
              />
            ) : (
              <div className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center opacity-40 ${
                action.completed ? 'bg-muted-foreground border-muted-foreground' : 'border-muted-foreground'
              }`}>
                {action.completed && <Check className="h-3 w-3 text-background" />}
              </div>
            )}
            
            {editingId === action.id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEdit(action.id);
                    if (e.key === 'Escape') cancelEdit();
                  }}
                  className="h-8 text-sm"
                  autoFocus
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => saveEdit(action.id)}
                  className="h-8 w-8 p-0"
                >
                  <Check className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelEdit}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <>
                <span className={`flex-1 text-sm truncate ${action.completed ? 'line-through text-muted-foreground' : ''}`}>
                  {action.name}
                </span>
                {!readOnly && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => startEditing(action)}
                      className="h-7 w-7 p-0"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeAction(action.id)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div className="flex gap-2">
          <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 justify-start gap-2 text-muted-foreground"
                disabled={actions.length >= MAX_ACTIONS}
              >
                <Plus className="h-4 w-4" />
                Add Action
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput 
                  placeholder="Type action name or select preset..." 
                  value={newActionName}
                  onValueChange={setNewActionName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newActionName.trim()) {
                      e.preventDefault();
                      addAction(newActionName);
                    }
                  }}
                />
                <CommandList>
                  {newActionName && (
                    <CommandEmpty>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => addAction(newActionName)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create "{newActionName}"
                      </Button>
                    </CommandEmpty>
                  )}
                  {presets.length > 0 && (
                    <CommandGroup heading="Presets">
                      {presets.map((preset) => (
                        <CommandItem
                          key={preset}
                          onSelect={() => addAction(preset)}
                        >
                          {preset}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {workflows.length > 0 && (
            <Popover open={workflowPopoverOpen} onOpenChange={setWorkflowPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 justify-start gap-2 text-muted-foreground"
                >
                  <WorkflowIcon className="h-4 w-4" />
                  Add Workflow
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search workflows..." />
                  <CommandList>
                    <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                      No workflows found
                    </CommandEmpty>
                    <CommandGroup heading="Available Workflows">
                      {workflows
                        .filter(w => w.actions.length <= MAX_ACTIONS)
                        .map((workflow) => (
                          <CommandItem
                            key={workflow.id}
                            onSelect={() => addWorkflowActions(workflow.actions)}
                            className="flex-col items-start gap-1 py-2.5"
                          >
                            <span className="font-medium">{workflow.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
                              {workflow.assignedTypes && workflow.assignedTypes.length > 0 && (
                                <> • {workflow.assignedTypes.join(', ')}</>
                              )}
                            </span>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}

          {actions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowClearAllDialog(true)}
              className="justify-start gap-2 text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Clear All Actions
            </Button>
          )}
        </div>
      )}

      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all actions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all {actions.length} action{actions.length !== 1 ? 's' : ''} from this asset. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAllActions}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showReplaceDialog} onOpenChange={setShowReplaceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Replace existing actions?</AlertDialogTitle>
            <AlertDialogDescription>
              This asset already has {actions.length} action{actions.length !== 1 ? 's' : ''}. 
              Adding a workflow will replace them with {pendingWorkflowActions.length} new action{pendingWorkflowActions.length !== 1 ? 's' : ''} from the workflow. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelReplaceWithWorkflow}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReplaceWithWorkflow}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Replace Actions
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
