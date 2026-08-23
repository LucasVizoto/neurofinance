import type { FastifyInstance } from "fastify";
import { verifyJWT } from "@/http/middlewares/verify-jwt.js";
import { createChat } from "./create-chat.js";
import { deleteChat } from "./delete-chat.js";
import { findById } from "./find-by-id.js";
import { findByMongoId } from "./find-by-mongo-id.js";
import { findByUserId } from "./find-by-user-id.js";

export function chatRoutes(app: FastifyInstance) {
    app.post('/chats', { onRequest: [verifyJWT] }, createChat)
    app.delete('/chats/:id', { onRequest: [verifyJWT] }, deleteChat)
    app.get('/chats/:id', { onRequest: [verifyJWT] }, findById)
    app.get('/chats/mongo/:mongoId', { onRequest: [verifyJWT] }, findByMongoId)
    app.get('/chats/user/:userId', { onRequest: [verifyJWT] }, findByUserId)
}
