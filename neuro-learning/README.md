# neuro-learning

Serviço de IA e dados de mercado do **NeuroFinance**. Flask + LangChain (Gemini) + modelo quantitativo (scikit-learn / pipeline em `stock_predictor.py`). Histórico de chat e cache de cotações ficam no **MongoDB**.

## Função no sistema

O gateway chama este serviço em `/ai/*`. O frontend nunca fala com a porta 5000.

| Capacidade | Como |
|---|---|
| Chat | LangChain + Gemini; memória por `mongo_id` (`langchain-mongodb`) |
| Análise | Predição ML + texto estruturado do Gemini; pode gravar no histórico do chat |
| Predição | Inferência/treino sob demanda por ticker |
| Dashboard | Histórico de preços, quotes FX/metais, crescimento, valuations, news (Alpha Vantage, fallback yfinance) |

Cache Mongo (`services/mongo_cache.py`) reduz chamada repetida à Alpha Vantage.

## Stack

- Python 3.12, Flask, flask-cors
- LangChain + `langchain-google-genai` + `langchain-mongodb`
- pandas, scikit-learn, PyTorch (dependência pesada do `requirements.txt`)
- pymongo
- Gunicorn na imagem Docker (1 worker — o modelo consome RAM)

## API (porta 5000)

| Método | Rota | Body / query | Descrição |
|---|---|---|---|
| `GET` | `/health` | — | Liveness |
| `POST` | `/predict` | `{ "ticker": "AAPL" }` | Predição ML bruta |
| `POST` | `/analyze` | `{ "ticker", "mongo_id"? }` | ML + Gemini; persiste se houver `mongo_id` |
| `POST` | `/chat` | `{ "mongo_id", "message", "ticker"? }` | Turno do agente |
| `GET` | `/chat/<mongo_id>` | — | Histórico da conversa |
| `GET` | `/dashboard` | `ticker`, `period` (`1D` `1W` `1M` `6M` `1Y`) | Cotação + histórico |
| `GET` | `/dashboard/quotes` | — | USD, EUR, ouro, prata |
| `GET` | `/dashboard/growth` | `ticker`, `period` | Série de crescimento |
| `GET` | `/dashboard/valuations` | — | Top market caps |
| `GET` | `/dashboard/news` | `ticker?` | NEWS_SENTIMENT |

`mongo_id` é gerado no **neuro-backend** ao criar o chat. Este serviço só usa o id como chave no Mongo; não valida JWT (quem autentica é o gateway).

## Variáveis de ambiente

Copie `.env.example` para `.env`.

| Variável | Obrigatória | Local | Docker |
|---|---|---|---|
| `MONGO_URI` | sim | `mongodb://localhost:27017/` | `mongodb://mongo-db:27017/` |
| `MONGO_URL` | não | alias de `MONGO_URI` | o Compose preenche as duas |
| `MONGO_DB_NAME` | não | default `neurofinance` | `neurofinance` |
| `GEMINI_API_KEY` | para chat/análise | Google AI Studio | idem |
| `ALPHAVANTAGE_API_KEY` | para dashboard completa | [alphavantage.co](https://www.alphavantage.co) | idem |

Sem Gemini, o processo sobe (`dummy_key_to_allow_import`), mas chat/análise falham. Sem Alpha Vantage, parte dos dados cai no yfinance ou no cache.

## Como rodar (local)

Pré-requisitos: Python 3.12, MongoDB em `:27017`.

```bash
cd neuro-learning
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# preencha GEMINI_API_KEY e ALPHAVANTAGE_API_KEY

flask run --host=0.0.0.0 --port=5000
```

Ou:

```bash
python app.py
```

Health: [http://localhost:5000/health](http://localhost:5000/health)

O `requirements.txt` inclui PyTorch — o install é grande. Prefira um venv dedicado.

## Como rodar (Docker)

Na raiz do monorepo. A imagem usa `python:3.12-slim` (não Alpine: sklearn/torch) e Gunicorn em `0.0.0.0:5000`.

```bash
cp .env.example .env   # raiz: GEMINI_API_KEY, ALPHAVANTAGE_API_KEY
docker compose up -d --build neuro-learning
```

O container depende de `mongo-db` healthy. A porta 5000 **não** é publicada no host; o gateway usa `http://neuro-learning:5000`.

RAM da VPS: reserve **4 GB+**. Há um worker Gunicorn de propósito, para não duplicar o modelo em memória.

## Estrutura

```
app.py                      rotas Flask
config.py                   env
routes/dashboard_routes.py  blueprint /dashboard
services/
  chat_service.py           LangChain + Mongo
  analyze_service.py        ML + Gemini
  predict_service.py        inferência
  alpha_vantage_service.py  mercado + cache
  mongo_cache.py
stock_predictor.py          pipeline quantitativo
```

## Dependências

- **MongoDB 6** — histórico de chat e cache
- **neuro-gateway** — único cliente HTTP esperado
- **neuro-backend** — só alinhamento do `mongo_id` das conversas
- Chaves **Gemini** e **Alpha Vantage** para o produto completo
