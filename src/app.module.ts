import { Module } from '@nestjs/common';

// Modules
import { BotModule } from './bot/bot.module';
import { MusicModule } from './music/music.module';
import { AIModule } from './ai/ai.module';

@Module({
  imports: [BotModule, MusicModule, AIModule],
})
export class AppModule {}
