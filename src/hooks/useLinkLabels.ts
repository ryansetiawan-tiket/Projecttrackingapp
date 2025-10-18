import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface LinkLabel {
  id: string;
  label: string;
  icon_type: 'text' | 'svg' | 'emoji';
  icon_value: string;
  placeholder?: string;
  created_at: string;
  updated_at: string;
}

export function useLinkLabels() {
  const [linkLabels, setLinkLabels] = useState<LinkLabel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLinkLabels();
  }, []);

  const fetchLinkLabels = async () => {
    try {
      setLoading(true);
      
      // Check if projectId and publicAnonKey are available
      if (!projectId || !publicAnonKey) {
        console.warn('[useLinkLabels] Missing Supabase credentials, using empty array');
        setLinkLabels([]);
        return;
      }
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/link-labels`,
        {
          headers: {
            Authorization: `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (!response.ok) {
        console.warn('[useLinkLabels] Server returned error:', response.status, response.statusText);
        setLinkLabels([]);
        return;
      }

      const data = await response.json();
      setLinkLabels(data.linkLabels || []);
    } catch (error) {
      // Silently fail - link labels are not critical for app functionality
      console.warn('[useLinkLabels] Failed to fetch link labels (non-critical):', error instanceof Error ? error.message : 'Unknown error');
      setLinkLabels([]);
    } finally {
      setLoading(false);
    }
  };

  return { linkLabels, loading, refreshLinkLabels: fetchLinkLabels };
}
