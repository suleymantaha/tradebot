# TradeBot Installer: Yükleme Optimizasyonu ve Akıllı Güncelleme Kılavuzu

Bu doküman, `installer/` bileşenini modern yaklaşımlarla optimize ederek kurulum süresini kısaltmayı, yalnızca gereken durumlarda güncelleme yapmayı ve kullanıcı deneyimini iyileştirmeyi amaçlar. Aşağıdaki içerik; artımlı (incremental) yükleme stratejileri, akıllı güncelleme mekanizması, adım adım kurulum rehberi, performans ipuçları, sorun giderme ve test gereksinimlerini kapsar.

---

## 1) Kurulum Optimizasyonu

### 1.1 Artımlı Yükleme (Incremental Installation)
- Docker katman önbelleklemesi (layer caching) ve BuildKit:
  - Varsayılan olarak `--no-cache` kullanılmamalı; `DOCKER_BUILDKIT=1` ve `COMPOSE_DOCKER_CLI_BUILD=1` değişkenleri ile BuildKit etkinleştirilmeli.
  - Sık değişmeyen katmanlar (base image, sistem bağımlılıkları) üstte, sık değişen katmanlar (uygulama kodu) altta konumlandırılmalı.
  - Öneri: `docker compose pull` ile mevcut imajları çekip sadece değişen servisleri yeniden build etmek.

- Bağımlılık tekerlekleri (wheelhouse) ile hızlı Python kurulumları:
  - Build sırasında bir `wheelhouse/` oluşturup sık kullanılan paketlerin önceden derlenmiş tekerleklerini (wheels) saklayın.
  - Örnek:
    ```bash
    # Wheel üretimi (CI / ilk kurulumda)
    pip wheel -r requirements.txt -w wheelhouse

    # Kurulumda hızlı yükleme
    pip install --no-index --find-links=wheelhouse -r requirements.txt
    ```

- Bileşen düzeyinde artımlı kurulum:
  - Servis bazlı (backend, frontend, db) ayrım yaparak yalnızca değişen servisleri yeniden başlatın: `docker compose up -d --no-deps <service>`.
  - Statik varlıklar (frontend build çıktısı) değişmemişse yeniden paketlemeyin.

### 1.2 Gereksiz Bağımlılıkları ve Fazlalıkları Kaldırma
- Build-time vs runtime ayrımı:
  - `installer/requirements.txt` içindeki `pyinstaller` sadece build aşamasında gereklidir; runtime paketlerine dahil edilmemelidir.
  - Öneri: İki dosya ile ayrıştırın: `installer/requirements.build.txt` ve `installer/requirements.runtime.txt`.
- Opsiyonel UI kütüphaneleri:
  - `customtkinter`, `ttkbootstrap` gibi opsiyonel bağımlılıklar devre dışı (commented) bırakılmış; yalnızca gerekliyse etkinleştirin.
- Docker imajlarını inceltin:
  - Multi-stage Dockerfile kullanın; yalnızca gerekli artefaktlar production imajına alın.
  - `apt-get` ve cache temizliği (örn. `rm -rf /var/lib/apt/lists/*`) ile imaj boyutunu küçültün.

### 1.3 Paralel İndirme ve Kurulum
- BuildKit paralelizasyonu:
  - BuildKit, katmanları paralel derler ve indirme işlemlerini hızlandırır. Ortam değişkenleriyle etkinleştirin:
    ```bash
    setx DOCKER_BUILDKIT 1
    setx COMPOSE_DOCKER_CLI_BUILD 1
    ```
- Paralel artefakt indirme (opsiyonel):
  - Güncelleme istemcisi için `asyncio + aiohttp` ile eşzamanlı indirme.
  - Alternatif olarak çok büyük paketler için `aria2c` ile çok parçalı indirme.
- Servislerin paralel hazırlanması:
  - Dizin hazırlığı, environment dosyası üretimi ve nginx konfigürasyonu gibi adımları job’lara bölerek eşzamanlı çalıştırın (GUI içinde background thread / async).

---

## 2) Akıllı Güncelleme Mekanizması

### 2.1 Sürüm Kontrol Sistemi
- `VERSION` veya `version.json` dosyası:
  - Örnek `version.json`:
    ```json
    {
      "app": "tradebot",
      "version": "2.1.0",
      "build": 37,
      "components": {
        "backend": "sha256:...",
        "frontend": "sha256:...",
        "installer": "sha256:..."
      }
    }
    ```
- Remote release manifest:
  - `https://updates.tradebot.local/releases/latest.json` gibi bir endpointte imzalı manifest yayınlayın.
  - Manifest içeriğinde bileşen adı, sürüm, URL, hash ve imza bulunmalı.

