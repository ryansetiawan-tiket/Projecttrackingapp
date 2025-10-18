/**
 * Team Management Types
 * Defines data structures for team organization with sub-teams and member assignments
 */

export interface Subteam {
  id: string;
  name: string;
  memberIds: string[]; // Array of collaborator IDs
}

export interface Team {
  id: string;
  name: string;
  vertical: string; // e.g., "LOYALTY", "TRANSPORT", etc.
  memberIds: string[]; // Team-level members (not in any subteam)
  subteams: Subteam[];
  createdAt: string;
  updatedAt: string;
}

export interface TeamFormData {
  name: string;
  vertical: string;
}

export interface SubteamFormData {
  name: string;
  memberIds: string[];
}
