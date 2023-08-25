import { Injectable } from '@nestjs/common';
import { Message, EmbedBuilder } from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  DiscordGatewayAdapterCreator,
} from '@discordjs/voice';
import ytStreamer from 'yt-stream';

import { GuildMusic } from './types';
import { getVideoInfoFromSearch } from 'src/utils/yt';

@Injectable()
export class MusicService {
  music: Record<
    string, // Guild ID
    GuildMusic
  > = {};

  async sendMusicInstructions(message: Message) {
    const embed = new EmbedBuilder()
      .setColor('#ffa500')
      .setTitle('Skybot Music Player Commands')
      .addFields([
        {
          name: '-sky-mplay <text to search song by>',
          value: 'Play or add a song to queue.',
        },
        {
          name: '-sky-mskip',
          value: 'Skip to next song in the queue.',
        },
        {
          name: '-sky-mstop',
          value: 'Stop music, reset queue and leave voice channel.',
        },
        {
          name: '-sky-mpause',
          value: 'Pause the currently playing song.',
        },
        {
          name: '-sky-mresume',
          value: 'Resume the currently paused song.',
        },
        {
          name: '-sky-mqueue',
          value: 'Check the song queue.',
        },
      ])
      .setFooter({ text: `Made with <3 by Skyline` });

    message.reply({ embeds: [embed] });
  }

  clearGuildMusicQueue(guildId: string) {
    const guildMusic = this.music[guildId];
    if (guildMusic?.voiceChannelConnection?.state?.status !== 'destroyed') {
      guildMusic?.voiceChannelConnection?.destroy();
    }
    guildMusic?.player?.stop();

    delete this.music[guildId];
  }

  async streamQueueHandler(guildId: string, close = false) {
    const guildMusic = this.music[guildId];

    if (close) {
      guildMusic?.queue?.shift();
    }

    if (!guildMusic?.queue || guildMusic.queue.length === 0) {
      this.clearGuildMusicQueue(guildId);
      return;
    }

    const audioStream = (
      await ytStreamer.stream(guildMusic.queue[0].link, {
        quality: 'high',
        type: 'audio',
        highWaterMark: 1048576 * 32,
      })
    ).stream;

    guildMusic.queue[0].audioStream = audioStream;

    const audio = createAudioResource(audioStream);
    guildMusic.player.play(audio);

    guildMusic.player.on('stateChange', ({ status: oldStatus }) => {
      if (
        ['playing'].includes(oldStatus) &&
        ['idle'].includes(guildMusic.player.state.status)
      ) {
        this.streamQueueHandler(guildId, true);
      }
    });

    return audioStream;
  }

  async playSong(message: Message) {
    try {
      if (!message.member?.voice?.channelId) {
        message.reply('You need to be in a voice channel to play a song.');
        return;
      }

      if (!this.music[message.guildId]) {
        this.music[message.guildId] = {
          channelId: message.member.voice.channelId,
          voiceChannelConnection: null,
          player: null,
          queue: [],
        };
      }

      const guildMusic = this.music[message.guildId];

      if (!guildMusic.player) {
        guildMusic.player = createAudioPlayer();
      }

      if (
        !guildMusic.voiceChannelConnection ||
        guildMusic.channelId !== message.member.voice.channelId ||
        ['disconnected', 'destroyed'].includes(
          guildMusic.voiceChannelConnection.state.status,
        )
      ) {
        guildMusic.channelId = message.member.voice.channelId;

        guildMusic.voiceChannelConnection = joinVoiceChannel({
          channelId: message.member.voice.channelId,
          guildId: message.guildId,
          adapterCreator: message.guild
            .voiceAdapterCreator as DiscordGatewayAdapterCreator,
        });
      }

      guildMusic.voiceChannelConnection.subscribe(guildMusic.player);

      ytStreamer.userAgent = process.env.YT_USER_AGENT;

      if (process.env.YT_COOKIE) {
        ytStreamer.cookie = process.env.YT_COOKIE;
      }

      const { link, title, duration, thumbnail } = await getVideoInfoFromSearch(
        message.content,
      );

      guildMusic.queue.push({
        title,
        link,
        duration,
        thumbnail,
        user: message.author.username,
      });

      if (guildMusic.queue.length === 1) {
        this.streamQueueHandler(message.guildId);
      }

      const embed = new EmbedBuilder()
        .setTitle(
          guildMusic.queue.length > 1 ? 'Added to Queue' : 'Now Playing',
        )
        .setColor('#ffa500')
        .addFields([
          { name: 'Title:', value: title },
          { name: 'Duration:', value: duration },
        ])
        .setThumbnail(thumbnail)
        .setTimestamp()
        .setFooter({
          text: message.author.username,
          iconURL: message.author.avatarURL(),
        });

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.log(e);
      message.reply('Something went wrong :(');
    }
  }

