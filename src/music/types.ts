import { AudioPlayer, VoiceConnection } from '@discordjs/voice';
import { Readable } from 'stream';

export interface GuildMusic {
  channelId: string;
  voiceChannelConnection: VoiceConnection;
  player: AudioPlayer;
  queue: {
    title: string;
    duration: string;
    link: string;
    thumbnail: string;
    user: string;
    audioStream?: Readable;
  }[];
}

export enum MusicCommand {
  MHelp = 'mhelp',
  MPlay = 'mplay',
  MSkip = 'mskip',
  MStop = 'mstop',
  MPause = 'mpause',
  MResume = 'mresume',
  MQueue = 'mqueue',
}
