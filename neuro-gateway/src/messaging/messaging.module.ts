import { Global, Module } from '@nestjs/common';
import { RpcClientService } from './rpc-client.service';

@Global()
@Module({
    providers: [RpcClientService],
    exports: [RpcClientService],
})
export class MessagingModule {}
