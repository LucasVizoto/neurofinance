export enum CircuitBreakerStateEnum {
    CLOSED = 'CLOSED',
    OPEN = 'OPEN',
    HALF_OPEN = 'HALF_OPEN',
}

export interface CircuitBreakerOptions {
    failureThreshold: number; // The number of failures before opening the circuit
    timeout: number; // The time (in milliseconds) to wait before trying to close the circuit again
    resetTimeout: number; // The time (in milliseconds) to wait before resetting the failure count
}

export interface CircuitBreakerState {
    state: CircuitBreakerStateEnum;
    failureCount: number; // The number of consecutive failures
    lastFailureTime: number; // The timestamp of the last failure
    nextAttemptTime: number; // The timestamp when the next attempt to close the circuit will be made
}

export interface CircuitBreakerResult<T> {
    success: boolean;
    data?: T; // The result of the successful operation
    error?: Error; // The error that occurred during the operation
    fromCache?: boolean; // Indicates if the result was returned from cache or fallback
}