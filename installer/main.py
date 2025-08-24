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
import traceback

class TradeBotInstaller:
    def __init__(self, root):
        print("[DEBUG] TradeBotInstaller __init__ started")
        self.root = root
        self.root.title("TradeBot Installer v2.0")
        self.root.geometry("800x600")
        self.root.resizable(False, False)

        # Installer state - Set smart default install path
        self.install_path = self.get_default_install_path()
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
        print("[DEBUG] TradeBotInstaller __init__ finished")

    def get_default_install_path(self):
        """Platform'a göre akıllı varsayılan kurulum dizini belirle"""
        try:
            home_dir = os.path.expanduser("~")

            if platform.system() == "Darwin":  # macOS
                default_path = os.path.join(home_dir, "TradeBot")
            elif platform.system() == "Windows":
                default_path = os.path.join(home_dir, "TradeBot")
            else:  # Linux
                default_path = os.path.join(home_dir, "TradeBot")

            print(f"[DEBUG] Varsayılan kurulum dizini: {default_path}")
            return default_path

        except Exception as e:
            print(f"[DEBUG] Default path hatası: {e}")
            # Fallback to current directory
            return os.getcwd()

    def setup_logging(self):
        """Error logging sistemini kurar"""
        self.log_file = os.path.join(self.install_path, "installer.log")
        try:
            with open(self.log_file, "w", encoding="utf-8") as f:
                f.write(f"TradeBot Installer Log - {datetime.datetime.now()}\n")
                f.write("=" * 50 + "\n\n")
        except Exception as e:
            print(f"Log dosyası oluşturulamadı: {e}")

    def find_docker_command(self):
        """Docker komutunun tam yolunu bul - macOS için özel"""
        # Yaygın Docker konumları (macOS öncelikli)
        possible_paths = [
            "/usr/local/bin/docker",
            "/opt/homebrew/bin/docker",
            "/Applications/Docker.app/Contents/Resources/bin/docker",
            "/usr/bin/docker",
            "docker"  # PATH'teki varsayılan
        ]

        for docker_path in possible_paths:
            try:
                result = subprocess.run([docker_path, "--version"],
                                     capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    self.log_info(f"Docker bulundu: {docker_path}")
                    return docker_path
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue

        return None

    def find_docker_compose_command(self):
        """Docker Compose komutunun tam yolunu bul"""
        # Yaygın Docker Compose konumları
        possible_paths = [
            "/usr/local/bin/docker-compose",
            "/opt/homebrew/bin/docker-compose",
            "/Applications/Docker.app/Contents/Resources/bin/docker-compose",
            "/usr/bin/docker-compose",
            "docker-compose"  # PATH'teki varsayılan
        ]

        for compose_path in possible_paths:
            try:
                result = subprocess.run([compose_path, "--version"],
                                     capture_output=True, text=True, timeout=5)
                if result.returncode == 0:
                    self.log_info(f"Docker Compose bulundu: {compose_path}")
                    return compose_path
            except (FileNotFoundError, subprocess.TimeoutExpired):
                continue

        return None

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
        print("[DEBUG] create_welcome_page started")
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
        print("[DEBUG] create_welcome_page finished")

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
            ("curl", "curl --version"),
            ("git", "git --version")
        ]

        # Check Docker separately with path finding
        docker_cmd = self.find_docker_command()
        if docker_cmd:
            try:
                result = subprocess.run([docker_cmd, "--version"], capture_output=True, text=True, timeout=5)
                docker_status = "✅ Kurulu" if result.returncode == 0 else "❌ Eksik"
                docker_color = "green" if result.returncode == 0 else "red"
            except Exception:
                docker_status = "❌ Eksik"
                docker_color = "red"
        else:
            docker_status = "❌ Eksik"
            docker_color = "red"

        # Check Docker Compose separately
        compose_cmd = self.find_docker_compose_command()
        if compose_cmd:
            try:
                result = subprocess.run([compose_cmd, "--version"], capture_output=True, text=True, timeout=5)
                compose_status = "✅ Kurulu" if result.returncode == 0 else "❌ Eksik"
                compose_color = "green" if result.returncode == 0 else "red"
            except Exception:
                compose_status = "❌ Eksik"
                compose_color = "red"
        else:
            compose_status = "❌ Eksik"
            compose_color = "red"

        # Display Docker checks
        docker_label = ttk.Label(self.check_frame, text=f"Docker: {docker_status}", foreground=docker_color)
        docker_label.check_result = docker_status
        docker_label.pack(anchor="w", pady=2)

        compose_label = ttk.Label(self.check_frame, text=f"Docker Compose: {compose_status}", foreground=compose_color)
        compose_label.check_result = compose_status
        compose_label.pack(anchor="w", pady=2)

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

            # Ensure install directory exists and is writable
            os.makedirs(self.install_path, exist_ok=True)

            # Change to install directory - CRITICAL for macOS .app bundles
            self.log_info(f"Kurulum dizinine geçiliyor: {self.install_path}")
            original_cwd = os.getcwd()
            os.chdir(self.install_path)
            self.log_info(f"Çalışma dizini: {os.getcwd()}")

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

            # Otomatik olarak sonraki sayfaya geç
            def _go_to_next_page():
                if self.current_page < len(self.notebook.tabs()) - 1:
                    self.current_page += 1
                    self.update_navigation()
            self.root.after(100, _go_to_next_page) # Kısa bir gecikme ile geçiş yap

        except Exception as e:
            error_msg = f"Kurulum hatası: {str(e)}"
            self.log_error(error_msg, e)
            self.log(f"❌ Hata: {str(e)}")

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
        """Gerekli dizinleri oluştur ve proje dosyalarını kopyala"""
        try:
            # Temel dizinleri oluştur
            directories = ['logs', 'cache/data', 'scripts', 'alembic/versions']
            for directory in directories:
                os.makedirs(directory, exist_ok=True)

            # PyInstaller ile paketlenmiş dosyalara erişim için kaynak dizini belirle
            if getattr(sys, 'frozen', False):
                # PyInstaller ile paketlenmiş durumda - gömülen dosyaları kullan
                bundle_dir = sys._MEIPASS
                self.log_info(f"PyInstaller bundle'ından dosyalar kopyalanıyor: {bundle_dir}")

                # Gömülen dosyaları kopyala
                files_to_copy = [
                    'docker-compose.yml',
                    'Dockerfile.backend',
                    'requirements.txt',
                    'alembic.ini'
                ]

                for file_name in files_to_copy:
                    src_path = os.path.join(bundle_dir, file_name)
                    if os.path.exists(src_path):
                        shutil.copy2(src_path, file_name)
                        self.log_info(f"✅ {file_name} kopyalandı")
                    else:
                        self.log_info(f"⚠️ {file_name} bundle'da bulunamadı")

                # Alembic dosyalarını kopyala
                src_alembic = os.path.join(bundle_dir, 'alembic')
                if os.path.exists(src_alembic):
                    if os.path.exists('alembic'):
                        shutil.rmtree('alembic')
                    shutil.copytree(src_alembic, 'alembic')
                    self.log_info("✅ alembic/ dizini kopyalandı")

                # App dizinini kopyala
                src_app = os.path.join(bundle_dir, 'app')
                if os.path.exists(src_app):
                    if os.path.exists('app'):
                        shutil.rmtree('app')
                    shutil.copytree(src_app, 'app')
                    self.log_info("✅ app/ dizini kopyalandı")

                # Frontend dizinini kopyala (node_modules hariç)
                src_frontend = os.path.join(bundle_dir, 'frontend')
                if os.path.exists(src_frontend):
                    if os.path.exists('frontend'):
                        shutil.rmtree('frontend')

                    # node_modules ve diğer gereksiz dizinleri ignore et
                    def ignore_patterns(dir, files):
                        return [f for f in files if f in ['node_modules', '.git', '__pycache__', '.DS_Store']]

                    shutil.copytree(src_frontend, 'frontend', ignore=ignore_patterns)
                    self.log_info("✅ frontend/ dizini kopyalandı (node_modules hariç)")

            else:
                # Development modunda - ana proje dizininden kopyala
                installer_dir = os.path.dirname(os.path.abspath(__file__))
                project_root = os.path.dirname(installer_dir)

                self.log_info(f"Development modunda proje dosyaları kopyalanıyor: {project_root}")

                # Gerekli dosyaları kopyala
                files_to_copy = [
                    'docker-compose.yml',
                    'Dockerfile.backend',
                    'requirements.txt',
                    'alembic.ini'
                ]

                for file_name in files_to_copy:
                    src_path = os.path.join(project_root, file_name)
                    if os.path.exists(src_path):
                        shutil.copy2(src_path, file_name)
                        self.log_info(f"✅ {file_name} kopyalandı")
                    else:
                        self.log_info(f"⚠️ {file_name} bulunamadı, atlandı")

                # Alembic migration dosyalarını kopyala
                src_migrations = os.path.join(project_root, 'alembic', 'versions')
                if os.path.exists(src_migrations):
                    for migration_file in os.listdir(src_migrations):
                        if migration_file.endswith('.py'):
                            src_file = os.path.join(src_migrations, migration_file)
                            dst_file = os.path.join('alembic', 'versions', migration_file)
                            shutil.copy2(src_file, dst_file)
                            self.log_info(f"✅ Migration {migration_file} kopyalandı")

                # Alembic env.py dosyasını kopyala
                src_env = os.path.join(project_root, 'alembic', 'env.py')
                if os.path.exists(src_env):
                    os.makedirs('alembic', exist_ok=True)
                    shutil.copy2(src_env, 'alembic/env.py')
                    self.log_info("✅ alembic/env.py kopyalandı")

                # App dizinini kopyala
                src_app = os.path.join(project_root, 'app')
                if os.path.exists(src_app):
                    if os.path.exists('app'):
                        shutil.rmtree('app')
                    shutil.copytree(src_app, 'app')
                    self.log_info("✅ app/ dizini kopyalandı")

                # Frontend dizinini kopyala
                src_frontend = os.path.join(project_root, 'frontend')
                if os.path.exists(src_frontend):
                    if os.path.exists('frontend'):
                        shutil.rmtree('frontend')
                    shutil.copytree(src_frontend, 'frontend')
                    self.log_info("✅ frontend/ dizini kopyalandı")

        except Exception as e:
            self.log_error(f"Dizin kurulumu hatası: {str(e)}", e)
            raise

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
            # Find Docker command first
            docker_cmd = self.find_docker_command()
            if not docker_cmd:
                error_msg = "Docker komutu bulunamadı! Docker Desktop kurulu ve PATH'te olduğundan emin olun."
                self.log_error(error_msg)
                raise Exception(error_msg)

            # Docker info check
            result = subprocess.run([docker_cmd, 'info'], capture_output=True, text=True)
            if result.returncode != 0:
                self.log_info("Docker servisi çalışmıyor, başlatılmaya çalışılıyor...")
                self.log("⚠️ Docker servisi çalışmıyor, başlatılıyor...")

                # Platform-specific Docker startup
                if platform.system() == "Darwin":  # macOS
                    self.log_info("macOS Docker Desktop başlatılıyor...")
                    # Try to open Docker Desktop
                    try:
                        subprocess.run(['open', '-a', 'Docker'], check=False)
                        self.log("🚀 Docker Desktop açılıyor...")

                        # Wait for Docker to start up
                        import time
                        max_wait = 60  # 60 seconds max wait
                        wait_time = 0

                        while wait_time < max_wait:
                            time.sleep(5)
                            wait_time += 5
                            check_result = subprocess.run([docker_cmd, 'info'], capture_output=True, text=True)
                            if check_result.returncode == 0:
                                self.log_info("Docker Desktop başarıyla başlatıldı")
                                self.log("✅ Docker Desktop başlatıldı")
                                break
                            else:
                                self.log(f"⏳ Docker başlatılıyor... ({wait_time}/{max_wait}s)")

                        if wait_time >= max_wait:
                            error_msg = "Docker Desktop belirtilen sürede başlatılamadı. Lütfen manuel olarak Docker Desktop'ı açın ve tekrar deneyin."
                            self.log_error(error_msg)
                            raise Exception(error_msg)

                    except Exception as e:
                        error_msg = f"Docker Desktop başlatılamadı: {str(e)}. Lütfen Docker Desktop'ı manuel olarak açın."
                        self.log_error(error_msg)
                        raise Exception(error_msg)

                elif platform.system() == "Linux":
                    # Linux systemctl
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

                elif platform.system() == "Windows":
                    # Windows Docker Desktop
                    try:
                        subprocess.run(['docker', 'run', '--rm', 'hello-world'],
                                     capture_output=True, text=True, check=True)
                        self.log_info("Docker servisi zaten çalışıyor")
                        self.log("✅ Docker servisi çalışıyor")
                    except subprocess.CalledProcessError:
                        error_msg = "Docker Desktop başlatılamadı. Lütfen Docker Desktop'ı manuel olarak açın."
                        self.log_error(error_msg)
                        raise Exception(error_msg)
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
            # Find Docker commands
            docker_cmd = self.find_docker_command()
            compose_cmd = self.find_docker_compose_command()

            if not docker_cmd:
                self.log_error("Docker komutu bulunamadı - temizleme atlanıyor")
                return

            # Stop and remove existing containers
            if compose_cmd:
                down_result = subprocess.run([compose_cmd, 'down', '--remove-orphans'],
                             capture_output=True, text=True)
                if down_result.returncode != 0:
                    self.log_error(f"Container stop hatası: {down_result.stderr}")
                    # Don't raise, continue anyway
            else:
                self.log_info("Docker Compose bulunamadı - container stop atlanıyor")

            # Remove dangling images
            prune_result = subprocess.run([docker_cmd, 'image', 'prune', '-f'],
                         capture_output=True, text=True)
            if prune_result.returncode != 0:
                self.log_error(f"Image cleanup hatası: {prune_result.stderr}")
                # Don't raise, continue anyway

            self.log_info("Containerlar temizlendi")
            self.log("✅ Containerlar temizlendi")
        except Exception as e:
            self.log_error(f"Container temizleme hatası: {str(e)}", e)
            self.log(f"⚠️ Container temizleme uyarısı: {str(e)}")

    def fix_docker_credentials(self):
        """Docker credential helper sorununu çöz"""
        try:
            # Docker config dosyasının yolunu bul
            home_dir = os.path.expanduser("~")
            docker_config_dir = os.path.join(home_dir, '.docker')
            config_file = os.path.join(docker_config_dir, 'config.json')

            # Docker config dizinini oluştur
            os.makedirs(docker_config_dir, exist_ok=True)

            # Mevcut config'i oku veya boş dict oluştur
            config = {}
            if os.path.exists(config_file):
                try:
                    with open(config_file, 'r') as f:
                        config = json.load(f)
                except:
                    config = {}

            # Credential helper'ı geçici olarak kaldır
            if 'credsStore' in config:
                config.pop('credsStore')
            if 'credHelpers' in config:
                config.pop('credHelpers')

            # Config'i kaydet
            with open(config_file, 'w') as f:
                json.dump(config, f, indent=2)

            self.log_info("Docker credential helper ayarı düzeltildi")

        except Exception as e:
            self.log_error(f"Docker credential fix hatası: {str(e)}")

    def start_services(self):
        """Docker servislerini build et ve başlat"""
        try:
            # Docker credential sorununu çöz
            self.fix_docker_credentials()

            # Find Docker Compose command
            compose_cmd = self.find_docker_compose_command()
            if not compose_cmd:
                error_msg = "Docker Compose komutu bulunamadı! Docker Desktop kurulu ve çalışır durumda olduğundan emin olun."
                self.log_error(error_msg)
                raise Exception(error_msg)

            # Build images
            self.log_info("Docker images build ediliyor...")
            self.log("🔨 Docker images build ediliyor...")
            build_result = subprocess.run([compose_cmd, 'build', '--no-cache'],
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
            start_result = subprocess.run([compose_cmd, 'up', '-d'],
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
ACCESS_TOKEN_EXPIRE_MINUTES=525600

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
echo 🚀 TradeBot baslatiliyor...
cd /d "{self.install_path}"

:: Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ⚠️ Docker çalışmıyor, Docker Desktop başlatılıyor...
    start /wait "" "C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe"
    timeout /t 10 /nobreak >nul

    :: Check again after starting
    docker info >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker Desktop başlatılamadı!
        echo Lütfen Docker Desktop'ı manuel olarak açın ve tekrar deneyin.
        pause
        exit /b 1
    )
    echo ✅ Docker Desktop başlatıldı!
) else (
    echo ✅ Docker servisi çalışıyor!
)

