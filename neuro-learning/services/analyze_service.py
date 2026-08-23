import json
import traceback
from config import config
from services.predict_service import get_prediction
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

ANALYSIS_SYSTEM_PROMPT = """Você é o NeuroFinance, um analista quantitativo especializado em mercado de capitais.
Você receberá dados de um modelo de machine learning sobre um ativo financeiro e deve gerar uma análise profissional.

IMPORTANTE: Retorne EXCLUSIVAMENTE um JSON válido, sem markdown, sem texto antes ou depois.
O formato obrigatório é:
{{
  "tipo": "analise_estruturada",
  "ticker": "CÓDIGO_DO_ATIVO",
  "probabilidade": <número entre 0 e 1>,
  "direcao": "<Alta ou Baixa/Manter>",
  "analise_tecnica": "<análise técnica detalhada em 2-3 frases>",
  "analise_fundamentalista": "<pontos fundamentalistas relevantes em 2-3 frases>",
  "recomendacao": "<COMPRA, VENDA ou AGUARDAR>",
  "justificativa": "<justificativa clara da recomendação em 2-3 frases>",
  "nivel_confianca": "<Alto, Médio ou Baixo>"
}}"""

ANALYSIS_HUMAN_TEMPLATE = """Dados do modelo preditivo para o ativo {ticker}:
- Data de referência: {date}
- Direção prevista: {prediction} 
- Probabilidade de alta: {confidence:.1%}

Com base nesses dados quantitativos, gere uma análise profissional completa do ativo {ticker}."""

llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    google_api_key=config.GEMINI_API_KEY,
    temperature=0.3  # Menor temperatura para análises mais determinísticas
)

analysis_prompt = ChatPromptTemplate.from_messages([
    ("system", ANALYSIS_SYSTEM_PROMPT),
    ("human", ANALYSIS_HUMAN_TEMPLATE)
])

analysis_chain = analysis_prompt | llm


def _extract_content(response) -> str:
    """
    Extrai o texto da resposta do Gemini via LangChain.
    O Gemini 3.x pode retornar content como string ou como lista de blocos.
    """
    content = response.content
    if isinstance(content, list):
        # Ex: [{'type': 'text', 'text': '...'}, ...]
        parts = []
        for block in content:
            if isinstance(block, dict):
                parts.append(block.get('text', str(block)))
            else:
                parts.append(str(block))
        content = ''.join(parts)
    content = content.strip()
    # Remover markdown code blocks se presentes
    if content.startswith('```'):
        lines = content.split('\n')
        # Remover primeira linha (```json ou ```) e ultima linha (```)
        content = '\n'.join(lines[1:-1] if lines[-1].strip() == '```' else lines[1:])
    return content.strip()

def analyze_asset(ticker: str):
    """
    Pipeline completo: ML prediction → Gemini structured analysis.
    1. Roda o modelo quantitativo (CatBoost/GBM) para obter probabilidade de alta
    2. Usa o resultado como contexto para o Gemini gerar análise estruturada em JSON
    """
    if not config.GEMINI_API_KEY or config.GEMINI_API_KEY == "sua_chave_gemini_aqui":
        return {"success": False, "error": "GEMINI_API_KEY não configurada."}

    # Step 1: ML Prediction
    prediction_result = get_prediction(ticker)

    if not prediction_result.get("success"):
        # Fallback: análise puramente qualitativa via Gemini se ML falhar
        # (ML pode falhar por ticker desconhecido, dados insuficientes, etc.)
        print(f"[analyze_asset] ML falhou para {ticker}: {prediction_result.get('error')} — usando fallback Gemini")
        return _gemini_only_analysis(ticker, prediction_result.get("error", "Modelo ML não suporta este ativo"))

    ml_prediction = prediction_result["prediction"]
    ml_confidence = prediction_result["confidence"]
    ml_date = prediction_result.get("date", "N/A")

    # Step 2: Gemini structured analysis
    try:
        response = analysis_chain.invoke({
            "ticker": ticker.upper(),
            "date": ml_date,
            "prediction": ml_prediction,
            "confidence": ml_confidence
        })

        content = _extract_content(response)

        structured = json.loads(content)
        # Garantir que os dados do ML prevalecem sobre qualquer alucinação do Gemini
        structured["probabilidade"] = round(ml_confidence, 4)
        structured["direcao"] = ml_prediction
        structured["ticker"] = ticker.upper()
        structured["tipo"] = "analise_estruturada"

        return {
            "success": True,
            "ticker": ticker.upper(),
            "ml_raw": {
                "prediction": ml_prediction,
                "confidence": ml_confidence,
                "date": ml_date
            },
            "analysis": structured
        }

    except json.JSONDecodeError as e:
        # Se Gemini não retornou JSON válido, montar estrutura manualmente
        return {
            "success": True,
            "ticker": ticker.upper(),
            "ml_raw": {
                "prediction": ml_prediction,
                "confidence": ml_confidence,
                "date": ml_date
            },
            "analysis": {
                "tipo": "analise_estruturada",
                "ticker": ticker.upper(),
                "probabilidade": round(ml_confidence, 4),
                "direcao": ml_prediction,
                "analise_tecnica": f"Modelo quantitativo indica {ml_prediction} com {ml_confidence:.1%} de confiança.",
                "analise_fundamentalista": "Análise fundamentalista indisponível no momento.",
                "recomendacao": "COMPRA" if ml_confidence >= 0.6 else ("VENDA" if ml_confidence <= 0.4 else "AGUARDAR"),
                "justificativa": f"Com base na previsão quantitativa de {ml_confidence:.1%} de probabilidade de alta.",
                "nivel_confianca": "Alto" if ml_confidence >= 0.7 else ("Médio" if ml_confidence >= 0.5 else "Baixo")
            }
        }
    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": str(e)}


def _gemini_only_analysis(ticker: str, ml_error: str):
    """Fallback: análise qualitativa quando o modelo ML falha."""
    try:
        fallback_prompt = ChatPromptTemplate.from_messages([
            ("system", ANALYSIS_SYSTEM_PROMPT),
            ("human", f"Realize uma análise qualitativa do ativo {ticker.upper()} com base no seu conhecimento geral do mercado. "
                      f"Nota: O modelo quantitativo não pôde ser executado ({ml_error}).")
        ])
        response = (fallback_prompt | llm).invoke({})
        content = _extract_content(response)

        structured = json.loads(content)
        structured["ticker"] = ticker.upper()
        structured["tipo"] = "analise_estruturada"

        return {
            "success": True,
            "ticker": ticker.upper(),
            "ml_raw": None,
            "analysis": structured
        }
    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": f"ML falhou: {ml_error}. Gemini fallback também falhou: {str(e)}"}
