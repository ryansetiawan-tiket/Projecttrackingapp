import { ProjectType } from '../types/project';
import { projectId, publicAnonKey } from './supabase/info';

export interface TypeColorSettings {
  [key: string]: string;
}

// Get type colors from server
export const getTypeColors = async (): Promise<TypeColorSettings> => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/type-colors`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.colors || {};
  } catch (error) {
    console.error('Error fetching type colors:', error);
    // Return default colors if fetch fails
    return {
      'Spot': '#ff6b6b',
      'Icon': '#4ecdc4', 
      'Micro': '#45b7d1',
      'Banner': '#96ceb4',
      'Other': '#feca57',
      'Product Icon': '#ff9ff3',
      'Micro Interaction': '#54a0ff',
      'DLP': '#5f27cd',
      'Pop Up': '#00d2d3'
    };
  }
};

// Set color for a specific type
export const setTypeColor = async (type: ProjectType, color: string): Promise<void> => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/type-colors/${encodeURIComponent(type)}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ color }),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error setting type color:', error);
    throw error;
  }
};

// Get all type colors and ensure all types have colors
export const getAllTypeColors = async (types: ProjectType[]): Promise<TypeColorSettings> => {
  const typeColors = await getTypeColors();
  
  // Generate random colors for missing types
  const defaultColors = [
    '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57',
    '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43',
    '#f368e0', '#48dbfb', '#0abde3', '#006ba6', '#f0932b'
  ];
  
  let colorIndex = 0;
  for (const type of types) {
    if (!typeColors[type]) {
      typeColors[type] = defaultColors[colorIndex % defaultColors.length];
      colorIndex++;
      // Save the new color to server
      try {
        await setTypeColor(type, typeColors[type]);
      } catch (error) {
        console.error(`Failed to save color for type ${type}:`, error);
      }
    }
  }
  
  return typeColors;
};

// Get single type color synchronously (fallback to default if not available)
export const getTypeColor = (type: ProjectType): string => {
  const defaultColors = {
    'Spot': '#ff6b6b',
    'Icon': '#4ecdc4', 
    'Micro': '#45b7d1',
    'Banner': '#96ceb4',
    'Other': '#feca57',
    'Product Icon': '#ff9ff3',
    'Micro Interaction': '#54a0ff',
    'DLP': '#5f27cd',
    'Pop Up': '#00d2d3'
  };
  
  return defaultColors[type] || '#6b7280';
};