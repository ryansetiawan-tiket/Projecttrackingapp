import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Users, Plus, Pencil, X, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { Collaborator } from '../types/project';
import { useRoles } from '../hooks/useRoles';

interface TeamManagementProps {
  collaborators: Collaborator[];
  onCreateCollaborator: (collaborator: Partial<Collaborator>) => void;
  onUpdateCollaborator: (collaboratorId: string, collaborator: Partial<Collaborator>) => void;
  onDeleteCollaborator: (collaboratorId: string) => void;
}

export function TeamManagement({
  collaborators,
  onCreateCollaborator,
  onUpdateCollaborator,
  onDeleteCollaborator
}: TeamManagementProps) {
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newProfileUrl, setNewProfileUrl] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNickname, setEditNickname] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editProfileUrl, setEditProfileUrl] = useState('');

  const { roles } = useRoles();

  const handleCreate = () => {
    if (!newName.trim()) {
      toast.error('Please enter a name');
      return;
    }

    const newCollaborator: Partial<Collaborator> = {
      id: crypto.randomUUID(),
      name: newName.trim(),
      nickname: newNickname.trim() || undefined,
      role: newRole || 'Collaborator',
      photo_url: newPhotoUrl.trim() || undefined,
      profile_url: newProfileUrl.trim() || undefined
    };

    onCreateCollaborator(newCollaborator);
    setNewName('');
    setNewNickname('');
    setNewRole('');
    setNewPhotoUrl('');
    setNewProfileUrl('');
    toast.success(`${newCollaborator.nickname || newCollaborator.name} added successfully`);
  };

  const startEdit = (collaborator: Collaborator) => {
    setEditingId(collaborator.id);
    setEditName(collaborator.name);
    setEditNickname(collaborator.nickname || '');
    setEditRole(collaborator.role);
    setEditPhotoUrl(collaborator.photo_url || '');
    setEditProfileUrl(collaborator.profile_url || '');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditNickname('');
    setEditRole('');
    setEditPhotoUrl('');
    setEditProfileUrl('');
  };

  const handleUpdate = (collaboratorId: string) => {
    if (!editName.trim()) {
      toast.error('Name cannot be empty');
      return;
    }

    const updates: Partial<Collaborator> = {
      name: editName.trim(),
      nickname: editNickname.trim() || undefined,
      role: editRole,
      photo_url: editPhotoUrl.trim() || undefined,
      profile_url: editProfileUrl.trim() || undefined
    };

    onUpdateCollaborator(collaboratorId, updates);
    cancelEdit();
    toast.success('Collaborator updated successfully');
  };

  const handleDelete = (collaborator: Collaborator) => {
    if (confirm(`Are you sure you want to remove ${collaborator.nickname || collaborator.name}?`)) {
      onDeleteCollaborator(collaborator.id);
      toast.success(`${collaborator.nickname || collaborator.name} removed successfully`);
    }
  };

  const openProfileLink = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-6">
      {/* Add New Collaborator */}
      <Card>
        <CardContent className="p-3 md:p-4 space-y-3 md:space-y-4">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm md:text-base">Add New Collaborator</h3>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name" className="text-xs font-medium text-muted-foreground">
                FULL NAME *
              </Label>
              <Input
                id="new-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Enter full name"
                className="h-10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newName.trim()) {
                    handleCreate();
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-nickname" className="text-xs font-medium text-muted-foreground">
                NICKNAME (OPTIONAL)
              </Label>
              <Input
                id="new-nickname"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                placeholder="Enter nickname"
                className="h-10"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && newName.trim()) {
                    handleCreate();
                  }
                }}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-role" className="text-xs font-medium text-muted-foreground">
                ROLE
              </Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="new-role" className="h-10">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-photo-url" className="text-xs font-medium text-muted-foreground">
                PHOTO URL (OPTIONAL)
              </Label>
              <div className="flex gap-2">
                {newPhotoUrl && (
                  <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-border bg-muted">
                    <img 
                      src={newPhotoUrl} 
                      alt="Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                <Input
                  id="new-photo-url"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  placeholder="Paste image URL"
                  className="h-10 flex-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-profile-url" className="text-xs font-medium text-muted-foreground">
                PROFILE LINK (OPTIONAL)
              </Label>
              <Input
                id="new-profile-url"
                value={newProfileUrl}
                onChange={(e) => setNewProfileUrl(e.target.value)}
                placeholder="https://... (LinkedIn, portfolio, etc.)"
                className="h-10"
              />
            </div>
            
            <div className="flex items-end">
              <Button
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="w-full h-10"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Collaborator
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Existing Collaborators */}
      <Card>
        <CardContent className="p-3 md:p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-medium text-sm md:text-base">Collaborators ({collaborators.length})</h3>
          </div>
          
          {collaborators.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No collaborators yet. Add your first collaborator above.
            </div>
          ) : (
            <div className="space-y-2">
              {collaborators.map((collaborator) => (
                <div key={collaborator.id}>
                  {editingId === collaborator.id ? (
                    // Edit Mode
                    <div className="p-3 bg-muted/30 rounded-lg space-y-3">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Full Name</Label>
                          <Input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Nickname</Label>
                          <Input
                            value={editNickname}
                            onChange={(e) => setEditNickname(e.target.value)}
                            className="h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Role</Label>
                          <Select value={editRole} onValueChange={setEditRole}>
                            <SelectTrigger className="h-9">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roles.map(role => (
                                <SelectItem key={role} value={role}>
                                  {role}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Photo URL</Label>
                          <div className="flex gap-2">
                            {editPhotoUrl && (
                              <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-border bg-muted">
                                <img 
                                  src={editPhotoUrl} 
                                  alt="Preview" 
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}
                            <Input
                              value={editPhotoUrl}
                              onChange={(e) => setEditPhotoUrl(e.target.value)}
                              placeholder="Paste image URL"
                              className="h-9 flex-1"
                            />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs text-muted-foreground">Profile Link</Label>
                          <Input
                            value={editProfileUrl}
                            onChange={(e) => setEditProfileUrl(e.target.value)}
                            placeholder="https://..."
                            className="h-9"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={cancelEdit}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(collaborator.id)}
                          disabled={!editName.trim()}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button
                          onClick={() => openProfileLink(collaborator.profile_url)}
                          disabled={!collaborator.profile_url}
                          className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            collaborator.profile_url 
                              ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 hover:scale-105' 
                              : 'cursor-default'
                          }`}
                        >
                          {collaborator.photo_url ? (
                            <div className="w-full h-full rounded-full overflow-hidden border-2 border-border">
                              <img 
                                src={collaborator.photo_url} 
                                alt={collaborator.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  // Fallback to initial if image fails to load
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {collaborator.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => openProfileLink(collaborator.profile_url)}
                            disabled={!collaborator.profile_url}
                            className={`text-left w-full ${
                              collaborator.profile_url 
                                ? 'cursor-pointer hover:text-primary transition-colors' 
                                : 'cursor-default'
                            }`}
                          >
                            <div className="font-medium text-sm flex items-center gap-1.5">
                              {collaborator.nickname || collaborator.name}
                              {collaborator.profile_url && (
                                <ExternalLink className="h-3 w-3 opacity-50" />
                              )}
                              {collaborator.nickname && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({collaborator.name})
                                </span>
                              )}
                            </div>
                          </button>
                          <div className="text-xs text-muted-foreground">{collaborator.role}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(collaborator)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(collaborator)}
                          className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
