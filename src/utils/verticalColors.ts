import { projectId, publicAnonKey } from './supabase/info';

export interface VerticalColorSettings {
  [key: string]: string;
}

// Default vertical colors based on the UI shown
const defaultVerticalColors: VerticalColorSettings = {
  'LOYALTY': '#fef3c7', // Yellow
  'ORDER': '#fecaca', // Light red/pink
  'WISHLIST': '#e9d5ff', // Light purple
  'CSF': '#bfdbfe', // Light blue
  'PAYMENT': '#bbf7d0', // Light green
  'PRODUCT': '#fed7aa', // Light orange
  'MARKETING': '#fbcfe8', // Light pink
  'LOYALTY & ACQUISITION': '#fef3c7' // Yellow
};

// Get vertical colors from server
export const getVerticalColors = async (): Promise<VerticalColorSettings> => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/vertical-colors`,
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
    return data.colors || defaultVerticalColors;
  } catch (error) {
    console.error('Error fetching vertical colors:', error);
    return defaultVerticalColors;
  }
};

// Set color for a specific vertical
export const setVerticalColor = async (vertical: string, color: string): Promise<void> => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/vertical-colors/${encodeURIComponent(vertical)}`,
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
    console.error('Error setting vertical color:', error);
    throw error;
  }
};

// Get all verticals from projects and ensure they have colors
export const getAllVerticalColors = async (verticals: string[]): Promise<VerticalColorSettings> => {
  const verticalColors = await getVerticalColors();
  
  // Color palette for new verticals
  const colorPalette = [
    '#fef3c7', '#fecaca', '#e9d5ff', '#bfdbfe', '#bbf7d0',
    '#fed7aa', '#fbcfe8', '#ddd6fe', '#fde68a', '#fca5a5',
    '#c7d2fe', '#a7f3d0', '#fed7d7', '#e0e7ff', '#fef08a'
  ];
  
  let colorIndex = 0;
  for (const vertical of verticals) {
    if (!verticalColors[vertical]) {
      verticalColors[vertical] = colorPalette[colorIndex % colorPalette.length];
      colorIndex++;
      // Save the new color to server
      try {
        await setVerticalColor(vertical, verticalColors[vertical]);
      } catch (error) {
        console.error(`Failed to save color for vertical ${vertical}:`, error);
      }
    }
  }
  
  return verticalColors;
};

// Add new vertical
export const addNewVertical = async (verticalName: string, color?: string): Promise<void> => {
  const finalColor = color || defaultVerticalColors[verticalName] || '#bfdbfe';
  await setVerticalColor(verticalName, finalColor);
};

// Get all saved verticals
export const getAllVerticals = async (): Promise<string[]> => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/verticals`,
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
    return data.verticals || Object.keys(defaultVerticalColors);
  } catch (error) {
    console.error('Error fetching verticals:', error);
    return Object.keys(defaultVerticalColors);
  }
};

// Rename a vertical
export const renameVertical = async (oldName: string, newName: string): Promise<void> => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/verticals/${encodeURIComponent(oldName)}/rename`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newName }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error renaming vertical:', error);
    throw error;
  }
};

// Delete a vertical
export const deleteVertical = async (verticalName: string): Promise<void> => {
  try {
    const response = await fetch(
      `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba/vertical-colors/${encodeURIComponent(verticalName)}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting vertical:', error);
    throw error;
  }
};