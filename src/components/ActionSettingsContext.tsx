import { createContext, useContext, ReactNode } from 'react';
import { useSystemSettings } from '../hooks/useSystemSettings';

interface ActionSettingsData {
  autoCheckAbove: boolean;
}

interface ActionSettings {
  autoCheckAbove: boolean;
  setAutoCheckAbove: (value: boolean) => Promise<void>;
  loading: boolean;
  canEdit: boolean; // Admin only
}

const ActionSettingsContext = createContext<ActionSettings | undefined>(undefined);

export function ActionSettingsProvider({ children }: { children: ReactNode }) {
  const { 
    value: settings, 
    setValue: setSettings, 
    loading,
    canEdit 
  } = useSystemSettings<ActionSettingsData>('action_settings', { 
    autoCheckAbove: true // Default: enabled
  });

  const setAutoCheckAbove = async (value: boolean) => {
    console.log(`[ActionSettings] Auto-check above ${value ? 'enabled' : 'disabled'}`);
    await setSettings({ ...settings, autoCheckAbove: value });
  };

  return (
    <ActionSettingsContext.Provider value={{ 
      autoCheckAbove: settings.autoCheckAbove,
      setAutoCheckAbove,
      loading,
      canEdit
    }}>
      {children}
    </ActionSettingsContext.Provider>
  );
}

export function useActionSettings() {
  const context = useContext(ActionSettingsContext);
  if (!context) {
    throw new Error('useActionSettings must be used within ActionSettingsProvider');
  }
  return context;
}