### 2.2 Otomatik Güncelleme Kontrolü
- Installer başlangıcında:
  - Uygulama sürümünü yerel dosyadan okuyun.
  - Manifesti uzak sunucudan alın, sürümleri karşılaştırın.
  - Yeni sürüm varsa kullanıcıya kısa bir özet ve tahmini süre gösterin.
- Güvenlik:
  - Manifest ve paketler için SHA-256 doğrulaması ve opsiyonel imza doğrulaması (`cryptography`) uygulayın.

### 2.3 Yalnızca Değişen Bileşenleri Güncelle
- Bileşen bazlı delta güncellemeler:
  - Değişen imajlar: `docker compose pull <service>` ardından `docker compose up -d --no-deps <service>`.
  - Değişen frontend artefaktları: Sadece `dist/` paketini güncelleyin.
  - Değişmeyen bileşenleri atlayın; toplam güncelleme zamanını ciddi şekilde kısaltır.
- İptal/geri alma (rollback):
  - Güncelleme sırasında hata olursa önceki imajların digest’larıyla hızlı rollback yapın.

---

## 3) Adım Adım Kurulum Rehberi

### 3.1 Ön Gereksinimler
- Windows: Docker Desktop (Compose V2), PowerShell 7+, internet bağlantısı.
- Linux/macOS: Docker + Compose, bash, internet bağlantısı.
- Python ile çalıştırılacaksa: `pip install -r installer/requirements.txt`.

### 3.2 GUI Installer Çalıştırma
```powershell
cd installer
python main.py
```
Alternatif: Paketlenmiş EXE/DMG/TAR.GZ çıktısını `installer/build.*` script’leriyle oluşturabilir ve doğrudan çalıştırabilirsiniz.

### 3.3 Hızlı Kurulum Akışı (Optimize Edilmiş)
1. Sistem kontrolü (Docker, Compose, git, curl)
2. `.env` oluşturma veya güncelleme
3. Dizin ve nginx hazırlığı
4. BuildKit’i etkinleştir ve imajları çek (`docker compose pull`)
5. Yalnızca değişen servisleri başlat (`docker compose up -d --no-deps <service>`)
6. Health-check ve kısa doğrulama

### 3.4 Akıllı Güncelleme Akışı
1. Uzak `latest.json` manifestini al
2. Yerel `version.json` ile karşılaştır
3. Değişen bileşenlerin listesini çıkar
4. Paralel indirme ve doğrulama
5. Servis bazlı yeniden başlatma ve smoke test

---

## 4) Güncelleme Senaryoları ve Çözümleri

- Patch güncellemesi (2.1.0 → 2.1.1):
  - Değişen sadece backend imajı ise `docker compose pull backend && docker compose up -d --no-deps backend` yeterli.

- Minor güncelleme (2.1.x → 2.2.0):
  - Frontend build artefaktları ve API şeması değişmiş olabilir; backend ve frontend beraber güncellenir.
  - DB şeması etkilendiyse migration’lar manifestte işaretlenir.

- Major güncelleme (2.x → 3.0.0):
  - Geriye dönük uyumluluk kırılabilir; dokümantasyonda ek adımlar ve yedekleme talimatı gösterilir.

- Offline güncelleme:
  - Önceden indirilen paketlerle güncelleme; manifest ve paketler yerel dosyadan yüklenir.

- Hata/rollback:
  - Güncelleme başarısızsa önceki digest ve artefaktlar ile otomatik geri alma.

---

## 5) Performans Optimizasyon İpuçları

- BuildKit’i kalıcı etkinleştirme:
  - Windows: Sistem ortam değişkenlerini ayarlayın (`DOCKER_BUILDKIT=1`, `COMPOSE_DOCKER_CLI_BUILD=1`).

- `--no-cache` kullanımını sınırlayın:
  - Sadece ciddi cache çakışmaları veya baz imaj değişimi olduğunda kullanın.

- İmaj küçültme:
  - Multi-stage, minimal base image (örn. `python:3.12-slim`) ve gereksiz dosya temizliği.

- Bağımlılık cache’i:
  - Python wheels ve Docker cache from stratejisi (örn. `cache_from: ['ghcr.io/ORG/IMAGE:latest']`).

- Paralel indirme:
  - Ağ bant genişliğini optimize edin; eşzamanlı indirme sayısını sistem kaynaklarına göre ayarlayın.

- Sağlık kontrolleri:
  - Servislerin hazır olma sürelerini ölçüp optimize edin (örn. veritabanı başlangıç parametreleri).

---

## 6) Sorun Giderme Kılavuzu

- Docker Compose versiyon hatası:
  - GUI zaten V2/V1 autodetect yapıyor; V2 yoksa V1’i deneyin veya Compose’u güncelleyin.

