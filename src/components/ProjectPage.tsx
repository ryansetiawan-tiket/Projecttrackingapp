import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import { Project, Collaborator, ProjectFormData } from '../types/project';
import { getAllVerticals } from '../utils/verticalColors';
import { ProjectForm } from './ProjectForm';
import { SimpleVerticalManager } from './SimpleVerticalManager';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { toast } from 'sonner@2.0.3';
import { cleanProjectData } from '../utils/dataUtils';

interface ProjectPageProps {
  project?: Project;
  collaborators: Collaborator[];
  onSave: (id: string, data: Partial<Project>) => void;
  onDelete?: (id: string) => void;
  onBack: () => void;
  initialVertical?: string;
  initialStatus?: string;
  onHasChangesChange?: (hasChanges: boolean) => void;
  isMobileDrawer?: boolean;
  onExposeSaveAsDraft?: (callback: () => Promise<void>) => void;
}

export function ProjectPage({
  project,
  collaborators,
  onSave,
  onDelete,
  onBack,
  initialVertical,
  initialStatus,
  onHasChangesChange,
  isMobileDrawer = false,
  onExposeSaveAsDraft
}: ProjectPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [verticals, setVerticals] = useState<string[]>([]);
  const [showAddVertical, setShowAddVertical] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<ProjectFormData>({
    project_name: '',
    vertical: '',
    type: 'Spot',
    types: [],
    status: 'Not Started',
    notes: '',
    start_date: '',
    due_date: '',
    links: { labeled: [] },
    collaborators: [],
    sprint: '',
    figma_working_file: '',
    actionable_items: [],
    lightroom_assets: [],
    gdrive_assets: []
  });

  // Store initial data for comparison
  const [initialFormData, setInitialFormData] = useState<ProjectFormData>({
    project_name: '',
    vertical: '',
    type: 'Spot',
    types: [],
    status: 'Not Started',
    notes: '',
    start_date: '',
    due_date: '',
    links: { labeled: [] },
    collaborators: [],
    sprint: '',
    figma_working_file: '',
    actionable_items: [],
    lightroom_assets: [],
    gdrive_assets: []
  });

  const isEditing = !!project;

  // Load verticals data
  useEffect(() => {
    const loadVerticals = async () => {
      try {
        const verticalsData = await getAllVerticals();
        setVerticals(verticalsData);
      } catch (error) {
        console.error('Failed to load verticals:', error);
      }
    };
    loadVerticals();
  }, []);

  // Initialize form data
  useEffect(() => {
    if (project) {
      const initialData = {
        project_name: project.project_name || '',
        vertical: project.vertical || '',
        type: project.type || 'Spot',
        types: project.types || [],
        status: project.status || 'Not Started',
        description: project.description || '',
        notes: project.notes || '',
        start_date: project.start_date || '',
        due_date: project.due_date || '',
        links: { 
          ...project.links,
          labeled: project.links?.labeled || []
        },
        collaborators: [...(project.collaborators || [])],
        sprint: project.sprint || '',
        figma_working_file: project.figma_working_file || '',
        actionable_items: project.actionable_items || [],
        lightroom_assets: project.lightroom_assets || [],
        gdrive_assets: project.gdrive_assets || [],
        is_draft: project.is_draft || false
      };
      setFormData(initialData);
      setInitialFormData(initialData);
      setHasChanges(false);
    } else {
      // Reset form for new project
      const emptyData = {
        project_name: '',
        vertical: initialVertical || '',
        type: 'Spot',
        types: [],
        status: initialStatus || 'Not Started',
        notes: '',
        start_date: '',
        due_date: '',
        links: { labeled: [] },
        collaborators: [],
        sprint: '',
        figma_working_file: '',
        tags: [],
        actionable_items: [],
        lightroom_assets: [],
        gdrive_assets: [],
        is_draft: false // Initialize as false for new projects
      };
      setFormData(emptyData);
      setInitialFormData(emptyData);
      setHasChanges(false);
    }
  }, [project, initialVertical, initialStatus]);

  // Form submission
  const handleSubmit = async (isDraft: boolean = false, shouldClose: boolean = true) => {
    setIsLoading(true);
    try {
      // Clean and sanitize data before saving to prevent circular reference errors
      const dataToSave = cleanProjectData({
        ...formData,
        is_draft: isDraft
      });

      console.log('[ProjectPage] Saving project data:', dataToSave);

      if (isEditing && project) {
        await onSave(project.id, dataToSave);
        toast.success(isDraft ? 'Draft saved successfully!' : 'Project updated successfully!');
      } else {
        await onSave('', dataToSave);
        toast.success(isDraft ? 'Draft saved successfully!' : 'Project created successfully!');
      }
      
      // Only close the page if shouldClose is true
      if (shouldClose) {
        onBack();
      } else {
        // Update initial form data to reflect saved state when not closing
        setInitialFormData(formData);
        setHasChanges(false);
      }
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save project. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Expose save as draft function to parent
  useEffect(() => {
    if (onExposeSaveAsDraft) {
      onExposeSaveAsDraft(async () => {
        await handleSubmit(true);
      });
    }
  }, [onExposeSaveAsDraft, formData]);

  // Delete handler
  const handleDelete = async () => {
    if (project && onDelete) {
      setIsLoading(true);
      try {
        await onDelete(project.id);
        toast.success('Project deleted successfully');
        onBack();
      } catch (error) {
        console.error('Error deleting project:', error);
        toast.error('Failed to delete project');
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Form data change handler - super simple
  const handleFormDataChange = (data: ProjectFormData) => {
    setFormData(data);
  };

  // Detect changes between current and initial data
  useEffect(() => {
    if (!isEditing) {
      // For create mode, check if user has entered any meaningful data
      const hasAnyData = 
        formData.project_name.trim() !== '' ||
        (formData.vertical !== '' && formData.vertical !== (initialVertical || '')) ||
        formData.types.length > 0 ||
        (formData.description && formData.description.trim() !== '') ||
        formData.collaborators.length > 0 ||
        (formData.actionable_items && formData.actionable_items.length > 0) ||
        (formData.lightroom_assets && formData.lightroom_assets.length > 0) ||
        (formData.gdrive_assets && formData.gdrive_assets.length > 0) ||
        (formData.links?.labeled && formData.links.labeled.length > 0) ||
        (formData.start_date && formData.start_date !== '') ||
        (formData.due_date && formData.due_date !== '');
      setHasChanges(hasAnyData);
    } else {
      // For edit mode, compare with initial data
      const dataChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
      setHasChanges(dataChanged);
    }
  }, [formData, initialFormData, isEditing, initialVertical]);

  // Notify parent about changes
  useEffect(() => {
    if (onHasChangesChange) {
      onHasChangesChange(hasChanges);
    }
  }, [hasChanges, onHasChangesChange]);

  // Handle back button click
  const handleBackClick = () => {
    if (hasChanges) {
      setShowUnsavedChangesDialog(true);
    } else {
      onBack();
    }
  };

  // Discard changes and go back
  const handleDiscardChanges = () => {
    setShowUnsavedChangesDialog(false);
    onBack();
  };

  // Save changes and go back (always save as draft for quick exit)
  const handleSaveAndBack = async () => {
    setShowUnsavedChangesDialog(false);
    await handleSubmit(true); // Save as draft without validation
  };

  const loadVerticals = async () => {
    try {
      const verticalsData = await getAllVerticals();
      setVerticals(verticalsData);
    } catch (error) {
      console.error('Failed to reload verticals:', error);
    }
  };

  return (
    <div className={isMobileDrawer ? "flex flex-col h-full bg-background" : "min-h-screen bg-background"}>
      {/* Header */}
      {!isMobileDrawer && (
        <div className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Back Button - Icon only on mobile */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBackClick}
                  className="sm:hidden"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                {/* Back Button - With text on desktop */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBackClick}
                  className="hidden sm:flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="h-5 w-px bg-border" />
                <div>
                  <h1 className="text-xl font-semibold">
                    {isEditing ? 'Edit Project' : 'Create New Project'}
                  </h1>
                  {project && (
                    <p className="text-sm text-muted-foreground">
                      Last updated {new Date(project.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons - Desktop Only */}
              <div className="hidden sm:flex gap-2">
                {isEditing && onDelete && (
                  <Button 
                    variant="destructive" 
                    onClick={() => setShowDeleteDialog(true)} 
                    disabled={isLoading}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                )}
                {/* Save as Draft - only show when there are changes */}
                {hasChanges && (
                  <Button 
                    onClick={() => handleSubmit(true, false)} 
                    disabled={isLoading}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {isLoading ? 'Saving...' : 'Save as Draft'}
                  </Button>
                )}
                {/* Save Project - requires project_name */}
                <Button 
                  onClick={() => handleSubmit(false)} 
                  disabled={isLoading || !formData.project_name?.trim() || !formData.vertical}
                  className="flex items-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {isLoading ? 'Saving...' : 'Save Project'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Drawer Header */}
      {isMobileDrawer && (
        <div className="flex-shrink-0 px-4 pt-4 pb-2">
          <h2 className="text-xl font-semibold">
            {isEditing ? 'Edit Project' : 'Create New Project'}
          </h2>
        </div>
      )}

      {/* Main Content */}
      <div className={isMobileDrawer 
        ? "flex-1 overflow-y-auto px-4 pb-2 drawer-scroll-area" 
        : "container mx-auto px-4 py-6 mobile-bottom-spacing"
      }>
        <div className={isMobileDrawer ? "" : "mx-auto"}>
          <Card className={isMobileDrawer ? "border-none shadow-none" : ""}>
            <CardHeader className={isMobileDrawer ? "px-0 pt-2" : ""}>
              <CardTitle className="text-lg">
                Project Details
              </CardTitle>
            </CardHeader>
            <CardContent className={isMobileDrawer ? "px-0" : ""}>
              <div className="space-y-6">
                <ProjectForm
                  initialData={{...formData}}
                  collaborators={collaborators}
                  verticals={verticals}
                  onFormDataChange={handleFormDataChange}
                  onAddVertical={() => setShowAddVertical(true)}
                  isEditing={isEditing}
                  projectId={project?.id}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Mobile Action Bar - Fixed Bottom (only for non-drawer mobile) */}
      {!isMobileDrawer && (
        <div className="sm:hidden fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t safe-area-inset">
          <div className="flex gap-2">
            {/* Save as Draft - only show when there are changes */}
            {hasChanges && (
              <Button 
                onClick={() => handleSubmit(true, false)} 
                disabled={isLoading}
                variant="outline"
                className="flex-1 text-sm"
              >
                {isLoading ? 'Saving...' : 'Save as Draft'}
              </Button>
            )}
            <Button 
              onClick={() => handleSubmit(false)} 
              disabled={isLoading || !formData.project_name?.trim() || !formData.vertical}
              className="flex-1 text-sm"
            >
              {isLoading ? 'Saving...' : 'Save Project'}
            </Button>
            
            {isEditing && onDelete && (
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)} 
                disabled={isLoading}
                size="icon"
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Mobile Drawer Footer - Action Buttons */}
      {isMobileDrawer && (
        <div className="flex-shrink-0 px-4 pt-3 pb-safe bg-background border-t">
          <div className="flex gap-2 pb-2">
            {/* Save as Draft - only show when there are changes */}
            {hasChanges && (
              <Button 
                onClick={() => handleSubmit(true, false)} 
                disabled={isLoading}
                variant="outline"
                className="flex-1"
              >
                {isLoading ? 'Saving...' : 'Save as Draft'}
              </Button>
            )}
            <Button 
              onClick={() => handleSubmit(false)} 
              disabled={isLoading || !formData.project_name?.trim() || !formData.vertical}
              className="flex-1"
            >
              {isLoading ? 'Saving...' : 'Save Project'}
            </Button>
            
            {isEditing && onDelete && (
              <Button 
                variant="destructive" 
                onClick={() => setShowDeleteDialog(true)} 
                disabled={isLoading}
                size="icon"
                className="flex-shrink-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

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
                loadVerticals();
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

      {/* Unsaved Changes Warning Dialog */}
      <AlertDialog open={showUnsavedChangesDialog} onOpenChange={setShowUnsavedChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved changes. What would you like to do?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel onClick={() => setShowUnsavedChangesDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleDiscardChanges}
              className="w-full sm:w-auto"
            >
              Discard Changes
            </Button>
            <Button
              onClick={handleSaveAndBack}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft & Exit
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}