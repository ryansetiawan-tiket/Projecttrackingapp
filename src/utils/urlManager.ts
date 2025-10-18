/**
 * URL Manager - Browser History Integration
 * 
 * Manages URL state synchronization with browser history for proper
 * back/forward navigation support on desktop and mobile.
 */

type Page = 'dashboard' | 'create-project' | 'edit-project' | 'settings' | 'lightroom' | 'gdrive' | 'auth';
type DashboardView = 'table' | 'timeline' | 'archive' | 'lightroom' | 'gdrive';

export interface URLState {
  page: Page;
  view?: DashboardView;
  projectId?: string;
  vertical?: string;
  status?: string;
  isPublicLightroom?: boolean;
  isPublicGDrive?: boolean;
  fromView?: DashboardView; // Track which dashboard view we came from
}

/**
 * Parse current URL parameters into URLState
 * 
 * Priority order:
 * 1. ?lightroom=xxx (public share)
 * 2. ?gdrive=xxx (public share)
 * 3. ?page=xxx (app navigation)
 * 4. ?view=xxx (dashboard view)
 * 5. / (default dashboard)
 */
export function parseURL(): URLState {
  const params = new URLSearchParams(window.location.search);
  
  // Priority 1: Public Lightroom share
  const lightroomId = params.get('lightroom');
  if (lightroomId) {
    const state: URLState = {
      page: 'lightroom',
      projectId: lightroomId,
      isPublicLightroom: true
    };
    const fromView = params.get('from') as DashboardView | null;
    if (fromView) state.fromView = fromView;
    return state;
  }
  
  // Priority 2: Public GDrive share
  const gdriveId = params.get('gdrive');
  if (gdriveId) {
    const state: URLState = {
      page: 'gdrive',
      projectId: gdriveId,
      isPublicGDrive: true
    };
    const fromView = params.get('from') as DashboardView | null;
    if (fromView) state.fromView = fromView;
    return state;
  }
  
  // Priority 3: App pages
  const page = params.get('page') as Page | null;
  if (page) {
    const state: URLState = { page };
    
    // Add optional params
    const id = params.get('id');
    if (id) state.projectId = id;
    
    const vertical = params.get('vertical');
    if (vertical) state.vertical = vertical;
    
    const status = params.get('status');
    if (status) state.status = status;
    
    const fromView = params.get('from') as DashboardView | null;
    if (fromView) state.fromView = fromView;
    
    return state;
  }
  
  // Priority 4: Dashboard view (with optional project detail)
  const view = params.get('view') as DashboardView | null;
  const projectId = params.get('id');
  
  if (view || projectId) {
    const state: URLState = {
      page: 'dashboard',
      view: view || 'table'
    };
    
    // Include projectId if present (for detail sidebar)
    if (projectId) {
      state.projectId = projectId;
    }
    
    return state;
  }
  
  // Default: Dashboard with table view
  return {
    page: 'dashboard',
    view: 'table'
  };
}

/**
 * Build URL string from URLState
 * 
 * @param state - Partial URLState to build URL from
 * @returns URL string (with ? prefix if params exist, otherwise '/')
 */
export function buildURL(state: Partial<URLState>): string {
  const params = new URLSearchParams();
  
  // Special case: Public Lightroom share
  if (state.isPublicLightroom && state.projectId) {
    params.set('lightroom', state.projectId);
    if (state.fromView) params.set('from', state.fromView);
    return `?${params.toString()}`;
  }
  
  // Special case: Public GDrive share
  if (state.isPublicGDrive && state.projectId) {
    params.set('gdrive', state.projectId);
    if (state.fromView) params.set('from', state.fromView);
    return `?${params.toString()}`;
  }
  
  // Dashboard (default page)
  if (state.page === 'dashboard' || !state.page) {
    // Only add view param if it's not the default 'table'
    if (state.view && state.view !== 'table') {
      params.set('view', state.view);
    }
    
    // Add projectId if present (for detail sidebar)
    if (state.projectId) {
      params.set('id', state.projectId);
    }
    
    return params.toString() ? `?${params.toString()}` : '/';
  }
  
  // Other app pages
  params.set('page', state.page);
  
  // Add optional params
  if (state.projectId) {
    params.set('id', state.projectId);
  }
  
  if (state.vertical) {
    params.set('vertical', state.vertical);
  }
  
  if (state.status) {
    params.set('status', state.status);
  }
  
  if (state.fromView) {
    params.set('from', state.fromView);
  }
  
  return `?${params.toString()}`;
}

/**
 * Push new state to browser history
 * Updates URL and adds entry to history stack
 * 
 * @param state - URLState to push
 */
export function pushURLState(state: Partial<URLState>) {
  const url = buildURL(state);
  // Safe logging - only log primitive values
  console.log('[URLManager] Push →', url);
  // Pass null as state since we store everything in URL
  // This prevents DataCloneError with non-serializable objects
  window.history.pushState(null, '', url);
}

/**
 * Replace current state in browser history
 * Updates URL without adding new history entry
 * 
 * @param state - URLState to replace with
 */
export function replaceURLState(state: Partial<URLState>) {
  const url = buildURL(state);
  // Safe logging - only log primitive values
  console.log('[URLManager] Replace →', url);
  // Pass null as state since we store everything in URL
  // This prevents DataCloneError with non-serializable objects
  window.history.replaceState(null, '', url);
}

/**
 * Get the page type from current URL
 * Convenience method for quick page checks
 */
export function getCurrentPage(): Page {
  return parseURL().page;
}

/**
 * Check if current URL represents a public share
 */
export function isPublicShare(): boolean {
  const state = parseURL();
  return state.isPublicLightroom === true || state.isPublicGDrive === true;
}
