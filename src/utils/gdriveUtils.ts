/**
 * GDrive Nested Folders Utility Functions
 * 
 * Helper functions for managing hierarchical folder structure in GDrive assets.
 * Supports up to 10 levels of nesting with parent-child relationships.
 */

import { GDriveAsset } from '../types/project';

// Maximum allowed nesting depth
export const MAX_NESTING_DEPTH = 10;

/**
 * Get all root-level assets (no parent)
 * 🔧 BACKWARD COMPATIBILITY: Treats undefined parent_id as null (root level)
 */
export function getRootAssets(assets: GDriveAsset[]): GDriveAsset[] {
  return assets.filter(asset => !asset.parent_id); // Already handles undefined correctly
}

/**
 * Get direct children of a folder
 * 🔧 BACKWARD COMPATIBILITY: Treats undefined parent_id as null
 */
export function getChildren(assets: GDriveAsset[], parentId: string): GDriveAsset[] {
  return assets.filter(asset => (asset.parent_id ?? null) === parentId);
}

/**
 * Check if a folder has any children
 */
export function hasChildren(assets: GDriveAsset[], folderId: string): boolean {
  return assets.some(asset => asset.parent_id === folderId);
}

/**
 * Get all descendants of a folder (recursive)
 * Returns flat array of all nested children
 */
export function getAllDescendants(assets: GDriveAsset[], parentId: string): GDriveAsset[] {
  const children = getChildren(assets, parentId);
  const descendants = [...children];
  
  children.forEach(child => {
    if (child.asset_type === 'folder') {
      descendants.push(...getAllDescendants(assets, child.id));
    }
  });
  
  return descendants;
}

/**
 * Get full path to an asset (breadcrumb trail)
 * Returns array of asset names from root to target
 * Example: ['Final Designs', 'Mobile Screens', 'Login Flow']
 */
export function getAssetPath(assets: GDriveAsset[], assetId: string): string[] {
  const asset = assets.find(a => a.id === assetId);
  if (!asset) return [];
  
  if (!asset.parent_id) return [asset.asset_name];
  
  const parentPath = getAssetPath(assets, asset.parent_id);
  return [...parentPath, asset.asset_name];
}

/**
 * Get full path with IDs (for navigation)
 * Returns array of objects with id and name
 * Example: [{ id: 'f1', name: 'Final Designs' }, { id: 'f2', name: 'Mobile Screens' }]
 */
export function getAssetPathWithIds(assets: GDriveAsset[], assetId: string): Array<{ id: string; name: string }> {
  const asset = assets.find(a => a.id === assetId);
  if (!asset) return [];
  
  if (!asset.parent_id) return [{ id: asset.id, name: asset.asset_name }];
  
  const parentPath = getAssetPathWithIds(assets, asset.parent_id);
  return [...parentPath, { id: asset.id, name: asset.asset_name }];
}

/**
 * Get nesting depth/level of an asset
 * Root level = 0, first child = 1, etc.
 */
export function getAssetDepth(assets: GDriveAsset[], assetId: string): number {
  const asset = assets.find(a => a.id === assetId);
  if (!asset || !asset.parent_id) return 0;
  
  return 1 + getAssetDepth(assets, asset.parent_id);
}

/**
 * Validate that adding a child won't exceed max depth
 * Returns { valid: boolean, currentDepth: number, maxAllowed: number }
 */
export function validateNestingDepth(
  assets: GDriveAsset[], 
  parentId: string | null
): { valid: boolean; currentDepth: number; maxAllowed: number } {
  if (!parentId) {
    return { valid: true, currentDepth: 0, maxAllowed: MAX_NESTING_DEPTH };
  }
  
  const currentDepth = getAssetDepth(assets, parentId);
  const valid = currentDepth < MAX_NESTING_DEPTH - 1; // -1 because we're adding one more level
  
  return { valid, currentDepth: currentDepth + 1, maxAllowed: MAX_NESTING_DEPTH };
}

/**
 * Validate that setting a parent won't create circular reference
 * Returns { valid: boolean, reason?: string }
 */
export function validateNoCircularReference(
  assets: GDriveAsset[], 
  assetId: string, 
  newParentId: string | null
): { valid: boolean; reason?: string } {
  // No parent = always valid
  if (!newParentId) {
    return { valid: true };
  }
  
  // Can't set parent to self
  if (assetId === newParentId) {
    return { valid: false, reason: 'Cannot set folder as its own parent' };
  }
  
  // Can't set parent to own descendant (would create loop)
  const descendants = getAllDescendants(assets, assetId);
  if (descendants.some(d => d.id === newParentId)) {
    return { valid: false, reason: 'Cannot set parent to a descendant folder (would create circular reference)' };
  }
  
  return { valid: true };
}

/**
 * Get count of items in a folder (direct children only)
 * Returns { total: number, files: number, folders: number }
 */
export function getFolderItemCount(assets: GDriveAsset[], folderId: string): { total: number; files: number; folders: number } {
  const children = getChildren(assets, folderId);
  const files = children.filter(c => c.asset_type === 'file').length;
  const folders = children.filter(c => c.asset_type === 'folder').length;
  
  return { total: children.length, files, folders };
}

/**
 * Get total count of all nested items (recursive)
 * Returns { total: number, files: number, folders: number }
 */
export function getTotalItemCount(assets: GDriveAsset[], folderId: string): { total: number; files: number; folders: number } {
  const descendants = getAllDescendants(assets, folderId);
  const files = descendants.filter(d => d.asset_type === 'file').length;
  const folders = descendants.filter(d => d.asset_type === 'folder').length;
  
  return { total: descendants.length, files, folders };
}

