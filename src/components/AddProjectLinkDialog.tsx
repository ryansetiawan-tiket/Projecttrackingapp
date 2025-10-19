import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, X, Link as LinkIcon, Pencil, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';
import { Project, ProjectLink } from '../types/project';
import { toast } from 'sonner@2.0.3';
import { useLinkLabels, type LinkLabel } from '../hooks/useLinkLabels';
import { premadeIcons, type PremadeIcon } from '../utils/premadeIcons';

interface AddProjectLinkDialogProps {
  projects: Project[];
  onProjectUpdate?: (id: string, data: Partial<Project>) => void;
  prefilledProjectId?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function AddProjectLinkDialog({ 
  projects, 
  onProjectUpdate,
  prefilledProjectId,
  open: controlledOpen,
  onOpenChange
}: AddProjectLinkDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newLinkLabel, setNewLinkLabel] = useState('');
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [selectedLinkLabel, setSelectedLinkLabel] = useState<LinkLabel | null>(null);
  const [selectedPresetIcon, setSelectedPresetIcon] = useState<PremadeIcon | null>(null);
  const [showLinkLabelPicker, setShowLinkLabelPicker] = useState(false);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  
  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  // Fetch link labels
  const { linkLabels } = useLinkLabels();
  
  // Set prefilled project when dialog opens
  useEffect(() => {
    if (open && prefilledProjectId) {
      setSelectedProjectId(prefilledProjectId);
    }
  }, [open, prefilledProjectId]);
  
  // Get selected project
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // Sort projects alphabetically
  const sortedProjects = [...projects].sort((a, b) => 
    a.project_name.localeCompare(b.project_name)
  );
  
  const handleReset = () => {
    setSelectedProjectId('');
    setNewLinkLabel('');
    setNewLinkUrl('');
    setSelectedLinkLabel(null);
    setSelectedPresetIcon(null);
    setShowLinkLabelPicker(false);
    setEditingLinkId(null);
  };
  
  const handleClose = () => {
    handleReset();
    setOpen(false);
  };
  
  const selectLinkLabel = (linkLabel: LinkLabel) => {
    setSelectedLinkLabel(linkLabel);
    setSelectedPresetIcon(null);
    setNewLinkLabel(linkLabel.label);
    setShowLinkLabelPicker(false);
  };
  
