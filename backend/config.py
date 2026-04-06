import os
from pathlib import Path

from dotenv import load_dotenv

# Load .env from backend/ directory
_env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(_env_path)

# PostgreSQL (async) — required
DATABASE_URL: str = os.environ.get("DATABASE_URL", "")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set in backend/.env")

# Synchronous PostgreSQL URL for Alembic migrations
# asyncpg -> psycopg2: postgresql+asyncpg:// -> postgresql://
DATABASE_URL_SYNC: str = DATABASE_URL.replace("+asyncpg", "")

# SQLite operational DB — path relative to backend/
SQLITE_PATH: str = os.environ.get("SQLITE_PATH", "db/operational.db")
_backend_dir = Path(__file__).resolve().parent
SQLITE_FULL_PATH: Path = _backend_dir / SQLITE_PATH
SQLITE_URL: str = f"sqlite+aiosqlite:///{SQLITE_FULL_PATH}"

# Ollama
OLLAMA_BASE_URL: str = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434")

# Claude API
ANTHROPIC_API_KEY: str = os.environ.get("ANTHROPIC_API_KEY", "")

# Redis
REDIS_URL: str = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