echo.
echo 🔨 TradeBot servisleri başlatılıyor...
docker-compose up -d

if errorlevel 1 (
    echo.
    echo ❌ TradeBot başlatılırken hata oluştu!
    echo 🔍 Hata detayları için: docker-compose logs
    pause
    exit /b 1
)

echo.
echo 🎉 TradeBot başarıyla başlatıldı!
echo.
echo 📊 Erişim Linkleri:
echo    Frontend:    http://localhost:{self.config['frontend_port']}
echo    Backend API: http://localhost:{self.config['backend_port']}
echo    pgAdmin:     http://localhost:{self.config['pgadmin_port']}
echo.
echo ⏳ Servislerin tam olarak hazır olması 30-60 saniye sürebilir...
echo 🌐 Tarayıcı otomatik olarak açılacak...
timeout /t 5 /nobreak >nul
start http://localhost:{self.config['frontend_port']}
echo.
echo ✅ TradeBot hazır!
echo 💡 Durdurma için: stop_tradebot.bat komutunu kullanın
pause
"""
        else:
            return f"""#!/bin/bash

echo "🚀 TradeBot başlatılıyor..."

# Change to script directory
SCRIPT_DIR="$(cd "$(dirname "${{BASH_SOURCE[0]}}")" && pwd)"
cd "$SCRIPT_DIR"

