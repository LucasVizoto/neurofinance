# 🧠 TCC NeuroFinance — Inteligência Artificial para o Mercado

O nome **NeuroFinance** une o raciocínio de um agente de IA ao acompanhamento de ativos: a plataforma reúne dashboard de cotações, chat conversacional e modelos quantitativos em um único fluxo, pensado como trabalho de conclusão de curso.

O browser fala **apenas** com o API Gateway. Usuários e metadados de chat vivem no PostgreSQL; o histórico das conversas e o cache de mercado ficam no MongoDB. A documentação detalhada de cada microsserviço está nos READMEs internos:

- [`neuro-backend/README.md`](./neuro-backend/README.md)
- [`neuro-gateway/README.md`](./neuro-gateway/README.md)
- [`neuro-learning/README.md`](./neuro-learning/README.md)
- [`neuro-frontend/README.md`](./neuro-frontend/README.md)

####
---
# 🛠️ Stack do Projeto

### Backend (`neuro-backend`)
- **Node.js 22** + **Fastify** — Servidor HTTP de alta performance
- **TypeScript** — Tipagem estática
- **Prisma** — ORM com migrations gerenciadas
- **PostgreSQL 15** — Banco relacional (usuários e chats)
- **Zod** — Validação de schemas e variáveis de ambiente
- **JWT** + **@fastify/cookie** — Access token e refresh token via cookie HttpOnly
- **@fastify/multipart** — Upload de avatar
- **Supabase Storage** — Armazenamento de imagens (opcional)
- **Vitest** — Testes unitários e e2e

### API Gateway (`neuro-gateway`)
- **NestJS 11** — BFF, proxy e autenticação de borda
- **Passport JWT** + **Helmet** + **Throttler** — Segurança e rate limit
- **Google OAuth 2.0** — Login social (o callback vive no gateway, não no backend)
- **Swagger** (`/api`) — Documentação interativa da API pública
- **Circuit breaker** — Isolamento de falhas nas chamadas aos microsserviços
- **Jest** — Testes unitários

### IA e mercado (`neuro-learning`)
- **Python 3.12** + **Flask** — API de predição, análise e dashboard
- **LangChain** + **Gemini** — Agente conversacional com memória
- **scikit-learn** / **PyTorch** — Pipeline quantitativo
- **Alpha Vantage** (fallback **yfinance**) — Cotações, histórico e notícias
- **MongoDB 6** — Histórico de chat e cache de mercado
- **Gunicorn** — Servidor WSGI na imagem Docker

### Frontend (`neuro-frontend`)
- **Next.js 15** + **React 18**
- **TypeScript**
- **MUI** + **TailwindCSS** — UI e tema NeuroFinance
- **Redux Toolkit** — Estado de usuário e chat
- **Axios** — Consumo da API do gateway
- **ApexCharts** — Gráficos da dashboard

### Infraestrutura
- **Docker** + **Docker Compose** — Orquestração na rede `neuro-network`
- **GitHub Actions** — CI de testes do backend

---

# 🏗️ Arquitetura

O sistema é um monorepo de microsserviços. O frontend nunca endereça Postgres, Mongo, Fastify ou Flask diretamente.

```
                    ┌─────────────────────┐
                    │   neuro-frontend    │
                    │   Next.js  :3000    │
                    └──────────┬──────────┘
                               │  JWT + HTTP
                    ┌──────────▼──────────┐
                    │   neuro-gateway     │
                    │   NestJS   :3005    │
                    └───┬────────────┬────┘
                        │            │
           ┌────────────▼──┐    ┌────▼──────────────┐
           │ neuro-backend │    │  neuro-learning   │
           │ Fastify :3001 │    │  Flask     :5000  │
           └──────┬────────┘    └────┬──────────────┘
                  │                  │
           ┌──────▼────────┐  ┌──────▼────────┐
           │  PostgreSQL   │  │    MongoDB    │
           │  users/chats  │  │ chat + cache  │
           └───────────────┘  └───────────────┘
```

O vínculo entre os dois bancos é o `mongo_id`: o backend gera o identificador ao criar a conversa; o learning usa o mesmo id como chave do histórico no Mongo.

### Backend — camadas

A API de domínio segue arquitetura em camadas, no mesmo espírito de um use-case isolado do framework:

```
neuro-backend/src/
├── http/
│   ├── controllers/         # Camada HTTP: valida o payload e devolve a resposta
│   │   ├── users/
│   │   └── chats/
│   └── middlewares/         # Autenticação JWT
├── use-cases/               # Regras de negócio; independentes do Fastify
│   ├── users/
│   └── chats/
├── repositories/            # Abstrações de persistência
│   ├── in-memory/           # Implementação para testes
│   └── prisma/              # Implementação com PostgreSQL
├── services/                # Auxiliares (upload de avatar no Supabase)
├── lib/                     # Prisma Client
└── env/                     # Validação Zod das variáveis de ambiente
```

