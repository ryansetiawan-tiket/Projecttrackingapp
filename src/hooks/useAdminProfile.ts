import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { projectId, publicAnonKey } from '../utils/supabase/info';

// Scalable admin profile structure - easy to add new fields
export interface AdminProfile {
  email: string;
  full_name?: string; // Full display name for formal contexts
  username?: string; // Short username for casual contexts
  slack_id?: string;
  slack_profile_url?: string;
  slack_photo_url?: string;
  custom_photo_url?: string;
  // Easy to add new fields:
  // phone?: string;
  // timezone?: string;
  // bio?: string;
  // etc...
  
  // Metadata for extensibility
  metadata?: Record<string, any>;
  
  // System fields
  created_at?: string;
  updated_at?: string;
}

interface UseAdminProfileResult {
  profile: AdminProfile | null;
  loading: boolean;
  error: string | null;
  updateProfile: (updates: Partial<AdminProfile>) => Promise<void>;
  uploadPhoto: (file: File) => Promise<string>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing admin profile
 * - Loads profile from database based on logged-in user's email
 * - Admin can update their own profile
 * - Supports photo upload to Supabase Storage
 */
export function useAdminProfile(): UseAdminProfileResult {
  const { user, isAdmin, accessToken } = useAuth();
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load profile from database
  const loadProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Determine which token to use:
      // - If user is logged in, use their accessToken (can update profile)
      // - If user is NOT logged in, use publicAnonKey (read-only, for public view)
      const authToken = accessToken || publicAnonKey;
      const isPublicView = !accessToken;
      
      console.log(`[useAdminProfile] Loading profile ${isPublicView ? '(public view)' : `for: ${user?.email}`}`);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/admin-profile`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (!response.ok) {
        // If 401 Unauthorized and using public view (no accessToken), silently use fallback
        if (response.status === 401 && !accessToken) {
          console.log(`[useAdminProfile] Public view - using fallback profile (401 expected)`);
          setProfile({
            email: 'ryan.setiawan@tiket.com',
            username: 'ryan.setiawan',
            full_name: 'Ryan'
          });
          setLoading(false);
          return; // Exit early, don't throw error
        }
        
        const errorText = await response.text().catch(() => response.statusText);
        throw new Error(`Failed to load profile (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      
      if (data.profile) {
        console.log(`[useAdminProfile] Loaded profile:`, data.profile);
        setProfile(data.profile);
      } else if (user?.email) {
        // Initialize with default profile (only if logged in)
        console.log(`[useAdminProfile] No profile found, initializing default`);
        setProfile({
          email: user.email,
          username: user.email.split('@')[0], // Default username from email
        });
      } else {
        // Public view but no profile in database - set fallback
        console.log(`[useAdminProfile] Public view - no profile found, using fallback`);
        setProfile({
          email: 'ryan.setiawan@tiket.com',
          username: 'ryan.setiawan',
          full_name: 'Ryan'
        });
      }
    } catch (err) {
      console.error(`[useAdminProfile] Error loading profile:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
      
      // Initialize with fallback profile on error
      if (user?.email) {
        setProfile({
          email: user.email,
          username: user.email.split('@')[0],
        });
      } else {
        // Public view fallback
        setProfile({
          email: 'ryan.setiawan@tiket.com',
          username: 'ryan.setiawan',
          full_name: 'Ryan'
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user?.email, accessToken]);

  // Update profile in database
  const updateProfile = useCallback(async (updates: Partial<AdminProfile>) => {
    if (!user?.email || !isAdmin || !accessToken) {
      throw new Error('Unauthorized');
    }

    try {
      console.log(`[useAdminProfile] Updating profile:`, updates);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/admin-profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ updates })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update profile: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[useAdminProfile] Profile updated:`, data.profile);
      setProfile(data.profile);
    } catch (err) {
      console.error(`[useAdminProfile] Failed to update profile:`, err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      throw err;
    }
  }, [user?.email, isAdmin, accessToken]);

  // Upload photo to Supabase Storage
  const uploadPhoto = useCallback(async (file: File): Promise<string> => {
    if (!user?.email || !isAdmin || !accessToken) {
      throw new Error('Unauthorized');
    }

    try {
      console.log(`[useAdminProfile] Uploading photo:`, file.name);
      
      // Create form data
      const formData = new FormData();
      formData.append('photo', file);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/admin-profile/upload-photo`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to upload photo: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[useAdminProfile] Photo uploaded:`, data.url);
      
      // Update profile with new photo URL
      await updateProfile({ custom_photo_url: data.url });
      
      return data.url;
    } catch (err) {
      console.error(`[useAdminProfile] Failed to upload photo:`, err);
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      throw err;
    }
  }, [user?.email, isAdmin, accessToken, updateProfile]);

  const refresh = useCallback(async () => {
    await loadProfile();
  }, [loadProfile]);

  // Load profile on mount and when user changes
  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadPhoto,
    refresh,
  };
}
