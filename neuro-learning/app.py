# pyrefly: ignore [missing-import]
from flask import Flask, request, jsonify
from flask_cors import CORS
from services.predict_service import get_prediction
from services.chat_service import chat_with_agent, get_chat_history_messages, save_analysis_to_history
from services.analyze_service import analyze_asset
from routes.dashboard_routes import dashboard_bp

app = Flask(__name__)
CORS(app)

app.register_blueprint(dashboard_bp)


@app.route('/health', methods=['GET'])
def health_check():
    """Rota de healthcheck para o serviço."""
    return jsonify({"status": "ok", "service": "neuro-learning"}), 200


@app.route('/predict', methods=['POST'])
def predict():
    """
    Realiza o treinamento/inferência sob demanda para o ativo informado.
    Retorna a previsão bruta do modelo ML sem análise qualitativa.
    """
    data = request.get_json()
    if not data or 'ticker' not in data:
        return jsonify({"success": False, "error": "Missing 'ticker' parameter."}), 400

    ticker = data['ticker']
    result = get_prediction(ticker)

    if result.get("success"):
        return jsonify(result), 200
    else:
        return jsonify(result), 500


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Pipeline completo de análise de ativos:
    1. Executa o modelo ML para obter probabilidade quantitativa
    2. Usa o resultado como contexto para o Gemini gerar análise estruturada em JSON
    Retorna um objeto JSON estruturado com análise técnica, fundamentalista e recomendação.
    """
    data = request.get_json()
    if not data or 'ticker' not in data:
        return jsonify({"success": False, "error": "Missing 'ticker' parameter."}), 400

    ticker = data['ticker']
    mongo_id = data.get('mongo_id')
    result = analyze_asset(ticker)

    if result.get("success"):
        if mongo_id and result.get("analysis"):
            save_analysis_to_history(mongo_id, ticker, result["analysis"])
        return jsonify(result), 200
    else:
        return jsonify(result), 500


@app.route('/chat', methods=['POST'])
def chat():
    """
    Interage com o modelo Conversacional via LangChain, mantendo o histórico no MongoDB.
    Retorna JSON estruturado quando a mensagem for uma análise formal, texto simples caso contrário.
    """
    data = request.get_json()
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON body."}), 400

    mongo_id = data.get('mongo_id')
    message = data.get('message')
    ticker = data.get('ticker', 'Sem preferência')

    if not mongo_id or not message:
        return jsonify({"success": False, "error": "Missing 'mongo_id' or 'message' parameters."}), 400

    result = chat_with_agent(mongo_id, message, ticker)

    if result.get("success"):
        return jsonify(result), 200
    else:
        return jsonify(result), 500


@app.route('/chat/<mongo_id>', methods=['GET'])
def get_history(mongo_id):
    """
    Recupera o histórico de mensagens de um chat específico do MongoDB.
    """
    if not mongo_id:
        return jsonify({"success": False, "error": "Missing 'mongo_id' parameter."}), 400

    result = get_chat_history_messages(mongo_id)

    if result.get("success"):
        return jsonify(result), 200
    else:
        return jsonify(result), 500


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
