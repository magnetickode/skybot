import { AudioPlayer, VoiceConnection } from '@discordjs/voice';

export interface GuildAIVoice {
  currentlyPlayingId: string;
  channelId: string;
  voiceChannelConnection: VoiceConnection;
  player: AudioPlayer;
}

export enum AICommand {
  CHATAI = 'chatai',
  REPLYAI = 'replyai',
  IMAGEAI = 'imageai',
  VOICEAI = 'voiceai',
  TTS = 'tts',
}
