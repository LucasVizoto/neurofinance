import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  imports: [ProxyModule],
  controllers: [AiController],
})
export class AiModule {}
