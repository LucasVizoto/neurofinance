import type { FastifyInstance } from "fastify";
import { register } from "./register.js";
import { findUserByUsername } from "./find-by-username.js";
import { findUserById } from "./find-by-id.js";
import { authenticate } from "./authenticate.js";
import { authenticateGoogle } from "./authenticate-google.js";
import { refresh } from "./refresh-token.js";
import { verifyJWT } from "@/http/middlewares/verify-jwt.js";
import { editUser } from "./edit-user.js";
import { updateProfile } from "./update-profile.js";
import { changeUserStatus } from "./change-user-status.js";
import { changeUserPreferences } from "./change-preferences.js";

export function userRoutes(app: FastifyInstance) {

    /** CRUD USERS */
    app.post('/users', register)
    app.put('/users', { onRequest: [verifyJWT] }, editUser)
    app.put('/users/profile', { onRequest: [verifyJWT] }, updateProfile)
    app.get('/me', { onRequest: [verifyJWT] }, findUserById)
    app.patch('/users/status', { onRequest: [verifyJWT] }, changeUserStatus)
    app.patch('/users/preferences', { onRequest: [verifyJWT] }, changeUserPreferences)

    /** User Getters */
    app.get('/me/byusername/:username', { onRequest: [verifyJWT] }, findUserByUsername)

    /** Token */
    app.post('/auth', authenticate)
    app.post('/auth/google', authenticateGoogle)
    app.patch('/token/refresh', refresh)




}