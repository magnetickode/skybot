import { AudioPlayer, VoiceConnection } from '@discordjs/voice';

export interface GuildAIVoice {
  currentlyPlayingId: string;
  channelId: string;
  voiceChannelConnection: VoiceConnection;
  player: AudioPlayer;
}

export enum AICommand {
  CHATAI = 'chatai',
  CHATAI2 = 'chatai2',
  CHATAI3 = 'chatai3',
  CHATAI4 = 'chatai4',
  REPLYAI = 'replyai',
  IMAGEAI = 'imageai',
  VOICEAI = 'voiceai',
  TTS = 'tts',
}

export enum ChatAIModel {
  C2 = 'davinci-002',
  C3 = 'gpt-3.5-turbo',
  C4 = 'gpt-4',
}
