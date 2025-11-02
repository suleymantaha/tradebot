## Backtest Günlük İşlem Limiti

Bu sürümle birlikte backtest motorunun günlük maksimum işlem sayısı kullanıcı arayüzünden yönetilebilir hale geldi. Ayarlar panelindeki **Günlük Maksimum İşlem** alanı 1 ile 50 arasında değer kabul eder ve varsayılanı 5'tir.

- Limit aşılırsa ilgili gün için yeni sinyaller otomatik olarak durdurulur.
- Değer UI üzerinden değiştirildiğinde API isteğine `parameters.max_daily_trades` olarak eklenir ve sunucu tarafında doğrulanır.
- Backtest raporu ile kaydedilen parametrelerde yeni alan saklanır; geçmiş kayıtlar için eksikse 5 olarak varsayılır.

İpucu: Limit yüksek seçildiğinde günlük hedef (`daily_target`) ve maksimum kayıp (`max_daily_loss`) parametrelerini de yeniden değerlendirerek stratejinin risk profilini koruyun.

