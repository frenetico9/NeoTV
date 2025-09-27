
import type { Channel, VODItem } from '../types';
import { MOCK_VOD_METADATA } from '../constants';

export const parseM3U = (m3uData: string): { channels: Channel[]; vodItems: VODItem[] } => {
  const channels: Channel[] = [];
  const vodItems: VODItem[] = [];
  const lines = m3uData.trim().split('\n');

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

      const id = tvgIdMatch ? tvgIdMatch[1] : `item-${Math.random()}`;
      const name = tvgNameMatch ? tvgNameMatch[1] : (nameMatch ? nameMatch[1].trim() : 'Unknown');
      const logo = tvgLogoMatch ? tvgLogoMatch[1] : 'https://picsum.photos/200';
      const group = groupTitleMatch ? groupTitleMatch[1] : 'General';

      if (group.toLowerCase().startsWith('vod')) {
        const metadata = MOCK_VOD_METADATA[id] || { description: 'No description available.', year: 2020, genre: ['Unknown'] };
        vodItems.push({
          id,
          name,
          poster: logo,
          group,
          url,
          ...metadata
        });
      } else {
        channels.push({
          id,
          name,
          logo,
          group,
          url
        });
      }
      i++; // Skip the URL line
    }
  }

  return { channels, vodItems };
};
