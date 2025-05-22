from fastapi import FastAPI
from app.api.routes import auth_router, api_key_router, bot_config_router, bot_state_router, trade_router, bot_runner_router, bot_report_router

app = FastAPI(title="TradeBot API")

app.include_router(auth_router)
app.include_router(api_key_router)
app.include_router(bot_config_router)
app.include_router(bot_state_router)
app.include_router(trade_router)
app.include_router(bot_runner_router)
app.include_router(bot_report_router)
