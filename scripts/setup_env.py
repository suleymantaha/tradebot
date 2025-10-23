#!/usr/bin/env python3
"""
TradeBot .env Otomatik Oluşturucu (Windows/Linux/Mac)
- env.example temel alınarak .env dosyasını üretir
- Güvenli anahtarları otomatik oluşturur (SECRET_KEY, FERNET_KEY)
- PostgreSQL ve pgAdmin şifrelerini rastgele atar
- DATABASE_URL ve SYNC_DATABASE_URL içindeki ${POSTGRES_PASSWORD} yerini gerçek şifreyle doldurur

Kullanım:
  python scripts/setup_env.py
"""

from pathlib import Path
import secrets
import string
import base64
import os
import re

PROJECT_ROOT = Path(__file__).resolve().parents[1]
ENV_EXAMPLE = PROJECT_ROOT / "env.example"
ENV_FILE = PROJECT_ROOT / ".env"


def gen_password(length: int = 16) -> str:
    alphabet = string.ascii_letters + string.digits
    return "".join(secrets.choice(alphabet) for _ in range(length))


def gen_secret_key() -> str:
    return secrets.token_hex(32)


def gen_fernet_key() -> str:
    # 32 bayt rastgele, url-safe base64 -> 44 karakter
    return base64.urlsafe_b64encode(os.urandom(32)).decode()


def main() -> None:
    if not ENV_EXAMPLE.exists():
        raise FileNotFoundError(f"env.example bulunamadı: {ENV_EXAMPLE}")

    template = ENV_EXAMPLE.read_text(encoding="utf-8")

    pg_pass = gen_password(16)
    pgadmin_pass = gen_password(12)
    secret_key = gen_secret_key()
    fernet_key = gen_fernet_key()

    # Satır bazlı basit ikame
    def replace_line(text: str, key: str, value: str) -> str:
        pattern = rf"^{re.escape(key)}=.*$"
        repl = f"{key}={value}"
        return re.sub(pattern, repl, text, flags=re.MULTILINE)

    out = template
    out = replace_line(out, "POSTGRES_PASSWORD", pg_pass)
    out = replace_line(out, "PGADMIN_DEFAULT_PASSWORD", pgadmin_pass)
    out = replace_line(out, "SECRET_KEY", secret_key)
    # env.example'da FERNET_KEY boş; doldur.
    out = replace_line(out, "FERNET_KEY", fernet_key)

    # DATABASE_URL ve SYNC_DATABASE_URL içinde ${POSTGRES_PASSWORD} -> gerçek şifre
    out = out.replace("${POSTGRES_PASSWORD}", pg_pass)

    ENV_FILE.write_text(out, encoding="utf-8")

    print("✅ .env dosyası oluşturuldu:", ENV_FILE)
    print("🔐 SECRET_KEY:", f"{secret_key[:8]}...{secret_key[-8:]}")
    print("🔒 FERNET_KEY: (44 chars)")
    print("🐘 POSTGRES_PASSWORD:", pg_pass)
    print("🌐 PGADMIN_DEFAULT_PASSWORD:", pgadmin_pass)
    print()
    print("⚠️ Güvenlik Notları:")
    print(" - .env dosyasını git'e push etmeyin")
    print(" - Production için şifreleri değiştirin")
    print()
    print("🚀 Sonraki adım:")
    print("   docker-compose up -d")


if __name__ == "__main__":
    main()