/**
 * Build tree structure from flat array
 * Each node has: asset + children[]
 * Useful for recursive rendering
 */
export interface GDriveTreeNode {
  asset: GDriveAsset;
  children: GDriveTreeNode[];
  depth: number;
}

export function buildTree(assets: GDriveAsset[], parentId: string | null = null, depth: number = 0): GDriveTreeNode[] {
  // 🔧 BACKWARD COMPATIBILITY: Normalize undefined parent_id to null for old assets
  const children = assets.filter(asset => (asset.parent_id ?? null) === parentId);
  
  return children.map(asset => ({
    asset,
    children: asset.asset_type === 'folder' ? buildTree(assets, asset.id, depth + 1) : [],
    depth
  }));
}

/**
 * Get all folders (excluding files) for parent selector dropdown
 * Excludes the asset itself and its descendants to prevent circular refs
 * Returns sorted array with indentation indicators
 */
export function getAvailableParentFolders(
  assets: GDriveAsset[], 
  excludeAssetId?: string
): Array<{ id: string; name: string; path: string; depth: number; disabled?: boolean }> {
  // Filter to only folders
  let folders = assets.filter(a => a.asset_type === 'folder');
  
  // Exclude the asset itself and its descendants
  if (excludeAssetId) {
    const excludeIds = new Set([excludeAssetId, ...getAllDescendants(assets, excludeAssetId).map(d => d.id)]);
    folders = folders.filter(f => !excludeIds.has(f.id));
  }
  
  // Build list with paths and depths
  const folderList = folders.map(folder => {
    const path = getAssetPath(assets, folder.id).join(' > ');
    const depth = getAssetDepth(assets, folder.id);
    const disabled = depth >= MAX_NESTING_DEPTH - 1; // Can't add children if at max depth
    
    return { id: folder.id, name: folder.asset_name, path, depth, disabled };
  });
  
  // Sort by path (alphabetical, maintains hierarchy)
  return folderList.sort((a, b) => a.path.localeCompare(b.path));
}

/**
 * Flatten tree to array (for display purposes)
 * Maintains order: parent followed by children
 */
export function flattenTree(tree: GDriveTreeNode[]): Array<{ asset: GDriveAsset; depth: number }> {
  const result: Array<{ asset: GDriveAsset; depth: number }> = [];
  
  function traverse(nodes: GDriveTreeNode[]) {
    nodes.forEach(node => {
      result.push({ asset: node.asset, depth: node.depth });
      if (node.children.length > 0) {
        traverse(node.children);
      }
    });
  }
  
  traverse(tree);
  return result;
}

/**
 * Get parent asset
 */
export function getParentAsset(assets: GDriveAsset[], assetId: string): GDriveAsset | null {
  const asset = assets.find(a => a.id === assetId);
  if (!asset?.parent_id) return null;
  
  return assets.find(a => a.id === asset.parent_id) || null;
}

/**
 * Get chain of parent folders from root to asset (excluding the asset itself)
 * Returns array of GDriveAsset objects in order: [root parent, child parent, ..., direct parent]
 * Useful for breadcrumb navigation
 */
export function getParentChain(assets: GDriveAsset[], assetId: string): GDriveAsset[] {
  const asset = assets.find(a => a.id === assetId);
  if (!asset) return [];
  
  // Base case: no parent
  if (!asset.parent_id) return [];
  
  // Get parent asset
  const parent = assets.find(a => a.id === asset.parent_id);
  if (!parent) return [];
  
  // Recursively get parent's chain, then add current parent
  const parentChain = getParentChain(assets, parent.id);
  return [...parentChain, parent];
}

/**
 * Check if asset is a descendant of another asset
 */
export function isDescendantOf(assets: GDriveAsset[], assetId: string, ancestorId: string): boolean {
  const asset = assets.find(a => a.id === assetId);
  if (!asset) return false;
  
  if (asset.parent_id === ancestorId) return true;
  if (!asset.parent_id) return false;
  
  return isDescendantOf(assets, asset.parent_id, ancestorId);
}

/**
 * Move asset to new parent (updates parent_id with validation)
 * Returns { success: boolean, error?: string, updatedAsset?: GDriveAsset }
 */
export function moveAsset(
  assets: GDriveAsset[], 
  assetId: string, 
  newParentId: string | null
): { success: boolean; error?: string; updatedAsset?: GDriveAsset } {
  const asset = assets.find(a => a.id === assetId);
  if (!asset) {
    return { success: false, error: 'Asset not found' };
  }
  
  // Validate circular reference
  const circularCheck = validateNoCircularReference(assets, assetId, newParentId);
  if (!circularCheck.valid) {
    return { success: false, error: circularCheck.reason };
  }
  
  // Validate depth
  const depthCheck = validateNestingDepth(assets, newParentId);
  if (!depthCheck.valid) {
    return { 
      success: false, 
      error: `Maximum nesting depth (${MAX_NESTING_DEPTH} levels) would be exceeded` 
    };
  }
  
  // Update parent_id
  const updatedAsset = { ...asset, parent_id: newParentId };
  return { success: true, updatedAsset };
}

/**
 * 🔧 BACKWARD COMPATIBILITY: Normalize old assets
 * Converts undefined parent_id to null for assets created before nested folders feature
 * This ensures old assets appear at root level in the tree
 * 
 * @param assets - Array of GDrive assets (may have undefined parent_id)
 * @returns Normalized assets array with parent_id as null instead of undefined
 */
export function normalizeGDriveAssets(assets: GDriveAsset[]): GDriveAsset[] {
  return assets.map(asset => ({
    ...asset,
    parent_id: asset.parent_id ?? null // Convert undefined to null
  }));
}
