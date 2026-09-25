import {
    Injectable,
    Logger,
    OnModuleDestroy,
    ServiceUnavailableException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import amqp, { Channel, ChannelModel, ConsumeMessage } from 'amqplib';

export type RpcResponse = {
    status: number;
    body: unknown;
};

export class RpcHttpError extends Error {
    response: { status: number; data: unknown };

    constructor(status: number, data: unknown) {
        super(`RPC respondeu ${status}`);
        this.response = { status, data };
    }
}

type Pending = {
    resolve: (value: RpcResponse) => void;
    reject: (reason: Error) => void;
    timer: NodeJS.Timeout;
};

const EXCHANGE = process.env.RABBITMQ_EXCHANGE || 'neurofinance.topic';

export function isAmqpMessaging(): boolean {
    return (process.env.MESSAGING || 'http').toLowerCase() === 'amqp';
}

@Injectable()
export class RpcClientService implements OnModuleDestroy {
    private readonly logger = new Logger(RpcClientService.name);
    private connection: ChannelModel | null = null;
    private channel: Channel | null = null;
    private connecting: Promise<void> | null = null;
    private readonly pending = new Map<string, Pending>();

    async onModuleDestroy() {
        for (const [id, pending] of this.pending) {
            clearTimeout(pending.timer);
            pending.reject(new Error('Cliente RPC encerrado'));
            this.pending.delete(id);
        }
        await this.channel?.close().catch(() => undefined);
        await this.connection?.close().catch(() => undefined);
        this.channel = null;
        this.connection = null;
    }

    async request(routingKey: string, message: unknown, timeoutMs: number): Promise<unknown> {
        const channel = await this.getChannel();
        const correlationId = randomUUID();

        const response = await new Promise<RpcResponse>((resolve, reject) => {
            const timer = setTimeout(() => {
                this.pending.delete(correlationId);
                reject(new Error(`Timeout RPC (${timeoutMs}ms) em ${routingKey}`));
            }, timeoutMs);

            this.pending.set(correlationId, { resolve, reject, timer });

            const published = channel.publish(
                EXCHANGE,
                routingKey,
                Buffer.from(JSON.stringify(message)),
                {
                    correlationId,
                    replyTo: 'amq.rabbitmq.reply-to',
                    contentType: 'application/json',
                    deliveryMode: 2,
                    expiration: String(timeoutMs),
                },
            );

            if (!published) {
                clearTimeout(timer);
                this.pending.delete(correlationId);
                reject(new Error('Buffer de publicação do RabbitMQ está cheio'));
            }
        });

        if (response.status >= 400) {
            throw new RpcHttpError(response.status, response.body);
        }

        return response.body;
    }

    private async getChannel(): Promise<Channel> {
        if (this.channel) {
            return this.channel;
        }
        if (!this.connecting) {
            this.connecting = this.connect();
        }
        await this.connecting;
        this.connecting = null;
        if (!this.channel) {
            throw new ServiceUnavailableException('Canal RabbitMQ indisponível');
        }
        return this.channel;
    }

    private async connect() {
        const url = process.env.RABBITMQ_URL;
        if (!url) {
            throw new ServiceUnavailableException('RABBITMQ_URL não configurada');
        }

        const connection = await amqp.connect(url);
        connection.on('error', (error) => {
            this.logger.error(`Conexão RabbitMQ: ${error.message}`);
        });
        connection.on('close', () => {
            this.connection = null;
            this.channel = null;
            this.failPending(new Error('Conexão RabbitMQ fechada'));
        });

        const channel = await connection.createChannel();
        await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
        await channel.consume(
            'amq.rabbitmq.reply-to',
            (msg) => this.onReply(msg),
            { noAck: true },
        );

        this.connection = connection;
        this.channel = channel;
        this.logger.log('Cliente RPC conectado ao RabbitMQ');
    }

    private onReply(msg: ConsumeMessage | null) {
        if (!msg) {
            return;
        }
        const correlationId = msg.properties.correlationId as string | undefined;
        if (!correlationId) {
            return;
        }
        const pending = this.pending.get(correlationId);
        if (!pending) {
            return;
        }
        clearTimeout(pending.timer);
        this.pending.delete(correlationId);
        try {
            pending.resolve(JSON.parse(msg.content.toString()) as RpcResponse);
        } catch {
            pending.reject(new Error('Resposta RPC inválida'));
        }
    }

    private failPending(error: Error) {
        for (const [id, pending] of this.pending) {
            clearTimeout(pending.timer);
            pending.reject(error);
            this.pending.delete(id);
        }
    }
}
