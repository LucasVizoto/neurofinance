import json
import traceback
from config import config
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# Setup LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash",
    google_api_key=config.GEMINI_API_KEY,
    temperature=0.7
)

SYSTEM_PROMPT = """Você é o NeuroFinance, um agente de IA especializado em analisar ativos financeiros do mercado de ações.
Você possui conhecimentos profundos sobre análise técnica e fundamentalista.
O usuário informou que seu ativo de preferência/foco é: {ticker}.

REGRAS DE RESPOSTA:
1. Para perguntas gerais sobre finanças, mercado ou o ativo, responda em texto claro em português do Brasil.
2. Quando o usuário pedir uma análise formal de um ativo (palavras-chave: "analisar", "análise", "avaliar", "previsão", "probabilidade"), 
   retorne EXCLUSIVAMENTE um JSON válido no seguinte formato, sem markdown, sem texto antes ou depois:
   {{
     "tipo": "analise_estruturada",
     "ticker": "CÓDIGO_DO_ATIVO",
     "probabilidade": 0.0,
     "direcao": "Alta" ou "Baixa/Manter",
     "analise_tecnica": "Texto com análise técnica detalhada",
     "analise_fundamentalista": "Texto com pontos fundamentalistas relevantes",
     "recomendacao": "COMPRA" ou "VENDA" ou "AGUARDAR",
     "justificativa": "Texto explicando a recomendação",
     "nivel_confianca": "Alto" ou "Médio" ou "Baixo"
   }}
3. Nunca use markdown (**, ##, etc.) nas respostas JSON.
4. Responda sempre em português do Brasil."""

# Setup Prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", SYSTEM_PROMPT),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{message}")
])

chain = prompt | llm


def get_chat_history(session_id: str):
    return MongoDBChatMessageHistory(
        connection_string=config.MONGO_URI,
        session_id=session_id,
        database_name=config.MONGO_DB_NAME,
        collection_name="chat_histories"
    )


chain_with_history = RunnableWithMessageHistory(
    chain,
    get_chat_history,
    input_messages_key="message",
    history_messages_key="history"
)


def _extract_content(response) -> str:
    """
    Extrai texto da resposta do Gemini via LangChain.
    Gemini 3.x pode retornar content como lista de blocos.
    """
    content = response.content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                parts.append(block.get('text', str(block)))
            else:
                parts.append(str(block))
        content = ''.join(parts)
    return content.strip()

def chat_with_agent(mongo_id: str, message: str, ticker: str):
    """
    Envia uma mensagem para o agente Gemini mantendo o histórico no MongoDB.
    Retorna JSON estruturado quando for uma análise formal, texto simples caso contrário.
    """
    if not config.GEMINI_API_KEY or config.GEMINI_API_KEY == "sua_chave_gemini_aqui":
        return {"success": False, "error": "GEMINI_API_KEY não configurada."}

    try:
        response = chain_with_history.invoke(
            {"message": message, "ticker": ticker},
            config={"configurable": {"session_id": mongo_id}}
        )
        content = _extract_content(response)

        # Tentar detectar e parsear JSON estruturado
        parsed = _try_parse_structured(content)
        if parsed:
            return {"success": True, "response": content, "structured": parsed}

        return {"success": True, "response": content}
    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": str(e)}


def _try_parse_structured(content: str):
    """Tenta extrair JSON estruturado da resposta do Gemini."""
    # Remove possíveis blocos de código markdown
    clean = content.strip()
    if clean.startswith("```"):
        lines = clean.split("\n")
        clean = "\n".join(lines[1:-1])
    try:
        data = json.loads(clean)
        if data.get("tipo") == "analise_estruturada":
            return data
    except Exception:
        pass
    return None


def _normalize_message_content(content) -> str:
    """Garante que o conteúdo persistido/lido do Mongo seja sempre string."""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                parts.append(block.get("text", str(block)))
            else:
                parts.append(str(block))
        return "".join(parts)
    if isinstance(content, dict):
        return json.dumps(content, ensure_ascii=False)
    return str(content)


def save_analysis_to_history(mongo_id: str, ticker: str, analysis: dict) -> bool:
    """
    Persiste a análise estruturada no histórico MongoDB do chat
    (mesma collection usada pelo LangChain no POST /chat).
    """
    try:
        history = get_chat_history(mongo_id)
        history.add_user_message(f"Analisar ativo {ticker.upper()}")
        history.add_ai_message(json.dumps(analysis, ensure_ascii=False))
        return True
    except Exception as e:
        traceback.print_exc()
        print(f"[save_analysis_to_history] Falha ao persistir análise de {ticker}: {e}")
        return False


def get_chat_history_messages(mongo_id: str):
    """
    Retorna o histórico de mensagens de um chat específico.
    """
    try:
        history = get_chat_history(mongo_id)
        messages = []
        for msg in history.messages:
            messages.append({
                "type": msg.type,  # 'human' or 'ai'
                "content": _normalize_message_content(msg.content)
            })
        return {"success": True, "messages": messages}
    except Exception as e:
        traceback.print_exc()
        return {"success": False, "error": str(e)}
