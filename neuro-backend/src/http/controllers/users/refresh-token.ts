import type { FastifyRequest, FastifyReply } from 'fastify'

export async function refresh (request: FastifyRequest, reply: FastifyReply) {
    
    await request.jwtVerify({
        onlyCookie: true,
    }) //validando o token que está no cookie e não no authorization
    
   
        const {role} = request.user

        const token = await reply.jwtSign(
            {
                role,
            },
            {
                sign: {
                    sub: request.user.sub,
                },
            },
        )

        const refreshToken = await reply.jwtSign(
            {
                role,
            },
            {
                sign: {
                    sub: request.user.sub,
                    expiresIn: '7d', //estou indicando que se meu usuário não logar em 7 dias será necessário renovar o token
                },
            },
        )

        return reply
        .setCookie('refreshToken', refreshToken, {
          path: '/', //estou definindo quais as rotas do backend terão acesso ao cookie
          secure: true, // estou dizes se o cookie só pode ser enviado em conexões https
          sameSite: true, // estou definindo que o cookie só pode ser enviado para o mesmo domínio
          httpOnly: true, // estou definindo que o cookie não pode ser acessado via javascript no frontend  
        })
        .status(200)
        .send({
            token,
        })

}