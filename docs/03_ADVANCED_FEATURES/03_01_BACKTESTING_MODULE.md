# Aşama 3: İleri Seviye Özellikler

## Görev: 03_01_BACKTESTING_MODULE - Backtesting Modülü

**Amaç:** Kullanıcıların, seçtikleri strateji ve parametrelerle, belirledikleri bir sembol ve tarih aralığı için geçmiş piyasa verileri üzerinde sanal alım-satım yaparak stratejilerinin potansiyel performansını test etmelerini sağlamak.

**Kapsam / Yapılacaklar:**

1. **Geçmiş Veri Yönetimi:**
    - [ ] **Veri Kaynağı:** Binance API'sinden geçmiş OHLCV verilerini çekme (farklı zaman aralıkları için - 1m, 5m, 1h vb.). API limitleri ve veri miktarı göz önünde bulundurulmalı.
    - [ ] **Veri Depolama (Opsiyonel ama Önerilir):** Sık kullanılan semboller/timeframe'ler için çekilen geçmiş verileri kendi veritabanınızda (örn: TimescaleDB, InfluxDB veya PostgreSQL'de optimize edilmiş tablolar) saklamak, API yükünü azaltır ve backtest hızını artırır.
    - [ ] Veri temizleme ve doğrulama (eksik veri, hatalı veri).
2. **Backtesting Motoru (Backend):**
    - [ ] Mevcut strateji çekirdeğini ([Strateji Çekirdeği](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_03_BACKEND_STRATEGY_CORE_REFACTOR.md)) backtesting için uyarlamak veya yeniden kullanılabilir bir kütüphane (örn: `backtrader`, `vectorbt` - Python için) ile entegre etmek.
    - [ ] Motor, geçmiş veriler üzerinde adım adım ilerleyerek (her bir mum çubuğu için) strateji mantığını (sinyal üretme, sanal emirler, pozisyon yönetimi) çalıştırmalı.
    - [ ] Komisyon oranları, potansiyel slippage gibi faktörleri simüle edebilmeli.
    - [ ] Her bir sanal işlem ve pozisyon değişikliği loglanmalı.
    - [ ] Backtesting işlemi asenkron bir Celery görevi olarak çalışmalı, çünkü uzun sürebilir.
3. **Kullanıcı Arayüzü (Frontend):**
    - [ ] **Backtest Konfigürasyon Formu:**
        - Sembol seçimi.
        - Timeframe seçimi.
        - Başlangıç ve bitiş tarihi seçimi.
        - Başlangıç sanal sermayesi.
        - Strateji seçimi (eğer [Çoklu Strateji Desteği](03_02_MULTI_STRATEGY_SUPPORT.md) varsa).
        - Strateji parametreleri (EMA, RSI, SL/TP vb. - mevcut bot oluşturma formuna benzer).
        - Komisyon oranı girişi.
    - [ ] **Backtest Sonuçları Gösterimi:**
        - Toplam Kar/Zarar (Net P&L, Yüzdesel P&L).
        - Kazançlı İşlem Sayısı / Kayıplı İşlem Sayısı / Win Rate (Kazanma Oranı).
        - Ortalama Kazançlı İşlem / Ortalama Kayıplı İşlem / Profit Factor.
        - Maksimum Drawdown (En Büyük Sermaye Düşüşü).
        - Sharpe Oranı, Sortino Oranı (risk ayarlı getiri metrikleri).
        - Yapılan tüm sanal işlemlerin listesi (giriş/çıkış fiyatı, P&L vb.).
        - Sermaye eğrisi grafiği (Equity curve).
        - (Opsiyonel) Fiyat grafiği üzerinde alım/satım noktalarının gösterilmesi.
    - [ ] Kullanıcının geçmiş backtest sonuçlarını kaydedip tekrar görüntüleyebilmesi.
4. **API Endpointleri (Backend):**
    - [ ] `POST /api/v1/backtests`: Yeni bir backtest başlatır (Celery görevini tetikler).
    - [ ] `GET /api/v1/backtests/{backtest_id}`: Belirli bir backtest'in durumunu ve sonuçlarını getirir.
    - [ ] `GET /api/v1/backtests`: Kullanıcının geçmiş backtest'lerini listeler.
5. **Testler:**
    - [ ] Backtesting motorunun bilinen senaryolarla (manuel hesaplanmış sonuçlarla karşılaştırma) doğru sonuçlar ürettiğini test et.
    - [ ] Farklı parametrelerin sonuçları nasıl etkilediğini test et.
    - [ ] Kullanıcı arayüzünün verileri doğru gösterip interaktif olduğunu test et.

**Teknik Detaylar:**
- Geçmiş veri miktarı büyük olabileceği için verimli veri işleme ve depolama önemlidir.
- Backtesting motorunun performansı, özellikle uzun tarih aralıkları veya çok sayıda test için kritik olacaktır. Optimizasyon gerekebilir.
- `vectorbt` gibi kütüphaneler, özellikle pandas tabanlı stratejiler için çok hızlı vektörize backtesting imkanı sunar.

**Notlar / Riskler / Dikkat Edilmesi Gerekenler:**
- **Overfitting (Aşırı Uyum):** Kullanıcılar, stratejilerini geçmiş verilere aşırı uyumlu hale getirip gelecekte aynı performansı bekleyebilirler. Bu risk hakkında bilgilendirme yapılmalı.
- Geçmiş performans, gelecekteki performansın garantisi değildir.
- Binance'ten geçmiş veri çekme API limitleri (örn: 1000 mum limiti) dikkate alınmalı, gerekirse parçalar halinde çekilip birleştirilmeli.
- Look-ahead bias (gelecekten bilgi sızması) gibi yaygın backtesting hatalarından kaçınılmalı.

**Bağımlılıklar:**
- [Strateji Çekirdeği](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_03_BACKEND_STRATEGY_CORE_REFACTOR.md)
- [Celery Worker Kurulumu](_PARENT_DIR_/_PARENT_DIR_/01_MVP_DEVELOPMENT/01_05_BACKEND_CELERY_WORKER_SETUP.md)
