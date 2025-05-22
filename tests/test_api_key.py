import pytest
from httpx import AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_api_key_crud():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Kullanıcı kaydı ve login
        await ac.post("/api/v1/auth/register", json={"email": "apikeyuser@example.com", "password": "testpass"})
        login_resp = await ac.post("/api/v1/auth/login", json={"email": "apikeyuser@example.com", "password": "testpass"})
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # API key ekle
        resp = await ac.post("/api/v1/api-keys/", json={"api_key": "binancekey", "secret_key": "binancesecret", "label": "main"}, headers=headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["label"] == "main"
        api_key_id = data["id"]

        # Listele
        resp = await ac.get("/api/v1/api-keys/", headers=headers)
        assert resp.status_code == 200
        keys = resp.json()
        assert len(keys) == 1
        assert keys[0]["label"] == "main"

        # Sil
        resp = await ac.delete(f"/api/v1/api-keys/{api_key_id}", headers=headers)
        assert resp.status_code == 204

        # Tekrar listele (boş olmalı)
        resp = await ac.get("/api/v1/api-keys/", headers=headers)
        assert resp.status_code == 200
        keys = resp.json()
        assert len(keys) == 0

@pytest.mark.asyncio
async def test_api_key_unauthorized():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Yetkisiz ekleme
        resp = await ac.post("/api/v1/api-keys/", json={"api_key": "k", "secret_key": "s"})
        assert resp.status_code == 401
        # Yetkisiz listeleme
        resp = await ac.get("/api/v1/api-keys/")
        assert resp.status_code == 401
        # Yetkisiz silme
        resp = await ac.delete("/api/v1/api-keys/1")
        assert resp.status_code == 401
