import { useState, useRef, useEffect } from 'react';
import { User, Upload, Loader2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAdminProfile, AdminProfile } from '../hooks/useAdminProfile';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';
import { openSlackDirectMessage } from '../utils/slackUtils';

export function AdminProfileManager() {
  const { user, isAdmin } = useAuth();
  const { profile, loading, updateProfile, uploadPhoto } = useAdminProfile();
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Local state for form fields
  const [formData, setFormData] = useState<Partial<AdminProfile>>({});
  
  // Initialize form data when profile loads
  useEffect(() => {
    if (profile && Object.keys(formData).length === 0) {
      setFormData({
        full_name: profile.full_name || '',
        username: profile.username || '',
        slack_id: profile.slack_id || '',
        slack_profile_url: profile.slack_profile_url || '',
        slack_photo_url: profile.slack_photo_url || '',
      });
    }
  }, [profile]);

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Admin Profile
          </CardTitle>
          <CardDescription>
            Only administrators can manage profile settings
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Admin Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleFieldChange = (field: keyof AdminProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      await updateProfile(formData);
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const photoUrl = await uploadPhoto(file);
      toast.success('Photo uploaded successfully!');
      console.log('Uploaded photo URL:', photoUrl);
    } catch (error) {
      console.error('Failed to upload photo:', error);
      toast.error('Failed to upload photo. Please try again.');
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const getDisplayPhoto = () => {
    if (profile?.custom_photo_url) return profile.custom_photo_url;
    if (profile?.slack_photo_url) return profile.slack_photo_url;
    return null;
  };

  const getInitials = () => {
    if (profile?.username) {
      return profile.username.substring(0, 2).toUpperCase();
    }
    if (profile?.email) {
      return profile.email.substring(0, 2).toUpperCase();
    }
    return 'AD';
  };

  const hasChanges = Object.keys(formData).some(
    key => formData[key as keyof AdminProfile] !== profile?.[key as keyof AdminProfile]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Admin Profile
        </CardTitle>
        <CardDescription>
          Manage your administrator profile and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Profile Photo Section */}
        <div className="space-y-3">
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={getDisplayPhoto() || undefined} />
              <AvatarFallback className="text-lg">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploading}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Upload Custom Photo
                    </>
                  )}
                </Button>
                {profile?.custom_photo_url && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => updateProfile({ custom_photo_url: undefined })}
                    className="text-destructive hover:text-destructive"
                  >
                    Remove Custom Photo
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Upload a custom photo or use your Slack profile photo. Max 5MB. JPG, PNG, or GIF.
              </p>
            </div>
          </div>
        </div>

        {/* Email (Read-only) */}
        <div className="space-y-2">
          <Label htmlFor="email">Email (Admin)</Label>
          <Input
            id="email"
            type="email"
            value={profile?.email || user?.email || ''}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Your email is managed by your account settings
          </p>
        </div>

        {/* Full Name */}
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            type="text"
            placeholder="Ryan Setiawan"
            value={formData.full_name || ''}
            onChange={(e) => handleFieldChange('full_name', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Your full name for formal display (e.g., in Contact Admin dialog)
          </p>
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            type="text"
            placeholder="ryansetiawan"
            value={formData.username || ''}
            onChange={(e) => handleFieldChange('username', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Short display name for casual contexts
          </p>
        </div>

        {/* Slack Integration */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="h-px flex-1 bg-border" />
            <span className="text-sm text-muted-foreground">Slack Integration</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Slack ID */}
          <div className="space-y-2">
            <Label htmlFor="slack_id">Slack User ID</Label>
            <Input
              id="slack_id"
              type="text"
              placeholder="U01234ABCDE"
              value={formData.slack_id || ''}
              onChange={(e) => handleFieldChange('slack_id', e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Your Slack user ID (found in profile settings)
            </p>
          </div>

          {/* Slack Profile URL */}
          <div className="space-y-2">
            <Label htmlFor="slack_profile_url">Slack Profile URL</Label>
            <div className="flex gap-2">
              <Input
                id="slack_profile_url"
                type="url"
                placeholder="https://yourteam.slack.com/team/U01234ABCDE"
                value={formData.slack_profile_url || ''}
                onChange={(e) => handleFieldChange('slack_profile_url', e.target.value)}
                className="flex-1"
              />
              {formData.slack_profile_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(formData.slack_profile_url, '_blank')}
                  title="Open Slack profile"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Link to your Slack profile page
            </p>
          </div>

          {/* Slack Photo URL */}
          <div className="space-y-2">
            <Label htmlFor="slack_photo_url">Slack Photo URL</Label>
            <div className="flex gap-2">
              <Input
                id="slack_photo_url"
                type="url"
                placeholder="https://avatars.slack-edge.com/..."
                value={formData.slack_photo_url || ''}
                onChange={(e) => handleFieldChange('slack_photo_url', e.target.value)}
                className="flex-1"
              />
              {formData.slack_photo_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => window.open(formData.slack_photo_url, '_blank')}
                  title="View photo"
                >
                  <ImageIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Direct URL to your Slack profile photo (used as fallback if no custom photo)
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            {hasChanges ? 'You have unsaved changes' : 'All changes saved'}
          </p>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className="min-w-[120px]"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}