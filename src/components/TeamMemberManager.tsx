import { useState } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from './ui/command';
import { Users, X, ExternalLink, Building2, UserPlus, ChevronsUpDown, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Collaborator, ProjectFormData } from '../types/project';
import { useTeams } from '../hooks/useTeams';
import { getAllTeamMemberIds, getSubteamMemberIds, getCollaboratorsFromIds } from '../utils/teamUtils';

interface TeamMemberManagerProps {
  formData: ProjectFormData;
  collaborators: Collaborator[];
  onFormDataChange: (data: ProjectFormData) => void;
}

export function TeamMemberManager({
  formData,
  collaborators,
  onFormDataChange
}: TeamMemberManagerProps) {
  const [selectedCollaboratorId, setSelectedCollaboratorId] = useState('');
  const [open, setOpen] = useState(false);
  const { teams, loading: teamsLoading } = useTeams();

  // Helper function to update form data
  const updateFormData = (updates: Partial<ProjectFormData>) => {
    const newFormData = { ...formData, ...updates };
    onFormDataChange(newFormData);
  };

  // Add single collaborator from dropdown
  const addCollaborator = (collaboratorId: string) => {
    if (!collaboratorId) return;
    
    const collaborator = collaborators.find(c => c.id === collaboratorId);
    if (!collaborator) return;

    // Check if already added
    if (formData.collaborators.find(c => String(c.id) === String(collaborator.id))) {
      toast.warning(`${collaborator.nickname || collaborator.name} is already in the project`);
      setSelectedCollaboratorId('');
      return;
    }

    const projectCollaborator = {
      id: collaborator.id,
      name: collaborator.name,
      nickname: collaborator.nickname,
      role: collaborator.role,
      photo_url: collaborator.photo_url,
      profile_url: collaborator.profile_url
    };
    
    updateFormData({
      collaborators: [...formData.collaborators, projectCollaborator]
    });
    
    toast.success(`${collaborator.nickname || collaborator.name} added to project`);
    setSelectedCollaboratorId('');
  };

  // Add multiple collaborators from team or sub-team
  const addTeamMembers = (memberIds: string[], teamName: string) => {
    const collaboratorsToAdd = getCollaboratorsFromIds(
      memberIds, 
      collaborators.map(c => ({
        id: c.id,
        name: c.name,
        nickname: c.nickname,
        role: c.role,
        photo_url: c.photo_url,
        profile_url: c.profile_url
      }))
    );
    
    // Filter out collaborators already in the project
    const newCollaborators = collaboratorsToAdd.filter(
      c => !formData.collaborators.some(fc => String(fc.id) === String(c.id))
    );
    
    if (newCollaborators.length === 0) {
      toast.warning(`All members from ${teamName} are already in the project`);
      setSelectedCollaboratorId('');
      return;
    }
    
    updateFormData({
      collaborators: [...formData.collaborators, ...newCollaborators]
    });
    
    const skippedCount = collaboratorsToAdd.length - newCollaborators.length;
    const message = skippedCount > 0
      ? `Added ${newCollaborators.length} from ${teamName} (${skippedCount} already in project)`
      : `Added ${newCollaborators.length} from ${teamName}`;
    
    toast.success(message);
    setSelectedCollaboratorId('');
  };

  // Remove collaborator from project
  const removeCollaborator = (collaboratorId: string) => {
    const collaboratorToRemove = formData.collaborators.find(c => String(c.id) === String(collaboratorId));
    
    updateFormData({
      collaborators: formData.collaborators.filter(c => String(c.id) !== String(collaboratorId))
    });
    
    if (collaboratorToRemove) {
      toast.success(`${collaboratorToRemove.nickname || collaboratorToRemove.name} removed from project`);
    }
  };

  // Get available collaborators (not yet added to project)
  const availableCollaborators = collaborators.filter(
    collaborator => !formData.collaborators.some(fc => String(fc.id) === String(collaborator.id))
  );

  const openProfileLink = (url: string | undefined) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="h-4 w-4 text-muted-foreground" />
        <h3 className="font-medium text-sm">Collaborators</h3>
      </div>
        
        {/* Current Collaborators */}
        {formData.collaborators.length > 0 && (
          <div className="space-y-2">
            {formData.collaborators.map((collaborator) => (
              <div 
                key={collaborator.id} 
                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => openProfileLink(collaborator.profile_url)}
                    disabled={!collaborator.profile_url}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
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
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-medium text-primary">
                          {collaborator.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      type="button"
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
                          <ExternalLink className="h-3 w-3 opacity-50 flex-shrink-0" />
                        )}
                        {collaborator.nickname && (
                          <span className="text-xs text-muted-foreground ml-1">({collaborator.name})</span>
                        )}
                      </div>
                    </button>
                    <div className="text-xs text-muted-foreground">{collaborator.role}</div>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeCollaborator(collaborator.id)}
                  className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {/* Add Collaborator Dropdown */}
        <div className="border rounded-lg p-3 bg-muted/20">
          <div className="text-xs font-medium text-muted-foreground mb-3 flex items-center gap-1.5">
            <UserPlus className="h-3.5 w-3.5" />
            Add Collaborator
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="h-10 w-full justify-between bg-background"
              >
                Select collaborator or team to add
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search collaborators or teams..." />
                <CommandEmpty>No collaborators or teams found.</CommandEmpty>
                <CommandList>
                  {/* Teams & Sub-teams Section */}
                  {!teamsLoading && teams.length > 0 && (
                    <>
                      <CommandGroup heading="Quick Add Team/Sub-team">
                        {teams.map((team) => {
                          const teamMemberIds = getAllTeamMemberIds(team);
                          const teamHasMembers = teamMemberIds.length > 0;
                          
                          return (
                            <div key={team.id}>
                              {/* Team-level option */}
                              {teamHasMembers && (
                                <CommandItem 
                                  value={`team:${team.id} ${team.name}`}
                                  onSelect={() => {
                                    const memberIds = getAllTeamMemberIds(team);
                                    addTeamMembers(memberIds, team.name);
                                    setOpen(false);
                                  }}
                                >
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span className="font-medium">{team.name}</span>
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                                      {teamMemberIds.length} {teamMemberIds.length === 1 ? 'member' : 'members'}
                                    </Badge>
                                  </div>
                                </CommandItem>
                              )}
                              
                              {/* Sub-teams */}
                              {team.subteams.map((subteam) => {
                                const subteamHasMembers = subteam.memberIds.length > 0;
                                
                                return subteamHasMembers ? (
                                  <CommandItem 
                                    key={subteam.id} 
                                    value={`subteam:${team.id}::${subteam.id} ${team.name} ${subteam.name}`}
                                    className="pl-8"
                                    onSelect={() => {
                                      const memberIds = getSubteamMemberIds(team, subteam.id);
                                      addTeamMembers(memberIds, `${team.name} - ${subteam.name}`);
                                      setOpen(false);
                                    }}
                                  >
                                    <div className="flex items-center gap-2">
                                      <Users className="h-3.5 w-3.5" />
                                      <span className="font-medium">{subteam.name}</span>
                                      <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                                        {subteam.memberIds.length}
                                      </Badge>
                                    </div>
                                  </CommandItem>
                                ) : null;
                              })}
                            </div>
                          );
                        })}
                      </CommandGroup>
                      <CommandSeparator />
                    </>
                  )}
                  
                  {/* Individual Collaborators */}
                  {availableCollaborators.length > 0 || collaborators.length === 0 ? (
                    <CommandGroup heading="Individual Collaborators">
                      {availableCollaborators.length > 0 ? (
                        availableCollaborators.map(collaborator => (
                          <CommandItem 
                            key={collaborator.id} 
                            value={`${collaborator.id} ${collaborator.nickname || collaborator.name} ${collaborator.name} ${collaborator.role}`}
                            onSelect={() => {
                              addCollaborator(collaborator.id);
                              setOpen(false);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {collaborator.nickname || collaborator.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {collaborator.role}
                              </span>
                            </div>
                          </CommandItem>
                        ))
                      ) : (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                          {collaborators.length === 0 
                            ? 'No collaborators available - add in Settings' 
                            : 'All collaborators already added'
                          }
                        </div>
                      )}
                    </CommandGroup>
                  ) : null}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          {collaborators.length === 0 && (
            <p className="text-xs text-muted-foreground mt-2">
              Go to Settings to add collaborators first
            </p>
          )}
        </div>
    </div>
  );
}