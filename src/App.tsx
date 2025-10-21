import { useState, useEffect, useMemo } from 'react';
import { Save } from 'lucide-react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Dashboard } from './components/Dashboard';
import { ProjectPage } from './components/ProjectPage';
import { ProjectDetailSidebar } from './components/ProjectDetailSidebar';
import { SettingsPage } from './components/SettingsPage';
import { StatsPage } from './components/StatsPage';
import { LightroomPage } from './components/LightroomPage';
import { GDrivePage } from './components/GDrivePage';
import { GDrivePreviewGalleryPage } from './components/GDrivePreviewGalleryPage';
import { AuthPage } from './components/AuthPage';
import { ToastProvider } from './components/ToastProvider';
import { ColorProvider } from './components/ColorContext';
import { ThemeProvider } from './components/ThemeProvider';
import { StatusProvider } from './components/StatusContext';
import { ActionPresetProvider } from './components/ActionPresetContext';
import { ActionSettingsProvider } from './components/ActionSettingsContext';
import { WorkflowProvider } from './components/WorkflowContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useProjects } from './hooks/useProjects';
import { Project } from './types/project';
import { toast } from 'sonner@2.0.3';
import { Button } from './components/ui/button';
import { parseURL, pushURLState, replaceURLState } from './utils/urlManager';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './components/ui/alert-dialog';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerDescription,
} from './components/ui/drawer';
import { useIsMobile } from './components/ui/use-mobile';

type Page = 'dashboard' | 'create-project' | 'edit-project' | 'settings' | 'stats' | 'lightroom' | 'gdrive' | 'gdrive-gallery' | 'auth';
type DashboardView = 'table' | 'timeline' | 'archive' | 'lightroom' | 'gdrive';

