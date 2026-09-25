import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { CircuitBreakerService } from 'src/common/circuit-breaker/circuit-breaker.service';
import { CacheFallbackService } from 'src/common/fallback/cache.fallback';
import { DefaultFallbackService } from 'src/common/fallback/default.fallback';
import { serviceConfig } from 'src/config/gateway.config';
import { UserInfo } from 'src/interfaces/user-info';
import { isAmqpMessaging, RpcClientService } from 'src/messaging/rpc-client.service';

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

@Injectable()
export class ProxyService {
    private readonly logger = new Logger(ProxyService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly circuitBreakerService: CircuitBreakerService,
        private readonly cacheFallbackService: CacheFallbackService,
        private readonly defaultFallbackService: DefaultFallbackService,
        private readonly rpcClient: RpcClientService,
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
        const viaAmqp = isAmqpMessaging();

        this.logger.log(
            viaAmqp
                ? `RPC ${method} ${serviceName} ${path}`
                : `Proxying ${method} request to ${serviceName}: ${url}`,
        );

        const fallback = this.createServiceFallback(serviceName, method, path);

        return this.circuitBreakerService.executeWithCircuitBreaker(
            async () => {
                const enhancedHeaders = {
                    ...headers,
                    'x-user-id': userInfo?.userId,
                    'x-user-email': userInfo?.email,
                    'x-user-role': userInfo?.role,
                };

                const responseData = viaAmqp
                    ? await this.rpcClient.request(
                        serviceName === 'ai' ? 'learning.rpc' : 'backend.rpc',
                        {
                            method,
                            path,
                            payload: data ?? null,
                            headers: {
                                authorization: headers?.authorization || headers?.Authorization,
                            },
                            user: userInfo ?? null,
                        },
                        serviceName === 'ai'
                            ? Number(process.env.RABBITMQ_RPC_TIMEOUT_LEARNING_MS || 180000)
                            : Number(process.env.RABBITMQ_RPC_TIMEOUT_BACKEND_MS || 10000),
                    )
                    : await this.forwardHttp(method, url, enhancedHeaders, data, service.timeout);

                if (method.toLowerCase() === 'get') {
                    this.cacheFallbackService.setCacheData(
                        `${serviceName}-${path}`,
                        responseData,
                    );
                }

                return responseData;
            },
            `proxy-${serviceName}`,
            fallback,
            { failureThreshold: 3, resetTimeout: 30000, timeout: 30000 }
        )
    }

    private async forwardHttp(
        method: string,
        url: string,
        headers: Record<string, string | undefined>,
        data: unknown,
        timeout: number,
    ) {
        const response = await firstValueFrom(
            this.httpService.request({
                method: method.toLocaleLowerCase() as HttpMethod,
                url,
                headers,
                data,
                timeout,
            }),
        );
        return response.data;
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
            case 'users':
                if (path.includes('/auth/login')) {
                    return this.defaultFallbackService.createErrorFallback('users', 'Authentication service unavailable');
                }
                return this.defaultFallbackService.createErrorFallback('users', 'User/Chat service unavailable');
            case 'ai':
                return this.defaultFallbackService.createErrorFallback(
                    serviceName,
                    'AI and ML service unavailable',
                );
            default:
                return this.defaultFallbackService.createErrorFallback(
                    serviceName,
                    'Service unavailable',
                );
        }
    };
}
