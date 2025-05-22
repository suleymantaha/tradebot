import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_bot_config_crud():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Kullanıcı kaydı ve login
        await ac.post("/api/v1/auth/register", json={"email": "botuser@example.com", "password": "testpass"})
        login_resp = await ac.post("/api/v1/auth/login", json={"email": "botuser@example.com", "password": "testpass"})
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
        data = resp.json()
        assert data["name"] == "BTC/USDT EMA Cross"
        config_id = data["id"]

        # Listele
        resp = await ac.get("/api/v1/bot-configs/", headers=headers)
        assert resp.status_code == 200
        configs = resp.json()
        assert len(configs) == 1
        assert configs[0]["name"] == "BTC/USDT EMA Cross"

        # Detay getir
        resp = await ac.get(f"/api/v1/bot-configs/{config_id}", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["id"] == config_id

        # Güncelle
        update_data = {"name": "BTC/USDT EMA Cross Updated", "stop_loss_perc": 1.5, "take_profit_perc": 3.0, "ema_fast": 10, "ema_slow": 22, "rsi_period": 15, "rsi_oversold": 25, "rsi_overbought": 75, "symbol": "BTC/USDT", "timeframe": "1h"}
        resp = await ac.put(f"/api/v1/bot-configs/{config_id}", json=update_data, headers=headers)
        assert resp.status_code == 200
        assert resp.json()["name"] == "BTC/USDT EMA Cross Updated"

        # Sil
        resp = await ac.delete(f"/api/v1/bot-configs/{config_id}", headers=headers)
        assert resp.status_code == 204

        # Tekrar listele (boş olmalı)
        resp = await ac.get("/api/v1/bot-configs/", headers=headers)
        assert resp.status_code == 200
        configs = resp.json()
        assert len(configs) == 0

@pytest.mark.asyncio
async def test_bot_config_unauthorized():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Yetkisiz ekleme
        bot_data = {"name": "Test", "symbol": "BTC/USDT", "timeframe": "1h", "stop_loss_perc": 1, "take_profit_perc": 2, "ema_fast": 9, "ema_slow": 21, "rsi_period": 14, "rsi_oversold": 30, "rsi_overbought": 70}
        resp = await ac.post("/api/v1/bot-configs/", json=bot_data)
        assert resp.status_code == 401
        # Yetkisiz listeleme
        resp = await ac.get("/api/v1/bot-configs/")
        assert resp.status_code == 401
        # Yetkisiz detay
        resp = await ac.get("/api/v1/bot-configs/1")
        assert resp.status_code == 401
        # Yetkisiz güncelleme
        resp = await ac.put("/api/v1/bot-configs/1", json=bot_data)
        assert resp.status_code == 401
        # Yetkisiz silme
        resp = await ac.delete("/api/v1/bot-configs/1")
        assert resp.status_code == 401
