import React, { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { DatePickerWithToday } from './DatePickerWithToday';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Save, Trash2, Copy, X, Plus, Calendar, Users, Tag, Link, FileText, Briefcase, ArrowUpDown, Link as LinkIcon } from 'lucide-react';
import { Project, Collaborator, ProjectFormData, ProjectStatus, ProjectType, ProjectCollaborator, ActionableItem, ProjectLink } from '../types/project';
import { HSLColorPicker } from './HSLColorPicker';
import { TypeColorPicker } from './TypeColorPicker';
import { ActionableItemManager } from './ActionableItemManager';
import { TeamMemberManager } from './TeamMemberManager';
import { VerticalSelector } from './VerticalSelector';
import { LightroomAssetManager } from './LightroomAssetManager';
import { GDriveAssetManager } from './GDriveAssetManager';
import { useColors } from './ColorContext';
import { getContrastColor } from '../utils/colorUtils';
import { toast } from 'sonner@2.0.3';
import { useLinkLabels, type LinkLabel } from '../hooks/useLinkLabels';
import { premadeIcons, type PremadeIcon } from '../utils/premadeIcons';

export interface ProjectFormProps {
  initialData: ProjectFormData;
  collaborators: Collaborator[];
  verticals: string[];
  onFormDataChange: (data: ProjectFormData) => void;
  onAddVertical: () => void;
  isEditing: boolean;
  projectId?: string; // For organizing gdrive assets in storage
}

