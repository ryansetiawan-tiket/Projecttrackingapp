import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DatePickerWithToday } from './DatePickerWithToday';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { SelectGroup, SelectLabel, SelectSeparator } from './ui/select';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Plus, Trash2, ChevronDown, Calendar, User, CheckSquare, Users, X, Edit2, Save, Workflow as WorkflowIcon, Building2, GripVertical, Copy } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from './ui/command';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { ActionableItem, ProjectType, ProjectCollaborator, ProjectStatus, AssetAction } from '../types/project';
import { getTypeColor } from '../utils/typeColors';
import { useColors } from './ColorContext';
import { useStatusContext } from './StatusContext';
import { useWorkflows } from './WorkflowContext';
import { useActionPresets } from './ActionPresetContext';
import { useTeams } from '../hooks/useTeams';
import { Clock, Target, AlertCircle } from 'lucide-react';
import { AssetActionManager } from './AssetActionManager';
import { calculateAssetProgress, getProgressColorValue } from '../utils/taskProgress';
import { getAllTeamMemberIds, getSubteamMemberIds, getCollaboratorsFromIds } from '../utils/teamUtils';
import { useDrag, useDrop } from 'react-dnd';
import { toast } from 'sonner@2.0.3';

interface ActionableItemManagerProps {
  actionableItems: ActionableItem[];
  projectCollaborators: ProjectCollaborator[]; // Collaborators already in this project
  globalCollaborators: ProjectCollaborator[]; // All available collaborators
  onActionableItemsChange: (items: ActionableItem[], triggeredStatus?: string) => void; // ⚡ NEW: Pass triggered status to prevent override
  onProjectCollaboratorsChange?: (collaborators: ProjectCollaborator[]) => void;
  onAllItemsCompleted?: () => void;
  onProjectStatusChange?: (newStatus: string) => void; // DEPRECATED: Use triggeredStatus param instead
}

interface ActionableItemFormData {
  title: string;
  type?: ProjectType;
  illustration_type?: string;
  collaborators: ProjectCollaborator[];
  start_date: string;
  due_date: string;
  status: ProjectStatus;
  actions?: AssetAction[]; // NEW: Actions for the asset
}

const MAX_ACTIONS = 12;

// Remove static types - will use dynamic types from useColors

// Draggable Action Item Component
interface DraggableActionItemProps {
  action: AssetAction;
  index: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string, completed: boolean) => void;
  idPrefix: string;
}

const DraggableActionItem = ({ action, index, onMove, onRemove, onToggle, idPrefix }: DraggableActionItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag, preview] = useDrag({
    type: 'ACTION_ITEM',
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: 'ACTION_ITEM',
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
      className={`flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 transition-all ${
        isDragging ? 'opacity-50 scale-95' : 'hover:bg-accent/50'
      } ${isOver ? 'border-primary' : ''}`}
      style={{ cursor: isDragging ? 'grabbing' : 'default' }}
    >
      <div
        ref={drag}
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground transition-colors"
      >
        <GripVertical className="h-4 w-4" />
      </div>
      <Checkbox
        id={`${idPrefix}-${action.id}`}
        checked={action.completed || false}
        onCheckedChange={(checked) => onToggle(action.id, checked as boolean)}
        className="h-4 w-4"
      />
      <label
        htmlFor={`${idPrefix}-${action.id}`}
        className={`text-xs flex-1 ${
          action.completed ? 'line-through text-muted-foreground' : ''
        }`}
      >
        {action.name}
      </label>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(action.id)}
        className="h-5 w-5 p-0 hover:bg-destructive hover:text-destructive-foreground shrink-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
};

