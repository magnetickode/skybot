import { Module } from '@nestjs/common';
import { DiscordModule } from '@discord-nestjs/core';
import { GatewayIntentBits } from 'discord.js';

import { BotGateway } from './bot.gateway';
import { BotService } from './bot.service';
import { MusicModule } from 'src/music/music.module';
import { AIModule } from 'src/ai/ai.module';

@Module({
  imports: [
    DiscordModule.forRootAsync({
      useFactory: () => ({
        token: process.env.DISCORD_BOT_TOKEN,
        discordClientOptions: {
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildEmojisAndStickers,
            GatewayIntentBits.GuildVoiceStates,
          ],
        },
      }),
    }),
    MusicModule,
    AIModule,
  ],
  providers: [BotGateway, BotService],
})
export class BotModule {}
