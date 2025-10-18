import { createContext, useContext, ReactNode } from 'react';
import { Status } from '../types/status';
import { useStatuses } from '../hooks/useStatuses';
import { getContrastColor } from '../utils/colorUtils';

interface StatusContextType {
  statuses: Status[];
  loading: boolean;
  getStatusById: (id: string) => Status | undefined;
  getStatusColor: (statusName: string) => string;
  getStatusTextColor: (statusName: string) => string;
  isArchiveStatus: (statusName: string) => boolean;
  isManualStatus: (statusName: string) => boolean;
  getManualStatusNames: () => string[];
  shouldAutoTriggerStatus: (actionName: string) => { shouldTrigger: boolean; statusName?: string };
  getAutoTriggerStatuses: () => Status[];
  refetch: () => Promise<void>;
}

const StatusContext = createContext<StatusContextType | undefined>(undefined);

export function StatusProvider({ children }: { children: ReactNode }) {
  const { statuses, loading, refetch } = useStatuses();

  const getStatusById = (id: string) => {
    return statuses.find(s => s.id === id);
  };

  const getStatusColor = (statusName: string) => {
    // Find by exact name match (case insensitive)
    const status = statuses.find(
      s => s.name.toLowerCase() === statusName.toLowerCase()
    );
    return status?.color || '#9CA3AF'; // Default gray
  };

  const getStatusTextColor = (statusName: string) => {
    const status = statuses.find(
      s => s.name.toLowerCase() === statusName.toLowerCase()
    );
    
    // If useAutoContrast is explicitly false and textColor is set, use custom color
    if (status && status.useAutoContrast === false && status.textColor) {
      return status.textColor;
    }
    
    // Otherwise, use auto-contrast (default behavior)
    const bgColor = getStatusColor(statusName);
    return getContrastColor(bgColor);
  };

  const isArchiveStatus = (statusName: string) => {
    const nameLower = statusName.toLowerCase();
    
    // Hardcode archived statuses (case-insensitive) regardless of database config
    // These statuses always go to archive
    const hardcodedArchiveStatuses = ['canceled', 'cancelled', 'done'];
    if (hardcodedArchiveStatuses.includes(nameLower)) {
      return true;
    }
    
    const status = statuses.find(
      s => s.name.toLowerCase() === statusName.toLowerCase()
    );
    return status?.displayIn === 'archive';
  };

  // Check if a status is manually set (preserves user choice) vs auto-calculated
  const isManualStatus = (statusName: string) => {
    const statusLower = statusName.toLowerCase().trim();
    const status = statuses.find(
      s => s.name.toLowerCase().trim() === statusLower
    );
    
    // CRITICAL FALLBACK: If status found but is_manual is undefined/null,
    // check against common manual status patterns as backup
    // This handles edge cases where status was created after migration
    const commonManualPatterns = [
      'done',
      'canceled',
      'cancelled',
      'on hold',
      'hold',
      'review',
      'on review',
      'in review',
      'babysit',
      'lightroom',
      'light room',
      'lr',
      'on list lightroom',
      'in queue lightroom',
      'queue lightroom',
      'lightroom queue',
      'lr queue',
      'awaiting lightroom',
      'pending lightroom'
    ];
    
    let result: boolean;
    
    if (status?.is_manual === true) {
      // Explicit manual status - use it
      result = true;
    } else if (status?.is_manual === false) {
      // Explicit auto status - use it
      result = false;
    } else {
      // FALLBACK: is_manual is undefined/null - check pattern match
      result = commonManualPatterns.includes(statusLower);
      
      if (result) {
        console.warn(`[StatusContext] FALLBACK MATCH: "${statusName}" matched as manual (is_manual field missing)`);
      }
    }
    
    console.log(`[StatusContext] isManualStatus("${statusName}"):`, {
      found: !!status,
      actualName: status?.name,
      is_manual: status?.is_manual,
      fallbackChecked: status?.is_manual === undefined,
      result
    });
    
    return result;
  };

  // Get all manual status names (lowercase for comparison)
  const getManualStatusNames = () => {
    return statuses
      .filter(s => s.is_manual === true)
      .map(s => s.name.toLowerCase());
  };

  // Check if an action name should auto-trigger a status change
  const shouldAutoTriggerStatus = (actionName: string) => {
    const actionLower = actionName.toLowerCase().trim();
    
    // Find status with matching name and auto_trigger enabled
    const matchingStatus = statuses.find(
      s => s.name.toLowerCase().trim() === actionLower && s.auto_trigger_from_action === true
    );
    
    if (matchingStatus) {
      console.log(`[StatusContext] Auto-trigger match: action "${actionName}" → status "${matchingStatus.name}"`);
      return { shouldTrigger: true, statusName: matchingStatus.name };
    }
    
    return { shouldTrigger: false };
  };

  // Get all statuses with auto-trigger enabled
  const getAutoTriggerStatuses = () => {
    return statuses.filter(s => s.auto_trigger_from_action === true);
  };

  return (
    <StatusContext.Provider
      value={{
        statuses,
        loading,
        getStatusById,
        getStatusColor,
        getStatusTextColor,
        isArchiveStatus,
        isManualStatus,
        getManualStatusNames,
        shouldAutoTriggerStatus,
        getAutoTriggerStatuses,
        refetch,
      }}
    >
      {children}
    </StatusContext.Provider>
  );
}

export function useStatusContext() {
  const context = useContext(StatusContext);
  if (context === undefined) {
    throw new Error('useStatusContext must be used within a StatusProvider');
  }
  return context;
}
