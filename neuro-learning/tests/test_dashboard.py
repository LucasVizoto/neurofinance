"""Testes das rotas de dashboard (Alpha Vantage + cache). APIs externas são mockadas."""
import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


class TestDashboardQuotes:
    def test_quotes_returns_four_assets(self, client, monkeypatch):
        payload = {
            "success": True,
            "quotes": [
                {"id": "USD", "label": "Dólar", "from": "USD", "to": "BRL", "currency": "BRL", "rate": 5.4, "changePct": 0.2},
                {"id": "EUR", "label": "Euro", "from": "EUR", "to": "BRL", "currency": "BRL", "rate": 6.1, "changePct": -0.1},
                {"id": "XAU", "label": "Ouro", "from": "XAU", "to": "USD", "currency": "USD", "rate": 2650.0, "changePct": 0.4},
                {"id": "XAG", "label": "Prata", "from": "XAG", "to": "USD", "currency": "USD", "rate": 31.2, "changePct": 0.1},
            ],
            "updatedAt": "2026-08-22T20:00:00Z",
            "cached": True,
        }
        monkeypatch.setattr("routes.dashboard_routes.get_market_quotes", lambda: payload)

        response = client.get("/dashboard/quotes")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"] is True
        assert len(data["quotes"]) == 4
        assert {q["id"] for q in data["quotes"]} == {"USD", "EUR", "XAU", "XAG"}


class TestDashboardGrowth:
    def test_growth_returns_series(self, client, monkeypatch):
        payload = {
            "success": True,
            "ticker": "PETR4.SA",
            "source": "alphavantage",
            "series": [
                {"date": "2026-01", "close": 30.0, "growthPct": 0.0},
                {"date": "2026-07", "close": 36.0, "growthPct": 20.0},
            ],
            "totalGrowthPct": 20.0,
            "cached": True,
        }
        monkeypatch.setattr("routes.dashboard_routes.get_growth_series", lambda ticker, period="1M": payload)

        response = client.get("/dashboard/growth?ticker=PETR4.SA&period=1M")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"] is True
        assert data["totalGrowthPct"] == 20.0
        assert len(data["series"]) == 2


class TestDashboardValuations:
    def test_valuations_returns_top_5(self, client, monkeypatch):
        payload = {
            "success": True,
            "source": "mock",
            "items": [
                {"symbol": "AAPL", "name": "Apple Inc.", "sector": "Technology", "marketCap": 3e12, "peRatio": 33.0},
                {"symbol": "MSFT", "name": "Microsoft", "sector": "Technology", "marketCap": 3e12, "peRatio": 35.0},
                {"symbol": "NVDA", "name": "NVIDIA", "sector": "Technology", "marketCap": 3e12, "peRatio": 50.0},
                {"symbol": "GOOGL", "name": "Alphabet", "sector": "Communication", "marketCap": 2e12, "peRatio": 24.0},
                {"symbol": "AMZN", "name": "Amazon", "sector": "Consumer", "marketCap": 2e12, "peRatio": 38.0},
            ],
            "cached": True,
        }
        monkeypatch.setattr("routes.dashboard_routes.get_top_valuations", lambda: payload)

        response = client.get("/dashboard/valuations")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"] is True
        assert len(data["items"]) == 5
        assert data["items"][0]["symbol"] == "AAPL"


class TestDashboardNews:
    def test_news_returns_articles(self, client, monkeypatch):
        payload = {
            "success": True,
            "source": "alphavantage",
            "articles": [
                {
                    "title": "Fed signals pause",
                    "url": "https://example.com/n1",
                    "source": "Reuters",
                    "summary": "Markets rally after the announcement.",
                    "publishedAt": "2026-08-22T18:00:00Z",
                    "image": None,
                    "sentiment": "Bullish",
                    "sentimentScore": 0.4,
                }
            ],
            "cached": False,
        }
        monkeypatch.setattr("routes.dashboard_routes.get_market_news", lambda ticker=None: payload)

        response = client.get("/dashboard/news")
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"] is True
        assert data["articles"][0]["title"] == "Fed signals pause"
        assert data["articles"][0]["source"] == "Reuters"
