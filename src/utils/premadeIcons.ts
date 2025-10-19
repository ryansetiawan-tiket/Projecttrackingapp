export interface PremadeIcon {
  id: string;
  name: string;
  svg: string;
  category: string;
}

export const premadeIcons: PremadeIcon[] = [
  {
    id: 'figma',
    name: 'Figma',
    category: 'Design',
    svg: `<svg viewBox="0 0 38 57" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
      <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
      <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
      <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
      <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
    </svg>`
  },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    category: 'Productivity',
    svg: `<svg viewBox="0 0 87.3 116" xmlns="http://www.w3.org/2000/svg">
      <path d="m48.5 111.8h32.6c3.4 0 6.2-2.8 6.2-6.2v-78.7l-22.6-22.6h-16.2z" fill="#0f9d58"/>
      <path d="m58.1 112.1v-84.6h29.2v78.2c0 3.6-2.9 6.4-6.4 6.4z" fill="#0c8045"/>
      <path d="m13.6 0c-3.4 0-6.2 2.8-6.2 6.2v103.6c0 3.4 2.8 6.2 6.2 6.2h34.9v-116z" fill="#16a765"/>
      <path d="m64.9 4.2v16.3c0 3.6 2.9 6.5 6.5 6.5h16.3z" fill="#87ceac"/>
      <path d="m22.3 47.6h42.7v52h-42.7z" fill="#f1f1f1"/>
      <path d="m30.6 56.5h8.7v8.7h-8.7z" fill="#0f9d58"/>
      <path d="m42 56.5h8.7v8.7h-8.7z" fill="#0f9d58"/>
      <path d="m53.4 56.5h8.7v8.7h-8.7z" fill="#0f9d58"/>
      <path d="m30.6 67.8h8.7v8.7h-8.7z" fill="#0f9d58"/>
      <path d="m42 67.8h8.7v8.7h-8.7z" fill="#0f9d58"/>
      <path d="m53.4 67.8h8.7v8.7h-8.7z" fill="#0f9d58"/>
      <path d="m30.6 79.2h8.7v8.7h-8.7z" fill="#0f9d58"/>
      <path d="m42 79.2h8.7v8.7h-8.7z" fill="#0f9d58"/>
      <path d="m53.4 79.2h8.7v8.7h-8.7z" fill="#0f9d58"/>
    </svg>`
  },
  {
    id: 'google-docs',
    name: 'Google Docs',
    category: 'Productivity',
    svg: `<svg viewBox="0 0 87.3 116" xmlns="http://www.w3.org/2000/svg">
      <path d="m48.5 111.8h32.6c3.4 0 6.2-2.8 6.2-6.2v-78.7l-22.6-22.6h-16.2z" fill="#4285f4"/>
      <path d="m58.1 112.1v-84.6h29.2v78.2c0 3.6-2.9 6.4-6.4 6.4z" fill="#3367d6"/>
      <path d="m13.6 0c-3.4 0-6.2 2.8-6.2 6.2v103.6c0 3.4 2.8 6.2 6.2 6.2h34.9v-116z" fill="#4285f4"/>
      <path d="m64.9 4.2v16.3c0 3.6 2.9 6.5 6.5 6.5h16.3z" fill="#a1c2fa"/>
      <path d="m25.5 53.8h36.3v3.6h-36.3z" fill="#f1f1f1"/>
      <path d="m25.5 62.7h36.3v3.6h-36.3z" fill="#f1f1f1"/>
      <path d="m25.5 71.6h36.3v3.6h-36.3z" fill="#f1f1f1"/>
      <path d="m25.5 80.5h22.6v3.6h-22.6z" fill="#f1f1f1"/>
    </svg>`
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'Storage',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 87.3 78">
      <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
      <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
      <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
      <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
      <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
      <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
    </svg>`
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Communication',
    svg: `<svg viewBox="0 0 124 124" xmlns="http://www.w3.org/2000/svg">
      <path d="m26.3 78.2c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h13.2zm6.6 0c0-7.3 5.9-13.2 13.2-13.2s13.2 5.9 13.2 13.2v33c0 7.3-5.9 13.2-13.2 13.2s-13.2-5.9-13.2-13.2z" fill="#e01e5a"/>
      <path d="m46.1 26.3c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2s13.2 5.9 13.2 13.2v13.2zm0 6.6c7.3 0 13.2 5.9 13.2 13.2s-5.9 13.2-13.2 13.2h-33c-7.3 0-13.2-5.9-13.2-13.2s5.9-13.2 13.2-13.2z" fill="#36c5f0"/>
      <path d="m97.7 46.1c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2s-5.9 13.2-13.2 13.2h-13.2zm-6.6 0c0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2v-33c0-7.3 5.9-13.2 13.2-13.2 7.3 0 13.2 5.9 13.2 13.2z" fill="#2eb67d"/>
      <path d="m77.9 97.7c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2-7.3 0-13.2-5.9-13.2-13.2v-13.2zm0-6.6c-7.3 0-13.2-5.9-13.2-13.2 0-7.3 5.9-13.2 13.2-13.2h33c7.3 0 13.2 5.9 13.2 13.2 0 7.3-5.9 13.2-13.2 13.2z" fill="#ecb22e"/>
    </svg>`
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Productivity',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <path d="m16.9 8.2 5.8-1.1c1-.2 1.2-.1 1.9.5l47.3 39.5c1 .8 1.3 1 1.3 1.9v36.8c0 1.4-.5 2.1-1.8 2.3l-9.8 1.5c-1.1.2-1.6-.1-1.6-1.2v-35l-21.7-18.1-21.9 18.1v35.1c0 .9-.1 1.5-1.1 1.7l-7.9 1.2c-1.4.2-2.1-.5-2.1-1.9v-43.6c0-1.2.2-2 1.3-2.2z" fill="currentColor"/>
    </svg>`
  },
  {
    id: 'trello',
    name: 'Trello',
    category: 'Project Management',
    svg: `<svg viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="25" fill="#0079bf"/>
      <rect x="26" y="26" width="90" height="140" rx="12" fill="#fff"/>
      <rect x="140" y="26" width="90" height="90" rx="12" fill="#fff"/>
    </svg>`
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Development',
    svg: `<svg viewBox="0 0 98 96" xmlns="http://www.w3.org/2000/svg">
      <path fill-rule="evenodd" clip-rule="evenodd" d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.235 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z" fill="currentColor"/>
    </svg>`
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'Storage',
    svg: `<svg viewBox="0 0 235 200" xmlns="http://www.w3.org/2000/svg">
      <polygon points="58.75,0 0,37.5 58.75,75 117.5,37.5" fill="#0061FF"/>
      <polygon points="117.5,37.5 176.25,75 235,37.5 176.25,0" fill="#0061FF"/>
      <polygon points="0,112.5 58.75,150 117.5,112.5 58.75,75" fill="#0061FF"/>
      <polygon points="176.25,75 117.5,112.5 176.25,150 235,112.5" fill="#0061FF"/>
      <polygon points="58.75,162.5 117.5,200 176.25,162.5 117.5,125" fill="#0061FF"/>
    </svg>`
  },
  {
    id: 'miro',
    name: 'Miro',
    category: 'Collaboration',
    svg: `<svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" fill="#FFD02F"/>
      <path d="M6 26h3.5L18 10.5 24.5 26H28L18 6z" fill="#050038"/>
      <path d="M18 10.5 24.5 26H28L18 6z" fill="#050038" opacity=".6"/>
      <path d="M12 18l6 8h3.5L18 10.5z" fill="#050038" opacity=".3"/>
    </svg>`
  },
  {
    id: 'asana',
    name: 'Asana',
    category: 'Project Management',
    svg: `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <circle cx="50" cy="23" r="20" fill="#F06A6A"/>
      <circle cx="23" cy="63" r="20" fill="#F06A6A"/>
      <circle cx="77" cy="63" r="20" fill="#F06A6A"/>
    </svg>`
  },
  {
    id: 'confluence',
    name: 'Confluence',
    category: 'Documentation',
    svg: `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
      <defs>
        <linearGradient id="confGrad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:#0052CC"/>
          <stop offset="100%" style="stop-color:#2684FF"/>
        </linearGradient>
        <linearGradient id="confGrad2" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" style="stop-color:#0052CC"/>
          <stop offset="100%" style="stop-color:#2684FF"/>
        </linearGradient>
      </defs>
      <path d="M3.6 17.8c-.3.5-.5.9-.7 1.3-.2.4 0 .9.4 1.2l2.8 1.9c.2.1.4.2.6.2.2 0 .4-.1.6-.2.3-.2.5-.4.6-.7.1-.3.4-1.1.9-2 1.3-2.4 4-3.2 6.4-1.9l4.5 2.5c.8.4 1.7.1 2.2-.6l2.5-4.6c.4-.8.1-1.7-.6-2.2l-4.5-2.5c-4.3-2.4-9.7-.9-12.1 3.4-.8 1.5-1.5 2.8-2.1 3.9-.3.5-.5.8-.7 1.3z" fill="url(#confGrad1)"/>
      <path d="M20.4 6.2c.3-.5.5-.9.7-1.3.2-.4 0-.9-.4-1.2L18 1.8c-.2-.1-.4-.2-.6-.2-.2 0-.4.1-.6.2-.3.2-.5.4-.6.7-.1.3-.4 1.1-.9 2-1.3 2.4-4 3.2-6.4 1.9L4.4 3.9c-.8-.4-1.7-.1-2.2.6L-.3 9.1c-.4.8-.1 1.7.6 2.2l4.5 2.5c4.3 2.4 9.7.9 12.1-3.4.8-1.5 1.5-2.8 2.1-3.9.3-.5.5-.8.7-1.3z" fill="url(#confGrad2)"/>
    </svg>`
  }
];

export const iconCategories = Array.from(new Set(premadeIcons.map(icon => icon.category)));

export function getIconsByCategory(category: string): PremadeIcon[] {
  return premadeIcons.filter(icon => icon.category === category);
}

export function getIconById(id: string): PremadeIcon | undefined {
  return premadeIcons.find(icon => icon.id === id);
}
