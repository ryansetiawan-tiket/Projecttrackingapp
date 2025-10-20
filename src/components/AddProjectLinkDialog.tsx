import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Plus, X, Link as LinkIcon, Pencil, Trash2 } from 'lucide-react';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
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
  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<PremadeIcon | null>(null);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  
  // Use controlled or internal open state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;
  
  // Fetch link labels (for saved custom labels)
  const { linkLabels } = useLinkLabels();
  
  // Set prefilled project when dialog opens
  useEffect(() => {
    if (open && prefilledProjectId) {
      setSelectedProjectId(prefilledProjectId);
    }
  }, [open, prefilledProjectId]);
  
  // Auto-detect icon from URL
  useEffect(() => {
    if (!newLinkUrl || editingLinkId) return;
    
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
        'confluence.': 'confluence', // matches confluence.* domains
      };
      
      // Find matching icon
      for (const [domainKey, iconId] of Object.entries(domainMap)) {
        if (domain.includes(domainKey)) {
          const icon = premadeIcons.find(i => i.id === iconId);
          if (icon && !selectedIcon) {
            setSelectedIcon(icon);
            setShowCustomInput(false);
          }
          break;
        }
      }
    } catch (e) {
      // Invalid URL, ignore
    }
  }, [newLinkUrl, selectedIcon, editingLinkId]);
  
  // Get selected project
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  // Sort projects alphabetically
  const sortedProjects = [...projects].sort((a, b) => 
    a.project_name.localeCompare(b.project_name)
  );
  
  const handleReset = () => {
    setSelectedProjectId('');
    setNewLinkUrl('');
    setSelectedIcon(null);
    setShowCustomInput(false);
    setCustomLabel('');
    setEditingLinkId(null);
  };
  
  const handleClose = () => {
    handleReset();
    setOpen(false);
  };
  
  const renderPresetIcon = (preset: PremadeIcon) => {
    return (
      <div 
        className="w-full h-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto" 
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
    setNewLinkUrl(link.url);
    
    // Try to match with preset icon
    const matchedPreset = premadeIcons.find(
      p => p.name.toLowerCase() === link.label.toLowerCase()
    );
    
    if (matchedPreset) {
      setSelectedIcon(matchedPreset);
      setShowCustomInput(false);
    } else {
      // Custom label
      setCustomLabel(link.label);
      setShowCustomInput(true);
      setSelectedIcon(null);
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
        setNewLinkUrl('');
        setSelectedIcon(null);
        setShowCustomInput(false);
        setCustomLabel('');
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
    
    const finalLabel = showCustomInput ? customLabel.trim() : selectedIcon?.name || '';
    
    if (!finalLabel) {
      toast.error('Please select an icon or enter a custom label');
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
          ? { ...link, label: finalLabel, url: newLinkUrl.trim() }
          : link
      );
    } else {
      // Create new link
      const newLink: ProjectLink = {
        id: `link-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        label: finalLabel,
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
      setNewLinkUrl('');
      setSelectedIcon(null);
      setShowCustomInput(false);
      setCustomLabel('');
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingLinkId ? 'Edit Project Link' : 'Add Project Link'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto flex-1">
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
                  <ScrollArea className="max-h-[150px]">
                    <div className="space-y-2 pr-4">
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
                  </ScrollArea>
                </div>
              )}

              {/* Editing Indicator */}
              {editingLinkId && (
                <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-md">
                  <Pencil className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Editing link</span>
                </div>
              )}

              {/* Icon Selection Section */}
              {!showCustomInput ? (
                <div className="space-y-3">
                  <Label>Quick Select Icon</Label>
                  
                  {/* Icon Grid - 4 columns, 40px icons */}
                  <ScrollArea className="h-[280px] border-2 rounded-lg bg-muted/20">
                    <div className="p-3 grid grid-cols-4 gap-2">
                      {premadeIcons.map((preset) => (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setSelectedIcon(preset);
                            setShowCustomInput(false);
                          }}
                          className={`flex flex-col items-center gap-1.5 p-2.5 rounded-md transition-all hover:bg-accent ${
                            selectedIcon?.id === preset.id 
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
                      setSelectedIcon(null);
                    }}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Custom Label
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="custom_label">
                    Custom Label <span className="text-destructive">*</span>
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom_label"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="Enter custom label..."
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomInput(false);
                        setCustomLabel('');
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
              {selectedIcon && !showCustomInput && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 border-2 border-primary/30 rounded-lg">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-background flex-shrink-0">
                    {renderPresetIcon(selectedIcon)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{selectedIcon.name}</div>
                    <div className="text-xs text-muted-foreground">{selectedIcon.category}</div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedIcon(null)}
                    className="h-7 w-7 p-0"
                    title="Clear selection"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}
              
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
                      const finalLabel = showCustomInput ? customLabel.trim() : selectedIcon?.name || '';
                      if (finalLabel && newLinkUrl.trim()) {
                        handleSaveLink();
                      }
                    }
                  }}
                />
                {!editingLinkId && (
                  <p className="text-xs text-muted-foreground">
                    💡 Paste a URL to auto-detect the matching icon
                  </p>
                )}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 border-t pt-4">
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
                setNewLinkUrl('');
                setSelectedIcon(null);
                setShowCustomInput(false);
                setCustomLabel('');
              }}
            >
              Cancel Edit
            </Button>
          )}
          <Button 
            onClick={handleSaveLink}
            disabled={
              !selectedProjectId || 
              (!selectedIcon && !customLabel.trim() && !showCustomInput) ||
              !newLinkUrl.trim()
            }
          >
            <Plus className="h-4 w-4 mr-2" />
            {editingLinkId ? 'Update Link' : 'Add Link'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
