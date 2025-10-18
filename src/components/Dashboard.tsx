import { useState, useEffect } from 'react';
import { ProjectTable } from './ProjectTable';
import { ProjectTimeline } from './ProjectTimeline';
import { LightroomOverview } from './LightroomOverview';
import { GDriveOverview } from './GDriveOverview';
import { ProjectFilters } from './ProjectFilters';
import { LoadingSpinner } from './LoadingSpinner';
import { RotatingTagline } from './RotatingTagline';
import { SnackbarBanner } from './SnackbarBanner';
import { StatsDialog } from './StatsDialog';
import { MobileFilters, MobileFilterState } from './mobile/MobileFilters';
import { MobileProjectList } from './mobile/MobileProjectList';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Plus, Calendar, Table, Settings, Archive, Moon, Sun, Image, ChevronDown, Filter, LogOut, HardDrive, User, BarChart3 } from 'lucide-react';
import { FilterOptions, Project, Collaborator } from '../types/project';
import { useTheme } from './ThemeProvider';
import { useStatusContext } from './StatusContext';
import { useAuth } from '../contexts/AuthContext';
import { useAdminProfile } from '../hooks/useAdminProfile';
import { useAppSettings } from '../hooks/useAppSettings';
import { getQuarterKey, sortQuarterKeys, getProjectQuarters, getQuarterPattern } from '../utils/quarterUtils';
import { sortProjectsByUrgency } from '../utils/sortingUtils';
import { toast } from 'sonner@2.0.3';
import { replaceURLState } from '../utils/urlManager';
import { motion, PanInfo } from 'motion/react';

// Fun login button labels - 50 variants that rotate every 30 minutes
// Independent from other funny texts, just kocak button labels
const LOGIN_BUTTON_LABELS = [
  "Click here dummy",
  "Press this thing",
  "Tap if you dare",
  "Push the button",
  "Enter the matrix",
  "Open sesame",
  "Knock knock",
  "Access portal",
  "Join the party",
  "Get in loser",
  "Show yourself",
  "Prove it's you",
  "State your name",
  "Enter friend",
  "Come on in",
  "Yes you can",
  "Do the thing",
  "Make it happen",
  "Hit this spot",
  "Touch this",
  "Poke here",
  "Smash that button",
  "Activate mode",
  "Initialize sequence",
  "Start engines",
  "Fire it up",
  "Power on",
  "Boot system",
  "Launch app",
  "Deploy yourself",
  "Engage",
  "Commence",
  "Proceed",
  "Continue",
  "Resume",
  "Reconnect",
  "Plug in",
  "Sync up",
  "Load profile",
  "Summon dashboard",
  "Unlock vault",
  "Reveal secrets",
  "Open gateway",
  "Cross threshold",
  "Pass through",
  "Step inside",
  "Walk in",
  "Come forth",
  "Appear now"
];

interface DashboardProps {
  projects: Project[];
  collaborators: Collaborator[];
  loading: boolean;
  onCreateProject: (vertical?: string, status?: string) => void;
  onEditProject: (project: Project) => void;
  onProjectDetail: (project: Project) => void;
  onDeleteProject?: (id: string) => void;
  onProjectUpdate?: (id: string, data: Partial<Project>) => void;
  onSettings?: () => void;
  onNavigateToLightroom?: (projectId: string) => void;
  onNavigateToGDrive?: (projectId: string) => void;
  onViewGDriveImages?: (projectId: string) => void;
  onLogin?: () => void;
  activeView?: 'table' | 'timeline' | 'archive' | 'lightroom' | 'gdrive';
  onViewChange?: (view: 'table' | 'timeline' | 'archive' | 'lightroom' | 'gdrive') => void;
  groupByMode?: 'status' | 'vertical';
  onGroupByModeChange?: (mode: 'status' | 'vertical') => void;
  isPublicView?: boolean;
}

