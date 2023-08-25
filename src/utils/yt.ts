import ytStreamer from 'yt-stream';

import { getFormattedDuration } from './timeDateHelpers';

export const getVideoInfoFromSearch = async (search: string) => {
  const {
    url: link,
    title,
    length,
    thumbnail,
  } = (await ytStreamer.search(search))[0];

  const duration = getFormattedDuration(length);

  return { link, title, duration, thumbnail };
};
