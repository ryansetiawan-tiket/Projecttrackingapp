import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Plus, Trash2, Link as LinkIcon, ExternalLink, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { premadeIcons, iconCategories, getIconsByCategory, type PremadeIcon } from '../utils/premadeIcons';

export interface LinkLabel {
  id: string;
  label: string;
  icon_type: 'text' | 'svg' | 'emoji';
  icon_value: string; // SVG string, emoji, or empty for text
  placeholder?: string;
  created_at: string;
  updated_at: string;
}

export function LinkLabelManager() {
  const [linkLabels, setLinkLabels] = useState<LinkLabel[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newLabel, setNewLabel] = useState({
    label: '',
    icon_type: 'premade' as 'text' | 'svg' | 'emoji' | 'premade',
    icon_value: '',
    placeholder: ''
  });
  const [selectedPremadeIcon, setSelectedPremadeIcon] = useState<PremadeIcon | null>(null);

  useEffect(() => {
    fetchLinkLabels();
  }, []);

  const fetchLinkLabels = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/link-labels`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch link labels: ${response.statusText}`);
      }

      const data = await response.json();
      setLinkLabels(data.linkLabels || []);
    } catch (error) {
      console.warn('[LinkLabelManager] Failed to fetch link labels (non-critical):', error);
      // Don't show toast error - this is non-critical and won't break functionality
      setLinkLabels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLinkLabel = async () => {
    if (!newLabel.label.trim()) {
      toast.error('Label is required');
      return;
    }

    if (newLabel.icon_type === 'premade' && !selectedPremadeIcon) {
      toast.error('Please select a premade icon');
      return;
    }

    try {
      // Use premade icon's SVG if selected
      const iconValue = newLabel.icon_type === 'premade' && selectedPremadeIcon 
        ? selectedPremadeIcon.svg 
        : newLabel.icon_value.trim();
      
      // Store actual icon type: 'svg' for premade and SVG code, 'emoji' for emoji, 'text' for default
      const iconType = newLabel.icon_type === 'premade' ? 'svg' : newLabel.icon_type;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/link-labels`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            label: newLabel.label.trim(),
            icon_type: iconType,
            icon_value: iconValue,
            placeholder: newLabel.placeholder.trim() || `Enter ${newLabel.label.toLowerCase()} URL`
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to create link label: ${response.statusText}`);
      }

      await fetchLinkLabels();
      setNewLabel({ label: '', icon_type: 'premade', icon_value: '', placeholder: '' });
      setSelectedPremadeIcon(null);
      setIsAdding(false);
      toast.success('Link label added successfully!');
    } catch (error) {
      console.error('Error creating link label:', error);
      toast.error('Failed to add link label');
    }
  };

  const handleDeleteLinkLabel = async (id: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/link-labels/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to delete link label: ${response.statusText}`);
      }

      await fetchLinkLabels();
      toast.success('Link label deleted successfully!');
    } catch (error) {
      console.error('Error deleting link label:', error);
      toast.error('Failed to delete link label');
    }
  };

  const renderIcon = (linkLabel: LinkLabel) => {
    if (linkLabel.icon_type === 'emoji') {
      return <span className="text-base">{linkLabel.icon_value}</span>;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Existing Link Labels */}
      <div className="space-y-3">
        {linkLabels.length === 0 && !isAdding && (
          <div className="text-center py-8 text-muted-foreground">
            <LinkIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No link labels yet. Add one to get started!</p>
          </div>
        )}

        {linkLabels.map((linkLabel) => (
          <Card key={linkLabel.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-muted/50 flex-shrink-0">
                    {renderIcon(linkLabel)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{linkLabel.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {linkLabel.placeholder || `Enter ${linkLabel.label.toLowerCase()} URL`}
                    </div>
                  </div>
                  <div className="hidden sm:block text-xs text-muted-foreground px-2 py-1 bg-muted/50 rounded-md">
                    {linkLabel.icon_type === 'svg' ? 'Custom' : linkLabel.icon_type}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLinkLabel(linkLabel.id)}
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add New Link Label Form */}
      {isAdding ? (
        <Card className="border-dashed">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="label">Label Name *</Label>
              <Input
                id="label"
                value={newLabel.label}
                onChange={(e) => setNewLabel({ ...newLabel, label: e.target.value })}
                placeholder="e.g., Figma, Google Sheets, Notion"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon-type">Icon Type</Label>
              <select
                id="icon-type"
                value={newLabel.icon_type}
                onChange={(e) => {
                  setNewLabel({ ...newLabel, icon_type: e.target.value as 'text' | 'svg' | 'emoji' | 'premade' });
                  setSelectedPremadeIcon(null);
                }}
                className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm"
              >
                <option value="premade">Premade Icons (Recommended)</option>
                <option value="text">Text (default link icon)</option>
                <option value="emoji">Emoji</option>
                <option value="svg">SVG Code</option>
              </select>
            </div>

            {newLabel.icon_type === 'premade' && (
              <div className="space-y-3">
                <Label>Select Icon *</Label>
                <div className="max-h-[400px] overflow-y-auto space-y-6 pr-2">
                  {iconCategories.map((category) => (
                    <div key={category} className="space-y-3">
                      <div className="text-xs uppercase tracking-wide text-muted-foreground px-1">
                        {category}
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                        {getIconsByCategory(category).map((icon) => (
                          <div key={icon.id} className="flex flex-col gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedPremadeIcon(icon);
                                setNewLabel({ ...newLabel, label: icon.name, icon_value: icon.svg });
                              }}
                              className={`relative aspect-square p-3 rounded-lg border-2 transition-all hover:border-primary/50 hover:bg-accent ${
                                selectedPremadeIcon?.id === icon.id
                                  ? 'border-primary bg-accent shadow-sm'
                                  : 'border-border bg-card'
                              }`}
                            >
                              <div 
                                className="w-full h-full flex items-center justify-center [&_svg]:max-w-full [&_svg]:max-h-full [&_svg]:w-auto [&_svg]:h-auto"
                                dangerouslySetInnerHTML={{ __html: icon.svg }}
                              />
                              {selectedPremadeIcon?.id === icon.id && (
                                <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-md">
                                  <Check className="h-3.5 w-3.5 text-primary-foreground" />
                                </div>
                              )}
                            </button>
                            <div className="text-[10px] text-center truncate text-muted-foreground px-1">
                              {icon.name}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newLabel.icon_type === 'emoji' && (
              <div className="space-y-2">
                <Label htmlFor="emoji">Emoji</Label>
                <Input
                  id="emoji"
                  value={newLabel.icon_value}
                  onChange={(e) => setNewLabel({ ...newLabel, icon_value: e.target.value })}
                  placeholder="e.g., 📊, 🎨, 📝"
                  maxLength={4}
                />
              </div>
            )}

            {newLabel.icon_type === 'svg' && (
              <div className="space-y-2">
                <Label htmlFor="svg">SVG Code</Label>
                <textarea
                  id="svg"
                  value={newLabel.icon_value}
                  onChange={(e) => setNewLabel({ ...newLabel, icon_value: e.target.value })}
                  placeholder="Paste your SVG code here..."
                  className="w-full min-h-[100px] px-3 py-2 rounded-md border border-input bg-background text-sm font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Tip: You can copy SVG code from icons like Figma or Google Sheets logos
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="placeholder">URL Placeholder (Optional)</Label>
              <Input
                id="placeholder"
                value={newLabel.placeholder}
                onChange={(e) => setNewLabel({ ...newLabel, placeholder: e.target.value })}
                placeholder={`Enter ${newLabel.label.toLowerCase() || 'link'} URL`}
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddLinkLabel} className="flex-1">
                <Plus className="h-4 w-4 mr-2" />
                Add Link Label
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false);
                  setNewLabel({ label: '', icon_type: 'premade', icon_value: '', placeholder: '' });
                  setSelectedPremadeIcon(null);
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add New Link Label
        </Button>
      )}

      {/* Info Section */}
      <Card className="bg-muted/30 border-none">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ExternalLink className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground">About Link Labels</p>
              <p>Create custom link types for your projects. Choose from {premadeIcons.length}+ premade icons (Figma, Google Sheets, Slack, etc.) or use custom emojis and SVG icons. These labels will be available when adding links to your projects.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
