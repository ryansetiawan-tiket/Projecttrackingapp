import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { MessageCircle, Mail, User } from 'lucide-react';
import { useAdminProfile } from '../hooks/useAdminProfile';
import { getRandomContactTexts } from '../utils/contactDialogTexts';
import { openSlackDirectMessage } from '../utils/slackUtils';

interface ContactAdminDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactAdminDialog({ open, onOpenChange }: ContactAdminDialogProps) {
  const { profile, loading } = useAdminProfile();

  // Randomize messages every time dialog opens
  const [contactMessage, setContactMessage] = useState('');
  const [footerMessage, setFooterMessage] = useState('');

  // Generate new random messages when dialog opens
  useEffect(() => {
    if (open) {
      const { contactMessage: newContact, footerMessage: newFooter } = getRandomContactTexts();
      setContactMessage(newContact);
      setFooterMessage(newFooter);
    }
  }, [open]);

  // Get admin email (from profile or fallback to whitelist email)
  const adminEmail = profile?.email || 'ryan.setiawan@tiket.com';
  
  // Get Slack profile URL (if available)
  const slackProfileUrl = profile?.slack_profile_url;
  
  // Get display name - prioritize full_name, then username, then fallback
  const displayName = profile?.full_name || profile?.username || 'Ryan';
  
  // Get photo URLs with proper fallback
  const photoUrl = profile?.custom_photo_url || profile?.slack_photo_url;

  console.log('[ContactAdminDialog] Profile data:', {
    profile,
    loading,
    photoUrl,
    custom_photo_url: profile?.custom_photo_url,
    slack_photo_url: profile?.slack_photo_url,
    username: profile?.username
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Need Help?</DialogTitle>
          <DialogDescription>
            Reach out if you have questions or issues with this page.
          </DialogDescription>
        </DialogHeader>

        {/* Admin Profile Section */}
        <div className="flex flex-col items-center gap-4 py-6">
          {/* Avatar */}
          <Avatar className="h-24 w-24 ring-2 ring-border">
            {photoUrl && (
              <AvatarImage 
                src={photoUrl} 
                alt={displayName}
                onLoad={() => console.log('[ContactAdminDialog] Photo loaded successfully:', photoUrl)}
                onError={(e) => {
                  console.error('[ContactAdminDialog] Photo failed to load:', photoUrl);
                  console.error('Error event:', e);
                }}
              />
            )}
            <AvatarFallback className="text-2xl">
              {(() => {
                // Try full_name first, then username, then email
                if (profile?.full_name) {
                  const names = profile.full_name.split(' ');
                  if (names.length >= 2) {
                    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
                  }
                  return profile.full_name.substring(0, 2).toUpperCase();
                }
                if (profile?.username) {
                  return profile.username.substring(0, 2).toUpperCase();
                }
                if (adminEmail) {
                  return adminEmail.substring(0, 2).toUpperCase();
                }
                return <User className="h-8 w-8" />;
              })()}
            </AvatarFallback>
          </Avatar>

          {/* Message */}
          <div className="text-center space-y-2">
            <h3 className="font-medium">{displayName}</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {contactMessage}
            </p>
          </div>
        </div>

        {/* Contact Buttons */}
        <div className="flex flex-col gap-2">
          {/* Slack Button - Show FIRST if available */}
          {slackProfileUrl && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12"
              onClick={() => {
                openSlackDirectMessage(slackProfileUrl);
              }}
            >
              <MessageCircle className="h-5 w-5 text-primary" />
              <div className="flex flex-col items-start flex-1">
                <span className="text-sm">Message on Slack</span>
                <span className="text-xs text-muted-foreground">
                  Quick response
                </span>
              </div>
            </Button>
          )}

          {/* Email Button - Show SECOND */}
          <Button
            variant="outline"
            className="w-full justify-start gap-3 h-12"
            onClick={() => {
              window.location.href = `mailto:${adminEmail}?subject=Question about ${document.title}`;
            }}
          >
            <Mail className="h-5 w-5 text-primary" />
            <div className="flex flex-col items-start flex-1">
              <span className="text-sm">Send Email</span>
              <span className="text-xs text-muted-foreground truncate max-w-[250px]">
                {adminEmail}
              </span>
            </div>
          </Button>
        </div>

        {/* Footer Note - Random fun message */}
        <p className="text-xs text-center text-muted-foreground pt-2">
          {footerMessage || 'Will respond ASAP!'}
        </p>
      </DialogContent>
    </Dialog>
  );
}