export const ProjectForm = ({ 
  initialData, 
  collaborators, 
  verticals, 
  onFormDataChange, 
  onAddVertical,
  isEditing,
  projectId 
}: ProjectFormProps) => {
  // SIMPLE STATE - NO COMPLEXITY AT ALL
  const [formData, setFormData] = useState<ProjectFormData>(initialData);
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [selectedLinkLabel, setSelectedLinkLabel] = useState<LinkLabel | null>(null);
  const [showLinkLabelPicker, setShowLinkLabelPicker] = useState(false);
  
  // ⚡ NEW: Track manually added illustration types separately
  // This ensures manual types persist, while auto types from assets don't accumulate
  // Initialize with types from initialData that are NOT used by any asset (truly manual)
  const [manualIllustrationTypes, setManualIllustrationTypes] = useState<ProjectType[]>(() => {
    const autoTypesFromInit = initialData.actionable_items
      ?.map(item => item.illustration_type)
      .filter((type): type is ProjectType => type !== undefined) || [];
    return (initialData.types || []).filter(type => !autoTypesFromInit.includes(type));
  });
  
  // Fetch link labels
  const { linkLabels, loading: linkLabelsLoading } = useLinkLabels();
  
  // Sync local state with initialData when it changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData.collaborators, initialData.project_name, initialData.vertical, initialData.type, initialData.lightroom_assets]);

  const { verticalColors, typeColors, types, updateVerticalColor, updateTypeColor, refreshTypes } = useColors();
  
  // Debug logging
  useEffect(() => {
    console.log('ProjectForm types data:', { types, typeColors, typesLength: types?.length });
  }, [types, typeColors]);
  
  // Manual refresh if types are empty
  useEffect(() => {
    if (types && types.length === 0) {
      console.log('Types empty, attempting refresh...');
      refreshTypes?.();
    }
  }, [types, refreshTypes]);
  const statusOptions: ProjectStatus[] = [
    "Not Started", "In Progress", "Babysit", "Done", 
    "On Hold", "Canceled", "On List Lightroom", "On Review"
  ];

  // Update when initial data changes
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  // SIMPLE UPDATE - NO CALLBACKS, NO COMPLEXITY
  const updateData = (field: keyof ProjectFormData, value: any) => {
    let newData = { ...formData, [field]: value };
    
    // When status changes to "Done", auto-complete all tasks
    if (field === 'status' && value === 'Done' && newData.actionable_items && newData.actionable_items.length > 0) {
      const updatedTasks = newData.actionable_items.map(task => ({
        ...task,
        status: 'Done',
        is_completed: true
      }));
      
      newData = {
        ...newData,
        actionable_items: updatedTasks
      };
    }
    
    setFormData(newData);
    onFormDataChange(newData);
  };

  const addType = (type: ProjectType) => {
    // Add to manual types state (will persist until explicitly removed)
    if (!manualIllustrationTypes.includes(type)) {
      setManualIllustrationTypes(prev => [...prev, type]);
    }
    // Also update formData.types for immediate UI update
    if (!formData.types?.includes(type)) {
      updateData('types', [...(formData.types || []), type]);
    }
  };

  const removeType = (typeToRemove: ProjectType) => {
    // ✅ FIX: Check illustration_type instead of item.type
    const isTypeUsedInAssets = formData.actionable_items?.some(item => item.illustration_type === typeToRemove);
    if (isTypeUsedInAssets) {
      toast.warning(`Type "${typeToRemove}" is still used in actionable items. Remove from actionable items first.`);
      return;
    }
    // Remove from both manual types state and formData.types
    setManualIllustrationTypes(prev => prev.filter(t => t !== typeToRemove));
    updateData('types', formData.types?.filter(t => t !== typeToRemove) || []);
  };

  const addLink = () => {
    if (newLinkLabel.trim() && newLinkUrl.trim()) {
      const newLink: ProjectLink = {
        id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: newLinkLabel.trim(),
        url: newLinkUrl.trim()
      };
      
      const currentLinks = formData.links.labeled || [];
      updateData('links', { ...formData.links, labeled: [...currentLinks, newLink] });
      
      setNewLinkLabel('');
      setNewLinkUrl('');
      setSelectedLinkLabel(null);
      setShowLinkLabelPicker(false);
    }
  };

  const selectLinkLabel = (linkLabel: LinkLabel) => {
    setSelectedLinkLabel(linkLabel);
    setNewLinkLabel(linkLabel.label);
    setShowLinkLabelPicker(false);
  };
  
  const selectPresetIcon = (preset: PremadeIcon) => {
    // Create a temporary link label from preset for consistency
    const tempLinkLabel: LinkLabel = {
      id: preset.id,
      label: preset.name,
      icon_type: 'svg',
      icon_value: preset.svg,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    setSelectedLinkLabel(tempLinkLabel);
    setNewLinkLabel(preset.name);
    setShowLinkLabelPicker(false);
  };

  const renderLinkLabelIcon = (linkLabel: LinkLabel) => {
    if (linkLabel.icon_type === 'emoji') {
      return <span className="text-lg">{linkLabel.icon_value}</span>;
    } else if (linkLabel.icon_type === 'svg') {
      return (
        <div 
          className="w-5 h-5 flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto" 
          dangerouslySetInnerHTML={{ __html: linkLabel.icon_value }}
        />
      );
    } else {
      return <LinkIcon className="h-5 w-5" />;
    }
  };
  
  const renderPresetIcon = (preset: PremadeIcon) => {
    return (
      <div 
        className="w-5 h-5 flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto" 
        dangerouslySetInnerHTML={{ __html: preset.svg }}
      />
    );
  };

  const removeLink = (linkId: string) => {
    const updatedLinks = formData.links.labeled?.filter(link => link.id !== linkId) || [];
    updateData('links', { ...formData.links, labeled: updatedLinks });
  };

  const getExistingLabels = (): string[] => {
    const labels = formData.links.labeled?.map(link => link.label) || [];
    return [...new Set(labels)]; // Remove duplicates
  };

  const handleActionableItemsChange = useCallback((actionableItems: ActionableItem[], triggeredStatus?: string) => {
    // ✅ FIX: Extract illustration_type from items (not item.type which is ProjectType)
    const illustrationTypesFromItems = actionableItems
      .map(item => item.illustration_type)
      .filter((type): type is string => type !== undefined && type !== '');
    
    // Use functional setState to avoid stale closure
    setFormData(currentFormData => {
      // ⚡ CRITICAL: Check if actionable_items actually changed to prevent infinite loops
      const currentItems = currentFormData.actionable_items || [];
      
      // Deep comparison helper for actions
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
      
      // Deep comparison: check length and key properties
      // Sort both arrays by id for consistent comparison
      const sortedCurrentItems = [...currentItems].sort((a, b) => a.id.localeCompare(b.id));
      const sortedNewItems = [...actionableItems].sort((a, b) => a.id.localeCompare(b.id));
      
      const itemsChanged = 
        sortedCurrentItems.length !== sortedNewItems.length ||
        sortedCurrentItems.some((item, idx) => {
          const newItem = sortedNewItems[idx];
          if (!newItem || item.id !== newItem.id) return true;
          
          // Check basic properties (including illustration_type)
          if (item.is_completed !== newItem.is_completed || 
              item.status !== newItem.status ||
              item.title !== newItem.title ||
              item.type !== newItem.type ||
              item.illustration_type !== newItem.illustration_type) {
            return true;
          }
          
          // Check actions deeply
          const currentActions = item.actions || [];
          const newActions = newItem.actions || [];
          if (!areActionsEqual(currentActions, newActions)) {
            return true;
          }
          
          return false;
        });
      
      // ✅ FIX: Smart type management using separate manual types state
      // Keep types from TWO sources:
      // 1. Manual types: Explicitly added by user via dropdown (tracked in separate state)
      // 2. Auto types: Currently used by at least one asset (synced from assets)
      // This ensures when user changes asset type, ONLY current types are shown (no accumulation)
      
      const autoTypes = [...new Set(illustrationTypesFromItems)];
      const allTypes = [...new Set([...manualIllustrationTypes, ...autoTypes])];
      
      // ⚡ CRITICAL FIX: Calculate project-level status from actionable items
      // This prevents visual jumping when items move between status groups
      let projectStatus: ProjectStatus;
      
      // ⚡ PRIORITY 1: If action triggered a specific status (e.g., "In Review"), use that
      if (triggeredStatus) {
        projectStatus = triggeredStatus as ProjectStatus;
        console.log(`[ProjectForm] 🎯 Using triggered project status: ${projectStatus}`);
      } 
      // ⚡ PRIORITY 2: Otherwise, auto-calculate from completion
      else if (actionableItems.length > 0) {
        // Check if all items are completed
        const allCompleted = actionableItems.every(item => item.is_completed);
        // Check if some items are completed
        const someCompleted = actionableItems.some(item => item.is_completed);
        // Check if at least one item is "In Progress"
        const hasInProgress = actionableItems.some(item => 
          item.status === 'In Progress' || 
          (item.actions && item.actions.length > 0 && item.actions.some(a => a.completed))
        );
        
        if (allCompleted) {
          projectStatus = 'Done';
        } else if (hasInProgress || someCompleted) {
          projectStatus = 'In Progress';
        } else {
          projectStatus = 'Not Started';
        }
        
        console.log(`[ProjectForm] 📊 Calculated project status: ${projectStatus} (allCompleted: ${allCompleted}, someCompleted: ${someCompleted}, hasInProgress: ${hasInProgress})`);
      }
      // ⚡ PRIORITY 3: Fallback to current status
      else {
        projectStatus = currentFormData.status || 'Not Started';
      }
      
      // Check if types have actually changed
      const existingTypesSet = new Set(currentFormData.types || []);
      const newTypesSet = new Set(allTypes);
      const typesChanged = 
        existingTypesSet.size !== newTypesSet.size ||
        [...existingTypesSet].some(type => !newTypesSet.has(type));
      
      // Only update if something actually changed
      const statusChanged = projectStatus !== currentFormData.status;
      if (!itemsChanged && !statusChanged && !typesChanged && !triggeredStatus) {
        console.log('[ProjectForm] No changes detected, skipping update');
        return currentFormData; // Return unchanged to prevent re-render
      }
      
      const newData = { 
        ...currentFormData, 
        actionable_items: actionableItems,
        types: allTypes,
        // ⚡ CRITICAL: Update project status together with items to prevent jumping
        status: projectStatus
      };
      
      // Only call onFormDataChange if data actually changed
      onFormDataChange(newData);
      return newData;
    });
  }, [onFormDataChange]);

  const handleAllItemsCompleted = () => {
    updateData('status', 'Done' as ProjectStatus);
    toast.success('All actionable items completed! Project status updated to Done.');
  };

  return (
    <div className="space-y-6">
      {/* Vertical Selection */}
      <VerticalSelector
        value={formData.vertical}
        verticals={verticals}
        verticalColors={verticalColors}
        onChange={(value) => updateData('vertical', value)}
        onAddVertical={onAddVertical}
      />

      {/* Project Name - SUPER SIMPLE */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          <Label htmlFor="project_name" className="font-medium">Project Name *</Label>
        </div>
        <Input
          id="project_name"
          value={formData.project_name || ''}
          onChange={(e) => updateData('project_name', e.target.value)}
          placeholder="Enter a descriptive project name"
          required
          className="text-base h-12 bg-background border-2 focus:border-primary"
          autoComplete="off"
          spellCheck={false}
        />
      </div>

      {/* Project Description (Optional) */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Project Description <span className="text-xs text-muted-foreground font-normal">(Optional)</span></h3>
          </div>
          
          <Textarea
            value={formData.description}
            onChange={(e) => updateData('description', e.target.value)}
            placeholder="Add project description, requirements, or other details..."
            className="min-h-[100px] bg-background border-2 focus:border-primary resize-none"
          />
        </CardContent>
      </Card>

      {/* Project Notes (Optional) */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Internal Notes <span className="text-xs text-muted-foreground font-normal">(Optional, max 150 chars)</span></h3>
          </div>
          
          <Textarea
            value={formData.notes || ''}
            onChange={(e) => {
              const value = e.target.value;
              // Limit to 150 characters
              if (value.length <= 150) {
                updateData('notes', value);
              }
            }}
            placeholder="Add internal notes or reminders for this project..."
            className="min-h-[80px] bg-background border-2 focus:border-primary resize-none"
            maxLength={150}
          />
          <p className="text-xs text-muted-foreground text-right">
            {(formData.notes || '').length}/150 characters
          </p>
        </CardContent>
      </Card>

      {/* Actionable Items */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <ActionableItemManager
            actionableItems={formData.actionable_items || []}
            projectCollaborators={formData.collaborators}
            globalCollaborators={collaborators.map(c => ({ 
              id: c.id, 
              name: c.name, 
              role: c.role,
              nickname: c.nickname,
              photo_url: c.photo_url,
              profile_url: c.profile_url
            }))}
            onActionableItemsChange={handleActionableItemsChange}
            onProjectCollaboratorsChange={(newCollaborators) => {
              console.log('🔄 ProjectForm: updating collaborators from', formData.collaborators.length, 'to', newCollaborators.length);
              console.log('🔄 ProjectForm: new collaborators:', newCollaborators.map(c => ({ id: c.id, name: c.name })));
              
              // Use functional setState to avoid stale closure
              setFormData(currentFormData => {
                const updatedFormData = { ...currentFormData, collaborators: newCollaborators };
                console.log('🔄 ProjectForm: calling onFormDataChange...');
                onFormDataChange(updatedFormData);
                console.log('🔄 ProjectForm: onFormDataChange completed');
                return updatedFormData;
              });
            }}
            onAllItemsCompleted={handleAllItemsCompleted}
            onProjectStatusChange={(newStatus) => {
              console.log(`[ProjectForm] 🎯 Auto-updating project status to "${newStatus}" from action trigger`);
              updateData('status', newStatus);
            }}
          />
        </CardContent>
      </Card>

      {/* Type Selection */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Illustration Types *</h3>
          </div>
          
          <div className="space-y-4">
            {/* Selected Types */}
            {formData.types && formData.types.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.types.map((type, index) => (
                  <div key={`${type}-${index}`} className="flex items-center gap-1 p-2 bg-muted/50 rounded-lg">
                    <Badge 
                      style={{ 
                        backgroundColor: typeColors[type] || '#6b7280', 
                        color: getContrastColor(typeColors[type] || '#6b7280')
                      }}
                      className="border-0"
                    >
                      {type}
                    </Badge>
                    <div className="flex gap-1">
                      <TypeColorPicker
                        color={typeColors[type] || '#6b7280'}
                        onChange={(color) => updateTypeColor(type, color)}
                        trigger={
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 border border-muted rounded"
                          >
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: typeColors[type] || '#6b7280' }}
                            />
                          </Button>
                        }
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeType(type)}
                        className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Type */}
            <Select onValueChange={addType}>
              <SelectTrigger className="h-12 bg-background border-2 focus:border-primary">
                <SelectValue placeholder={formData.types?.length ? "Add another type..." : "Select illustration types..."} />
              </SelectTrigger>
              <SelectContent>
                {(types && types.length > 0) ? (
                  types
                    .filter(type => !formData.types?.includes(type))
                    .map(type => (
                    <SelectItem key={type} value={type}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: typeColors[type] || '#6b7280' }}
                        />
                        {type}
                      </div>
                    </SelectItem>
                  ))) : (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-3 w-3 border border-gray-300 border-t-transparent" />
                        Loading types...
                      </div>
                    </SelectItem>
                  )}
                  {(types && types.length === 0) && (
                    <SelectItem value="refresh" onClick={() => refreshTypes?.()} className="cursor-pointer">
                      <div className="flex items-center gap-2 text-blue-600">
                        <span>🔄</span>
                        Refresh types
                      </div>
                    </SelectItem>
                  )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Collaborators */}
      <TeamMemberManager
        formData={formData}
        collaborators={collaborators}
        onFormDataChange={onFormDataChange}
      />

      {/* Status */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Project Status</h3>
          </div>
          
          <Select 
            value={formData.status} 
            onValueChange={(value: ProjectStatus) => updateData('status', value)}
          >
            <SelectTrigger className="h-12 bg-background border-2 focus:border-primary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(status => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Project Timeline</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="start_date" className="text-xs font-medium text-muted-foreground">START DATE</Label>
              <DatePickerWithToday
                id="start_date"
                value={formData.start_date}
                onChange={(value) => updateData('start_date', value)}
                className="h-12 bg-background border-2 focus:border-primary"
                placeholder="Select start date"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="due_date" className="text-xs font-medium text-muted-foreground">DUE DATE</Label>
              <DatePickerWithToday
                id="due_date"
                value={formData.due_date}
                onChange={(value) => updateData('due_date', value)}
                className="h-12 bg-background border-2 focus:border-primary"
                placeholder="Select due date"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Links */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center gap-2 mb-3">
            <Link className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Project Links</h3>
          </div>
          
          {/* Existing Links */}
          {formData.links.labeled && formData.links.labeled.length > 0 && (
            <div className="space-y-2 mb-4">
              {formData.links.labeled.map((link) => (
                <div key={link.id} className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs shrink-0">
                        {link.label}
                      </Badge>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline truncate block"
                        title={link.url}
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeLink(link.id)}
                    className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          
          {/* Add New Link */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="link_label" className="text-xs font-medium text-muted-foreground">LINK LABEL</Label>
              
              {/* Show selected label or input */}
              {selectedLinkLabel ? (
                <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border-2 border-primary/50">
                  <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background flex-shrink-0">
                    {renderLinkLabelIcon(selectedLinkLabel)}
                  </div>
                  <span className="flex-1 font-medium">{selectedLinkLabel.label}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedLinkLabel(null);
                      setNewLinkLabel('');
                      setShowLinkLabelPicker(true);
                    }}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : showLinkLabelPicker ? (
                <div className="space-y-2">
                  <Tabs defaultValue="presets" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="presets">Preset Icons</TabsTrigger>
                      <TabsTrigger value="saved">Saved Labels</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="presets" className="mt-2">
                      <div className="max-h-[400px] overflow-y-auto border-2 border-primary/50 rounded-lg bg-background">
                        <div className="p-3 grid grid-cols-3 gap-2">
                          {premadeIcons.map((preset) => (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() => selectPresetIcon(preset)}
                              className="flex items-center gap-3 p-2.5 rounded-md hover:bg-accent transition-colors text-left"
                            >
                              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/50 flex-shrink-0">
                                {renderPresetIcon(preset)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm">{preset.name}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {preset.category}
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="saved" className="mt-2">
                      {linkLabels.length > 0 ? (
                        <div className="max-h-[400px] overflow-y-auto border-2 border-primary/50 rounded-lg bg-background">
                          <div className="p-2 space-y-1">
                            {linkLabels.map((linkLabel) => (
                              <button
                                key={linkLabel.id}
                                type="button"
                                onClick={() => selectLinkLabel(linkLabel)}
                                className="w-full flex items-center gap-3 p-2.5 rounded-md hover:bg-accent transition-colors text-left"
                              >
                                <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/50 flex-shrink-0">
                                  {renderLinkLabelIcon(linkLabel)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-medium">{linkLabel.label}</div>
                                  {linkLabel.placeholder && (
                                    <div className="text-xs text-muted-foreground truncate">
                                      {linkLabel.placeholder}
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="p-6 text-center border-2 border-primary/50 rounded-lg bg-background">
                          <LinkIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No saved labels yet</p>
                          <p className="text-xs text-muted-foreground mt-1">Create custom labels in Settings</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLinkLabelPicker(false)}
                      className="flex-1"
                    >
                      Use Custom Label
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLinkLabelPicker(false)}
                      className="px-3"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    id="link_label"
                    value={newLinkLabel}
                    onChange={(e) => setNewLinkLabel(e.target.value)}
                    placeholder="e.g., Figma, Google Sheet, Docs, etc."
                    className="h-10 bg-muted/30 flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newLinkLabel.trim() && newLinkUrl.trim()) {
                          addLink();
                        }
                      }
                    }}
                  />
                  {linkLabels.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLinkLabelPicker(true)}
                      className="h-10 px-3 shrink-0"
                      title="Choose from saved labels"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="link_url" className="text-xs font-medium text-muted-foreground">URL</Label>
              <div className="flex gap-2">
                <Input
                  id="link_url"
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  className="h-10 bg-muted/30 flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newLinkLabel.trim() && newLinkUrl.trim()) {
                        addLink();
                      }
                    }
                  }}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addLink} 
                  className="h-10 px-3"
                  disabled={!newLinkLabel.trim() || !newLinkUrl.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lightroom Assets */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <LightroomAssetManager
            assets={formData.lightroom_assets || []}
            onChange={(assets) => updateData('lightroom_assets', assets)}
            actionableItems={formData.actionable_items || []}
          />
        </CardContent>
      </Card>

      {/* Google Drive Assets */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <GDriveAssetManager
            assets={formData.gdrive_assets || []}
            onChange={(assets) => updateData('gdrive_assets', assets)}
            projectId={projectId || `temp-${Date.now()}`}
            actionableItems={formData.actionable_items || []}
          />
        </CardContent>
      </Card>

    </div>
  );
};