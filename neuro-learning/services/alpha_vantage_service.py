"""
Cliente Alpha Vantage + fallbacks (yfinance / mock) para o dashboard.
A chave NUNCA sai do backend. Respostas são cacheadas no Mongo para
respeitar o limite do plano gratuito (5 req/min, 25/dia).
"""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime

import requests
import yfinance as yf

from config import config
from services.mongo_cache import cache_get_fresh, cache_get_stale, cache_set

AV_URL = "https://www.alphavantage.co/query"

TTL_QUOTES = 30 * 60          # 30 min
TTL_GROWTH = 12 * 60 * 60     # 12 h
TTL_VALUATIONS = 24 * 60 * 60 # 24 h
TTL_NEWS = 2 * 60 * 60        # 2 h

QUOTE_PAIRS = [
    {"id": "USD", "label": "Dólar", "from": "USD", "to": "BRL", "currency": "BRL", "yf": "USDBRL=X"},
    {"id": "EUR", "label": "Euro", "from": "EUR", "to": "BRL", "currency": "BRL", "yf": "EURBRL=X"},
    {"id": "XAU", "label": "Ouro", "from": "XAU", "to": "USD", "currency": "USD", "yf": "GC=F"},
    {"id": "XAG", "label": "Prata", "from": "XAG", "to": "USD", "currency": "USD", "yf": "SI=F"},
]

VALUATION_SYMBOLS = ["AAPL", "MSFT", "NVDA", "GOOGL", "AMZN"]

MOCK_VALUATIONS = [
    {"symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology", "marketCap": 3_420_000_000_000, "peRatio": 33.4, "country": "USA"},
    {"symbol": "MSFT", "name": "Microsoft Corp.", "sector": "Technology", "marketCap": 3_180_000_000_000, "peRatio": 35.1, "country": "USA"},
    {"symbol": "NVDA", "name": "NVIDIA Corp.", "sector": "Technology", "marketCap": 3_050_000_000_000, "peRatio": 52.8, "country": "USA"},
    {"symbol": "GOOGL", "name": "Alphabet Inc.", "sector": "Communication Services", "marketCap": 2_210_000_000_000, "peRatio": 24.6, "country": "USA"},
    {"symbol": "AMZN", "name": "Amazon.com Inc.", "sector": "Consumer Cyclical", "marketCap": 2_050_000_000_000, "peRatio": 38.2, "country": "USA"},
]


def _api_key() -> str:
    return config.ALPHAVANTAGE_API_KEY or ""


def _is_throttled(payload: dict) -> bool:
    if not isinstance(payload, dict):
        return True
    return any(k in payload for k in ("Note", "Information", "Error Message"))


def _av_get(params: dict, timeout: int = 12) -> dict | None:
    key = _api_key()
    if not key:
        print("[alpha_vantage] ALPHAVANTAGE_API_KEY ausente")
        return None
    try:
        response = requests.get(AV_URL, params={**params, "apikey": key}, timeout=timeout)
        response.raise_for_status()
        data = response.json()
        if _is_throttled(data):
            msg = data.get("Note") or data.get("Information") or data.get("Error Message")
            print(f"[alpha_vantage] limite/erro: {msg}")
            return None
        return data
    except Exception as exc:
        print(f"[alpha_vantage] request failed: {exc}")
        return None


def _parse_rate(payload: dict) -> float | None:
    block = payload.get("Realtime Currency Exchange Rate") or {}
    raw = block.get("5. Exchange Rate")
    try:
        return float(raw) if raw is not None else None
    except (TypeError, ValueError):
        return None


def _yf_last_and_change(symbol: str) -> tuple[float | None, float]:
    try:
        history = yf.Ticker(symbol).history(period="5d")
        if history is None or history.empty:
            return None, 0.0
        last = float(history["Close"].iloc[-1])
        prev = float(history["Close"].iloc[-2]) if len(history) > 1 else last
        change = ((last - prev) / prev) * 100 if prev else 0.0
        return last, change
    except Exception as exc:
        print(f"[yfinance] {symbol}: {exc}")
        return None, 0.0


