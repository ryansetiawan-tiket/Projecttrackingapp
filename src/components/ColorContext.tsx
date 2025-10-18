import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getVerticalColors, VerticalColorSettings, setVerticalColor } from '../utils/verticalColors';
import { useTypes, IllustrationType } from '../hooks/useTypes';
import { getContrastColor } from '../utils/colorUtils';

interface ColorContextType {
  verticalColors: VerticalColorSettings;
  verticals: string[];
  typeColors: Record<string, string>;
  types: string[];
  typesWithColors: IllustrationType[];
  getTypeTextColor: (typeName: string) => string;
  updateVerticalColor: (vertical: string, color: string) => Promise<void>;
  updateTypeColor: (type: string, color: string) => Promise<void>;
  refreshColors: () => Promise<void>;
  refreshTypes: () => Promise<void>;
}

const ColorContext = createContext<ColorContextType | undefined>(undefined);

export function ColorProvider({ children }: { children: ReactNode }) {
  const [verticalColors, setVerticalColors] = useState<VerticalColorSettings>({});
  const [loading, setLoading] = useState(true);
  
  // Use the types hook for dynamic type management
  const { types, typeColors, refreshTypes, loading: typesLoading, getTypesWithColors } = useTypes();
  
  const getTypeTextColor = (typeName: string): string => {
    const typeData = getTypesWithColors().find(t => t.name === typeName);
    
    // If useAutoContrast is explicitly false and textColor is set, use custom color
    if (typeData && typeData.useAutoContrast === false && typeData.textColor) {
      return typeData.textColor;
    }
    
    // Otherwise, use auto-contrast (default behavior)
    const bgColor = typeColors[typeName] || '#6b7280';
    return getContrastColor(bgColor);
  };

  const loadColors = async () => {
    try {
      const verticalData = await getVerticalColors();
      setVerticalColors(verticalData);
    } catch (error) {
      console.error('Failed to load colors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColors();
  }, []);

  const updateVerticalColor = async (vertical: string, color: string) => {
    // Store original color for rollback
    const originalColor = verticalColors[vertical];
    
    // Update local state immediately for instant UI feedback
    setVerticalColors(prev => ({
      ...prev,
      [vertical]: color
    }));

    try {
      await setVerticalColor(vertical, color);
    } catch (error) {
      // Rollback to original color on error
      setVerticalColors(prev => ({
        ...prev,
        [vertical]: originalColor
      }));
      throw error;
    }
  };

  const updateTypeColor = async (type: string, color: string) => {
    try {
      // Update through the types hook which handles the API call
      await refreshTypes();
    } catch (error) {
      throw error;
    }
  };

  const refreshColors = async () => {
    await Promise.all([
      loadColors(),
      refreshTypes()
    ]);
  };

  const contextValue: ColorContextType = {
    verticalColors,
    verticals: Object.keys(verticalColors),
    typeColors,
    types,
    typesWithColors: getTypesWithColors(),
    getTypeTextColor,
    updateVerticalColor,
    updateTypeColor,
    refreshColors,
    refreshTypes
  };

  if (loading || typesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ColorContext.Provider value={contextValue}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColors() {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColors must be used within a ColorProvider');
  }
  return context;
}

export const useColorContext = useColors;