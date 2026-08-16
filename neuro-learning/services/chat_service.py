from config import config
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_mongodb.chat_message_histories import MongoDBChatMessageHistory
from langchain_core.runnables.history import RunnableWithMessageHistory

# Setup LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash", 
    google_api_key=config.GEMINI_API_KEY,
    temperature=0.7
)

# Setup Prompt
prompt = ChatPromptTemplate.from_messages([
    ("system", "Você é o NeuroFinance, um agente de IA especializado em analisar ativos financeiros do mercado de ações. "
               "Você possui conhecimentos sobre análise técnica e fundamentalista. "
               "O usuário informou que seu ativo de preferência/foco é: {ticker}. "
               "Você deve usar essa preferência como contexto inicial das suas respostas caso o assunto seja mercado. "
               "Responda sempre em português do Brasil de forma clara e profissional."),
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

def chat_with_agent(mongo_id: str, message: str, ticker: str):
    """
    Envia uma mensagem para o agente Gemini mantendo o histórico no MongoDB.
    """
    if not config.GEMINI_API_KEY:
        return {"success": False, "error": "GEMINI_API_KEY is missing."}
        
    try:
        response = chain_with_history.invoke(
            {"message": message, "ticker": ticker},
            config={"configurable": {"session_id": mongo_id}}
        )
        return {"success": True, "response": response.content}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

def get_chat_history_messages(mongo_id: str):
    """
    Retorna o histórico de mensagens de um chat específico.
    """
    try:
        history = get_chat_history(mongo_id)
        messages = []
        for msg in history.messages:
            messages.append({
                "type": msg.type, # 'human' or 'ai'
                "content": msg.content
            })
        return {"success": True, "messages": messages}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