  async skipSong(message: Message) {
    try {
      if (!message.member?.voice?.channelId) {
        message.reply('You need to be in a voice channel to skip songs.');
        return;
      }

      const guildMusic = this.music[message.guildId];

      if (!guildMusic || guildMusic.queue.length < 2) {
        message.reply('No song in queue to skip to.');
        return;
      }

      const songToSkipTo = guildMusic.queue[1];

      guildMusic.player.stop();

      const embed = new EmbedBuilder()
        .setTitle('Skipped To')
        .setColor('#ffa500')
        .addFields([
          { name: 'Title:', value: songToSkipTo.title },
          { name: 'Duration:', value: songToSkipTo.duration },
        ])
        .setThumbnail(songToSkipTo.thumbnail)
        .setTimestamp()
        .setFooter({
          text: message.author.username,
          iconURL: message.author.avatarURL(),
        });

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.log(e);
      message.reply('Something went wrong :(');
    }
  }

  stopSongPlayer(message: Message) {
    try {
      if (!message.member?.voice?.channelId) {
        message.reply(
          'You need to be in a voice channel to stop music player.',
        );
        return;
      }

      if (!this.music[message.guildId]) {
        message.reply('Music player is already stopped.');
        return;
      }

      this.clearGuildMusicQueue(message.guildId);

      message.reply('Stopped music player and cleared song queue.');
    } catch (e) {
      console.log(e);
      message.reply('Something went wrong :(');
    }
  }

  pauseOrResumeSongPlayer(message: Message, action: 'pause' | 'resume') {
    try {
      if (!message.member?.voice?.channelId) {
        message.reply(
          'You need to be in a voice channel to pause or resume music.',
        );
        return;
      }

      const guildMusic = this.music[message.guildId];

      if (!guildMusic || guildMusic.queue.length < 1) {
        message.reply('No song is currently playing.');
        return;
      }

      if (guildMusic.player.state.status === 'paused' && action === 'pause') {
        message.reply('Music is already paused.');
        return;
      }

      if (guildMusic.player.state.status === 'playing' && action === 'resume') {
        message.reply('Music is already playing.');
        return;
      }

      action === 'pause'
        ? guildMusic.player.pause()
        : guildMusic.player.unpause();

      const embed = new EmbedBuilder()
        .setTitle(action === 'pause' ? 'Paused' : 'Resumed')
        .setColor('#ffa500')
        .addFields([
          { name: 'Title:', value: guildMusic.queue[0].title },
          { name: 'Duration:', value: guildMusic.queue[0].duration },
        ])
        .setThumbnail(guildMusic.queue[0].thumbnail)
        .setTimestamp()
        .setFooter({
          text: message.author.username,
          iconURL: message.author.avatarURL(),
        });

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.log(e);
      message.reply('Something went wrong :(');
    }
  }

  async checkMusicQueue(message: Message) {
    try {
      if (!message.member?.voice?.channelId) {
        message.reply(
          'You need to be in a voice channel to check music queue.',
        );
        return;
      }

      const guildMusic = this.music[message.guildId];

      if (!guildMusic || guildMusic.queue.length < 1) {
        message.reply('Queue is empty.');
        return;
      }

      let queueDescription = '';

      for (const [
        index,
        { title, duration, user },
      ] of guildMusic.queue.entries()) {
        queueDescription += `${
          index === 0 ? '**[Now Playing]** ' : ''
        }${title} - **[${duration}]** - Added by **${user}** \n \n`;
      }

      const embed = new EmbedBuilder()
        .setTitle('Music Queue')
        .setColor('#ffa500')
        .setDescription(queueDescription)
        .setTimestamp()
        .setFooter({
          text: message.author.username,
          iconURL: message.author.avatarURL(),
        });

      message.reply({ embeds: [embed] });
    } catch (e) {
      console.log(e);
      message.reply('Something went wrong :(');
    }
  }
}
