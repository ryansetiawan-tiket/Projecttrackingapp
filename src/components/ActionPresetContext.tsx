import { createContext, useContext, ReactNode } from 'react';
import { useSystemSettings } from '../hooks/useSystemSettings';

interface ActionPresetContextType {
  presets: string[];
  addPreset: (preset: string) => Promise<void>;
  removePreset: (preset: string) => Promise<void>;
  updatePreset: (oldPreset: string, newPreset: string) => Promise<void>;
  loading: boolean;
  canEdit: boolean; // Admin only
}

const DEFAULT_PRESETS = [
  'Reference',
  'Sketching',
  'Drafting',
  'Blocking',
  'Modeling',
  'Rendering',
  'Layouting'
];

const ActionPresetContext = createContext<ActionPresetContextType | undefined>(undefined);

export function ActionPresetProvider({ children }: { children: ReactNode }) {
  const { 
    value: presets, 
    setValue: setPresets, 
    loading,
    canEdit 
  } = useSystemSettings<string[]>('action_presets', DEFAULT_PRESETS);

  const addPreset = async (preset: string) => {
    const trimmed = preset.trim();
    if (trimmed && !presets.includes(trimmed)) {
      await setPresets([...presets, trimmed]);
    }
  };

  const removePreset = async (preset: string) => {
    await setPresets(presets.filter(p => p !== preset));
  };

  const updatePreset = async (oldPreset: string, newPreset: string) => {
    const trimmed = newPreset.trim();
    if (trimmed && !presets.includes(trimmed)) {
      await setPresets(presets.map(p => p === oldPreset ? trimmed : p));
    }
  };

  return (
    <ActionPresetContext.Provider value={{ 
      presets, 
      addPreset, 
      removePreset, 
      updatePreset,
      loading,
      canEdit
    }}>
      {children}
    </ActionPresetContext.Provider>
  );
}

export function useActionPresets() {
  const context = useContext(ActionPresetContext);
  if (!context) {
    throw new Error('useActionPresets must be used within ActionPresetProvider');
  }
  return context;
}