def _build_quote(meta: dict, rate: float, change_pct: float, source: str) -> dict:
    return {
        "id": meta["id"],
        "label": meta["label"],
        "from": meta["from"],
        "to": meta["to"],
        "currency": meta["currency"],
        "rate": round(rate, 4),
        "changePct": round(change_pct, 2),
        "source": source,
    }


def get_market_quotes() -> dict:
    cached = cache_get_fresh("quotes:fx")
    if cached:
        return {**cached, "cached": True}

    previous = cache_get_stale("quotes:fx") or {}
    prev_rates = {q["id"]: q.get("rate") for q in previous.get("quotes", [])}

    quotes = []

    def fetch_one(meta: dict) -> dict | None:
        payload = _av_get({
            "function": "CURRENCY_EXCHANGE_RATE",
            "from_currency": meta["from"],
            "to_currency": meta["to"],
        })
        if payload:
            rate = _parse_rate(payload)
            if rate is not None:
                prev = prev_rates.get(meta["id"])
                change = ((rate - prev) / prev) * 100 if prev else 0.0
                return _build_quote(meta, rate, change, "alphavantage")
        rate, change = _yf_last_and_change(meta["yf"])
        if rate is not None:
            return _build_quote(meta, rate, change, "yfinance")
        return None

    with ThreadPoolExecutor(max_workers=4) as pool:
        for item in pool.map(fetch_one, QUOTE_PAIRS):
            if item:
                quotes.append(item)

    if len(quotes) < 4 and previous.get("quotes"):
        known = {q["id"] for q in quotes}
        for old in previous["quotes"]:
            if old["id"] not in known:
                quotes.append(old)

    if not quotes:
        return {"success": False, "error": "Cotações indisponíveis no momento.", "quotes": []}

    order = {m["id"]: i for i, m in enumerate(QUOTE_PAIRS)}
    quotes.sort(key=lambda q: order.get(q["id"], 99))

    result = {
        "success": True,
        "quotes": quotes,
        "updatedAt": datetime.utcnow().isoformat() + "Z",
        "cached": False,
    }
    cache_set("quotes:fx", result, TTL_QUOTES)
    return result


def _av_symbol(ticker: str) -> list[str]:
    t = (ticker or "").upper().strip()
    candidates = [t]
    if t.endswith(".SA"):
        candidates.append(t.replace(".SA", ".SAO"))
        candidates.append(t.replace(".SA", ""))
    elif t.endswith(".SAO"):
        candidates.append(t.replace(".SAO", ".SA"))
    # unique preserve order
    seen = set()
    out = []
    for c in candidates:
        if c and c not in seen:
            seen.add(c)
            out.append(c)
    return out


PERIOD_CONFIG = {
    "1D": {
        "yf_period": "1d",
        "yf_interval": "5m",
        "av_function": "TIME_SERIES_INTRADAY",
        "av_interval": "5min",
        "outputsize": "compact",
        "label_fmt": "%H:%M",
        "max_points": 80,
        "ttl": 5 * 60,
    },
    "1W": {
        "yf_period": "5d",
        "yf_interval": "30m",
        "av_function": "TIME_SERIES_INTRADAY",
        "av_interval": "30min",
        "outputsize": "compact",
        "label_fmt": "%d/%m %H:%M",
        "max_points": 50,
        "ttl": 15 * 60,
    },
    "1M": {
        "yf_period": "1mo",
        "yf_interval": "1d",
        "av_function": "TIME_SERIES_DAILY",
        "outputsize": "compact",
        "label_fmt": "%d/%m",
        "max_points": 23,
        "ttl": 30 * 60,
    },
    "6M": {
        "yf_period": "6mo",
        "yf_interval": "1d",
        "av_function": "TIME_SERIES_DAILY",
        "outputsize": "full",
        "label_fmt": "%d/%m",
        "max_points": 130,
        "ttl": 60 * 60,
    },
    "1Y": {
        "yf_period": "1y",
        "yf_interval": "1wk",
        "av_function": "TIME_SERIES_WEEKLY",
        "outputsize": "compact",
        "label_fmt": "%m/%Y",
        "max_points": 54,
        "ttl": 2 * 60 * 60,
    },
}


