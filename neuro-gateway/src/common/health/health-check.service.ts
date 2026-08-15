import { Injectable, Logger } from "@nestjs/common";
import { HealthStatus, ServiceHealth } from "./health-check.interface";
import { HttpService } from "@nestjs/axios";
import { CircuitBreakerService } from "../circuit-breaker/circuit-breaker.service";
import { serviceConfig } from "src/config/gateway.config";
import { firstValueFrom, timeout } from "rxjs";

@Injectable()
export class HealthCheckService {
    private readonly logger = new Logger(HealthCheckService.name);
    private readonly healthCache = new Map<string, ServiceHealth>
        ();

    constructor(
        private readonly httpService: HttpService,
        private readonly circuitBreakerService: CircuitBreakerService,
    ) { }

    async checkServiceHealth(serviceName: keyof typeof serviceConfig): Promise<ServiceHealth> {
        const service = serviceConfig[serviceName];
        const startTime = Date.now();

        try {
            await this.circuitBreakerService.executeWithCircuitBreaker(
                async () => {
                    const response = await firstValueFrom(
                        this.httpService.get(`${service.url}/health`, {
                            timeout: service.timeout,
                        }).pipe(timeout(service.timeout))
                    );
                    return response.status;
                },
                `health-${serviceName}`,
                async () => {
                    throw new Error(`Fallback: ${serviceName} health check failed`);
                },
            );

            const responseTime = Date.now() - startTime;
            const serviceHealth: ServiceHealth = {
                name: serviceName,
                url: service.url,
                status: HealthStatus.HEALTHY,
                responseTime: responseTime,
                lastChecked: new Date(),
            };

            this.healthCache.set(serviceName, serviceHealth);
            return serviceHealth;

        } catch (e) {
            const responseTime = Date.now() - startTime;
            const serviceHealth: ServiceHealth = {
                name: serviceName,
                url: service.url,
                status: HealthStatus.UNHEALTHY,
                responseTime: responseTime,
                lastChecked: new Date(),
                error: e as Error,
            };
            this.healthCache.set(serviceName, serviceHealth);

            const errorMessage = e instanceof Error ? e.message : 'Unknown error';
            this.logger.error(`Health check failed for ${serviceName}: `, errorMessage);
            return serviceHealth;
        }
    }

    async checkAllServices(): Promise<ServiceHealth[]> {
        const services: (keyof typeof serviceConfig)[] = [
            'users',
            'checkout',
            'payments',
            'products',
        ];

        const healthChecks = await Promise.allSettled( //Ao invés do Promise.all, use Promise.allSettled para garantir que todas as promessas sejam resolvidas, mesmo que algumas falhem
            services.map((serviceName) => this.checkServiceHealth(serviceName)),
        );

        return healthChecks.map((result, index) => {
            if (result.status === 'fulfilled') return result.value;
            else return {
                name: services[index],
                url: serviceConfig[services[index]].url,
                status: HealthStatus.UNHEALTHY as const,
                responseTime: 0,
                lastChecked: new Date(),
                error: result.reason?.message || 'Unknown error',
            }
        });
    }

    getCachedHealth(serviceName: string): ServiceHealth | undefined {
        return this.healthCache.get(serviceName);
    }

    getAllCachedHealth(): ServiceHealth[] {
        return Array.from(this.healthCache.values());
    }
}