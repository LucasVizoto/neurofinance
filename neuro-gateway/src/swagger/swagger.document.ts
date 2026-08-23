import { DocumentBuilder } from '@nestjs/swagger';

export function buildSwaggerConfig() {
    return new DocumentBuilder()
        .setTitle('NeuroFinance API')
        .setDescription(
            `
Plataforma de inteligência financeira com autenticação JWT, análise de ativos e chat conversacional.

## Como autenticar
1. Faça login em \`POST /auth/login\` ou inicie o Google em \`GET /auth/google\`.
2. Copie o campo \`token\` da resposta (ou o token devolvido no callback).
3. Clique em **Authorize** e informe o JWT. Rotas protegidas usam \`Authorization: Bearer <token>\`.

## Serviços por trás do gateway
- **Users** — contas, perfil e chats em \`localhost:3001\`
- **AI** — cotações, ML e Gemini em \`localhost:5000\`
- **Frontend** — interface NeuroFinance em \`localhost:3000\`

O ticker padrão da dashboard vem de \`preferenceTicker\` no perfil. Se o campo estiver vazio, o frontend usa \`AAPL\`.
            `.trim(),
        )
        .setVersion('1.1')
        .setContact("Vizoto's Team", 'https://lucasvizoto.com', 'lucasvizoto364@gmail.com')
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addServer('http://localhost:3005', 'Gateway local')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Cole o JWT retornado em POST /auth/login',
                in: 'header',
            },
            'JWT-auth',
        )
        .addTag('Authentication', 'Login, cadastro e OAuth 2.0 do Google')
        .addTag('Users', 'Perfil autenticado, ticker preferido e avatar')
        .addTag('Chats', 'Conversas com o agente (máximo de 5 por usuário)')
        .addTag('Dashboard', 'Cotações, gráficos, valuations e notícias')
        .addTag('AI & Machine Learning', 'Predição ML, análise estruturada e chat Gemini')
        .addTag('Health', 'Saúde do gateway e dos microserviços')
        .build();
}
