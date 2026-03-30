import type { FastifyInstance } from "fastify";
import { register } from "./register.js";
import { findUserByUsername } from "./find-by-username.js";
import { findUserById } from "./find-by-id.js";
import { authenticate } from "./authenticate.js";
import { refresh } from "./refresh-token.js";
import { verifyJWT } from "@/http/middlewares/verify-jwt.js";
import { editUser } from "./edit-user.js";
import { changeUserStatus } from "./change-user-status.js";

export function userRoutes(app: FastifyInstance) {

    /** CRUD USERS */
    app.post('/users', register)
    app.put('/users', { onRequest: [verifyJWT] }, editUser)
    app.get('/me', { onRequest: [verifyJWT] }, findUserById)
    app.patch('/users/status', { onRequest: [verifyJWT] }, changeUserStatus)

    /** User Getters */
    app.get('/me/byusername/:username', { onRequest: [verifyJWT] }, findUserByUsername)

    /** Token */
    app.post('/auth', authenticate)
    app.patch('/token/refresh', refresh)




}