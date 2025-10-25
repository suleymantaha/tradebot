# WSL ve Docker Kurulum Rehberi

Bu rehber Windows'ta WSL (Windows Subsystem for Linux) ve Docker kurulumu için adım adım talimatlar içerir.

## Sorun: Docker Başlamıyor

**Hata:** `docker : The term 'docker' is not recognized`

**Sebep:** Docker kurulu değil veya WSL sorunları var.

---

## 1. WSL Kurulumu

### 1.1 WSL Durumunu Kontrol Et
```powershell
# PowerShell'i yönetici olarak açın ve şu komutları çalıştırın:
wsl --status
wsl --list --verbose
```

### 1.2 WSL Kayıt Defteri Hatası Çözümü
**Hata:** `Sınıf kaydedilmemiş - Hata Kodu: Wsl/CallMsi/Install/REGDB_E_CLASSNOTREG`

#### Adım 1: Windows Özelliklerini Kontrol Et
```powershell
# Yönetici PowerShell:
Get-WindowsOptionalFeature -Online | Where-Object {$_.FeatureName -like "*WSL*" -or $_.FeatureName -like "*Linux*" -or $_.FeatureName -like "*Virtual*"}
```

#### Adım 2: WSL'yi Tamamen Temizle
```powershell
# Tüm WSL dağıtımlarını kaldır
wsl --list --verbose
wsl --unregister Ubuntu
wsl --unregister *
wsl --shutdown

# Windows özelliklerini devre dışı bırak
dism.exe /online /disable-feature /featurename:Microsoft-Windows-Subsystem-Linux /norestart
dism.exe /online /disable-feature /featurename:VirtualMachinePlatform /norestart
```

#### Adım 3: Windows'u Onar
```powershell
# Sistem dosyalarını kontrol et
sfc /scannow

# Windows görüntüsünü onar
DISM /Online /Cleanup-Image /RestoreHealth
DISM /Online /Cleanup-Image /CheckHealth
```

#### Adım 4: Bilgisayarı Yeniden Başlat
Yukarıdaki komutları çalıştırdıktan sonra bilgisayarı yeniden başlatın.

#### Adım 5: WSL'yi Yeniden Kur
```powershell
# Windows özelliklerini etkinleştir
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /norestart

# WSL'yi kur
wsl --install
```

### 1.3 Alternatif: Manuel WSL Kurulumu
Eğer hala sorun varsa:

1. **Microsoft Store'dan Ubuntu'yu indirin**
2. **WSL2 kernel güncellemesini manuel indirin:**
   - https://aka.ms/wsl2kernel adresine gidin
   - `wsl_update_x64.msi` dosyasını indirin ve kurun

### 1.4 Son Çare: Windows Güncellemesi
```powershell
# Windows Update'i kontrol et
Get-WindowsUpdate
Install-WindowsUpdate
```

---

## 2. Docker Kurulumu

### 2.1 Docker Desktop İndirme
1. https://www.docker.com/products/docker-desktop/ adresine gidin
2. Docker Desktop for Windows'u indirin
3. İndirilen `.exe` dosyasını çalıştırın

### 2.2 Docker Desktop Kurulumu
1. Kurulum sihirbazını takip edin
2. **WSL2 backend'ini seçin** (önemli!)
3. Kurulum tamamlandıktan sonra Docker Desktop'ı açın

### 2.3 Docker Kurulumunu Doğrula
```powershell
# Docker versiyonunu kontrol et
docker --version
docker-compose --version

# Docker servisini kontrol et
docker ps
```

---

## 3. Proje Kurulumu

### 3.1 Proje Dizinine Git
```powershell
cd C:\Users\Suley\Documents\tradebot\tradebot
```

### 3.2 Environment Dosyasını Hazırla
```powershell
# env.example dosyasını kopyala
copy env.example .env
```

### 3.3 Docker Compose ile Başlat
```powershell
# Servisleri başlat
docker-compose up -d

# Logları kontrol et
docker-compose logs -f
```

---

## 4. Sorun Giderme

### 4.1 Docker Başlamıyor
```powershell
# Docker servisini kontrol et
Get-Service docker

# Docker Desktop'ı yeniden başlat
# Docker Desktop uygulamasını kapatıp tekrar açın
```

### 4.2 WSL Bağlantı Sorunu
```powershell
# WSL'yi yeniden başlat
wsl --shutdown
wsl --start

# Docker Desktop'ta WSL2 backend'inin aktif olduğunu kontrol edin
```

### 4.3 Port Çakışması
```powershell
# Kullanılan portları kontrol et
netstat -ano | findstr :8000
netstat -ano | findstr :5432

# Gerekirse servisleri durdur
docker-compose down
```

---

## 5. Faydalı Komutlar

### Docker Komutları
```powershell
# Tüm container'ları listele
docker ps -a

# Container'ları durdur
docker-compose down

# Container'ları yeniden başlat
docker-compose restart

# Logları takip et
docker-compose logs -f [servis_adı]

# Container'a bağlan
docker exec -it [container_adı] bash
```

