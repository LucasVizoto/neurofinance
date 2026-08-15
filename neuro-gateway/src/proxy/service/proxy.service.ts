import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CircuitBreakerService } from 'src/common/circuit-breaker/circuit-breaker.service';
import { CacheFallbackService } from 'src/common/fallback/cache.fallback';
import { DefaultFallbackService } from 'src/common/fallback/default.fallback';
import { serviceConfig } from 'src/config/gateway.config';
import { UserInfo } from 'src/interfaces/user-info';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

@Injectable()
export class ProxyService {
    private readonly logger = new Logger(ProxyService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly circuitBreakerService: CircuitBreakerService,
        private readonly cacheFallbackService: CacheFallbackService,
        private readonly defaultFallbackService: DefaultFallbackService,
    ) { }

    async proxyRequest(
        serviceName: keyof typeof serviceConfig,
        method: string,
        path: string,
        data?: unknown,
        headers?: Record<string, string>,
        userInfo?: UserInfo,
    ) {
        const service = serviceConfig[serviceName];
        const url = `${service.url}${path}`;

        this.logger.log(`Proxying ${method} request to ${serviceName}: ${url}`);

        const fallback = this.createServiceFallback(serviceName, method, path);

        return this.circuitBreakerService.executeWithCircuitBreaker(
            async () => {
                const enhancedHeaders = {
                    ...headers,
                    'x-user-id': userInfo?.userId,
                    'x-user-email': userInfo?.email,
                    'x-user-role': userInfo?.role,
                };

                const response = await firstValueFrom(
                    this.httpService.request({
                        method: method.toLocaleLowerCase() as HttpMethod,
                        url: url,
                        headers: enhancedHeaders,
                        data: data,
                        timeout: service.timeout,
                    }),
                );

                if (method.toLowerCase() === 'get') {
                    this.cacheFallbackService.setCacheData(
                        `${serviceName}-${path}`,
                        response.data,
                    );
                }

                return response.data;
            },
            `proxy-${serviceName}`,
            fallback,
            { failureThreshold: 3, resetTimeout: 30000, timeout: 30000 }
        )
    }

    async getServiceHealth(serviceName: keyof typeof serviceConfig) {
        try {
            const service = serviceConfig[serviceName];
            const response = await firstValueFrom(
                this.httpService.get(`${service.url}/health`, {
                    timeout: service.timeout,
                }),
            );
            return { status: 'healthy', data: response.data };
        } catch (error: Error | any) {
            return { status: 'unhealthy', error: error.message }
        }
    }

    private createServiceFallback(
        serviceName: string,
        method: string,
        path: string,
    ) {
        switch (serviceName) {
            case 'user':
                if (path.includes('/auth/login')) {
                    return this.defaultFallbackService.createErrorFallback('users', 'Authentication service unavailable');
                }
                return this.defaultFallbackService.createErrorFallback('users', 'User service unavailable');
            case 'products':
                if (method.toLowerCase() === 'get') {
                    return this.cacheFallbackService.createCacheFallback(
                        `products-${path}`,
                        { products: [], total: 0, page: 1, limit: 10 },
                    );
                }
                return this.defaultFallbackService.createErrorFallback('products', 'Product service unavailable');
            case 'checkout': // No JS caso tenha um case aninhado com outro, ele usa a execução do caso abaixo
            case 'payments':
                return this.defaultFallbackService.createErrorFallback(
                    serviceName,
                    `${serviceName} service unavailable`,
                );
            default:
                return this.defaultFallbackService.createErrorFallback(
                    serviceName,
                    'Service unavailable',
                );
        }
    };
}
