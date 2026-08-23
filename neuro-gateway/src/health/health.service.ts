import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
    getReadyStatus() {
        return { status: 'ready', timestamp: new Date().toISOString() };
    }

    getLiveStatus() {
        return { status: 'live', timestamp: new Date().toISOString() };
    }
}
