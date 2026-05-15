import { defineTool, McpError } from '@cloud-connectors/core';
import { z } from 'zod';
import { youtubeGet } from '../client.js';

interface VideoResponse {
  items: {
    id: string;
    snippet: {
      title: string;
      description: string;
      channelId: string;
      channelTitle: string;
      publishedAt: string;
      tags?: string[];
    };
    statistics?: {
      viewCount?: string;
      likeCount?: string;
      commentCount?: string;
    };
    contentDetails?: { duration: string };
  }[];
}

export const getVideo = defineTool({
  name: 'youtube_get_video',
  description: 'Fetch full metadata and statistics for a single YouTube video by id.',
  inputSchema: z.object({
    videoId: z.string().min(1).describe('YouTube video id, e.g. dQw4w9WgXcQ'),
  }),
  handler: async ({ videoId }, { credential, signal }) => {
    const data = await youtubeGet<VideoResponse>(
      '/videos',
      { part: 'snippet,statistics,contentDetails', id: videoId },
      { apiKey: credential, signal },
    );
    const v = data.items[0];
    if (!v) throw new McpError('not_found', `video not found: ${videoId}`);
    return {
      videoId: v.id,
      title: v.snippet.title,
      description: v.snippet.description,
      channelId: v.snippet.channelId,
      channelTitle: v.snippet.channelTitle,
      publishedAt: v.snippet.publishedAt,
      tags: v.snippet.tags ?? [],
      duration: v.contentDetails?.duration,
      stats: {
        views: v.statistics?.viewCount ? Number(v.statistics.viewCount) : undefined,
        likes: v.statistics?.likeCount ? Number(v.statistics.likeCount) : undefined,
        comments: v.statistics?.commentCount ? Number(v.statistics.commentCount) : undefined,
      },
    };
  },
});
