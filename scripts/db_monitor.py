#!/usr/bin/env python3
"""
TradeBot PostgreSQL Database Monitor
Bu script veritabanı durumunu kontrol eder ve basit istatistikler gösterir.
"""

import asyncio
import asyncpg
import os
from datetime import datetime
from tabulate import tabulate

async def get_db_stats():
    """Veritabanı istatistiklerini getir"""

    # Database bağlantı bilgileri
    DATABASE_URL = os.getenv(
        "DATABASE_URL",
        "postgresql://tradebot_user:tradebot_secure_pass_123@localhost:5432/tradebot_db"
    )

    try:
        # Veritabanına bağlan
        conn = await asyncpg.connect(DATABASE_URL.replace("+asyncpg", ""))

        print("🐘 TradeBot PostgreSQL Database Monitor")
        print("=" * 50)
        print(f"📅 Tarih: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print()

        # 1. Kullanıcı sayısı
        user_count = await conn.fetchval("SELECT COUNT(*) FROM users")
        print(f"👤 Toplam Kullanıcı: {user_count}")

        # 2. API Key sayısı
        api_key_count = await conn.fetchval("SELECT COUNT(*) FROM api_keys")
        valid_api_keys = await conn.fetchval("SELECT COUNT(*) FROM api_keys WHERE is_valid = true")
        print(f"🔑 API Anahtarları: {api_key_count} (Geçerli: {valid_api_keys})")

        # 3. Bot sayıları
        total_bots = await conn.fetchval("SELECT COUNT(*) FROM bot_configs")
        active_bots = await conn.fetchval("SELECT COUNT(*) FROM bot_configs WHERE is_active = true")
        print(f"🤖 Botlar: {total_bots} (Aktif: {active_bots})")

        # 4. İşlem sayısı
        total_trades = await conn.fetchval("SELECT COUNT(*) FROM trades")
        today_trades = await conn.fetchval(
            "SELECT COUNT(*) FROM trades WHERE DATE(timestamp) = CURRENT_DATE"
        )
        print(f"💰 İşlemler: {total_trades} (Bugün: {today_trades})")

        # 5. Bot durumları
        print("\n📊 Bot Durumları:")
        bot_states = await conn.fetch("""
            SELECT
                bc.name,
                bc.symbol,
                bs.status,
                bs.in_position,
                ROUND(bs.daily_pnl::numeric, 4) as daily_pnl,
                bs.daily_trades_count
            FROM bot_configs bc
            LEFT JOIN bot_states bs ON bc.id = bs.id
            WHERE bc.is_active = true
            ORDER BY bc.name
        """)

        if bot_states:
            headers = ["Bot Adı", "Sembol", "Durum", "Pozisyonda", "Günlük P&L", "Günlük İşlem"]
            table_data = []
            for row in bot_states:
                table_data.append([
                    row['name'][:20],  # İsmi kısalt
                    row['symbol'],
                    row['status'] or 'N/A',
                    '✅' if row['in_position'] else '❌',
                    f"{row['daily_pnl'] or 0:.4f}",
                    row['daily_trades_count'] or 0
                ])
            print(tabulate(table_data, headers=headers))
        else:
            print("Aktif bot bulunamadı.")

        # 6. Son işlemler
        print("\n💸 Son 5 İşlem:")
        recent_trades = await conn.fetch("""
            SELECT
                symbol,
                side,
                ROUND(price::numeric, 4) as price,
                ROUND(quantity_filled::numeric, 4) as quantity,
                ROUND(pnl::numeric, 4) as pnl,
                timestamp
            FROM trades
            ORDER BY timestamp DESC
            LIMIT 5
        """)

        if recent_trades:
            headers = ["Sembol", "Yön", "Fiyat", "Miktar", "P&L", "Zaman"]
            table_data = []
            for row in recent_trades:
                table_data.append([
                    row['symbol'],
                    row['side'],
                    f"{row['price']:.4f}",
                    f"{row['quantity']:.4f}",
                    f"{row['pnl']:.4f}",
                    row['timestamp'].strftime('%H:%M:%S')
                ])
            print(tabulate(table_data, headers=headers))
        else:
            print("İşlem geçmişi bulunamadı.")

        # 7. Tablo boyutları
        print("\n📋 Tablo Boyutları:")
        table_sizes = await conn.fetch("""
            SELECT
                schemaname,
                tablename,
                pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
            FROM pg_tables
            WHERE schemaname = 'public'
            ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
        """)

        for row in table_sizes:
            print(f"  📄 {row['tablename']}: {row['size']}")

        await conn.close()
        print("\n✅ Veritabanı bağlantısı başarıyla kapatıldı.")

    except Exception as e:
        print(f"❌ Veritabanı hatası: {e}")

async def main():
    """Ana fonksiyon"""
    await get_db_stats()

if __name__ == "__main__":
    asyncio.run(main())
