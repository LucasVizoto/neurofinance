"""
Testes básicos para as features de chat e análise do NeuroFinance.
Execute com: python -m pytest tests/ -v
"""
import json
import pytest
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as client:
        yield client


# ─────────────────────────────────────────────
# TESTES: Limite de chats (regra de negócio)
# ─────────────────────────────────────────────

class TestChatLimits:
    """
    Esses testes verificam a regra de negócio do backend Fastify.
    O neuro-learning não controla o limite — ele apenas responde ao chat.
    Os testes abaixo validam o comportamento esperado de retorno da API Flask.
    """

    def test_chat_post_missing_mongo_id(self, client):
        """Deve retornar 400 se mongo_id não for fornecido."""
        response = client.post(
            '/chat',
            json={"message": "olá", "ticker": "PETR4"}
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data["success"] is False
        assert "mongo_id" in data["error"]

    def test_chat_post_missing_message(self, client):
        """Deve retornar 400 se message não for fornecida."""
        response = client.post(
            '/chat',
            json={"mongo_id": "abc123", "ticker": "PETR4"}
        )
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data["success"] is False

    def test_chat_history_returns_messages_list(self, client):
        """Deve retornar uma lista de mensagens (mesmo vazia) para um mongo_id válido."""
        response = client.get('/chat/test_session_id_fake')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"] is True
        assert "messages" in data
        assert isinstance(data["messages"], list)


# ─────────────────────────────────────────────
# TESTES: Rota /analyze
# ─────────────────────────────────────────────

class TestAnalyzeRoute:
    def test_analyze_missing_ticker(self, client):
        """Deve retornar 400 se ticker não for fornecido."""
        response = client.post('/analyze', json={})
        assert response.status_code == 400
        data = json.loads(response.data)
        assert data["success"] is False
        assert "ticker" in data["error"]

    def test_analyze_returns_structured_json_on_success(self, client, monkeypatch):
        """
        Testa que /analyze retorna um JSON estruturado válido quando
        analyze_asset retorna sucesso. Faz mock do service para não chamar APIs externas.
        """
        mock_result = {
            "success": True,
            "ticker": "PETR4",
            "ml_raw": {
                "prediction": "Alta",
                "confidence": 0.73,
                "date": "2026-08-22"
            },
            "analysis": {
                "tipo": "analise_estruturada",
                "ticker": "PETR4",
                "probabilidade": 0.73,
                "direcao": "Alta",
                "analise_tecnica": "Médias móveis em tendência de alta.",
                "analise_fundamentalista": "Petrobras com resultados sólidos no trimestre.",
                "recomendacao": "COMPRA",
                "justificativa": "Alta probabilidade de valorização no curto prazo.",
                "nivel_confianca": "Alto"
            }
        }

        import services.analyze_service as analyze_service
        monkeypatch.setattr(analyze_service, "analyze_asset", lambda ticker: mock_result)

        response = client.post('/analyze', json={"ticker": "PETR4"})
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["success"] is True
        assert "analysis" in data
        assert data["analysis"]["tipo"] == "analise_estruturada"
        assert data["analysis"]["ticker"] == "PETR4"
        assert 0 <= data["analysis"]["probabilidade"] <= 1
        assert data["analysis"]["recomendacao"] in ["COMPRA", "VENDA", "AGUARDAR"]
        assert data["analysis"]["nivel_confianca"] in ["Alto", "Médio", "Baixo"]

    def test_analyze_structured_json_schema(self, client, monkeypatch):
        """Valida que o JSON estruturado tem todos os campos obrigatórios."""
        REQUIRED_FIELDS = [
            "tipo", "ticker", "probabilidade", "direcao",
            "analise_tecnica", "analise_fundamentalista",
            "recomendacao", "justificativa", "nivel_confianca"
        ]

        mock_analysis = {
            "tipo": "analise_estruturada",
            "ticker": "AAPL",
            "probabilidade": 0.65,
            "direcao": "Alta",
            "analise_tecnica": "RSI em zona neutra.",
            "analise_fundamentalista": "Apple com margem de lucro crescente.",
            "recomendacao": "COMPRA",
            "justificativa": "Momentum positivo.",
            "nivel_confianca": "Médio"
        }

        import services.analyze_service as analyze_service
        monkeypatch.setattr(analyze_service, "analyze_asset", lambda ticker: {
            "success": True, "ticker": "AAPL", "ml_raw": None, "analysis": mock_analysis
        })

        response = client.post('/analyze', json={"ticker": "AAPL"})
        data = json.loads(response.data)
        analysis = data["analysis"]

        for field in REQUIRED_FIELDS:
            assert field in analysis, f"Campo obrigatório ausente: {field}"

    def test_analyze_persists_history_when_mongo_id_provided(self, client, monkeypatch):
        """Deve gravar a análise no Mongo quando mongo_id é enviado."""
        mock_analysis = {
            "tipo": "analise_estruturada",
            "ticker": "PETR4",
            "probabilidade": 0.7,
            "direcao": "Alta",
            "analise_tecnica": "Tendência de alta.",
            "analise_fundamentalista": "Fundamentos estáveis.",
            "recomendacao": "COMPRA",
            "justificativa": "Probabilidade favorável.",
            "nivel_confianca": "Alto"
        }

        import services.analyze_service as analyze_service
        import app as flask_app

        monkeypatch.setattr(analyze_service, "analyze_asset", lambda ticker: {
            "success": True, "ticker": "PETR4", "ml_raw": None, "analysis": mock_analysis
        })

        called = {}

        def fake_save(mongo_id, ticker, analysis):
            called["mongo_id"] = mongo_id
            called["ticker"] = ticker
            called["analysis"] = analysis
            return True

        monkeypatch.setattr(flask_app, "save_analysis_to_history", fake_save)

        response = client.post('/analyze', json={"ticker": "PETR4", "mongo_id": "session-abc"})
        assert response.status_code == 200
        assert called["mongo_id"] == "session-abc"
        assert called["ticker"] == "PETR4"
        assert called["analysis"]["tipo"] == "analise_estruturada"


# ─────────────────────────────────────────────
# TESTES: Healthcheck
# ─────────────────────────────────────────────

class TestHealth:
    def test_health_check(self, client):
        """Deve retornar status ok."""
        response = client.get('/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data["status"] == "ok"
        assert data["service"] == "neuro-learning"
