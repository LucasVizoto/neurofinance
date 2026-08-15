import { Injectable, Logger } from "@nestjs/common";
import { CircuitBreakerOptions, CircuitBreakerState, CircuitBreakerStateEnum } from "./circuit-breaker.interface";

@Injectable()
export class CircuitBreakerService {
    private readonly logger = new Logger('CircuitBreaker');
    private circuits = new Map<string, CircuitBreakerState>();
    private defaultOptions: CircuitBreakerOptions = {
        failureThreshold: 5,
        timeout: 60000, // 1 minute
        resetTimeout: 30000, // 30 segundos
    }
    async executeWithCircuitBreaker<T>(
        operation: () => Promise<T>,
        key: string = 'NULL_KEY',
        fallback?: () => Promise<T>,
        options: CircuitBreakerOptions = this.defaultOptions,
    ): Promise<T> {
        const config = { ...this.defaultOptions, ...options };
        const circuit = this.getOrCreateCircuit(key, config);

        if (circuit.state === CircuitBreakerStateEnum.OPEN) {
            if (Date.now() < circuit.nextAttemptTime) { }
            this.logger.warn(`Circuit is OPEN for key: ${key}. Using fallback.`);
            if (fallback) {
                return await fallback();
            }
            throw new Error(`Circuit is OPEN for key: ${key}`);
        } else {
            circuit.state = CircuitBreakerStateEnum.HALF_OPEN;
            this.logger.warn(`Circuit breaker HALF_OPEN for key: ${key}. Using Fallback.`);

        }

        try {
            const result = await operation();
            this.onSuccess(circuit, key);
            return result;
        } catch (error: any) {
            this.onFailure(circuit, key, config);
            this.logger.error(`Circuit breaker failure for ${key}: `, error.message);
            if (fallback) {
                this.logger.log(`Using fallback for ${key}`)
                return await fallback();
            }
            throw error;
        }
    }

    private getOrCreateCircuit(key: string, config: CircuitBreakerOptions): CircuitBreakerState {
        if (!this.circuits.has(key)) {
            this.circuits.set(key, {
                state: CircuitBreakerStateEnum.CLOSED,
                failureCount: 0,
                lastFailureTime: 0,
                nextAttemptTime: Date.now() + config.timeout,
            });
        }
        return this.circuits.get(key)!;
    }

    private onSuccess(circuit: CircuitBreakerState, key: string): void {
        circuit.failureCount = 0;
        circuit.state = CircuitBreakerStateEnum.CLOSED;
        this.logger.log(`Circuit breaker SUCCESS for key: ${key}, state now is CLOSED`);
    }

    private onFailure(circuit: CircuitBreakerState, key: string, options: CircuitBreakerOptions): void {
        circuit.failureCount++;
        circuit.lastFailureTime = Date.now();
        if (circuit.failureCount >= options.failureThreshold) {
            circuit.state = CircuitBreakerStateEnum.OPEN;
            circuit.nextAttemptTime = Date.now() + options.resetTimeout;
            this.logger.warn(`Circuit breaker OPEN for ${key} after ${circuit.failureCount} failures, state: OPEN`)
        }
    }

    public getCircuitState(key: string): CircuitBreakerState | undefined {
        return this.circuits.get(key);
    }

    public getAllCircuits(): Map<string, CircuitBreakerState> {
        return new Map(this.circuits);
    }

    public resetCircuit(key: string): void {
        this.circuits.delete(key);
        this.logger.log(`Circuit breaker reset for key: ${key}`);
    }
}
