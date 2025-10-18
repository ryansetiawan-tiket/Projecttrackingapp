import { useState } from 'react';
import { useWorkflows } from './WorkflowContext';
import { useActionPresets } from './ActionPresetContext';
import { useColors } from './ColorContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, X, Edit2, Check, Trash2, ListPlus, Tag, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { Label } from './ui/label';
import { Separator } from './ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { ProjectType } from '../types/project';
import { toast } from 'sonner@2.0.3';

export function WorkflowManager() {
  const { workflows, addWorkflow, updateWorkflow, deleteWorkflow, loading, canEdit } = useWorkflows();
  const { presets, loading: presetsLoading } = useActionPresets();
  const { types } = useColors();
  
  const [newWorkflowName, setNewWorkflowName] = useState('');
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<ProjectType[]>([]);
  const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingActions, setEditingActions] = useState<string[]>([]);
  const [editingTypes, setEditingTypes] = useState<ProjectType[]>([]);
  const [expandedWorkflow, setExpandedWorkflow] = useState<string | null>(null);

  const MAX_ACTIONS = 12;

  const handleCreateWorkflow = async () => {
    if (!canEdit) {
      toast.error('Only administrators can modify workflows');
      return;
    }
    const trimmedName = newWorkflowName.trim();
    if (trimmedName && selectedActions.length > 0 && selectedActions.length <= MAX_ACTIONS) {
      try {
        await addWorkflow(trimmedName, selectedActions, selectedTypes);
        setNewWorkflowName('');
        setSelectedActions([]);
        setSelectedTypes([]);
        toast.success('Workflow created successfully');
      } catch (error) {
        toast.error('Failed to create workflow');
      }
    }
  };

  const handleToggleSelectedType = (type: ProjectType) => {
    setSelectedTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleToggleAction = (action: string) => {
    setSelectedActions(prev => {
      if (prev.includes(action)) {
        return prev.filter(a => a !== action);
      } else if (prev.length >= MAX_ACTIONS) {
        return prev; // Don't add if already at max
      } else {
        return [...prev, action];
      }
    });
  };

  const handleMoveActionUp = (index: number) => {
    if (index === 0) return;
    setSelectedActions(prev => {
      const newActions = [...prev];
      [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
      return newActions;
    });
  };

  const handleMoveActionDown = (index: number) => {
    if (index >= selectedActions.length - 1) return;
    setSelectedActions(prev => {
      const newActions = [...prev];
      [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
      return newActions;
    });
  };

  const handleToggleEditingAction = (action: string) => {
    setEditingActions(prev => {
      if (prev.includes(action)) {
        return prev.filter(a => a !== action);
      } else if (prev.length >= MAX_ACTIONS) {
        return prev; // Don't add if already at max
      } else {
        return [...prev, action];
      }
    });
  };

  const handleMoveEditingActionUp = (index: number) => {
    if (index === 0) return;
    setEditingActions(prev => {
      const newActions = [...prev];
      [newActions[index - 1], newActions[index]] = [newActions[index], newActions[index - 1]];
      return newActions;
    });
  };

  const handleMoveEditingActionDown = (index: number) => {
    if (index >= editingActions.length - 1) return;
    setEditingActions(prev => {
      const newActions = [...prev];
      [newActions[index], newActions[index + 1]] = [newActions[index + 1], newActions[index]];
      return newActions;
    });
  };

  const handleToggleEditingType = (type: ProjectType) => {
    setEditingTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const startEditingWorkflow = (workflowId: string) => {
    if (!canEdit) {
      toast.error('Only administrators can modify workflows');
      return;
    }
    const workflow = workflows.find(w => w.id === workflowId);
    if (workflow) {
      setEditingWorkflowId(workflowId);
      setEditingName(workflow.name);
      setEditingActions(workflow.actions);
      setEditingTypes(workflow.assignedTypes || []);
    }
  };

  const saveWorkflowEdit = async () => {
    if (editingWorkflowId && editingName.trim() && editingActions.length > 0) {
      try {
        await updateWorkflow(editingWorkflowId, {
          name: editingName.trim(),
          actions: editingActions,
          assignedTypes: editingTypes
        });
        setEditingWorkflowId(null);
        setEditingName('');
        setEditingActions([]);
        setEditingTypes([]);
        toast.success('Workflow updated successfully');
      } catch (error) {
        toast.error('Failed to update workflow');
      }
    }
  };

  const cancelWorkflowEdit = () => {
    setEditingWorkflowId(null);
    setEditingName('');
    setEditingActions([]);
    setEditingTypes([]);
  };

  const handleDeleteWorkflow = async (workflowId: string) => {
    if (!canEdit) {
      toast.error('Only administrators can modify workflows');
      return;
    }
    try {
      await deleteWorkflow(workflowId);
      toast.success('Workflow deleted successfully');
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Workflow Manager {!canEdit && <span className="text-muted-foreground">(Admin only)</span>}
        </CardTitle>
        <CardDescription>
          Create and manage action workflows that can be applied to assets. Maximum {MAX_ACTIONS} actions per workflow.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {(loading || presetsLoading) && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {!loading && !presetsLoading && (
          <>
            {/* Create New Workflow */}
            <div className="space-y-4 p-4 border rounded-lg">
              <div className="flex items-center gap-2">
                <ListPlus className="h-5 w-5 text-muted-foreground" />
                <h4>Create New Workflow</h4>
              </div>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input
                    id="workflow-name"
                    placeholder="e.g., Standard Illustration Workflow"
                    value={newWorkflowName}
                    onChange={(e) => setNewWorkflowName(e.target.value)}
                    disabled={!canEdit}
                  />
                </div>

                <div>
                  <Label>
                    Select Actions ({selectedActions.length}/{MAX_ACTIONS})
                  </Label>
                  <div className="mt-2 space-y-2 p-3 border rounded-md bg-muted/20">
                    <div className="grid grid-cols-2 gap-2">
                      {presets.map((preset) => (
                        <div key={preset} className="flex items-center space-x-2">
                          <Checkbox
                            id={`preset-${preset}`}
                            checked={selectedActions.includes(preset)}
                            onCheckedChange={() => handleToggleAction(preset)}
                            disabled={!canEdit || (!selectedActions.includes(preset) && selectedActions.length >= MAX_ACTIONS)}
                          />
                          <Label
                            htmlFor={`preset-${preset}`}
                            className="flex-1 cursor-pointer"
                          >
                            {preset}
                          </Label>
                        </div>
                      ))}
                    </div>
                    
                    {selectedActions.length > 0 && (
                      <>
                        <Separator className="my-2" />
                        <div>
                          <p className="text-sm mb-2">Action Order:</p>
                          <div className="space-y-1">
                            {selectedActions.map((action, index) => (
                              <div key={`${action}-${index}`} className="flex items-center gap-2 bg-background p-2 rounded">
                                <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                                <Badge variant="secondary" className="flex-1">
                                  {action}
                                </Badge>
                                <div className="flex gap-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleMoveActionUp(index)}
                                    disabled={!canEdit || index === 0}
                                    className="h-7 w-7 p-0"
                                  >
                                    <ChevronUp className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleMoveActionDown(index)}
                                    disabled={!canEdit || index === selectedActions.length - 1}
                                    className="h-7 w-7 p-0"
                                  >
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Assign to Types (Optional)
                  </Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {types.map((type) => (
                      <Badge
                        key={type}
                        variant={selectedTypes.includes(type) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => canEdit && handleToggleSelectedType(type)}
                      >
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCreateWorkflow}
                  disabled={
                    !canEdit ||
                    !newWorkflowName.trim() ||
                    selectedActions.length === 0 ||
                    selectedActions.length > MAX_ACTIONS
                  }
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Workflow
                </Button>
              </div>
            </div>

            <Separator />

            {/* Existing Workflows */}
            <div className="space-y-3">
              <h4>Existing Workflows ({workflows.length})</h4>
              
              {workflows.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8 border rounded-lg">
                  No workflows yet. Create your first workflow above.
                </p>
              ) : (
                <div className="space-y-2">
                  {workflows.map((workflow) => (
                    <Collapsible
                      key={workflow.id}
                      open={expandedWorkflow === workflow.id}
                      onOpenChange={(open) => setExpandedWorkflow(open ? workflow.id : null)}
                    >
                      <div className="border rounded-lg p-4 space-y-3">
                        {editingWorkflowId === workflow.id ? (
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor={`edit-name-${workflow.id}`}>Workflow Name</Label>
                              <Input
                                id={`edit-name-${workflow.id}`}
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                disabled={!canEdit}
                              />
                            </div>

                            <div>
                              <Label>
                                Select Actions ({editingActions.length}/{MAX_ACTIONS})
                              </Label>
                              <div className="mt-2 space-y-2 p-3 border rounded-md bg-muted/20">
                                <div className="grid grid-cols-2 gap-2">
                                  {presets.map((preset) => (
                                    <div key={preset} className="flex items-center space-x-2">
                                      <Checkbox
                                        id={`edit-preset-${workflow.id}-${preset}`}
                                        checked={editingActions.includes(preset)}
                                        onCheckedChange={() => handleToggleEditingAction(preset)}
                                        disabled={!canEdit || (!editingActions.includes(preset) && editingActions.length >= MAX_ACTIONS)}
                                      />
                                      <Label
                                        htmlFor={`edit-preset-${workflow.id}-${preset}`}
                                        className="flex-1 cursor-pointer"
                                      >
                                        {preset}
                                      </Label>
                                    </div>
                                  ))}
                                </div>

                                {editingActions.length > 0 && (
                                  <>
                                    <Separator className="my-2" />
                                    <div>
                                      <p className="text-sm mb-2">Action Order:</p>
                                      <div className="space-y-1">
                                        {editingActions.map((action, index) => (
                                          <div key={`${action}-${index}`} className="flex items-center gap-2 bg-background p-2 rounded">
                                            <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                                            <Badge variant="secondary" className="flex-1">
                                              {action}
                                            </Badge>
                                            <div className="flex gap-1">
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleMoveEditingActionUp(index)}
                                                disabled={!canEdit || index === 0}
                                                className="h-7 w-7 p-0"
                                              >
                                                <ChevronUp className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleMoveEditingActionDown(index)}
                                                disabled={!canEdit || index === editingActions.length - 1}
                                                className="h-7 w-7 p-0"
                                              >
                                                <ChevronDown className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>

                            <div>
                              <Label className="flex items-center gap-2">
                                <Tag className="h-4 w-4" />
                                Assign to Types (Optional)
                              </Label>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {types.map((type) => (
                                  <Badge
                                    key={type}
                                    variant={editingTypes.includes(type) ? "default" : "outline"}
                                    className={`cursor-pointer transition-colors ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    onClick={() => canEdit && handleToggleEditingType(type)}
                                  >
                                    {type}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                onClick={saveWorkflowEdit}
                                disabled={!canEdit || !editingName.trim() || editingActions.length === 0}
                                className="flex-1"
                              >
                                <Check className="h-4 w-4 mr-2" />
                                Save Changes
                              </Button>
                              <Button
                                onClick={cancelWorkflowEdit}
                                variant="outline"
                                disabled={!canEdit}
                                className="flex-1"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h4>{workflow.name}</h4>
                                  {workflow.assignedTypes && workflow.assignedTypes.length > 0 && (
                                    <div className="flex gap-1">
                                      {workflow.assignedTypes.map((type) => (
                                        <Badge key={type} variant="outline" className="text-xs">
                                          {type}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {workflow.actions.length} actions
                                </p>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => startEditingWorkflow(workflow.id)}
                                  disabled={!canEdit}
                                >
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeleteWorkflow(workflow.id)}
                                  className="text-destructive hover:text-destructive"
                                  disabled={!canEdit}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="sm" className="w-full">
                                {expandedWorkflow === workflow.id ? 'Hide' : 'Show'} Actions
                              </Button>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="space-y-2 pt-2">
                              {workflow.actions.map((action, index) => (
                                <div key={`${action}-${index}`} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-6">{index + 1}.</span>
                                  <Badge variant="secondary">{action}</Badge>
                                </div>
                              ))}
                            </CollapsibleContent>
                          </>
                        )}
                      </div>
                    </Collapsible>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
