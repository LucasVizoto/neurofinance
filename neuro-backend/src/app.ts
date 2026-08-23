import fastify from "fastify";
import { ZodError } from "zod";
import { env } from "./env/index.js";
import { userRoutes } from "./http/controllers/users/routes.js";
import { chatRoutes } from "./http/controllers/chats/routes.js";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";

//*********INSTANCIA DA APLICAÇÃO COM CONFIGS DO SERVIDOR*********//
export const app = fastify()

app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
        cookieName: 'refreshToken',
        signed: false, // estou definindo que o cookie não será assinado, nn tem o processo de hashing
    },
    sign: {
        expiresIn: '50m',
    }
})

// Cookie
app.register(fastifyCookie)

//CORS
app.register(fastifyCors, {
    origin: true,
    credentials: true,
})

app.register(fastifyMultipart, {
    limits: {
        fileSize: 2 * 1024 * 1024,
        files: 1,
    },
})

app.get('/health', async () => ({
    status: 'ok',
    service: 'neuro-backend',
}))

//*********REGISTRO DE ROTAS*********//
app.register(userRoutes)
app.register(chatRoutes)


//*********HANDLER DE ERROS*********//
app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
        console.log(error.format())
        return reply
            .status(400)
            .send({ message: 'Validation error', issues: error.format() })
    }
    return reply.status(500).send({
        message: 'Internal Server Error'
    })
})