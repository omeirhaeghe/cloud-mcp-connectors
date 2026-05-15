import { defineTool, McpError } from '@cloud-connectors/core';
import { z } from 'zod';
import { youtubeGet } from '../client.js';

interface ChannelResponse {
  items: { contentDetails: { relatedPlaylists: { uploads: string } } }[];
}

interface PlaylistItemsResponse {
  items: {
    snippet: {
      title: string;
      publishedAt: string;
      resourceId: { videoId: string };
    };
  }[];
  nextPageToken?: string;
}

export const listChannelVideos = defineTool({
  name: 'youtube_list_channel_videos',
  description: "List a YouTube channel's most recent uploads. Provide either channelId or handle.",
  inputSchema: z
    .object({
      channelId: z.string().min(1).optional(),
      handle: z
        .string()
        .min(1)
        .optional()
        .describe("Channel handle without the @, e.g. 'mkbhd'"),
      maxResults: z.number().int().min(1).max(50).default(10),
      pageToken: z.string().optional(),
    })
    .refine((v) => v.channelId || v.handle, {
      message: 'one of channelId or handle is required',
    }),
  handler: async ({ channelId, handle, maxResults, pageToken }, { credential, signal }) => {
    const channelLookup = await youtubeGet<ChannelResponse>(
      '/channels',
      {
        part: 'contentDetails',
        id: channelId,
        forHandle: handle,
      },
      { apiKey: credential, signal },
    );
    const uploadsPlaylistId = channelLookup.items[0]?.contentDetails.relatedPlaylists.uploads;
    if (!uploadsPlaylistId) {
      throw new McpError('not_found', 'channel not found or has no uploads playlist');
    }
    const items = await youtubeGet<PlaylistItemsResponse>(
      '/playlistItems',
      {
        part: 'snippet',
        playlistId: uploadsPlaylistId,
        maxResults,
        pageToken,
      },
      { apiKey: credential, signal },
    );
    return {
      videos: items.items.map((i) => ({
        videoId: i.snippet.resourceId.videoId,
        title: i.snippet.title,
        publishedAt: i.snippet.publishedAt,
      })),
      nextPageToken: items.nextPageToken,
    };
  },
});
