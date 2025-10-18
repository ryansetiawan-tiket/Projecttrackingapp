import { useState, useEffect } from 'react';
import { Project, Collaborator, FilterOptions } from '../types/project';
import { sampleProjects, sampleCollaborators } from '../utils/sampleData';

export function useLocalProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize with sample data
  useEffect(() => {
    setLoading(true);
    // Simulate async loading with shorter delay
    setTimeout(() => {
      console.log('Loading sample data...', { sampleProjects, sampleCollaborators });
      setProjects(sampleProjects);
      setCollaborators(sampleCollaborators);
      setLoading(false);
      console.log('Sample data loaded successfully');
    }, 100);
  }, []);

  const createProject = async (projectData: Partial<Project>) => {
    try {
      const newProject: Project = {
        id: crypto.randomUUID(),
        project_name: projectData.project_name || '',
        vertical: projectData.vertical || '',
        type: projectData.type || 'Spot',
        status: projectData.status || 'Not Started',
        description: projectData.description || '',
        start_date: projectData.start_date || '',
        due_date: projectData.due_date || '',
        links: projectData.links || {},
        collaborators: projectData.collaborators || [],
        sprint: projectData.sprint || '',
        figma_working_file: projectData.figma_working_file || '',
        tags: projectData.tags || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setProjects(prev => [...prev, newProject]);
      return newProject;
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
      throw err;
    }
  };

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    try {
      const updatedProject = {
        ...projectData,
        id,
        updated_at: new Date().toISOString()
      };

      setProjects(prev => 
        prev.map(p => p.id === id ? { ...p, ...updatedProject } : p)
      );
      return updatedProject;
    } catch (err) {
      console.error('Error updating project:', err);
      setError('Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
      throw err;
    }
  };

  const createCollaborator = async (collaboratorData: Partial<Collaborator>) => {
    try {
      const newCollaborator: Collaborator = {
        id: crypto.randomUUID(),
        name: collaboratorData.name || '',
        role: collaboratorData.role || ''
      };

      setCollaborators(prev => [...prev, newCollaborator]);
      return newCollaborator;
    } catch (err) {
      console.error('Error creating collaborator:', err);
      setError('Failed to create collaborator');
      throw err;
    }
  };

  const filterProjects = (filters: FilterOptions): Project[] => {
    return projects.filter(project => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch = 
          project.project_name.toLowerCase().includes(searchLower) ||
          project.description.toLowerCase().includes(searchLower) ||
          (project.tags && project.tags.some(tag => tag.toLowerCase().includes(searchLower)));
        
        if (!matchesSearch) return false;
      }

      // Vertical filter (changed from domain)
      if (filters.vertical && project.vertical !== filters.vertical) {
        return false;
      }

      // Type filter
      if (filters.type && project.type !== filters.type) {
        return false;
      }

      // Status filter
      if (filters.status && project.status !== filters.status) {
        return false;
      }

      // Collaborator filter
      if (filters.collaborator) {
        if (!project.collaborators || !Array.isArray(project.collaborators)) return false;
        const hasCollaborator = project.collaborators.some(collab => 
          typeof collab === 'string' ? collab === filters.collaborator : collab.name === filters.collaborator
        );
        if (!hasCollaborator) return false;
      }

      // Tags filter
      if (filters.tags && filters.tags.length > 0) {
        if (!project.tags || !Array.isArray(project.tags)) return false;
        const hasMatchingTag = filters.tags.some(tag => 
          project.tags!.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });
  };

  // Get unique values for filter options
  const getFilterOptions = () => {
    const verticals = [...new Set(projects.map(p => p.vertical))].filter(Boolean);
    const types = [...new Set(projects.map(p => p.type))].filter(Boolean);
    const tags = [...new Set(projects.flatMap(p => p.tags || []))];
    
    return { verticals, types, tags };
  };

  return {
    projects,
    collaborators,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    createCollaborator,
    filterProjects,
    getFilterOptions,
    refreshData: () => {}
  };
}