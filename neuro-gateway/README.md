# neuro-gateway

BFF (Backend for Frontend) do **NeuroFinance**. É a única API que o browser deve chamar. Autentica, aplica rate limit, documenta no Swagger e faz proxy para `neuro-backend` e `neuro-learning`.

## Função no sistema

```
Browser  →  neuro-gateway:3005  →  neuro-backend:3001   (users, chats, JWT)
                             └→  neuro-learning:5000  (IA, ML, dashboard)
```

- Valida JWT nas rotas privadas (`JwtAuthGuard`)
- Login e-mail/senha e OAuth Google (o Google **não** fala com o backend)
- Circuit breaker + timeout nas chamadas aos microsserviços
- Swagger em `/api`

Não persiste dados de negócio. Usuários e chats ficam no backend; mensagens e cotações no learning.

## Stack

- NestJS 11, Passport JWT, Helmet, Throttler
- `@nestjs/axios` para o proxy
- Swagger (`@nestjs/swagger`) com tema próprio em `src/swagger/`

## Fluxos principais

**Login e-mail/senha** — `POST /auth/login` → backend `POST /auth` → devolve JWT.

**Cadastro** — `POST /auth/register` → backend `POST /users`.

**Google OAuth**

1. `GET /auth/google` redireciona ao Google
2. `GET /auth/google/callback` troca o `code`, chama `POST /auth/google` no backend (find-or-create)
3. Redireciona o frontend para `/login/callback?token=`

O `GOOGLE_CALLBACK_URL` tem que ser **idêntico** a um Authorized redirect URI no Google Cloud Console (local: `http://localhost:3005/auth/google/callback`).

**Dashboard / chat / predição** — rotas `/ai/*` autenticadas, proxy para o Flask.

## API pública (porta 3005)

Documentação interativa: [http://localhost:3005/api](http://localhost:3005/api)

| Método | Rota | Auth | Destino |
|---|---|---|---|
| `POST` | `/auth/login` | não | backend `/auth` |
| `POST` | `/auth/register` | não | backend `/users` |
| `GET` | `/auth/google` | não | Google OAuth |
| `GET` | `/auth/google/callback` | não | Google → frontend |
| `GET` | `/me` | JWT | backend `/me` |
| `PUT` | `/users/profile` | JWT | backend (multipart avatar) |
| `POST` | `/chats` | JWT | backend; máximo 5 chats |
| `GET` | `/chats/user/:userId` | JWT | backend |
| `GET` | `/chats/:id` | JWT | backend |
| `DELETE` | `/chats/:id` | JWT | backend |
| `POST` | `/ai/predict` | JWT | learning `/predict` |
| `POST` | `/ai/analyze` | JWT | learning `/analyze` |
| `POST` | `/ai/chat` | JWT | learning `/chat` |
| `GET` | `/ai/chat/:mongoId` | JWT | learning `/chat/:id` |
| `GET` | `/ai/dashboard` | JWT | learning `/dashboard` |
| `GET` | `/ai/dashboard/quotes` | JWT | learning |
| `GET` | `/ai/dashboard/growth` | JWT | learning |
| `GET` | `/ai/dashboard/valuations` | JWT | learning |
| `GET` | `/ai/dashboard/news` | JWT | learning |
| `GET` | `/health` | não | liveness do gateway |
| `GET` | `/health/services` | não | ping nos microsserviços |
| `GET` | `/health/ready` | não | readiness |
| `GET` | `/health/live` | não | liveness |

Timeouts em `src/config/gateway.config.ts`: users ~160s, AI 30s.

## Variáveis de ambiente

Copie `.env.example` para `.env`.

| Variável | Obrigatória | Local | Docker |
|---|---|---|---|
| `PORT` | não (default 3005) | `3005` | `3005` |
| `JWT_SECRET` | sim | igual ao backend | igual ao backend |
| `USERS_SERVICE_URL` | sim | `http://localhost:3001` | `http://neuro-backend:3001` |
| `AI_SERVICE_URL` | sim | `http://localhost:5000` | `http://neuro-learning:5000` |
| `CORS_ORIGIN` | sim | `http://localhost:3000` | URL pública do frontend |
| `FRONTEND_URL` | sim | `http://localhost:3000` | URL pública do frontend |
| `GOOGLE_CLIENT_ID` | para OAuth | Console Google | idem |
| `GOOGLE_CLIENT_SECRET` | para OAuth | Console Google | idem |
| `GOOGLE_CALLBACK_URL` | para OAuth | `http://localhost:3005/auth/google/callback` | `http://SEU_HOST:3005/auth/google/callback` |

O nome correto da env do backend é `USERS_SERVICE_URL` (não `USER_SERVICE_URL`).

Authorized JavaScript origins no Console: `http://localhost:3000` e `http://localhost:3005`.

## Como rodar (local)

Pré-requisitos: Node 22, `neuro-backend` e `neuro-learning` no ar (ou o gateway marca os health checks como unhealthy).

```bash
cd neuro-gateway
cp .env.example .env
# JWT_SECRET igual ao backend
# USERS_SERVICE_URL=http://localhost:3001
# AI_SERVICE_URL=http://localhost:5000

npm install
npm run start:dev
```

- API: http://localhost:3005
- Swagger: http://localhost:3005/api

Produção local:

```bash
npm run build
npm run start:prod
```

## Como rodar (Docker)

Na raiz do monorepo:

```bash
cp .env.example .env
docker compose up -d --build neuro-gateway
```

O Compose só sobe o gateway depois de backend e learning healthy. Porta publicada: **3005**.

## Testes

```bash
npm test
npm run test:e2e
npm run test:cov
```

## Dependências

- **neuro-backend** — usuários, JWT, chats
- **neuro-learning** — dashboard, chat com Gemini, predição
- **Google Cloud Console** — só se for usar OAuth