export function ActionableItemManager({ 
  actionableItems, 
  projectCollaborators,
  globalCollaborators,
  onActionableItemsChange,
  onProjectCollaboratorsChange,
  onAllItemsCompleted,
  onProjectStatusChange 
}: ActionableItemManagerProps) {
  const { types } = useColors();
  const { statuses, getStatusColor: getStatusColorFromContext, getStatusTextColor, shouldAutoTriggerStatus } = useStatusContext();
  const { workflows, getWorkflowsForType, loading: workflowsLoading } = useWorkflows();
  const { presets } = useActionPresets();
  const { teams, loading: teamsLoading } = useTeams();
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [workflowSelectorOpenForItem, setWorkflowSelectorOpenForItem] = useState<string | null>(null);
  const [actionPopoverOpenForItem, setActionPopoverOpenForItem] = useState<string | null>(null);
  const [workflowPopoverOpenForItem, setWorkflowPopoverOpenForItem] = useState<string | null>(null);
  
  // NEW: States for Add Action in form
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [workflowPopoverOpen, setWorkflowPopoverOpen] = useState(false);
  const [newActionName, setNewActionName] = useState('');
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  
  // NEW: States for Edit Mode
  const [editComboboxOpen, setEditComboboxOpen] = useState(false);
  const [editWorkflowPopoverOpen, setEditWorkflowPopoverOpen] = useState(false);
  const [editNewActionName, setEditNewActionName] = useState('');
  const [showEditClearAllDialog, setShowEditClearAllDialog] = useState(false);
  const [editFormData, setEditFormData] = useState<ActionableItemFormData & { id?: string }>({
    title: '',
    type: undefined,
    illustration_type: undefined,
    collaborators: [],
    start_date: '',
    due_date: '',
    status: 'Not Started',
    actions: []
  });
  
  // ✨ NEW: Track which asset is expanded (accordion behavior)
  // Default to first item expanded
  const [expandedAssetId, setExpandedAssetId] = useState<string | undefined>(() => {
    return actionableItems.length > 0 ? actionableItems[0].id : undefined;
  });
  const [formData, setFormData] = useState<ActionableItemFormData>({
    title: '',
    type: undefined,
    illustration_type: undefined,
    collaborators: [],
    start_date: '',
    due_date: '',
    status: 'Not Started',
    actions: [] // NEW: Initialize with empty actions
  });

  // ⚡ PERFORMANCE: Local state for optimistic updates
  const [localItems, setLocalItems] = useState<ActionableItem[]>(actionableItems);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const previousActionableItemsRef = useRef<ActionableItem[]>(actionableItems);
  const isSelfUpdateRef = useRef<boolean>(false); // ✅ NEW: Track if update came from this component
  
  // Sync local state with props - with deep comparison
  useEffect(() => {
    // ⚡ CRITICAL FIX: Skip update if it came from our own changes
    if (isSelfUpdateRef.current) {
      console.log('[ActionableItemManager] 🛑 Skipping props sync - self-initiated update');
      isSelfUpdateRef.current = false; // Reset flag
      return;
    }
    
    // Helper to deeply compare action arrays
    const areActionsEqual = (actions1: any[], actions2: any[]) => {
      if (actions1.length !== actions2.length) return false;
      return actions1.every((a1, idx) => {
        const a2 = actions2[idx];
        return a2 && 
               a1.id === a2.id && 
               a1.name === a2.name && 
               a1.completed === a2.completed;
      });
    };
    
    // Helper to deeply compare items
    const areItemsEqual = (items1: ActionableItem[], items2: ActionableItem[]) => {
      if (items1.length !== items2.length) return false;
      
      // Sort both arrays by id to ensure consistent comparison
      const sorted1 = [...items1].sort((a, b) => a.id.localeCompare(b.id));
      const sorted2 = [...items2].sort((a, b) => a.id.localeCompare(b.id));
      
      return sorted1.every((item1, idx) => {
        const item2 = sorted2[idx];
        if (!item2 || item1.id !== item2.id) return false;
        
        // Compare basic properties
        if (item1.title !== item2.title ||
            item1.type !== item2.type ||
            item1.status !== item2.status ||
            item1.is_completed !== item2.is_completed ||
            item1.illustration_type !== item2.illustration_type) {
          return false;
        }
        
        // Compare actions
        const actions1 = item1.actions || [];
        const actions2 = item2.actions || [];
        return areActionsEqual(actions1, actions2);
      });
    };
    
    // Only update if items actually changed
    if (!areItemsEqual(previousActionableItemsRef.current, actionableItems)) {
      console.log('[ActionableItemManager] Props changed, updating local state');
      setLocalItems(actionableItems);
      previousActionableItemsRef.current = actionableItems;
      
      // ✨ Auto-expand first item if no item is expanded
      if (actionableItems.length > 0 && !expandedAssetId) {
        setExpandedAssetId(actionableItems[0].id);
      }
    }
  }, [actionableItems]); // ✅ FIX: Removed expandedAssetId from dependency array to prevent infinite loop
  
  // ⚡ PERFORMANCE: Debounced sync to parent (for database saves)
  const syncToParentDebounced = useCallback((items: ActionableItem[]) => {
    // Clear pending update
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
    }
    
    // Schedule sync after delay
    pendingUpdateRef.current = setTimeout(() => {
      console.log('[ActionableItemManager] 💾 Syncing to database...');
      isSelfUpdateRef.current = true; // ✅ Mark as self-update
      onActionableItemsChange(items);
    }, 300); // ✅ Increased to 300ms for better batching
  }, [onActionableItemsChange]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
        // Flush any pending updates on unmount
        if (localItems.length > 0) {
          isSelfUpdateRef.current = true; // ✅ Mark as self-update
          onActionableItemsChange(localItems);
        }
      }
    };
  }, [localItems, onActionableItemsChange]);

  const statusOptions: ProjectStatus[] = [
    'Not Started',
    'In Progress',
    'Babysit',
    'Done',
    'On Hold',
    'Canceled',
    'On List Lightroom',
    'On Review'
  ];

  const getStatusColor = (status: ProjectStatus) => {
    switch (status) {
      case 'Done':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'In Progress':
        return 'bg-[#FFE5A0] text-[#8B6914] border-[#FFD666]';
      case 'Babysit':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'On Hold':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Canceled':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'On List Lightroom':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'On Review':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: ProjectStatus) => {
    switch (status) {
      case 'In Progress':
        return <Clock className="h-3 w-3" />;
      case 'Done':
        return <Target className="h-3 w-3" />;
      case 'On Hold':
      case 'Babysit':
        return <AlertCircle className="h-3 w-3" />;
      default:
        return null;
    }
  };

  const completedCount = localItems.filter(item => item.status === 'Done' || item.is_completed).length;
  const totalCount = localItems.length;
  const allCompleted = totalCount > 0 && completedCount === totalCount;

  const handleAddActionableItem = (workflowActions?: string[]) => {
    if (!formData.title.trim()) return;

    // Use actions from formData if no workflow actions provided
    const assetActions: AssetAction[] = workflowActions && Array.isArray(workflowActions)
      ? workflowActions.map((actionName, index) => ({
          id: `action-${Date.now()}-${index}`,
          name: actionName,
          completed: false
        }))
      : (formData.actions || []);

    const newItem: ActionableItem = {
      id: Date.now().toString(),
      title: formData.title,
      type: formData.type,
      illustration_type: formData.illustration_type,
      collaborators: formData.collaborators,
      // Keep backward compatibility
      collaborator: formData.collaborators.length > 0 ? formData.collaborators[0] : undefined,
      start_date: formData.start_date || undefined,
      due_date: formData.due_date || undefined,
      status: formData.status,
      is_completed: formData.status === 'Done', // Auto-set based on status
      actions: assetActions, // Use workflow actions if provided, otherwise use formData actions
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // ⚡ OPTIMISTIC: Update local state immediately
    const updatedItems = [...localItems, newItem];
    setLocalItems(updatedItems);
    
    // Sync to parent immediately for new items (no debounce needed)
    isSelfUpdateRef.current = true; // ✅ Mark as self-update
    onActionableItemsChange(updatedItems);
    
    setFormData({
      title: '',
      type: undefined,
      illustration_type: undefined,
      collaborators: [],
      start_date: '',
      due_date: '',
      status: 'Not Started',
      actions: []
    });
    setIsAddingNew(false);
  };

  // NEW: Add action to form
  const addActionToForm = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    const currentActions = formData.actions || [];
    if (currentActions.length >= MAX_ACTIONS) return;

    const newAction: AssetAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: trimmed,
      completed: false
    };

    setFormData({ ...formData, actions: [...currentActions, newAction] });
    setNewActionName('');
    setComboboxOpen(false);
  };

  // NEW: Add workflow actions to form
  const addWorkflowActionsToForm = (workflowActions: string[]) => {
    const newActions: AssetAction[] = workflowActions.map((name, index) => ({
      id: `action_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      completed: false
    }));

    setFormData({ ...formData, actions: newActions });
    setWorkflowPopoverOpen(false);
  };

  // NEW: Remove action from form
  const removeActionFromForm = (actionId: string) => {
    const currentActions = formData.actions || [];
    setFormData({ 
      ...formData, 
      actions: currentActions.filter(a => a.id !== actionId) 
    });
  };

  // NEW: Clear all actions from form
  const clearAllActionsFromForm = () => {
    setFormData({ ...formData, actions: [] });
    setShowClearAllDialog(false);
  };

  // NEW: Reorder actions in form
  const handleReorderFormActions = (fromIndex: number, toIndex: number) => {
    const currentActions = [...(formData.actions || [])];
    const [movedItem] = currentActions.splice(fromIndex, 1);
    currentActions.splice(toIndex, 0, movedItem);
    setFormData({ ...formData, actions: currentActions });
  };

  // NEW: Toggle action completion in form
  const handleToggleFormAction = (actionId: string, completed: boolean) => {
    const updatedActions = formData.actions?.map(a =>
      a.id === actionId ? { ...a, completed } : a
    ) || [];
    setFormData({ ...formData, actions: updatedActions });
  };

  // ========== EDIT MODE FUNCTIONS ==========
  
  // NEW: Add action to edit form
  const addActionToEditForm = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    
    const currentActions = editFormData.actions || [];
    if (currentActions.length >= MAX_ACTIONS) return;

    const newAction: AssetAction = {
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: trimmed,
      completed: false
    };

    setEditFormData({ ...editFormData, actions: [...currentActions, newAction] });
    setEditNewActionName('');
    setEditComboboxOpen(false);
  };

  // NEW: Add workflow actions to edit form
  const addWorkflowActionsToEditForm = (workflowActions: string[]) => {
    const newActions: AssetAction[] = workflowActions.map((name, index) => ({
      id: `action_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      completed: false
    }));

    setEditFormData({ ...editFormData, actions: newActions });
    setEditWorkflowPopoverOpen(false);
  };

  // NEW: Remove action from edit form
  const removeActionFromEditForm = (actionId: string) => {
    const currentActions = editFormData.actions || [];
    setEditFormData({ 
      ...editFormData, 
      actions: currentActions.filter(a => a.id !== actionId) 
    });
  };

  // NEW: Clear all actions from edit form
  const clearAllActionsFromEditForm = () => {
    setEditFormData({ ...editFormData, actions: [] });
    setShowEditClearAllDialog(false);
  };

  // NEW: Reorder actions in edit form
  const handleReorderEditActions = (fromIndex: number, toIndex: number) => {
    const currentActions = [...(editFormData.actions || [])];
    const [movedItem] = currentActions.splice(fromIndex, 1);
    currentActions.splice(toIndex, 0, movedItem);
    setEditFormData({ ...editFormData, actions: currentActions });
  };

  // NEW: Toggle action completion in edit form
  const handleToggleEditAction = (actionId: string, completed: boolean) => {
    const updatedActions = editFormData.actions?.map(a =>
      a.id === actionId ? { ...a, completed } : a
    ) || [];
    setEditFormData({ ...editFormData, actions: updatedActions });
  };

  // NEW: Start editing an item
  const handleStartEdit = (item: ActionableItem) => {
    setEditFormData({
      id: item.id,
      title: item.title,
      type: item.type,
      illustration_type: item.illustration_type,
      collaborators: item.collaborators || [],
      start_date: item.start_date || '',
      due_date: item.due_date || '',
      status: item.status,
      actions: item.actions || []
    });
    setEditingItemId(item.id);
  };

  // NEW: Save edited item
  const handleSaveEdit = () => {
    if (!editFormData.id || !editFormData.title.trim()) return;

    const updatedItems = localItems.map(item =>
      item.id === editFormData.id
        ? {
            ...item,
            title: editFormData.title,
            type: editFormData.type,
            illustration_type: editFormData.illustration_type,
            collaborators: editFormData.collaborators,
            start_date: editFormData.start_date || undefined,
            due_date: editFormData.due_date || undefined,
            status: editFormData.status,
            actions: editFormData.actions || [],
            updated_at: new Date().toISOString()
          }
        : item
    );

    setLocalItems(updatedItems);
    isSelfUpdateRef.current = true; // ✅ Mark as self-update
    onActionableItemsChange(updatedItems);
    setEditingItemId(null);
    
    // Reset edit form
    setEditFormData({
      title: '',
      type: undefined,
      illustration_type: undefined,
      collaborators: [],
      start_date: '',
      due_date: '',
      status: 'Not Started',
      actions: []
    });
  };

  // NEW: Cancel editing
  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditFormData({
      title: '',
      type: undefined,
      illustration_type: undefined,
      collaborators: [],
      start_date: '',
      due_date: '',
      status: 'Not Started',
      actions: []
    });
  };

  // NEW: Handle type change in edit mode
  const handleEditTypeChange = (newType: ProjectType | undefined) => {
    setEditFormData({ ...editFormData, type: newType });
  };

  // NEW: Add collaborator to edit form
  const handleAddCollaboratorToEditForm = (collaborator: ProjectCollaborator) => {
    if (!editFormData.collaborators.some(c => c.id === collaborator.id)) {
      setEditFormData({
        ...editFormData,
        collaborators: [...editFormData.collaborators, collaborator]
      });
      ensureCollaboratorInProject(collaborator);
    }
  };

  // NEW: Remove collaborator from edit form
  const handleRemoveCollaboratorFromEditForm = (collaboratorId: string) => {
    setEditFormData({
      ...editFormData,
      collaborators: editFormData.collaborators.filter(c => c.id !== collaboratorId)
    });
  };

  // Auto-populate workflow when type is selected
  const handleTypeChange = (newType: ProjectType | undefined) => {
    const prevType = formData.type;
    setFormData({ ...formData, type: newType });
    
    // Check if there are workflows assigned to this type
    if (newType && newType !== prevType) {
      const typeWorkflows = getWorkflowsForType(newType);
      if (typeWorkflows.length > 0) {
        console.log(`Type "${newType}" has ${typeWorkflows.length} workflow(s) assigned:`, typeWorkflows.map(w => w.name));
      }
    }
  };

  // Get workflows for current form type - memoized to prevent flickering
  const currentTypeWorkflows = useMemo(() => {
    if (!formData.type || workflowsLoading) return [];
    return getWorkflowsForType(formData.type);
  }, [formData.type, getWorkflowsForType, workflowsLoading]);

  const handleDeleteActionableItem = (id: string) => {
    // ⚡ OPTIMISTIC: Update local state immediately
    const updatedItems = localItems.filter(item => item.id !== id);
    setLocalItems(updatedItems);
    
    // Sync to parent immediately for deletions
    isSelfUpdateRef.current = true; // ✅ Mark as self-update
    onActionableItemsChange(updatedItems);
  };

  const handleDuplicateActionableItem = (id: string) => {
    // Find the item to duplicate
    const itemToDuplicate = localItems.find(item => item.id === id);
    if (!itemToDuplicate) return;

    // Create a deep copy of the item with new ID and "(Copy) " prefix
    const duplicatedItem: ActionableItem = {
      ...itemToDuplicate,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 11)}`, // Generate unique ID
      title: `(Copy) ${itemToDuplicate.title}`,
      // Deep copy actions array to avoid reference issues
      actions: itemToDuplicate.actions?.map(action => ({
        ...action,
        id: `action_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`,
        completed: action.completed // Preserve completion status
      })) || [],
      // Deep copy collaborators array
      collaborators: itemToDuplicate.collaborators?.map(collab => ({ ...collab })) || [],
      // Reset timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      // Preserve all other fields
      is_completed: itemToDuplicate.is_completed,
      status: itemToDuplicate.status,
      type: itemToDuplicate.type,
      illustration_type: itemToDuplicate.illustration_type,
      start_date: itemToDuplicate.start_date,
      due_date: itemToDuplicate.due_date
    };

    // Find the index of the original item
    const originalIndex = localItems.findIndex(item => item.id === id);
    
    // Insert duplicated item right after the original
    const updatedItems = [...localItems];
    updatedItems.splice(originalIndex + 1, 0, duplicatedItem);
    
    // ⚡ OPTIMISTIC: Update local state immediately
    setLocalItems(updatedItems);
    
    // Sync to parent immediately
    isSelfUpdateRef.current = true; // ✅ Mark as self-update
    onActionableItemsChange(updatedItems);

    // Auto-expand the duplicated item
    setExpandedAssetId(duplicatedItem.id);

    // Ensure all collaborators are in project
    duplicatedItem.collaborators?.forEach(collab => {
      ensureCollaboratorInProject(collab);
    });

    // Show success notification
    toast.success(`Asset duplicated successfully: "${duplicatedItem.title}"`);
  };

  const ensureCollaboratorInProject = (collaborator: ProjectCollaborator) => {
    // Check if collaborator is already in project - use both ID and name for safety
    const isInProject = projectCollaborators.some(c => 
      String(c.id) === String(collaborator.id) || 
      (c.name === collaborator.name && c.role === collaborator.role)
    );
    
    console.log('🔍 ensureCollaboratorInProject:', {
      collaborator: { id: collaborator.id, name: collaborator.name, role: collaborator.role },
      isInProject,
      projectCollaborators: projectCollaborators.map(c => ({ id: c.id, name: c.name, role: c.role })),
      hasCallback: !!onProjectCollaboratorsChange
    });
    
    // If not in project, add them
    if (!isInProject && onProjectCollaboratorsChange) {
      const newCollaborators = [...projectCollaborators, collaborator];
      console.log('✅ Adding collaborator to project:', collaborator.name);
      console.log('📊 Project collaborators before:', projectCollaborators.length, 'after:', newCollaborators.length);
      
      // Call the callback to update state
      onProjectCollaboratorsChange(newCollaborators);
      
      console.log('🔄 State update callback called');
    } else if (isInProject) {
      console.log('ℹ️ Collaborator already in project:', collaborator.name);
    } else {
      console.log('❌ No callback function provided');
    }
  };



  const handleToggleCompletion = (id: string) => {
    const updatedItems = localItems.map(item => {
      if (item.id === id) {
        const newIsCompleted = !item.is_completed;
        const newStatus = newIsCompleted ? 'Done' : 'Not Started';
        return { 
          ...item, 
          is_completed: newIsCompleted, 
          status: newStatus
          // Don't set updated_at - parent will handle it on save
        };
      }
      return item;
    });
    
    // ⚡ OPTIMISTIC: Update local state immediately
    setLocalItems(updatedItems);
    
    // ⚡ CRITICAL: Clear any pending debounced updates
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
      pendingUpdateRef.current = null;
    }
    
    // Sync to parent immediately
    isSelfUpdateRef.current = true; // ✅ Mark as self-update
    onActionableItemsChange(updatedItems);
    
    // Check if all items are now completed
    const newCompletedCount = updatedItems.filter(item => item.is_completed).length;
    if (newCompletedCount === updatedItems.length && updatedItems.length > 0 && onAllItemsCompleted) {
      onAllItemsCompleted();
    }
  };

  const handleStatusChange = (id: string, newStatus: ProjectStatus) => {
    const updatedItems = localItems.map(item => 
      item.id === id 
        ? { 
            ...item, 
            status: newStatus,
            is_completed: newStatus === 'Done' // Auto-sync with is_completed
            // Don't set updated_at - parent will handle it on save
          }
        : item
    );
    
    // ⚡ OPTIMISTIC: Update local state immediately
    setLocalItems(updatedItems);
    
    // ⚡ CRITICAL: Clear any pending debounced updates
    if (pendingUpdateRef.current) {
      clearTimeout(pendingUpdateRef.current);
      pendingUpdateRef.current = null;
    }
    
    // Sync to parent immediately
    isSelfUpdateRef.current = true; // ✅ Mark as self-update
    onActionableItemsChange(updatedItems);
    
    // Check if all items are now completed
    const newCompletedCount = updatedItems.filter(item => item.status === 'Done').length;
    if (newCompletedCount === updatedItems.length && updatedItems.length > 0 && onAllItemsCompleted) {
      onAllItemsCompleted();
    }
  };

  const handleUpdateActionableItem = (id: string, updates: Partial<ActionableItem>) => {
    // Check if type is being changed
    if (updates.type !== undefined) {
      const currentItem = localItems.find(item => item.id === id);
      
      // Only auto-populate if type is actually changing
      if (currentItem && currentItem.type !== updates.type) {
        // Get workflows for the new type
        const typeWorkflows = updates.type ? getWorkflowsForType(updates.type) : [];
        
        if (typeWorkflows.length > 0) {
          // Use the first workflow that matches this type
          const workflow = typeWorkflows[0];
          
          // Convert workflow actions to AssetAction format (REPLACE existing actions)
          const newActions: AssetAction[] = workflow.actions.map((actionName, index) => ({
            id: `action-${Date.now()}-${index}`,
            name: actionName,
            completed: false
          }));
          
          // Update with new type AND replace actions
          updates = { ...updates, actions: newActions };
        } else if (updates.type === undefined) {
          // If clearing type, also clear actions
          updates = { ...updates, actions: [] };
        }
      }
    }
    
    // ⚡ OPTIMISTIC UPDATE: Update local state immediately
    const updatedItems = localItems.map(item => 
      item.id === id 
        ? { ...item, ...updates }  // Don't set updated_at - parent will handle it on save
        : item
    );
    
    setLocalItems(updatedItems);
    
    // ⚡ CRITICAL: illustration_type changes need IMMEDIATE sync to update project.types badges
    // Check if illustration_type is being updated
    const isIllustrationTypeChange = updates.illustration_type !== undefined;
    
    if (isIllustrationTypeChange) {
      // Clear any pending debounced updates
      if (pendingUpdateRef.current) {
        clearTimeout(pendingUpdateRef.current);
        pendingUpdateRef.current = null;
      }
      
      // Sync to parent immediately (no delay)
      console.log('[ActionableItemManager] ⚡ Illustration type changed, syncing immediately');
      isSelfUpdateRef.current = true; // ✅ Mark as self-update
      onActionableItemsChange(updatedItems);
    } else {
      // ⚡ DEBOUNCED: Sync to parent (database) after delay
      // This is used for non-critical updates like title changes, etc.
      // NOTE: Action changes bypass this and sync immediately (see AssetActionManager onChange)
      // Self-update flag is set inside syncToParentDebounced
      syncToParentDebounced(updatedItems);
    }
  };

  const handleAddCollaboratorToItem = (itemId: string, collaborator: ProjectCollaborator) => {
    try {
      console.log('📌 [ActionableItemManager] Adding collaborator to item:', { 
        itemId, 
        collaboratorName: collaborator.name, 
        collaboratorId: collaborator.id,
        collaboratorNickname: collaborator.nickname,
        hasPhotoUrl: !!collaborator.photo_url,
        hasProfileUrl: !!collaborator.profile_url
      });
    
    const item = localItems.find(item => item.id === itemId);
    if (!item) {
      console.log('❌ Item not found for id:', itemId);
      return;
    }

    const currentCollaborators = item.collaborators || [];
    if (currentCollaborators.some(c => c.id === collaborator.id)) {
      console.log('⚠️ Collaborator already assigned to this item');
      return; // Already assigned
    }

    console.log('➕ Adding collaborator to item. Current collaborators:', currentCollaborators.length);
    
    // Ensure collaborator is in project
    console.log('🚀 About to call ensureCollaboratorInProject with:', {
      id: collaborator.id,
      name: collaborator.name,
      nickname: collaborator.nickname,
      role: collaborator.role,
      hasPhotoUrl: !!collaborator.photo_url,
      hasProfileUrl: !!collaborator.profile_url
    });
    ensureCollaboratorInProject(collaborator);
    console.log('✅ ensureCollaboratorInProject completed');

    const newCollaborators = [...currentCollaborators, collaborator];
    console.log('💾 Updating item with new collaborators:', newCollaborators.length);
    
    handleUpdateActionableItem(itemId, { 
      collaborators: newCollaborators,
      collaborator: newCollaborators[0] // Keep first one for backward compatibility
    });
    } catch (error) {
      console.error('❌ Error in handleAddCollaboratorToItem:', error);
      console.error('Stack trace:', error.stack);
    }
  };

  // Bulk add multiple collaborators to an item (for team/subteam selection)
  const handleBulkAddCollaboratorsToItem = (itemId: string, collaborators: ProjectCollaborator[]) => {
    try {
      console.log('📦 [ActionableItemManager] Bulk adding collaborators to item:', { 
        itemId, 
        count: collaborators.length,
        collaborators: collaborators.map(c => c.name)
      });
    
      const item = localItems.find(item => item.id === itemId);
      if (!item) {
        console.log('❌ Item not found for id:', itemId);
        return;
      }

      const currentCollaborators = item.collaborators || [];
      
      // Filter out collaborators already assigned
      const newCollaborators = collaborators.filter(
        collab => !currentCollaborators.some(c => c.id === collab.id)
      );
      
      if (newCollaborators.length === 0) {
        console.log('⚠️ All collaborators already assigned to this item');
        return;
      }

      console.log('➕ Adding', newCollaborators.length, 'new collaborators to item');
      
      // Ensure all collaborators are in project
      newCollaborators.forEach(collab => {
        ensureCollaboratorInProject(collab);
      });

      const updatedCollaborators = [...currentCollaborators, ...newCollaborators];
      console.log('💾 Updating item with new collaborators. Before:', currentCollaborators.length, 'After:', updatedCollaborators.length);
      
      handleUpdateActionableItem(itemId, { 
        collaborators: updatedCollaborators,
        collaborator: updatedCollaborators[0] // Keep first one for backward compatibility
      });
    } catch (error) {
      console.error('❌ Error in handleBulkAddCollaboratorsToItem:', error);
      console.error('Stack trace:', error.stack);
    }
  };

  const handleRemoveCollaboratorFromItem = (itemId: string, collaboratorId: string) => {
    const item = localItems.find(item => item.id === itemId);
    if (!item) return;

    const newCollaborators = (item.collaborators || []).filter(c => c.id !== collaboratorId);
    handleUpdateActionableItem(itemId, { 
      collaborators: newCollaborators,
      collaborator: newCollaborators.length > 0 ? newCollaborators[0] : undefined
    });
  };

  const handleAddCollaboratorToForm = (collaborator: ProjectCollaborator) => {
    if (formData.collaborators.some(c => c.id === collaborator.id)) return; // Already added
    
    // Ensure collaborator is in project
    ensureCollaboratorInProject(collaborator);
    
    setFormData({ 
      ...formData, 
      collaborators: [...formData.collaborators, collaborator] 
    });
  };

  const handleRemoveCollaboratorFromForm = (collaboratorId: string) => {
    setFormData({ 
      ...formData, 
      collaborators: formData.collaborators.filter(c => c.id !== collaboratorId) 
    });
  };

  // Helper function to get all collaborators for an item (with backward compatibility)
  const getItemCollaborators = (item: ActionableItem): ProjectCollaborator[] => {
    if (item.collaborators && item.collaborators.length > 0) {
      return item.collaborators;
    }
    return item.collaborator ? [item.collaborator] : [];
  };

  const getProgressText = () => {
    if (totalCount === 0) return 'No items';
    return `${completedCount}/${totalCount} completed`;
  };

  const getProgressPercentage = () => {
    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  };

  // Auto expand if there are tasks
  useEffect(() => {
    if (actionableItems.length > 0 && !isOpen) {
      setIsOpen(true);
    }
  }, [actionableItems.length]);

  // ✅ FIX: Auto-expand accordion when in edit mode
  useEffect(() => {
    if (editingItemId && expandedAssetId !== editingItemId) {
      setExpandedAssetId(editingItemId);
    }
  }, [editingItemId, expandedAssetId]);

  return (
    <div className="space-y-3">
      {/* Header with Add Button (Always Visible) */}
      <div className="flex items-center justify-between gap-2">
        <Collapsible open={isOpen} onOpenChange={setIsOpen} className="flex-1">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between text-sm hover:bg-muted"
            >
              <div className="flex items-center gap-2">
                <CheckSquare className={`h-4 w-4 ${allCompleted ? 'text-green-600' : 'text-muted-foreground'}`} />
                <span>Assets</span>
                {/* Only show progress badge when there are items */}
                {totalCount > 0 && (
                  <Badge variant="outline" className={`text-xs ${allCompleted ? 'bg-green-50 text-green-700 border-green-200' : ''}`}>
                    {getProgressText()}
                  </Badge>
                )}
              </div>
              {/* Only show chevron when there are items to expand */}
              {totalCount > 0 && (
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              )}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-3 mt-3">
          {/* Progress Bar */}
          {totalCount > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${getProgressPercentage()}%`,
                    backgroundColor: getProgressColorValue(getProgressPercentage())
                  }}
                />
              </div>
            </div>
          )}

          {/* Actionable Items List - Accordion Style */}
          <Accordion 
            type="single" 
            collapsible 
            value={expandedAssetId}
            onValueChange={setExpandedAssetId}
            className="space-y-3"
          >
          {localItems.map((item) => {
            const isEditing = editingItemId === item.id;
            const hasActions = item.actions && item.actions.length > 0;
            
            return (
            <AccordionItem 
              key={item.id} 
              value={item.id}
              className={`border-l-4 border rounded-lg ${item.is_completed ? 'opacity-75 bg-muted/20' : 'bg-card'} !border-b-0`}
              style={{ 
                borderLeftColor: item.type ? getTypeColor(item.type) : '#6b7280'
              }}
            >
              {/* ✨ Accordion Header - Always Visible */}
              <div className="px-4 pt-4">
                <div className="flex items-start gap-3">
                  {/* Checkbox outside AccordionTrigger to avoid button nesting */}
                  <Checkbox
                    checked={item.is_completed}
                    onCheckedChange={() => handleToggleCompletion(item.id)}
                    className="mt-1 shrink-0"
                  />
                  
                  <AccordionTrigger 
                    className="hover:no-underline py-0 pb-3 flex-1"
                    onKeyDown={(e) => {
                      // ✅ FIX: Prevent spacebar from toggling accordion
                      if (e.key === ' ') {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="flex items-start justify-between gap-3 w-full pr-2">
                      <div className="flex-1 min-w-0 space-y-2">
                        {/* ✅ FIX: Display title as text only, editing happens in AccordionContent */}
                        <h4 className={`text-sm truncate text-left ${item.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </h4>
                        
                        {/* Mini badges and progress in header */}
                        {!isEditing && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Action Progress Mini (x/y) */}
                            {hasActions && (() => {
                              const assetProgress = calculateAssetProgress(item.actions || []);
                              const completedActions = (item.actions || []).filter(a => a.completed).length;
                              const totalActions = (item.actions || []).length;
                              return (
                                <Badge 
                                  variant="secondary"
                                  className="text-xs h-5 px-1.5 bg-primary/5 text-primary border-primary/20"
                                >
                                  {completedActions}/{totalActions}
                                </Badge>
                              );
                            })()}
                            
                            {/* Illustration Type Badge */}
                            {item.illustration_type && (
                              <Badge 
                                variant="outline"
                                className="text-[10px] h-4 px-1.5 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800"
                              >
                                {item.illustration_type}
                              </Badge>
                            )}
                            
                            {/* Status Badge */}
                            <Badge 
                              variant="outline" 
                              className="text-xs h-5 px-1.5"
                              style={{
                                backgroundColor: getStatusColorFromContext(item.status || 'Not Started'),
                                color: getStatusTextColor(item.status || 'Not Started'),
                                borderColor: getStatusColorFromContext(item.status || 'Not Started')
                              }}
                            >
                              {item.status || 'Not Started'}
                            </Badge>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isEditing) {
                              handleCancelEdit();
                            } else {
                              handleStartEdit(item);
                            }
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-primary"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicateActionableItem(item.id);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-blue-600"
                          title="Duplicate asset"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteActionableItem(item.id);
                          }}
                          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </AccordionTrigger>
                </div>
              </div>
              
              {/* ✨ Accordion Content - Collapsible */}
              <AccordionContent>
                <div className="px-4 space-y-3">

              {/* ========== EDIT MODE - Full Form ========== */}
              {isEditing ? (
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor={`edit-title-${item.id}`} className="text-xs">Title</Label>
                    <Input
                      id={`edit-title-${item.id}`}
                      value={editFormData.title}
                      onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                      placeholder="What needs to be done?"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`edit-status-${item.id}`} className="text-xs">Status</Label>
                      <Select
                        value={editFormData.status}
                        onValueChange={(value: ProjectStatus) => 
                          setEditFormData({ ...editFormData, status: value })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status} className="text-xs">
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor={`edit-illustration-type-${item.id}`} className="text-xs">Illustration Type (Optional)</Label>
                      <Select
                        value={editFormData.illustration_type || 'none'}
                        onValueChange={(value: string) => 
                          setEditFormData({ ...editFormData, illustration_type: value === 'none' ? undefined : value })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select illustration type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">No type</SelectItem>
                          {types.map((type) => (
                            <SelectItem key={type} value={type} className="text-xs">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Workflow Selector - Edit Mode */}
                  {!workflowsLoading && workflows.length > 0 && (
                    <div className="workflow-container">
                      {/* Type-specific workflows */}
                      <div 
                        className={`workflow-section-transition ${
                          editFormData.type && getWorkflowsForType(editFormData.type).length > 0 
                            ? 'workflow-section-visible' 
                            : 'workflow-section-hidden'
                        }`}
                        style={{ 
                          position: editFormData.type && getWorkflowsForType(editFormData.type).length > 0 ? 'relative' : 'absolute',
                          width: '100%',
                          visibility: editFormData.type && getWorkflowsForType(editFormData.type).length > 0 ? 'visible' : 'hidden'
                        }}
                      >
                        <div className="p-3 border rounded-md bg-primary/5 border-primary/20">
                          <Label className="text-xs font-medium flex items-center gap-1 mb-2">
                            <WorkflowIcon className="h-3 w-3 text-primary" />
                            Available Workflows for {editFormData.type || '...'}
                          </Label>
                          <div className="space-y-1">
                            {editFormData.type && getWorkflowsForType(editFormData.type).length > 0 ? getWorkflowsForType(editFormData.type).map((workflow) => (
                              <Button
                                key={workflow.id}
                                onClick={() => {
                                  addWorkflowActionsToEditForm(workflow.actions);
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full h-auto py-1.5 px-2 text-left justify-start text-xs"
                              >
                                <span className="font-medium">{workflow.name}</span>
                                <span className="text-muted-foreground ml-1">
                                  ({workflow.actions.length} actions)
                                </span>
                              </Button>
                            )) : (
                              <div className="h-8" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Click to add workflow actions to form
                          </p>
                        </div>
                      </div>
                      
                      {/* Generic workflow dropdown */}
                      <div 
                        className={`workflow-section-transition ${
                          !editFormData.type || getWorkflowsForType(editFormData.type || '').length === 0 
                            ? 'workflow-section-visible' 
                            : 'workflow-section-hidden'
                        }`}
                        style={{ 
                          position: !editFormData.type || getWorkflowsForType(editFormData.type || '').length === 0 ? 'relative' : 'absolute',
                          width: '100%',
                          visibility: !editFormData.type || getWorkflowsForType(editFormData.type || '').length === 0 ? 'visible' : 'hidden'
                        }}
                      >
                        <div>
                          <Label htmlFor={`edit-workflow-${item.id}`} className="text-xs flex items-center gap-1">
                            <WorkflowIcon className="h-3 w-3" />
                            Apply Workflow (Optional)
                          </Label>
                          <Select
                            value=""
                            onValueChange={(workflowId: string) => {
                              const workflow = workflows.find(w => w.id === workflowId);
                              if (workflow) {
                                addWorkflowActionsToEditForm(workflow.actions);
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select workflow to apply..." />
                            </SelectTrigger>
                            <SelectContent>
                              {workflows.map((workflow) => (
                                <SelectItem key={workflow.id} value={workflow.id} className="text-xs">
                                  {workflow.name} ({workflow.actions.length} actions)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            This will add workflow actions to the form
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Action / Add Workflow Buttons - Edit Mode */}
                  <div className="space-y-2">
                    <Label className="text-xs">Actions (Optional)</Label>
                    
                    {/* Display added actions - 2-Column Checkbox Grid with Drag & Drop */}
                    {editFormData.actions && editFormData.actions.length > 0 && (
                      <div 
                        className="grid grid-cols-2 gap-2 mb-2"
                        style={{
                          gridAutoFlow: 'column',
                          gridTemplateRows: `repeat(${Math.ceil(editFormData.actions.length / 2)}, auto)`
                        }}
                      >
                        {editFormData.actions.map((action, index) => (
                          <DraggableActionItem
                            key={action.id}
                            action={action}
                            index={index}
                            onMove={handleReorderEditActions}
                            onRemove={removeActionFromEditForm}
                            onToggle={handleToggleEditAction}
                            idPrefix="edit-action"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Popover open={editComboboxOpen} onOpenChange={setEditComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 justify-start gap-2 text-xs text-muted-foreground"
                            disabled={(editFormData.actions?.length || 0) >= MAX_ACTIONS}
                          >
                            <Plus className="h-3 w-3" />
                            Add Action
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0" align="start">
                          <Command>
                            <CommandInput 
                              placeholder="Type action name or select preset..." 
                              value={editNewActionName}
                              onValueChange={setEditNewActionName}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && editNewActionName.trim()) {
                                  e.preventDefault();
                                  addActionToEditForm(editNewActionName);
                                }
                              }}
                            />
                            <CommandList>
                              {editNewActionName && (
                                <CommandEmpty>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full justify-start"
                                    onClick={() => addActionToEditForm(editNewActionName)}
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create "{editNewActionName}"
                                  </Button>
                                </CommandEmpty>
                              )}
                              {presets.length > 0 && (
                                <CommandGroup heading="Presets">
                                  {presets.map((preset) => (
                                    <CommandItem
                                      key={preset}
                                      onSelect={() => addActionToEditForm(preset)}
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
                        <Popover open={editWorkflowPopoverOpen} onOpenChange={setEditWorkflowPopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 h-8 justify-start gap-2 text-xs text-muted-foreground"
                            >
                              <WorkflowIcon className="h-3 w-3" />
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
                                        onSelect={() => addWorkflowActionsToEditForm(workflow.actions)}
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

                      {editFormData.actions && editFormData.actions.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowEditClearAllDialog(true)}
                          className="h-8 justify-start gap-2 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    <div>
                      <Label htmlFor={`edit-collaborator-${item.id}`} className="text-xs">Assignees (Optional)</Label>
                      <div className="space-y-2">
                        {/* Selected Assignees */}
                        {editFormData.collaborators.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {editFormData.collaborators.map((collaborator) => (
                              <Badge 
                                key={collaborator.id} 
                                variant="outline" 
                                className="text-xs flex items-center gap-1"
                              >
                                <span>{collaborator.nickname || collaborator.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveCollaboratorFromEditForm(collaborator.id)}
                                  className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        {/* Simple Assignee Dropdown */}
                        <Select
                          value=""
                          onValueChange={(collaboratorId: string) => {
                            const collaborator = globalCollaborators.find(c => c.id === collaboratorId);
                            if (collaborator && !editFormData.collaborators.some(c => c.id === collaboratorId)) {
                              handleAddCollaboratorToEditForm(collaborator);
                            }
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Add assignee..." />
                          </SelectTrigger>
                          <SelectContent>
                            {globalCollaborators
                              .filter(collaborator => !editFormData.collaborators.some(c => c.id === collaborator.id))
                              .map((collaborator) => (
                                <SelectItem key={collaborator.id} value={collaborator.id} className="text-xs">
                                  {collaborator.nickname || collaborator.name} ({collaborator.role})
                                </SelectItem>
                              ))}
                            {globalCollaborators.filter(collaborator => !editFormData.collaborators.some(c => c.id === collaborator.id)).length === 0 && (
                              <SelectItem value="all-assigned" disabled className="text-xs text-muted-foreground">
                                All collaborators assigned
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor={`edit-start-${item.id}`} className="text-xs">Start Date (Optional)</Label>
                      <DatePickerWithToday
                        id={`edit-start-${item.id}`}
                        value={editFormData.start_date}
                        onChange={(value) => setEditFormData({ ...editFormData, start_date: value })}
                        className="h-8 text-xs"
                        placeholder="Select start date"
                      />
                    </div>

                    <div>
                      <Label htmlFor={`edit-due-${item.id}`} className="text-xs">Due Date (Optional)</Label>
                      <DatePickerWithToday
                        id={`edit-due-${item.id}`}
                        value={editFormData.due_date}
                        onChange={(value) => setEditFormData({ ...editFormData, due_date: value })}
                        className="h-8 text-xs"
                        placeholder="Select due date"
                      />
                    </div>
                  </div>

                  {/* Save/Cancel Buttons */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button onClick={handleSaveEdit} size="sm" className="h-8 text-xs flex-1">
                      <Save className="h-3 w-3 mr-1" />
                      Save Changes
                    </Button>
                    <Button 
                      onClick={handleCancelEdit} 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                {/* ========== VIEW MODE - Original Content ========== */}
                {/* Dates */}
                {(item.start_date || item.due_date) && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {item.start_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Start: {new Date(item.start_date).toLocaleDateString()}</span>
                    </div>
                  )}
                  {item.due_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      <span>Due: {new Date(item.due_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Collaborators */}
              {getItemCollaborators(item).length > 0 && (
                <div className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    {getItemCollaborators(item).length === 1 ? (
                      <User className="h-3 w-3" />
                    ) : (
                      <Users className="h-3 w-3" />
                    )}
                    <span>
                      {getItemCollaborators(item).length === 1 ? 'Assignee:' : 'Assignees:'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {getItemCollaborators(item).map((collaborator) => (
                      <Badge 
                        key={collaborator.id} 
                        variant="outline" 
                        className="text-xs flex items-center gap-1"
                      >
                        <span>{collaborator.nickname || collaborator.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveCollaboratorFromItem(item.id, collaborator.id)}
                          className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-2 w-2" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items - 2-Column Grid Layout */}
              {(() => {
                return (
                  <div className="pt-2 border-t space-y-2">
                    {/* Asset Actions - 2-column grid layout */}
                    <AssetActionManager
                      actions={item.actions || []}
                      gridLayout={true}
                      status={item.status}
                      onChange={(actions) => {
                        // 🎯 NEW: Check if any newly MANUALLY checked action should trigger project status change
                        // IMPORTANT: Only manually checked actions trigger status (not auto-checked ones)
                        const previousActions = item.actions || [];
                        const newlyCheckedAction = actions.find((newAction, idx) => {
                          const oldAction = previousActions[idx];
                          // Must be: newly completed AND NOT auto-checked
                          return newAction.completed && 
                                 (!oldAction || !oldAction.completed) && 
                                 !newAction.wasAutoChecked;
                        });
                        
                        // Track if a manual status was triggered
                        let triggeredStatus: string | undefined = undefined;
                        
                        if (newlyCheckedAction && onProjectStatusChange) {
                          const triggerResult = shouldAutoTriggerStatus(newlyCheckedAction.name);
                          if (triggerResult.shouldTrigger && triggerResult.statusName) {
                            console.log(`[ActionableItemManager] ���� Auto-triggering project status to "${triggerResult.statusName}" from MANUALLY checked action "${newlyCheckedAction.name}"`);
                            triggeredStatus = triggerResult.statusName;
                            onProjectStatusChange(triggerResult.statusName);
                          }
                        }
                        
                        // Calculate completion status
                        const completedCount = actions.filter(a => a.completed).length;
                        const totalCount = actions.length;
                        const allCompleted = totalCount > 0 && completedCount === totalCount;
                        const someCompleted = completedCount > 0 && completedCount < totalCount;
                        const noneCompleted = completedCount === 0;
                        
                        // Determine new status based on completion
                        let newStatus = item.status;
                        if (allCompleted) {
                          // 100% → Done
                          newStatus = 'Done';
                        } else if (someCompleted) {
                          // 1-99% → In Progress
                          newStatus = 'In Progress';
                        } else if (noneCompleted && totalCount === 0) {
                          // No actions → keep current status or set to Not Started
                          const notStartedStatus = statuses.find(s => 
                            s.name.toLowerCase() === 'not started' || 
                            s.name.toLowerCase() === 'notstarted' ||
                            s.name.toLowerCase() === 'todo' ||
                            s.name.toLowerCase() === 'to do'
                          );
                          newStatus = notStartedStatus?.name || (statusOptions.length > 0 ? statusOptions[0] : 'Not Started');
                        }
                        
                        // ⚡ CRITICAL FIX: Update parent IMMEDIATELY to prevent visual jumping between groups
                        // The debounce in handleUpdateActionableItem was causing items to briefly
                        // appear in wrong status groups during the 150ms delay
                        const updatedItems = localItems.map(localItem => 
                          localItem.id === item.id 
                            ? { 
                                ...localItem, 
                                actions, 
                                status: newStatus, 
                                is_completed: allCompleted
                                // Don't set updated_at here - parent will handle it on save
                              }
                            : localItem
                        );
                        
                        // Update local state immediately
                        setLocalItems(updatedItems);
                        
                        // ⚡ CRITICAL: Clear any pending debounced updates before immediate sync
                        if (pendingUpdateRef.current) {
                          clearTimeout(pendingUpdateRef.current);
                          pendingUpdateRef.current = null;
                        }
                        
                        // ⚡ CRITICAL: Pass triggeredStatus so parent can respect manual trigger
                        // Sync to parent IMMEDIATELY (no debounce for action changes)
                        // Action changes are user-initiated and infrequent, so immediate sync is fine
                        isSelfUpdateRef.current = true; // ✅ Mark as self-update
                        onActionableItemsChange(updatedItems, triggeredStatus);
                      }}
                      readOnly={false}
                      compact={!isEditing}
                      hideProgress={false}
                    />
                  </div>
                );
              })()}

              {/* Quick Updates */}
              <div className="grid grid-cols-3 gap-2">
                {/* Status Selector */}
                <Select
                  value={item.status || 'Not Started'}
                  onValueChange={(value: ProjectStatus) => handleStatusChange(item.id, value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((status) => (
                      <SelectItem key={status} value={status} className="text-xs">
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Illustration Type Selector */}
                <Select
                  value={item.illustration_type || 'none'}
                  onValueChange={(value: string) => 
                    handleUpdateActionableItem(item.id, { illustration_type: value === 'none' ? undefined : value })
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Illustration type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none" className="text-xs">No type</SelectItem>
                    {types.map((type) => (
                      <SelectItem key={type} value={type} className="text-xs">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Assignee Selector - With Teams & Sub-teams */}
                <Select
                  value=""
                  onValueChange={(value: string) => {
                    // Check if it's a team or sub-team selection
                    if (value.startsWith('team:')) {
                      const teamId = value.replace('team:', '');
                      const team = teams.find(t => t.id === teamId);
                      if (team) {
                        const memberIds = getAllTeamMemberIds(team);
                        const collaboratorsToAdd = getCollaboratorsFromIds(memberIds, globalCollaborators);
                        
                        // Bulk add all team members at once
                        handleBulkAddCollaboratorsToItem(item.id, collaboratorsToAdd);
                      }
                    } else if (value.startsWith('subteam:')) {
                      const [teamId, subteamId] = value.replace('subteam:', '').split('::');
                      const team = teams.find(t => t.id === teamId);
                      if (team) {
                        const memberIds = getSubteamMemberIds(team, subteamId);
                        const collaboratorsToAdd = getCollaboratorsFromIds(memberIds, globalCollaborators);
                        
                        // Bulk add all sub-team members at once
                        handleBulkAddCollaboratorsToItem(item.id, collaboratorsToAdd);
                      }
                    } else {
                      // Regular collaborator selection
                      const collaborator = globalCollaborators.find(c => c.id === value);
                      if (collaborator && !getItemCollaborators(item).some(c => c.id === value)) {
                        handleAddCollaboratorToItem(item.id, collaborator);
                      }
                    }
                  }}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Assign to..." />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Teams & Sub-teams Section */}
                    {!teamsLoading && teams.length > 0 && (
                      <>
                        <SelectGroup>
                          <SelectLabel className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Building2 className="h-3 w-3" />
                            Quick Add Team/Sub-team
                          </SelectLabel>
                          {teams.map((team) => {
                            const teamMemberIds = getAllTeamMemberIds(team);
                            const teamHasMembers = teamMemberIds.length > 0;
                            
                            return (
                              <div key={team.id}>
                                {/* Team-level option */}
                                {teamHasMembers && (
                                  <SelectItem value={`team:${team.id}`} className="text-xs">
                                    <div className="flex items-center gap-1.5">
                                      <Building2 className="h-3 w-3" />
                                      <span>{team.name}</span>
                                      <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                        {teamMemberIds.length}
                                      </Badge>
                                    </div>
                                  </SelectItem>
                                )}
                                
                                {/* Sub-teams */}
                                {team.subteams.map((subteam) => {
                                  const subteamHasMembers = subteam.memberIds.length > 0;
                                  
                                  return subteamHasMembers ? (
                                    <SelectItem 
                                      key={subteam.id} 
                                      value={`subteam:${team.id}::${subteam.id}`} 
                                      className="text-xs pl-8"
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <Users className="h-3 w-3" />
                                        <span>{subteam.name}</span>
                                        <Badge variant="outline" className="text-[10px] h-4 px-1">
                                          {subteam.memberIds.length}
                                        </Badge>
                                      </div>
                                    </SelectItem>
                                  ) : null;
                                })}
                              </div>
                            );
                          })}
                        </SelectGroup>
                        <SelectSeparator />
                      </>
                    )}
                    
                    {/* Individual Collaborators */}
                    <SelectGroup>
                      <SelectLabel className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        Individual Collaborators
                      </SelectLabel>
                      {globalCollaborators
                        .filter(collaborator => !getItemCollaborators(item).some(c => c.id === collaborator.id))
                        .map((collaborator) => (
                          <SelectItem key={collaborator.id} value={collaborator.id} className="text-xs">
                            {collaborator.nickname || collaborator.name} ({collaborator.role})
                          </SelectItem>
                        ))}
                      {globalCollaborators.filter(collaborator => !getItemCollaborators(item).some(c => c.id === collaborator.id)).length === 0 && (
                        <SelectItem value="all-assigned" disabled className="text-xs text-muted-foreground">
                          All collaborators assigned
                        </SelectItem>
                      )}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Workflow Selector - Show when workflow button is clicked */}
              {workflowSelectorOpenForItem === item.id && (
                <div className="pt-2 space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    <WorkflowIcon className="h-3 w-3" />
                    Select Workflow
                  </Label>
                  <div className="space-y-1">
                    {workflows.map((workflow) => (
                      <Button
                        key={workflow.id}
                        onClick={() => {
                          // Add workflow actions to item
                          const workflowActions: AssetAction[] = workflow.actions.map((actionName, index) => ({
                            id: `action-${Date.now()}-${index}`,
                            name: actionName,
                            completed: false
                          }));
                          
                          const updatedItems = localItems.map(localItem =>
                            localItem.id === item.id
                              ? { ...localItem, actions: workflowActions, updated_at: new Date().toISOString() }
                              : localItem
                          );
                          setLocalItems(updatedItems);
                          onActionableItemsChange(updatedItems);
                          setWorkflowSelectorOpenForItem(null);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full h-auto py-2 px-3 text-left justify-start"
                      >
                        <div className="flex flex-col items-start gap-0.5 w-full">
                          <span className="text-xs font-medium">{workflow.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {workflow.actions.length} action{workflow.actions.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={() => setWorkflowSelectorOpenForItem(null)}
                    variant="ghost"
                    size="sm"
                    className="w-full h-7 text-xs"
                  >
                    Cancel
                  </Button>
                </div>
              )}

              </>
              )}
              {/* ========== END OF EDIT/VIEW MODE ========== */}
              
              </div> {/* End of accordion content padding div */}
              </AccordionContent>
            </AccordionItem>
          );
          })}
          </Accordion> {/* End of Accordion wrapper */}

          {/* Add New Form Inside Collapsible (When Adding) */}
          {isAddingNew && (
            <Card className="border-dashed">
                  <CardContent className="pt-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <Label htmlFor="item-title" className="text-xs">Title</Label>
                        <Input
                          id="item-title"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          placeholder="What needs to be done?"
                          className="h-8 text-xs"
                        />
                      </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="item-status" className="text-xs">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value: ProjectStatus) => 
                          setFormData({ ...formData, status: value })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((status) => (
                            <SelectItem key={status} value={status} className="text-xs">
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="item-illustration-type" className="text-xs">Illustration Type (Optional)</Label>
                      <Select
                        value={formData.illustration_type || 'none'}
                        onValueChange={(value: string) => 
                          setFormData({ ...formData, illustration_type: value === 'none' ? undefined : value })
                        }
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Select illustration type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none" className="text-xs">No type</SelectItem>
                          {types.map((type) => (
                            <SelectItem key={type} value={type} className="text-xs">
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Workflow Selector - Single stable container with smooth transitions */}
                  {!workflowsLoading && workflows.length > 0 && (
                    <div className="workflow-container">
                      {/* Type-specific workflows */}
                      <div 
                        className={`workflow-section-transition ${
                          formData.type && currentTypeWorkflows.length > 0 
                            ? 'workflow-section-visible' 
                            : 'workflow-section-hidden'
                        }`}
                        style={{ 
                          position: formData.type && currentTypeWorkflows.length > 0 ? 'relative' : 'absolute',
                          width: '100%',
                          visibility: formData.type && currentTypeWorkflows.length > 0 ? 'visible' : 'hidden'
                        }}
                      >
                        <div className="p-3 border rounded-md bg-primary/5 border-primary/20">
                          <Label className="text-xs font-medium flex items-center gap-1 mb-2">
                            <WorkflowIcon className="h-3 w-3 text-primary" />
                            Available Workflows for {formData.type || '...'}
                          </Label>
                          <div className="space-y-1">
                            {currentTypeWorkflows.length > 0 ? currentTypeWorkflows.map((workflow) => (
                              <Button
                                key={workflow.id}
                                onClick={() => {
                                  addWorkflowActionsToForm(workflow.actions);
                                }}
                                variant="outline"
                                size="sm"
                                className="w-full h-auto py-1.5 px-2 text-left justify-start text-xs"
                              >
                                <span className="font-medium">{workflow.name}</span>
                                <span className="text-muted-foreground ml-1">
                                  ({workflow.actions.length} actions)
                                </span>
                              </Button>
                            )) : (
                              <div className="h-8" /> // Placeholder to maintain height
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Click to add workflow actions to form
                          </p>
                        </div>
                      </div>
                      
                      {/* Generic workflow dropdown */}
                      <div 
                        className={`workflow-section-transition ${
                          !formData.type || currentTypeWorkflows.length === 0 
                            ? 'workflow-section-visible' 
                            : 'workflow-section-hidden'
                        }`}
                        style={{ 
                          position: !formData.type || currentTypeWorkflows.length === 0 ? 'relative' : 'absolute',
                          width: '100%',
                          visibility: !formData.type || currentTypeWorkflows.length === 0 ? 'visible' : 'hidden'
                        }}
                      >
                        <div>
                          <Label htmlFor="item-workflow" className="text-xs flex items-center gap-1">
                            <WorkflowIcon className="h-3 w-3" />
                            Apply Workflow (Optional)
                          </Label>
                          <Select
                            value=""
                            onValueChange={(workflowId: string) => {
                              const workflow = workflows.find(w => w.id === workflowId);
                              if (workflow) {
                                addWorkflowActionsToForm(workflow.actions);
                              }
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Select workflow to apply..." />
                            </SelectTrigger>
                            <SelectContent>
                              {workflows.map((workflow) => (
                                <SelectItem key={workflow.id} value={workflow.id} className="text-xs">
                                  {workflow.name} ({workflow.actions.length} actions)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-muted-foreground mt-1">
                            This will add workflow actions to the form
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Add Action / Add Workflow Buttons */}
                  <div className="space-y-2">
                    <Label className="text-xs">Actions (Optional)</Label>
                    
                    {/* Display added actions - 2-Column Checkbox Grid with Drag & Drop */}
                    {formData.actions && formData.actions.length > 0 && (
                      <div 
                        className="grid grid-cols-2 gap-2 mb-2"
                        style={{
                          gridAutoFlow: 'column',
                          gridTemplateRows: `repeat(${Math.ceil(formData.actions.length / 2)}, auto)`
                        }}
                      >
                        {formData.actions.map((action, index) => (
                          <DraggableActionItem
                            key={action.id}
                            action={action}
                            index={index}
                            onMove={handleReorderFormActions}
                            onRemove={removeActionFromForm}
                            onToggle={handleToggleFormAction}
                            idPrefix="new-action"
                          />
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 h-8 justify-start gap-2 text-xs text-muted-foreground"
                            disabled={(formData.actions?.length || 0) >= MAX_ACTIONS}
                          >
                            <Plus className="h-3 w-3" />
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
                                  addActionToForm(newActionName);
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
                                    onClick={() => addActionToForm(newActionName)}
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
                                      onSelect={() => addActionToForm(preset)}
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
                              className="flex-1 h-8 justify-start gap-2 text-xs text-muted-foreground"
                            >
                              <WorkflowIcon className="h-3 w-3" />
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
                                        onSelect={() => addWorkflowActionsToForm(workflow.actions)}
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

                      {formData.actions && formData.actions.length > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowClearAllDialog(true)}
                          className="h-8 justify-start gap-2 text-xs text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                          Clear All
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">

                    <div>
                      <Label htmlFor="item-collaborator" className="text-xs">Assignees (Optional)</Label>
                      <div className="space-y-2">
                        {/* Selected Assignees */}
                        {formData.collaborators.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {formData.collaborators.map((collaborator) => (
                              <Badge 
                                key={collaborator.id} 
                                variant="outline" 
                                className="text-xs flex items-center gap-1"
                              >
                                <span>{collaborator.nickname || collaborator.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveCollaboratorFromForm(collaborator.id)}
                                  className="h-3 w-3 p-0 hover:bg-destructive hover:text-destructive-foreground"
                                >
                                  <X className="h-2 w-2" />
                                </Button>
                              </Badge>
                            ))}
                          </div>
                        )}
                        {/* Searchable Assignee Dropdown */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-start h-8 text-xs"
                            >
                              <Users className="mr-2 h-3 w-3" />
                              Add assignee...
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[300px] p-0" align="start">
                            <Command>
                              <CommandInput 
                                placeholder="Search collaborators..." 
                                className="h-8 text-xs"
                              />
                              <CommandList>
                                <CommandEmpty className="py-6 text-center text-xs text-muted-foreground">
                                  No collaborators found.
                                </CommandEmpty>
                                <CommandGroup>
                                  {globalCollaborators
                                    .filter(collaborator => !formData.collaborators.some(c => c.id === collaborator.id))
                                    .map((collaborator) => (
                                      <CommandItem
                                        key={collaborator.id}
                                        value={`${collaborator.nickname || collaborator.name} ${collaborator.role}`}
                                        onSelect={() => {
                                          handleAddCollaboratorToForm(collaborator);
                                        }}
                                        className="text-xs cursor-pointer"
                                      >
                                        <User className="mr-2 h-3 w-3" />
                                        <span className="flex-1">
                                          {collaborator.nickname || collaborator.name}
                                        </span>
                                        <span className="text-muted-foreground text-xs">
                                          {collaborator.role}
                                        </span>
                                      </CommandItem>
                                    ))}
                                </CommandGroup>
                                {globalCollaborators.filter(collaborator => !formData.collaborators.some(c => c.id === collaborator.id)).length === 0 && (
                                  <div className="py-6 text-center text-xs text-muted-foreground">
                                    All collaborators assigned
                                  </div>
                                )}
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>

                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="item-start" className="text-xs">Start Date (Optional)</Label>
                      <DatePickerWithToday
                        id="item-start"
                        value={formData.start_date}
                        onChange={(value) => setFormData({ ...formData, start_date: value })}
                        className="h-8 text-xs"
                        placeholder="Select start date"
                      />
                    </div>

                    <div>
                      <Label htmlFor="item-due" className="text-xs">Due Date (Optional)</Label>
                      <DatePickerWithToday
                        id="item-due"
                        value={formData.due_date}
                        onChange={(value) => setFormData({ ...formData, due_date: value })}
                        className="h-8 text-xs"
                        placeholder="Select due date"
                      />
                    </div>
                  </div>
                </div>

                    <div className="flex gap-2 pt-2">
                      <Button onClick={handleAddActionableItem} size="sm" className="h-8 text-xs">
                        Add Item
                      </Button>
                      <Button 
                        onClick={() => setIsAddingNew(false)} 
                        variant="outline" 
                        size="sm" 
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </CardContent>
                </Card>
          )}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Add New Asset Button (Always Visible Outside Collapsible) */}
      {!isAddingNew && (
        <Button
          onClick={() => {
            setIsAddingNew(true);
            // Auto-expand when adding new item
            if (!isOpen) setIsOpen(true);
          }}
          variant="outline"
          size="sm"
          className="w-full h-9 text-xs border-dashed"
        >
          <Plus className="h-3 w-3 mr-1" />
          Add Asset
        </Button>
      )}

      {/* Clear All Actions Confirmation Dialog - Add Form */}
      <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Actions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {formData.actions?.length || 0} action(s) from the form. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllActionsFromForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Actions Confirmation Dialog - Edit Form */}
      <AlertDialog open={showEditClearAllDialog} onOpenChange={setShowEditClearAllDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear All Actions?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {editFormData.actions?.length || 0} action(s) from the edit form. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearAllActionsFromEditForm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}