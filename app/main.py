from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth_router, api_key_router, bot_config_router, bot_state_router, trade_router, bot_runner_router, bot_report_router, symbols_router

app = FastAPI(title="TradeBot API")

# CORS middleware ekleme
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Development için tüm origin'lere izin ver
    allow_credentials=True,
    allow_methods=["*"],  # Tüm HTTP metodlarına izin ver
    allow_headers=["*"],  # Tüm header'lara izin ver
)

app.include_router(auth_router)
app.include_router(api_key_router)
app.include_router(bot_config_router)
app.include_router(bot_state_router)
app.include_router(trade_router)
app.include_router(bot_runner_router)
app.include_router(bot_report_router)
app.include_router(symbols_router)
