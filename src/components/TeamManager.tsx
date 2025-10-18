import { useState } from 'react';
import { Plus, Trash2, Edit2, Users, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { ScrollArea } from './ui/scroll-area';
import { useTeams } from '../hooks/useTeams';
import { Collaborator } from '../types/project';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../contexts/AuthContext';

interface TeamManagerProps {
  collaborators: Collaborator[];
  verticals: string[]; // Available verticals from system
}

export function TeamManager({ collaborators, verticals }: TeamManagerProps) {
  const { isAdmin } = useAuth();
  const { teams, loading, createTeam, updateTeam, deleteTeam, createSubteam, updateSubteam, deleteSubteam } = useTeams();
  
  // UI State
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [isCreateSubteamOpen, setIsCreateSubteamOpen] = useState(false);
  const [isEditSubteamOpen, setIsEditSubteamOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'team' | 'subteam'; id: string; teamId?: string } | null>(null);
  
  // Form State
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [selectedSubteamId, setSelectedSubteamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamVertical, setTeamVertical] = useState('');
  const [teamMembers, setTeamMembers] = useState<string[]>([]);
  const [subteamName, setSubteamName] = useState('');
  const [subteamMembers, setSubteamMembers] = useState<string[]>([]);
  const [isEditTeamMembersOpen, setIsEditTeamMembersOpen] = useState(false);

  // Toggle team expansion
  const toggleTeam = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  // Create Team Handler
  const handleCreateTeam = async () => {
    if (!isAdmin) {
      toast.error('Only admins can create teams');
      return;
    }
    
    if (!teamName.trim() || !teamVertical) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await createTeam(teamName.trim(), teamVertical);
      toast.success('Team created successfully!');
      setIsCreateTeamOpen(false);
      setTeamName('');
      setTeamVertical('');
    } catch (error) {
      console.error('[TeamManager] Error creating team:', error);
      toast.error('Failed to create team');
    }
  };

  // Edit Team Handler
  const handleEditTeam = async () => {
    if (!isAdmin) {
      toast.error('Only admins can edit teams');
      return;
    }
    
    if (!selectedTeamId || !teamName.trim() || !teamVertical) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      await updateTeam(selectedTeamId, { name: teamName.trim(), vertical: teamVertical });
      toast.success('Team updated successfully!');
      setIsEditTeamOpen(false);
      setSelectedTeamId(null);
      setTeamName('');
      setTeamVertical('');
    } catch (error) {
      console.error('[TeamManager] Error updating team:', error);
      toast.error('Failed to update team');
    }
  };

  // Edit Team Members Handler
  const handleEditTeamMembers = async () => {
    if (!isAdmin) {
      toast.error('Only admins can edit team members');
      return;
    }
    
    if (!selectedTeamId) {
      toast.error('No team selected');
      return;
    }

    try {
      await updateTeam(selectedTeamId, { memberIds: teamMembers });
      toast.success('Team members updated successfully!');
      setIsEditTeamMembersOpen(false);
      setSelectedTeamId(null);
      setTeamMembers([]);
    } catch (error) {
      console.error('[TeamManager] Error updating team members:', error);
      toast.error('Failed to update team members');
    }
  };

  // Delete Team Handler
  const handleDeleteTeam = async (teamId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can delete teams');
      return;
    }
    
    try {
      await deleteTeam(teamId);
      toast.success('Team deleted successfully!');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('[TeamManager] Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  // Create Subteam Handler
  const handleCreateSubteam = async () => {
    if (!isAdmin) {
      toast.error('Only admins can create sub-teams');
      return;
    }
    
    if (!selectedTeamId || !subteamName.trim()) {
      toast.error('Please enter a sub-team name');
      return;
    }

    try {
      await createSubteam(selectedTeamId, subteamName.trim(), subteamMembers);
      toast.success('Sub-team created successfully!');
      setIsCreateSubteamOpen(false);
      setSelectedTeamId(null);
      setSubteamName('');
      setSubteamMembers([]);
    } catch (error) {
      console.error('[TeamManager] Error creating subteam:', error);
      toast.error('Failed to create sub-team');
    }
  };

  // Edit Subteam Handler
  const handleEditSubteam = async () => {
    if (!isAdmin) {
      toast.error('Only admins can edit sub-teams');
      return;
    }
    
    if (!selectedTeamId || !selectedSubteamId || !subteamName.trim()) {
      toast.error('Please enter a sub-team name');
      return;
    }

    try {
      await updateSubteam(selectedTeamId, selectedSubteamId, { 
        name: subteamName.trim(), 
        memberIds: subteamMembers 
      });
      toast.success('Sub-team updated successfully!');
      setIsEditSubteamOpen(false);
      setSelectedTeamId(null);
      setSelectedSubteamId(null);
      setSubteamName('');
      setSubteamMembers([]);
    } catch (error) {
      console.error('[TeamManager] Error updating subteam:', error);
      toast.error('Failed to update sub-team');
    }
  };

  // Delete Subteam Handler
  const handleDeleteSubteam = async (teamId: string, subteamId: string) => {
    if (!isAdmin) {
      toast.error('Only admins can delete sub-teams');
      return;
    }
    
    try {
      await deleteSubteam(teamId, subteamId);
      toast.success('Sub-team deleted successfully!');
      setDeleteConfirm(null);
    } catch (error) {
      console.error('[TeamManager] Error deleting subteam:', error);
      toast.error('Failed to delete sub-team');
    }
  };

  // Open edit dialogs
  const openEditTeam = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setSelectedTeamId(teamId);
      setTeamName(team.name);
      setTeamVertical(team.vertical);
      setIsEditTeamOpen(true);
    }
  };

  const openEditTeamMembers = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    if (team) {
      setSelectedTeamId(teamId);
      setTeamMembers(team.memberIds || []);
      setIsEditTeamMembersOpen(true);
    }
  };

  const openEditSubteam = (teamId: string, subteamId: string) => {
    const team = teams.find(t => t.id === teamId);
    const subteam = team?.subteams.find(s => s.id === subteamId);
    if (team && subteam) {
      setSelectedTeamId(teamId);
      setSelectedSubteamId(subteamId);
      setSubteamName(subteam.name);
      setSubteamMembers(subteam.memberIds);
      setIsEditSubteamOpen(true);
    }
  };

  // Get collaborator by ID
  const getCollaborator = (id: string) => collaborators.find(c => c.id === id);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-foreground mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading teams...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg">Team Management</h3>
          <p className="text-sm text-muted-foreground">
            Organize collaborators into teams and sub-teams by vertical
          </p>
        </div>
        <Button
          onClick={() => setIsCreateTeamOpen(true)}
          disabled={!isAdmin}
          title={!isAdmin ? 'Only admins can create teams' : ''}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Team
        </Button>
      </div>

      {/* Teams List */}
      {teams.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg mb-2">No teams yet</h3>
            <p className="text-sm text-muted-foreground mb-4 text-center">
              Create your first team to organize collaborators
            </p>
            <Button onClick={() => setIsCreateTeamOpen(true)} disabled={!isAdmin}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <Collapsible open={expandedTeams.has(team.id)} onOpenChange={() => toggleTeam(team.id)}>
                <div className="p-4">
                  {/* Team Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {expandedTeams.has(team.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4>{team.name}</h4>
                          <Badge variant="outline">{team.vertical}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {(team.memberIds || []).length} direct member{(team.memberIds || []).length !== 1 ? 's' : ''} · {team.subteams.length} sub-team{team.subteams.length !== 1 ? 's' : ''} · {
                            team.subteams.reduce((sum, st) => sum + st.memberIds.length, 0)
                          } in sub-teams
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditTeamMembers(team.id)}
                        disabled={!isAdmin}
                        title={!isAdmin ? 'Only admins can edit members' : 'Edit members'}
                      >
                        <Users className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditTeam(team.id)}
                        disabled={!isAdmin}
                        title={!isAdmin ? 'Only admins can edit teams' : 'Edit team'}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm({ type: 'team', id: team.id })}
                        disabled={!isAdmin}
                        title={!isAdmin ? 'Only admins can delete teams' : 'Delete team'}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  {/* Team Members & Sub-teams */}
                  <CollapsibleContent>
                    <div className="mt-4 ml-11 space-y-3">
                      {/* Team Members Section */}
                      <div className="border border-border rounded-lg p-3 bg-accent/30">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>Team Members</span>
                            <Badge variant="secondary" className="text-xs">
                              {(team.memberIds || []).length} member{(team.memberIds || []).length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditTeamMembers(team.id)}
                            disabled={!isAdmin}
                            title={!isAdmin ? 'Only admins can edit members' : 'Edit members'}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        {/* Team Members List */}
                        {(team.memberIds || []).length > 0 ? (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {(team.memberIds || []).map((memberId) => {
                              const collaborator = getCollaborator(memberId);
                              return collaborator ? (
                                <Badge key={memberId} variant="outline" className="text-xs">
                                  {collaborator.name}
                                </Badge>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground mt-2">
                            No direct team members yet. Click edit to assign members.
                          </p>
                        )}
                      </div>

                      {/* Add Subteam Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedTeamId(team.id);
                          setIsCreateSubteamOpen(true);
                        }}
                        disabled={!isAdmin}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Sub-team
                      </Button>

                      {/* Subteam List */}
                      {team.subteams.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No sub-teams yet. Create one to organize team members.
                        </p>
                      ) : (
                        team.subteams.map((subteam) => (
                          <div
                            key={subteam.id}
                            className="border border-border rounded-lg p-3 bg-muted/30"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{subteam.name}</span>
                                <Badge variant="secondary" className="text-xs">
                                  {subteam.memberIds.length} member{subteam.memberIds.length !== 1 ? 's' : ''}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditSubteam(team.id, subteam.id)}
                                  disabled={!isAdmin}
                                  title={!isAdmin ? 'Only admins can edit sub-teams' : 'Edit sub-team'}
                                >
                                  <Edit2 className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteConfirm({ 
                                    type: 'subteam', 
                                    id: subteam.id, 
                                    teamId: team.id 
                                  })}
                                  disabled={!isAdmin}
                                  title={!isAdmin ? 'Only admins can delete sub-teams' : 'Delete sub-team'}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            </div>
                            
                            {/* Members */}
                            {subteam.memberIds.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {subteam.memberIds.map((memberId) => {
                                  const collaborator = getCollaborator(memberId);
                                  return collaborator ? (
                                    <Badge key={memberId} variant="outline" className="text-xs">
                                      {collaborator.name}
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            </Card>
          ))}
        </div>
      )}

      {/* Create Team Dialog */}
      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Team</DialogTitle>
            <DialogDescription>
              Create a new team and organize it by vertical
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="team-name">Team Name</Label>
              <Input
                id="team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Design Team, Marketing Team"
              />
            </div>
            <div>
              <Label htmlFor="team-vertical">Vertical</Label>
              <Select value={teamVertical} onValueChange={setTeamVertical}>
                <SelectTrigger id="team-vertical">
                  <SelectValue placeholder="Select vertical" />
                </SelectTrigger>
                <SelectContent>
                  {verticals.map((vertical) => (
                    <SelectItem key={vertical} value={vertical}>
                      {vertical}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateTeamOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateTeam}>Create Team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Dialog */}
      <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Team</DialogTitle>
            <DialogDescription>
              Update team name and vertical
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-team-name">Team Name</Label>
              <Input
                id="edit-team-name"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g., Design Team, Marketing Team"
              />
            </div>
            <div>
              <Label htmlFor="edit-team-vertical">Vertical</Label>
              <Select value={teamVertical} onValueChange={setTeamVertical}>
                <SelectTrigger id="edit-team-vertical">
                  <SelectValue placeholder="Select vertical" />
                </SelectTrigger>
                <SelectContent>
                  {verticals.map((vertical) => (
                    <SelectItem key={vertical} value={vertical}>
                      {vertical}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTeamOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTeam}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Subteam Dialog */}
      <Dialog open={isCreateSubteamOpen} onOpenChange={setIsCreateSubteamOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Sub-team</DialogTitle>
            <DialogDescription>
              Add a sub-team and assign members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="subteam-name">Sub-team Name</Label>
              <Input
                id="subteam-name"
                value={subteamName}
                onChange={(e) => setSubteamName(e.target.value)}
                placeholder="e.g., UI Designers, Content Writers"
              />
            </div>
            <div>
              <Label>Members (Optional)</Label>
              <ScrollArea className="h-[200px] border border-border rounded-md p-3">
                <div className="space-y-2">
                  {collaborators.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No collaborators available
                    </p>
                  ) : (
                    collaborators.map((collab) => (
                      <div key={collab.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`member-${collab.id}`}
                          checked={subteamMembers.includes(collab.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSubteamMembers([...subteamMembers, collab.id]);
                            } else {
                              setSubteamMembers(subteamMembers.filter(id => id !== collab.id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`member-${collab.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {collab.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateSubteamOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSubteam}>Create Sub-team</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Subteam Dialog */}
      <Dialog open={isEditSubteamOpen} onOpenChange={setIsEditSubteamOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Sub-team</DialogTitle>
            <DialogDescription>
              Update sub-team name and members
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-subteam-name">Sub-team Name</Label>
              <Input
                id="edit-subteam-name"
                value={subteamName}
                onChange={(e) => setSubteamName(e.target.value)}
                placeholder="e.g., UI Designers, Content Writers"
              />
            </div>
            <div>
              <Label>Members</Label>
              <ScrollArea className="h-[200px] border border-border rounded-md p-3">
                <div className="space-y-2">
                  {collaborators.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No collaborators available
                    </p>
                  ) : (
                    collaborators.map((collab) => (
                      <div key={collab.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-member-${collab.id}`}
                          checked={subteamMembers.includes(collab.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSubteamMembers([...subteamMembers, collab.id]);
                            } else {
                              setSubteamMembers(subteamMembers.filter(id => id !== collab.id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`edit-member-${collab.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {collab.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditSubteamOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditSubteam}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Team Members Dialog */}
      <Dialog open={isEditTeamMembersOpen} onOpenChange={setIsEditTeamMembersOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Team Members</DialogTitle>
            <DialogDescription>
              Assign collaborators to this team
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Select Members</Label>
              <ScrollArea className="h-[200px] border border-border rounded-md p-3 mt-2">
                <div className="space-y-2">
                  {collaborators.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No collaborators available
                    </p>
                  ) : (
                    collaborators.map((collab) => (
                      <div key={collab.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`team-member-${collab.id}`}
                          checked={teamMembers.includes(collab.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setTeamMembers([...teamMembers, collab.id]);
                            } else {
                              setTeamMembers(teamMembers.filter(id => id !== collab.id));
                            }
                          }}
                        />
                        <Label
                          htmlFor={`team-member-${collab.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {collab.name}
                        </Label>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditTeamMembersOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditTeamMembers}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirm !== null} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirm?.type === 'team' 
                ? 'This will permanently delete the team and all its sub-teams. This action cannot be undone.'
                : 'This will permanently delete the sub-team. This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteConfirm?.type === 'team') {
                  handleDeleteTeam(deleteConfirm.id);
                } else if (deleteConfirm?.type === 'subteam' && deleteConfirm.teamId) {
                  handleDeleteSubteam(deleteConfirm.teamId, deleteConfirm.id);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
