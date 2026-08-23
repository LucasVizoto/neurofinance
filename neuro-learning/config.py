import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    MONGO_URI = os.getenv("MONGO_URI") or os.getenv("MONGO_URL") or "mongodb://localhost:27017"
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "neurofinance")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "dummy_key_to_allow_import")
    ALPHAVANTAGE_API_KEY = os.getenv("ALPHAVANTAGE_API_KEY")

config = Config()