- Ağ ve port çakışmaları:
  - GUI’deki “Docker Ağ Temizliği” hızlı düzeltmesini çalıştırın; `docker compose down --remove-orphans` ardından yeniden deneyin.

- Build hataları:
  - Loglarda “no configuration file provided” gibi hataları kontrol edin; `docker-compose.yml` yolunu doğrulayın.

- Yavaş kurulum:
  - BuildKit’i etkinleştirildiğini ve `--no-cache` kullanılmadığını doğrulayın; imajları önce `docker compose pull` ile çekin.

- İmza/HASH doğrulama başarısız:
  - Paketler bozulmuş olabilir; manifest ve paketleri tekrar indirin, ağ güvenilirliğini kontrol edin.

---

## 7) Test Gereksinimleri

### 7.1 Kurulum Süresi Ölçümleri
- Ölçüm metodolojisi:
  - İlk kurulum (soğuk cache) ve tekrarlı kurulum (sıcak cache) sürelerini ayrı raporlayın.
  - PowerShell `Measure-Command` veya Python zamanlayıcı ile ölçün.
  - Metikler: Toplam süre, imaj çekme süresi, build süresi, servis hazır olma süresi.

### 7.2 Güncelleme Senaryo Testleri
- Patch/minor/major/offline senaryolarını kapsayan test matrisi.
- Başarı kriterleri: Yalnızca değişen bileşenlerin güncellenmesi, servislerin hatasız ayağa kalkması, rollback’in çalışması.

### 7.3 Çapraz Platform Uyumluluk Testleri
- Windows 10/11 (PowerShell 7+), Ubuntu 22.04+, macOS 13+.
- Docker ve Compose sürümleri farklı varyantlarda test edilmeli.

---

## 8) Örnek Uygulama Parçaları (Önerilen Değişiklikler)

### 8.1 BuildKit ve Cache Kullanımı (installer/main.py içinde öneri)
```python
# Ortam değişkenlerini set ederek BuildKit’i etkinleştirme
os.environ.setdefault('DOCKER_BUILDKIT', '1')
os.environ.setdefault('COMPOSE_DOCKER_CLI_BUILD', '1')

# Build/Start adımı: önce pull, sonra sadece değişen servisleri up
subprocess.run(compose_cmd + ['-f', compose_file, 'pull'], check=True)
subprocess.run(compose_cmd + ['-f', compose_file, 'up', '-d'], check=True)
```

### 8.2 `--no-cache` Bayrağını Opsiyonel Yapma
```python
use_no_cache = False  # GUI config veya .env üzerinden yönetilebilir
build_args = ['-f', compose_file, 'build'] + ([] if use_no_cache else [])
subprocess.run(compose_cmd + build_args, check=True)
```

### 8.3 Versiyon/Manifest Okuma ve Paralel İndirme (iskele kod)
```python
import asyncio, aiohttp, hashlib, json

async def fetch(session, url):
    async with session.get(url) as resp:
        resp.raise_for_status()
        return await resp.read()

async def download_parallel(items):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch(session, it['url']) for it in items]
        blobs = await asyncio.gather(*tasks)
        for blob, it in zip(blobs, items):
            h = hashlib.sha256(blob).hexdigest()
            assert h == it['sha256'], f"Hash mismatch: {it['name']}"
            with open(it['target'], 'wb') as f:
                f.write(blob)

def check_updates(local_version_path, manifest_url):
    with open(local_version_path, 'r', encoding='utf-8') as f:
        local = json.load(f)
    remote = requests.get(manifest_url).json()
    # karşılaştırma ve yalnızca değişen bileşenlerin listesi
    changed = []  # derive from digest/version differences
    asyncio.run(download_parallel(changed))
```

---

## 9) Uygulama Planı ve Yol Haritası

1. BuildKit’in tüm ortamlarda varsayılan olarak etkinleştirilmesi.
2. `--no-cache` bayrağının opsiyonel hale getirilmesi ve varsayılanın cache’li build olması.
3. `version.json` ve uzak `latest.json` manifest altyapısının eklenmesi.
4. Paralel indirme ve bileşen bazlı güncelleme akışının GUI’ye entegre edilmesi.
5. Test matrisi ve ölçüm raporlarının CI’ya eklenmesi; kurulum/güncelleme sürelerinin raporlanması.

---

## 10) Sonuç

Bu optimizasyonlar ile ilk kurulum (soğuk cache) dışında tekrarlayan kurulum ve güncelleme süreleri ciddi oranda kısalır. Akıllı güncelleme yaklaşımı sayesinde yalnızca değişen bileşenler indirildiği ve başlatıldığı için hem zaman hem de bant genişliği tasarrufu sağlanır. Dokümandaki örnek kod ve komutlar, `installer/main.py` ve build script’lerine minimal eklemelerle uygulanabilir.

