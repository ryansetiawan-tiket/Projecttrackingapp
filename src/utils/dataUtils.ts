/**
 * Utility functions for data sanitization and validation
 */

/**
 * Deep clone and sanitize data to remove circular references and non-serializable values
 * This ensures data can be safely JSON.stringify-ed and sent to the backend
 */
export function sanitizeProjectData<T extends Record<string, any>>(data: T): T {
  // Use JSON parse/stringify to remove circular references and functions
  // This also removes undefined values and converts them to null
  try {
    const jsonString = JSON.stringify(data, (key, value) => {
      // Remove functions
      if (typeof value === 'function') {
        return undefined;
      }
      
      // Remove DOM elements and window references
      if (value instanceof Element || value instanceof Window || value instanceof Document) {
        return undefined;
      }
      
      // Remove React synthetic events
      if (value && typeof value === 'object' && value.nativeEvent) {
        return undefined;
      }
      
      // Keep everything else
      return value;
    });
    
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error sanitizing data:', error);
    // If sanitization fails, return a minimal safe object
    return {} as T;
  }
}

/**
 * Clean project data before saving to ensure only valid fields are sent
 */
export function cleanProjectData(data: any): any {
  // First sanitize to remove circular references
  const sanitized = sanitizeProjectData(data);
  
  console.log('[dataUtils] cleanProjectData input:', data);
  console.log('[dataUtils] cleanProjectData sanitized:', sanitized);
  console.log('[dataUtils] is_draft in input:', data.is_draft);
  console.log('[dataUtils] is_draft in sanitized:', sanitized.is_draft);
  
  // Create a clean object with only the fields we want to save
  const cleaned: any = {};
  
  // Basic fields
  if (sanitized.project_name !== undefined) cleaned.project_name = sanitized.project_name;
  if (sanitized.vertical !== undefined) cleaned.vertical = sanitized.vertical;
  if (sanitized.type !== undefined) cleaned.type = sanitized.type;
  if (sanitized.types !== undefined) cleaned.types = Array.isArray(sanitized.types) ? sanitized.types : [];
  if (sanitized.status !== undefined) cleaned.status = sanitized.status;
  if (sanitized.description !== undefined) cleaned.description = sanitized.description;
  if (sanitized.notes !== undefined) cleaned.notes = sanitized.notes;
  if (sanitized.start_date !== undefined) cleaned.start_date = sanitized.start_date;
  if (sanitized.due_date !== undefined) cleaned.due_date = sanitized.due_date;
  if (sanitized.sprint !== undefined) cleaned.sprint = sanitized.sprint;
  if (sanitized.figma_working_file !== undefined) cleaned.figma_working_file = sanitized.figma_working_file;
  if (sanitized.is_draft !== undefined) cleaned.is_draft = sanitized.is_draft;
  
  // Arrays
  if (sanitized.collaborators !== undefined) {
    cleaned.collaborators = Array.isArray(sanitized.collaborators) ? sanitized.collaborators : [];
  }
  
  if (sanitized.actionable_items !== undefined) {
    cleaned.actionable_items = Array.isArray(sanitized.actionable_items) ? sanitized.actionable_items : [];
  }
  
  if (sanitized.lightroom_assets !== undefined) {
    cleaned.lightroom_assets = Array.isArray(sanitized.lightroom_assets) ? sanitized.lightroom_assets : [];
  }
  
  if (sanitized.gdrive_assets !== undefined) {
    cleaned.gdrive_assets = Array.isArray(sanitized.gdrive_assets) ? sanitized.gdrive_assets : [];
  }
  
  if (sanitized.tags !== undefined) {
    cleaned.tags = Array.isArray(sanitized.tags) ? sanitized.tags : [];
  }
  
  // Links object
  if (sanitized.links !== undefined) {
    cleaned.links = {
      labeled: Array.isArray(sanitized.links?.labeled) ? sanitized.links.labeled : []
    };
  }
  
  console.log('[dataUtils] cleanProjectData output:', cleaned);
  console.log('[dataUtils] is_draft in output:', cleaned.is_draft);
  console.log('[dataUtils] gdrive_assets in output:', cleaned.gdrive_assets);
  console.log('[dataUtils] lightroom_assets in output:', cleaned.lightroom_assets);
  
  return cleaned;
}