function AppContent() {
  const { isLoggedIn, loading: authLoading } = useAuth();
  const isMobile = useIsMobile();
  const [isReady, setIsReady] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);
  const [dashboardView, setDashboardView] = useState<DashboardView>('table');
  const [groupByMode, setGroupByMode] = useState<'status' | 'vertical'>('status');
  const [detailSidebarOpen, setDetailSidebarOpen] = useState(false);
  const [lightroomProjectId, setLightroomProjectId] = useState<string | null>(null);
  const [isPublicLightroomView, setIsPublicLightroomView] = useState(false);
  const [gdriveProjectId, setGDriveProjectId] = useState<string | null>(null);
  const [isPublicGDriveView, setIsPublicGDriveView] = useState(false);
  const [gdriveGalleryProjectId, setGDriveGalleryProjectId] = useState<string | null>(null);
  const [gdriveGalleryAssetId, setGDriveGalleryAssetId] = useState<string | null>(null);
  const [gdriveGalleryFromPage, setGDriveGalleryFromPage] = useState<'gdrive' | 'dashboard'>('dashboard');
  const [initialVertical, setInitialVertical] = useState<string | undefined>(undefined);
  const [initialStatus, setInitialStatus] = useState<string | undefined>(undefined);
  const [projectPageHasChanges, setProjectPageHasChanges] = useState(false);
  const [attemptingToClose, setAttemptingToClose] = useState(false);
  const [saveAsDraftCallback, setSaveAsDraftCallback] = useState<(() => Promise<void>) | null>(null);
  
  const {
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
    refreshData
  } = useProjects();
  
  // Initialize state from URL on mount
  useEffect(() => {
    setIsReady(true);
    
    // 🎯 Parse initial URL state
    const urlState = parseURL();
    console.log('[App] Initial URL state:', urlState);
    
    // Set initial page state from URL
    setCurrentPage(urlState.page);
    
    if (urlState.page === 'dashboard') {
      setDashboardView(urlState.view || 'table');
    } else if (urlState.page === 'lightroom' && urlState.projectId) {
      setLightroomProjectId(urlState.projectId);
      setIsPublicLightroomView(urlState.isPublicLightroom || false);
    } else if (urlState.page === 'gdrive' && urlState.projectId) {
      setGDriveProjectId(urlState.projectId);
      setIsPublicGDriveView(urlState.isPublicGDrive || false);
    } else if (urlState.page === 'create-project') {
      setInitialVertical(urlState.vertical);
      setInitialStatus(urlState.status);
    } else if (urlState.page === 'settings') {
        setSelectedProject(null);
        setLightroomProjectId(null);
        setGDriveProjectId(null);
        setDetailSidebarOpen(false);
      } else if (urlState.page === 'stats') {
        setSelectedProject(null);
        setLightroomProjectId(null);
        setGDriveProjectId(null);
        setDetailSidebarOpen(false);
      } else if (urlState.page === 'auth') {
        setSelectedProject(null);
        setLightroomProjectId(null);
        setGDriveProjectId(null);
        setDetailSidebarOpen(false);
      }
    // Note: edit-project page requires projects to be loaded first (handled in separate useEffect)
    
    // Replace initial state (don't push - this is initial load)
    replaceURLState(urlState);
  }, []);
  
  // Handle edit project page after projects are loaded
  useEffect(() => {
    if (!loading && projects.length > 0) {
      const urlState = parseURL();
      if (urlState.page === 'edit-project' && urlState.projectId) {
        const project = projects.find(p => p.id === urlState.projectId);
        if (project) {
          setSelectedProject(project);
        } else {
          // Project not found, redirect to dashboard
          console.warn('[App] Project not found for edit:', urlState.projectId);
          navigateToDashboard();
        }
      }
    }
  }, [loading, projects]);
  
  // Handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      console.log('[App] Popstate event:', event.state);
      
      // Check if user has unsaved changes
      if (projectPageHasChanges) {
        // Prevent navigation - replace current state
        const currentState = parseURL();
        replaceURLState(currentState);
        
        // Show unsaved changes dialog
        setAttemptingToClose(true);
        return;
      }
      
      // Parse URL to get current state
      const urlState = parseURL();
      console.log('[App] Navigating to URL state:', urlState);
      
      // Sync internal state with URL
      setCurrentPage(urlState.page);
      
      if (urlState.page === 'dashboard') {
        const targetView = urlState.view || 'table';
        setDashboardView(targetView);
        
        // Reset Lightroom/GDrive page state when returning to dashboard
        setLightroomProjectId(null);
        setIsPublicLightroomView(false);
        setGDriveProjectId(null);
        setIsPublicGDriveView(false);
        
        // Check if URL has projectId - means detail sidebar should be open
        if (urlState.projectId && !detailSidebarOpen) {
          const project = projects.find(p => p.id === urlState.projectId);
          if (project) {
            setSelectedProject(project);
            setDetailSidebarOpen(true);
          } else {
            // Project not found, clear state
            setSelectedProject(null);
            setDetailSidebarOpen(false);
          }
        } else if (!urlState.projectId && detailSidebarOpen) {
          // No projectId in URL but sidebar is open - close it
          setDetailSidebarOpen(false);
          setTimeout(() => setSelectedProject(null), 300);
        } else if (!urlState.projectId) {
          // No detail sidebar
          setSelectedProject(null);
          setDetailSidebarOpen(false);
        }
      } else if (urlState.page === 'edit-project' && urlState.projectId) {
        const project = projects.find(p => p.id === urlState.projectId);
        if (project) {
          setSelectedProject(project);
          setDetailSidebarOpen(false);
        } else {
          // Project not found, go to dashboard
          console.warn('[App] Project not found during navigation:', urlState.projectId);
          navigateToDashboard();
        }
      } else if (urlState.page === 'create-project') {
        setSelectedProject(null);
        setInitialVertical(urlState.vertical);
        setInitialStatus(urlState.status);
      } else if (urlState.page === 'lightroom' && urlState.projectId) {
        setLightroomProjectId(urlState.projectId);
        setIsPublicLightroomView(urlState.isPublicLightroom || false);
        setDetailSidebarOpen(false);
        setSelectedProject(null);
        // Scroll to top when navigating to lightroom page
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (urlState.page === 'gdrive' && urlState.projectId) {
        setGDriveProjectId(urlState.projectId);
        setIsPublicGDriveView(urlState.isPublicGDrive || false);
        setDetailSidebarOpen(false);
        setSelectedProject(null);
        // Scroll to top when navigating to gdrive page
        window.scrollTo({ top: 0, behavior: 'instant' });
      } else if (urlState.page === 'settings') {
        setSelectedProject(null);
        setLightroomProjectId(null);
        setGDriveProjectId(null);
        setDetailSidebarOpen(false);
      } else if (urlState.page === 'stats') {
        setSelectedProject(null);
        setLightroomProjectId(null);
        setGDriveProjectId(null);
        setDetailSidebarOpen(false);
      } else if (urlState.page === 'auth') {
        setSelectedProject(null);
        setLightroomProjectId(null);
        setGDriveProjectId(null);
        setDetailSidebarOpen(false);
      }
    };
    
    window.addEventListener('popstate', handlePopState);
    
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [projects, projectPageHasChanges]);
  
  // Navigation handlers
  const navigateToCreateProject = (vertical?: string, status?: string) => {
    // Check if logged in, otherwise redirect to auth
    if (!isLoggedIn) {
      toast.error('Please login to create projects');
      navigateToAuth();
      return;
    }
    setSelectedProject(null);
    setInitialVertical(vertical);
    setInitialStatus(status);
    setCurrentPage('create-project');
    
    // 🎯 Push to browser history
    pushURLState({
      page: 'create-project',
      vertical,
      status
    });
  };

  const navigateToEditProject = (project: Project) => {
    // Check if logged in, otherwise redirect to auth
    if (!isLoggedIn) {
      toast.error('Please login to edit projects');
      navigateToAuth();
      return;
    }
    setSelectedProject(project);
    setDetailSidebarOpen(false);
    setCurrentPage('edit-project');
    
    // 🎯 Push to browser history
    pushURLState({
      page: 'edit-project',
      projectId: project.id
    });
  };
  
  const navigateToAuth = () => {
    setCurrentPage('auth');
    
    // 🎯 Push to browser history
    pushURLState({
      page: 'auth'
    });
  };

  const navigateToProjectDetail = (project: Project) => {
    setSelectedProject(project);
    setDetailSidebarOpen(true);
    
    // 🎯 Push to history so mobile gesture back can close sidebar
    pushURLState({
      page: 'dashboard',
      view: dashboardView,
      projectId: project.id  // Track which project detail is open
    });
  };

  const navigateToDashboard = (view?: DashboardView) => {
    setSelectedProject(null);
    setCurrentPage('dashboard');
    const targetView = view || dashboardView;
    if (view) setDashboardView(view);
    
    // 🎯 Push to browser history
    pushURLState({
      page: 'dashboard',
      view: targetView
    });
  };

  const closeDetailSidebar = () => {
    setDetailSidebarOpen(false);
    // Delay clearing selected project to allow animation to finish
    setTimeout(() => setSelectedProject(null), 300);
    
    // 🎯 Navigate back to dashboard without project detail
    pushURLState({
      page: 'dashboard',
      view: dashboardView
    });
  };

  const navigateToSettings = () => {
    // Check if logged in, otherwise redirect to auth
    if (!isLoggedIn) {
      toast.error('Please login to access settings');
      navigateToAuth();
      return;
    }
    setSelectedProject(null);
    setCurrentPage('settings');
    
    // 🎯 Push to browser history
    pushURLState({
      page: 'settings'
    });
  };

  const navigateToStats = () => {
    setSelectedProject(null);
    setCurrentPage('stats');
    
    // 🎯 Push to browser history
    pushURLState({
      page: 'stats'
    });
  };

  const navigateToLightroom = (projectId: string) => {
    setLightroomProjectId(projectId);
    setIsPublicLightroomView(false); // Internal navigation, not public view
    setCurrentPage('lightroom');
    
    // 🎯 Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // 🎯 Push to browser history with fromView to remember where we came from
    pushURLState({
      page: 'lightroom',
      projectId,
      isPublicLightroom: false,
      fromView: dashboardView // Remember current dashboard view
    });
  };

  const navigateToGDrive = (projectId: string) => {
    setGDriveProjectId(projectId);
    setIsPublicGDriveView(false); // Internal navigation, not public view
    setCurrentPage('gdrive');
    
    // 🎯 Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // 🎯 Push to browser history with fromView to remember where we came from
    pushURLState({
      page: 'gdrive',
      projectId,
      isPublicGDrive: false,
      fromView: dashboardView // Remember current dashboard view
    });
  };

  const navigateToGDriveGallery = (projectId: string, assetId?: string, fromPage?: 'gdrive' | 'dashboard') => {
    setGDriveGalleryProjectId(projectId);
    setGDriveGalleryAssetId(assetId || null);
    setGDriveGalleryFromPage(fromPage || 'dashboard');
    setCurrentPage('gdrive-gallery');
    
    // 🎯 Scroll to top of page
    window.scrollTo({ top: 0, behavior: 'instant' });
    
    // 🎯 Push to browser history
    pushURLState({
      page: 'gdrive-gallery',
      projectId,
      assetId,
      fromPage: fromPage || 'dashboard',
      fromView: dashboardView
    });
  };

  // Project handlers
  const handleCreateProject = async (id: string, projectData: Partial<Project>) => {
    try {
      console.log('[App] Creating project with data:', projectData);
      console.log('[App] is_draft value:', projectData.is_draft);
      
      const createdProject = await createProject(projectData);
      console.log('[App] Project created, returned:', createdProject);
      console.log('[App] Created project is_draft:', createdProject?.is_draft);
      
      // Force refresh data to ensure draft shows up
      console.log('[App] Refreshing data to show newly created project...');
      await refreshData();
      
      navigateToDashboard();
      
      const message = projectData.is_draft ? 'Draft saved successfully!' : 'Project created successfully!';
      toast.success(message);
    } catch (error) {
      console.error('Failed to create project:', error);
      toast.error('Failed to create project. Please try again.');
      throw error;
    }
  };

  const handleUpdateProject = async (id: string, projectData: Partial<Project>) => {
    try {
      console.log('[App] Updating project with data:', projectData);
      console.log('[App] is_draft value:', projectData.is_draft);
      
      await updateProject(id, projectData);
      navigateToDashboard();
      
      const message = projectData.is_draft ? 'Draft saved successfully!' : 'Project updated successfully!';
      toast.success(message);
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project. Please try again.');
      throw error;
    }
  };

  // Quick update for inline changes (like status)
  const handleQuickUpdateProject = async (id: string, projectData: Partial<Project>) => {
    try {
      await updateProject(id, projectData);
      toast.success('Project updated successfully!');
    } catch (error) {
      console.error('Failed to update project:', error);
      toast.error('Failed to update project. Please try again.');
    }
  };

  const handleDeleteProject = (id: string) => {
    // Show confirmation dialog instead of deleting immediately
    setProjectToDelete(id);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete);
      setProjectToDelete(null);
      navigateToDashboard();
      toast.success('Project deleted successfully!');
    } catch (error) {
      console.error('Failed to delete project:', error);
      toast.error('Failed to delete project. Please try again.');
    }
  };

  const cancelDeleteProject = () => {
    setProjectToDelete(null);
  };
  
  // Show loading while checking auth or initializing
  if (!isReady || authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Initializing application...</p>
        </div>
      </div>
    );
  }

  // Show error state with retry option
  if (error && !loading && projects.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl mb-2">Connection Error</h2>
            <p className="text-muted-foreground mb-6">
              {error}. Please check your internet connection and try again.
            </p>
          </div>
          <div className="space-y-3">
            <Button onClick={refreshData} className="w-full">
              Try Again
            </Button>
            {isPublicLightroomView && (
              <p className="text-sm text-muted-foreground">
                If this issue persists, the shared link may be invalid or the project has been removed.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Render lightroom page content
  const renderLightroomPage = () => {
    if (!lightroomProjectId) return null;
    
    // Show loading while projects are being fetched
    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      );
    }

    const project = projects.find(p => p.id === lightroomProjectId);
    if (!project) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Project not found</p>
            {!isPublicLightroomView && (
              <Button onClick={() => navigateToDashboard('lightroom')}>Go to Dashboard</Button>
            )}
          </div>
        </div>
      );
    }
    
    // Get fromView from URL to restore original dashboard view
    const urlState = parseURL();
    const backToView = urlState.fromView || 'lightroom'; // Default to lightroom overview if no fromView
    
    return (
      <LightroomPage
        project={project}
        collaborators={collaborators}
        onBack={() => navigateToDashboard(backToView)}
        onEdit={navigateToEditProject}
        onNavigateToLightroom={navigateToLightroom}
        onNavigateToGDrive={navigateToGDrive}
        isPublicView={isPublicLightroomView}
      />
    );
  };

  // Render gdrive page content
  const renderGDrivePage = () => {
    if (!gdriveProjectId) return null;
    
    // Show loading while projects are being fetched
    if (loading) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading project...</p>
          </div>
        </div>
      );
    }

    const project = projects.find(p => p.id === gdriveProjectId);
    if (!project) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Project not found</p>
            {!isPublicGDriveView && (
              <Button onClick={() => navigateToDashboard('gdrive')}>Go to Dashboard</Button>
            )}
          </div>
        </div>
      );
    }
    
    // Get fromView from URL to restore original dashboard view
    const urlState = parseURL();
    const backToView = urlState.fromView || 'gdrive'; // Default to gdrive overview if no fromView
    
    return (
      <GDrivePage
        project={project}
        collaborators={collaborators}
        onBack={() => navigateToDashboard(backToView)}
        onEdit={navigateToEditProject}
        onNavigateToGDrive={navigateToGDrive}
        onNavigateToLightroom={navigateToLightroom}
        onViewImages={(projectId, assetId) => navigateToGDriveGallery(projectId, assetId, 'gdrive')}
        isPublicView={isPublicGDriveView}
      />
    );
  };

  return (
    <StatusProvider>
      <ColorProvider>
        <ActionPresetProvider>
          <ActionSettingsProvider>
            <WorkflowProvider>
          {currentPage === 'auth' && (
            <AuthPage onBack={() => navigateToDashboard('table')} />
          )}
          
          {currentPage === 'dashboard' && (
            <Dashboard 
                  projects={projects}
                  collaborators={collaborators}
                  loading={loading}
                  onCreateProject={navigateToCreateProject}
                  onEditProject={navigateToEditProject}
                  onProjectDetail={navigateToProjectDetail}
                  onDeleteProject={handleDeleteProject}
                  onProjectUpdate={handleQuickUpdateProject}
                  onSettings={navigateToSettings}
                  onStats={navigateToStats}
                  onNavigateToLightroom={navigateToLightroom}
                  onNavigateToGDrive={navigateToGDrive}
                  onViewGDriveImages={navigateToGDriveGallery}
                  onLogin={navigateToAuth}
                  activeView={dashboardView}
                  onViewChange={setDashboardView}
                  groupByMode={groupByMode}
                  onGroupByModeChange={setGroupByMode}
                  isPublicView={!isLoggedIn}
                />
              )}
              
              {/* Create/Edit Project - Mobile Drawer or Desktop Full Page */}
              {currentPage === 'create-project' && (
                <>
                  {isMobile ? (
                    <Drawer 
                      open={true} 
                      onOpenChange={(open) => {
                        if (!open) {
                          // User is trying to close the drawer (swipe or back button)
                          if (projectPageHasChanges) {
                            // Re-push current state to prevent navigation
                            const currentState = parseURL();
                            replaceURLState(currentState);
                            setAttemptingToClose(true);
                          } else {
                            // Allow navigation via browser back
                            window.history.back();
                          }
                        }
                      }}
                      direction="bottom"
                    >
                      <DrawerContent className="max-h-[85vh] h-[85vh]">
                        <DrawerTitle className="sr-only">Create New Project</DrawerTitle>
                        <DrawerDescription className="sr-only">
                          Fill out the form below to create a new project. Swipe down to close.
                        </DrawerDescription>
                        <ProjectPage
                          collaborators={collaborators}
                          onSave={handleCreateProject}
                          onBack={navigateToDashboard}
                          initialVertical={initialVertical}
                          initialStatus={initialStatus}
                          onHasChangesChange={setProjectPageHasChanges}
                          isMobileDrawer={true}
                          onExposeSaveAsDraft={(callback) => setSaveAsDraftCallback(() => callback)}
                        />
                      </DrawerContent>
                    </Drawer>
                  ) : (
                    <ProjectPage
                      collaborators={collaborators}
                      onSave={handleCreateProject}
                      onBack={navigateToDashboard}
                      initialVertical={initialVertical}
                      initialStatus={initialStatus}
                    />
                  )}
                </>
              )}
              
              {currentPage === 'edit-project' && selectedProject && (
                <>
                  {isMobile ? (
                    <Drawer 
                      open={true} 
                      onOpenChange={(open) => {
                        if (!open) {
                          // User is trying to close the drawer (swipe or back button)
                          if (projectPageHasChanges) {
                            // Re-push current state to prevent navigation
                            const currentState = parseURL();
                            replaceURLState(currentState);
                            setAttemptingToClose(true);
                          } else {
                            // Allow navigation via browser back
                            window.history.back();
                          }
                        }
                      }}
                      direction="bottom"
                    >
                      <DrawerContent className="max-h-[85vh] h-[85vh]">
                        <DrawerTitle className="sr-only">Edit Project</DrawerTitle>
                        <DrawerDescription className="sr-only">
                          Edit project details in the form below. Swipe down to close.
                        </DrawerDescription>
                        <ProjectPage
                          project={selectedProject}
                          collaborators={collaborators}
                          onSave={handleUpdateProject}
                          onDelete={handleDeleteProject}
                          onBack={navigateToDashboard}
                          onHasChangesChange={setProjectPageHasChanges}
                          isMobileDrawer={true}
                          onExposeSaveAsDraft={(callback) => setSaveAsDraftCallback(() => callback)}
                        />
                      </DrawerContent>
                    </Drawer>
                  ) : (
                    <ProjectPage
                      project={selectedProject}
                      collaborators={collaborators}
                      onSave={handleUpdateProject}
                      onDelete={handleDeleteProject}
                      onBack={navigateToDashboard}
                    />
                  )}
                </>
              )}
              
              {currentPage === 'settings' && (
                <SettingsPage
                  collaborators={collaborators}
                  onBack={() => navigateToDashboard('table')}
                  onCreateCollaborator={createCollaborator}
                  onUpdateCollaborator={updateCollaborator}
                  onDeleteCollaborator={deleteCollaborator}
                  onRefreshData={refreshData}
                />
              )}

              {currentPage === 'stats' && (
                <StatsPage
                  onBack={() => navigateToDashboard('table')}
                />
              )}

              {currentPage === 'lightroom' && renderLightroomPage()}
              
              {currentPage === 'gdrive' && renderGDrivePage()}

              {/* GDrive Gallery Page */}
              {currentPage === 'gdrive-gallery' && gdriveGalleryProjectId && (() => {
                const project = projects.find(p => p.id === gdriveGalleryProjectId);
                if (!project) {
                  return (
                    <div className="min-h-screen bg-background flex items-center justify-center">
                      <div className="text-center">
                        <p className="text-muted-foreground mb-4">Project not found</p>
                        <Button onClick={() => navigateToDashboard('gdrive')}>Go to Dashboard</Button>
                      </div>
                    </div>
                  );
                }
                
                // Smart back navigation: return to GDrive page or dashboard based on where user came from
                const handleGalleryBack = () => {
                  if (gdriveGalleryFromPage === 'gdrive') {
                    // Return to GDrive page for the same project
                    navigateToGDrive(gdriveGalleryProjectId);
                  } else {
                    // Return to dashboard
                    navigateToDashboard('gdrive');
                  }
                };
                
                // Navigate to specific folder in gallery
                const handleNavigateToFolder = (folderId: string | null) => {
                  navigateToGDriveGallery(gdriveGalleryProjectId, folderId, gdriveGalleryFromPage);
                };
                
                return (
                  <GDrivePreviewGalleryPage
                    project={project}
                    assetId={gdriveGalleryAssetId}
                    allGDriveAssets={project.gdrive_assets || []}
                    actionableItems={project.actionable_items || []}
                    onBack={handleGalleryBack}
                    onNavigateToFolder={handleNavigateToFolder}
                    isPublicView={!isLoggedIn}
                  />
                );
              })()}

              {/* Project Detail Sidebar */}
              <ProjectDetailSidebar
                project={selectedProject}
                collaborators={collaborators}
                isOpen={detailSidebarOpen}
                onClose={closeDetailSidebar}
                onEdit={navigateToEditProject}
                onNavigateToLightroom={navigateToLightroom}
                onNavigateToGDrive={navigateToGDrive}
                isReadOnly={!isLoggedIn}
              />

              {/* Delete Confirmation Dialog */}
              <AlertDialog open={projectToDelete !== null} onOpenChange={(open) => !open && cancelDeleteProject()}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the project
                      and all its associated data.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={cancelDeleteProject}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={confirmDeleteProject}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Delete Project
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* Unsaved Changes Dialog (Mobile Drawer Close) */}
              <AlertDialog open={attemptingToClose} onOpenChange={(open) => !open && setAttemptingToClose(false)}>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                    <AlertDialogDescription>
                      You have unsaved changes. What would you like to do?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                    <AlertDialogCancel 
                      onClick={() => setAttemptingToClose(false)}
                      className="w-full sm:w-auto"
                    >
                      Continue Editing
                    </AlertDialogCancel>
                    <Button
                      onClick={() => {
                        setAttemptingToClose(false);
                        navigateToDashboard();
                      }}
                      variant="destructive"
                      className="w-full sm:w-auto"
                    >
                      Discard Changes
                    </Button>
                    <Button
                      onClick={async () => {
                        setAttemptingToClose(false);
                        if (saveAsDraftCallback) {
                          await saveAsDraftCallback();
                        }
                      }}
                      variant="default"
                      className="w-full sm:w-auto"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save as Draft & Exit
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </WorkflowProvider>
          </ActionSettingsProvider>
        </ActionPresetProvider>
      </ColorProvider>
    </StatusProvider>
  );
}

export default function App() {
  // Memoize backend to prevent recreation
  const backend = useMemo(() => HTML5Backend, []);
  
  return (
    <DndProvider backend={backend}>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </DndProvider>
  );
}