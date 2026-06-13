export type CatalogAuthSpec =
  | {
      type: 'apiKey';
      label: string;
      placeholder?: string;
      docsUrl?: string;
    }
  | {
      type: 'oauth2';
      provider: string;
      scopes: string[];
    };

export interface CatalogEntry {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: 'comms' | 'productivity' | 'developer' | 'media' | 'commerce' | 'other';
  status: 'available' | 'beta' | 'planned';
  homepage?: string;
  iconKey: string;
  auth: CatalogAuthSpec;
  toolCount: number;
}

export const CATALOG: readonly CatalogEntry[] = [
  {
    id: 'youtube',
    name: 'YouTube',
    tagline: 'Search videos and read channel data',
    description:
      'Read-only access to the YouTube Data API: search videos, fetch video metadata + statistics, list a channel’s recent uploads.',
    category: 'media',
    status: 'available',
    homepage: 'https://developers.google.com/youtube/v3',
    iconKey: 'youtube',
    auth: {
      type: 'apiKey',
      label: 'YouTube Data API key',
      placeholder: 'AIza…',
      docsUrl: 'https://developers.google.com/youtube/registering_an_application',
    },
    toolCount: 3,
  },
  {
    id: 'xquik',
    name: 'Xquik',
    tagline: 'Search X/Twitter data',
    description:
      'Read-only access to Xquik for X/Twitter data workflows: search tweets, fetch tweet details, search users, and fetch profiles.',
    category: 'media',
    status: 'available',
    homepage: 'https://docs.xquik.com/api-reference/overview',
    iconKey: 'xquik',
    auth: {
      type: 'apiKey',
      label: 'Xquik API key',
      placeholder: 'xq_...',
      docsUrl: 'https://docs.xquik.com/api-reference/overview',
    },
    toolCount: 4,
  },
  {
    id: 'gmail',
    name: 'Gmail',
    tagline: 'Read, search, and send mail',
    description: 'OAuth-based access to a user’s Gmail account. Coming in Milestone 2.',
    category: 'comms',
    status: 'planned',
    homepage: 'https://developers.google.com/gmail/api',
    iconKey: 'gmail',
    auth: {
      type: 'oauth2',
      provider: 'google',
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
      ],
    },
    toolCount: 0,
  },
  {
    id: 'microsoft-graph',
    name: 'Microsoft Graph',
    tagline: 'Outlook, Calendar, OneDrive, Teams',
    description:
      'Unified Microsoft Graph connector covering Outlook mail, Calendar, OneDrive, and Teams. Coming in Milestone 3.',
    category: 'productivity',
    status: 'planned',
    homepage: 'https://learn.microsoft.com/graph',
    iconKey: 'microsoft',
    auth: {
      type: 'oauth2',
      provider: 'microsoft',
      scopes: ['Mail.ReadWrite', 'Calendars.ReadWrite', 'Files.ReadWrite'],
    },
    toolCount: 0,
  },
  {
    id: 'github',
    name: 'GitHub',
    tagline: 'Repos, issues, PRs',
    description:
      'Personal-access-token or OAuth access to GitHub repos, issues, and pull requests. Coming in Milestone 4.',
    category: 'developer',
    status: 'planned',
    homepage: 'https://docs.github.com/rest',
    iconKey: 'github',
    auth: {
      type: 'apiKey',
      label: 'GitHub personal access token',
      placeholder: 'ghp_…',
      docsUrl: 'https://docs.github.com/en/authentication',
    },
    toolCount: 0,
  },
];

export function findEntry(id: string): CatalogEntry | undefined {
  return CATALOG.find((e) => e.id === id);
}

export function availableEntries(): CatalogEntry[] {
  return CATALOG.filter((e) => e.status === 'available');
}
