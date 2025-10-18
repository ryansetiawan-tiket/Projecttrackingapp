import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Switch } from './ui/switch';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from './ui/select';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { CalendarIcon, Upload, Info, AlertTriangle, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useSnackbarSettings, SnackbarSettings } from '../hooks/useSnackbarSettings';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import { getContrastColor } from '../utils/colorUtils';

interface AnnouncementManagerProps {
  isAdmin: boolean;
}

const PRESET_ICONS = [
  { value: 'info', label: 'Info', icon: Info, color: '#3b82f6' },
  { value: 'warning', label: 'Warning', icon: AlertTriangle, color: '#f59e0b' },
  { value: 'alert', label: 'Alert', icon: AlertCircle, color: '#ef4444' },
  { value: 'success', label: 'Success', icon: CheckCircle, color: '#10b981' },
];

const AUTO_HIDE_PRESETS = [
  { value: 5, label: '5 seconds (Quick)' },
  { value: 10, label: '10 seconds (Standard)' },
  { value: 30, label: '30 seconds (Important)' },
  { value: 60, label: '60 seconds (Critical)' },
];

export function AnnouncementManager({ isAdmin }: AnnouncementManagerProps) {
  const { snackbar, loading, saving, updateSnackbar, refreshSnackbar } = useSnackbarSettings();
  const { user, accessToken } = useAuth();
  
  // Form state
  const [formData, setFormData] = useState<SnackbarSettings>(snackbar);
  const [customDuration, setCustomDuration] = useState('');
  const [iconType, setIconType] = useState<'none' | 'preset' | 'emoji' | 'image'>('none');
  const [emojiInput, setEmojiInput] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  // Sync form with fetched snackbar data
  useEffect(() => {
    setFormData(snackbar);
    setIconType(snackbar.icon?.type || 'none');
    
    if (snackbar.icon?.type === 'emoji') {
      setEmojiInput(snackbar.icon.value);
    } else if (snackbar.icon?.type === 'image') {
      setImageUrl(snackbar.icon.value);
    }

    if (snackbar.startDate) {
      setStartDate(new Date(snackbar.startDate));
    }
    if (snackbar.endDate) {
      setEndDate(new Date(snackbar.endDate));
    }
  }, [snackbar]);

  const handleSave = async () => {
    if (!accessToken) {
      toast.error('You must be logged in to update settings');
      return;
    }

    if (!isAdmin) {
      toast.error('Only admins can update announcement settings');
      return;
    }

    // Validate text length
    if (formData.enabled && formData.text.length > 200) {
      toast.error('Announcement text must be 200 characters or less');
      return;
    }

    // Build icon data
    let iconData = { type: 'none' as const, value: '' };
    
    if (iconType === 'preset' && formData.icon.value) {
      iconData = { type: 'preset', value: formData.icon.value };
    } else if (iconType === 'emoji' && emojiInput) {
      iconData = { type: 'emoji', value: emojiInput };
    } else if (iconType === 'image' && imageUrl) {
      iconData = { type: 'image', value: imageUrl };
    }

    const updates: Partial<SnackbarSettings> = {
      ...formData,
      startDate: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      endDate: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      icon: iconData,
    };

    const result = await updateSnackbar(updates, accessToken);

    if (result.success) {
      toast.success('Announcement settings saved successfully!');
      refreshSnackbar();
    } else {
      toast.error(result.error || 'Failed to save settings');
    }
  };

  const handleReset = () => {
    setFormData(snackbar);
    setIconType(snackbar.icon?.type || 'none');
    setEmojiInput(snackbar.icon?.type === 'emoji' ? snackbar.icon.value : '');
    setImageUrl(snackbar.icon?.type === 'image' ? snackbar.icon.value : '');
    setStartDate(snackbar.startDate ? new Date(snackbar.startDate) : undefined);
    setEndDate(snackbar.endDate ? new Date(snackbar.endDate) : undefined);
    toast.info('Form reset to saved values');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground text-center">
          Only admins can manage announcement settings.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enable/Disable Toggle */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label className="text-base">Enable Announcement Banner</Label>
            <p className="text-sm text-muted-foreground">
              Show announcement banner to all users
            </p>
          </div>
          <Switch
            checked={formData.enabled}
            onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
          />
        </div>
      </Card>

      {/* Message Configuration */}
      <Card className="p-6 space-y-6">
        <div>
          <h3 className="mb-4">Message Content</h3>
          
          {/* Message Text */}
          <div className="space-y-2">
            <Label htmlFor="message-text">Announcement Text</Label>
            <Textarea
              id="message-text"
              placeholder="Enter your announcement message..."
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              maxLength={200}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">
              {formData.text.length} / 200 characters
            </p>
          </div>
        </div>

        {/* Color Pickers */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bg-color">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="bg-color"
                type="color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                className="w-20 h-10 cursor-pointer"
              />
              <Input
                type="text"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                placeholder="#3b82f6"
                className="flex-1"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="text-color">Text Color</Label>
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-contrast" className="text-sm cursor-pointer">
                  Auto Contrast
                </Label>
                <Switch
                  id="auto-contrast"
                  checked={formData.useAutoContrast}
                  onCheckedChange={(checked) => setFormData({ ...formData, useAutoContrast: checked })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                id="text-color"
                type="color"
                value={formData.useAutoContrast ? getContrastColor(formData.backgroundColor) : formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-20 h-10 cursor-pointer"
                disabled={formData.useAutoContrast}
              />
              <Input
                type="text"
                value={formData.useAutoContrast ? getContrastColor(formData.backgroundColor) : formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                placeholder="#ffffff"
                className="flex-1"
                disabled={formData.useAutoContrast}
              />
            </div>
            {formData.useAutoContrast && (
              <p className="text-xs text-muted-foreground">
                Text color is automatically calculated for optimal contrast
              </p>
            )}
          </div>
        </div>

        {/* Icon Configuration */}
        <div className="space-y-3">
          <Label>Icon</Label>
          
          <Select
            value={iconType}
            onValueChange={(value: any) => setIconType(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select icon type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No Icon</SelectItem>
              <SelectItem value="preset">Preset Icon</SelectItem>
              <SelectItem value="emoji">Emoji</SelectItem>
              <SelectItem value="image">Custom Image URL</SelectItem>
            </SelectContent>
          </Select>

          {/* Preset Icons */}
          {iconType === 'preset' && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {PRESET_ICONS.map((preset) => {
                const Icon = preset.icon;
                const isSelected = formData.icon.value === preset.value;
                return (
                  <button
                    key={preset.value}
                    onClick={() => setFormData({ 
                      ...formData, 
                      icon: { type: 'preset', value: preset.value }
                    })}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      isSelected 
                        ? 'border-primary bg-primary/10' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Icon className="h-5 w-5" style={{ color: preset.color }} />
                    <span className="text-sm">{preset.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Emoji Input */}
          {iconType === 'emoji' && (
            <Input
              placeholder="Enter emoji (e.g., 🎉 📢 ⚠️)"
              value={emojiInput}
              onChange={(e) => {
                setEmojiInput(e.target.value);
                setFormData({ 
                  ...formData, 
                  icon: { type: 'emoji', value: e.target.value }
                });
              }}
              maxLength={2}
            />
          )}

          {/* Image URL Input */}
          {iconType === 'image' && (
            <Input
              placeholder="Enter image URL"
              value={imageUrl}
              onChange={(e) => {
                setImageUrl(e.target.value);
                setFormData({ 
                  ...formData, 
                  icon: { type: 'image', value: e.target.value }
                });
              }}
            />
          )}
        </div>
      </Card>

      {/* Scheduling */}
      <Card className="p-6 space-y-4">
        <div>
          <h3 className="mb-2">Scheduling (Optional)</h3>
          <p className="text-sm text-muted-foreground">
            Set date range for when the banner should be displayed
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {startDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStartDate(undefined)}
                className="w-full"
              >
                Clear
              </Button>
            )}
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {endDate && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEndDate(undefined)}
                className="w-full"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Behavior Settings */}
      <Card className="p-6 space-y-4">
        <h3>Behavior Settings</h3>

        {/* Dismissable */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Dismissable</Label>
            <p className="text-sm text-muted-foreground">
              Allow users to close the banner
            </p>
          </div>
          <Switch
            checked={formData.dismissable}
            onCheckedChange={(checked) => setFormData({ ...formData, dismissable: checked })}
          />
        </div>

        {/* Auto Hide */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto Hide</Label>
            <p className="text-sm text-muted-foreground">
              Automatically hide after duration
            </p>
          </div>
          <Switch
            checked={formData.autoHide}
            onCheckedChange={(checked) => setFormData({ ...formData, autoHide: checked })}
          />
        </div>

        {/* Auto Hide Duration */}
        {formData.autoHide && (
          <div className="space-y-2 pl-6 border-l-2 border-border">
            <Label>Auto Hide Duration</Label>
            <Select
              value={formData.autoHideDuration.toString()}
              onValueChange={(value) => {
                if (value === 'custom') {
                  setFormData({ ...formData, autoHideDuration: parseInt(customDuration) || 10 });
                } else {
                  setFormData({ ...formData, autoHideDuration: parseInt(value) });
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                {AUTO_HIDE_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value.toString()}>
                    {preset.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>

            {!AUTO_HIDE_PRESETS.find(p => p.value === formData.autoHideDuration) && (
              <Input
                type="number"
                placeholder="Custom duration (seconds)"
                value={customDuration}
                onChange={(e) => {
                  setCustomDuration(e.target.value);
                  const val = parseInt(e.target.value);
                  if (!isNaN(val) && val > 0) {
                    setFormData({ ...formData, autoHideDuration: val });
                  }
                }}
                min={1}
                max={300}
              />
            )}
          </div>
        )}
      </Card>

      {/* Preview */}
      <Card className="p-6 space-y-3">
        <h3>Preview</h3>
        <div
          className="rounded-lg p-4 flex items-center justify-between gap-3"
          style={{
            backgroundColor: formData.backgroundColor,
            color: formData.useAutoContrast ? getContrastColor(formData.backgroundColor) : formData.textColor,
          }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {formData.icon.type === 'preset' && formData.icon.value && (
              <>
                {formData.icon.value === 'info' && <Info className="h-5 w-5 flex-shrink-0" />}
                {formData.icon.value === 'warning' && <AlertTriangle className="h-5 w-5 flex-shrink-0" />}
                {formData.icon.value === 'alert' && <AlertCircle className="h-5 w-5 flex-shrink-0" />}
                {formData.icon.value === 'success' && <CheckCircle className="h-5 w-5 flex-shrink-0" />}
              </>
            )}
            {formData.icon.type === 'emoji' && formData.icon.value && (
              <span className="text-xl flex-shrink-0">{formData.icon.value}</span>
            )}
            {formData.icon.type === 'image' && formData.icon.value && (
              <img src={formData.icon.value} alt="Icon" className="h-5 w-5 flex-shrink-0 object-contain" />
            )}
            <p className="flex-1 min-w-0">
              {formData.text || 'Your announcement will appear here...'}
            </p>
          </div>
        </div>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="flex-1"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
        <Button
          onClick={handleReset}
          variant="outline"
          disabled={saving}
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
