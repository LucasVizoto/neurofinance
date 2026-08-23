# neuro-backend

API de usuários, autenticação JWT e metadados de chat do **NeuroFinance**. É o serviço de domínio (Postgres + Prisma). O frontend **não** chama este serviço direto: o tráfego entra pelo `neuro-gateway`.

## Função no sistema

| Responsabilidade | Detalhe |
|---|---|
| Contas | Cadastro, login e-mail/senha, login Google (perfil já verificado pelo gateway), refresh token, perfil e avatar |
| Preferências | Tema, ticker padrão da dashboard (`preferenceTicker`) |
| Chats | CRUD no Postgres; cada conversa guarda um `mongo_id` que aponta o histórico no Mongo (persistido pelo `neuro-learning`) |
| Auth | Emite JWT (`@fastify/jwt`). O mesmo `JWT_SECRET` precisa ser usado no gateway |

Não conecta no Mongo. Só armazena o `mongo_id` em `chats` para o gateway/AI localizarem a conversa.

## Stack

- Node.js 22, TypeScript, Fastify 5
- Prisma 6 + PostgreSQL
- Zod para validação de env e payloads
- Supabase Storage (opcional) para avatares
- Vitest (unit + e2e)

## Arquitetura interna

```
src/
  http/controllers/   rotas HTTP (users, chats)
  use-cases/          regras de negócio
  repositories/       Prisma + in-memory (testes)
  lib/prisma.ts       client gerado em src/generated/prisma
  env/index.ts        schema Zod das variáveis
```

Padrão: controller → use-case → repository. Testes unitários usam repositórios in-memory.

### Modelos Prisma

- `users` — conta, `googleId` opcional, `cpf` opcional, `preferenceTicker`, URL do avatar
- `chats` — `userId`, `mongo_id`, `initialContext`, soft delete; limite de **5 chats ativos** por usuário

## API

Porta padrão no código: `3333`. No Docker e no gateway o combinado é **`3001`**.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `GET` | `/health` | não | Liveness |
| `POST` | `/users` | não | Cadastro |
| `POST` | `/auth` | não | Login e-mail/senha |
| `POST` | `/auth/google` | não | Find-or-create a partir do perfil Google |
| `PATCH` | `/token/refresh` | cookie | Renova JWT |
| `GET` | `/me` | JWT | Perfil do token |
| `PUT` | `/users/profile` | JWT | Atualiza perfil + avatar (multipart) |
| `PUT` | `/users` | JWT | Edição de usuário |
| `PATCH` | `/users/status` | JWT | Ativa/desativa |
| `PATCH` | `/users/preferences` | JWT | Preferências |
| `POST` | `/chats` | JWT | Cria chat (gera `mongo_id`) |
| `GET` | `/chats/:id` | JWT | Busca por id |
| `GET` | `/chats/mongo/:mongoId` | JWT | Busca por `mongo_id` |
| `GET` | `/chats/user/:userId` | JWT | Lista do usuário |
| `DELETE` | `/chats/:id` | JWT | Remove chat |

## Variáveis de ambiente

Copie `.env.example` para `.env`.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NODE_ENV` | sim | `dev`, `test` ou `production` |
| `DATABASE_URL` | sim | Postgres. Local: host `localhost` e porta publicada. Docker: host `postgres-db` e porta `5432` |
| `JWT_SECRET` | sim | Precisa ser **igual** ao do gateway |
| `PORT` | não | Default `3333`. Use `3001` para alinhar com o gateway |
| `SUPABASE_URL` | não | Storage de avatares |
| `SUPABASE_SERVICE_ROLE_KEY` | não | Chave service role (não use a anon no servidor) |
| `SUPABASE_AVATAR_BUCKET` | não | Default `avatars` |

Exemplos de `DATABASE_URL`:

```text
# desenvolvimento local (compose em neuro-backend/docker-compose.yaml publica 5436)
postgresql://admin:123456@localhost:5436/postgresql?schema=public

# stack Docker na raiz (serviço postgres-db)
postgresql://neuro:SENHA@postgres-db:5432/neuro-backend?schema=public
```

## Como rodar (local)

Pré-requisitos: Node 22, PostgreSQL acessível.

```bash
cd neuro-backend
cp .env.example .env
# preencha DATABASE_URL, JWT_SECRET e PORT=3001

npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Postgres só para este serviço (porta host `5436`):

```bash
docker compose -f docker-compose.yaml up -d
```

O servidor escuta em `0.0.0.0`. Sem `PORT` no `.env`, sobe em `http://localhost:3333`.

### Produção (sem Compose da raiz)

```bash
npx prisma generate
npx prisma migrate deploy
npm run build
npm start
```

`npm start` executa `node build/server.cjs`.

## Como rodar (Docker)

Na **raiz** do monorepo o `docker-compose.yml` sobe Postgres, aplica `prisma migrate deploy` e inicia o backend na rede `neuro-network`.

```bash
cp .env.example .env   # na raiz do TCC-NeuroFinance
docker compose up -d --build neuro-backend
```

O container espera `postgres-db` healthy. Não publique a porta `3001` no host: o gateway fala com `http://neuro-backend:3001`.

## Testes

```bash
npm test            # unitários
npm run test:e2e    # e2e (precisa DATABASE_URL de teste)
npm run test:watch
npm run test:coverage
```

## Dependências

- **PostgreSQL** — obrigatório
- **neuro-gateway** — consumidor HTTP (login, perfil, chats)
- **neuro-learning** — não chama este serviço; só compartilha o `mongo_id` das conversas
- **Supabase** — opcional; sem as vars, upload de avatar falha de forma controlada