### WSL Komutları
```powershell
# WSL dağıtımlarını listele
wsl --list --verbose

# WSL'yi kapat
wsl --shutdown

# WSL'yi başlat
wsl --start

# WSL'yi güncelle
wsl --update
```

---

## 6. Önemli Notlar

- **Yönetici Yetkisi:** WSL kurulumu için PowerShell'i yönetici olarak açmanız gerekir
- **Yeniden Başlatma:** Her önemli adımdan sonra bilgisayarı yeniden başlatın
- **WSL2:** Docker Desktop için WSL2 backend'ini kullanın
- **Windows Sürümü:** Windows 10 2004+ veya Windows 11 gerekir

---

## 7. TPM (Trusted Platform Module) Sorunları

### 7.1 TPM Durumunu Kontrol Et
```powershell
# TPM servisini kontrol et
Get-Service -Name "Tpm"

# TPM cihazını kontrol et
Get-PnpDevice | Where-Object {$_.FriendlyName -like "*TPM*"}

# TPM Management Console'u aç
tpm.msc
```

### 7.2 TPM HRESULT: 0x80284001 Hatası Çözümü
**Hata:** `Güvenilir Platform Modülü destek programında bir iç hata oluştu`

#### Adım 1: TPM Servislerini Yeniden Başlat
```powershell
# Yönetici PowerShell:
Stop-Service -Name "Tpm" -Force -ErrorAction SilentlyContinue
Stop-Service -Name "TpmProvisioningService" -Force -ErrorAction SilentlyContinue
Start-Service -Name "Tpm" -ErrorAction SilentlyContinue
Start-Service -Name "TpmProvisioningService" -ErrorAction SilentlyContinue
```

#### Adım 2: TPM Driver'ını Yeniden Yükle
```powershell
# TPM cihazını yeniden yükle
$tpmDevice = Get-PnpDevice | Where-Object {$_.FriendlyName -like "*TPM*"}
if($tpmDevice) {
    Disable-PnpDevice -InstanceId $tpmDevice.InstanceId -Confirm:$false
    Start-Sleep -Seconds 3
    Enable-PnpDevice -InstanceId $tpmDevice.InstanceId -Confirm:$false
}
```

#### Adım 3: TPM'i Temizle
```powershell
# TPM modülünü import et
Import-Module TrustedPlatformModule

# TPM'i temizle (yönetici yetkisi gerekir)
Clear-Tpm
```

#### Adım 4: BIOS/UEFI Ayarları
1. **Bilgisayarı yeniden başlatın**
2. **BIOS/UEFI'ye girin** (F2, F12, Delete tuşu)
3. **Security menüsünde kontrol edin:**
   - **TPM State**: `Enabled`
   - **Secure Boot**: `Enabled`
   - **Boot Mode**: `UEFI`
   - **CSM**: `Disabled`
4. **Ayarları kaydedin** (F10)

#### Adım 5: Windows Sistem Onarımı
```powershell
# Sistem dosyalarını kontrol et
sfc /scannow

# Windows görüntüsünü onar
DISM /Online /Cleanup-Image /RestoreHealth
DISM /Online /Cleanup-Image /CheckHealth
```

### 7.3 TPM Uyumluluk Kontrolü
```powershell
# İşlemci bilgilerini kontrol et
Get-CimInstance -ClassName Win32_Processor | Select-Object Name, Architecture

# RAM bilgilerini kontrol et
Get-CimInstance -ClassName Win32_ComputerSystem | Select-Object TotalPhysicalMemory

# Windows sürümünü kontrol et
Get-ComputerInfo | Select-Object WindowsProductName, WindowsVersion
```

### 7.4 TPM Sorun Giderme Komutları
```powershell
# TPM servis durumunu kontrol et
Get-Service -Name "Tpm" | Select-Object Name, Status, StartType

# TPM registry ayarlarını kontrol et
Get-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Services\Tpm" -ErrorAction SilentlyContinue

# TPM event loglarını kontrol et
Get-WinEvent -FilterHashtable @{LogName='System'; ID=7036} | Where-Object {$_.Message -like "*TPM*"} | Select-Object -First 5 TimeCreated, Message
```

### 7.5 Önemli Notlar
- **Yönetici Yetkisi:** TPM işlemleri için PowerShell'i yönetici olarak açmanız gerekir
- **BIOS Güncellemesi:** TPM sorunları için BIOS/UEFI güncellemesi gerekebilir
- **BitLocker:** TPM temizleme işlemi BitLocker şifrelemesini etkileyebilir
- **Windows Hello:** TPM temizlendikten sonra Windows Hello'yu yeniden yapılandırmanız gerekebilir

---

## 8. Destek

Sorun devam ederse:
1. Windows Event Viewer'da hataları kontrol edin
2. Docker Desktop loglarını kontrol edin
3. WSL loglarını kontrol edin: `wsl --status`
4. TPM Management Console'u kontrol edin: `tpm.msc`

**Başarılı kurulum sonrası:** `docker-compose up` komutu ile projenizi başlatabilirsiniz.