# Function to check if Docker is running
check_docker() {{
    if docker info >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}}

# Function to start Docker Desktop on macOS
start_docker_macos() {{
    echo "⚠️  Docker çalışmıyor, Docker Desktop başlatılıyor..."
    open -a Docker

    echo "⏳ Docker Desktop'ın başlaması bekleniyor..."
    local max_wait=60
    local wait_time=0

    while [ $wait_time -lt $max_wait ]; do
        sleep 5
        wait_time=$((wait_time + 5))

        if check_docker; then
            echo "✅ Docker Desktop başarıyla başlatıldı!"
            return 0
        fi

        echo "⏳ Docker başlatılıyor... (${{wait_time}}/${{max_wait}}s)"
    done

    echo "❌ Docker Desktop belirtilen sürede başlatılamadı!"
    echo "Lütfen Docker Desktop'ı manuel olarak açın ve tekrar deneyin."
    return 1
}}

# Check if Docker is running
if ! check_docker; then
    echo "⚠️  Docker servisi çalışmıyor..."

    # Detect platform and try to start Docker
    case "$(uname -s)" in
        Darwin*)
            if ! start_docker_macos; then
                exit 1
            fi
            ;;
        Linux*)
            echo "Linux sistemde Docker servisini başlatmak için sudo gerekebilir..."
            sudo systemctl start docker
            sleep 3
            if ! check_docker; then
                echo "❌ Docker servisi başlatılamadı!"
                echo "Lütfen 'sudo systemctl start docker' komutunu çalıştırın."
                exit 1
            fi
            echo "✅ Docker servisi başlatıldı!"
            ;;
        *)
            echo "❌ Desteklenmeyen platform. Lütfen Docker'ı manuel olarak başlatın."
            exit 1
            ;;
    esac
