import { projectId, publicAnonKey } from './info';
import { sanitizeProjectData } from '../dataUtils';

// API utilities
const BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-691c6bba`;

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${publicAnonKey}`
};

export const api = {
  // Projects
  getProjects: async () => {
    try {
      console.log('Fetching projects from:', `${BASE_URL}/projects`);
      const response = await fetch(`${BASE_URL}/projects`, { headers });
      
      if (!response.ok) {
        console.error('Projects fetch failed:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Projects fetched successfully:', data?.projects?.length || 0);
      return data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error; // Re-throw to let caller handle
    }
  },

  getProject: async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/projects/${id}`, { headers });
      return response.json();
    } catch (error) {
      console.error('Error fetching project:', error);
      return { project: null };
    }
  },

  createProject: async (project: unknown) => {
    try {
      // Sanitize data to prevent circular reference errors
      const sanitized = sanitizeProjectData(project as Record<string, any>);
      console.log('[API] Creating project with sanitized data');
      
      const response = await fetch(`${BASE_URL}/projects`, {
        method: 'POST',
        headers,
        body: JSON.stringify(sanitized)
      });
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error creating project:', error);
      return { error: 'Failed to create project' };
    }
  },

  updateProject: async (id: string, project: unknown) => {
    try {
      // Sanitize data to prevent circular reference errors
      const sanitized = sanitizeProjectData(project as Record<string, any>);
      console.log('[API] Updating project with sanitized data');
      
      const response = await fetch(`${BASE_URL}/projects/${id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(sanitized)
      });
      return response.json();
    } catch (error) {
      console.error('Error updating project:', error);
      return { error: 'Failed to update project' };
    }
  },

  deleteProject: async (id: string) => {
    try {
      const response = await fetch(`${BASE_URL}/projects/${id}`, {
        method: 'DELETE',
        headers
      });
      return response.json();
    } catch (error) {
      console.error('Error deleting project:', error);
      return { error: 'Failed to delete project' };
    }
  },

  // Collaborators
  getCollaborators: async () => {
    try {
      console.log('Fetching collaborators from:', `${BASE_URL}/collaborators`);
      const response = await fetch(`${BASE_URL}/collaborators`, { headers });
      
      if (!response.ok) {
        console.error('Collaborators fetch failed:', response.status, response.statusText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Collaborators fetched successfully:', data?.collaborators?.length || 0);
      return data;
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      throw error; // Re-throw to let caller handle
    }
  },

  createCollaborator: async (collaborator: unknown) => {
    try {
      const response = await fetch(`${BASE_URL}/collaborators`, {
        method: 'POST',
        headers,
        body: JSON.stringify(collaborator)
      });
      return response.json();
    } catch (error) {
      console.error('Error creating collaborator:', error);
      return { error: 'Failed to create collaborator' };
    }
  },

  updateCollaborator: async (collaboratorId: string, collaborator: unknown) => {
    try {
      const response = await fetch(`${BASE_URL}/collaborators/${collaboratorId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(collaborator)
      });
      return response.json();
    } catch (error) {
      console.error('Error updating collaborator:', error);
      return { error: 'Failed to update collaborator' };
    }
  },

  deleteCollaborator: async (collaboratorId: string) => {
    try {
      const response = await fetch(`${BASE_URL}/collaborators/${collaboratorId}`, {
        method: 'DELETE',
        headers
      });
      return response.json();
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      return { error: 'Failed to delete collaborator' };
    }
  },

  // Roles
  getRoles: async () => {
    try {
      const response = await fetch(`${BASE_URL}/roles`, { headers });
      return response.json();
    } catch (error) {
      console.error('Error fetching roles:', error);
      return { roles: [] };
    }
  },

  addRole: async (role: string) => {
    try {
      const response = await fetch(`${BASE_URL}/roles`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ role })
      });
      return response.json();
    } catch (error) {
      console.error('Error adding role:', error);
      return { error: 'Failed to add role' };
    }
  },

  deleteRole: async (role: string) => {
    try {
      const response = await fetch(`${BASE_URL}/roles/${encodeURIComponent(role)}`, {
        method: 'DELETE',
        headers
      });
      return response.json();
    } catch (error) {
      console.error('Error deleting role:', error);
      return { error: 'Failed to delete role' };
    }
  },

  updateRole: async (oldRole: string, newRole: string) => {
    try {
      const response = await fetch(`${BASE_URL}/roles/${encodeURIComponent(oldRole)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ newRole })
      });
      return response.json();
    } catch (error) {
      console.error('Error updating role:', error);
      return { error: 'Failed to update role' };
    }
  }
};