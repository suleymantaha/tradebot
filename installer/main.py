#!/usr/bin/env python3
"""
TradeBot GUI Installer
======================
Grafik arayüzlü kurulum programı
"""

import tkinter as tk
from tkinter import ttk, messagebox, filedialog
import threading
import subprocess
import os
import sys
import json
import shutil
import datetime
from pathlib import Path
import platform

# BuildKit ve cache’li build için varsayılan ortam değişkenleri
os.environ.setdefault('DOCKER_BUILDKIT', '1')
os.environ.setdefault('COMPOSE_DOCKER_CLI_BUILD', '1')

class TradeBotInstaller:
    def __init__(self, root):
        self.root = root
        self.root.title("TradeBot Installer v2.0")
        self.root.geometry("800x600")
        self.root.resizable(False, False)

        # Alt süreçler için güvenli UTF-8 IO kodlamasını zorla
        if os.environ.get('PYTHONIOENCODING') != 'utf-8':
            os.environ['PYTHONIOENCODING'] = 'utf-8'

        # Installer state
        self.install_path = os.getcwd()
        self.config = {
            "postgres_password": "",
            "pgadmin_email": "admin@tradebot.local",
            "pgadmin_password": "",
            "frontend_port": "3000",
            "backend_port": "8000",
            "postgres_port": "5432",
            "pgadmin_port": "5050",
            "environment": "production"
        }

        # Error logging
        self.error_log = []
        self.setup_logging()

        # Create notebook for pages
        self.notebook = ttk.Notebook(root)
        self.notebook.pack(fill="both", expand=True, padx=10, pady=10)

        # Create pages
        self.create_welcome_page()
        self.create_system_check_page()
        self.create_config_page()
        self.create_install_page()
        self.create_finish_page()

        # Navigation buttons frame
        self.nav_frame = ttk.Frame(root)
        self.nav_frame.pack(fill="x", padx=10, pady=5)

        self.prev_btn = ttk.Button(self.nav_frame, text="< Geri", command=self.prev_page, state="disabled")
        self.prev_btn.pack(side="left")

        self.next_btn = ttk.Button(self.nav_frame, text="İleri >", command=self.next_page)
        self.next_btn.pack(side="right")

        self.current_page = 0
        self.update_navigation()

    def setup_logging(self):
        """Error logging sistemini kurar"""
        self.log_file = os.path.join(self.install_path, "installer.log")
        try:
            with open(self.log_file, "w", encoding="utf-8") as f:
                f.write(f"TradeBot Installer Log - {datetime.datetime.now()}\n")
                f.write("=" * 50 + "\n\n")
        except Exception as e:
            print(f"Log dosyası oluşturulamadı: {e}")

    def log_error(self, message, exception=None):
        """Hata loglar"""
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[ERROR {timestamp}] {message}"

        if exception:
            log_entry += f"\nException: {str(exception)}"

        self.error_log.append(log_entry)

        # Log dosyasına yaz
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(log_entry + "\n\n")
        except Exception:
            pass

        # Console'a da yazdır
        print(log_entry)

    def log_warning(self, message):
        """Uyarı loglar"""
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[WARNING {timestamp}] {message}"
        
        # Log dosyasına yaz
        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(log_entry + "\n")
        except Exception:
            pass
        
        # Console'a da yazdır
        print(log_entry)

    def log_info(self, message):
        """Bilgi loglar"""
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[INFO {timestamp}] {message}"

        try:
            with open(self.log_file, "a", encoding="utf-8") as f:
                f.write(log_entry + "\n")
        except Exception:
            pass

        print(log_entry)

    def create_welcome_page(self):
        """Hoş geldin sayfası"""
        page = ttk.Frame(self.notebook)
        self.notebook.add(page, text="Hoş Geldiniz")

        # Logo ve başlık
        title_frame = ttk.Frame(page)
        title_frame.pack(pady=50)

        title_label = ttk.Label(title_frame, text="🚀 TradeBot Installer",
                               font=("Arial", 24, "bold"))
        title_label.pack()

        subtitle_label = ttk.Label(title_frame, text="Profesyonel Kripto Trading Bot",
                                  font=("Arial", 14))
        subtitle_label.pack(pady=10)

        # Açıklama
        desc_frame = ttk.Frame(page)
        desc_frame.pack(pady=20, padx=50, fill="x")

        description = """
TradeBot'a hoş geldiniz! Bu kurulum sihirbazı size yardımcı olacak:

✅ Sistem gereksinimlerini kontrol et
✅ Konfigürasyon ayarlarını belirle
✅ Docker containerları otomatik kur
✅ Güvenli şifreler oluştur
✅ Tüm servisleri başlat

Kurulum yaklaşık 5-10 dakika sürer.
        """

        desc_label = ttk.Label(desc_frame, text=description, justify="left",
                              font=("Arial", 11))
        desc_label.pack()

        # Uyarı
        warning_frame = ttk.Frame(page)
        warning_frame.pack(pady=20, padx=50, fill="x")

        warning_text = "⚠️  Kurulum için Docker ve Docker Compose gereklidir"
        warning_label = ttk.Label(warning_frame, text=warning_text,
                                 foreground="orange", font=("Arial", 10, "bold"))
        warning_label.pack()

    def create_system_check_page(self):
        """Sistem kontrol sayfası"""
        page = ttk.Frame(self.notebook)
        self.notebook.add(page, text="Sistem Kontrolü")

        title_label = ttk.Label(page, text="Sistem Gereksinimleri",
                               font=("Arial", 16, "bold"))
        title_label.pack(pady=20)

        # Sistem kontrol frame
        self.check_frame = ttk.LabelFrame(page, text="Kontrol Sonuçları", padding=20)
        self.check_frame.pack(fill="both", expand=True, padx=20, pady=20)

        # Kontrol butonu
        check_btn = ttk.Button(page, text="Sistem Kontrolü Yap",
                              command=self.check_system)
        check_btn.pack(pady=10)

        self.system_checks = []

    def create_config_page(self):
        """Konfigürasyon sayfası"""
        page = ttk.Frame(self.notebook)
        self.notebook.add(page, text="Konfigürasyon")

        title_label = ttk.Label(page, text="Kurulum Ayarları",
                               font=("Arial", 16, "bold"))
        title_label.pack(pady=20)

        # Main config frame
        config_frame = ttk.Frame(page)
        config_frame.pack(fill="both", expand=True, padx=20)

        # Sol sütun - Dizin ve şifreler
        left_frame = ttk.LabelFrame(config_frame, text="Temel Ayarlar", padding=15)
        left_frame.pack(side="left", fill="both", expand=True, padx=(0, 10))

        # Kurulum dizini
        ttk.Label(left_frame, text="Kurulum Dizini:").pack(anchor="w")
        dir_frame = ttk.Frame(left_frame)
        dir_frame.pack(fill="x", pady=(0, 15))

        self.install_path_var = tk.StringVar(value=self.install_path)
        ttk.Entry(dir_frame, textvariable=self.install_path_var, state="readonly").pack(side="left", fill="x", expand=True)
        ttk.Button(dir_frame, text="Gözat", command=self.browse_directory).pack(side="right", padx=(5, 0))

        # PostgreSQL şifresi
        ttk.Label(left_frame, text="PostgreSQL Şifresi:").pack(anchor="w")
        self.postgres_pass_var = tk.StringVar()
        postgres_frame = ttk.Frame(left_frame)
        postgres_frame.pack(fill="x", pady=(0, 15))

        ttk.Entry(postgres_frame, textvariable=self.postgres_pass_var, show="*").pack(side="left", fill="x", expand=True)
        ttk.Button(postgres_frame, text="Oluştur", command=self.generate_postgres_password).pack(side="right", padx=(5, 0))

        # pgAdmin ayarları
        ttk.Label(left_frame, text="pgAdmin Email:").pack(anchor="w")
        self.pgadmin_email_var = tk.StringVar(value=self.config["pgadmin_email"])
        ttk.Entry(left_frame, textvariable=self.pgadmin_email_var).pack(fill="x", pady=(0, 10))

        ttk.Label(left_frame, text="pgAdmin Şifresi:").pack(anchor="w")
        self.pgadmin_pass_var = tk.StringVar()
        pgadmin_frame = ttk.Frame(left_frame)
        pgadmin_frame.pack(fill="x", pady=(0, 15))

        ttk.Entry(pgadmin_frame, textvariable=self.pgadmin_pass_var, show="*").pack(side="left", fill="x", expand=True)
        ttk.Button(pgadmin_frame, text="Oluştur", command=self.generate_pgadmin_password).pack(side="right", padx=(5, 0))

        # Sağ sütun - Port ayarları
        right_frame = ttk.LabelFrame(config_frame, text="Port Ayarları", padding=15)
        right_frame.pack(side="right", fill="both", expand=True, padx=(10, 0))

        ports = [
            ("Frontend Port:", "frontend_port"),
            ("Backend Port:", "backend_port"),
            ("PostgreSQL Port:", "postgres_port"),
            ("pgAdmin Port:", "pgadmin_port")
        ]

        self.port_vars = {}
        for label_text, key in ports:
            ttk.Label(right_frame, text=label_text).pack(anchor="w")
            var = tk.StringVar(value=self.config[key])
            self.port_vars[key] = var
            ttk.Entry(right_frame, textvariable=var, width=10).pack(anchor="w", pady=(0, 10))

        # Environment seçimi
        ttk.Label(right_frame, text="Ortam:").pack(anchor="w", pady=(20, 0))
        self.env_var = tk.StringVar(value="production")
        env_frame = ttk.Frame(right_frame)
        env_frame.pack(anchor="w")
        ttk.Radiobutton(env_frame, text="Production", variable=self.env_var, value="production").pack(anchor="w")
        ttk.Radiobutton(env_frame, text="Development", variable=self.env_var, value="development").pack(anchor="w")
        
        # Force mode seçimi
        ttk.Label(right_frame, text="Gelişmiş:").pack(anchor="w", pady=(20, 0))
        self.force_recreate_var = tk.BooleanVar(value=False)
        force_frame = ttk.Frame(right_frame)
        force_frame.pack(anchor="w")
        ttk.Checkbutton(force_frame, text=".env dosyasını zorla yeniden oluştur", 
                        variable=self.force_recreate_var).pack(anchor="w")
        
        # Şifre senkronizasyonu kontrol butonu
        sync_frame = ttk.Frame(right_frame)
        sync_frame.pack(anchor="w", pady=(10, 0))
        ttk.Button(sync_frame, text="🔍 Şifre Senkronizasyonu Kontrol Et", 
                   command=self.check_password_sync_gui).pack(anchor="w")

    def create_install_page(self):
        """Kurulum sayfası"""
        page = ttk.Frame(self.notebook)
        self.notebook.add(page, text="Kurulum")

        title_label = ttk.Label(page, text="Kurulum İlerliyor...",
                               font=("Arial", 16, "bold"))
        title_label.pack(pady=20)

        # Progress bar
        self.progress = ttk.Progressbar(page, mode="indeterminate")
        self.progress.pack(fill="x", padx=50, pady=10)

        # Status label
        self.status_label = ttk.Label(page, text="Kurulum başlamadı",
                                     font=("Arial", 11))
        self.status_label.pack(pady=10)

        # Log area
        log_frame = ttk.LabelFrame(page, text="Kurulum Detayları", padding=10)
        log_frame.pack(fill="both", expand=True, padx=20, pady=20)

        self.log_text = tk.Text(log_frame, height=15, wrap="word")
        scrollbar = ttk.Scrollbar(log_frame, orient="vertical", command=self.log_text.yview)
        self.log_text.configure(yscrollcommand=scrollbar.set)

        self.log_text.pack(side="left", fill="both", expand=True)
        scrollbar.pack(side="right", fill="y")

        # Install button
        self.install_btn = ttk.Button(page, text="Kurulumu Başlat",
                                     command=self.start_installation)
        self.install_btn.pack(pady=10)

    def create_finish_page(self):
        """Tamamlama sayfası"""
        page = ttk.Frame(self.notebook)
        self.notebook.add(page, text="Tamamlandı")

        title_label = ttk.Label(page, text="🎉 Kurulum Tamamlandı!",
                               font=("Arial", 18, "bold"), foreground="green")
        title_label.pack(pady=30)

        # Success info frame
        self.success_frame = ttk.LabelFrame(page, text="Erişim Bilgileri", padding=20)
        self.success_frame.pack(fill="both", expand=True, padx=20, pady=10)

        # Desktop shortcut info
        info_frame = ttk.LabelFrame(page, text="Masaüstü Kısayolu", padding=10)
        info_frame.pack(fill="x", padx=20, pady=10)

        desktop_info = ttk.Label(info_frame,
                                text="✅ Masaüstünüzde 'TradeBot' ikonu oluşturuldu\n"
                                     "🖱️  İkona çift tıklayarak projeyi başlatabilirsiniz\n"
                                     "🔧 start_tradebot.sh/bat ve stop_tradebot.sh/bat scriptleri oluşturuldu",
                                justify="left", font=("Arial", 10))
        desktop_info.pack(anchor="w")

        # Buttons frame - Web erişimleri
        web_button_frame = ttk.LabelFrame(page, text="Web Erişimleri", padding=10)
        web_button_frame.pack(fill="x", padx=20, pady=10)

        web_buttons = ttk.Frame(web_button_frame)
        web_buttons.pack()

        ttk.Button(web_buttons, text="🌐 Frontend Aç",
                  command=self.open_frontend).pack(side="left", padx=5)
        ttk.Button(web_buttons, text="📚 API Docs Aç",
                  command=self.open_api_docs).pack(side="left", padx=5)
        ttk.Button(web_buttons, text="🗃️ pgAdmin Aç",
                  command=self.open_pgadmin).pack(side="left", padx=5)

        # Utility buttons frame
        util_button_frame = ttk.LabelFrame(page, text="Araçlar", padding=10)
        util_button_frame.pack(fill="x", padx=20, pady=10)

        util_buttons = ttk.Frame(util_button_frame)
        util_buttons.pack()

        ttk.Button(util_buttons, text="📋 Log Dosyası Aç",
                  command=self.open_log_file).pack(side="left", padx=5)
        ttk.Button(util_buttons, text="📁 Kurulum Klasörü Aç",
                  command=self.open_install_directory).pack(side="left", padx=5)
        ttk.Button(util_buttons, text="🖥️ Masaüstü İkonu Tekrar Oluştur",
                  command=self.recreate_desktop_shortcut).pack(side="left", padx=5)
        ttk.Button(util_buttons, text="🌐 Ağ Temizliği",
                  command=self.quick_fix_network_cleanup).pack(side="left", padx=5)

    def update_navigation(self):
        """Navigasyon butonlarını güncelle"""
        self.prev_btn.config(state="normal" if self.current_page > 0 else "disabled")

        if self.current_page == len(self.notebook.tabs()) - 1:
            self.next_btn.config(text="Kapat", command=self.close_app)
        else:
            self.next_btn.config(text="İleri >", command=self.next_page)

        self.notebook.select(self.current_page)

    def prev_page(self):
        """Önceki sayfa"""
        if self.current_page > 0:
            self.current_page -= 1
            self.update_navigation()

    def next_page(self):
        """Sonraki sayfa"""
        if self.current_page < len(self.notebook.tabs()) - 1:
            # Sayfa geçiş validasyonları
            if self.current_page == 1:  # System check
                if not self.validate_system():
                    return
            elif self.current_page == 2:  # Config
                if not self.validate_config():
                    return

            self.current_page += 1
            self.update_navigation()

    def browse_directory(self):
        """Kurulum dizini seç"""
        directory = filedialog.askdirectory(initialdir=self.install_path)
        if directory:
            self.install_path = directory
            self.install_path_var.set(directory)

    def generate_postgres_password(self):
        """PostgreSQL şifresi oluştur"""
        import secrets
        import string

        alphabet = string.ascii_letters + string.digits
        password = ''.join(secrets.choice(alphabet) for _ in range(16))
        self.postgres_pass_var.set(password)

    def generate_pgadmin_password(self):
        """pgAdmin şifresi oluştur"""
        import secrets
        import string

        alphabet = string.ascii_letters + string.digits
        password = ''.join(secrets.choice(alphabet) for _ in range(12))
        self.pgadmin_pass_var.set(password)

    def check_system(self):
        """Sistem gereksinimlerini kontrol et"""
        # Clear previous checks
        for widget in self.check_frame.winfo_children():
            if isinstance(widget, ttk.Label) and hasattr(widget, 'check_result'):
                widget.destroy()

        # Docker
        try:
            res = subprocess.run(["docker", "--version"], capture_output=True, text=True, timeout=5)
            status = "✅ Kurulu" if res.returncode == 0 else "❌ Eksik"
            color = "green" if res.returncode == 0 else "red"
        except Exception:
            status = "❌ Eksik"
            color = "red"
        label = ttk.Label(self.check_frame, text=f"Docker: {status}", foreground=color)
        setattr(label, "check_result", status)
        label.pack(anchor="w", pady=2)

        # Docker Compose (V2 öncelikli, V1 fallback)
        compose_status = "❌ Eksik"
        compose_color = "red"
        try:
            v2 = subprocess.run(["docker", "compose", "version"], capture_output=True, text=True, timeout=5)
            if v2.returncode == 0:
                compose_status = "✅ Kurulu (V2)"
                compose_color = "green"
            else:
                v1 = subprocess.run(["docker-compose", "--version"], capture_output=True, text=True, timeout=5)
                if v1.returncode == 0:
                    compose_status = "✅ Kurulu (V1)"
                    compose_color = "green"
        except Exception:
            pass
        label = ttk.Label(self.check_frame, text=f"Docker Compose: {compose_status}", foreground=compose_color)
        setattr(label, "check_result", compose_status)
        label.pack(anchor="w", pady=2)

        # git
        try:
            res = subprocess.run(["git", "--version"], capture_output=True, text=True, timeout=5)
            status = "✅ Kurulu" if res.returncode == 0 else "❌ Eksik"
            color = "green" if res.returncode == 0 else "red"
        except Exception:
            status = "❌ Eksik"
            color = "red"
        label = ttk.Label(self.check_frame, text=f"git: {status}", foreground=color)
        setattr(label, "check_result", status)
        label.pack(anchor="w", pady=2)

        # curl (opsiyonel, eksik olduğunda kurulum engellenmez)
        try:
            res = subprocess.run(["curl", "--version"], capture_output=True, text=True, timeout=5)
            status = "✅ Kurulu" if res.returncode == 0 else "ℹ️ Opsiyonel: Yok"
            color = "green" if res.returncode == 0 else "orange"
        except Exception:
            status = "ℹ️ Opsiyonel: Yok"
            color = "orange"
        label = ttk.Label(self.check_frame, text=f"curl: {status}", foreground=color)
        setattr(label, "check_result", status)
        label.pack(anchor="w", pady=2)

    def validate_system(self):
        """Sistem kontrolü validasyonu"""
        checks = [widget for widget in self.check_frame.winfo_children()
                 if hasattr(widget, 'check_result')]

        if not checks:
            messagebox.showwarning("Uyarı", "Lütfen önce sistem kontrolü yapın!")
            return False

        failed_checks = [widget for widget in checks if "❌" in str(getattr(widget, "check_result", ""))]
        if failed_checks:
            messagebox.showerror("Hata", "Bazı sistem gereksinimleri karşılanmıyor!")
            return False

        return True

    def validate_config(self):
        """Konfigürasyon validasyonu"""
        if not self.postgres_pass_var.get():
            messagebox.showwarning("Uyarı", "PostgreSQL şifresi gerekli!")
            return False

        if not self.pgadmin_pass_var.get():
            messagebox.showwarning("Uyarı", "pgAdmin şifresi gerekli!")
            return False

        return True

    def start_installation(self):
        """Kurulumu başlat"""
        self.install_btn.config(state="disabled")
        self.progress.start()

        # Background thread'de kurulum yap
        thread = threading.Thread(target=self.run_installation)
        thread.daemon = True
        thread.start()

    def run_installation(self):
        """Kurulum işlemini çalıştır - Tam otomatik"""
        try:
            self.log_info("TradeBot kurulumu başlatılıyor...")
            self.log("🚀 TradeBot kurulumu başlatılıyor...")

            # Change to install directory
            os.chdir(self.install_path)

            # 1. System requirements check (already done in previous step)
            self.log_info("Sistem gereksinimleri kontrol edildi")
            self.log("✅ Sistem gereksinimleri kontrol edildi")

            # 1.1 Akıllı güncelleme kontrolü (opsiyonel)
            self.check_for_updates()

            # 2. Create .env file
            self.log_info("Environment dosyası oluşturuluyor...")
            self.log("📝 Environment dosyası oluşturuluyor...")
            force_mode = self.force_recreate_var.get()
            if force_mode:
                self.log("🔄 Force mode aktif - .env dosyası zorla yeniden oluşturuluyor...")
            self.create_env_file(force_recreate=force_mode)

            # 3. Setup directories
            self.log_info("Dizinler hazırlanıyor...")
            self.log("📁 Dizinler hazırlanıyor...")
            self.setup_directories()

            # 4. Setup nginx configuration
            self.log_info("Nginx konfigürasyonu oluşturuluyor...")
            self.log("🌐 Nginx konfigürasyonu oluşturuluyor...")
            self.setup_nginx()

            # 5. Check and start Docker service
            self.log_info("Docker servisi kontrol ediliyor...")
            self.log("🐳 Docker servisi kontrol ediliyor...")
            self.check_docker_service()

            # 6. Clean up existing containers
            self.log_info("Mevcut containerlar temizleniyor...")
            self.log("🧹 Mevcut containerlar temizleniyor...")
            self.cleanup_containers()

            # 7. Build and start services
            self.log_info("Docker images build ediliyor...")
            self.log("🏗️ Docker images build ediliyor... (Bu işlem birkaç dakika sürebilir)")
            self.start_services()

            # 8. Wait for services to be ready
            self.log_info("Servisler ayağa kalkması bekleniyor...")
            self.log("⏳ Servisler ayağa kalkması bekleniyor...")
            self.wait_for_services()

            # 9. Create desktop shortcut and startup scripts
            self.log_info("Masaüstü ikonu ve başlatma scriptleri oluşturuluyor...")
            self.log("🖥️ Masaüstü ikonu ve başlatma scriptleri oluşturuluyor...")
            self.create_desktop_shortcut()
            self.create_startup_scripts()

            self.log_info("Kurulum başarıyla tamamlandı!")
            self.log("🎉 Kurulum başarıyla tamamlandı!")
            self.show_success_info()

        except Exception as e:
            error_msg = f"Kurulum hatası: {str(e)}"
            self.log_error(error_msg, e)
            self.log(f"❌ Hata: {str(e)}")

            import traceback
            trace_msg = traceback.format_exc()
            self.log_error(f"Detaylı hata: {trace_msg}")
            self.log(f"Detay: {trace_msg}")

            # Hata durumunda kullanıcıya göster
            def _show_error():
                error_window = tk.Toplevel(self.root)
                error_window.title("Kurulum Hatası")
                error_window.geometry("700x500")

                ttk.Label(error_window, text="Kurulum sırasında hata oluştu:",
                         font=("Arial", 12, "bold")).pack(pady=10)

                # Error log text widget
                error_text = tk.Text(error_window, wrap=tk.WORD, height=15, width=80)
                error_text.pack(pady=10, padx=10, fill="both", expand=True)

                # Show last 10 errors
                for error in self.error_log[-10:]:
                    error_text.insert(tk.END, error + "\n\n")

                error_text.config(state="disabled")

                # Quick fixes frame
                fixes_frame = ttk.LabelFrame(error_window, text="Hızlı Çözümler", padding=10)
                fixes_frame.pack(fill="x", padx=10, pady=5)

                # Quick fix buttons
                quick_fixes = ttk.Frame(fixes_frame)
                quick_fixes.pack()

                ttk.Button(quick_fixes, text="🧹 Docker Temizle",
                          command=self.quick_fix_docker_cleanup).pack(side="left", padx=3)
                ttk.Button(quick_fixes, text="🔄 Docker Restart",
                          command=self.quick_fix_docker_restart).pack(side="left", padx=3)
                ttk.Button(quick_fixes, text="🌐 Ağ Temizliği",
                          command=self.quick_fix_network_cleanup).pack(side="left", padx=3)
                ttk.Button(quick_fixes, text="🗑️ Images Temizle",
                          command=self.quick_fix_cleanup_images).pack(side="left", padx=3)
                ttk.Button(quick_fixes, text="🔍 Şifre Kontrol",
                          command=self.quick_fix_password_sync).pack(side="left", padx=3)

                # Button frame
                btn_frame = ttk.Frame(error_window)
                btn_frame.pack(pady=10)

                ttk.Button(btn_frame, text="📋 Log Dosyasını Aç",
                          command=self.open_log_file).pack(side="left", padx=5)
                ttk.Button(btn_frame, text="🔄 Tekrar Dene",
                          command=lambda: [error_window.destroy(), self.start_installation()]).pack(side="left", padx=5)
                ttk.Button(btn_frame, text="❌ Kapat",
                          command=error_window.destroy).pack(side="left", padx=5)

            self.root.after(0, _show_error)

        finally:
            self.progress.stop()
            self.install_btn.config(state="normal")

    def setup_directories(self):
        """Gerekli dizinleri oluştur"""
        directories = ['logs', 'cache/data', 'scripts']
        for directory in directories:
            os.makedirs(directory, exist_ok=True)

    def setup_nginx(self):
        """Nginx konfigürasyonu oluştur"""
        nginx_config = """# TradeBot Nginx Configuration
# Auto-generated by GUI Installer

events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8000;
    }

    upstream frontend {
        server frontend:80;
    }

    server {
        listen 80;
        server_name localhost;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health checks
        location /health {
            proxy_pass http://backend;
            proxy_set_header Host $host;
        }
    }
}
"""
        with open('nginx.conf', 'w') as f:
            f.write(nginx_config)

    def check_docker_service(self):
        """Docker servisini kontrol et ve başlat (platform'a göre)"""
        try:
            # Docker info check
            result = subprocess.run(['docker', 'info'], capture_output=True, text=True, encoding='utf-8', errors='replace')
            if result.returncode == 0:
                self.log_info("Docker servisi zaten çalışıyor")
                self.log("✅ Docker servisi çalışıyor")
                return

            self.log_info("Docker servisi çalışmıyor, başlatılmaya çalışılıyor...")
            self.log("⚠️ Docker servisi çalışmıyor, başlatılıyor...")

            sysname = platform.system()
            started = False

            if sysname == "Windows":
                desktop_exe_paths = [
                    r"C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe",
                    r"C:\\Program Files (x86)\\Docker\\Docker\\Docker Desktop.exe",
                ]
                docker_desktop = next((p for p in desktop_exe_paths if os.path.exists(p)), None)
                if docker_desktop:
                    try:
                        subprocess.Popen([docker_desktop], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                        started = True
                    except Exception as e:
                        self.log_warning(f"Docker Desktop başlatılamadı: {str(e)}")
                else:
                    # Fallback: try using shell to start app by name
                    try:
                        subprocess.Popen(["start", "", "Docker Desktop"], shell=True)
                        started = True
                    except Exception:
                        pass

            elif sysname == "Darwin":  # macOS
                try:
                    subprocess.run(['open', '-a', 'Docker'], capture_output=True, text=True, encoding='utf-8', errors='replace')
                    started = True
                except Exception as e:
                    self.log_warning(f"macOS Docker başlatılamadı: {str(e)}")

            else:  # Linux
                start_result = subprocess.run(['sudo', 'systemctl', 'start', 'docker'],
                                              capture_output=True, text=True, encoding='utf-8', errors='replace')
                started = (start_result.returncode == 0)
                if not started:
                    self.log_error(f"Docker servisi başlatılamadı. Start result: {start_result.stderr}")

            if started:
                import time
                # Windows'ta Docker Desktop'ın ayağa kalkması için biraz daha bekle
                time.sleep(15 if sysname == "Windows" else 5)

            # Tekrar kontrol et
            check_result = subprocess.run(['docker', 'info'], capture_output=True, text=True, encoding='utf-8', errors='replace')
            if check_result.returncode == 0:
                self.log_info("Docker servisi başarıyla başlatıldı")
                self.log("✅ Docker servisi başlatıldı")
            else:
                error_msg = f"Docker servisi başlatılamadı. Check result: {check_result.stderr}"
                self.log_error(error_msg)
                raise Exception("Docker servisi başlatılamadı - manuel olarak başlatın")
        except Exception as e:
            self.log_error(f"Docker servisi hatası: {str(e)}", e)
            self.log(f"❌ Docker servisi hatası: {str(e)}")
            raise

    def cleanup_containers(self):
        """Mevcut containerları temizle"""
        try:
            # Compose dosya yolu (varsa kullan)
            compose_file = os.path.join(self.install_path, 'docker-compose.yml')
            if not os.path.exists(compose_file):
                alt_path = os.path.join(self.install_path, 'tradebot', 'docker-compose.yml')
                if os.path.exists(alt_path):
                    compose_file = alt_path

            # Stop and remove existing containers (Compose V2/V1)
            compose_cmd = None
            v2_check = subprocess.run(['docker', 'compose', 'version'], capture_output=True, text=True, encoding='utf-8', errors='replace')
            if v2_check.returncode == 0:
                compose_cmd = ['docker', 'compose']
            else:
                v1_check = subprocess.run(['docker-compose', 'version'], capture_output=True, text=True, encoding='utf-8', errors='replace')
                if v1_check.returncode == 0:
                    compose_cmd = ['docker-compose']

            if compose_cmd and os.path.exists(compose_file):
                down_result = subprocess.run(compose_cmd + ['-f', compose_file, 'down', '--remove-orphans'],
                                             capture_output=True, text=True, encoding='utf-8', errors='replace')
                if down_result.returncode != 0:
                    self.log_error(f"Container stop hatası: {down_result.stderr}")
                    # Don't raise, continue anyway
            else:
                # Compose bulunamazsa yine de devam et
                self.log_warning("Docker Compose bulunamadı veya compose dosyası yok; 'down' adımı atlandı")

            # Remove dangling images
            prune_result = subprocess.run(['docker', 'image', 'prune', '-f'],
                                          capture_output=True, text=True, encoding='utf-8', errors='replace')
            if prune_result.returncode != 0:
                self.log_error(f"Image cleanup hatası: {prune_result.stderr}")
                # Don't raise, continue anyway

            self.log_info("Containerlar temizlendi")
            self.log("✅ Containerlar temizlendi")
        except Exception as e:
            self.log_error(f"Container temizleme hatası: {str(e)}", e)
            self.log(f"⚠️ Container temizleme uyarısı: {str(e)}")

    def create_env_file(self, force_recreate=False):
        """Gerekli .env dosyasını oluştur"""
        try:
            env_path = os.path.join(self.install_path, ".env")
            
            # .env dosyası zaten varsa kontrol et
            if os.path.exists(env_path) and not force_recreate:
                self.log_info(".env dosyası mevcut, şifre senkronizasyonu kontrol ediliyor...")
                if self.check_password_sync():
                    self.log_info(".env dosyası senkronize, atlanıyor")
                    return
                else:
                    self.log_warning(".env dosyası senkronize değil, yeniden oluşturuluyor...")
                    # Backup oluştur
                    backup_path = f"{env_path}.backup.{datetime.datetime.now().strftime('%Y%m%d_%H%M%S')}"
                    shutil.copy2(env_path, backup_path)
                    self.log_info(f"Eski .env dosyası yedeklendi: {backup_path}")
            
            self.log_info("Güvenli .env dosyası oluşturuluyor...")
            self.log("🔒 Güvenli .env dosyası oluşturuluyor...")
            
            # Güvenli değerler oluştur
            import secrets
            import string
            
            def generate_secure_password(length=24):
                alphabet = string.ascii_letters + string.digits
                return ''.join(secrets.choice(alphabet) for _ in range(length))
            
            def generate_secret_key():
                return secrets.token_urlsafe(32)
            
            # FERNET_KEY oluştur
            try:
                from cryptography.fernet import Fernet
                fernet_key = Fernet.generate_key().decode()
            except ImportError:
                # Fallback: güvenli key
                fernet_key = secrets.token_urlsafe(32)
                self.log_warning("cryptography modülü bulunamadı, güvenli fallback key kullanılıyor")
            
            # Güvenli şifreler oluştur
            secure_postgres_password = generate_secure_password(24)
            secure_pgadmin_password = generate_secure_password(16)
            secure_redis_password = generate_secure_password(24)
            secure_secret_key = generate_secret_key()
            from urllib.parse import quote
            encoded_postgres_password = quote(secure_postgres_password, safe='')
            
            # .env içeriği
            env_content = f"""# ========================================
# TradeBot Environment Configuration
# ========================================
# Bu dosya installer tarafından otomatik oluşturuldu
# ÖNEMLİ: Bu dosyayı git'e commit etmeyin!

# ====================================
# DATABASE CONFIGURATION
# ====================================
POSTGRES_PASSWORD={secure_postgres_password}

# ====================================
# PGADMIN CONFIGURATION (Development)
# ====================================
PGADMIN_DEFAULT_EMAIL={self.config['pgadmin_email']}
PGADMIN_DEFAULT_PASSWORD={secure_pgadmin_password}

# ====================================
# SECURITY CONFIGURATION
# ====================================
SECRET_KEY={secure_secret_key}

# ====================================
# ENCRYPTION CONFIGURATION
# ====================================
FERNET_KEY={fernet_key}

# ====================================
# APPLICATION CONFIGURATION
# ====================================
ENVIRONMENT={self.config['environment']}
LOG_LEVEL=INFO
LIVE_TRADING_ENABLED=false
TESTNET_URL=true
TRADE_WEBHOOK_URL=

# Binance API anahtarı doğrulama ortamı
VALIDATE_API_ON_TESTNET=0

# SMTP (opsiyonel)
SMTP_SERVER=
SMTP_PORT=587
SMTP_USERNAME=
SMTP_PASSWORD=
FROM_EMAIL=noreply@tradebot.com

# ====================================
# FRONTEND CONFIGURATION
# ====================================
FRONTEND_URL=http://localhost:{self.config['frontend_port']}
VITE_API_URL=http://localhost:{self.config['backend_port']}

# ====================================
# LOGGING
# ====================================
LOG_FILE=/app/logs/tradebot.log

# ====================================
# REDIS / CELERY CONFIGURATION
# ====================================
REDIS_PASSWORD={secure_redis_password}
REDIS_URL=redis://:{secure_redis_password}@redis:6379/0
CELERY_BROKER_URL=redis://:{secure_redis_password}@redis:6379/0
CELERY_RESULT_BACKEND=redis://:{secure_redis_password}@redis:6379/0

# ====================================
# DATABASE URL
# ====================================
DATABASE_URL=postgresql+asyncpg://tradebot_user:{encoded_postgres_password}@postgres:5432/tradebot_db
SYNC_DATABASE_URL=postgresql://tradebot_user:{encoded_postgres_password}@postgres:5432/tradebot_db
"""
            
            with open(env_path, "w", encoding="utf-8") as f:
                f.write(env_content)

            # Compose dizinine .env kopyası (bayraksız compose için)
            primary_compose = os.path.join(self.install_path, "docker-compose.yml")
            alt_compose = os.path.join(self.install_path, "tradebot", "docker-compose.yml")
            compose_dir = os.path.dirname(primary_compose) if os.path.exists(primary_compose) else (os.path.dirname(alt_compose) if os.path.exists(alt_compose) else None)
            if compose_dir:
                compose_env_path = os.path.join(compose_dir, ".env")
                with open(compose_env_path, "w", encoding="utf-8") as cf:
                    cf.write(env_content)
            
            # Dosya izinlerini güvenli hale getir (Unix/Linux)
            if os.name != 'nt':  # Windows değilse
                os.chmod(env_path, 0o600)  # Sadece owner okuyabilir
                if 'compose_env_path' in locals():
                    os.chmod(compose_env_path, 0o600)
            
            self.log_info(".env dosyası başarıyla oluşturuldu")
            self.log("✅ Güvenli .env dosyası oluşturuldu")
            self.log(f"🔐 PostgreSQL Şifresi: {secure_postgres_password[:8]}...")
            self.log(f"🔐 pgAdmin Şifresi: {secure_pgadmin_password[:8]}...")
            
        except Exception as e:
            self.log_error(f".env dosyası oluşturulamadı: {str(e)}", e)
            self.log(f"⚠️ .env dosyası oluşturulamadı: {str(e)}")
            # Don't raise, continue anyway

    def check_password_sync(self):
        """Şifre senkronizasyonu kontrolü yap"""
        try:
            env_path = os.path.join(self.install_path, ".env")
            primary_compose = os.path.join(self.install_path, "docker-compose.yml")
            alt_compose = os.path.join(self.install_path, "tradebot", "docker-compose.yml")
            docker_compose_path = primary_compose if os.path.exists(primary_compose) else (alt_compose if os.path.exists(alt_compose) else None)
            
            # .env yoksa compose dizinindeki .env'yi dene
            if not os.path.exists(env_path) and docker_compose_path:
                compose_env_path = os.path.join(os.path.dirname(docker_compose_path), ".env")
                if os.path.exists(compose_env_path):
                    env_path = compose_env_path
            
            if not env_path or not docker_compose_path or not os.path.exists(env_path) or not os.path.exists(docker_compose_path):
                return False
            
            # .env dosyasından POSTGRES_PASSWORD'u oku
            env_password = None
            with open(env_path, 'r', encoding='utf-8') as f:
                for line in f:
                    if line.startswith('POSTGRES_PASSWORD='):
                        env_password = line.split('=', 1)[1].strip()
                        break
            
            if not env_password:
                self.log_warning(".env dosyasında POSTGRES_PASSWORD bulunamadı")
                return False
            
            # docker-compose.yml'den varsayılan şifreyi oku
            with open(docker_compose_path, 'r', encoding='utf-8') as f:
                docker_content = f.read()
            
            # Docker-compose'da POSTGRES_PASSWORD kontrolü
            if 'POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-' in docker_content:
                # Varsayılan şifreyi çıkar
                import re
                match = re.search(r'POSTGRES_PASSWORD:\s*\$\{POSTGRES_PASSWORD:-(.+?)\}', docker_content)
                if match:
                    default_password = match.group(1).strip()
                    if env_password == default_password:
                        self.log_warning("Şifre varsayılan değerle aynı, yeniden oluşturulmalı")
                        return False
            
            # DATABASE_URL kontrolü (URL-encoded parolayı destekler)
            from urllib.parse import quote
            with open(env_path, 'r', encoding='utf-8') as f:
                env_content = f.read()
            encoded_env_password = quote(env_password, safe='')
            
            if f'tradebot_user:{encoded_env_password}@postgres:5432/tradebot_db' in env_content:
                self.log_info("Şifre senkronizasyonu başarılı")
                return True
            else:
                self.log_warning("DATABASE_URL'de şifre uyumsuzluğu")
                return False
                
        except Exception as e:
            self.log_error(f"Şifre senkronizasyonu kontrolü hatası: {str(e)}", e)
            return False

    def check_password_sync_gui(self):
        """GUI için şifre senkronizasyonu kontrolü"""
        try:
            result = self.check_password_sync()
            if result:
                messagebox.showinfo("Senkronizasyon Kontrolü", 
                                  "✅ Şifre senkronizasyonu başarılı!\n"
                                  ".env dosyası ve docker-compose.yml uyumlu.")
            else:
                messagebox.showwarning("Senkronizasyon Kontrolü", 
                                     "⚠️ Şifre senkronizasyonu sorunu tespit edildi!\n"
                                     "Önerilen çözümler:\n"
                                     "• 'Force mode' seçeneğini işaretleyin\n"
                                     "• Docker volumes'ları temizleyin\n"
                                     "• Manuel olarak .env dosyasını kontrol edin")
        except Exception as e:
            messagebox.showerror("Hata", f"Şifre senkronizasyonu kontrolü başarısız:\n{str(e)}")

    def start_services(self):
        """Docker servislerini build et ve başlat"""
        try:
            # .env dosyası kontrolü ve oluşturma
            force_mode = getattr(self, 'force_recreate_var', tk.BooleanVar(value=False)).get()
            self.create_env_file(force_recreate=force_mode)
            
            # Compose dosya yolu tespiti
            compose_file = os.path.join(self.install_path, 'docker-compose.yml')
            if not os.path.exists(compose_file):
                alt_path = os.path.join(self.install_path, 'tradebot', 'docker-compose.yml')
                if os.path.exists(alt_path):
                    compose_file = alt_path
                else:
                    error_msg = f"docker-compose.yml bulunamadı: {compose_file}"
                    self.log_error(error_msg)
                    self.log(f"❌ {error_msg}")
                    raise Exception("Docker compose dosyası bulunamadı")

            # Compose komut tespiti (V2 öncelikli)
            compose_cmd = None
            v2_check = subprocess.run(['docker', 'compose', 'version'], capture_output=True, text=True, encoding='utf-8', errors='replace')
            if v2_check.returncode == 0:
                compose_cmd = ['docker', 'compose']
                self.log_info("Docker Compose V2 kullanılacak")
            else:
                v1_check = subprocess.run(['docker-compose', 'version'], capture_output=True, text=True, encoding='utf-8', errors='replace')
                if v1_check.returncode == 0:
                    compose_cmd = ['docker-compose']
                    self.log_info("Docker Compose V1 kullanılacak")
                else:
                    error_msg = "Docker Compose bulunamadı. Lütfen 'docker compose' (V2) veya 'docker-compose' (V1) kurun."
                    self.log_error(error_msg)
                    self.log(f"❌ {error_msg}")
                    raise Exception(error_msg)
            
            # Önce mevcut imajları çek (pull-first)
            self.log_info(f"Docker images pull ediliyor... (compose file: {compose_file})")
            self.log("📥 Docker images pull ediliyor...")
            pull_result = subprocess.run(compose_cmd + ['-f', compose_file, 'pull'],
                                         capture_output=True, text=True, encoding='utf-8', errors='replace')
            if pull_result.returncode != 0:
                self.log_warning(f"Pull sırasında uyarı/başarısızlık: {pull_result.stderr}")
                self.log("ℹ️ Pull başarısız oldu veya bazı servisler için imaj bulunamadı, build adımına devam ediliyor...")

            # Build images (cache’li, opsiyonel no-cache)
            use_no_cache = str(os.environ.get('INSTALLER_NO_CACHE', '0')).lower() in ('1', 'true', 'yes')
            build_cmd = compose_cmd + ['-f', compose_file, 'build'] + (['--no-cache'] if use_no_cache else [])
            self.log_info(f"Docker images build ediliyor... (compose file: {compose_file}, no-cache={use_no_cache})")
            self.log("🔨 Docker images build ediliyor...")
            build_result = subprocess.run(build_cmd,
                                          capture_output=True, text=True, encoding='utf-8', errors='replace')
            if build_result.returncode != 0:
                # Yaygın hataları daha anlaşılır hale getir
                stderr_lower = build_result.stderr.lower()
                stdout_lower = build_result.stdout.lower()

                if "no configuration file provided" in stderr_lower or "no configuration file provided" in stdout_lower:
                    error_msg = "Docker build hatası: docker-compose.yml bulunamadı veya erişilemedi."
                elif "--no-dev" in stderr_lower or "--no-dev" in stdout_lower:
                    error_msg = "Docker build hatası: Dockerfile'da geçersiz '--no-dev' seçeneği kullanılıyor. Bu seçenek pip için değil, poetry için geçerlidir."
                elif "no space left" in stderr_lower:
                    error_msg = "Docker build hatası: Disk alanı yetersiz. Lütfen disk alanınızı kontrol edin."
                elif "permission denied" in stderr_lower:
                    error_msg = "Docker build hatası: İzin hatası. Docker daemon'a erişim izniniz var mı?"
                elif "network" in stderr_lower and "timeout" in stderr_lower:
                    error_msg = "Docker build hatası: İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin."
                else:
                    error_msg = "Docker build başarısız"

                self.log_error(f"{error_msg}. Stdout: {build_result.stdout}, Stderr: {build_result.stderr}")
                self.log(f"❌ {error_msg}")
                self.log("Detaylı hata için log dosyasını inceleyin")
                raise Exception(error_msg)

            # Pre-start database (and redis) to ensure clean password sync
            self.log_info("Önce Postgres ve Redis başlatılıyor...")
            self.log("🚀 Postgres ve Redis başlatılıyor...")
            pre_start = subprocess.run(compose_cmd + ['-f', compose_file, 'up', '-d', 'postgres', 'redis'],
                                       capture_output=True, text=True, encoding='utf-8', errors='replace')
            if pre_start.returncode != 0:
                self.log_warning(f"Ön başlatma uyarısı: {pre_start.stderr}")

            # Wait for Postgres to be ready
            import time, re
            for attempt in range(1, 11):
                ready = subprocess.run(['docker', 'exec', 'tradebot-postgres', 'pg_isready', '-U', 'tradebot_user', '-d', 'tradebot_db'],
                                       capture_output=True, text=True, encoding='utf-8', errors='replace')
                if ready.returncode == 0:
                    break
                time.sleep(3)

            # Reconcile DB user password if needed
            env_path = os.path.join(self.install_path, ".env")
            if not os.path.exists(env_path):
                compose_env_path = os.path.join(os.path.dirname(compose_file), ".env")
                if os.path.exists(compose_env_path):
                    env_path = compose_env_path

            env_password = None
            if env_path and os.path.exists(env_path):
                with open(env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        if line.startswith("POSTGRES_PASSWORD="):
                            env_password = line.split("=", 1)[1].strip()
                            break

            default_password = None
            with open(compose_file, "r", encoding="utf-8") as f:
                docker_content = f.read()
            m = re.search(r'POSTGRES_PASSWORD:\s*\$\{POSTGRES_PASSWORD:-(.+?)\}', docker_content)
            if m:
                default_password = m.group(1).strip()

            # Try last .env backup as additional candidate
            backup_password = None
            try:
                import glob
                backups = sorted(glob.glob(os.path.join(self.install_path, ".env.backup.*")))
                if backups:
                    with open(backups[-1], "r", encoding="utf-8") as bf:
                        for line in bf:
                            if line.startswith("POSTGRES_PASSWORD="):
                                backup_password = line.split("=", 1)[1].strip()
                                break
            except Exception:
                pass

            def _psql_ok(pw: str) -> bool:
                if not pw:
                    return False
                test_cmd = ['docker', 'exec', 'tradebot-postgres', 'bash', '-lc',
                            f"PGPASSWORD='{pw}' psql -U tradebot_user -d tradebot_db -tAc 'SELECT 1'"]
                test_res = subprocess.run(test_cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
                return test_res.returncode == 0

            current_pw = None
            if env_password and _psql_ok(env_password):
                current_pw = env_password
            elif default_password and _psql_ok(default_password):
                current_pw = default_password
            elif backup_password and _psql_ok(backup_password):
                current_pw = backup_password

            # Şifre uyumsuzluğu için otomatik düzeltme: hiçbir aday çalışmıyorsa volume sıfırla
            if not current_pw:
                self.log_warning("Postgres şifresi mevcut volume ile uyuşmuyor. Otomatik onarım başlatılıyor: veritabanı volume yeniden oluşturulacak.")
                self.log("🛠️ Postgres volume sıfırlanıyor ve servisler yeniden başlatılıyor...")
                reset_res = subprocess.run(compose_cmd + ['-f', compose_file, 'down', '-v'],
                                           capture_output=True, text=True, encoding='utf-8', errors='replace')
                if reset_res.returncode != 0:
                    self.log_warning(f"Postgres volume sıfırlama uyarısı: {reset_res.stderr}")

                pre_start2 = subprocess.run(compose_cmd + ['-f', compose_file, 'up', '-d', 'postgres', 'redis'],
                                            capture_output=True, text=True, encoding='utf-8', errors='replace')
                if pre_start2.returncode != 0:
                    self.log_warning(f"Ön başlatma uyarısı (yeniden): {pre_start2.stderr}")

                for attempt in range(1, 11):
                    ready = subprocess.run(['docker', 'exec', 'tradebot-postgres', 'pg_isready', '-U', 'tradebot_user', '-d', 'tradebot_db'],
                                           capture_output=True, text=True, encoding='utf-8', errors='replace')
                    if ready.returncode == 0:
                        break
                    time.sleep(3)

                # Volume yeniden oluşturulduktan sonra .env şifresi ile doğrula
                if env_password and _psql_ok(env_password):
                    current_pw = env_password
                    self.log_info("Postgres volume yeniden oluşturuldu ve .env şifresi ile eşlendi.")
                else:
                    self.log_error("Postgres volume sonrası .env şifresi ile bağlantı kurulamadı.")
                    raise Exception("PostgreSQL şifre uyumsuzluğu devam ediyor")

            if current_pw and env_password and current_pw != env_password:
                self.log_info("Postgres şifresi .env ile farklı, güncelleniyor...")
                alter_cmd = ['docker', 'exec', 'tradebot-postgres', 'bash', '-lc',
                             f"PGPASSWORD='{current_pw}' psql -U tradebot_user -d tradebot_db -c \"ALTER USER tradebot_user WITH PASSWORD '{env_password}';\""]
                alter_res = subprocess.run(alter_cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
                if alter_res.returncode == 0:
                    self.log_info("Postgres şifresi .env ile uyumlu hale getirildi.")
                else:
                    self.log_warning(f"Postgres şifre güncelleme uyarısı: {alter_res.stderr}")

            # Start services
            self.log_info("Servisler başlatılıyor...")
            self.log("🚀 Servisler başlatılıyor...")
            start_result = subprocess.run(compose_cmd + ['-f', compose_file, 'up', '-d'],
                                          capture_output=True, text=True, encoding='utf-8', errors='replace')
            if start_result.returncode != 0:
                stderr_lower = start_result.stderr.lower()

                if "no configuration file provided" in stderr_lower:
                    error_msg = "Servis başlatma hatası: docker-compose.yml bulunamadı veya erişilemedi."
                elif "port" in stderr_lower and "already" in stderr_lower:
                    error_msg = "Servis başlatma hatası: Port zaten kullanımda. Lütfen port ayarlarını kontrol edin."
                elif "network" in stderr_lower:
                    error_msg = "Servis başlatma hatası: Docker network sorunu."
                elif "password authentication failed" in stderr_lower:
                    error_msg = "Servis başlatma hatası: PostgreSQL şifre authentication hatası. .env dosyasını kontrol edin."
                elif "fernet_key is required" in stderr_lower or "fernet" in stderr_lower:
                    error_msg = "Servis başlatma hatası: FERNET_KEY eksik. Güvenlik anahtarı oluşturulamadı."
                elif "dependency failed" in stderr_lower:
                    error_msg = "Servis başlatma hatası: Bağımlılık servisi başlatılamadı. Logları kontrol edin."
                else:
                    error_msg = "Servisler başlatılamadı"

                self.log_error(f"{error_msg}. Stdout: {start_result.stdout}, Stderr: {start_result.stderr}")
                self.log(f"❌ {error_msg}")
                self.log("Detaylı hata için log dosyasını inceleyin")
                raise Exception(error_msg)

            self.log_info("Servisler başarıyla başlatıldı")
            self.log("✅ Servisler başlatıldı")
        except Exception as e:
            # Eğer exception bizim özel mesajımızdan değilse, genel hata mesajı ver
            if not str(e).startswith("Docker build hatası") and not str(e).startswith("Servis başlatma hatası"):
                self.log_error(f"Servis başlatma genel hatası: {str(e)}", e)
                self.log(f"❌ Beklenmeyen hata: {str(e)}")
            raise

    def check_for_updates(self):
        """Opsiyonel uzak manifest ile akıllı güncelleme kontrolü yapar."""
        try:
            import requests
            local_version = None
            version_path = os.path.join(self.install_path, 'version.json')
            if os.path.exists(version_path):
                with open(version_path, 'r', encoding='utf-8') as vf:
                    try:
                        data = json.load(vf)
                        local_version = data.get('version')
                    except Exception:
                        self.log_warning('Yerel version.json okunamadı veya geçersiz')

            manifest_url = os.environ.get('UPDATE_MANIFEST_URL')
            if not manifest_url:
                self.log_info('Güncelleme manifest URL’i yapılandırılmamış, güncelleme kontrolü atlandı')
                return

            self.log_info('Uzak manifest alınıyor ve sürüm karşılaştırması yapılıyor...')
            resp = requests.get(manifest_url, timeout=5)
            if resp.status_code != 200:
                self.log_warning(f'Manifest alınamadı: HTTP {resp.status_code}')
                return
            remote = resp.json()
            remote_version = remote.get('version')
            if local_version and remote_version and local_version != remote_version:
                self.log(f"🔔 Yeni sürüm bulundu: {remote_version} (yerel: {local_version})")
            else:
                self.log("ℹ️ Sürüm güncel veya karşılaştırma yapılamadı")
        except Exception as e:
            self.log_warning(f"Güncelleme kontrolü sırasında uyarı: {str(e)}")

    def wait_for_services(self):
        """Servislerin hazır olmasını bekle"""
        import time
        import requests

        self.log_info("Backend servisi hazır olması bekleniyor...")
        self.log("⏳ Backend servisi hazır olması bekleniyor...")
        max_attempts = 60
        attempt = 1

        while attempt <= max_attempts:
            try:
                response = requests.get(f"http://localhost:{self.port_vars['backend_port'].get()}/health",
                                      timeout=5)
                if response.status_code == 200:
                    self.log_info("Backend servisi hazır!")
                    self.log("✅ Backend servisi hazır!")
                    break
            except Exception as e:
                if attempt == 1:  # Sadece ilk hatayi log'la
                    self.log_error(f"Backend servis kontrol hatası: {str(e)}", e)

            self.log(f"⏳ Deneme {attempt}/{max_attempts}...")
            time.sleep(5)
            attempt += 1

        if attempt > max_attempts:
            self.log_error("Backend servisi belirtilen sürede hazır olmadı")
            self.log("⚠️ Backend servisi belirtilen sürede hazır olmadı")
            self.log("ℹ️ Logları kontrol edin: docker-compose logs backend")

        # Check frontend
        self.log_info("Frontend servisi kontrol ediliyor...")
        self.log("⏳ Frontend servisi kontrol ediliyor...")
        time.sleep(5)
        try:
            response = requests.get(f"http://localhost:{self.port_vars['frontend_port'].get()}",
                                  timeout=5)
            if response.status_code == 200:
                self.log_info("Frontend servisi hazır!")
                self.log("✅ Frontend servisi hazır!")
            else:
                self.log_error(f"Frontend servisi yanıt vermiyor: HTTP {response.status_code}")
                self.log("⚠️ Frontend servisi henüz hazır değil, ancak devam edebilirsiniz")
        except Exception as e:
            self.log_error(f"Frontend servis kontrol hatası: {str(e)}", e)
            self.log("⚠️ Frontend servisi henüz hazır değil, ancak devam edebilirsiniz")

    def create_env_file_legacy(self):
        """Environment dosyası oluştur (legacy)"""
        from urllib.parse import quote
        _pgpass = self.postgres_pass_var.get()
        _pgpass_enc = quote(_pgpass, safe='')
        import secrets, string
        _alphabet = string.ascii_letters + string.digits
        _redispass = ''.join(secrets.choice(_alphabet) for _ in range(24))
        env_content = f"""# TradeBot Environment Configuration
# Otomatik oluşturuldu - GUI Installer

POSTGRES_PASSWORD={_pgpass}
PGADMIN_DEFAULT_EMAIL={self.pgadmin_email_var.get()}
PGADMIN_DEFAULT_PASSWORD={self.pgadmin_pass_var.get()}

SECRET_KEY={self.generate_secret_key()}
FERNET_KEY={self.generate_fernet_key()}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

ENVIRONMENT={self.env_var.get()}
LOG_LEVEL=INFO

VITE_API_URL=http://localhost:{self.port_vars['backend_port'].get()}

LOG_FILE=/app/logs/tradebot.log
REDIS_PASSWORD={_redispass}
REDIS_URL=redis://:{_redispass}@redis:6379/0

DATABASE_URL=postgresql+asyncpg://tradebot_user:{_pgpass_enc}@postgres:5432/tradebot_db
SYNC_DATABASE_URL=postgresql://tradebot_user:{_pgpass_enc}@postgres:5432/tradebot_db
"""

        with open('.env', 'w') as f:
            f.write(env_content)
        # Compose dizinine .env kopyası
        primary_compose = os.path.join(self.install_path, "docker-compose.yml")
        alt_compose = os.path.join(self.install_path, "tradebot", "docker-compose.yml")
        compose_dir = os.path.dirname(primary_compose) if os.path.exists(primary_compose) else (os.path.dirname(alt_compose) if os.path.exists(alt_compose) else None)
        if compose_dir:
            with open(os.path.join(compose_dir, ".env"), "w", encoding="utf-8") as cf:
                cf.write(env_content)

    def generate_secret_key(self):
        """Secret key oluştur"""
        import secrets
        return secrets.token_hex(32)

    def generate_fernet_key(self):
        """Fernet key oluştur"""
        try:
            from cryptography.fernet import Fernet
            return Fernet.generate_key().decode()
        except ImportError:
            import base64
            import os
            return base64.urlsafe_b64encode(os.urandom(32)).decode()

    def log(self, message):
        """Log mesajı ekle"""
        def _log():
            self.log_text.insert(tk.END, message + "\n")
            self.log_text.see(tk.END)
            self.status_label.config(text=message)

        self.root.after(0, _log)

    def show_success_info(self):
        """Başarı bilgilerini göster"""
        def _show():
            info_text = f"""
🌐 Frontend: http://localhost:{self.port_vars['frontend_port'].get()}
🔧 Backend API: http://localhost:{self.port_vars['backend_port'].get()}
📚 API Docs: http://localhost:{self.port_vars['backend_port'].get()}/docs
🗃️ pgAdmin: http://localhost:{self.port_vars['pgadmin_port'].get()}

📧 pgAdmin Email: {self.pgadmin_email_var.get()}
🔐 pgAdmin Şifre: {self.pgadmin_pass_var.get()}
🗄️ PostgreSQL Şifre: {self.postgres_pass_var.get()}
"""

            # Clear success frame and add info
            for widget in self.success_frame.winfo_children():
                widget.destroy()

            ttk.Label(self.success_frame, text=info_text, justify="left",
                     font=("Courier", 10)).pack(anchor="w")

        self.root.after(0, _show)

    def open_frontend(self):
        """Frontend'i tarayıcıda aç"""
        import webbrowser
        webbrowser.open(f"http://localhost:{self.port_vars['frontend_port'].get()}")

    def open_api_docs(self):
        """API docs'u tarayıcıda aç"""
        import webbrowser
        webbrowser.open(f"http://localhost:{self.port_vars['backend_port'].get()}/docs")

    def open_pgadmin(self):
        """pgAdmin'i tarayıcıda aç"""
        import webbrowser
        webbrowser.open(f"http://localhost:{self.port_vars['pgadmin_port'].get()}")

    def close_app(self):
        """Uygulamayı kapat"""
        self.root.quit()

    def create_startup_scripts(self):
        """Proje başlatma scriptlerini oluştur"""
        try:
            # Start script for TradeBot
            start_script_content = self.get_start_script_content()
            stop_script_content = self.get_stop_script_content()

            if platform.system() == "Windows":
                # Windows batch files
                with open("start_tradebot.bat", "w", encoding="utf-8") as f:
                    f.write(start_script_content)
                with open("stop_tradebot.bat", "w", encoding="utf-8") as f:
                    f.write(stop_script_content)

                # Hidden launcher with VBS (runs batch without console window)
                batch_path = os.path.join(self.install_path, "start_tradebot.bat").replace("\\", "\\\\")
                vbs_content = f'Set WshShell = CreateObject("WScript.Shell")\nWshShell.Run "cmd /c ""{batch_path}""", 0, False\n'
                with open("start_tradebot.vbs", "w", encoding="utf-8") as f:
                    f.write(vbs_content)

            else:
                # Linux/macOS shell scripts
                with open("start_tradebot.sh", "w", encoding="utf-8") as f:
                    f.write(start_script_content)
                with open("stop_tradebot.sh", "w", encoding="utf-8") as f:
                    f.write(stop_script_content)

                # Make executable
                os.chmod("start_tradebot.sh", 0o755)
                os.chmod("stop_tradebot.sh", 0o755)

            self.log_info("Başlatma scriptleri oluşturuldu")

        except Exception as e:
            self.log_error("Başlatma scriptleri oluşturulamadı", e)

    def get_start_script_content(self):
        """Platform'a göre start script içeriği döndürür"""
        if platform.system() == "Windows":
            return f"""@echo off
chcp 65001 >nul
echo TradeBot başlatılıyor...
cd /d "{self.install_path}"

REM Docker kontrolü
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo HATA: Docker bulunamadı! Lütfen Docker Desktop'ı kurun ve başlatın.
    pause
    exit /b 1
)

REM Docker servisi kontrolü
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Docker servisi çalışmıyor, başlatılıyor...
    start "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"
    timeout /t 30 /nobreak >nul
)

REM Servisleri başlat
echo Servisler başlatılıyor...
docker compose up -d

if %errorlevel% equ 0 (
    echo.
    echo TradeBot başarıyla başlatıldı!
    echo.
    echo Erişim Linkleri:
    echo    Frontend:    http://localhost:{self.config['frontend_port']}
    echo    Backend API: http://localhost:{self.config['backend_port']}
    echo    pgAdmin:     http://localhost:{self.config['pgadmin_port']}
    echo.
    echo Tarayıcı otomatik olarak açılacak...
    timeout /t 5 /nobreak >nul
    start http://localhost:{self.config['frontend_port']}
) else (
    echo HATA: TradeBot başlatılamadı!
    echo Detaylar için: docker compose logs
    pause
)
"""
        else:
            return f"""#!/bin/bash
echo "TradeBot başlatılıyor..."
cd "{self.install_path}"

# Prefer Docker Compose V2, fallback to V1
if docker compose version >/dev/null 2>&1; then
    docker compose up -d
elif command -v docker-compose >/dev/null 2>&1; then
    docker-compose up -d
else
    echo "HATA: Docker Compose bulunamadı. Lütfen docker-compose veya Docker Compose V2 kurun."
    exit 1
fi

echo ""
echo "TradeBot başlatıldı!"
echo "Frontend: http://localhost:{self.config['frontend_port']}"
echo "Backend API: http://localhost:{self.config['backend_port']}"
echo "pgAdmin: http://localhost:{self.config['pgadmin_port']}"
echo ""
echo "Tarayıcılar otomatik olarak açılacak..."
sleep 3

# Open in default browser
if command -v xdg-open > /dev/null; then
    xdg-open "http://localhost:{self.config['frontend_port']}" &
elif command -v open > /dev/null; then
    open "http://localhost:{self.config['frontend_port']}" &
fi

echo "TradeBot hazır!"
"""

    def get_stop_script_content(self):
        """Platform'a göre stop script içeriği döndürür"""
        if platform.system() == "Windows":
            return f"""@echo off
chcp 65001 >nul
echo TradeBot durduruluyor...
cd /d "{self.install_path}"

REM Servisleri durdur
docker compose down

if %errorlevel% equ 0 (
    echo TradeBot başarıyla durduruldu!
) else (
    echo HATA: TradeBot durdurulamadı!
    echo Detaylar için: docker compose logs
)

pause
"""
        else:
            return f"""#!/bin/bash
echo "TradeBot durduruluyor..."
cd "{self.install_path}"
docker-compose down
echo "TradeBot durduruldu!"
"""

    def create_desktop_shortcut(self):
        """Platform'a göre masaüstü ikonu oluştur"""
        try:
            desktop_path = self.get_desktop_path()
            if not desktop_path or not os.path.exists(desktop_path):
                self.log_error("Masaüstü klasörü bulunamadı")
                return

            if platform.system() == "Windows":
                self.create_windows_shortcut(desktop_path)
            elif platform.system() == "Darwin":  # macOS
                self.create_macos_shortcut(desktop_path)
            else:  # Linux
                self.create_linux_shortcut(desktop_path)

            self.log_info("Masaüstü ikonu oluşturuldu")

        except Exception as e:
            self.log_error("Masaüstü ikonu oluşturulamadı", e)

    def get_desktop_path(self):
        """Platform'a göre masaüstü yolunu döndürür"""
        if platform.system() == "Windows":
            return os.path.join(os.path.expanduser("~"), "Desktop")
        elif platform.system() == "Darwin":  # macOS
            return os.path.join(os.path.expanduser("~"), "Desktop")
        else:  # Linux
            # Try common desktop paths
            desktop_paths = [
                os.path.join(os.path.expanduser("~"), "Desktop"),
                os.path.join(os.path.expanduser("~"), "Masaüstü"),  # Turkish
                os.path.join(os.path.expanduser("~"), "Bureau"),    # French
            ]
            for path in desktop_paths:
                if os.path.exists(path):
                    return path
            return None

    def create_windows_shortcut(self, desktop_path):
        """Windows için shortcut oluştur"""
        try:
            import importlib
            win32com_client = importlib.import_module('win32com.client')  # type: ignore[reportMissingModuleSource]
            Dispatch = getattr(win32com_client, 'Dispatch')

            shortcut_path = os.path.join(desktop_path, "TradeBot.lnk")
            shell = Dispatch('WScript.Shell')
            shortcut = shell.CreateShortCut(shortcut_path)
            # Use VBS to run batch hidden if available
            vbs_path = os.path.join(self.install_path, "start_tradebot.vbs")
            target_path = vbs_path if os.path.exists(vbs_path) else os.path.join(self.install_path, "start_tradebot.bat")
            shortcut.Targetpath = target_path
            shortcut.WorkingDirectory = self.install_path
            
            # Icon path kontrolü
            icon_path = os.path.join(self.install_path, "assets", "icon.ico")
            if os.path.exists(icon_path):
                shortcut.IconLocation = icon_path
            else:
                # Varsayılan Windows icon
                shortcut.IconLocation = "shell32.dll,0"
                
            shortcut.Description = "TradeBot - Kripto Trading Bot"
            shortcut.save()
            
            self.log_info(f"Windows shortcut oluşturuldu: {shortcut_path}")

        except ImportError as e:
            self.log_error("pywin32 modülü bulunamadı, batch file fallback kullanılıyor", e)
            # Fallback: Create batch file
            shortcut_content = f"""@echo off
cd /d "{self.install_path}"
start start_tradebot.bat
"""
            shortcut_path = os.path.join(desktop_path, "TradeBot.bat")
            with open(shortcut_path, "w", encoding="utf-8") as f:
                f.write(shortcut_content)
            self.log_info(f"Fallback batch file oluşturuldu: {shortcut_path}")
            
        except Exception as e:
            self.log_error("Windows shortcut oluşturulamadı", e)
            # Son çare: Basit batch file
            shortcut_content = f"""@echo off
cd /d "{self.install_path}"
start start_tradebot.bat
"""
            shortcut_path = os.path.join(desktop_path, "TradeBot.bat")
            try:
                with open(shortcut_path, "w", encoding="utf-8") as f:
                    f.write(shortcut_content)
                self.log_info(f"Basit batch file oluşturuldu: {shortcut_path}")
            except Exception as fallback_error:
                self.log_error("Batch file bile oluşturulamadı", fallback_error)

    def create_linux_shortcut(self, desktop_path):
        """Linux için .desktop dosyası oluştur"""
        shortcut_content = f"""[Desktop Entry]
Version=1.0
Type=Application
Name=TradeBot
Comment=Kripto Trading Bot
Exec={os.path.join(self.install_path, "start_tradebot.sh")}
Icon={os.path.join(self.install_path, "assets", "icon.png")}
Path={self.install_path}
Terminal=false
StartupNotify=false
Categories=Office;Finance;
"""
        shortcut_path = os.path.join(desktop_path, "TradeBot.desktop")
        with open(shortcut_path, "w", encoding="utf-8") as f:
            f.write(shortcut_content)

        # Make executable
        os.chmod(shortcut_path, 0o755)

    def create_macos_shortcut(self, desktop_path):
        """macOS için app bundle oluştur"""
        app_path = os.path.join(desktop_path, "TradeBot.app")
        contents_path = os.path.join(app_path, "Contents")
        macos_path = os.path.join(contents_path, "MacOS")

        os.makedirs(macos_path, exist_ok=True)

        # Info.plist
        plist_content = f"""<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleExecutable</key>
    <string>TradeBot</string>
    <key>CFBundleIdentifier</key>
    <string>com.tradebot.app</string>
    <key>CFBundleName</key>
    <string>TradeBot</string>
    <key>CFBundlePackageType</key>
    <string>APPL</string>
    <key>CFBundleShortVersionString</key>
    <string>2.0</string>
</dict>
</plist>
"""
        with open(os.path.join(contents_path, "Info.plist"), "w") as f:
            f.write(plist_content)

        # Executable script
        exec_content = f"""#!/bin/bash
cd "{self.install_path}"
./start_tradebot.sh
"""
        exec_path = os.path.join(macos_path, "TradeBot")
        with open(exec_path, "w") as f:
            f.write(exec_content)
        os.chmod(exec_path, 0o755)

    def open_log_file(self):
        """Log dosyasını aç"""
        try:
            if platform.system() == "Windows":
                os.startfile(self.log_file)
            elif platform.system() == "Darwin":  # macOS
                subprocess.run(["open", self.log_file])
            else:  # Linux
                subprocess.run(["xdg-open", self.log_file])
        except Exception as e:
            self.log_error("Log dosyası açılamadı", e)

    def open_install_directory(self):
        """Kurulum klasörünü aç"""
        try:
            if platform.system() == "Windows":
                os.startfile(self.install_path)
            elif platform.system() == "Darwin":  # macOS
                subprocess.run(["open", self.install_path])
            else:  # Linux
                subprocess.run(["xdg-open", self.install_path])
        except Exception as e:
            self.log_error("Kurulum klasörü açılamadı", e)
            messagebox.showerror("Hata", f"Kurulum klasörü açılamadı: {str(e)}")

    def recreate_desktop_shortcut(self):
        """Masaüstü ikonunu tekrar oluştur"""
        try:
            self.create_desktop_shortcut()
            messagebox.showinfo("Başarılı", "Masaüstü ikonu tekrar oluşturuldu!")
        except Exception as e:
            self.log_error("Masaüstü ikonu oluşturulamadı", e)
            messagebox.showerror("Hata", f"Masaüstü ikonu oluşturulamadı: {str(e)}")

    def quick_fix_docker_cleanup(self):
        """Docker temizleme işlemi"""
        def _cleanup():
            try:
                self.log_info("Docker temizleme işlemi başlatılıyor...")
                self.log("🧹 Docker temizleme işlemi başlatılıyor...")

                # Docker temizleme komutu
                cleanup_result = subprocess.run(['docker', 'system', 'prune', '-a', '-f'],
                                                capture_output=True, text=True, encoding='utf-8', errors='replace')
                if cleanup_result.returncode != 0:
                    self.log_error(f"Docker temizleme hatası: {cleanup_result.stderr}")
                    self.log(f"❌ Docker temizleme hatası: {cleanup_result.stderr}")
                    return

                self.log_info("Docker temizleme işlemi başarıyla tamamlandı!")
                self.log("✅ Docker temizleme işlemi başarıyla tamamlandı!")
                messagebox.showinfo("Başarılı", "Docker temizleme işlemi tamamlandı!")

            except Exception as e:
                self.log_error(f"Docker temizleme hatası: {str(e)}", e)
                self.log(f"❌ Docker temizleme hatası: {str(e)}")
                messagebox.showerror("Hata", f"Docker temizleme hatası: {str(e)}")

        thread = threading.Thread(target=_cleanup)
        thread.daemon = True
        thread.start()

    def quick_fix_docker_restart(self):
        """Docker servisini restart et"""
        def _restart():
            try:
                self.log_info("Docker servisi restart ediliyor...")
                self.log("🔄 Docker servisi restart ediliyor...")

                sysname = platform.system()
                if sysname == "Windows":
                    # Docker Desktop'ı kapat ve tekrar başlat
                    subprocess.run(['taskkill', '/IM', 'Docker Desktop.exe', '/F'], capture_output=True, text=True, encoding='utf-8', errors='replace')
                    desktop_exe_paths = [
                        r"C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe",
                        r"C:\\Program Files (x86)\\Docker\\Docker\\Docker Desktop.exe",
                    ]
                    docker_desktop = next((p for p in desktop_exe_paths if os.path.exists(p)), None)
                    if docker_desktop:
                        subprocess.Popen([docker_desktop], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    else:
                        self.log_warning("Docker Desktop bulunamadı; manuel olarak başlatın")
                        return
                elif sysname == "Darwin":
                    # macOS: Docker uygulamasını kapat ve tekrar aç
                    subprocess.run(['osascript', '-e', 'quit app "Docker"'], capture_output=True, text=True, encoding='utf-8', errors='replace')
                    subprocess.run(['open', '-a', 'Docker'], capture_output=True, text=True, encoding='utf-8', errors='replace')
                else:
                    # Linux: systemd ile restart
                    restart_result = subprocess.run(['sudo', 'systemctl', 'restart', 'docker'],
                                                    capture_output=True, text=True, encoding='utf-8', errors='replace')
                    if restart_result.returncode != 0:
                        self.log_error(f"Docker restart hatası: {restart_result.stderr}")
                        self.log(f"❌ Docker restart hatası: {restart_result.stderr}")
                        return

                self.log_info("Docker servisi başarıyla restart edildi!")
                self.log("✅ Docker servisi başarıyla restart edildi!")
                messagebox.showinfo("Başarılı", "Docker servisi restart edildi!")

            except Exception as e:
                self.log_error(f"Docker restart hatası: {str(e)}", e)
                self.log(f"❌ Docker restart hatası: {str(e)}")
                messagebox.showerror("Hata", f"Docker restart hatası: {str(e)}")

        thread = threading.Thread(target=_restart)
        thread.daemon = True
        thread.start()

    def quick_fix_network_cleanup(self):
        """Docker ağ ve port temizliği"""
        def _net_cleanup():
            try:
                self.log_info("Docker ağ ve port temizliği başlatılıyor...")
                self.log("🌐 Docker Ağ Temizliği başlıyor...")

                # Compose dosya yolu tespiti
                compose_file = os.path.join(self.install_path, 'docker-compose.yml')
                if not os.path.exists(compose_file):
                    alt_path = os.path.join(self.install_path, 'tradebot', 'docker-compose.yml')
                    if os.path.exists(alt_path):
                        compose_file = alt_path

                # Compose komut tespiti (V2 öncelikli)
                compose_cmd = None
                v2_check = subprocess.run(['docker', 'compose', 'version'], capture_output=True, text=True, encoding='utf-8', errors='replace')
                if v2_check.returncode == 0:
                    compose_cmd = ['docker', 'compose']
                else:
                    v1_check = subprocess.run(['docker-compose', 'version'], capture_output=True, text=True, encoding='utf-8', errors='replace')
                    if v1_check.returncode == 0:
                        compose_cmd = ['docker-compose']

                # Containerları ve networkleri durdur
                if compose_cmd and os.path.exists(compose_file):
                    down_result = subprocess.run(compose_cmd + ['-f', compose_file, 'down', '--remove-orphans'],
                                                 capture_output=True, text=True, encoding='utf-8', errors='replace')
                    if down_result.returncode != 0:
                        self.log_warning(f"Ağ kapatma uyarısı: {down_result.stderr}")
                else:
                    self.log_warning("Compose bulunamadı veya compose dosyası yok; 'down' adımı atlandı")

                # Kullanılmayan ağları temizle
                net_prune = subprocess.run(['docker', 'network', 'prune', '-f'],
                                           capture_output=True, text=True, encoding='utf-8', errors='replace')
                if net_prune.returncode != 0:
                    self.log_error(f"Network prune hatası: {net_prune.stderr}")
                    self.log(f"❌ Ağ temizliği hatası: {net_prune.stderr}")
                    return

                self.log_info("Ağ temizliği başarıyla tamamlandı!")
                self.log("✅ Ağ temizliği tamamlandı!")
                messagebox.showinfo("Başarılı", "Docker ağ temizliği tamamlandı!")

            except Exception as e:
                self.log_error(f"Ağ temizliği hatası: {str(e)}", e)
                self.log(f"❌ Ağ temizliği hatası: {str(e)}")
                messagebox.showerror("Hata", f"Ağ temizliği hatası: {str(e)}")

        thread = threading.Thread(target=_net_cleanup)
        thread.daemon = True
        thread.start()

    def quick_fix_cleanup_images(self):
        """Docker images temizleme işlemi"""
        def _cleanup_images():
            try:
                self.log_info("Docker images temizleme işlemi başlatılıyor...")
                self.log("🗑️ Docker images temizleme işlemi başlatılıyor...")

                # Compose dosya yolu tespiti
                compose_file = os.path.join(self.install_path, 'docker-compose.yml')
                if not os.path.exists(compose_file):
                    alt_path = os.path.join(self.install_path, 'tradebot', 'docker-compose.yml')
                    if os.path.exists(alt_path):
                        compose_file = alt_path
                
                # Compose komut tespiti (V2 öncelikli)
                compose_cmd = None
                v2_check = subprocess.run(['docker', 'compose', 'version'], capture_output=True, text=True, encoding='utf-8', errors='replace')
                if v2_check.returncode == 0:
                    compose_cmd = ['docker', 'compose']
                else:
                    v1_check = subprocess.run(['docker-compose', 'version'], capture_output=True, text=True, encoding='utf-8', errors='replace')
                    if v1_check.returncode == 0:
                        compose_cmd = ['docker-compose']

                # Önce containerları durdur (Compose varsa)
                if compose_cmd and os.path.exists(compose_file):
                    down_result = subprocess.run(compute_cmd := compose_cmd + ['-f', compose_file, 'down', '--remove-orphans'],
                                                capture_output=True, text=True, encoding='utf-8', errors='replace')
                    if down_result.returncode != 0:
                        self.log_warning(f"Containerları durdurma sırasında uyarı: {down_result.stderr}")
                else:
                    self.log_warning("Compose bulunamadı veya compose dosyası yok; 'down' adımı atlanıyor")

                # Docker images temizleme komutu
                cleanup_result = subprocess.run(['docker', 'image', 'prune', '-a', '-f'],
                                                capture_output=True, text=True, encoding='utf-8', errors='replace')
                if cleanup_result.returncode != 0:
                    self.log_error(f"Docker images temizleme hatası: {cleanup_result.stderr}")
                    self.log(f"❌ Docker images temizleme hatası: {cleanup_result.stderr}")
                    return

                self.log_info("Docker images temizleme işlemi başarıyla tamamlandı!")
                self.log("✅ Docker images temizleme işlemi başarıyla tamamlandı!")
                messagebox.showinfo("Başarılı", "Docker images temizleme işlemi tamamlandı!")

            except Exception as e:
                self.log_error(f"Docker images temizleme hatası: {str(e)}", e)
                self.log(f"❌ Docker images temizleme hatası: {str(e)}")
                messagebox.showerror("Hata", f"Docker images temizleme hatası: {str(e)}")

        thread = threading.Thread(target=_cleanup_images)
        thread.daemon = True
        thread.start()

    def quick_fix_password_sync(self):
        """Hızlı şifre senkronizasyonu kontrolü"""
        def _password_sync():
            try:
                self.log_info("Şifre senkronizasyonu kontrol ediliyor...")
                self.log("🔍 Şifre senkronizasyonu kontrol ediliyor...")

                result = self.check_password_sync()
                if result:
                    self.log_info("✅ Şifre senkronizasyonu başarılı!")
                    self.log("✅ Şifre senkronizasyonu başarılı!")
                    messagebox.showinfo("Başarılı", "Şifre senkronizasyonu başarılı!")
                else:
                    self.log_warning("⚠️ Şifre senkronizasyonu sorunu tespit edildi!")
                    self.log("⚠️ Şifre senkronizasyonu sorunu tespit edildi!")
                    
                    # Otomatik düzeltme önerisi
                    response = messagebox.askyesno("Düzeltme Önerisi", 
                                                "Şifre senkronizasyonu sorunu tespit edildi.\n"
                                                "Otomatik olarak .env dosyasını yeniden oluşturmak ister misiniz?")
                    if response:
                        self.log_info("Otomatik düzeltme başlatılıyor...")
                        self.log("🔧 Otomatik düzeltme başlatılıyor...")
                        self.create_env_file(force_recreate=True)
                        self.log_info("✅ .env dosyası yeniden oluşturuldu!")
                        self.log("✅ .env dosyası yeniden oluşturuldu!")
                        messagebox.showinfo("Başarılı", ".env dosyası yeniden oluşturuldu!")
                    else:
                        messagebox.showinfo("Bilgi", "Manuel olarak 'Force mode' seçeneğini kullanabilirsiniz.")

            except Exception as e:
                self.log_error(f"Şifre senkronizasyonu kontrolü hatası: {str(e)}", e)
                self.log(f"❌ Şifre senkronizasyonu kontrolü hatası: {str(e)}")
                messagebox.showerror("Hata", f"Şifre senkronizasyonu kontrolü hatası: {str(e)}")

        thread = threading.Thread(target=_password_sync)
        thread.daemon = True
        thread.start()


def main():
    root = tk.Tk()
    app = TradeBotInstaller(root)
    root.mainloop()


if __name__ == "__main__":
    main()
