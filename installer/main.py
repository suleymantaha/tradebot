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
from pathlib import Path

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
        self.success_frame.pack(fill="both", expand=True, padx=20, pady=20)

        # Buttons frame
        button_frame = ttk.Frame(page)
        button_frame.pack(pady=20)

        ttk.Button(button_frame, text="Frontend Aç",
                  command=self.open_frontend).pack(side="left", padx=10)
        ttk.Button(button_frame, text="API Docs Aç",
                  command=self.open_api_docs).pack(side="left", padx=10)
        ttk.Button(button_frame, text="pgAdmin Aç",
                  command=self.open_pgadmin).pack(side="left", padx=10)

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
        """Kurulum işlemini çalıştır"""
        try:
            self.log("Kurulum başlatılıyor...")

            # Change to install directory
            os.chdir(self.install_path)

            # Create .env file
            self.log("Environment dosyası oluşturuluyor...")
            self.create_env_file()

            # Run installation steps
            steps = [
                ("Docker servis kontrolü", "sudo systemctl start docker || true"),
                ("Eski containerları temizle", "docker-compose down --remove-orphans || true"),
                ("Docker images build et", "docker-compose build --no-cache"),
                ("Servisleri başlat", "docker-compose up -d"),
                ("Servislerin hazır olmasını bekle", "sleep 30")
            ]

            for step_name, command in steps:
                self.log(f"{step_name}...")
                result = subprocess.run(command, shell=True, capture_output=True, text=True)
                if result.stdout:
                    self.log(result.stdout)
                if result.stderr:
                    self.log(result.stderr)

            self.log("✅ Kurulum başarıyla tamamlandı!")
            self.show_success_info()

        except Exception as e:
            self.log(f"❌ Hata: {str(e)}")
        finally:
            self.progress.stop()
            self.install_btn.config(state="normal")

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


def main():
    root = tk.Tk()
    app = TradeBotInstaller(root)
    root.mainloop()


if __name__ == "__main__":
    main()
