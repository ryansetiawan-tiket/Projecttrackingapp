import { useState, useEffect } from 'react';
import { api } from '../utils/supabase/client';

// Custom event for role updates
const ROLES_UPDATED_EVENT = 'roles-updated';

// Helper to trigger global role update event
const triggerRolesUpdate = () => {
  window.dispatchEvent(new CustomEvent(ROLES_UPDATED_EVENT));
};

export function useRoles() {
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch roles from server
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const response = await api.getRoles();
      if (response.roles) {
        setRoles(response.roles);
      }
      setError(null);
    } catch (err) {
      // Only log fetch errors as they're not user-triggered
      console.warn('[useRoles] Failed to fetch roles:', err);
      setError('Failed to fetch roles');
    } finally {
      setLoading(false);
    }
  };

  // Add new role
  const addRole = async (roleName: string) => {
    try {
      const response = await api.addRole(roleName);
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.roles) {
        setRoles(response.roles);
        // Trigger global update event
        triggerRolesUpdate();
        return true;
      }
      return false;
    } catch (err) {
      // Re-throw error to be handled by the calling component
      throw err;
    }
  };

  // Delete role
  const deleteRole = async (roleName: string) => {
    try {
      const response = await api.deleteRole(roleName);
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.roles) {
        setRoles(response.roles);
        // Trigger global update event
        triggerRolesUpdate();
        return true;
      }
      return false;
    } catch (err) {
      // Re-throw error to be handled by the calling component
      // (Component will show user-friendly toast message)
      throw err;
    }
  };

  // Update role
  const updateRole = async (oldRoleName: string, newRoleName: string) => {
    try {
      const response = await api.updateRole(oldRoleName, newRoleName);
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.roles) {
        setRoles(response.roles);
        // Trigger global update event
        triggerRolesUpdate();
        return true;
      }
      return false;
    } catch (err) {
      // Re-throw error to be handled by the calling component
      throw err;
    }
  };

  // Check if role is in use
  const isRoleInUse = (roleName: string, collaborators: any[]) => {
    return collaborators.some(collaborator => collaborator.role === roleName);
  };

  useEffect(() => {
    fetchRoles();

    // Listen for global role update events
    const handleRolesUpdate = () => {
      console.log('[useRoles] Received global roles update event, refreshing...');
      fetchRoles();
    };

    window.addEventListener(ROLES_UPDATED_EVENT, handleRolesUpdate);

    return () => {
      window.removeEventListener(ROLES_UPDATED_EVENT, handleRolesUpdate);
    };
  }, []);

  return {
    roles,
    loading,
    error,
    addRole,
    deleteRole,
    updateRole,
    isRoleInUse,
    refreshRoles: fetchRoles
  };
}