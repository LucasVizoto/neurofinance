import json
import os
import threading
import traceback

import pika


EXCHANGE = os.getenv("RABBITMQ_EXCHANGE", "neurofinance.topic")
QUEUE = os.getenv("RABBITMQ_QUEUE_LEARNING", "neuro.learning.rpc")
PREFETCH = int(os.getenv("RABBITMQ_PREFETCH_LEARNING", "1"))


def _dispatch(app, body: dict):
    method = (body.get("method") or "GET").upper()
    path = body.get("path") or "/"
    payload = body.get("payload")
    headers = body.get("headers") or {}
    authorization = headers.get("authorization") or headers.get("Authorization")

    request_headers = {}
    if authorization:
        request_headers["Authorization"] = authorization

    with app.test_client() as client:
        response = client.open(
            path,
            method=method,
            json=payload if method not in ("GET", "DELETE") else None,
            headers=request_headers,
        )

    parsed = response.get_json(silent=True)
    if parsed is None:
        parsed = response.get_data(as_text=True)
    return {"status": response.status_code, "body": parsed}


def _consume():
    from app import app

    url = os.getenv("RABBITMQ_URL")
    if not url:
        print("[rabbitmq] MESSAGING=amqp exige RABBITMQ_URL")
        return

    params = pika.URLParameters(url)
    params.heartbeat = 30
    connection = pika.BlockingConnection(params)
    channel = connection.channel()
    channel.exchange_declare(exchange="neurofinance.dlx", exchange_type="fanout", durable=True)
    channel.queue_declare(queue="neurofinance.dlq", durable=True)
    channel.queue_bind(queue="neurofinance.dlq", exchange="neurofinance.dlx", routing_key="")
    channel.exchange_declare(exchange=EXCHANGE, exchange_type="topic", durable=True)
    channel.queue_declare(
        queue=QUEUE,
        durable=True,
        arguments={"x-dead-letter-exchange": "neurofinance.dlx"},
    )
    channel.queue_bind(queue=QUEUE, exchange=EXCHANGE, routing_key="learning.#")
    channel.basic_qos(prefetch_count=PREFETCH)

    def on_message(ch, method, properties, body):
        try:
            request = json.loads(body.decode("utf-8"))
            result = _dispatch(app, request)
            if properties.reply_to:
                ch.basic_publish(
                    exchange="",
                    routing_key=properties.reply_to,
                    properties=pika.BasicProperties(
                        correlation_id=properties.correlation_id,
                        content_type="application/json",
                    ),
                    body=json.dumps(result).encode("utf-8"),
                )
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception:
            traceback.print_exc()
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    channel.basic_consume(queue=QUEUE, on_message_callback=on_message)
    print(f"[rabbitmq] consumidor escutando {QUEUE}")
    channel.start_consuming()


def start_learning_consumer():
    if os.getenv("MESSAGING", "http").lower() != "amqp":
        print("[rabbitmq] MESSAGING=http — consumidor do learning desligado")
        return
    thread = threading.Thread(target=_consume, name="rabbitmq-consumer", daemon=True)
    thread.start()
