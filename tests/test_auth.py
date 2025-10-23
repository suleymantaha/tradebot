import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from sqlalchemy.ext.asyncio import AsyncSession

import asyncio

@pytest.mark.asyncio
async def test_register_and_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # Register
        response = await ac.post("/api/v1/auth/register", json={"email": "test@example.com", "password": "Str0ngP@ssword!"})
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["is_active"] is True

        # Login
        response = await ac.post("/api/v1/auth/login", json={"email": "test@example.com", "password": "Str0ngP@ssword!"})
        assert response.status_code == 200
        token_data = response.json()
        assert "access_token" in token_data
        assert token_data["token_type"] == "bearer"

        # Me endpoint
        headers = {"Authorization": f"Bearer {token_data['access_token']}"}
        response = await ac.get("/api/v1/auth/me", headers=headers)
        assert response.status_code == 200
        me_data = response.json()
        assert me_data["email"] == "test@example.com"

@pytest.mark.asyncio
async def test_register_duplicate():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # İlk kayıt
        await ac.post("/api/v1/auth/register", json={"email": "dupe@example.com", "password": "Str0ngP@ssword!"})
        # Aynı email ile tekrar kayıt
        response = await ac.post("/api/v1/auth/register", json={"email": "dupe@example.com", "password": "Str0ngP@ssword!"})
        assert response.status_code == 409

@pytest.mark.asyncio
async def test_login_wrong_password():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        await ac.post("/api/v1/auth/register", json={"email": "wrongpass@example.com", "password": "Str0ngP@ssword!"})
        response = await ac.post("/api/v1/auth/login", json={"email": "wrongpass@example.com", "password": "WrongPass123!"})
        assert response.status_code == 401