def _normalize_period(period: str | None) -> str:
    value = (period or "1M").upper().strip()
    return value if value in PERIOD_CONFIG else "1M"


def _extract_av_series(payload: dict) -> dict | None:
    for key in (
        "Time Series (5min)",
        "Time Series (15min)",
        "Time Series (30min)",
        "Time Series (60min)",
        "Time Series (Daily)",
        "Weekly Time Series",
        "Monthly Time Series",
        "Monthly Adjusted Time Series",
    ):
        if key in payload and isinstance(payload[key], dict):
            return payload[key]
    return None


def _format_history_label(index, fmt: str) -> str:
    try:
        return index.strftime(fmt)
    except Exception:
        return str(index)[:16]


def _history_from_av(ticker: str, period: str) -> tuple[list[dict], str] | tuple[None, None]:
    cfg = PERIOD_CONFIG[period]
    params = {"function": cfg["av_function"], "outputsize": cfg["outputsize"]}
    if cfg.get("av_interval"):
        params["interval"] = cfg["av_interval"]

    for symbol in _av_symbol(ticker):
        payload = _av_get({**params, "symbol": symbol}, timeout=18)
        series = _extract_av_series(payload) if payload else None
        if not series:
            continue
        points = []
        for date_str, row in series.items():
            close = row.get("4. close") or row.get("5. adjusted close")
            volume = row.get("5. volume") or row.get("6. volume") or 0
            try:
                points.append({
                    "date": date_str[11:16] if period == "1D" and len(date_str) >= 16 else date_str[:10],
                    "price": float(close),
                    "volume": int(float(volume)),
                })
            except (TypeError, ValueError):
                continue
        points.sort(key=lambda p: p["date"])
        max_points = cfg.get("max_points")
        if max_points:
            points = points[-int(max_points):]
        if points:
            return points, "alphavantage"
    return None, None


def _history_from_yf(ticker: str, period: str) -> list[dict] | None:
    cfg = PERIOD_CONFIG[period]
    try:
        history = yf.Ticker(ticker).history(period=cfg["yf_period"], interval=cfg["yf_interval"])
        if history is None or history.empty:
            if period == "1D":
                history = yf.Ticker(ticker).history(period="5d", interval="5m")
            if history is None or history.empty:
                return None
        points = []
        for index, row in history.iterrows():
            points.append({
                "date": _format_history_label(index, cfg["label_fmt"]),
                "price": float(row["Close"]),
                "volume": int(row["Volume"]) if "Volume" in row and row["Volume"] == row["Volume"] else 0,
            })
        max_points = cfg.get("max_points")
        if max_points:
            points = points[-int(max_points):]
        return points
    except Exception as exc:
        print(f"[yfinance] history {ticker} {period}: {exc}")
        return None


def get_price_history(ticker: str, period: str = "1M") -> dict:
    ticker = (ticker or "PETR4.SA").upper().strip()
    period = _normalize_period(period)
    cache_key = f"history:{ticker}:{period}:v2"
    cached = cache_get_fresh(cache_key)
    if cached:
        return {**cached, "cached": True}

    points, source = _history_from_av(ticker, period)
    if not points:
        points = _history_from_yf(ticker, period)
        source = "yfinance" if points else None

    if not points:
        stale = cache_get_stale(cache_key)
        if stale:
            return {**stale, "cached": True, "stale": True}
        return {"success": False, "error": "Histórico indisponível.", "ticker": ticker, "period": period, "history": []}

    last = points[-1]
    prev = points[-2] if len(points) > 1 else last
    trend = ((last["price"] - prev["price"]) / prev["price"]) * 100 if prev["price"] else 0.0

    result = {
        "success": True,
        "ticker": ticker,
        "period": period,
        "source": source,
        "currentPrice": last["price"],
        "currentVolume": last["volume"],
        "trend": trend,
        "history": points,
        "cached": False,
    }
    cache_set(cache_key, result, PERIOD_CONFIG[period]["ttl"])
    return result


