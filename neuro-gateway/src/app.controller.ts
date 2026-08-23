import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ProxyService } from './proxy/service/proxy.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly proxyService: ProxyService
  ) { }

  @Get()
  @ApiOperation({ summary: 'Status do gateway', description: 'Mensagem de disponibilidade da API NeuroFinance.' })
  getHello(): string {
    return this.appService.getHello();
  }

}
