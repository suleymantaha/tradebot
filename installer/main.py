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

class TradeBotInstaller:
    def __init__(self, root):
        self.root = root
        self.root.title("TradeBot Installer v2.0")
        self.root.geometry("800x600")
        self.root.resizable(False, False)

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

        checks = [
            ("Docker", "docker --version"),
            ("Docker Compose", "docker-compose --version"),
            ("curl", "curl --version"),
            ("git", "git --version")
        ]

        for name, command in checks:
            try:
                result = subprocess.run(command.split(), capture_output=True, text=True, timeout=5)
                status = "✅ Kurulu" if result.returncode == 0 else "❌ Eksik"
                color = "green" if result.returncode == 0 else "red"
            except Exception:
                status = "❌ Eksik"
                color = "red"

            label = ttk.Label(self.check_frame, text=f"{name}: {status}", foreground=color)
            label.check_result = status
            label.pack(anchor="w", pady=2)

    def validate_system(self):
        """Sistem kontrolü validasyonu"""
        checks = [widget for widget in self.check_frame.winfo_children()
                 if hasattr(widget, 'check_result')]

        if not checks:
            messagebox.showwarning("Uyarı", "Lütfen önce sistem kontrolü yapın!")
            return False

        failed_checks = [widget for widget in checks if "❌" in widget.check_result]
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

            # 2. Create .env file
            self.log_info("Environment dosyası oluşturuluyor...")
            self.log("📝 Environment dosyası oluşturuluyor...")
            self.create_env_file()

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
                ttk.Button(quick_fixes, text="🗑️ Images Temizle",
                          command=self.quick_fix_cleanup_images).pack(side="left", padx=3)

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
        """Docker servisini kontrol et ve başlat"""
        try:
            # Docker info check
            result = subprocess.run(['docker', 'info'], capture_output=True, text=True)
            if result.returncode != 0:
                self.log_info("Docker servisi çalışmıyor, başlatılmaya çalışılıyor...")
                self.log("⚠️ Docker servisi çalışmıyor, başlatılıyor...")

                # Try to start Docker service
                start_result = subprocess.run(['sudo', 'systemctl', 'start', 'docker'],
                                            capture_output=True, text=True)
                if start_result.returncode == 0:
                    # Wait a bit and check again
                    import time
                    time.sleep(3)
                    check_result = subprocess.run(['docker', 'info'], capture_output=True, text=True)
                    if check_result.returncode == 0:
                        self.log_info("Docker servisi başarıyla başlatıldı")
                        self.log("✅ Docker servisi başlatıldı")
                    else:
                        error_msg = f"Docker servisi başlatılamadı. Check result: {check_result.stderr}"
                        self.log_error(error_msg)
                        raise Exception("Docker servisi başlatılamadı")
                else:
                    error_msg = f"Docker servisi başlatılamadı. Start result: {start_result.stderr}"
                    self.log_error(error_msg)
                    raise Exception("Docker servisi başlatılamadı - manuel olarak başlatın")
            else:
                self.log_info("Docker servisi zaten çalışıyor")
                self.log("✅ Docker servisi çalışıyor")
        except Exception as e:
            self.log_error(f"Docker servisi hatası: {str(e)}", e)
            self.log(f"❌ Docker servisi hatası: {str(e)}")
            raise

    def cleanup_containers(self):
        """Mevcut containerları temizle"""
        try:
            # Stop and remove existing containers
            down_result = subprocess.run(['docker-compose', 'down', '--remove-orphans'],
                         capture_output=True, text=True)
            if down_result.returncode != 0:
                self.log_error(f"Container stop hatası: {down_result.stderr}")
                # Don't raise, continue anyway

            # Remove dangling images
            prune_result = subprocess.run(['docker', 'image', 'prune', '-f'],
                         capture_output=True, text=True)
            if prune_result.returncode != 0:
                self.log_error(f"Image cleanup hatası: {prune_result.stderr}")
                # Don't raise, continue anyway

            self.log_info("Containerlar temizlendi")
            self.log("✅ Containerlar temizlendi")
        except Exception as e:
            self.log_error(f"Container temizleme hatası: {str(e)}", e)
            self.log(f"⚠️ Container temizleme uyarısı: {str(e)}")

    def start_services(self):
        """Docker servislerini build et ve başlat"""
        try:
            # Build images
            self.log_info("Docker images build ediliyor...")
            self.log("🔨 Docker images build ediliyor...")
            build_result = subprocess.run(['docker-compose', 'build', '--no-cache'],
                                        capture_output=True, text=True)
            if build_result.returncode != 0:
                # Yaygın hataları daha anlaşılır hale getir
                stderr_lower = build_result.stderr.lower()
                stdout_lower = build_result.stdout.lower()

                if "--no-dev" in stderr_lower or "--no-dev" in stdout_lower:
                    error_msg = "Docker build hatası: Dockerfile'da geçersiz '--no-dev' seçeneği kullanılıyor. Bu seçenek pip için değil, poetry için geçerlidir."
                elif "no space left" in stderr_lower:
                    error_msg = "Docker build hatası: Disk alanı yetersiz. Lütfen disk alanınızı kontrol edin."
                elif "permission denied" in stderr_lower:
                    error_msg = "Docker build hatası: İzin hatası. Docker daemon'a erişim izniniz var mı?"
                elif "network" in stderr_lower and "timeout" in stderr_lower:
                    error_msg = "Docker build hatası: İnternet bağlantısı sorunu. Lütfen bağlantınızı kontrol edin."
                else:
                    error_msg = f"Docker build başarısız"

                self.log_error(f"{error_msg}. Stdout: {build_result.stdout}, Stderr: {build_result.stderr}")
                self.log(f"❌ {error_msg}")
                self.log(f"Detaylı hata için log dosyasını inceleyin")
                raise Exception(error_msg)

            # Start services
            self.log_info("Servisler başlatılıyor...")
            self.log("🚀 Servisler başlatılıyor...")
            start_result = subprocess.run(['docker-compose', 'up', '-d'],
                                        capture_output=True, text=True)
            if start_result.returncode != 0:
                stderr_lower = start_result.stderr.lower()

                if "port" in stderr_lower and "already" in stderr_lower:
                    error_msg = "Servis başlatma hatası: Port zaten kullanımda. Lütfen port ayarlarını kontrol edin."
                elif "network" in stderr_lower:
                    error_msg = "Servis başlatma hatası: Docker network sorunu."
                else:
                    error_msg = "Servisler başlatılamadı"

                self.log_error(f"{error_msg}. Stdout: {start_result.stdout}, Stderr: {start_result.stderr}")
                self.log(f"❌ {error_msg}")
                self.log(f"Detaylı hata için log dosyasını inceleyin")
                raise Exception(error_msg)

            self.log_info("Servisler başarıyla başlatıldı")
            self.log("✅ Servisler başlatıldı")
        except Exception as e:
            # Eğer exception bizim özel mesajımızdan değilse, genel hata mesajı ver
            if not str(e).startswith("Docker build hatası") and not str(e).startswith("Servis başlatma hatası"):
                self.log_error(f"Servis başlatma genel hatası: {str(e)}", e)
                self.log(f"❌ Beklenmeyen hata: {str(e)}")
            raise

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

    def create_env_file(self):
        """Environment dosyası oluştur"""
        env_content = f"""# TradeBot Environment Configuration
# Otomatik oluşturuldu - GUI Installer

POSTGRES_PASSWORD={self.postgres_pass_var.get()}
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
REDIS_URL=redis://redis:6379

DATABASE_URL=postgresql+asyncpg://tradebot_user:{self.postgres_pass_var.get()}@postgres:5432/tradebot_db
"""

        with open('.env', 'w') as f:
            f.write(env_content)

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

                # Make executable
                os.chmod("start_tradebot.bat", 0o755)
                os.chmod("stop_tradebot.bat", 0o755)

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
echo TradeBot baslatiliyor...
cd /d "{self.install_path}"
docker-compose up -d
echo.
echo TradeBot baslatildi!
echo Frontend: http://localhost:{self.config['frontend_port']}
echo Backend API: http://localhost:{self.config['backend_port']}
echo pgAdmin: http://localhost:{self.config['pgadmin_port']}
echo.
echo Tarayicilar otomatik olarak acilacak...
timeout /t 5 /nobreak >nul
start http://localhost:{self.config['frontend_port']}
pause
"""
        else:
            return f"""#!/bin/bash