def _safe_float(value) -> float | None:
    if value in (None, "", "None", "-", "N/A"):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def get_ticker_fundamentals(ticker: str) -> dict:
    """OVERVIEW (market cap / P/L) + GLOBAL_QUOTE (máx/mín do dia), com fallback yfinance."""
    ticker = (ticker or "PETR4.SA").upper().strip()
    cache_key = f"fundamentals:{ticker}"
    cached = cache_get_fresh(cache_key)
    if cached:
        return {**cached, "cached": True}

    market_cap = None
    pe_ratio = None
    day_high = None
    day_low = None
    currency = "USD"
    name = ticker
    source = "mixed"

    for symbol in _av_symbol(ticker):
        overview = _av_get({"function": "OVERVIEW", "symbol": symbol}, timeout=8)
        if overview:
            cap = _safe_float(overview.get("MarketCapitalization"))
            if cap:
                market_cap = cap
                pe_ratio = _safe_float(overview.get("PERatio"))
                name = overview.get("Name") or name
                currency = "USD"
                source = "alphavantage"
                break

    for symbol in _av_symbol(ticker):
        quote = _av_get({"function": "GLOBAL_QUOTE", "symbol": symbol}, timeout=8)
        block = (quote or {}).get("Global Quote") or {}
        high = _safe_float(block.get("03. high"))
        low = _safe_float(block.get("04. low"))
        if high and low:
            day_high, day_low = high, low
            if source != "alphavantage":
                source = "alphavantage"
            break

    try:
        info = yf.Ticker(ticker).fast_info

        def pick(obj, key):
            try:
                return obj[key]
            except Exception:
                return getattr(obj, key, None)

        yf_cap = pick(info, "market_cap")
        yf_high = pick(info, "day_high")
        yf_low = pick(info, "day_low")
        yf_currency = pick(info, "currency")
        if market_cap is None and yf_cap:
            market_cap = float(yf_cap)
            currency = yf_currency or "BRL"
            source = "yfinance" if source != "alphavantage" else "mixed"
        if day_high is None and yf_high:
            day_high = float(yf_high)
        if day_low is None and yf_low:
            day_low = float(yf_low)
        if not pe_ratio:
            full = yf.Ticker(ticker).info or {}
            pe_ratio = _safe_float(full.get("trailingPE"))
            name = full.get("shortName") or full.get("longName") or name
            if not yf_currency:
                currency = full.get("currency") or currency
    except Exception as exc:
        print(f"[yfinance] fundamentals {ticker}: {exc}")

    result = {
        "success": True,
        "ticker": ticker,
        "name": name,
        "marketCap": market_cap,
        "peRatio": pe_ratio,
        "dayHigh": day_high,
        "dayLow": day_low,
        "currency": currency or "BRL",
        "source": source,
        "cached": False,
    }
    cache_set(cache_key, result, 60 * 60)
    return result


def _monthly_from_av(symbol: str) -> list[dict] | None:
    payload = _av_get({"function": "TIME_SERIES_MONTHLY", "symbol": symbol}, timeout=20)
    if not payload:
        return None
    series = payload.get("Monthly Time Series") or payload.get("Monthly Adjusted Time Series")
    if not series:
        return None
    points = []
    for date_str, row in series.items():
        close = row.get("4. close") or row.get("5. adjusted close")
        try:
            points.append({"date": date_str[:7], "close": float(close)})
        except (TypeError, ValueError):
            continue
    points.sort(key=lambda p: p["date"])
    return points[-24:] if points else None


def _monthly_from_yf(ticker: str) -> list[dict] | None:
    try:
        history = yf.Ticker(ticker).history(period="2y", interval="1mo")
        if history is None or history.empty:
            return None
        points = []
        for index, row in history.iterrows():
            points.append({
                "date": index.strftime("%Y-%m"),
                "close": float(row["Close"]),
            })
        return points
    except Exception as exc:
        print(f"[yfinance] monthly {ticker}: {exc}")
        return None


