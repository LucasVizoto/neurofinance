import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProxyModule, AuthModule],
  controllers: [AiController],
})
export class AiModule {}
