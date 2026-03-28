import type { FastifyReply, FastifyRequest } from "fastify";

/**
 * Middleware responsável por validar o token JWT presente na requisição.
 *
 * ---
 *
 * ### Objetivo
 * Garantir que apenas usuários autenticados possam acessar rotas protegidas, validando o
 * token enviado através dos headers da requisição.
 *
 * ---
 *
 * ### Funcionamento
 * **verifyJWT(request, reply):**
 * - Invoca o método `request.jwtVerify()` para validar o token JWT.
 * - Caso o token seja válido, a execução da rota continua normalmente.
 * - Se o token estiver ausente, expirado ou inválido, captura o erro e interrompe o fluxo,
 *   retornando uma resposta **401 (Unauthorized)** com uma mensagem indicando ausência de
 *   autorização.
 *
 * ---
 *
 */
export async function verifyJWT(request: FastifyRequest, reply: FastifyReply) {
    try{
        await request.jwtVerify()
    } catch (err){
        return reply.status(401).send({
            message: 'Unathorized'
        })
    }
}