else
    echo "✅ Docker servisi çalışıyor!"
fi

# Start TradeBot services
echo ""
echo "🔨 TradeBot servisleri başlatılıyor..."
docker-compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 TradeBot başarıyla başlatıldı!"
    echo ""
    echo "📊 Erişim Linkleri:"
    echo "   Frontend:    http://localhost:{self.config['frontend_port']}"
    echo "   Backend API: http://localhost:{self.config['backend_port']}"
    echo "   pgAdmin:     http://localhost:{self.config['pgadmin_port']}"
    echo ""
    echo "⏳ Servislerin tam olarak hazır olması 30-60 saniye sürebilir..."
    echo "🌐 Tarayıcı otomatik olarak açılacak..."

    sleep 3

    # Open in default browser
    if command -v open > /dev/null; then
        open "http://localhost:{self.config['frontend_port']}" &
    elif command -v xdg-open > /dev/null; then
        xdg-open "http://localhost:{self.config['frontend_port']}" &
    fi

    echo ""
    echo "✅ TradeBot hazır!"
    echo "💡 Durdurma için: ./stop_tradebot.sh komutunu kullanın"
else
    echo ""
    echo "❌ TradeBot başlatılırken hata oluştu!"
    echo "🔍 Hata detayları için: docker-compose logs"
    exit 1
