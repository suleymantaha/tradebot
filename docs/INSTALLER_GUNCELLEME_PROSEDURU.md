# Installer Güncelleme Prosedürü

Bu belge, `installer` klasörünü güncellerken güvenli ve geri döndürülebilir bir süreç izlemeniz için adımları ve komutları sunar.

## 1) Güncelleme Öncesi Hazırlık
- İzin ve gereksinim kontrolü:
  - Komut: `python installer/preflight_check.py`
  - Kontrol eder: izinler, Python sürümü, bağımlılıklar (`requests`, `cryptography`, Windows’ta `pywin32`), Docker/Compose ve `git`.
  - Çıkış kodu `0`: kritik sorun yok; `1`: kritik eksik var.
- Yedek alma:
  - Komut (PowerShell): `pwsh installer/backup.ps1 -Destination backups`
  - Çıktı: `backups/installer-backup-YYYYMMDD-HHMMSS.zip`

## 2) Güncelleme Uygulaması
- Değişiklikleri adım adım uygulayın ve her adım sonrası kontrol edin.
- `git status` ile değişiklikleri gözden geçirin; küçük parçalara commit atın.
- Her adım sonrası kısa smoke test:
  - `python -m py_compile installer/main.py`
  - `python -c "import installer.main; print('import_ok')"`
  - `docker compose config` (Compose dosyası doğrulaması)

## 3) Kurulum Sonrası Testler
- Fonksiyonel testler:
  - GUI Installer: `cd installer && python main.py`
  - Servis başlatma akışı: `docker compose pull` → `docker compose build` → `docker compose up -d`
- Log kontrolü:
  - `installer.log` ve `docker compose logs`.
- Gerekirse geri dönüş:
  - Komut (PowerShell): `pwsh installer/rollback.ps1 -BackupZipPath backups/<zip>`

## 4) Performans ve Uyumluluk
- Performans ölçümü:
  - Windows: `Measure-Command { docker compose build }`
  - Linux/macOS: `time docker compose build`
- Cold/warm cache senaryolarını ayırarak ölçün.
- Compose V2/V1: GUI zaten autodetect yapar; mümkünse V2 kullanın.

## 5) İpuçları ve Sorun Giderme
- `INSTALLER_NO_CACHE=1` ile no-cache build test edin.
- `UPDATE_MANIFEST_URL` tanımlıysa sürüm karşılaştırma logunu gözleyin.
- Docker başlatılamazsa Windows’ta Docker Desktop’ı açın, Linux’ta `systemctl start docker`.

---
Bu prosedür, adım bazlı test ve güvenli geri dönüş ile installer güncelleme sürecini kısaltır ve hataları erken yakalamanızı sağlar.
