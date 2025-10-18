import { useState, useEffect, useCallback } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface Vertical {
  name: string;
  color: string;
}

const DEFAULT_VERTICALS: Vertical[] = [
  { name: 'LOYALTY', color: 'hsl(48, 96%, 89%)' },
  { name: 'ORDER', color: 'hsl(0, 93%, 94%)' },
  { name: 'CSF', color: 'hsl(213, 94%, 88%)' },
  { name: 'PAYMENT', color: 'hsl(142, 76%, 86%)' },
  { name: 'PRODUCT', color: 'hsl(32, 98%, 83%)' },
];

export function useVerticals() {
  const [verticals, setVerticals] = useState<Vertical[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch verticals from server
  const fetchVerticals = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch vertical names
      const namesResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/verticals`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      // Fetch vertical colors
      const colorsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/vertical-colors`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      if (namesResponse.ok && colorsResponse.ok) {
        const namesData = await namesResponse.json();
        const colorsData = await colorsResponse.json();
        
        const verticalNames = namesData.verticals || [];
        const verticalColors = colorsData.colors || {};
        
        // Combine names and colors
        const combinedVerticals = verticalNames.map((name: string) => ({
          name,
          color: verticalColors[name] || 'hsl(0, 0%, 50%)'
        }));
        
        setVerticals(combinedVerticals.length > 0 ? combinedVerticals : DEFAULT_VERTICALS);
      } else {
        setVerticals(DEFAULT_VERTICALS);
      }
    } catch (error) {
      console.error('Error fetching verticals:', error);
      setVerticals(DEFAULT_VERTICALS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVerticals();
  }, [fetchVerticals]);

  return {
    verticals,
    loading,
    refetch: fetchVerticals,
  };
}
