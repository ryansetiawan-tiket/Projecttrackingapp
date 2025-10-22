/**
 * Utility functions for Slack integration
 */

/**
 * Extracts Slack user ID from profile URL
 * Example: https://tiket.slack.com/team/UJ1RCJSKV -> UJ1RCJSKV
 */
export function extractSlackUserId(profileUrl: string): string | null {
  if (!profileUrl) return null;
  
  const match = profileUrl.match(/\/team\/([A-Z0-9]+)/i);
  return match ? match[1] : null;
}

/**
 * Converts Slack profile URL to direct message URL
 * This will open a DM with the user instead of their profile
 * 
 * @param profileUrl - The Slack profile URL (e.g., https://tiket.slack.com/team/UJ1RCJSKV)
 * @returns Direct message URL or null if invalid
 */
export function getSlackDirectMessageUrl(profileUrl: string): string | null {
  const userId = extractSlackUserId(profileUrl);
  if (!userId) return null;
  
  // Extract the workspace domain from the profile URL
  const domainMatch = profileUrl.match(/https?:\/\/([^/]+)/);
  const domain = domainMatch ? domainMatch[1] : 'tiket.slack.com';
  
  // Use app_redirect which works universally for web and desktop app
  return `https://${domain}/app_redirect?channel=${userId}`;
}

/**
 * Opens a Slack direct message with the user
 * Falls back to opening profile if DM link cannot be generated
 * 
 * @param profileUrl - The Slack profile URL
 */
export function openSlackDirectMessage(profileUrl: string): void {
  const dmUrl = getSlackDirectMessageUrl(profileUrl);
  
  if (dmUrl) {
    window.open(dmUrl, '_blank', 'noopener,noreferrer');
  } else if (profileUrl) {
    // Fallback to opening profile if we can't generate DM link
    window.open(profileUrl, '_blank', 'noopener,noreferrer');
  }
}
