import { Module } from '@nestjs/common';

import { MusicModule } from 'src/music/music.module';
import { AIService } from './ai.service';

@Module({
  imports: [MusicModule],
  providers: [AIService],
  exports: [AIService],
})
export class AIModule {}
