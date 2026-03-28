import fastify from "fastify";
import { ZodError } from "zod";
import { env } from "./env/index.js";
import { userRoutes } from "./http/controllers/users/routes.js";
import fastifyJwt from "@fastify/jwt";
import fastifyCookie from "@fastify/cookie";
import { demandRoutes } from "./http/controllers/demands/routes.js";
import { usersOnDemandsRoutes } from "./http/controllers/users-on-demands/routes.js";
import fastifyCors from "@fastify/cors";
import { shopsRoutes } from "./http/controllers/shops/routes.js";

//*********INSTANCIA DA APLICAÇÃO COM CONFIGS DO SERVIDOR*********//
export const app = fastify()

app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    cookie: {
        cookieName: 'refreshToken',
        signed: false, // estou definindo que o cookie não será assinado, nn tem o processo de hashing
    },
    sign:{
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
app.register(demandRoutes)
app.register(usersOnDemandsRoutes)
app.register(shopsRoutes)

//*********HANDLER DE ERROS*********//
app.setErrorHandler((error, _request, reply)=>{
    if (error instanceof ZodError){
        console.log(error.format())
        return reply
        .status(400)
        .send({message: 'Validation error', issues: error.format()})
    }
    if (env.NODE_ENV !== "production"){
        
        return reply.status(error.statusCode ?? 400).send({message: error.message})

    }

    return reply.status(500).send({message: 'Internal Server Error'})
})