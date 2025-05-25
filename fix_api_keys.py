#!/usr/bin/env python3
"""
API Key Encryption Fix Script
Eski encryption anahtarı ile şifrelenmiş API anahtarlarını temizler.
Kullanıcının API anahtarını yeniden eklemesi gerekir.
"""

import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import engine
from app.models.user import User
from app.models.api_key import APIKey

async def main():
    print("🔧 API Key Encryption Fix başlatılıyor...")

    async with AsyncSession(engine) as session:
        try:
            # Tüm API anahtarlarını bul
            result = await session.execute(
                "SELECT id, user_id, label FROM api_keys"
            )
            api_keys = result.fetchall()

            if not api_keys:
                print("✅ Hiç API anahtarı bulunamadı.")
                return

            print(f"📋 {len(api_keys)} API anahtarı bulundu.")

            # Tüm API anahtarlarını sil
            await session.execute("DELETE FROM api_keys")
            await session.commit()

            print("🗑️  Eski (bozuk) API anahtarları temizlendi.")
            print("💡 Lütfen frontend'den API anahtarınızı yeniden ekleyin.")
            print("   📍 Dashboard -> API Anahtarı Ekle")

        except Exception as e:
            print(f"❌ Hata: {e}")
            await session.rollback()

if __name__ == "__main__":
    asyncio.run(main())
