import { useState, useEffect, useCallback } from 'react';
import { Team, Subteam } from '../types/team';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba`;

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all teams
  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE}/teams`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }

      const data = await response.json();
      setTeams(data.teams || []);
    } catch (err) {
      console.error('[useTeams] Error fetching teams:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch teams');
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  // Create a new team
  const createTeam = async (name: string, vertical: string): Promise<Team> => {
    try {
      const response = await fetch(`${API_BASE}/teams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, vertical }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create team');
      }

      const data = await response.json();
      const newTeam = data.team;
      
      setTeams(prev => [...prev, newTeam]);
      return newTeam;
    } catch (err) {
      console.error('[useTeams] Error creating team:', err);
      throw err;
    }
  };

  // Update team (name, vertical, and/or members)
  const updateTeam = async (teamId: string, updates: { name?: string; vertical?: string; memberIds?: string[] }): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/teams/${teamId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update team');
      }

      const data = await response.json();
      const updatedTeam = data.team;
      
      setTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));
    } catch (err) {
      console.error('[useTeams] Error updating team:', err);
      throw err;
    }
  };

  // Delete team
  const deleteTeam = async (teamId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/teams/${teamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete team');
      }

      setTeams(prev => prev.filter(t => t.id !== teamId));
    } catch (err) {
      console.error('[useTeams] Error deleting team:', err);
      throw err;
    }
  };

  // Create subteam
  const createSubteam = async (teamId: string, name: string, memberIds: string[] = []): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/teams/${teamId}/subteams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, memberIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create subteam');
      }

      const data = await response.json();
      const updatedTeam = data.team;
      
      setTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));
    } catch (err) {
      console.error('[useTeams] Error creating subteam:', err);
      throw err;
    }
  };

  // Update subteam
  const updateSubteam = async (
    teamId: string, 
    subteamId: string, 
    updates: { name?: string; memberIds?: string[] }
  ): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/teams/${teamId}/subteams/${subteamId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subteam');
      }

      const data = await response.json();
      const updatedTeam = data.team;
      
      setTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));
    } catch (err) {
      console.error('[useTeams] Error updating subteam:', err);
      throw err;
    }
  };

  // Delete subteam
  const deleteSubteam = async (teamId: string, subteamId: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/teams/${teamId}/subteams/${subteamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete subteam');
      }

      const data = await response.json();
      const updatedTeam = data.team;
      
      setTeams(prev => prev.map(t => t.id === teamId ? updatedTeam : t));
    } catch (err) {
      console.error('[useTeams] Error deleting subteam:', err);
      throw err;
    }
  };

  return {
    teams,
    loading,
    error,
    refreshTeams: fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    createSubteam,
    updateSubteam,
    deleteSubteam,
  };
}
