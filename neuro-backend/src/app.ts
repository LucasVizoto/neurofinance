import fastify from "fastify";
import { ZodError } from "zod";
import { env } from "./env/index.js";
import { userRoutes } from "./http/controllers/users/routes.js";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";

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

//*********REGISTRO DE ROTAS*********//
app.register(userRoutes)


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