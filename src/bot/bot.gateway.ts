import { Injectable } from '@nestjs/common';
import {
  Once,
  PrefixCommand,
  On,
  InjectDiscordClient,
} from '@discord-nestjs/core';
import { Client, Message, ActivityType } from 'discord.js';

import { BotService } from './bot.service';
import { MusicCommand } from 'src/music/types';
import { AICommand } from 'src/ai/types';

@Injectable()
export class BotGateway {
  constructor(
    @InjectDiscordClient()
    private readonly client: Client,
    private readonly botService: BotService,
  ) {}

  @Once('ready')
  async onReady() {
    await this.client.user.setActivity('-sky-help', {
      type: ActivityType.Watching,
    });
    console.log('Skybot inititalized');
  }

  @PrefixCommand('sky-help', { prefix: '-' })
  onHelpCommand(message: Message) {
    return this.botService.sendInstructions(message);
  }

  @PrefixCommand('sky-mhelp', { prefix: '-' })
  onMHelpCommand(message: Message) {
    return this.botService.handleMusicCommands(message, MusicCommand.MHelp);
  }

  @PrefixCommand('sky-mplay', { prefix: '-' })
  onMPlayCommand(message: Message) {
    return this.botService.handleMusicCommands(message, MusicCommand.MPlay);
  }

  @PrefixCommand('sky-mskip', { prefix: '-' })
  onMSkipCommand(message: Message) {
    return this.botService.handleMusicCommands(message, MusicCommand.MSkip);
  }

  @PrefixCommand('sky-mstop', { prefix: '-' })
  onMStopCommand(message: Message) {
    return this.botService.handleMusicCommands(message, MusicCommand.MStop);
  }

  @PrefixCommand('sky-mpause', { prefix: '-' })
  onMPauseCommand(message: Message) {
    return this.botService.handleMusicCommands(message, MusicCommand.MPause);
  }

  @PrefixCommand('sky-mresume', { prefix: '-' })
  onMResumeCommand(message: Message) {
    return this.botService.handleMusicCommands(message, MusicCommand.MResume);
  }

  @PrefixCommand('sky-mqueue', { prefix: '-' })
  onMQueueCommand(message: Message) {
    return this.botService.handleMusicCommands(message, MusicCommand.MQueue);
  }

  @PrefixCommand('sky-chatai', { prefix: '-' })
  onChatAICommand(message: Message) {
    return this.botService.handleAICommands(message, AICommand.CHATAI);
  }

  @PrefixCommand('sky-chatai2', { prefix: '-' })
  onChatAICommand2(message: Message) {
    return this.botService.handleAICommands(message, AICommand.CHATAI2);
  }

  @PrefixCommand('sky-chatai3', { prefix: '-' })
  onChatAICommand3(message: Message) {
    return this.botService.handleAICommands(message, AICommand.CHATAI3);
  }

  @PrefixCommand('sky-chatai4', { prefix: '-' })
  onChatAICommand4(message: Message) {
    return this.botService.handleAICommands(message, AICommand.CHATAI4);
  }

  @On('messageCreate')
  onMention(message: Message) {
    if (!message.content.startsWith(`<@${this.client.user.id}>`)) {
      return;
    }
    message.content = message.content
      .replace(`<@${this.client.user.id}>`, '')
      .trim();

    return this.botService.handleAICommands(message, AICommand.CHATAI);
  }

  @On('messageCreate')
  onConversationReply(message: Message) {
    return this.botService.handleAICommands(
      message,
      AICommand.REPLYAI,
      this.client.user.id,
    );
  }

  @PrefixCommand('sky-voiceai', { prefix: '-' })
  onVoiceAICommand(message: Message) {
    return this.botService.handleAICommands(message, AICommand.VOICEAI);
  }

  @PrefixCommand('sky-tts', { prefix: '-' })
  onTTSCommand(message: Message) {
    return this.botService.handleAICommands(message, AICommand.TTS);
  }

  @PrefixCommand('sky-imageai', { prefix: '-' })
  onImageAICommand(message: Message) {
    return this.botService.handleAICommands(message, AICommand.IMAGEAI);
  }
}
