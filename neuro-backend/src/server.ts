import { app } from "./app.js";
import { env } from "./env/index.js";
import { startBackendConsumer } from "./messaging/consumer.js";

app.listen({
    host: '0.0.0.0',
    port: env.PORT,
}).then(() =>{
    console.log('🚀 HTTP server running');
    startBackendConsumer().catch((error) => {
        console.error('[rabbitmq] consumidor não iniciou', error);
    });
})