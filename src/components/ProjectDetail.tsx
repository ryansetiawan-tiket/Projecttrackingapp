import { useState, useEffect, useCallback } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Save, Trash2, Copy } from 'lucide-react';
import { Project, Collaborator, ProjectFormData } from '../types/project';
import { getAllVerticals } from '../utils/verticalColors';
import { ProjectForm } from './ProjectForm';
import { SimpleVerticalManager } from './SimpleVerticalManager';
import { toast } from 'sonner@2.0.3';

interface ProjectDetailProps {
  project?: Project;
  collaborators: Collaborator[];
  onSave: (id: string, data: Partial<Project>) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  onCreateCollaborator: (collaborator: Partial<Collaborator>) => void;
  onDeleteCollaborator?: (collaboratorId: string) => void;
}

export function ProjectDetail({
  project,
  collaborators,
  onSave,
  onDelete,
  onClose,
  onCreateCollaborator,
  onDeleteCollaborator
}: ProjectDetailProps) {
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [verticals, setVerticals] = useState<string[]>([]);
  const [showAddVertical, setShowAddVertical] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Main form data state - this is the single source of truth
  const [formData, setFormData] = useState<ProjectFormData>({
    project_name: '',
    vertical: '',
    type: 'Spot',
    types: [],
    status: 'Not Started',
    notes: '',
    start_date: '',
    due_date: '',
    links: {},
    collaborators: [],
    sprint: '',
    figma_working_file: '',
    actionable_items: []
  });

  const isEditing = !!project;

  // Screen size detection
  useEffect(() => {
    const checkScreenSize = () => {
      const desktop = window.innerWidth >= 768;
      console.log('ProjectDetail: Screen size changed:', { width: window.innerWidth, isDesktop: desktop });
      setIsDesktop(desktop);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  // Load verticals data
  const loadData = useCallback(async () => {
    try {
      const verticalsData = await getAllVerticals();
      console.log('ProjectDetail: Verticals loaded:', verticalsData);
      setVerticals(verticalsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Initialize form data when project is provided
  useEffect(() => {
    console.log('ProjectDetail: Project or mode changed', { project: !!project, isEditing });
    
    // Reset data ready state first
    setIsDataReady(false);
    
    if (project) {
      console.log('ProjectDetail: Initializing form data with project:', project);
      const newFormData = {
        project_name: project.project_name || '',
        vertical: project.vertical || '',
        type: project.type || 'Spot',
        types: project.types || [],
        status: project.status || 'Not Started',
        description: project.description || '',
        start_date: project.start_date || '',
        due_date: project.due_date || '',
        links: { ...project.links } || {},
        collaborators: [...(project.collaborators || [])],
        sprint: project.sprint || '',
        figma_working_file: project.figma_working_file || '',
        actionable_items: project.actionable_items || []
      };
      console.log('ProjectDetail: Setting form data to:', newFormData);
      setFormData(newFormData);
    } else {
      // Reset form data for new project
      console.log('ProjectDetail: Resetting form data for new project');
      setFormData({
        project_name: '',
        vertical: '',
        type: 'Spot',
        types: [],
        status: 'Not Started',
        notes: '',
        start_date: '',
        due_date: '',
        links: {},
        collaborators: [],
        sprint: '',
        figma_working_file: '',
        actionable_items: []
      });
    }
    
    // Mark data as ready after initialization
    const timer = setTimeout(() => {
      console.log('ProjectDetail: Data marked as ready');
      setIsDataReady(true);
    }, 100); // Slightly longer delay to ensure all state updates are complete
    
    return () => clearTimeout(timer); // Cleanup timer on unmount or re-run
  }, [project, isEditing]); // Include isEditing to ensure proper re-initialization

  // Form data change handler - using ref to avoid re-render
  const handleFormDataChange = useCallback((data: ProjectFormData) => {
    console.log('ProjectDetail: Form data changed:', data);
    setFormData(data); // ✅ FIX: Remove comparison - let React handle it
  }, []);

  // Form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isEditing && project) {
        await onSave(project.id, formData);
      } else {
        await onSave('', formData);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isEditing, project, formData, onSave]);

  // Delete handler
  const handleDelete = useCallback(async () => {
    if (project && onDelete) {
      setIsLoading(true);
      try {
        await onDelete(project.id);
        onClose();
        toast.success('Project deleted successfully');
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      } finally {
        setIsLoading(false);
      }
    }
  }, [project, onDelete, onClose]);

  // Duplicate handler
  const handleDuplicate = useCallback(() => {
    if (project) {
      setFormData(prev => ({
        ...prev,
        project_name: `${prev.project_name} (Copy)`,
      }));
    }
  }, [project]);

  // Loading component
  const LoadingContent = () => (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-sm text-muted-foreground">Loading project data...</p>
      </div>
    </div>
  );

  // Project form component
  const ProjectFormContent = () => {
    if (!isDataReady) {
      return <LoadingContent />;
    }
    
    return (
      <form onSubmit={handleSubmit}>
        <ProjectForm
          initialData={formData}
          collaborators={collaborators}
          verticals={verticals}
          onFormDataChange={handleFormDataChange}
          onCreateCollaborator={onCreateCollaborator}
          onDeleteCollaborator={onDeleteCollaborator}
          onAddVertical={() => setShowAddVertical(true)}
          isEditing={isEditing}
        />
      </form>
    );
  };

  // Action buttons component
  const ActionButtons = () => (
    <div className="flex gap-3 justify-end">
      {isEditing && (
        <>
          <Button type="button" variant="outline" onClick={handleDuplicate} disabled={isLoading || !isDataReady}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </Button>
          {onDelete && (
            <Button type="button" variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isLoading || !isDataReady}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </>
      )}
      <Button type="submit" onClick={handleSubmit} disabled={isLoading || !isDataReady}>
        <Save className="h-4 w-4 mr-2" />
        {isLoading ? 'Saving...' : 'Save Project'}
      </Button>
    </div>
  );

  // Desktop Layout
  if (isDesktop) {
    return (
      <>
        <Dialog open={true} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
            <DialogHeader className="pb-4 border-b">
              <DialogTitle className="text-xl font-semibold">
                {isEditing ? 'Edit Project' : 'Create New Project'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {isEditing 
                  ? `Modify the details of your project. Last updated ${project ? new Date(project.updated_at).toLocaleDateString() : ''}`
                  : 'Fill in the details to create a new project'
                }
              </DialogDescription>
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              <ScrollArea className="h-full px-6">
                <div className="py-6">
                  <ProjectFormContent />
                </div>
              </ScrollArea>
            </div>

            <div className="flex-shrink-0 p-6 bg-background border-t">
              <ActionButtons />
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Vertical Modal */}
        {showAddVertical && (
          <Dialog open={showAddVertical} onOpenChange={() => setShowAddVertical(false)}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Vertical</DialogTitle>
                <DialogDescription>
                  Create a new vertical category for organizing your projects.
                </DialogDescription>
              </DialogHeader>
              <SimpleVerticalManager
                onClose={() => setShowAddVertical(false)}
                onVerticalAdded={() => {
                  loadData();
                  setShowAddVertical(false);
                }}
              />
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete <strong>{project?.project_name}</strong>? 
                This action cannot be undone and will permanently remove the project and all its data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  handleDelete();
                  setShowDeleteDialog(false);
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete Project
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  // Mobile Layout
  return (
    <>
      <Drawer open={true} onOpenChange={onClose}>
        <DrawerContent className="h-[100vh] !max-h-none flex flex-col !mt-0 !rounded-t-none">
          <DrawerHeader className="text-center pb-4 border-b bg-background/80 backdrop-blur-sm sticky top-0 z-10 flex-shrink-0">
            <div className="w-12 h-1.5 rounded-full bg-muted mx-auto mb-4" />
            <DrawerTitle className="text-lg font-semibold">
              {isEditing ? 'Edit Project' : 'Create New Project'}
            </DrawerTitle>
            {project && (
              <p className="text-sm text-muted-foreground mt-1">
                Last updated {new Date(project.updated_at).toLocaleDateString()}
              </p>
            )}
          </DrawerHeader>

          <div className="flex-1 overflow-hidden">
            <ScrollArea className="drawer-scroll-area px-4">
              <div className="py-6">
                <ProjectFormContent />
              </div>
            </ScrollArea>
          </div>

          <div className="flex-shrink-0 p-4 bg-background/95 backdrop-blur-sm border-t">
            <div className="flex gap-3">
              <Button 
                type="submit" 
                onClick={handleSubmit} 
                disabled={isLoading || !isDataReady}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {isLoading ? 'Saving...' : 'Save Project'}
              </Button>
              
              {isEditing && (
                <Button type="button" variant="outline" onClick={handleDuplicate} disabled={isLoading || !isDataReady}>
                  <Copy className="h-4 w-4" />
                </Button>
              )}
              
              {isEditing && onDelete && (
                <Button type="button" variant="destructive" onClick={() => setShowDeleteDialog(true)} disabled={isLoading || !isDataReady}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Add Vertical Modal */}
      {showAddVertical && (
        <Dialog open={showAddVertical} onOpenChange={() => setShowAddVertical(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Vertical</DialogTitle>
              <DialogDescription>
                Create a new vertical category for organizing your projects.
              </DialogDescription>
            </DialogHeader>
            <SimpleVerticalManager
              onClose={() => setShowAddVertical(false)}
              onVerticalAdded={() => {
                loadData();
                setShowAddVertical(false);
              }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{project?.project_name}</strong>? 
              This action cannot be undone and will permanently remove the project and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                handleDelete();
                setShowDeleteDialog(false);
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}