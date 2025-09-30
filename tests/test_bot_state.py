import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app

@pytest.mark.asyncio
async def test_bot_state_get_and_update():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Kullanıcı kaydı ve login
        await ac.post("/api/v1/auth/register", json={"email": "stateuser@example.com", "password": "testpass"})
        login_resp = await ac.post("/api/v1/auth/login", json={"email": "stateuser@example.com", "password": "testpass"})
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

        # BotState manuel oluştur (normalde bot başlatınca oluşur, test için doğrudan ekliyoruz)
        from app.models.bot_state import BotState
        from app.models.bot_config import BotConfig
        from app.database import SessionLocal
        async with SessionLocal() as db:
            state = BotState(id=config_id)
            db.add(state)
            await db.commit()

        # Görüntüle
        resp = await ac.get(f"/api/v1/bot-states/{config_id}", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["id"] == config_id
        assert data["status"] == "stopped"

        # Güncelle
        update_data = {"status": "running", "in_position": True, "daily_pnl": 123.45}
        resp = await ac.put(f"/api/v1/bot-states/{config_id}", json=update_data, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["status"] == "running"
        assert data["in_position"] is True
        assert data["daily_pnl"] == 123.45

        # Hatalı id
        resp = await ac.get(f"/api/v1/bot-states/99999", headers=headers)
        assert resp.status_code == 404
        resp = await ac.put(f"/api/v1/bot-states/99999", json=update_data, headers=headers)
        assert resp.status_code == 404

@pytest.mark.asyncio
async def test_bot_state_unauthorized():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Yetkisiz görüntüleme
        resp = await ac.get("/api/v1/bot-states/1")
        assert resp.status_code == 401
        # Yetkisiz güncelleme
        resp = await ac.put("/api/v1/bot-states/1", json={"status": "running"})
        assert resp.status_code == 401
