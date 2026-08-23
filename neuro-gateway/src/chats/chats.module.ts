import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ProxyModule, AuthModule],
  controllers: [ChatsController],
})
export class ChatsModule {}
