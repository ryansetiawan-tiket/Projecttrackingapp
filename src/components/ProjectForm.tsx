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
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Save, Trash2, Copy, X, Plus, Calendar, Users, Tag, Link, FileText, Briefcase, ArrowUpDown, Link as LinkIcon, Building } from 'lucide-react';
import { Project, Collaborator, ProjectFormData, ProjectStatus, ProjectType, ProjectCollaborator, ActionableItem, ProjectLink } from '../types/project';
import { HSLColorPicker } from './HSLColorPicker';
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
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { LightroomIcon } from './icons/LightroomIcon';

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
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [selectedPresetIcon, setSelectedPresetIcon] = useState<PremadeIcon | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLinkLabel, setCustomLinkLabel] = useState('');
  
  // Section visibility states - default to hidden for new projects
  const [showProjectLinks, setShowProjectLinks] = useState(() => {
    // Show if editing OR if there are existing links
    return isEditing || (initialData.links.labeled && initialData.links.labeled.length > 0);
  });
  const [showLightroomAssets, setShowLightroomAssets] = useState(() => {
    // Show if editing OR if there are existing lightroom assets
    return isEditing || (initialData.lightroom_assets && initialData.lightroom_assets.length > 0);
  });
  const [showGDriveAssets, setShowGDriveAssets] = useState(() => {
    // Show if editing OR if there are existing gdrive assets
    return isEditing || (initialData.gdrive_assets && initialData.gdrive_assets.length > 0);
  });
  
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

  const { verticalColors, typeColors, types, updateVerticalColor, refreshTypes } = useColors();
  
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
  
  // Auto-detect icon from URL (like AddProjectLinkDialog)
  useEffect(() => {
    if (!newLinkUrl) return;
    
    try {
      const url = new URL(newLinkUrl.startsWith('http') ? newLinkUrl : `https://${newLinkUrl}`);
      const domain = url.hostname.toLowerCase();
      
      // Map domains to icon IDs
      const domainMap: Record<string, string> = {
        'figma.com': 'figma',
        'docs.google.com': 'google-docs',
        'sheets.google.com': 'google-sheets',
        'drive.google.com': 'google-drive',
        'slack.com': 'slack',
        'notion.so': 'notion',
        'notion.com': 'notion',
        'trello.com': 'trello',
        'github.com': 'github',
        'dropbox.com': 'dropbox',
        'miro.com': 'miro',
        'asana.com': 'asana',
        'atlassian.net': 'confluence',
        'confluence.': 'confluence',
      };
      
      // Find matching icon
      for (const [domainKey, iconId] of Object.entries(domainMap)) {
        if (domain.includes(domainKey)) {
          const icon = premadeIcons.find(i => i.id === iconId);
          if (icon && !selectedPresetIcon) {
            setSelectedPresetIcon(icon);
            setShowCustomInput(false);
          }
          break;
        }
      }
    } catch (e) {
      // Invalid URL, ignore
    }
  }, [newLinkUrl, selectedPresetIcon]);
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
    // Ensure vertical is always a string, never an object
    let safeValue = value;
    if (field === 'vertical') {
      if (typeof value === 'object' && value !== null) {
        console.warn('[ProjectForm] Received object for vertical field. Type:', typeof value, 'Constructor:', value.constructor?.name);
        // Try to extract string from object
        if ('value' in value && typeof value.value === 'string') {
          safeValue = value.value;
        } else if ('label' in value && typeof value.label === 'string') {
          safeValue = value.label;
        } else if ('name' in value && typeof value.name === 'string') {
          safeValue = value.name;
        } else {
          safeValue = '';
        }
      } else if (typeof value !== 'string') {
        safeValue = String(value);
      }
    }
    
    let newData = { ...formData, [field]: safeValue };
    
    // When status changes to "Done", auto-complete all tasks and set completion timestamp
    if (field === 'status' && safeValue === 'Done' && newData.actionable_items && newData.actionable_items.length > 0) {
      const updatedTasks = newData.actionable_items.map(task => ({
        ...task,
        status: 'Done',
        is_completed: true
      }));
      
      newData = {
        ...newData,
        actionable_items: updatedTasks,
        // Only set completed_at if it doesn't exist (preserve original completion date)
        completed_at: newData.completed_at || new Date().toISOString()
      };
    } else if (field === 'status' && safeValue === 'Done') {
      // Status changed to Done but no tasks - still set completion timestamp
      newData = {
        ...newData,
        // Only set completed_at if it doesn't exist (preserve original completion date)
        completed_at: newData.completed_at || new Date().toISOString()
      };
    } else if (field === 'status' && safeValue !== 'Done') {
      // Status changed away from Done - clear completion timestamp
      newData = {
        ...newData,
        completed_at: null
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
    const finalLabel = showCustomInput ? customLinkLabel.trim() : selectedPresetIcon?.name || '';
    
    if (finalLabel && newLinkUrl.trim()) {
      const newLink: ProjectLink = {
        id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: finalLabel,
        url: newLinkUrl.trim()
      };
      
      const currentLinks = formData.links.labeled || [];
      updateData('links', { ...formData.links, labeled: [...currentLinks, newLink] });
      
      // Reset form
      setNewLinkUrl('');
      setSelectedPresetIcon(null);
      setShowCustomInput(false);
      setCustomLinkLabel('');
    }
  };

  const selectPresetIcon = (preset: PremadeIcon) => {
    setSelectedPresetIcon(preset);
    setShowCustomInput(false);
  };

  const renderPresetIcon = (preset: PremadeIcon) => {
    return (
      <div 
        className="w-full h-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto" 
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
      
      // ⚡ PERFORMANCE: Early return if items haven't changed and no triggered status
      if (!itemsChanged && !triggeredStatus) {
        console.log('[ProjectForm] No item changes detected, skipping update');
        return currentFormData; // Return unchanged to prevent re-render
      }
      
      // ✅ FIX: Smart type management using separate manual types state
      // Keep types from TWO sources:
      // 1. Manual types: Explicitly added by user via dropdown (tracked in separate state)
      // 2. Auto types: Currently used by at least one asset (synced from assets)
      // This ensures when user changes asset type, ONLY current types are shown (no accumulation)
      
      const autoTypes = [...new Set(illustrationTypesFromItems)];
      const allTypes = [...new Set([...manualIllustrationTypes, ...autoTypes])];
      
      // Check if types have actually changed
      const existingTypesSet = new Set(currentFormData.types || []);
      const newTypesSet = new Set(allTypes);
      const typesChanged = 
        existingTypesSet.size !== newTypesSet.size ||
        [...existingTypesSet].some(type => !newTypesSet.has(type));
      
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
      
      // Final check: only update if something actually changed
      const statusChanged = projectStatus !== currentFormData.status;
      if (!itemsChanged && !statusChanged && !typesChanged) {
        console.log('[ProjectForm] No meaningful changes after calculation, skipping update');
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
  }, [onFormDataChange, manualIllustrationTypes]); // ✅ FIX: Added manualIllustrationTypes to prevent stale closure

  const handleAllItemsCompleted = () => {
    updateData('status', 'Done' as ProjectStatus);
    toast.success('All actionable items completed! Project status updated to Done.');
  };

  return (
    <div className="lg:grid lg:grid-cols-[45%_1px_1fr] lg:gap-6 space-y-6 lg:space-y-0">
      {/* ============================================ */}
      {/* LEFT COLUMN - Essential Metadata            */}
      {/* ============================================ */}
      <div className="min-w-0">
        {/* Project Name & Vertical - Combined Section (80:20 ratio) */}
        <div className="grid grid-cols-[1fr_20%] gap-4 items-start">
          {/* Project Name - Left (80%) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 h-5">
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

          {/* Vertical Selection - Right (20%) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 h-5">
              <Building className="h-4 w-4 text-primary" />
              <Label className="font-medium">Vertical *</Label>
            </div>
            <VerticalSelector
              value={formData.vertical}
              verticals={verticals}
              verticalColors={verticalColors}
              onChange={(value) => updateData('vertical', value)}
              onAddVertical={onAddVertical}
            />
          </div>
        </div>

        {/* Horizontal Divider */}
        <Separator className="my-6" />

        {/* Description & Notes */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm">Description & Notes <span className="text-xs text-muted-foreground font-normal">(Optional)</span></h3>
          </div>
          
          {/* Project Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs text-muted-foreground">Project Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateData('description', e.target.value)}
              placeholder="Add project description, requirements, or other details..."
              className="min-h-[100px] bg-background border-2 focus:border-primary resize-none"
            />
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="text-xs text-muted-foreground">Internal Notes (max 150 chars)</Label>
            <Textarea
              id="notes"
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
          </div>
        </div>

        {/* Horizontal Divider */}
        <Separator className="my-6" />

        {/* Timeline */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
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
        </div>

        {/* Status */}
        <div className="space-y-4 pt-[13px] pr-[0px] pb-[0px] pl-[0px]">
          <div className="flex items-center gap-2">
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
        </div>

        {/* Horizontal Divider */}
        <Separator className="my-6" />

        {/* Collaborators */}
        <TeamMemberManager
          formData={formData}
          collaborators={collaborators}
          onFormDataChange={onFormDataChange}
        />
    </div>

    {/* ============================================ */}
    {/* VERTICAL DIVIDER                            */}
    {/* ============================================ */}
    <Separator orientation="vertical" className="hidden lg:block h-auto" />

    {/* ============================================ */}
    {/* RIGHT COLUMN - Content & Assets             */}
    {/* ============================================ */}
    <div className="space-y-6 lg:pr-4 min-w-0">
      {/* Actionable Items */}
      <Card className="overflow-hidden min-w-0">
        <CardContent className="p-4 space-y-6">
          {/* Illustration Types Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Illustration Types *</h3>
            </div>
            
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

          {/* Divider */}
          <div className="border-t border-border" />

          {/* Workflow/Actionable Items Section */}
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

      {/* Add Section Buttons - Show buttons for hidden sections */}
      {(!showProjectLinks || !showLightroomAssets || !showGDriveAssets) && (
        <Card className="overflow-hidden min-w-0">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Add Assets</h3>
            </div>
            <div className="flex gap-2">
              {!showProjectLinks && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProjectLinks(true)}
                  className="h-auto py-3 flex-1 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/50"
                >
                  <LinkIcon className="h-5 w-5" />
                  <span className="text-xs">Project Links</span>
                </Button>
              )}
              {!showLightroomAssets && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowLightroomAssets(true)}
                  className="h-auto py-3 flex-1 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/50"
                >
                  <LightroomIcon className="h-5 w-5" />
                  <span className="text-xs">Lightroom Assets</span>
                </Button>
              )}
              {!showGDriveAssets && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowGDriveAssets(true)}
                  className="h-auto py-3 flex-1 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/50"
                >
                  <GoogleDriveIcon className="h-5 w-5" />
                  <span className="text-xs">Google Drive Assets</span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Links */}
      {showProjectLinks && (
      <Card className="overflow-hidden min-w-0">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              <h3 className="font-medium text-sm">Project Links</h3>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowProjectLinks(false)}
              className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
              title="Hide section"
            >
              <X className="h-4 w-4" />
            </Button>
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
          
          {/* Add New Link - Icon Grid First Design */}
          <div className="space-y-3">
            {/* Icon Selection Section */}
            {!showCustomInput ? (
              <div className="space-y-3">
                <Label className="text-xs font-medium text-muted-foreground">QUICK SELECT ICON</Label>
                
                {/* Icon Grid - 4 columns, 40px icons */}
                <ScrollArea className="h-[280px] border-2 rounded-lg bg-muted/20">
                  <div className="p-3 grid grid-cols-4 gap-2">
                    {premadeIcons.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => selectPresetIcon(preset)}
                        className={`flex flex-col items-center gap-1.5 p-2.5 rounded-md transition-all hover:bg-accent ${
                          selectedPresetIcon?.id === preset.id 
                            ? 'bg-primary/10 ring-2 ring-primary' 
                            : 'bg-background'
                        }`}
                        title={preset.name}
                      >
                        <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
                          {renderPresetIcon(preset)}
                        </div>
                        <span className="text-[10px] text-center leading-tight line-clamp-2 w-full">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                
                {/* Custom Label Button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCustomInput(true);
                    setSelectedPresetIcon(null);
                  }}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Custom Label
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="custom_label" className="text-xs font-medium text-muted-foreground">
                  CUSTOM LABEL
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="custom_label"
                    value={customLinkLabel}
                    onChange={(e) => setCustomLinkLabel(e.target.value)}
                    placeholder="Enter custom label..."
                    className="flex-1 h-10 bg-muted/30"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomLinkLabel('');
                    }}
                    className="px-3"
                    title="Back to icon selection"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Custom labels will use a generic link icon
                </p>
              </div>
            )}

            {/* Selected Icon Preview */}
            {selectedPresetIcon && !showCustomInput && (
              <div className="flex items-center gap-3 p-3 bg-primary/5 border-2 border-primary/30 rounded-lg">
                <div className="flex items-center justify-center w-10 h-10 rounded-md bg-background flex-shrink-0">
                  {renderPresetIcon(selectedPresetIcon)}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{selectedPresetIcon.name}</div>
                  <div className="text-xs text-muted-foreground">{selectedPresetIcon.category}</div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPresetIcon(null)}
                  className="h-7 w-7 p-0"
                  title="Clear selection"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
            
            {/* URL */}
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
                      const finalLabel = showCustomInput ? customLinkLabel.trim() : selectedPresetIcon?.name || '';
                      if (finalLabel && newLinkUrl.trim()) {
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
                  disabled={
                    (!selectedPresetIcon && !customLinkLabel.trim() && !showCustomInput) ||
                    !newLinkUrl.trim()
                  }
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                💡 Paste a URL to auto-detect the matching icon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      )}

      {/* Lightroom Assets */}
      {showLightroomAssets && (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <LightroomAssetManager
            assets={formData.lightroom_assets || []}
            onChange={(assets) => updateData('lightroom_assets', assets)}
            actionableItems={formData.actionable_items || []}
            onClose={() => setShowLightroomAssets(false)}
          />
        </CardContent>
      </Card>
      )}

      {/* Google Drive Assets */}
      {showGDriveAssets && (
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <GDriveAssetManager
            assets={formData.gdrive_assets || []}
            onChange={(assets) => updateData('gdrive_assets', assets)}
            projectId={projectId || `temp-${Date.now()}`}
            actionableItems={formData.actionable_items || []}
            onClose={() => setShowGDriveAssets(false)}
          />
        </CardContent>
      </Card>
      )}
    </div>
    {/* End RIGHT Column */}

  </div>
);
};