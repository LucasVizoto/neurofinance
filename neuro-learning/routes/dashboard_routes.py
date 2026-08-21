from flask import Blueprint, request, jsonify
import yfinance as yf
from datetime import datetime, timedelta

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
def get_dashboard_data():
    """
    Retorna os dados financeiros mais recentes de um ativo.
    Usa PETR4.SA como padrão se não for fornecido um.
    """
    ticker_symbol = request.args.get('ticker', 'PETR4.SA')
    
    try:
        # Busca o histórico do último mês
        ticker = yf.Ticker(ticker_symbol)
        history = ticker.history(period="1mo")
        
        if history.empty:
            return jsonify({"success": False, "error": "Ticker not found or no data available."}), 404
            
        # Pega a última cotação (fechamento)
        last_quote = history.iloc[-1]
        current_price = float(last_quote['Close'])
        current_volume = int(last_quote['Volume'])
        
        # Pega a penúltima cotação para calcular tendência
        if len(history) > 1:
            prev_quote = history.iloc[-2]
            prev_price = float(prev_quote['Close'])
            trend_percentage = ((current_price - prev_price) / prev_price) * 100
        else:
            trend_percentage = 0.0
            
        # Formata o histórico para o frontend (para gráficos de linha)
        history_data = []
        for index, row in history.iterrows():
            history_data.append({
                "date": index.strftime('%Y-%m-%d'),
                "price": float(row['Close']),
                "volume": int(row['Volume'])
            })
            
        return jsonify({
            "success": True,
            "ticker": ticker_symbol,
            "currentPrice": current_price,
            "currentVolume": current_volume,
            "trend": trend_percentage,
            "history": history_data
        }), 200
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500
