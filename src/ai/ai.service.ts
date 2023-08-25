import { Readable } from 'stream';
import Keyv from 'keyv';
import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import {
  Message,
  EmbedBuilder,
  AttachmentBuilder,
  TextChannel,
  ChannelType,
} from 'discord.js';
import {
  DiscordGatewayAdapterCreator,
  createAudioPlayer,
  createAudioResource,
  joinVoiceChannel,
} from '@discordjs/voice';
import { post } from 'axios';
import { TextToSpeechClient, protos } from '@google-cloud/text-to-speech';

import { GuildAIVoice } from './types';
import { MusicService } from 'src/music/music.service';

@Injectable()
export class AIService {
  aiVoice: Record<
    string, // Guild ID
    GuildAIVoice
  > = {};

  messageStore = new Keyv('sqlite://messageStore.sqlite');

  constructor(private musicService: MusicService) {}

  async converseWithChatGPT(
    message: Message,
    opts?: { parentMessageId: string },
  ) {
    const chatAPI = new (await import('chatgpt')).ChatGPTAPI({
      apiKey: process.env.OPENAI_SECRET,
      messageStore: this.messageStore,
    });

    if (!message.content) {
      message.reply('No prompt provided');
      return;
    }

    if (message.content.split(' ').length > 200) {
      message.reply('Prompt exceeds 200 words.');
      return;
    }

    try {
      const { text, id: messageId } = await chatAPI.sendMessage(
        message.content,
        opts,
      );

      const embed = new EmbedBuilder()
        .setColor('#ffa500')
        .setDescription(text)
        .setFooter({ text: `ID: ${messageId}` });

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.log(e);
      message.reply('Something went wrong :(');
    }
  }

  async handleRepliesToChatGPTResponses(message: Message, botId: string) {
    if (!message.reference || message.channel.type !== ChannelType.GuildText) {
      return;
    }

    const parentMessage = await message.channel.messages.fetch(
      message.reference.messageId,
    );

    if (
      parentMessage.author.id !== botId ||
      parentMessage.embeds.length === 0 ||
      !parentMessage.embeds[0]?.footer?.text?.startsWith('ID: ')
    ) {
      return;
    }

    const parentMessageId = parentMessage.embeds[0].footer.text.slice(4);

    await this.converseWithChatGPT(message, {
      parentMessageId,
    });
  }

