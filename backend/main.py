from contextlib import asynccontextmanager

from fastapi import FastAPI
from redis.asyncio import Redis

from backend.config import REDIS_URL
from backend.db import postgres, sqlite

redis_client: Redis | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect to databases and Redis. Shutdown: disconnect cleanly."""
    global redis_client
    await postgres.connect()
    await sqlite.connect()
    redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
    yield
    if redis_client:
        await redis_client.aclose()
    await sqlite.disconnect()
    await postgres.disconnect()


app = FastAPI(title="Aelarian Archives", lifespan=lifespan)


@app.get("/health")
async def health():
    """Verify database and Redis connections are live."""
    pg_ok = False
    sqlite_ok = False
    redis_ok = False
    errors: dict[str, str] = {}

    try:
        from sqlalchemy import text

        async with postgres.engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            pg_ok = True
    except Exception as e:
        errors["postgres"] = f"{type(e).__name__}: {e}"

    try:
        from sqlalchemy import text

        async with sqlite.engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
            sqlite_ok = True
    except Exception as e:
        errors["sqlite"] = f"{type(e).__name__}: {e}"

    try:
        if redis_client:
            await redis_client.ping()
            redis_ok = True
        else:
            errors["redis"] = "client not initialized"
    except Exception as e:
        errors["redis"] = f"{type(e).__name__}: {e}"

    status = "ok" if (pg_ok and sqlite_ok and redis_ok) else "degraded"
    result: dict = {"status": status, "postgres": pg_ok, "sqlite": sqlite_ok, "redis": redis_ok}
    if errors:
        result["errors"] = errors
    return result
