import { Team, Subteam } from '../types/team';
import { ProjectCollaborator } from '../types/project';

/**
 * Get all unique member IDs from a team (including team-level members and all subteam members)
 */
export function getAllTeamMemberIds(team: Team): string[] {
  const teamLevelMembers = team.memberIds || [];
  const subteamMembers = team.subteams.flatMap(st => st.memberIds || []);
  
  // Return unique member IDs
  return [...new Set([...teamLevelMembers, ...subteamMembers])];
}

/**
 * Get all unique member IDs from a specific subteam
 */
export function getSubteamMemberIds(team: Team, subteamId: string): string[] {
  const subteam = team.subteams.find(st => st.id === subteamId);
  return subteam?.memberIds || [];
}

/**
 * Convert member IDs to ProjectCollaborators by looking them up in the global collaborators list
 */
export function getCollaboratorsFromIds(
  memberIds: string[], 
  globalCollaborators: ProjectCollaborator[]
): ProjectCollaborator[] {
  return memberIds
    .map(id => globalCollaborators.find(c => c.id === id))
    .filter((c): c is ProjectCollaborator => c !== undefined);
}

/**
 * Get team-level member IDs only (excluding subteam members)
 */
export function getTeamLevelMemberIds(team: Team): string[] {
  return team.memberIds || [];
}

/**
 * Check if a team or subteam has any members
 */
export function hasMembers(team: Team, subteamId?: string): boolean {
  if (subteamId) {
    return getSubteamMemberIds(team, subteamId).length > 0;
  }
  return getAllTeamMemberIds(team).length > 0;
}
