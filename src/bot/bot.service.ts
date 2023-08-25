import { Injectable } from '@nestjs/common';
import { Message, EmbedBuilder } from 'discord.js';

import { MusicService } from 'src/music/music.service';
import { AIService } from 'src/ai/ai.service';
import { MusicCommand } from 'src/music/types';
import { AICommand } from 'src/ai/types';

@Injectable()
export class BotService {
  constructor(
    private musicService: MusicService,
    private aiService: AIService,
  ) {}

  async sendInstructions(message: Message) {
    const embed = new EmbedBuilder()
      .setColor('#ffa500')
      .setTitle('Skybot Commands')
      .addFields([
        {
          name: '-sky-mhelp',
          value: 'Show commands for music player.',
        },
        {
          name: '-sky-chatai <prompt>',
          value:
            'Start a conversation with ChatGPT AI model. Make your prompt as descriptive as possible to get best results. After getting a response, you can reply to the message from Skybot to continue the conversation while it remembers context. You can keep chaining replies to continue the conversation.',
        },
        {
          name: '<mention Skybot> <prompt>',
          value: 'This is identical to -sky-chatai but added for convenience.',
        },
        {
          name: '-sky-imageai <prompt>',
          value:
            'Generate an image using the DALL.E AI model based on your prompt. Include more details for better results.',
        },
        {
          name: '-sky-voiceai <prompt>',
          value:
            'Ask ChatGPT to generate text and then have a randomly selected funny voice (from a pool of 3) read it out in VC.',
        },
        {
          name: '-sky-tts <text>',
          value:
            'Have a randomly selected funny voice (from a pool of 3) read out your written text in VC.',
        },
      ])
      .setFooter({ text: `Made with <3 by Skyline` });

    message.reply({ embeds: [embed] });
  }

  handleMusicCommands(message: Message, command: MusicCommand) {
    switch (command) {
      case MusicCommand.MHelp:
        return this.musicService.sendMusicInstructions(message);
      case MusicCommand.MPlay:
        return this.musicService.playSong(message);
      case MusicCommand.MSkip:
        return this.musicService.skipSong(message);
      case MusicCommand.MStop:
        return this.musicService.stopSongPlayer(message);
      case MusicCommand.MPause:
        return this.musicService.pauseOrResumeSongPlayer(message, 'pause');
      case MusicCommand.MResume:
        return this.musicService.pauseOrResumeSongPlayer(message, 'resume');
      case MusicCommand.MQueue:
        return this.musicService.checkMusicQueue(message);
    }
  }

  handleAICommands(message: Message, command: AICommand, botId?: string) {
    switch (command) {
      case AICommand.CHATAI:
        return this.aiService.converseWithChatGPT(message);
      case AICommand.REPLYAI:
        return this.aiService.handleRepliesToChatGPTResponses(message, botId);
      case AICommand.VOICEAI:
        return this.aiService.invokeVoiceAI(message);
      case AICommand.TTS:
        return this.aiService.invokeVoiceAI(message, true);
      case AICommand.IMAGEAI:
        return this.aiService.generateAIImage(message);
    }
  }
}