def get_growth_series(ticker: str, period: str = "1M") -> dict:
    ticker = (ticker or "PETR4.SA").upper().strip()
    period = _normalize_period(period)
    history = get_price_history(ticker, period)
    points = history.get("history") or []
    if not history.get("success") or not points:
        return {"success": False, "error": "Histórico indisponível.", "ticker": ticker, "period": period, "series": []}

    first = points[0]["price"]
    series = []
    for point in points:
        series.append({
            "date": point["date"],
            "close": point["price"],
            "growthPct": round(((point["price"] - first) / first) * 100, 2) if first else 0.0,
        })

    return {
        "success": True,
        "ticker": ticker,
        "period": period,
        "source": history.get("source"),
        "series": series,
        "totalGrowthPct": series[-1]["growthPct"] if series else 0.0,
        "cached": history.get("cached", False),
    }


def _parse_overview(payload: dict) -> dict | None:
    cap = payload.get("MarketCapitalization")
    if not cap or cap == "None":
        return None
    try:
        market_cap = float(cap)
    except (TypeError, ValueError):
        return None
    pe = payload.get("PERatio")
    try:
        pe_ratio = float(pe) if pe not in (None, "None", "-") else None
    except (TypeError, ValueError):
        pe_ratio = None
    return {
        "symbol": payload.get("Symbol"),
        "name": payload.get("Name") or payload.get("Symbol"),
        "sector": payload.get("Sector") or "—",
        "marketCap": market_cap,
        "peRatio": pe_ratio,
        "country": payload.get("Country") or "USA",
    }


def get_top_valuations() -> dict:
    cached = cache_get_fresh("valuations:top5")
    if cached:
        return {**cached, "cached": True}

    items = []
    for symbol in VALUATION_SYMBOLS:
        payload = _av_get({"function": "OVERVIEW", "symbol": symbol}, timeout=6)
        parsed = _parse_overview(payload) if payload else None
        if parsed:
            items.append(parsed)
        else:
            break  # para na primeira falha para não esgotar a cota diária

    if len(items) >= 5:
        source = "alphavantage"
    elif items:
        source = "mixed"
        known = {i["symbol"] for i in items}
        items.extend(dict(m) for m in MOCK_VALUATIONS if m["symbol"] not in known)
    else:
        source = "mock"
        items = [dict(m) for m in MOCK_VALUATIONS]

    items = sorted(items, key=lambda i: i.get("marketCap") or 0, reverse=True)[:5]
    result = {
        "success": True,
        "source": source,
        "items": items,
        "cached": False,
    }
    cache_set("valuations:top5", result, TTL_VALUATIONS)
    return result


def _parse_published(raw: str) -> str:
    if not raw:
        return ""
    try:
        return datetime.strptime(raw[:15], "%Y%m%dT%H%M%S").isoformat() + "Z"
    except ValueError:
        return raw


def get_market_news(ticker: str | None = None) -> dict:
    suffix = (ticker or "market").upper().strip()
    cache_key = f"news:{suffix}"
    cached = cache_get_fresh(cache_key)
    if cached:
        return {**cached, "cached": True}

    params = {
        "function": "NEWS_SENTIMENT",
        "topics": "financial_markets",
        "sort": "LATEST",
        "limit": 20,
    }
    # Tickers US (sem sufixo B3) melhoram o recorte; BR raramente casa no feed AV
    if ticker and "." not in ticker:
        params["tickers"] = ticker.upper()

    payload = _av_get(params, timeout=20)
    articles = []
    if payload:
        for item in payload.get("feed", [])[:12]:
            articles.append({
                "title": item.get("title") or "Sem título",
                "url": item.get("url") or "",
                "source": item.get("source") or "Alpha Vantage",
                "summary": item.get("summary") or "",
                "publishedAt": _parse_published(item.get("time_published", "")),
                "image": item.get("banner_image") or None,
                "sentiment": item.get("overall_sentiment_label") or "Neutral",
                "sentimentScore": float(item.get("overall_sentiment_score") or 0),
            })

    if articles:
        result = {
            "success": True,
            "source": "alphavantage",
            "articles": articles,
            "cached": False,
        }
        cache_set(cache_key, result, TTL_NEWS)
        return result

    stale = cache_get_stale(cache_key)
    if stale:
        return {**stale, "cached": True, "stale": True}

    return {"success": True, "source": "empty", "articles": [], "cached": False}