fi
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
            import winshell  # type: ignore[reportMissingImports]
            from win32com.client import Dispatch  # type: ignore[reportMissingImports]

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
    <key>CFBundleVersion</key>
    <string>2.0</string>
    <key>LSMinimumSystemVersion</key>
    <string>10.14</string>
    <key>LSUIElement</key>
    <false/>
</dict>
</plist>
"""
        with open(os.path.join(contents_path, "Info.plist"), "w") as f:
            f.write(plist_content)

        # Enhanced executable script with Docker auto-start (no f-string to avoid brace issues)
        exec_content = """#!/bin/bash

# Ensure common binary paths are available when launched from Finder
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$PATH"

# Resolve docker binary in common locations
resolve_docker_cmd() {
    local candidates=(/usr/local/bin/docker /opt/homebrew/bin/docker /Applications/Docker.app/Contents/Resources/bin/docker /usr/bin/docker docker)
    for p in "${candidates[@]}"; do
        if "$p" --version >/dev/null 2>&1; then
            echo "$p"
            return 0
        fi
    done
    return 1
}

DOCKER_CMD="$(resolve_docker_cmd)"

# Function to check if Docker is running
check_docker() {
    if [ -z "$DOCKER_CMD" ]; then
        DOCKER_CMD="$(resolve_docker_cmd)"
    fi
    if [ -n "$DOCKER_CMD" ] && "$DOCKER_CMD" info >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to start Docker Desktop
start_docker_desktop() {
    echo "Docker çalışmıyor, Docker Desktop başlatılıyor..."
    open -a Docker

    # Wait for Docker to start (up to 120s)
    local max_wait=120
    local wait_time=0

    while [ $wait_time -lt $max_wait ]; do
        sleep 5
        wait_time=$((wait_time + 5))

        # Re-resolve docker after Docker Desktop starts
        if [ -z "$DOCKER_CMD" ]; then
            DOCKER_CMD="$(resolve_docker_cmd)"
        fi

        if check_docker; then
            echo "Docker Desktop başarıyla başlatıldı!"
            return 0
        fi

        echo "Docker başlatılıyor... (${wait_time}/${max_wait}s)"
    done

    # Show dialog if Docker didn't start
    osascript -e "display dialog \"Docker Desktop başlatılamadı. Lütfen Docker Desktop'ı manuel olarak açın ve tekrar deneyin.\" buttons {\"Tamam\"} default button \"Tamam\" with icon caution"
    return 1
}

# Check if Docker is running
if ! check_docker; then
    if ! start_docker_desktop; then
        exit 1
    fi
fi

# Change to TradeBot directory and run startup script
cd "__INSTALL_PATH__"

# Check if start script exists
if [ ! -f "./start_tradebot.sh" ]; then
    osascript -e "display dialog \"TradeBot başlatma script'i bulunamadı. Lütfen kurulumu kontrol edin.\" buttons {\"Tamam\"} default button \"Tamam\" with icon stop"
    exit 1
fi

# Make sure script is executable
chmod +x "./start_tradebot.sh"

# Run the startup script in Terminal
osascript -e 'tell application "Terminal" to do script "cd \"__INSTALL_PATH__\" && ./start_tradebot.sh"'
"""
        exec_content = exec_content.replace("__INSTALL_PATH__", self.install_path)
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

                if platform.system() == "Darwin":  # macOS
                    # macOS'ta Docker Desktop'ı restart et
                    self.log("🍎 macOS Docker Desktop restart ediliyor...")

                    # First try to quit Docker Desktop
                    quit_result = subprocess.run(['osascript', '-e', 'quit app "Docker"'],
                                                capture_output=True, text=True)
                    if quit_result.returncode == 0:
                        self.log("Docker Desktop kapatıldı...")
                        import time
                        time.sleep(5)  # Wait a bit

                    # Start Docker Desktop again
                    start_result = subprocess.run(['open', '-a', 'Docker'],
                                                capture_output=True, text=True)
                    if start_result.returncode != 0:
                        self.log_error(f"Docker Desktop başlatılamadı: {start_result.stderr}")
                        self.log(f"❌ Docker Desktop başlatılamadı: {start_result.stderr}")
                        messagebox.showerror("Hata", f"Docker Desktop başlatılamadı: {start_result.stderr}")
                        return

                    # Wait for Docker to be ready
                    self.log("⏳ Docker Desktop'ın hazır olması bekleniyor...")
                    max_wait = 60
                    wait_time = 0

                    while wait_time < max_wait:
                        time.sleep(5)
                        wait_time += 5

                        check_result = subprocess.run(['docker', 'info'], capture_output=True, text=True)
                        if check_result.returncode == 0:
                            self.log_info("Docker Desktop başarıyla restart edildi!")
                            self.log("✅ Docker Desktop başarıyla restart edildi!")
                            messagebox.showinfo("Başarılı", "Docker Desktop restart edildi!")
                            return

                        self.log(f"⏳ Docker başlatılıyor... ({wait_time}/{max_wait}s)")

                    self.log_error("Docker Desktop belirtilen sürede hazır olmadı")
                    self.log("⚠️ Docker Desktop belirtilen sürede hazır olmadı")
                    messagebox.showwarning("Uyarı", "Docker Desktop belirtilen sürede hazır olmadı. Manuel kontrol edin.")

                elif platform.system() == "Linux":
                    # Linux systemctl restart
                    restart_result = subprocess.run(['sudo', 'systemctl', 'restart', 'docker'],
                                                    capture_output=True, text=True)
                    if restart_result.returncode != 0:
                        self.log_error(f"Docker restart hatası: {restart_result.stderr}")
                        self.log(f"❌ Docker restart hatası: {restart_result.stderr}")
                        messagebox.showerror("Hata", f"Docker restart hatası: {restart_result.stderr}")
                        return

                    self.log_info("Docker servisi başarıyla restart edildi!")
                    self.log("✅ Docker servisi başarıyla restart edildi!")
                    messagebox.showinfo("Başarılı", "Docker servisi restart edildi!")

                elif platform.system() == "Windows":
                    # Windows Docker Desktop restart
                    self.log("🪟 Windows Docker Desktop restart ediliyor...")
                    restart_result = subprocess.run(['powershell', '-Command',
                                                   'Stop-Process -Name "Docker Desktop" -Force; Start-Sleep 5; Start-Process "Docker Desktop"'],
                                                   capture_output=True, text=True)
                    if restart_result.returncode != 0:
                        self.log_error(f"Docker Desktop restart hatası: {restart_result.stderr}")
                        self.log(f"❌ Docker Desktop restart hatası: {restart_result.stderr}")
                        messagebox.showerror("Hata", f"Docker Desktop restart hatası: {restart_result.stderr}")
                        return

                    self.log_info("Docker Desktop restart edildi!")
                    self.log("✅ Docker Desktop restart edildi!")
                    messagebox.showinfo("Başarılı", "Docker Desktop restart edildi!")

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
    print("[DEBUG] main() function started")
    root = tk.Tk()
    print("[DEBUG] tk.Tk() created")
    try:
        app = TradeBotInstaller(root)
        print("[DEBUG] TradeBotInstaller instance created")
    except Exception as e:
        print(f"[FATAL ERROR] Could not create TradeBotInstaller instance: {e}")
        import traceback
        traceback.print_exc()
        root.destroy()
        return

    root.mainloop()
    print("DEBUG: mainloop finished.")


if __name__ == "__main__":
    print("[DEBUG] Script starting via __main__")
    main()
