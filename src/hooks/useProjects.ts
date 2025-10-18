import { useState, useEffect, useCallback } from 'react';
import { api } from '../utils/supabase/client';
import { Project, Collaborator, FilterOptions, ActionableItem } from '../types/project';
import { sampleProjects, sampleCollaborators } from '../utils/sampleData';
import { findProjectsToPromote, sortAssetsByCompletion } from '../utils/sortingUtils';

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auto-promote projects that are more urgent than current "In Progress" projects
  const autoPromoteUrgentProjects = useCallback(async (currentProjects: Project[]) => {
    try {
      // Note: findProjectsToPromote will use default manual statuses
      // This includes common manual statuses like "Lightroom", "On Hold", etc.
      const projectIdsToPromote = findProjectsToPromote(currentProjects);
      
      if (projectIdsToPromote.length === 0) {
        return; // Nothing to promote
      }
      
      console.log(`[useProjects] Auto-promoting ${projectIdsToPromote.length} urgent project(s) to In Progress`);
      console.log('[useProjects] Projects to promote:', currentProjects.filter(p => projectIdsToPromote.includes(p.id)).map(p => ({ name: p.project_name, status: p.status })));
      
      // Batch update all projects that need promotion
      const updatePromises = projectIdsToPromote.map(id => 
        api.updateProject(id, { status: 'In Progress' })
      );
      
      await Promise.all(updatePromises);
      
      // Update local state
      setProjects(prev => 
        prev.map(p => 
          projectIdsToPromote.includes(p.id) 
            ? { ...p, status: 'In Progress' }
            : p
        )
      );
    } catch (err) {
      console.error('Error auto-promoting projects:', err);
      // Don't throw - this is a background operation
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('[useProjects] Fetching projects and collaborators...');
      const [projectsResponse, collaboratorsResponse] = await Promise.all([
        api.getProjects(),
        api.getCollaborators()
      ]);
      
      console.log('[useProjects] Fetch complete:', { 
        projects: projectsResponse?.projects?.length || 0, 
        collaborators: collaboratorsResponse?.collaborators?.length || 0 
      });
      
      // Log draft projects
      const draftCount = projectsResponse?.projects?.filter((p: any) => p.is_draft)?.length || 0;
      console.log('[useProjects] Draft projects in response:', draftCount);
      if (draftCount > 0) {
        const drafts = projectsResponse.projects.filter((p: any) => p.is_draft);
        console.log('[useProjects] Draft projects:', drafts.map((p: any) => ({ id: p.id, name: p.project_name, is_draft: p.is_draft })));
      }

      let projectData = projectsResponse.projects || [];
      let collaboratorData = collaboratorsResponse.collaborators || [];

      // Migrate collaborators to have nickname field (backward compatibility)
      collaboratorData = collaboratorData.map(collaborator => {
        if (!collaborator.nickname) {
          // Extract first name from full name as default nickname
          const firstName = collaborator.name.split(' ')[0];
          return {
            ...collaborator,
            nickname: firstName
          };
        }
        return collaborator;
      });

      // Log final project data before setting state
      console.log('[useProjects] Final projectData count:', projectData.length);
      const finalDraftCount = projectData.filter((p: any) => p.is_draft).length;
      console.log('[useProjects] Final draft count before setState:', finalDraftCount);
      
      // Migrate project data for backward compatibility
      projectData = projectData.map(project => {
        // Migrate project collaborators to have nickname
        const migratedCollaborators = project.collaborators?.map(collaborator => {
          if (!collaborator.nickname) {
            const firstName = collaborator.name.split(' ')[0];
            return {
              ...collaborator,
              nickname: firstName
            };
          }
          return collaborator;
        }) || [];

        // Migrate actionable items
        const migratedItems = project.actionable_items?.map(item => {
          // Migrate item status
          const itemWithStatus = {
            ...item,
            status: item.status || (item.is_completed ? 'Done' : 'Not Started')
          };

          // Migrate item collaborator (single)
          if (itemWithStatus.collaborator && !itemWithStatus.collaborator.nickname) {
            const firstName = itemWithStatus.collaborator.name.split(' ')[0];
            itemWithStatus.collaborator = {
              ...itemWithStatus.collaborator,
              nickname: firstName
            };
          }

          // Migrate item collaborators (multiple)
          if (itemWithStatus.collaborators && itemWithStatus.collaborators.length > 0) {
            itemWithStatus.collaborators = itemWithStatus.collaborators.map(collaborator => {
              if (!collaborator.nickname) {
                const firstName = collaborator.name.split(' ')[0];
                return {
                  ...collaborator,
                  nickname: firstName
                };
              }
              return collaborator;
            });
          }

          return itemWithStatus;
        }) || [];

        return {
          ...project,
          collaborators: migratedCollaborators,
          actionable_items: migratedItems
        };
      });

      // Initialize with sample data if no data exists
      if (projectData.length === 0 && collaboratorData.length === 0) {
        console.log('No existing data found, initializing with sample data...');
        
        // Create sample collaborators
        for (const collaborator of sampleCollaborators) {
          try {
            await api.createCollaborator(collaborator);
            collaboratorData.push(collaborator);
          } catch (error) {
            console.error('Failed to create sample collaborator:', error);
          }
        }

        // Create sample projects
        for (const project of sampleProjects) {
          try {
            const response = await api.createProject(project);
            if (response.project) {
              projectData.push(response.project);
            }
          } catch (error) {
            console.error('Failed to create sample project:', error);
          }
        }
      }

      setProjects(projectData);
      setCollaborators(collaboratorData);
      setError(null);
      
      console.log('✓ Data loaded successfully');
      
      // Auto-promote urgent projects to "In Progress"
      await autoPromoteUrgentProjects(projectData);
    } catch (err) {
      console.error('Error fetching data:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      console.error('Error details:', errorMessage);
      setError(errorMessage);
      
      // Set empty arrays so app doesn't break
      setProjects([]);
      setCollaborators([]);
    } finally {
      setLoading(false);
    }
  }, [autoPromoteUrgentProjects]);

  // Fetch initial data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const createProject = async (projectData: Partial<Project>) => {
    try {
      console.log('[useProjects] Creating project with data:', projectData);
      console.log('[useProjects] is_draft value:', projectData.is_draft);
      
      const response = await api.createProject(projectData);
      console.log('[useProjects] Create response:', response);
      
      if (response.project) {
        console.log('[useProjects] Created project:', response.project);
        console.log('[useProjects] Created project is_draft:', response.project.is_draft);
        
        const updatedProjects = [...projects, response.project];
        setProjects(updatedProjects);
        
        // Check for auto-promotion after creating new project
        autoPromoteUrgentProjects(updatedProjects);
        
        return response.project;
      } else {
        throw new Error(response.error || 'Failed to create project');
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
      throw err;
    }
  };

  const updateProject = async (id: string, projectData: Partial<Project>) => {
    try {
      // Get the current project state
      const currentProject = projects.find(p => p.id === id);
      
      if (!currentProject) {
        throw new Error(`Project ${id} not found`);
      }
      
      // Handle asset completion timestamps and auto-sorting
      if (projectData.actionable_items) {
        const now = new Date().toISOString();
        const oldItems = currentProject.actionable_items || [];
        
        // Update completed_at for assets that changed to Done
        projectData.actionable_items = projectData.actionable_items.map(item => {
          const oldItem = oldItems.find(old => old.id === item.id);
          
          // Status changed TO Done - set completed_at
          if (item.status === 'Done' && oldItem?.status !== 'Done' && !item.completed_at) {
            console.log(`[useProjects] Asset "${item.title}" marked as Done - setting completed_at`);
            return { ...item, completed_at: now };
          }
          
          // Status changed FROM Done - clear completed_at
          if (item.status !== 'Done' && oldItem?.status === 'Done') {
            console.log(`[useProjects] Asset "${item.title}" unmarked from Done - clearing completed_at`);
            return { ...item, completed_at: null };
          }
          
          return item;
        });
        
        // Auto-sort assets: non-Done first, Done last (by completion time)
        projectData.actionable_items = sortAssetsByCompletion(projectData.actionable_items);
        console.log('[useProjects] Assets auto-sorted by completion status');
      }
      
      // Auto-handle completed_at timestamp based on status change
      // Status changed TO Done - set completed_at if not already set
      if (projectData.status === 'Done' && projectData.completed_at === undefined) {
        projectData.completed_at = new Date().toISOString();
        console.log('[useProjects] Status changed to Done - setting completed_at:', projectData.completed_at);
      }
      // Status changed FROM Done to something else - clear completed_at and reset progress
      else if (currentProject.status === 'Done' && 
          projectData.status !== undefined && 
          projectData.status !== 'Done' &&
          projectData.actionable_items === undefined) {
        
        console.log(`Resetting progress for project ${id} (Done → ${projectData.status})`);
        
        // Clear completion timestamp
        projectData.completed_at = null;
        
        // Reset all assets: set status to "In Progress" or "Not Started", mark as incomplete, and reset all actions
        if (currentProject.actionable_items && currentProject.actionable_items.length > 0) {
          const resetItems = currentProject.actionable_items.map(item => ({
            ...item,
            status: projectData.status === 'In Progress' ? 'In Progress' : 'Not Started',
            is_completed: false,
            actions: item.actions?.map(action => ({
              ...action,
              completed: false
            })) || []
          }));
          
          // Include the reset items in the update
          projectData = {
            ...projectData,
            actionable_items: resetItems
          };
        }
      }
      
      // ⚡ CRITICAL FIX: OPTIMISTIC UPDATE - Update local state IMMEDIATELY
      // This prevents visual jumping when checking actions
      const optimisticProject = {
        ...currentProject,
        ...projectData,
        updated_at: new Date().toISOString()
      };
      
      const optimisticProjects = projects.map(p => p.id === id ? optimisticProject : p);
      setProjects(optimisticProjects);
      
      console.log(`[useProjects] ⚡ Optimistic update applied for project ${id}`, projectData);
      
      // Sync to database in background
      const response = await api.updateProject(id, projectData);
      if (response.project) {
        // Update with server response (in case server modified anything)
        const serverProjects = projects.map(p => p.id === id ? response.project : p);
        setProjects(serverProjects);
        
        console.log(`[useProjects] ✓ Database sync complete for project ${id}`);
        
        // CRITICAL: DO NOT auto-promote when user manually changes status
        // Only auto-promote if deadline changed, NOT when status is manually changed
        // This prevents auto-promotion from overriding user's explicit status choices
        // like setting a project to "On Hold" or "Canceled"
        if (projectData.due_date !== undefined && projectData.status === undefined) {
          // Run auto-promotion in background (don't await)
          autoPromoteUrgentProjects(serverProjects);
        }
        
        return response.project;
      } else {
        // Rollback optimistic update if server fails
        console.error('[useProjects] ❌ Server update failed, rolling back optimistic update');
        setProjects(projects);
        throw new Error(response.error || 'Failed to update project');
      }
    } catch (err) {
      console.error('Error updating project:', err);
      // Rollback optimistic update on error
      setProjects(projects);
      setError('Failed to update project');
      throw err;
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await api.deleteProject(id);
      setProjects(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
      throw err;
    }
  };

  const createCollaborator = async (collaboratorData: Partial<Collaborator>) => {
    try {
      const response = await api.createCollaborator(collaboratorData);
      if (response.collaborator) {
        setCollaborators(prev => [...prev, response.collaborator]);
        return response.collaborator;
      }
    } catch (err) {
      console.error('Error creating collaborator:', err);
      setError('Failed to create collaborator');
      throw err;
    }
  };

  const updateCollaborator = async (collaboratorId: string, collaboratorData: Partial<Collaborator>) => {
    try {
      const response = await api.updateCollaborator(collaboratorId, collaboratorData);
      if (response.collaborator) {
        // Update in collaborators list
        setCollaborators(prev => 
          prev.map(c => c.id === collaboratorId ? response.collaborator : c)
        );
        
        // Update in projects as well
        setProjects(prev => prev.map(project => ({
          ...project,
          collaborators: project.collaborators.map(c => 
            c.id === collaboratorId ? response.collaborator : c
          )
        })));
        
        return response.collaborator;
      }
    } catch (err) {
      console.error('Error updating collaborator:', err);
      setError('Failed to update collaborator');
      throw err;
    }
  };

  const deleteCollaborator = async (collaboratorId: string) => {
    try {
      const response = await api.deleteCollaborator(collaboratorId);
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Remove from local state
      setCollaborators(prev => prev.filter(c => c.id !== collaboratorId));
      
      // Also remove from any projects that have this collaborator
      setProjects(prev => prev.map(project => ({
        ...project,
        collaborators: project.collaborators.filter(c => c.id !== collaboratorId)
      })));
      
      return true;
    } catch (err) {
      console.error('Error deleting collaborator:', err);
      setError('Failed to delete collaborator');
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

      // Vertical filter (updated from domain)
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
          collab.name === filters.collaborator || collab.id === filters.collaborator
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
    updateCollaborator,
    deleteCollaborator,
    filterProjects,
    getFilterOptions,
    refreshData: fetchData
  };
}