echo "TradeBot başlatılıyor..."
cd "{self.install_path}"
docker-compose up -d

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
echo TradeBot durduruluyor...
cd /d "{self.install_path}"
docker-compose down
echo TradeBot durduruldu!
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
            import winshell
            from win32com.client import Dispatch

            shortcut_path = os.path.join(desktop_path, "TradeBot.lnk")
            shell = Dispatch('WScript.Shell')
            shortcut = shell.CreateShortCut(shortcut_path)
            shortcut.Targetpath = os.path.join(self.install_path, "start_tradebot.bat")
            shortcut.WorkingDirectory = self.install_path
            shortcut.IconLocation = os.path.join(self.install_path, "assets", "icon.ico")
            shortcut.Description = "TradeBot - Kripto Trading Bot"
            shortcut.save()

        except ImportError:
            # Fallback: Create batch file
            shortcut_content = f"""@echo off
cd /d "{self.install_path}"
start start_tradebot.bat
"""
            shortcut_path = os.path.join(desktop_path, "TradeBot.bat")
            with open(shortcut_path, "w", encoding="utf-8") as f:
                f.write(shortcut_content)

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
Terminal=true
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
                                                capture_output=True, text=True)
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

                # Docker servisi restart
                restart_result = subprocess.run(['sudo', 'systemctl', 'restart', 'docker'],
                                                capture_output=True, text=True)
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

    def quick_fix_cleanup_images(self):
        """Docker images temizleme işlemi"""
        def _cleanup_images():
            try:
                self.log_info("Docker images temizleme işlemi başlatılıyor...")
                self.log("🗑️ Docker images temizleme işlemi başlatılıyor...")

                # Önce containerları durdur
                down_result = subprocess.run(['docker-compose', 'down'],
                                            capture_output=True, text=True)

                # Docker images temizleme komutu
                cleanup_result = subprocess.run(['docker', 'image', 'prune', '-a', '-f'],
                                                capture_output=True, text=True)
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


def main():
    root = tk.Tk()
    app = TradeBotInstaller(root)
    root.mainloop()


if __name__ == "__main__":
    main()