  async generateAIImage(message: Message) {
    if (!message.content) {
      message.reply('No prompt provided');
      return;
    }

    try {
      const res = await post(
        'https://api.openai.com/v1/images/generations',
        {
          prompt: message.content,
          size: '256x256',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_SECRET}`,
          },
        },
      );

      const imageUrl = res.data.data[0].url;

      const attachment = new AttachmentBuilder(imageUrl, {
        name: 'aiimage.png',
      });

      const embed = new EmbedBuilder()
        .setColor('#ffa500')
        .setTitle('AI Generated Image')
        .addFields([{ name: 'Prompt', value: message.content }])
        .setImage('attachment://aiimage.png')
        .setTimestamp()
        .setFooter({
          text: message.author.username,
          iconURL: message.author.avatarURL(),
        });

      const reply = await message.reply({
        embeds: [embed],
        files: [attachment],
      });

      await Promise.all([
        reply.react('❤️'),
        reply.react('😆'),
        reply.react('🔥'),
      ]);
    } catch (e) {
      console.log(e?.response?.data);

      if (e?.response?.data?.error?.message?.includes('safety system')) {
        message.reply('Prompt contains filtered words, sorry. :(');
      } else if (e?.response?.data?.error?.message?.includes('is too long')) {
        message.reply('Prompt is too long, sorry. :(');
      } else {
        message.reply('Something went wrong :(');
      }
    }
  }

  clearGuildAIVoice(guildId) {
    const guildAIVoice = this.aiVoice[guildId];

    if (guildAIVoice?.voiceChannelConnection?.state.status !== 'destroyed') {
      guildAIVoice?.voiceChannelConnection?.destroy();
    }
    guildAIVoice?.player?.stop();

    delete this.aiVoice[guildId];
  }

  async invokeVoiceAI(message: Message, tts = false) {
    try {
      if (!message.member?.voice?.channelId) {
        message.reply(
          'You need to be in a voice channel to use Voice AI or TTS.',
        );
        return;
      }

      if (!message.content) {
        message.reply('No prompt provided');
        return;
      }

      if (message.content.split(' ').length > 200) {
        message.reply('Prompt exceeds 200 words.');
        return;
      }

      this.musicService.clearGuildMusicQueue(message.guildId);

      if (
        this.aiVoice[message.guildId]?.player &&
        !['disconnected', 'destroyed'].includes(
          this.aiVoice[message.guildId]?.voiceChannelConnection?.state?.status,
        )
      ) {
        message.reply(
          "Voice AI is already reading something, please wait and try again after it's finished.",
        );
        return;
      }

      const chatAPI = new (await import('chatgpt')).ChatGPTAPI({
        apiKey: process.env.OPENAI_SECRET,
      });

      const ttsClient = new TextToSpeechClient();

      const currentlyPlayingId = randomUUID();

      if (!this.aiVoice[message.guildId]) {
        this.aiVoice[message.guildId] = {
          currentlyPlayingId,
          channelId: message.member.voice.channelId,
          voiceChannelConnection: null,
          player: null,
        };
      }

      const guildAIVoice = this.aiVoice[message.guildId];

      if (
        guildAIVoice.currentlyPlayingId !== currentlyPlayingId &&
        guildAIVoice.player
      ) {
        guildAIVoice.player.stop();
      }

      guildAIVoice.player = createAudioPlayer();

      if (
        !guildAIVoice.voiceChannelConnection ||
        guildAIVoice.channelId !== message.member.voice.channelId ||
        ['disconnected', 'destroyed'].includes(
          guildAIVoice.voiceChannelConnection.state.status,
        )
      ) {
        guildAIVoice.channelId = message.member.voice.channelId;

        guildAIVoice.voiceChannelConnection = joinVoiceChannel({
          channelId: message.member.voice.channelId,
          guildId: message.guildId,
          adapterCreator: message.guild
            .voiceAdapterCreator as DiscordGatewayAdapterCreator,
        });
      }

      guildAIVoice.voiceChannelConnection.subscribe(guildAIVoice.player);

      let text = '';

      if (tts) {
        text = message.content;
      } else {
        text = (await chatAPI.sendMessage(message.content)).text;
      }

      const voices = {
        espanol: {
          voice: { languageCode: 'es-ES', name: 'es-ES-Neural2-A' },
          pitch: 19.6,
        },
        indian: {
          voice: {
            languageCode: 'en-IN',
            name: 'en-IN-Wavenet-C',
          },
          pitch: 6,
        },
        aussie: {
          voice: {
            languageCode: 'en-AU',
            name: 'en-AU-Neural2-A',
          },
          pitch: 6.8,
        },
      };

      const voicesKeys = Object.keys(voices);

      const selectedVoice =
        voices[voicesKeys[Math.floor(Math.random() * voicesKeys.length)]];

      const ttsReq: protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest =
        {
          audioConfig: {
            audioEncoding: 'OGG_OPUS',
            effectsProfileId: ['small-bluetooth-speaker-class-device'],
            pitch: selectedVoice.pitch,
            speakingRate: 1.2,
          },
          input: {
            text: text,
          },
          voice: selectedVoice.voice,
        };

      const audioStream = Readable.from(
        (await ttsClient.synthesizeSpeech(ttsReq))[0].audioContent,
      );

      const audio = createAudioResource(audioStream);

      guildAIVoice.player.play(audio);

      guildAIVoice.player.on('stateChange', ({ status: oldStatus }) => {
        if (
          ['playing'].includes(oldStatus) &&
          ['idle'].includes(guildAIVoice.player.state.status)
        ) {
          this.clearGuildAIVoice(message.guildId);
        }
      });

      const embed = new EmbedBuilder()
        .setTitle(`${tts ? 'TTS' : 'Voice AI'} currently reading`)
        .setColor('#ffa500')
        .setDescription(text);

      if (guildAIVoice?.currentlyPlayingId === currentlyPlayingId) {
        message.reply({ embeds: [embed] });
      }
    } catch (e) {
      console.log(e);
      message.reply('Something went wrong :(');
    }
  }
}
