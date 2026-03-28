import type { FastifyRequest, FastifyReply } from 'fastify'
import {z} from 'zod'
import { UserAlreadyExistsError } from '@/use-cases/_errors/user-already-exists-error.js'
import { makeRegisterUseCase } from '@/use-cases/users/composers/make-register-use-case.js'

/**
 * Controller responsável por lidar com a rota de registro de novos usuários.
 *
 * ---
 *
 * ### Objetivo
 * Receber os dados enviados pelo cliente, validar o payload com Zod, acionar o caso de uso de
 * registro (`RegisterUseCase`) e retornar uma resposta apropriada conforme o resultado da operação.
 *
 * ---
 *
 * ### Funcionamento
 * **register(request, reply):**
 * - Valida o corpo da requisição utilizando um schema Zod, garantindo que todos os campos
 *   necessários (`zendesk_user_id`, `fullname`, `phone`, `username`, `email`, `password`)
 *   sejam fornecidos e estejam no formato correto.
 * - Obtém uma instância do caso de uso de registro através da factory `makeRegisterUseCase()`.
 * - Executa o caso de uso enviando os dados recebidos, incluindo o `status` padrão como `true`.
 * - Em caso de sucesso, retorna a resposta **201 (Created)** contendo o usuário recém-criado.
 * - Caso seja detectado um e-mail já registrado, captura a exceção `UserAlreadyExistsError` 
 *   e retorna uma resposta **409 (Conflict)** com mensagem apropriada.
 * - Para qualquer outro erro, o problema é propagado para o handler global do Fastify.
 *
 * ---
 *
 */
export async function register (request: FastifyRequest, reply: FastifyReply) {
    const registerBodySchema = z.object({
        zendesk_user_id: z.number(),
        fullname: z.string(),
        phone: z.string(),
        username: z.string(),
        email: z.string().email(),
        password: z.string().min(6),
    })

    const { zendesk_user_id, fullname, phone, username, email, password} = registerBodySchema.parse(request.body)
    
    try{
        
        const registerUseCase  = makeRegisterUseCase()
        
        const {user} = await registerUseCase.execute({
            zendesk_user_id,
            fullname,
            username,
            phone,
            status:true,
            email,
            password
        })

        return reply.status(201).send({
            ...user,
            password: undefined
        })
        
    } catch (err){
        if(err instanceof UserAlreadyExistsError){
            return reply.status(409).send({message: err.message})
        }
        
        throw err
    }
}