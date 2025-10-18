import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export interface IllustrationType {
  name: string;
  color: string;
  textColor?: string; // Custom text color (if undefined, uses auto-contrast)
  useAutoContrast?: boolean; // If true, ignore textColor and use auto-contrast (default: true)
}

export function useTypes() {
  const [types, setTypes] = useState<string[]>([]);
  const [typeColors, setTypeColors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiUrl = `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba`;

  // Fetch all types and their colors
  const fetchTypes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching types from:', `${apiUrl}/types`);
      
      const response = await fetch(`${apiUrl}/types`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Types fetch failed:', response.status, response.statusText, errorText);
        throw new Error(`Failed to fetch types: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Types data received:', data);
      
      setTypes(data.types || []);
      setTypeColors(data.colors || {});
      
      // Store full types with colors if available
      if (data.typesWithColors && Array.isArray(data.typesWithColors)) {
        localStorage.setItem('typesWithColors', JSON.stringify(data.typesWithColors));
      }
    } catch (err) {
      console.error('Error fetching types:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch types');
      
      // Fallback to static types if API fails
      const fallbackTypes = [
        'Spot', 'Icon', 'Micro', 'Banner', 'Other', 
        'Product Icon', 'Micro Interaction', 'DLP', 'Pop Up'
      ];
      const fallbackColors = {
        'Spot': '#ff6b6b',
        'Icon': '#4ecdc4', 
        'Micro': '#45b7d1',
        'Banner': '#f9ca24',
        'Other': '#f0932b',
        'Product Icon': '#eb4d4b',
        'Micro Interaction': '#6c5ce7',
        'DLP': '#a55eea',
        'Pop Up': '#26de81'
      };
      
      setTypes(fallbackTypes);
      setTypeColors(fallbackColors);
    } finally {
      setLoading(false);
    }
  };

  // Add new type
  const addType = async (type: string, color: string, textColor?: string, useAutoContrast?: boolean): Promise<void> => {
    try {
      setError(null);
      
      const response = await fetch(`${apiUrl}/types`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type, color, textColor, useAutoContrast }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add type: ${response.statusText}`);
      }

      const data = await response.json();
      setTypes(data.types || []);
      setTypeColors(data.colors || {});
      
      // Refresh to get updated typesWithColors
      await fetchTypes();
    } catch (err) {
      console.error('Error adding type:', err);
      setError(err instanceof Error ? err.message : 'Failed to add type');
      throw err;
    }
  };

  // Update type (rename and/or change color)
  const updateType = async (oldType: string, newType?: string, color?: string, textColor?: string, useAutoContrast?: boolean): Promise<void> => {
    try {
      setError(null);
      
      const response = await fetch(`${apiUrl}/types/${encodeURIComponent(oldType)}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newType, color, textColor, useAutoContrast }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update type: ${response.statusText}`);
      }

      const data = await response.json();
      setTypes(data.types || []);
      setTypeColors(data.colors || {});
      
      // Refresh to get updated typesWithColors
      await fetchTypes();
    } catch (err) {
      console.error('Error updating type:', err);
      setError(err instanceof Error ? err.message : 'Failed to update type');
      throw err;
    }
  };

  // Delete type
  const deleteType = async (type: string): Promise<void> => {
    try {
      setError(null);
      
      const response = await fetch(`${apiUrl}/types/${encodeURIComponent(type)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete type: ${response.statusText}`);
      }

      const data = await response.json();
      setTypes(data.types || []);
      setTypeColors(data.colors || {});
    } catch (err) {
      console.error('Error deleting type:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete type');
      throw err;
    }
  };

  // Get all types with their colors
  const getTypesWithColors = (): IllustrationType[] => {
    // Try to get from localStorage first (includes text color data)
    try {
      const stored = localStorage.getItem('typesWithColors');
      if (stored) {
        const parsed = JSON.parse(stored) as IllustrationType[];
        // Validate it matches current types
        if (parsed.length === types.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error reading typesWithColors from localStorage:', e);
    }
    
    // Fallback to basic type + color mapping
    return types.map(type => ({
      name: type,
      color: typeColors[type] || '#6b7280',
      useAutoContrast: true // Default
    }));
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  return {
    types,
    typeColors,
    loading,
    error,
    addType,
    updateType,
    deleteType,
    refreshTypes: fetchTypes,
    getTypesWithColors
  };
}