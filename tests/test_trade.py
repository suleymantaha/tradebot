import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_trade_crud():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Kullanıcı kaydı ve login
        await ac.post("/api/v1/auth/register", json={"email": "tradeuser@example.com", "password": "testpass"})
        login_resp = await ac.post("/api/v1/auth/login", json={"email": "tradeuser@example.com", "password": "testpass"})
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # Bot config ekle
        bot_data = {
            "name": "BTC/USDT EMA Cross",
            "symbol": "BTC/USDT",
            "timeframe": "1h",
            "stop_loss_perc": 2.0,
            "take_profit_perc": 4.0,
            "ema_fast": 9,
            "ema_slow": 21,
            "rsi_period": 14,
            "rsi_oversold": 30,
            "rsi_overbought": 70
        }
        resp = await ac.post("/api/v1/bot-configs/", json=bot_data, headers=headers)
        assert resp.status_code == 201
        config_id = resp.json()["id"]

        # Trade ekle
        trade_data = {
            "bot_config_id": config_id,
            "user_id": 1,
            "symbol": "BTC/USDT",
            "side": "BUY",
            "order_type": "MARKET",
            "price": 50000.0,
            "quantity_filled": 0.01,
            "quote_quantity_filled": 500.0
        }
        resp = await ac.post("/api/v1/trades/", json=trade_data, headers=headers)
        assert resp.status_code == 201
        trade_id = resp.json()["id"]

        # Listele
        resp = await ac.get("/api/v1/trades/", headers=headers)
        assert resp.status_code == 200
        trades = resp.json()
        assert len(trades) == 1
        assert trades[0]["id"] == trade_id

        # Detay getir
        resp = await ac.get(f"/api/v1/trades/{trade_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == trade_id

        # Hatalı id
        resp = await ac.get(f"/api/v1/trades/99999", headers=headers)
        assert resp.status_code == 404

@pytest.mark.asyncio
async def test_trade_unauthorized():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Yetkisiz ekleme
        trade_data = {"bot_config_id": 1, "user_id": 1, "symbol": "BTC/USDT", "side": "BUY", "order_type": "MARKET", "price": 50000.0, "quantity_filled": 0.01, "quote_quantity_filled": 500.0}
        resp = await ac.post("/api/v1/trades/", json=trade_data)
        assert resp.status_code == 401
        # Yetkisiz listeleme
        resp = await ac.get("/api/v1/trades/")
        assert resp.status_code == 401
        # Yetkisiz detay
        resp = await ac.get("/api/v1/trades/1")
        assert resp.status_code == 401
