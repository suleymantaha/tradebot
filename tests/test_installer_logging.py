import os
import tempfile
import tkinter as tk

from installer.main import TradeBotInstaller


def test_log_error_deduplication():
    root = tk.Tk()
    root.withdraw()

    installer = TradeBotInstaller(root)

    # Log dosyasını geçici dizine taşı
    tmpdir = tempfile.mkdtemp()
    installer.log_file = os.path.join(tmpdir, "installer.log")
    installer.setup_logging()

    # Aynı hata mesajını 3 kez logla
    msg = "Test tekrarlanan hata"
    installer.log_error(msg)
    installer.log_error(msg)
    installer.log_error(msg)

    # İlk hata error_log'a eklenir, sonraki tekrarlar bastırılır
    assert len(installer.error_log) == 1
    assert "Test tekrarlanan hata" in installer.error_log[0]

    # Log dosyasını oku ve WARNING satırının yazıldığını kontrol et
    with open(installer.log_file, "r", encoding="utf-8") as f:
        content = f.read()

    assert content.count("[ERROR") >= 1
    assert "Aynı hata tekrarlandı, log azaltıldı" in content

    root.destroy()