O padrão **Factory** (`use-cases/**/composers`) instancia os use cases e injeta o repositório. O padrão **Repository** desacopla a regra de negócio do Prisma, o que permite os testes unitários com implementações in-memory.

### Gateway — borda

O NestJS concentra OAuth Google, validação de JWT, CORS, rate limit e o proxy para `USERS_SERVICE_URL` e `AI_SERVICE_URL`.
- Swagger: Para acessá-lo basta acessar a `/api` do Gateway. Caso esteja acessando localmente: http://localhost:3005/api.

### Learning — IA

O Flask expõe predição ML, análise (ML + Gemini) e os dados da dashboard. LangChain persiste a memória da conversa no Mongo; cotações repetidas passam pelo cache (`services/mongo_cache.py`).

---

## ⚙️ Rodando o projeto

Há dois caminhos: **Compose na raiz** (stack completo, inclusive VPS) ou **serviços isolados** para desenvolvimento.

### Clone o projeto

```bash
git clone https://github.com/LucasVizoto/neurofinance.git
cd neurofinance
```

---

### 🐳 Stack completa com Docker

Requisito: **Docker** + **Docker Compose**.

#### 1. Configure o `.env` da raiz

```bash
cp .env.example .env
```

Preencha pelo menos:

```env
POSTGRES_USER=neuro
POSTGRES_PASSWORD=change-me-strong-password
POSTGRES_DB=neuro-backend

JWT_SECRET=change-me-long-random-jwt-secret

NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_GATEWAY_URL=http://localhost:3005
FRONTEND_URL=http://localhost:3000
GOOGLE_CALLBACK_URL=http://localhost:3005/auth/google/callback
CORS_ORIGIN=http://localhost:3000

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

GEMINI_API_KEY=
ALPHAVANTAGE_API_KEY=
```

> **Google OAuth:** credenciais em [console.cloud.google.com](https://console.cloud.google.com/) → *APIs & Services* → *Credentials*. Redirect URI autorizado: `http://localhost:3005/auth/google/callback`. Origins: `http://localhost:3000` e `http://localhost:3005`.
>
> **Gemini / Alpha Vantage:** necessárias para chat, análise e dashboard completa. Sem elas o stack sobe, mas esses fluxos degradam.

As URLs de banco **não** vão no `.env` com `localhost`. O Compose monta `DATABASE_URL` com host `postgres-db` e `MONGO_URI` com host `mongo-db`.

`NEXT_PUBLIC_*` entra no **build** da imagem do frontend. Se mudar IP ou domínio da VPS, reconstrua o frontend.

#### 2. Suba tudo

```bash
docker compose up -d --build
```

| Superfície | URL |
|---|---|
| Aplicação / Front Local | http://localhost:3000 |
| Gateway / Swagger Local | http://localhost:3005/api |

O backend aplica `prisma migrate deploy` antes de subir. Postgres e Mongo não são publicados no host.

---

### 🔧 Desenvolvimento local (sem o Compose da raiz)

Útil para iterar em um serviço só. Detalhes de env e comandos: README de cada pasta.

Ordem sugerida:

1. PostgreSQL — `docker compose -f neuro-backend/docker-compose.yaml up -d` (porta host **5436**)
2. MongoDB local na **27017**
3. `neuro-backend` → `npm install`, `.env`, `npx prisma migrate dev`, `npm run dev` (use `PORT=3001`)
4. `neuro-learning` → venv, `pip install -r requirements.txt`, `.env`, `flask run --host=0.0.0.0 --port=5000`
5. `neuro-gateway` → `npm install`, `.env` com `USERS_SERVICE_URL=http://localhost:3001` e `AI_SERVICE_URL=http://localhost:5000`, `npm run start:dev`
6. `neuro-frontend` → `npm install`, `.env.local` apontando para `http://localhost:3005`, `npm run dev`

O `JWT_SECRET` do gateway **precisa ser o mesmo** do backend.

---

# ⚗️ Rodando os Testes

### Backend (Vitest)

```bash
cd neuro-backend

npm run test            # unitários (repositórios in-memory)
npm run test:e2e        # e2e
npm run test:watch
npm run test:ui
npm run test:coverage
```

O CI em `.github/workflows/` executa os unitários do backend a cada push.

### Gateway (Jest)

```bash
cd neuro-gateway
npm test
```

### Learning (pytest)

```bash
cd neuro-learning
pytest
```

---

# 🔎 Onde me encontrar

<div> 
<a href="https://www.linkedin.com/in/lucasvizoto" target="_blank">
  <img src="https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white" target="_blank">
</a>
<a href="mailto:lucasvizoto1805@gmail.com">
  <img src="https://img.shields.io/badge/Gmail-D14836?style=for-the-badge&logo=gmail&logoColor=white" target="_blank">
</a>
<a href="https://lucasvizoto.com">
  <img src="https://img.shields.io/badge/Website-000000?style=for-the-badge" target="_blank">
</a>
</div>

