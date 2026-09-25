import amqp, { type ConsumeMessage } from 'amqplib'
import { app } from '../app.js'
import { env } from '../env/index.js'

const QUEUE_ARGS = {
    'x-dead-letter-exchange': 'neurofinance.dlx',
}

function headerValue(headers: Record<string, unknown> | undefined, name: string): string | undefined {
    if (!headers) {
        return undefined
    }
    const value = headers[name] ?? headers[name.toLowerCase()]
    if (Array.isArray(value)) {
        return value[0] ? String(value[0]) : undefined
    }
    return value ? String(value) : undefined
}

async function handleMessage(raw: ConsumeMessage) {
    const request = JSON.parse(raw.content.toString()) as {
        method?: string
        path?: string
        payload?: unknown
        headers?: Record<string, unknown>
    }

    const method = (request.method || 'GET').toUpperCase()
    const path = request.path || '/'
    const authorization = headerValue(request.headers, 'authorization')
    const injectHeaders: Record<string, string> = {}
    if (authorization) {
        injectHeaders.authorization = authorization
    }

    const hasBody = request.payload !== undefined && request.payload !== null && method !== 'GET' && method !== 'DELETE'
    if (hasBody) {
        injectHeaders['content-type'] = 'application/json'
    }

    const response = await app.inject({
        method: method as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
        url: path,
        headers: injectHeaders,
        ...(hasBody ? { payload: request.payload as object } : {}),
    })

    const contentType = String(response.headers['content-type'] ?? '')
    let body: unknown = response.body
    if (contentType.includes('application/json') && response.body) {
        try {
            body = JSON.parse(response.body)
        } catch {
            body = response.body
        }
    }

    return { status: response.statusCode, body }
}

export async function startBackendConsumer() {
    if (env.MESSAGING !== 'amqp') {
        console.log('[rabbitmq] MESSAGING=http — consumidor do backend desligado')
        return
    }
    if (!env.RABBITMQ_URL) {
        console.error('[rabbitmq] MESSAGING=amqp exige RABBITMQ_URL')
        return
    }

    const connection = await amqp.connect(env.RABBITMQ_URL)
    const channel = await connection.createChannel()
    await channel.assertExchange('neurofinance.dlx', 'fanout', { durable: true })
    await channel.assertQueue('neurofinance.dlq', { durable: true })
    await channel.bindQueue('neurofinance.dlq', 'neurofinance.dlx', '')
    await channel.assertExchange(env.RABBITMQ_EXCHANGE, 'topic', { durable: true })
    await channel.assertQueue(env.RABBITMQ_QUEUE_BACKEND, {
        durable: true,
        arguments: QUEUE_ARGS,
    })
    await channel.bindQueue(env.RABBITMQ_QUEUE_BACKEND, env.RABBITMQ_EXCHANGE, 'backend.#')
    await channel.prefetch(env.RABBITMQ_PREFETCH_BACKEND)

    await channel.consume(env.RABBITMQ_QUEUE_BACKEND, async (msg) => {
        if (!msg) {
            return
        }
        try {
            const result = await handleMessage(msg)
            channel.sendToQueue(
                msg.properties.replyTo,
                Buffer.from(JSON.stringify(result)),
                { correlationId: msg.properties.correlationId, contentType: 'application/json' },
            )
            channel.ack(msg)
        } catch (error) {
            console.error('[rabbitmq] falha ao processar mensagem', error)
            channel.nack(msg, false, false)
        }
    })

    console.log(`[rabbitmq] consumidor escutando ${env.RABBITMQ_QUEUE_BACKEND}`)
}
