import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Settings, Palette, Layers, Link, CheckCircle2, ListChecks, Workflow, UserCog, UserCircle, Megaphone, Sliders, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { TeamManagement } from './TeamManagement';
import { TeamManager } from './TeamManager';
import { RoleManagement } from './RoleManagement';
import { TypeManager } from './TypeManager';
import { VerticalManager } from './VerticalManager';
import { LinkLabelManager } from './LinkLabelManager';
import { StatusManager } from './StatusManager';
import { ActionPresetManager } from './ActionPresetManager';
import { WorkflowManager } from './WorkflowManager-new';
import { AdminProfileManager } from './AdminProfileManager';
import { AnnouncementManager } from './AnnouncementManager';
import { TableColumnOrderManager } from './TableColumnOrderManager';
import { useStatuses } from '../hooks/useStatuses';
import { useActionSettings } from './ActionSettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { useAppSettings } from '../hooks/useAppSettings';
import { getAllVerticals } from '../utils/verticalColors';
import { Collaborator } from '../types/project';
import { toast } from 'sonner@2.0.3';
import { useIsMobile } from './ui/use-mobile';

interface SettingsPageProps {
  collaborators: Collaborator[];
  onBack: () => void;
  onCreateCollaborator: (collaborator: Collaborator) => void;
  onUpdateCollaborator: (collaboratorId: string, collaborator: Partial<Collaborator>) => void;
  onDeleteCollaborator: (collaboratorId: string) => void;
  onRefreshData?: () => void;
}

