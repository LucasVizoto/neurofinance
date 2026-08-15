import { Injectable, Logger } from "@nestjs/common";

@Injectable()
export class CacheFallbackService {
    private readonly logger = new Logger(CacheFallbackService.name);
    private readonly cache = new Map<string, { data: any; timestamp: number }>();

    async getCacheData<T>(key: string, timeout: number = 300000): Promise<T | null> {
        const cache = this.cache.get(key);

        if (!cache) return null;

        const isExpired = Date.now() - cache.timestamp > timeout;

        if (isExpired) {
            this.cache.delete(key);
            return null;
        }

        this.logger.log(`Cache HIT for key: ${key}`);
        return cache.data;
    }

    async setCacheData<T>(key: string, data: T): Promise<void> {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
        this.logger.log(`Cache SET for key: ${key}`);
    }

    createCacheFallback<T>(
        key: string,
        defaultData: T,
        timeout: number = 300000,
    ): () => Promise<T> {
        return async (): Promise<T> => {
            const cached = await this.getCacheData<T>(key, timeout);

            if (cached) {
                this.logger.log(`Using cached data for ${key}`);
                return cached;
            }

            this.logger.warn(`No cached data available for ${key}, using default response`);
            return defaultData;
        }
    }
}