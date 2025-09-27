import type { Movie } from '../types';

// The MOCK_VOD_METADATA is serialized and included in the worker script.
const MOCK_VOD_METADATA: { [key: string]: Omit<Movie, 'id' | 'name' | 'poster' | 'group' | 'url'> } = {
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

/**
 * This string contains the full code for our M3U parsing web worker.
 * It's self-contained and will be loaded via a Blob URL.
 */
export const m3uParserWorkerCode = `
// --- Worker Scope ---

const promiseAny = (promises) => {
    return new Promise((resolve, reject) => {
        if (!promises || promises.length === 0) {
            return reject(new AggregateError([], 'No promises were provided.'));
        }
        let pending = promises.length;
        const errors = new Array(promises.length);
        promises.forEach((promise, i) => {
            Promise.resolve(promise).then(resolve).catch(err => {
                errors[i] = err;
                pending--;
                if (pending === 0) {
                    reject(new AggregateError(errors, 'All promises were rejected.'));
                }
            });
        });
    });
};

const PROXY_URL_BUILDERS = [
    (url) => \`https://api.allorigins.win/raw?url=\${encodeURIComponent(url)}\`,
    (url) => \`https://cors.sh/\${url}\`,
    (url) => \`https://api.codetabs.com/v1/proxy?quest=\${encodeURIComponent(url)}\`,
];

const MOCK_VOD_METADATA = ${JSON.stringify(MOCK_VOD_METADATA)};
const MOVIE_KEYWORDS = ['vod', 'filmes', 'movies', 'lançamentos', 'cinema', 'on demand', 'séries', 'series', 'documentários'];
const SERIES_EPISODE_REGEX = /[Ss](\\d{1,2})[EeXx](\\d{1,2})/;
const CHANNEL_KEYWORDS_REGEX = /(\\s24h|\\sSD|\\sHD|\\sFULL\\sHD|\\s4K)/i;
const MOVIE_YEAR_REGEX = /\\((\\d{4})\\)/;
const VOD_EXTENSIONS = ['.mp4', '.mkv', '.avi'];


// Function to create a sanitized ID from a name
const createIdFromName = (name) => {
    return name.toLowerCase().replace(/\\s+/g, '-').replace(/[^a-z0-9-]/g, '');
};

const parseM3UChunk = (chunk, partialLine, seriesMap) => {
    const lines = (partialLine + chunk).split('\\n');
    const newPartialLine = lines.pop() || '';
    const channels = [];
    const movies = [];

    for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('#EXTINF:')) {
            const infoLine = lines[i];
            const url = lines[i + 1] ? lines[i + 1].trim() : '';
            if (!url) continue;

            const tvgIdMatch = infoLine.match(/tvg-id="([^"]*)"/);
            const tvgNameMatch = infoLine.match(/tvg-name="([^"]*)"/);
            const tvgLogoMatch = infoLine.match(/tvg-logo="([^"]*)"/);
            const groupTitleMatch = infoLine.match(/group-title="([^"]*)"/);
            const nameMatch = infoLine.match(/,(.+)$/);

            const id = tvgIdMatch ? tvgIdMatch[1] : \`item-\${Math.random().toString(36).substr(2, 9)}\`;
            const rawName = tvgNameMatch ? tvgNameMatch[1] : (nameMatch ? nameMatch[1].trim() : 'Unknown');
            const logo = tvgLogoMatch ? tvgLogoMatch[1] : 'https://picsum.photos/200';
            const rawGroup = groupTitleMatch ? groupTitleMatch[1] : 'General';
            const group = rawGroup.split('|').pop().trim();

            const episodeMatch = rawName.match(SERIES_EPISODE_REGEX);
            const channelMatch = CHANNEL_KEYWORDS_REGEX.test(rawName);
            const urlLower = url.toLowerCase();
            const groupLower = rawGroup.toLowerCase();
            
            if (episodeMatch) {
                // Priority 1: It's a series episode
                const season = parseInt(episodeMatch[1], 10);
                const episode = parseInt(episodeMatch[2], 10);
                const seriesName = rawName.replace(SERIES_EPISODE_REGEX, '').replace(/\\|/g, ' ').trim();
                const seriesId = createIdFromName(seriesName);
                
                if (!seriesMap.has(seriesId)) {
                    const metadata = MOCK_VOD_METADATA[id] || { description: 'No description available.', year: 2020, genre: ['Unknown'] };
                    seriesMap.set(seriesId, {
                        id: seriesId,
                        name: seriesName,
                        poster: logo,
                        group: group,
                        ...metadata,
                        seasons: {}
                    });
                }

                const series = seriesMap.get(seriesId);
                if (!series.seasons[season]) {
                    series.seasons[season] = [];
                }
                
                const episodeExists = series.seasons[season].some(e => e.episode === episode);
                if(!episodeExists) {
                   series.seasons[season].push({
                      id: \`\${seriesId}-s\${season}e\${episode}\`,
                      title: rawName,
                      url,
                      season,
                      episode
                   });
                   series.seasons[season].sort((a,b) => a.episode - b.episode);
                }
            } else if (channelMatch) {
                // Priority 2: It's a live channel based on keywords (24h, SD, HD, etc.)
                channels.push({ id, name: rawName, logo, group, url });
            } else if (
                VOD_EXTENSIONS.some(ext => urlLower.endsWith(ext)) ||
                MOVIE_KEYWORDS.some(keyword => groupLower.includes(keyword)) ||
                MOVIE_YEAR_REGEX.test(rawName)
            ) {
                // Priority 3: It's a movie/VOD
                const metadata = MOCK_VOD_METADATA[id] || { description: 'No description available.', year: 2020, genre: ['Unknown'] };
                movies.push({ id, name: rawName, poster: logo, group, url, ...metadata });
            } else {
                // Default: It's a live channel
                channels.push({ id, name: rawName, logo, group, url });
            }
            i++; // Skip URL line
        }
    }
    return { channels, movies, newPartialLine };
};

self.onmessage = async (e) => {
    const { url } = e.data;
    if (!url) {
        self.postMessage({ type: 'error', error: 'No URL provided' });
        return;
    }

    const fetchWithTimeout = (fetchUrl, timeout = 15000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        return fetch(fetchUrl, { signal: controller.signal }).finally(() => clearTimeout(timeoutId));
    };
    
    const fetchPromises = PROXY_URL_BUILDERS.map(builder =>
        fetchWithTimeout(builder(url))
        .then(response => {
          if (!response.ok || !response.body) {
            throw new Error(\`Proxy error: \${response.status}\`);
          }
          return response.body;
        })
    );

    try {
        const stream = await promiseAny(fetchPromises);
        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let partialLine = '';
        let totalParsed = 0;
        const seriesMap = new Map();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const textChunk = decoder.decode(value, { stream: true });
            const { channels, movies, newPartialLine } = parseM3UChunk(textChunk, partialLine, seriesMap);
            partialLine = newPartialLine;
            
            if (channels.length > 0 || movies.length > 0) {
                totalParsed += channels.length + movies.length;
                self.postMessage({ type: 'data', channels, movies });
                self.postMessage({ type: 'progress', parsedCount: totalParsed });
            }
        }
        
        const { channels, movies } = parseM3UChunk('', partialLine, seriesMap);
        if (channels.length > 0 || movies.length > 0) {
             totalParsed += channels.length + movies.length;
             self.postMessage({ type: 'data', channels, movies });
             self.postMessage({ type: 'progress', parsedCount: totalParsed });
        }
        
        const series = Array.from(seriesMap.values());
        totalParsed += series.reduce((acc, s) => acc + Object.values(s.seasons).flat().length, 0);

        self.postMessage({ type: 'series_data', series });
        self.postMessage({ type: 'done', finalCount: totalParsed });

    } catch (err) {
        self.postMessage({ type: 'error', error: err.message || 'All proxies failed to fetch the M3U playlist.' });
    }
};
`
