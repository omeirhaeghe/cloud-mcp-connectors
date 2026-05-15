import { defineConnector } from '@cloud-connectors/core';
import { getVideo } from './tools/get-video.js';
import { listChannelVideos } from './tools/list-channel-videos.js';
import { searchVideos } from './tools/search.js';

const youtubeConnector = defineConnector({
  id: 'youtube',
  name: 'YouTube',
  description:
    'Read-only YouTube Data API connector: search videos, fetch metadata + statistics, list channel uploads.',
  auth: { type: 'apiKey', envVar: 'YOUTUBE_API_KEY', label: 'YouTube Data API key' },
  homepage: 'https://developers.google.com/youtube/v3',
  tools: [searchVideos, getVideo, listChannelVideos],
});

export default youtubeConnector;
export { youtubeConnector };
export { searchVideos, getVideo, listChannelVideos };
