"""Cache genérico no MongoDB para respostas de APIs externas (Alpha Vantage)."""
from datetime import datetime, timedelta, timezone

from pymongo import MongoClient

from config import config

_client = None
_COLLECTION = "dashboard_cache"


def _db():
    global _client
    if _client is None:
        _client = MongoClient(config.MONGO_URI, serverSelectionTimeoutMS=3000)
    return _client[config.MONGO_DB_NAME]


def _now():
    return datetime.now(timezone.utc)


def _aware(dt):
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def cache_get(key: str):
    try:
        return _db()[_COLLECTION].find_one({"_id": key})
    except Exception as exc:
        print(f"[mongo_cache] get failed ({key}): {exc}")
        return None


def cache_get_fresh(key: str):
    """Retorna o payload se o TTL ainda não expirou."""
    doc = cache_get(key)
    if not doc:
        return None
    expires = _aware(doc.get("expires_at"))
    if expires and expires > _now():
        return doc.get("data")
    return None


def cache_get_stale(key: str):
    """Retorna o último payload conhecido, mesmo expirado (fallback de rate limit)."""
    doc = cache_get(key)
    return doc.get("data") if doc else None


def cache_set(key: str, data, ttl_seconds: int):
    try:
        now = _now()
        _db()[_COLLECTION].update_one(
            {"_id": key},
            {
                "$set": {
                    "data": data,
                    "fetched_at": now,
                    "expires_at": now + timedelta(seconds=ttl_seconds),
                }
            },
            upsert=True,
        )
    except Exception as exc:
        print(f"[mongo_cache] set failed ({key}): {exc}")
