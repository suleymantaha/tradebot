from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.api.routes import auth_router, api_key_router, bot_config_router, bot_state_router, trade_router, bot_runner_router, bot_report_router, symbols_router, backtest_router
from app.api.routes.health import router as health_router
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.dependencies.auth import get_db, get_current_active_user
from app.models.user import User
from app.models.bot_state import BotState
from typing import cast
import asyncio
import os
import logging
from app.core.cache_warmup_tasks import warmup_futures_symbols_cache, warmup_spot_symbols_cache

app = FastAPI(title="TradeBot API")

# CORS middleware ekleme
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
_frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
allowed_origins = ["*"] if ENVIRONMENT != "production" else [_frontend_url]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(auth_router)
app.include_router(api_key_router)
app.include_router(bot_config_router)
app.include_router(bot_state_router)
app.include_router(trade_router)
app.include_router(bot_runner_router)
app.include_router(bot_report_router)
app.include_router(symbols_router)
app.include_router(backtest_router)
app.include_router(health_router)

logger = logging.getLogger(__name__)

# Uygulama başlangıcında futures sembolleri cache warm-up
@app.on_event("startup")
async def startup_warmup_futures_cache():
    enable = os.getenv("ENABLE_FUTURES_WARMUP_ON_STARTUP", "1")
    if enable == "1":
        async def _do_warmup():
            try:
                await asyncio.to_thread(warmup_futures_symbols_cache)
                logger.info("Startup warm-up futures symbols cache completed")
            except Exception as e:
                logger.warning(f"Startup warm-up futures symbols cache failed: {e}")
        asyncio.create_task(_do_warmup())

# Uygulama başlangıcında spot sembolleri cache warm-up
@app.on_event("startup")
async def startup_warmup_spot_cache():
    enable = os.getenv("ENABLE_SPOT_WARMUP_ON_STARTUP", "1")
    if enable == "1":
        async def _do_warmup_spot():
            try:
                await asyncio.to_thread(warmup_spot_symbols_cache)
                logger.info("Startup warm-up spot symbols cache completed")
            except Exception as e:
                logger.warning(f"Startup warm-up spot symbols cache failed: {e}")
        asyncio.create_task(_do_warmup_spot())

# SSE: Bot durumu akışı (temel)
@app.get("/api/v1/bots/{bot_config_id}/status-stream")
async def bot_status_stream(bot_config_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_active_user)):
    async def event_generator():
        last_payload = None
        while True:
            result = await db.execute(select(BotState).where(BotState.id == bot_config_id))
            state = result.scalars().first()
            payload = {
                "status": state.status if state else "unknown",
                "in_position": bool(state.in_position) if state else False,
                "entry_price": float(cast(float, state.entry_price)) if state and state.entry_price is not None else None,
                "daily_pnl": float(cast(float, state.daily_pnl)) if state and state.daily_pnl is not None else 0.0,
                "daily_trades_count": int(cast(int, state.daily_trades_count)) if state and state.daily_trades_count is not None else 0,
                "last_updated_at": str(state.last_updated_at) if state else None,
            }
            if payload != last_payload:
                yield f"data: {payload}\n\n"
                last_payload = payload
            await asyncio.sleep(2)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
