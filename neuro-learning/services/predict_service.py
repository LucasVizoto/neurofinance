import os
import sys
from pathlib import Path
import traceback

# Add current dir to path to import local modules
sys.path.append(str(Path(__file__).resolve().parent.parent))

import stock_predictor

def get_prediction(ticker: str):
    """
    Treina o modelo (on-demand) para o ticker fornecido e retorna a predição para o dia seguinte.
    """
    try:
        # Run pipeline sem gerar gráficos
        model, scaler, df_feat = stock_predictor.run_pipeline(
            company=ticker.upper(), 
            model_type="gbm", 
            save_plots=False, 
            show_plots=False
        )
        
        # Recupera a última linha de features (o 'hoje') que foi separada no patch
        if not hasattr(stock_predictor, 'LATEST_INFERENCE_ROW'):
            raise ValueError("Não foi possível encontrar a linha de inferência.")
            
        inference_row = stock_predictor.LATEST_INFERENCE_ROW
        
        X_latest = inference_row[stock_predictor.FEATURE_COLS]
        X_latest_scaled = scaler.transform(X_latest)
        
        # Prever o dia seguinte
        prediction = model.predict(X_latest_scaled)[0]
        probability = model.predict_proba(X_latest_scaled)[0][1] # Prob de ser 1 (Subir)
        
        return {
            "success": True,
            "ticker": ticker.upper(),
            "prediction": "Alta" if prediction == 1 else "Baixa/Manter",
            "confidence": float(probability),
            "date": str(inference_row.index[0].date())
        }
    except Exception as e:
        traceback.print_exc()
        return {
            "success": False,
            "ticker": ticker.upper(),
            "error": str(e)
        }