export function SettingsPage({
  collaborators,
  onBack,
  onCreateCollaborator,
  onUpdateCollaborator,
  onDeleteCollaborator,
  onRefreshData
}: SettingsPageProps) {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('collaborators');
  const { autoCheckAbove, setAutoCheckAbove, loading: actionSettingsLoading, canEdit: canEditActionSettings } = useActionSettings();
  const { isAdmin } = useAuth();
  const { settings: appSettings, updateTitle: updateAppTitle, loading: appSettingsLoading } = useAppSettings();
  
  // Local state for app title editing
  const [appTitle, setAppTitle] = useState(appSettings.title);
  
  // Verticals for team management
  const [verticals, setVerticals] = useState<string[]>([]);
  
  // Load verticals
  useEffect(() => {
    const loadVerticals = async () => {
      try {
        const allVerticals = await getAllVerticals();
        setVerticals(allVerticals);
      } catch (error) {
        console.error('Error loading verticals:', error);
      }
    };
    loadVerticals();
  }, []);
  
  // 🎯 Admin Settings: Default email for login auto-fill
  const [defaultEmail, setDefaultEmail] = useState(
    localStorage.getItem('admin-default-email') || 'ryan.setiawan@tiket.com'
  );
  
  const handleSaveDefaultEmail = async () => {
    localStorage.setItem('admin-default-email', defaultEmail);
    const { toast } = await import('sonner@2.0.3');
    toast.success('Default email saved!');
  };
  
  // Sync local app title state with loaded settings
  useEffect(() => {
    setAppTitle(appSettings.title);
  }, [appSettings.title]);
  
  // Handle app title save
  const handleSaveAppTitle = async () => {
    if (!isAdmin) {
      toast.error('Only admins can change app settings');
      return;
    }
    
    try {
      await updateAppTitle(appTitle);
      toast.success('App title updated!');
    } catch (error) {
      console.error('[SettingsPage] Error saving app title:', error);
      toast.error('Failed to save app title');
    }
  };
  
  const {
    statuses,
    loading: statusesLoading,
    updateStatus,
    createStatus,
    deleteStatus,
    reorderStatuses,
  } = useStatuses();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border safe-area-inset">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-2 md:gap-4">
            {/* Back Button - Icon only on mobile */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="md:hidden"
              aria-label="Back to Dashboard"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            {/* Back Button - With text on desktop */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="hidden md:flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h1 className="text-lg md:text-xl">Settings</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-6 max-w-6xl pb-safe">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-11 h-auto">
            <TabsTrigger value="admin" className="flex items-center gap-1 py-2 px-2 sm:px-3">
              <UserCog className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">Admin</span>
              <span className="md:hidden text-xs truncate">Adm</span>
            </TabsTrigger>
            <TabsTrigger value="app-settings" className="flex items-center gap-1 py-2 px-2 sm:px-3">
              <Sliders className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">App Settings</span>
              <span className="md:hidden text-xs truncate">App</span>
            </TabsTrigger>
            <TabsTrigger value="announcement" className="flex items-center gap-1 py-2 px-2 sm:px-3">
              <Megaphone className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">Announcement</span>
              <span className="md:hidden text-xs truncate">Ann</span>
            </TabsTrigger>
            <TabsTrigger value="teams" className="flex items-center gap-1 py-2 px-2 sm:px-3">
              <Building2 className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">Teams</span>
              <span className="md:hidden text-xs truncate">Team</span>
            </TabsTrigger>
            <TabsTrigger value="collaborators" className="flex items-center gap-1 py-2 px-2 sm:px-3">
              <Users className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">Collaborators</span>
              <span className="md:hidden text-xs truncate">Collab</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="flex items-center gap-1 py-2 px-2 sm:px-3">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">Status</span>
              <span className="md:hidden text-xs truncate">Status</span>
            </TabsTrigger>
            <TabsTrigger value="verticals" className="flex items-center gap-1 py-2 px-2 sm:px-3">
              <Layers className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">Verticals</span>
              <span className="md:hidden text-xs truncate">Vert</span>
            </TabsTrigger>
            <TabsTrigger value="types" className="flex items-center gap-1 py-2 px-2 sm:px-3">
              <Palette className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">Types</span>
              <span className="md:hidden text-xs truncate">Type</span>
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center gap-1 py-2 px-2 sm:px-3">
              <Link className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">Links</span>
              <span className="md:hidden text-xs truncate">Link</span>
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center gap-1 py-2 px-2 sm:px-3">
              <ListChecks className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">Actions</span>
              <span className="md:hidden text-xs truncate">Act</span>
            </TabsTrigger>
            <TabsTrigger value="workflows" className="flex items-center gap-1 py-2 px-2 sm:px-3">
              <Workflow className="h-4 w-4 flex-shrink-0" />
              <span className="hidden md:inline truncate">Workflows</span>
              <span className="md:hidden text-xs truncate">Flow</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="mt-6">
            <div className="space-y-6">
              {/* Admin Profile */}
              <AdminProfileManager />
              
              {/* Admin Preferences */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>Admin Preferences</CardTitle>
                      <CardDescription className="mt-1">
                        Personalize your admin experience
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Default Email for Login */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="default-email">Default Login Email</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        This email will be auto-filled on the login page
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="default-email"
                        type="email"
                        placeholder="your.email@example.com"
                        value={defaultEmail}
                        onChange={(e) => setDefaultEmail(e.target.value)}
                        className="flex-1"
                      />
                      <Button onClick={handleSaveDefaultEmail}>
                        Save
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="app-settings" className="mt-6">
            <div className="space-y-6">
              {/* Application Title */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Sliders className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>App Settings</CardTitle>
                      <CardDescription className="mt-1">
                        Customize the application title and branding
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Admin-Only Notice */}
                  {!isAdmin && (
                    <div className="rounded-lg bg-muted/50 border border-border p-4">
                      <p className="text-sm text-muted-foreground">
                        🔒 Only admins can modify app settings
                      </p>
                    </div>
                  )}
                  
                  {/* App Title */}
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="app-title">Application Title</Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        This title appears in the dashboard header
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Input
                        id="app-title"
                        type="text"
                        placeholder="Ryan Setiawan's Tracker"
                        value={appTitle}
                        onChange={(e) => setAppTitle(e.target.value)}
                        disabled={!isAdmin || appSettingsLoading}
                        className="flex-1"
                      />
                      <Button 
                        onClick={handleSaveAppTitle}
                        disabled={!isAdmin || appSettingsLoading || appTitle === appSettings.title}
                      >
                        {appSettingsLoading ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                    
                    {/* Preview */}
                    <div className="rounded-lg bg-muted/30 border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                      <h2 className="text-xl font-semibold text-foreground">{appTitle || 'App Title'}</h2>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Table Column Order */}
              <TableColumnOrderManager />
            </div>
          </TabsContent>

          <TabsContent value="teams" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Teams</CardTitle>
                    <CardDescription className="mt-1">
                      Organize collaborators into teams and sub-teams by vertical
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TeamManager collaborators={collaborators} verticals={verticals} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="collaborators" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Roles */}
              <div className="space-y-6">
                <RoleManagement collaborators={collaborators} onRefreshData={onRefreshData} />
              </div>
              
              {/* Right Column: Collaborators */}
              <div className="space-y-6">
                <TeamManagement
                  collaborators={collaborators}
                  onCreateCollaborator={onCreateCollaborator}
                  onUpdateCollaborator={onUpdateCollaborator}
                  onDeleteCollaborator={onDeleteCollaborator}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="announcement" className="mt-6">
            <AnnouncementManager isAdmin={isAdmin} />
          </TabsContent>

          <TabsContent value="status" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Project Status</CardTitle>
                    <CardDescription className="mt-1">
                      Manage project statuses, colors, and where they appear in the dashboard
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {statusesLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading statuses...
                  </div>
                ) : (
                  <StatusManager
                    statuses={statuses}
                    onUpdate={updateStatus}
                    onCreate={createStatus}
                    onDelete={deleteStatus}
                    onReorder={reorderStatuses}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="verticals" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Layers className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Verticals</CardTitle>
                    <CardDescription className="mt-1">
                      Manage project verticals and their colors
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <VerticalManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="types" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Illustration Types</CardTitle>
                    <CardDescription className="mt-1">
                      Manage illustration types and their colors
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <TypeManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="links" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Link className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle>Link Labels</CardTitle>
                    <CardDescription className="mt-1">
                      Manage custom link labels and icons for your projects
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <LinkLabelManager />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actions" className="mt-6">
            <div className="space-y-6">
              {/* Auto-Check Actions Above Setting */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle>
                        Action Behavior {!canEditActionSettings && <span className="text-muted-foreground">(Admin only)</span>}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        Configure how asset actions behave when checked
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg bg-muted/30">
                    <Switch
                      id="auto-check-above"
                      checked={autoCheckAbove}
                      onCheckedChange={async (checked) => {
                        if (!canEditActionSettings) {
                          toast.error('Only administrators can modify action settings');
                          return;
                        }
                        try {
                          await setAutoCheckAbove(checked);
                          toast.success(`Auto-check ${checked ? 'enabled' : 'disabled'}`);
                        } catch (error) {
                          toast.error('Failed to update setting');
                        }
                      }}
                      disabled={actionSettingsLoading || !canEditActionSettings}
                    />
                    <div className="flex-1">
                      <Label htmlFor="auto-check-above" className="cursor-pointer">
                        ⬆️ Auto-Check Actions Above
                      </Label>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        When checking an action, automatically check all actions above it. Great for catching up on progress without clicking each action individually.
                      </p>
                    </div>
                  </div>
                  
                  {/* Example */}
                  <div className="mt-4 p-4 border rounded-lg bg-muted/10">
                    <p className="text-xs mb-2 opacity-70">Example:</p>
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded border border-primary bg-primary flex items-center justify-center">
                          <span className="text-[8px] text-primary-foreground">✓</span>
                        </div>
                        <span className="opacity-60">Reference (auto-checked)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded border border-primary bg-primary flex items-center justify-center">
                          <span className="text-[8px] text-primary-foreground">✓</span>
                        </div>
                        <span className="opacity-60">Sketching (auto-checked)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded border border-primary bg-primary flex items-center justify-center">
                          <span className="text-[8px] text-primary-foreground">✓</span>
                        </div>
                        <span className="opacity-60">Drafting (auto-checked)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded border border-primary bg-primary flex items-center justify-center">
                          <span className="text-[8px] text-primary-foreground">✓</span>
                        </div>
                        <span>Uploading (you checked this) ← triggers status</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded border border-muted-foreground"></div>
                        <span>Lightroom (not checked yet)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Action Presets */}
              <ActionPresetManager />
            </div>
          </TabsContent>

          <TabsContent value="workflows" className="mt-6">
            <WorkflowManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}