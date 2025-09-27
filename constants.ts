import type { EPGProgram, Movie } from "./types";

export const MOCK_M3U_DATA = `
#EXTM3U
#EXTINF:-1 tvg-id="channel.sports.1" tvg-name="Sports TV 1" tvg-logo="https://picsum.photos/seed/sport1/200" group-title="Sports",Sports TV 1
https://cdn.bitmovin.com/content/assets/streams-sample-video/sintel/playlist.m3u8
#EXTINF:-1 tvg-id="channel.sports.2" tvg-name="Sports TV 2 HD" tvg-logo="https://picsum.photos/seed/sport2/200" group-title="Sports",Sports TV 2 HD
http://sample.vodobox.net/skate_phantom_flex_4k/skate_phantom_flex_4k.m3u8
#EXTINF:-1 tvg-id="channel.news.1" tvg-name="Global News" tvg-logo="https://picsum.photos/seed/news1/200" group-title="News",Global News
https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8

#EXTINF:-1 tvg-id="vod.action.1" tvg-name="Cosmic Fury" tvg-logo="https://picsum.photos/seed/vod1/400/600" group-title="VOD | Action",Cosmic Fury
http://qthttp.apple.com.edgesuite.net/1010qwoeiuryfg/sl.m3u8
#EXTINF:-1 tvg-id="vod.comedy.1" tvg-name="The Big Laugh" tvg-logo="https://picsum.photos/seed/vod2/400/600" group-title="VOD | Comedy",The Big Laugh
http://playertest.longtailvideo.com/adaptive/oceans/oceans.m3u8
#EXTINF:-1 tvg-id="vod.scifi.1" tvg-name="Galaxy Runners" tvg-logo="https://picsum.photos/seed/vod3/400/600" group-title="VOD | Sci-Fi",Galaxy Runners
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8

#EXTINF:-1 tvg-id="series.action.1" tvg-name="The Mandalorian S01E01: Chapter 1" tvg-logo="https://picsum.photos/seed/mando/400/600" group-title="VOD | Séries",The Mandalorian S01E01: Chapter 1
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
#EXTINF:-1 tvg-id="series.action.1" tvg-name="The Mandalorian S01E02: Chapter 2" tvg-logo="https://picsum.photos/seed/mando/400/600" group-title="VOD | Séries",The Mandalorian S01E02: Chapter 2
https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8
`;

export const MOCK_VOD_METADATA: { [key: string]: Omit<Movie, 'id' | 'name' | 'poster' | 'group' | 'url'> } = {
  "vod.action.1": {
    description: "In a galaxy on the brink of collapse, a lone pilot must deliver a package that could save everyone. But the clock is ticking.",
    year: 2023,
    genre: ["Action", "Sci-Fi", "Adventure"]
  },
  "vod.comedy.1": {
    description: "Two friends accidentally switch briefcases with mobsters, leading to a hilarious cross-country chase.",
    year: 2022,
    genre: ["Comedy"]
  },
  "vod.scifi.1": {
    description: "A team of explorers travels through a wormhole in search of a new home for humanity, but they find something they never expected.",
    year: 2024,
    genre: ["Sci-Fi", "Drama", "Thriller"]
  },
  "series.action.1": {
    description: "A lone bounty hunter in the outer reaches of the galaxy, far from the authority of the New Republic.",
    year: 2019,
    genre: ["Action", "Adventure", "Sci-Fi"]
  }
};

export const MOCK_EPG_DATA: { [key: string]: EPGProgram[] } = {
    "channel.sports.1": [
        { title: "Live Football: Team A vs Team B", description: "The championship final, live from the national stadium.", start: "18:00", end: "20:00" },
        { title: "Sports Highlights", description: "A roundup of today's sporting action.", start: "20:00", end: "21:00" },
        { title: "The Finish Line", description: "In-depth analysis and interviews.", start: "21:00", end: "22:00" }
    ],
};