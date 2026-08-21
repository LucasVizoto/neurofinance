# 🚀 NeuroFinance — Manual de Inicialização Local

Este guia descreve os passos necessários e a **ordem exata** para subir toda a arquitetura do NeuroFinance (Frontend, Gateway, Backend, e Serviço de IA) na sua máquina local de forma integrada.

---

## 1. Pré-requisitos (Infraestrutura)

Antes de rodar a aplicação, garanta que os seguintes serviços estão rodando (seja via Docker ou instalação local direta):

- **PostgreSQL 17**: Porta `5436` (ou `5432` dependendo da sua configuração). Banco `neuro-backend`.
- **MongoDB 8.0**: Porta `27017`.
- **RabbitMQ**: Porta `5672` (e painel na `15672`). *[Opcional dependendo da integração]*

---

## 2. Variáveis de Ambiente

Garanta que os arquivos `.env` existem e estão preenchidos conforme a arquitetura.

### `neuro-gateway/.env`
```env
PORT=3005
JWT_SECRET=sua_chave_secreta_jwt
USERS_SERVICE_URL=http://localhost:3001
AI_SERVICE_URL=http://localhost:5000
CORS_ORIGIN=*
```

### `neuro-backend/.env`
```env
NODE_ENV='dev'
PORT=3001
DATABASE_URL='postgresql://admin:123456@localhost:5436/neuro-backend'
JWT_SECRET=sua_chave_secreta_jwt
```

### `neuro-learning/.env`
```env
ALPHAVANTAGE_API_KEY=sua_chave_aqui
GEMINI_API_KEY=sua_chave_gemini_aqui
FLASK_RUN_PORT=5000
MONGO_URI=mongodb://localhost:27017/
MONGO_DB_NAME=neurofinance
```

### `neuro-frontend/.env.local`
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3005
BASEPATH=
```

---

## 3. Ordem de Inicialização (Obrigatório)

A inicialização deve respeitar a ordem em que os serviços dependem uns dos outros. Siga exatamente os passos abaixo:

### Passo 1: Subir o Backend (Usuários e Chats)
O Gateway e o Frontend precisarão deste serviço para autenticação e rotas.
```bash
cd neuro-backend
npm install
npx prisma generate
npx prisma migrate dev  # (Caso ainda não tenha rodado as migrations)
npm run start:dev
```
> O backend iniciará na porta **3001**.

### Passo 2: Subir a IA (Learning)
O Gateway precisará da API Flask exposta para os comandos de chat e predição.
```bash
cd neuro-learning
# Ative sua virtualenv (ex: venv\Scripts\activate no Windows)
pip install -r requirements.txt
flask run
```
> A API do Flask iniciará na porta **5000**.

### Passo 3: Subir o API Gateway
O Gateway fará proxy para os serviços (Backend e Learning). É ele quem valida os tokens JWT.
```bash
cd neuro-gateway
npm install
npm run start:dev
```
> O Gateway iniciará na porta **3005**.

### Passo 4: Subir o Frontend
A interface que irá se comunicar unicamente com o Gateway.
```bash
cd neuro-frontend
npm install  # (ou pnpm install)
npm run dev
```
> O Frontend ficará disponível em **http://localhost:3000**.

---

## 4. Teste de Sanidade (Health Check)

Se tudo estiver rodando corretamente, você deve conseguir:

1. Acessar `http://localhost:3000` (Frontend).
2. O Swagger do Gateway estará exposto em `http://localhost:3005/api`.
3. Você pode usar uma ferramenta como Postman para bater em `http://localhost:3005/ai/health` e receber um status OK (encaminhado para o Flask).