export function Dashboard({ 
  projects,
  collaborators,
  loading,
  onCreateProject, 
  onEditProject, 
  onProjectDetail, 
  onDeleteProject,
  onProjectUpdate,
  onSettings,
  onNavigateToLightroom,
  onNavigateToGDrive,
  onViewGDriveImages,
  isPublicView = false,
  onLogin,
  activeView: externalActiveView,
  onViewChange,
  groupByMode: externalGroupByMode,
  onGroupByModeChange
}: DashboardProps) {
  const { theme, toggleTheme } = useTheme();
  const { isArchiveStatus } = useStatusContext();
  const { isLoggedIn, signOut, user } = useAuth();
  const { profile } = useAdminProfile();
  const { settings: appSettings } = useAppSettings();
  const [internalActiveView, setInternalActiveView] = useState<'table' | 'timeline' | 'archive' | 'lightroom' | 'gdrive'>('table');
  const [statsOpen, setStatsOpen] = useState(false);
  
  // Login button label - random on every visit!
  const [loginButtonLabel] = useState(() => {
    const randomIndex = Math.floor(Math.random() * LOGIN_BUTTON_LABELS.length);
    return LOGIN_BUTTON_LABELS[randomIndex];
  });
  
  // Use external view if provided, otherwise use internal
  const activeView = externalActiveView !== undefined ? externalActiveView : internalActiveView;
  const setActiveView = (view: 'table' | 'timeline' | 'archive' | 'lightroom' | 'gdrive') => {
    if (onViewChange) {
      onViewChange(view);
    } else {
      setInternalActiveView(view);
    }
    
    // 🎯 Update URL when view changes (use replace, not push - view change is not a "back" action)
    replaceURLState({
      page: 'dashboard',
      view
    });
  };
  const [filters, setFilters] = useState<FilterOptions>({});
  
  // Group by mode state - use external if provided, otherwise use internal
  const [internalGroupByMode, setInternalGroupByMode] = useState<'status' | 'vertical'>('status');
  const groupByMode = externalGroupByMode !== undefined ? externalGroupByMode : internalGroupByMode;
  const setGroupByMode = (mode: 'status' | 'vertical') => {
    if (onGroupByModeChange) {
      onGroupByModeChange(mode);
    } else {
      setInternalGroupByMode(mode);
    }
  };
  
  // Year and Quarter filter state - default to 'all' so projects without dates are visible
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedQuarter, setSelectedQuarter] = useState<string>('all');

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // 👆 Swipe gesture handler for tab switching (mobile only)
  const TAB_ORDER: ('table' | 'timeline' | 'lightroom' | 'gdrive' | 'archive')[] = ['table', 'timeline', 'lightroom', 'gdrive', 'archive'];
  const SWIPE_CONFIDENCE_THRESHOLD = 10000;
  const swipeConfidencePower = (offset: number, velocity: number) => {
    return Math.abs(offset) * velocity;
  };
  
  const handleSwipe = (offset: number, velocity: number) => {
    // Only on mobile
    if (!isMobile) return;
    
    const swipe = swipeConfidencePower(offset, velocity);
    const currentIndex = TAB_ORDER.indexOf(activeView);
    
    if (swipe < -SWIPE_CONFIDENCE_THRESHOLD && currentIndex < TAB_ORDER.length - 1) {
      // Swiped left → Next tab
      const nextView = TAB_ORDER[currentIndex + 1];
      setActiveView(nextView);
      // Haptic feedback if available
      if (window.navigator && 'vibrate' in window.navigator) {
        window.navigator.vibrate(10);
      }
    } else if (swipe > SWIPE_CONFIDENCE_THRESHOLD && currentIndex > 0) {
      // Swiped right → Previous tab
      const prevView = TAB_ORDER[currentIndex - 1];
      setActiveView(prevView);
      // Haptic feedback if available
      if (window.navigator && 'vibrate' in window.navigator) {
        window.navigator.vibrate(10);
      }
    }
  };

  // Mobile filters state - initialize groupBy from external groupByMode if available
  // Default year to 'all' so projects without dates are visible by default
  const [mobileFilters, setMobileFilters] = useState<MobileFilterState>({
    year: 'all',
    quarter: 'all',
    vertical: 'all',
    type: 'all',
    collaborator: 'all',
    groupBy: externalGroupByMode || 'status'
  });
  
  // Sync mobileFilters.groupBy with external groupByMode
  useEffect(() => {
    if (externalGroupByMode !== undefined && mobileFilters.groupBy !== externalGroupByMode) {
      setMobileFilters(prev => ({ ...prev, groupBy: externalGroupByMode }));
    }
  }, [externalGroupByMode, mobileFilters.groupBy]);
  
  // Custom setMobileFilters that also updates external groupByMode
  const handleMobileFiltersChange = (newFilters: MobileFilterState) => {
    setMobileFilters(newFilters);
    
    // Sync groupBy change to App.tsx
    if (newFilters.groupBy !== groupByMode && onGroupByModeChange) {
      onGroupByModeChange(newFilters.groupBy);
    }
  };

  // Filter projects function
  const filterProjects = (filterOptions: FilterOptions): Project[] => {
    return projects.filter(project => {
      // Search filter - search in project name, description, and collaborator names
      if (filterOptions.search) {
        const searchLower = filterOptions.search.toLowerCase();
        const matchesName = project.project_name?.toLowerCase().includes(searchLower);
        const matchesDescription = (project.description || '').toLowerCase().includes(searchLower);
        const matchesCollaborator = project.collaborators?.some(collab => 
          collab.name?.toLowerCase().includes(searchLower)
        );
        
        const matchesSearch = matchesName || matchesDescription || matchesCollaborator;
        
        if (!matchesSearch) return false;
      }

      // Vertical filter
      if (filterOptions.vertical && project.vertical !== filterOptions.vertical) {
        return false;
      }

      // Type filter
      if (filterOptions.type && project.type !== filterOptions.type) {
        return false;
      }

      // Status filter
      if (filterOptions.status && project.status !== filterOptions.status) {
        return false;
      }

      // Collaborator filter
      if (filterOptions.collaborator) {
        if (!project.collaborators || !Array.isArray(project.collaborators)) return false;
        const hasCollaborator = project.collaborators.some(collab => 
          collab.name === filterOptions.collaborator || collab.id === filterOptions.collaborator
        );
        if (!hasCollaborator) return false;
      }

      return true;
    });
  };

  // Mobile filter function
  const filterProjectsMobile = (projects: Project[], mobileFilters: MobileFilterState): Project[] => {
    return projects.filter(project => {
      // IMPORTANT: Projects without dates (including drafts) should always pass through date filters
      // They may not have dates yet, but we still want to show them
      const isDraft = project.is_draft === true;
      const hasNoDates = !project.start_date && !project.due_date;
      
      // Year filter - skip for projects without dates
      if (mobileFilters.year !== 'all' && !isDraft && !hasNoDates) {
        const yearNum = parseInt(mobileFilters.year);
        const startYear = project.start_date ? new Date(project.start_date).getFullYear() : null;
        const dueYear = project.due_date ? new Date(project.due_date).getFullYear() : null;
        
        const matchesYear = startYear === yearNum || dueYear === yearNum;
        if (!matchesYear) return false;
      }

      // Quarter filter - skip for projects without dates
      if (mobileFilters.quarter !== 'all' && !isDraft && !hasNoDates) {
        const yearNum = mobileFilters.year !== 'all' ? parseInt(mobileFilters.year) : undefined;
        const pattern = getQuarterPattern(project.start_date, project.due_date, yearNum);
        
        if (!pattern) return false;
        
        // Check if pattern matches or includes the selected quarter
        const selectedQ = mobileFilters.quarter;
        if (pattern === selectedQ) return true;
        
        // Check if pattern is a range that includes selected quarter
        const patternMatch = pattern.match(/^Q(\d)(?:-Q(\d))?$/);
        const selectedMatch = selectedQ.match(/^Q(\d)$/);
        
        if (patternMatch && selectedMatch) {
          const patternStart = parseInt(patternMatch[1]);
          const patternEnd = patternMatch[2] ? parseInt(patternMatch[2]) : patternStart;
          const selectedQNum = parseInt(selectedMatch[1]);
          
          const inRange = selectedQNum >= patternStart && selectedQNum <= patternEnd;
          if (!inRange) return false;
        } else if (pattern !== selectedQ) {
          return false;
        }
      }

      // Vertical filter
      if (mobileFilters.vertical !== 'all' && project.vertical !== mobileFilters.vertical) {
        return false;
      }

      // Type filter
      if (mobileFilters.type !== 'all' && project.type !== mobileFilters.type) {
        return false;
      }

      // Collaborator filter
      if (mobileFilters.collaborator !== 'all') {
        if (!project.collaborators || !Array.isArray(project.collaborators)) return false;
        const hasCollaborator = project.collaborators.some(collab => 
          collab.id === mobileFilters.collaborator
        );
        if (!hasCollaborator) return false;
      }

      return true;
    });
  };

  // Get unique values for filter options
  const getFilterOptions = () => {
    const verticals = [...new Set(projects.map(p => p.vertical))].filter(Boolean);
    const types = [...new Set(projects.map(p => p.type))].filter(Boolean);
    
    return { verticals, types };
  };

  // Apply filters based on mobile/desktop
  const filteredProjectsUnsorted = isMobile 
    ? filterProjects(filters).filter(p => {
        // Apply mobile-specific filters on top of desktop search filter
        // This allows search bar (desktop ProjectFilters) to work on mobile
        return filterProjectsMobile([p], mobileFilters).length > 0;
      })
    : filterProjects(filters);
  
  // Sort filtered projects by urgency (deadline proximity)
  const filteredProjects = sortProjectsByUrgency(filteredProjectsUnsorted);
  
  const filterOptions = getFilterOptions();
  
  // Get all available years from projects
  const allYears = projects.reduce((years, project) => {
    const startYear = project.start_date ? new Date(project.start_date).getFullYear() : null;
    const dueYear = project.due_date ? new Date(project.due_date).getFullYear() : null;
    
    if (startYear && !isNaN(startYear) && !years.includes(startYear)) {
      years.push(startYear);
    }
    if (dueYear && !isNaN(dueYear) && !years.includes(dueYear)) {
      years.push(dueYear);
    }
    return years;
  }, [] as number[]);
  const sortedYears = allYears.sort((a, b) => b - a); // Newest year first
  
  // Get all available quarter patterns (both individual and ranges)
  // Examples: Q1, Q2, Q1-Q3, Q2-Q4, etc.
  const yearNum = selectedYear !== 'all' ? parseInt(selectedYear) : undefined;
  const quarterPatterns = new Set<string>();
  
  projects.forEach(project => {
    const pattern = getQuarterPattern(project.start_date, project.due_date, yearNum);
    if (pattern) {
      quarterPatterns.add(pattern);
      
      // Also add individual quarters that this pattern covers
      // So if pattern is "Q1-Q3", also add Q1, Q2, Q3
      const match = pattern.match(/^Q(\d)(?:-Q(\d))?$/);
      if (match) {
        const startQ = parseInt(match[1]);
        const endQ = match[2] ? parseInt(match[2]) : startQ;
        
        for (let q = startQ; q <= endQ; q++) {
          quarterPatterns.add(`Q${q}`);
        }
      }
    }
  });
  
  // Sort quarter patterns: individual quarters first (Q1, Q2, Q3, Q4), then ranges
  const sortedQuarters = Array.from(quarterPatterns).sort((a, b) => {
    const aMatch = a.match(/^Q(\d)(?:-Q(\d))?$/);
    const bMatch = b.match(/^Q(\d)(?:-Q(\d))?$/);
    
    if (!aMatch || !bMatch) return 0;
    
    const aStart = parseInt(aMatch[1]);
    const aEnd = aMatch[2] ? parseInt(aMatch[2]) : aStart;
    const aIsSingle = !aMatch[2];
    
    const bStart = parseInt(bMatch[1]);
    const bEnd = bMatch[2] ? parseInt(bMatch[2]) : bStart;
    const bIsSingle = !bMatch[2];
    
    // Single quarters first
    if (aIsSingle && !bIsSingle) return -1;
    if (!aIsSingle && bIsSingle) return 1;
    
    // Then sort by start quarter
    if (aStart !== bStart) return aStart - bStart;
    
    // Then by end quarter
    return aEnd - bEnd;
  });
  
  // Handler for year change - reset quarter when year changes
  const handleYearChange = (year: string) => {
    setSelectedYear(year);
    setSelectedQuarter('all'); // Reset quarter when year changes
  };

  // Separate active and archived projects based on status configuration
  const activeProjects = filteredProjects.filter(p => !isArchiveStatus(p.status));
  const archivedProjects = filteredProjects.filter(p => isArchiveStatus(p.status));
  
  // Log draft projects in Dashboard
  useEffect(() => {
    const draftCount = projects.filter(p => p.is_draft).length;
    const activeDraftCount = activeProjects.filter(p => p.is_draft).length;
    console.log('[Dashboard] Total projects:', projects.length);
    console.log('[Dashboard] Draft projects in all:', draftCount);
    console.log('[Dashboard] Draft projects in active:', activeDraftCount);
    if (draftCount > 0) {
      console.log('[Dashboard] Draft projects:', projects.filter(p => p.is_draft).map(p => ({ id: p.id, name: p.project_name, is_draft: p.is_draft })));
    }
  }, [projects, activeProjects]);



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <LoadingSpinner size="lg" text="Loading your project timeline..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <h1 
                  className="text-xl sm:text-2xl font-semibold text-foreground cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={() => onViewChange?.('table')}
                >
                  {appSettings.title}
                </h1>
                <RotatingTagline />
              </div>
              <div className="flex items-center gap-2 sm:hidden flex-shrink-0">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                {!isLoggedIn && onLogin && (
                  <Button 
                    onClick={onLogin}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2"
                  >
                    {loginButtonLabel}
                  </Button>
                )}
                {isLoggedIn && (
                  <>
                    <Button 
                      onClick={onCreateProject}
                      size="sm"
                      className="flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      New
                    </Button>
                    {/* Admin Avatar Menu - Mobile */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="rounded-full p-0 h-8 w-8">
                          <Avatar className="h-8 w-8">
                            <AvatarImage 
                              src={profile?.custom_photo_url || profile?.slack_photo_url || undefined} 
                              alt={profile?.username || user?.email || 'Admin'} 
                            />
                            <AvatarFallback className="text-xs">
                              {(() => {
                                if (profile?.username) {
                                  return profile.username.substring(0, 2).toUpperCase();
                                }
                                if (user?.email) {
                                  return user.email.substring(0, 2).toUpperCase();
                                }
                                return <User className="h-4 w-4" />;
                              })()}
                            </AvatarFallback>
                          </Avatar>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        {/* User Info Header */}
                        <div className="flex items-center gap-3 px-2 py-2 mb-1">
                          <Avatar className="h-10 w-10">
                            <AvatarImage 
                              src={profile?.custom_photo_url || profile?.slack_photo_url || undefined} 
                              alt={profile?.username || user?.email || 'Admin'} 
                            />
                            <AvatarFallback className="text-sm">
                              {(() => {
                                if (profile?.username) {
                                  return profile.username.substring(0, 2).toUpperCase();
                                }
                                if (user?.email) {
                                  return user.email.substring(0, 2).toUpperCase();
                                }
                                return <User className="h-5 w-5" />;
                              })()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {profile?.username || user?.email?.split('@')[0] || 'Admin'}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {user?.email || ''}
                            </p>
                          </div>
                        </div>
                        <DropdownMenuSeparator />
                        {onSettings && (
                          <DropdownMenuItem onClick={onSettings}>
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => setStatsOpen(true)}>
                          <BarChart3 className="mr-2 h-4 w-4" />
                          Stats
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={async () => {
                            try {
                              await signOut();
                              toast.success('Logged out successfully');
                            } catch (error) {
                              toast.error('Failed to log out');
                            }
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Log out
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </>
                )}
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleTheme}
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              {!isLoggedIn && onLogin && (
                <Button 
                  onClick={onLogin}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  {loginButtonLabel}
                </Button>
              )}
              {isLoggedIn && (
                <Button 
                  onClick={onCreateProject}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Project
                </Button>
              )}
              {isLoggedIn && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage 
                          src={profile?.custom_photo_url || profile?.slack_photo_url || undefined} 
                          alt={profile?.username || user?.email || 'Admin'} 
                        />
                        <AvatarFallback className="text-xs">
                          {(() => {
                            if (profile?.username) {
                              return profile.username.substring(0, 2).toUpperCase();
                            }
                            if (user?.email) {
                              return user.email.substring(0, 2).toUpperCase();
                            }
                            return <User className="h-4 w-4" />;
                          })()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    {/* User Info Header */}
                    <div className="flex items-center gap-3 px-2 py-2 mb-1">
                      <Avatar className="h-10 w-10">
                        <AvatarImage 
                          src={profile?.custom_photo_url || profile?.slack_photo_url || undefined} 
                          alt={profile?.username || user?.email || 'Admin'} 
                        />
                        <AvatarFallback className="text-sm">
                          {(() => {
                            if (profile?.username) {
                              return profile.username.substring(0, 2).toUpperCase();
                            }
                            if (user?.email) {
                              return user.email.substring(0, 2).toUpperCase();
                            }
                            return <User className="h-5 w-5" />;
                          })()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {profile?.username || user?.email?.split('@')[0] || 'Admin'}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user?.email || ''}
                        </p>
                      </div>
                    </div>
                    <DropdownMenuSeparator />
                    {onSettings && (
                      <DropdownMenuItem onClick={onSettings}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => setStatsOpen(true)}>
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Stats
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={async () => {
                        try {
                          await signOut();
                          toast.success('Logged out successfully');
                        } catch (error) {
                          toast.error('Failed to log out');
                        }
                      }}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Snackbar/Announcement Banner - Above search bar */}
      <div className="container mx-auto px-4 pt-4">
        <SnackbarBanner />
      </div>

      {/* Search Bar & Filters - All devices */}
      <div className="container mx-auto px-4 py-4">
        <ProjectFilters
          filters={filters}
          onFiltersChange={setFilters}
          filterOptions={filterOptions}
          collaborators={collaborators}
          isMobile={isMobile}
        />
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as 'table' | 'timeline' | 'archive' | 'lightroom' | 'gdrive')}>
          <div className="flex flex-col gap-4 mb-[12px] sm:flex-row sm:items-center sm:justify-between mt-[0px] mr-[0px] ml-[0px]">
            {/* LEFT: Tab Navigation (View Selector) */}
            <TabsList className="w-full sm:w-auto grid grid-cols-5 sm:inline-flex">
              <TabsTrigger value="table" className="flex items-center gap-2">
                <Table className="h-4 w-4\" />
                <span className="hidden sm:inline">Table</span>
                <span className="sm:hidden">List</span>
              </TabsTrigger>
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Timeline</span>
                <span className="sm:hidden">Time</span>
              </TabsTrigger>
              <TabsTrigger value="lightroom" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span className="hidden sm:inline">Lightroom</span>
                <span className="sm:hidden">Light</span>
              </TabsTrigger>
              <TabsTrigger value="gdrive" className="flex items-center gap-2">
                <HardDrive className="h-4 w-4" />
                <span className="hidden sm:inline">Google Drive</span>
                <span className="sm:hidden">Drive</span>
              </TabsTrigger>
              <TabsTrigger value="archive" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                <span className="hidden sm:inline">Archive</span>
                <span className="sm:hidden">Arch</span>
              </TabsTrigger>
            </TabsList>
            
            {/* RIGHT: Project Count & Filters - Hide completely for timeline/lightroom/gdrive */}
            {(activeView === 'table' || activeView === 'archive') && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* Project Count - First */}
              <p className="text-sm text-muted-foreground">
                {activeView === 'archive' 
                  ? `${archivedProjects.length} archived project${archivedProjects.length !== 1 ? 's' : ''}`
                  : `${activeProjects.length} project${activeProjects.length !== 1 ? 's' : ''}`
                }
              </p>
              
              {/* Desktop Controls - Only on desktop */}
              {!isMobile && (
                <>
                  {/* Group By Dropdown - Only show on Table view */}
                  {activeView === 'table' && (
                    <div className="flex items-center gap-2">
                      <Select value={groupByMode} onValueChange={(value: 'status' | 'vertical') => setGroupByMode(value)}>
                        <SelectTrigger className="w-[160px] h-8 text-xs">
                          <div className="flex items-center gap-1.5">
                            <Filter className="h-3 w-3" />
                            <SelectValue placeholder="Group by" />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="status">Group by Status</SelectItem>
                          <SelectItem value="vertical">Group by Vertical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {/* Year Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                        <Calendar className="h-3.5 w-3.5" />
                        {selectedYear === 'all' ? 'All Years' : selectedYear}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleYearChange('all')}
                        className={selectedYear === 'all' ? 'bg-accent' : ''}
                      >
                        All Years
                      </DropdownMenuItem>
                      {sortedYears.map((year) => (
                        <DropdownMenuItem
                          key={year}
                          onClick={() => handleYearChange(year.toString())}
                          className={selectedYear === year.toString() ? 'bg-accent' : ''}
                        >
                          {year}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  
                  {/* Quarter Filter Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8 gap-2 text-xs">
                        <Calendar className="h-3.5 w-3.5" />
                        {selectedQuarter === 'all' ? 'All Quarters' : selectedQuarter}
                        <ChevronDown className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => setSelectedQuarter('all')}
                        className={selectedQuarter === 'all' ? 'bg-accent' : ''}
                      >
                        All Quarters
                      </DropdownMenuItem>
                      {sortedQuarters.map((quarter) => (
                        <DropdownMenuItem
                          key={quarter}
                          onClick={() => setSelectedQuarter(quarter)}
                          className={selectedQuarter === quarter ? 'bg-accent' : ''}
                        >
                          {quarter}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
              
              {/* Mobile Filters Button - Only on mobile and table/archive view */}
              {isMobile && (activeView === 'table' || activeView === 'archive') && (
                <MobileFilters
                  filters={mobileFilters}
                  onFiltersChange={handleMobileFiltersChange}
                  availableYears={sortedYears}
                  availableQuarters={sortedQuarters}
                  availableVerticals={filterOptions.verticals as string[]}
                  availableTypes={filterOptions.types as string[]}
                  collaborators={collaborators}
                />
              )}
            </div>
            )}
          </div>

          <TabsContent value="table" className="space-y-4">
            <motion.div
              drag={isMobile ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info: PanInfo) => handleSwipe(info.offset.x, info.velocity.x)}
              className={isMobile ? "cursor-grab active:cursor-grabbing" : ""}
            >
            {isMobile ? (
              <MobileProjectList
                projects={activeProjects}
                collaborators={collaborators}
                groupByMode={mobileFilters.groupBy}
                onProjectClick={onProjectDetail}
                onEditProject={onEditProject}
                onDeleteProject={onDeleteProject}
                onProjectUpdate={onProjectUpdate}
                onNavigateToLightroom={onNavigateToLightroom}
                onNavigateToGDrive={onNavigateToGDrive}
                onCreateProject={onCreateProject}
                isPublicView={!isLoggedIn}
              />
            ) : (
              <ProjectTable
                projects={activeProjects}
                collaborators={collaborators}
                onProjectClick={onProjectDetail}
                onEditProject={onEditProject}
                onProjectUpdate={onProjectUpdate || (() => {})}
                onProjectDelete={onDeleteProject || (() => {})}
                onCreateProject={onCreateProject}
                onNavigateToLightroom={onNavigateToLightroom}
                onNavigateToGDrive={onNavigateToGDrive}
                selectedQuarter={selectedQuarter}
                selectedYear={selectedYear}
                groupByMode={groupByMode}
                isPublicView={!isLoggedIn}
              />
            )}
            </motion.div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-4">
            <motion.div
              drag={isMobile ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info: PanInfo) => handleSwipe(info.offset.x, info.velocity.x)}
              className={isMobile ? "cursor-grab active:cursor-grabbing" : ""}
            >
            <ProjectTimeline
              projects={filteredProjects}
              onProjectClick={onProjectDetail}
              isPublicView={!isLoggedIn}
            />
            </motion.div>
          </TabsContent>

          <TabsContent value="lightroom" className="space-y-4">
            <motion.div
              drag={isMobile ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info: PanInfo) => handleSwipe(info.offset.x, info.velocity.x)}
              className={isMobile ? "cursor-grab active:cursor-grabbing" : ""}
            >
            {onNavigateToLightroom && (
              <LightroomOverview
                projects={projects}
                onNavigateToProject={onNavigateToLightroom}
                onProjectDetail={onProjectDetail}
                onProjectUpdate={onProjectUpdate}
                isPublicView={!isLoggedIn}
                searchQuery={filters.search || ''}
              />
            )}
            </motion.div>
          </TabsContent>

          <TabsContent value="gdrive" className="space-y-4">
            <motion.div
              drag={isMobile ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info: PanInfo) => handleSwipe(info.offset.x, info.velocity.x)}
              className={isMobile ? "cursor-grab active:cursor-grabbing" : ""}
            >
            {onNavigateToGDrive && (
              <GDriveOverview
                projects={projects}
                onNavigateToProject={onNavigateToGDrive}
                onProjectDetail={onProjectDetail}
                onProjectUpdate={onProjectUpdate}
                onViewImages={onViewGDriveImages}
                isPublicView={!isLoggedIn}
                searchQuery={filters.search || ''}
              />
            )}
            </motion.div>
          </TabsContent>

          <TabsContent value="archive" className="space-y-4">
            <motion.div
              drag={isMobile ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info: PanInfo) => handleSwipe(info.offset.x, info.velocity.x)}
              className={isMobile ? "cursor-grab active:cursor-grabbing" : ""}
            >
            {isMobile ? (
              <MobileProjectList
                projects={archivedProjects}
                collaborators={collaborators}
                groupByMode={mobileFilters.groupBy}
                onProjectClick={onProjectDetail}
                onEditProject={onEditProject}
                onDeleteProject={onDeleteProject}
                onProjectUpdate={onProjectUpdate}
                onNavigateToLightroom={onNavigateToLightroom}
                onNavigateToGDrive={onNavigateToGDrive}
                onCreateProject={onCreateProject}
                isPublicView={!isLoggedIn}
              />
            ) : (
              <ProjectTable
                projects={archivedProjects}
                collaborators={collaborators}
                onProjectClick={onProjectDetail}
                onEditProject={onEditProject}
                onProjectUpdate={onProjectUpdate || (() => {})}
                onProjectDelete={onDeleteProject || (() => {})}
                onCreateProject={onCreateProject}
                onNavigateToLightroom={onNavigateToLightroom}
                onNavigateToGDrive={onNavigateToGDrive}
                selectedQuarter={selectedQuarter}
                selectedYear={selectedYear}
                groupByMode={groupByMode}
                isPublicView={!isLoggedIn}
              />
            )}
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Stats Dialog */}
      <StatsDialog open={statsOpen} onOpenChange={setStatsOpen} />

    </div>
  );
}