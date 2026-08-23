import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { UsersController } from './users.controller';
import { ProxyModule } from '../proxy/proxy.module';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [ProxyModule, AuthModule, HttpModule],
    controllers: [UsersController],
})
export class UsersModule {}