  const selectPresetIcon = (preset: PremadeIcon) => {
    setSelectedPresetIcon(preset);
    setSelectedLinkLabel(null);
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
  
  const renderLinkIcon = (label: string) => {
    const labelLower = label.toLowerCase();
    
    // Check database link labels
    const linkLabel = linkLabels.find(
      ll => ll?.label && ll.label.toLowerCase() === labelLower
    );
    
    if (linkLabel?.icon_type === 'svg' && linkLabel.icon_value) {
      return (
        <div 
          className="w-5 h-5 flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto" 
          dangerouslySetInnerHTML={{ __html: linkLabel.icon_value }}
        />
      );
    }
    
    if (linkLabel?.icon_type === 'emoji' && linkLabel.icon_value) {
      return <span className="text-lg">{linkLabel.icon_value}</span>;
    }
    
    // Check preset icons
    const preset = premadeIcons.find(
      p => p.name.toLowerCase() === labelLower || p.id === labelLower.replace(/\s+/g, '-')
    );
    
    if (preset) {
      return renderPresetIcon(preset);
    }
    
    // Fallback
    return <LinkIcon className="h-5 w-5" />;
  };
  
  const handleEditLink = (link: ProjectLink) => {
    setEditingLinkId(link.id);
    setNewLinkLabel(link.label);
    setNewLinkUrl(link.url);
    
    // Try to match with existing link label or preset
    const matchedLinkLabel = linkLabels.find(
      ll => ll.label.toLowerCase() === link.label.toLowerCase()
    );
    
    if (matchedLinkLabel) {
      setSelectedLinkLabel(matchedLinkLabel);
    } else {
      const matchedPreset = premadeIcons.find(
        p => p.name.toLowerCase() === link.label.toLowerCase()
      );
      if (matchedPreset) {
        setSelectedPresetIcon(matchedPreset);
      }
    }
  };
  
  const handleDeleteLink = async (linkId: string) => {
    if (!selectedProject) return;
    
    const currentLinks = selectedProject.links?.labeled || [];
    const updatedLinks = currentLinks.filter(l => l.id !== linkId);
    
    try {
      if (onProjectUpdate) {
        await onProjectUpdate(selectedProjectId, {
          links: {
            ...selectedProject.links,
            labeled: updatedLinks
          }
        });
      }
      
      toast.success('Link deleted');
      
      // If we're editing this link, reset the form
      if (editingLinkId === linkId) {
        setEditingLinkId(null);
        setNewLinkLabel('');
        setNewLinkUrl('');
        setSelectedLinkLabel(null);
        setSelectedPresetIcon(null);
        setShowLinkLabelPicker(false);
      }
    } catch (error) {
      console.error('Error deleting link:', error);
      toast.error('Failed to delete link');
    }
  };
  
  const handleSaveLink = async () => {
    // Validation
    if (!selectedProjectId) {
      toast.error('Please select a project');
      return;
    }
    
    if (!newLinkLabel.trim()) {
      toast.error('Link label is required');
      return;
    }
    
    if (!newLinkUrl.trim()) {
      toast.error('URL is required');
      return;
    }
    
    if (!selectedProject) {
      toast.error('Project not found');
      return;
    }
    
    const currentLinks = selectedProject.links?.labeled || [];
    let updatedLinks: ProjectLink[];
    
    if (editingLinkId) {
      // Update existing link
      updatedLinks = currentLinks.map(link => 
        link.id === editingLinkId
          ? { ...link, label: newLinkLabel.trim(), url: newLinkUrl.trim() }
          : link
      );
    } else {
      // Create new link
      const newLink: ProjectLink = {
        id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: newLinkLabel.trim(),
        url: newLinkUrl.trim()
      };
      updatedLinks = [...currentLinks, newLink];
    }
    
    try {
      if (onProjectUpdate) {
        await onProjectUpdate(selectedProjectId, {
          links: {
            ...selectedProject.links,
            labeled: updatedLinks
          }
        });
      }
      
      toast.success(editingLinkId ? 'Link updated' : `Link added to ${selectedProject.project_name}`);
      
      // Reset form fields but keep project selected for easy multiple additions
      setNewLinkLabel('');
      setNewLinkUrl('');
      setSelectedLinkLabel(null);
      setSelectedPresetIcon(null);
      setShowLinkLabelPicker(false);
      setEditingLinkId(null);
    } catch (error) {
      console.error('Error saving link:', error);
      toast.error('Failed to save link');
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Show trigger button only if not using controlled state */}
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="default" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Project Link
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingLinkId ? 'Edit Project Link' : 'Add Project Link'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Project Selector - MANDATORY */}
          <div className="space-y-2">
            <Label htmlFor="project_selector">
              Select Project <span className="text-destructive">*</span>
            </Label>
            <Select
              value={selectedProjectId}
              onValueChange={setSelectedProjectId}
            >
              <SelectTrigger id="project_selector">
                <SelectValue placeholder="Select a project..." />
              </SelectTrigger>
              <SelectContent>
                {sortedProjects.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No projects available</div>
                ) : (
                  sortedProjects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.project_name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Show form only if project is selected */}
          {selectedProjectId && (
            <>
              {/* Existing Links - Editable */}
              {selectedProject?.links?.labeled && selectedProject.links.labeled.length > 0 && (
                <div className="space-y-2 p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <LinkIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Existing Links</span>
                  </div>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {selectedProject.links.labeled.map((link) => (
                      <div 
                        key={link.id} 
                        className={`flex items-start gap-2 p-2 bg-background rounded transition-colors ${
                          editingLinkId === link.id ? 'ring-2 ring-primary' : ''
                        }`}
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/50 flex-shrink-0">
                          {renderLinkIcon(link.label)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">{link.label}</div>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline break-all"
                            title={link.url}
                          >
                            {link.url}
                          </a>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditLink(link)}
                            className="h-7 w-7 p-0"
                            title="Edit link"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLink(link.id)}
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            title="Delete link"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Editing Indicator */}
              {editingLinkId && (
                <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-md">
                  <Pencil className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Editing link</span>
                </div>
              )}

              {/* Link Label */}
              <div className="space-y-2">
                <Label htmlFor="link_label">
                  Link Label <span className="text-destructive">*</span>
                </Label>
                
                {/* Show selected label/preset or input */}
                {selectedLinkLabel || selectedPresetIcon ? (
                  <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border-2 border-primary/50">
                    <div className="flex items-center justify-center w-8 h-8 rounded-md bg-background flex-shrink-0">
                      {selectedLinkLabel ? renderLinkLabelIcon(selectedLinkLabel) : selectedPresetIcon ? renderPresetIcon(selectedPresetIcon) : null}
                    </div>
                    <span className="flex-1 font-medium">{selectedLinkLabel?.label || selectedPresetIcon?.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedLinkLabel(null);
                        setSelectedPresetIcon(null);
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
                            <div className="p-3 space-y-2">
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
                          <div className="p-6 text-center border-2 border-dashed border-muted rounded-lg">
                            <p className="text-sm text-muted-foreground">No saved labels yet</p>
                            <p className="text-xs text-muted-foreground mt-1">Create them in Settings → Link Labels</p>
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
                      className="flex-1"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newLinkLabel.trim() && newLinkUrl.trim()) {
                            handleSaveLink();
                          }
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowLinkLabelPicker(true)}
                      className="px-3 shrink-0"
                      title="Choose from presets or saved labels"
                    >
                      <LinkIcon className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {/* URL */}
              <div className="space-y-2">
                <Label htmlFor="link_url">
                  URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="link_url"
                  type="url"
                  value={newLinkUrl}
                  onChange={(e) => setNewLinkUrl(e.target.value)}
                  placeholder="https://..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newLinkLabel.trim() && newLinkUrl.trim()) {
                        handleSaveLink();
                      }
                    }
                  }}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose}
          >
            Close
          </Button>
          {editingLinkId && (
            <Button 
              variant="outline"
              onClick={() => {
                setEditingLinkId(null);
                setNewLinkLabel('');
                setNewLinkUrl('');
                setSelectedLinkLabel(null);
                setSelectedPresetIcon(null);
                setShowLinkLabelPicker(false);
              }}
            >
              Cancel Edit
            </Button>
          )}
          <Button 
            onClick={handleSaveLink}
            disabled={!selectedProjectId || !newLinkLabel.trim() || !newLinkUrl.trim()}
          >
            <Plus className="h-4 w-4 mr-2" />
            {editingLinkId ? 'Update Link' : 'Add Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}