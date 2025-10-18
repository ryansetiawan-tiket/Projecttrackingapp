import { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Settings, Plus, X, Pencil, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Collaborator } from '../types/project';
import { useRoles } from '../hooks/useRoles';

interface RoleManagementProps {
  collaborators: Collaborator[];
  onRefreshData?: () => void;
}

export function RoleManagement({ collaborators, onRefreshData }: RoleManagementProps) {
  const { roles: roleOptions, addRole, deleteRole, updateRole, isRoleInUse } = useRoles();
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Add new role
  const addNewRole = useCallback(async () => {
    if (!newRoleName.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    try {
      await addRole(newRoleName.trim());
      setNewRoleName('');
      toast.success(`Role "${newRoleName.trim()}" added successfully`);
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add role');
    }
  }, [newRoleName, addRole, onRefreshData]);

  // Remove role (only if not in use)
  const removeRole = useCallback(async (role: string) => {
    try {
      await deleteRole(role);
      toast.success(`Role "${role}" removed successfully`);
      if (onRefreshData) {
        onRefreshData();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove role';
      if (errorMessage.includes('currently in use')) {
        toast.error(`Cannot delete "${role}" - this role is currently assigned to collaborators. Remove all assignments first.`);
      } else {
        toast.error(`Failed to remove role "${role}": ${errorMessage}`);
      }
    }
  }, [deleteRole, onRefreshData]);

  // Start editing a role
  const startEditRole = useCallback((role: string) => {
    setEditingRole(role);
    setEditValue(role);
  }, []);

  // Save edited role
  const saveEditRole = useCallback(async (oldRole: string) => {
    if (!editValue.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    if (editValue.trim() === oldRole) {
      // No change, just cancel editing
      setEditingRole(null);
      setEditValue('');
      return;
    }

    try {
      await updateRole(oldRole, editValue.trim());
      setEditingRole(null);
      setEditValue('');
      
      // 🎯 Refresh collaborators data to update role names everywhere
      if (onRefreshData) {
        console.log('[RoleManagement] Refreshing data after role rename...');
        await onRefreshData();
      }
      
      toast.success(`Role renamed from "${oldRole}" to "${editValue.trim()}"`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update role');
    }
  }, [editValue, updateRole, onRefreshData]);

  // Cancel editing
  const cancelEditRole = useCallback(() => {
    setEditingRole(null);
    setEditValue('');
  }, []);

  return (
    <div className="space-y-6">
      {/* Add New Role */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Plus className="h-4 w-4 md:h-5 md:w-5" />
            Add New Role
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Create custom roles for your collaborators (e.g., Designer, Developer, Manager)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              placeholder="Enter role name"
              className="h-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addNewRole();
                }
              }}
            />
            <Button
              onClick={addNewRole}
              disabled={!newRoleName.trim()}
              className="sm:min-w-[120px] w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Role
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Existing Roles */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base md:text-lg">
            <Settings className="h-4 w-4 md:h-5 md:w-5" />
            Current Roles ({roleOptions.length})
          </CardTitle>
          <CardDescription className="text-xs md:text-sm">
            Manage existing roles - roles currently in use cannot be deleted
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roleOptions.length > 0 ? (
            <div className="space-y-2">
              {roleOptions.map((role) => {
                const localRoleInUse = isRoleInUse(role, collaborators);
                return (
                  <div 
                    key={role} 
                    className="flex items-center justify-between gap-2 bg-muted/50 rounded-lg px-3 py-2 border"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {editingRole === role ? (
                        <Input
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="h-8 flex-1"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              saveEditRole(role);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelEditRole();
                            }
                          }}
                        />
                      ) : (
                        <span className="truncate">{role}</span>
                      )}
                      {localRoleInUse && (
                        <span 
                          className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded flex-shrink-0" 
                          title="Role is in use"
                        >
                          In Use
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {editingRole === role ? (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => saveEditRole(role)}
                            className="h-7 w-7 p-0 hover:bg-green-100 hover:text-green-600"
                            title="Save changes"
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditRole}
                            className="h-7 w-7 p-0 hover:bg-muted"
                            title="Cancel editing"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditRole(role)}
                            className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary"
                            title="Edit role name"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeRole(role)}
                            className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                            title="Delete role"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Settings className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>No roles yet</p>
              <p className="text-sm">Add your first role above</p>
            </div>
          )}
          
          {roleOptions.length > 0 && (
            <div className="mt-4 text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
              <strong>Note:</strong> Roles marked as "In Use" are assigned to collaborators. 
              The system will prevent deletion if the role is used in any project.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}