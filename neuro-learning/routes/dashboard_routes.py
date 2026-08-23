from flask import Blueprint, request, jsonify

from services.alpha_vantage_service import (
    get_growth_series,
    get_market_news,
    get_market_quotes,
    get_price_history,
    get_ticker_fundamentals,
    get_top_valuations,
)

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/dashboard', methods=['GET'])
def get_dashboard_data():
    """
    Cotação, volume, histórico (TIME_SERIES por período) e fundamentos (OVERVIEW / GLOBAL_QUOTE).
    """
    ticker_symbol = request.args.get('ticker', 'PETR4.SA')
    period = request.args.get('period', '1M')

    try:
        history = get_price_history(ticker_symbol, period)
        if not history.get("success"):
            return jsonify(history), 404

        fundamentals = get_ticker_fundamentals(ticker_symbol)
        return jsonify({
            **history,
            "marketCap": fundamentals.get("marketCap"),
            "peRatio": fundamentals.get("peRatio"),
            "dayHigh": fundamentals.get("dayHigh"),
            "dayLow": fundamentals.get("dayLow"),
            "currency": fundamentals.get("currency"),
            "assetName": fundamentals.get("name"),
        }), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@dashboard_bp.route('/dashboard/quotes', methods=['GET'])
def dashboard_quotes():
    """Cotações USD, EUR, Ouro e Prata via Alpha Vantage (cache Mongo)."""
    result = get_market_quotes()
    status = 200 if result.get("success") else 502
    return jsonify(result), status


@dashboard_bp.route('/dashboard/growth', methods=['GET'])
def dashboard_growth():
    """Série de crescimento no período (TIME_SERIES_INTRADAY / DAILY / WEEKLY)."""
    ticker = request.args.get('ticker', 'PETR4.SA')
    period = request.args.get('period', '1M')
    result = get_growth_series(ticker, period)
    status = 200 if result.get("success") else 502
    return jsonify(result), status


@dashboard_bp.route('/dashboard/valuations', methods=['GET'])
def dashboard_valuations():
    """Top 5 market caps (OVERVIEW) com fallback mock estruturado."""
    result = get_top_valuations()
    return jsonify(result), 200


@dashboard_bp.route('/dashboard/news', methods=['GET'])
def dashboard_news():
    """Feed NEWS_SENTIMENT, persistido no Mongo após cada fetch bem-sucedido."""
    ticker = request.args.get('ticker')
    result = get_market_news(ticker)
    return jsonify(result), 200
