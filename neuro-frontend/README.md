# neuro-frontend

Interface web do **NeuroFinance**: dashboard de cotações, chat com o agente e perfil. Next.js 15 (App Router) falando **somente** com o `neuro-gateway`.

## Função no sistema

- Login / cadastro e callback do Google (`/login/callback`)
- Dashboard com ticker padrão vindo do perfil (`preferenceTicker`; fallback `AAPL`)
- Chat com limite de 5 conversas
- Perfil (dados, ticker preferido, avatar)

O browser usa `NEXT_PUBLIC_GATEWAY_URL` (default `http://localhost:3005`). Nunca aponte essa variável para `http://neuro-gateway:3005`: o hostname interno do Docker não resolve no PC do usuário.

## Stack

- Next.js 15, React 18, TypeScript
- MUI + tema próprio (`#A855F7`, dark)
- Redux Toolkit (`user`, `chat`)
- ApexCharts na dashboard
- Alert/AlertDialog em `src/components/heroui/`

Rotas relevantes:

| Rota | Descrição |
|---|---|
| `/login` | E-mail/senha + Google |
| `/login/callback` | Recebe `?token=` do OAuth |
| `/register` | Cadastro |
| `/dashboard` | Histórico, cotações, crescimento, news |
| `/chat` | Conversas com o agente |
| `/profile` | Perfil e ticker padrão |
| `/` | Redirect permanente para `/dashboard` |

`AuthGuard` hidrata o usuário via `GET /me` antes das páginas autenticadas.

## Variáveis de ambiente

Copie `.env.example` para `.env.local` no desenvolvimento.

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_APP_URL` | URL pública do app (`http://localhost:3000`) |
| `NEXT_PUBLIC_GATEWAY_URL` | URL **pública** do gateway (`http://localhost:3005`) |
| `NEXT_PUBLIC_API_URL` | Fallback legado; o código prefere `NEXT_PUBLIC_GATEWAY_URL` |
| `BASEPATH` | Prefixo de rota (vazio na instalação padrão) |

`NEXT_PUBLIC_*` é embutida no **build**. Mudou o IP/domínio da VPS? Reconstrua a imagem:

```bash
docker compose up -d --build neuro-frontend
```

## Como rodar (local)

Pré-requisitos: Node 22, gateway em `:3005` (e, atrás dele, backend + learning).

```bash
cd neuro-frontend
cp .env.example .env.local
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). O `postinstall` gera o CSS dos ícones (`npm run build:icons`).

Produção local:

```bash
npm run build
npm start
```

## Como rodar (Docker)

Na raiz do monorepo. Os `ARG` `NEXT_PUBLIC_APP_URL` e `NEXT_PUBLIC_GATEWAY_URL` vêm do `.env` da raiz.

```bash
cp .env.example .env
# ajuste NEXT_PUBLIC_* para o IP/domínio da VPS
docker compose up -d --build neuro-frontend
```

Porta publicada: **3000**. O container só sobe com o gateway healthy.

## Scripts úteis

```bash
npm run lint
npm run lint:fix
npm run format
npm run build:icons
```

## Dependências

- **neuro-gateway** — obrigatório (auth, dashboard, chat, perfil)
- Backend e learning são indiretos: o frontend não os endereça
