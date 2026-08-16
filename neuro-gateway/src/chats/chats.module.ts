import { Module } from '@nestjs/common';
import { ChatsController } from './chats.controller';
import { ProxyModule } from '../proxy/proxy.module';

@Module({
  imports: [ProxyModule],
  controllers: [ChatsController],
})
export class ChatsModule {}
