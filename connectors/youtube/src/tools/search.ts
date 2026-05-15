import { defineTool } from '@cloud-connectors/core';
import { z } from 'zod';
import { youtubeGet } from '../client.js';

interface SearchResponse {
  items: {
    id: { videoId?: string; channelId?: string; kind: string };
    snippet: {
      title: string;
      description: string;
      channelTitle: string;
      publishedAt: string;
      thumbnails?: { default?: { url: string }; medium?: { url: string } };
    };
  }[];
  nextPageToken?: string;
}

export const searchVideos = defineTool({
  name: 'youtube_search',
  description:
    'Search YouTube for videos matching a query. Returns video id, title, channel, published date, and thumbnail URL.',
  inputSchema: z.object({
    query: z.string().min(1).describe('Search query'),
    maxResults: z.number().int().min(1).max(50).default(10),
    pageToken: z.string().optional(),
  }),
  handler: async ({ query, maxResults, pageToken }, { credential, signal }) => {
    const data = await youtubeGet<SearchResponse>(
      '/search',
      {
        part: 'snippet',
        q: query,
        maxResults,
        type: 'video',
        pageToken,
      },
      { apiKey: credential, signal },
    );
    return {
      results: data.items
        .filter((i) => i.id.videoId)
        .map((i) => ({
          videoId: i.id.videoId!,
          title: i.snippet.title,
          description: i.snippet.description,
          channel: i.snippet.channelTitle,
          publishedAt: i.snippet.publishedAt,
          thumbnailUrl: i.snippet.thumbnails?.medium?.url ?? i.snippet.thumbnails?.default?.url,
        })),
      nextPageToken: data.nextPageToken,
    };
  },
});
