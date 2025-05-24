import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch, MagicMock

def test_api_key_crud():
    # Binance API validation'ını mock'la
    with patch('app.core.binance_client.BinanceClientWrapper') as mock_client:
        mock_instance = MagicMock()
        mock_instance.validate_api_credentials.return_value = {"valid": True, "error": None, "account_info": {"accountType": "SPOT"}}
        mock_client.return_value = mock_instance

        with TestClient(app) as ac:
            # Kullanıcı kaydı ve login
            ac.post("/api/v1/auth/register", json={"email": "apikeyuser@example.com", "password": "testpass"})
            login_resp = ac.post("/api/v1/auth/login", json={"email": "apikeyuser@example.com", "password": "testpass"})
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # API key ekle
            resp = ac.post("/api/v1/api-keys/", json={"api_key": "binancekey", "secret_key": "binancesecret", "label": "main"}, headers=headers)
            assert resp.status_code == 201
            data = resp.json()
            assert data["label"] == "main"
            assert "api_key_masked" in data
            assert data["is_valid"] == True

            # API key getir
            resp = ac.get("/api/v1/api-keys/me", headers=headers)
            assert resp.status_code == 200
            data = resp.json()
            assert data["label"] == "main"
            assert "api_key_masked" in data

            # Sil
            resp = ac.delete("/api/v1/api-keys/me", headers=headers)
            assert resp.status_code == 204

            # Tekrar getir (404 olmalı)
            resp = ac.get("/api/v1/api-keys/me", headers=headers)
            assert resp.status_code == 404

def test_api_key_unauthorized():
    with TestClient(app) as ac:
        # Yetkisiz ekleme
        resp = ac.post("/api/v1/api-keys/", json={"api_key": "k", "secret_key": "s"})
        assert resp.status_code == 401
        # Yetkisiz getirme
        resp = ac.get("/api/v1/api-keys/me")
        assert resp.status_code == 401
        # Yetkisiz silme
        resp = ac.delete("/api/v1/api-keys/me")
        assert resp.status_code == 401

def test_api_key_invalid_credentials():
    # Geçersiz Binance API kimlik bilgileri testi
    with patch('app.core.binance_client.BinanceClientWrapper') as mock_client:
        mock_instance = MagicMock()
        mock_instance.validate_api_credentials.return_value = {"valid": False, "error": "Invalid API key", "account_info": None}
        mock_client.return_value = mock_instance

        with TestClient(app) as ac:
            # Kullanıcı kaydı ve login
            ac.post("/api/v1/auth/register", json={"email": "invalidapi@example.com", "password": "testpass"})
            login_resp = ac.post("/api/v1/auth/login", json={"email": "invalidapi@example.com", "password": "testpass"})
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # Geçersiz API key eklemeye çalış
            resp = ac.post("/api/v1/api-keys/", json={"api_key": "invalid", "secret_key": "invalid", "label": "invalid"}, headers=headers)
            assert resp.status_code == 400
            assert "geçersiz" in resp.json()["detail"]

def test_api_key_duplicate():
    # Aynı kullanıcının birden fazla API key eklemeye çalışması
    with patch('app.core.binance_client.BinanceClientWrapper') as mock_client:
        mock_instance = MagicMock()
        mock_instance.validate_api_credentials.return_value = {"valid": True, "error": None, "account_info": {"accountType": "SPOT"}}
        mock_client.return_value = mock_instance

        with TestClient(app) as ac:
            # Kullanıcı kaydı ve login
            ac.post("/api/v1/auth/register", json={"email": "duplicate@example.com", "password": "testpass"})
            login_resp = ac.post("/api/v1/auth/login", json={"email": "duplicate@example.com", "password": "testpass"})
            token = login_resp.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # İlk API key ekle
            resp = ac.post("/api/v1/api-keys/", json={"api_key": "first", "secret_key": "first", "label": "first"}, headers=headers)
            assert resp.status_code == 201

            # İkinci API key eklemeye çalış (hata almalı)
            resp = ac.post("/api/v1/api-keys/", json={"api_key": "second", "secret_key": "second", "label": "second"}, headers=headers)
            assert resp.status_code == 400
            assert "Zaten kayıtlı" in resp.json()["detail"]
