import { Controller, Get, Param } from '@nestjs/common';
import { HealthService } from './health.service';
import { HealthCheckService } from 'src/common/health/health-check.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
    constructor(
        private readonly healthService: HealthService,
        private readonly healthCheckService: HealthCheckService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Saúde do gateway' })
    @ApiResponse({ status: 200, description: 'Gateway no ar, com uptime e memória.' })
    async getHealth() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0',
        }
    }

    @Get('services')
    @ApiOperation({ summary: 'Saúde dos microserviços' })
    @ApiResponse({ status: 200, description: 'Status agregado de users, AI e demais dependências.' })
    async getServicesHealth() {
        const services = await this.healthCheckService.checkAllServices();

        const overallStatus = services.every((s) => s.status === 'healthy') ? 'healthy' : services.some((s) => s.status === 'healthy') ? 'degraded' : 'unhealthy';

        return {
            overallStatus,
            timestamp: new Date().toISOString(),
            services,
            summary: {
                total: services.length,
                healthy: services.filter((s) => s.status === 'healthy').length,
                degraded: services.filter((s) => s.status === 'degraded').length,
                unhealthy: services.filter((s) => s.status === 'unhealthy').length,
            },
        };
    }

    @Get('services/:serviceName')
    @ApiOperation({ summary: 'Saúde de um serviço' })
    @ApiResponse({ status: 200, description: 'Último status em cache daquele serviço.' })
    async getServiceHealth(@Param('serviceName') serviceName: string) {
        const cached = this.healthCheckService.getCachedHealth(serviceName);

        if (!cached) {
            return {
                status: 'unknown',
                message: 'Service not found or never checked',
                timestamp: new Date().toISOString(),
            }
        }
        return cached;
    }

    @Get('ready')
    @ApiOperation({ summary: 'Readiness' })
    @ApiResponse({ status: 200, description: 'Pronto para receber tráfego.' })
    async getReady() {
        return this.healthService.getReadyStatus();
    }

    @Get('live')
    @ApiOperation({ summary: 'Liveness' })
    @ApiResponse({ status: 200, description: 'Processo vivo.' })
    async getLive() {
        return this.healthService.getLiveStatus();
    }
}