import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional

class EmailService:
    def __init__(self):
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_username = os.getenv("SMTP_USERNAME", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.from_email = os.getenv("FROM_EMAIL", "noreply@tradebot.com")

        # Development mode - email'leri console'a yazdır
        self.development_mode = os.getenv("ENVIRONMENT", "development") == "development"

    def send_password_reset_email(self, to_email: str, reset_token: str, user_name: Optional[str] = None):
        """Şifre sıfırlama email'i gönder - SYNC function"""
        subject = "🔐 Şifre Sıfırlama Talebi - TradeBot"

        # Frontend URL'sini environment'dan al
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"

        # HTML email content
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                .container {{ max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; }}
                .header {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }}
                .content {{ padding: 30px; background: #f8f9fa; }}
                .button {{ display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🚀 TradeBot</h1>
                    <h2>Şifre Sıfırlama Talebi</h2>
                </div>
                <div class="content">
                    <p>Merhaba{f' {user_name}' if user_name else ''},</p>
                    <p>Hesabınız için şifre sıfırlama talebi aldık. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="{reset_url}" class="button">🔐 Şifreyi Sıfırla</a>
                    </div>

                    <p>Eğer buton çalışmıyorsa, aşağıdaki linki kopyalayıp tarayıcınıza yapıştırın:</p>
                    <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">
                        {reset_url}
                    </p>

                    <p><strong>⚠️ Güvenlik Uyarısı:</strong></p>
                    <ul>
                        <li>Bu link 1 saat içinde geçerliliğini yitirecektir</li>
                        <li>Bu talebi siz yapmadıysanız, bu email'i görmezden gelin</li>
                        <li>Şifrenizi kimseyle paylaşmayın</li>
                    </ul>
                </div>
                <div class="footer">
                    <p>Bu email otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
                    <p>© 2024 TradeBot. Tüm hakları saklıdır.</p>
                </div>
            </div>
        </body>
        </html>
        """

        if self.development_mode:
            # Development mode - console'a yazdır
            print("=" * 60)
            print("📧 PASSWORD RESET EMAIL (DEVELOPMENT MODE)")
            print("=" * 60)
            print(f"📧 To: {to_email}")
            print(f"📧 Subject: {subject}")
            print(f"🔗 Reset URL: {reset_url}")
            print(f"🔑 Token: {reset_token}")
            print("=" * 60)
            return True

        try:
            # Production mode - gerçek email gönder
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email

            # HTML part
            html_part = MIMEText(html_content, 'html', 'utf-8')
            msg.attach(html_part)

            # SMTP ile gönder
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.send_message(msg)
            server.quit()

            print(f"✅ Password reset email sent to {to_email}")
            return True

        except Exception as e:
            print(f"❌ Failed to send email: {e}")
            # Fallback to console mode
            print("=" * 60)
            print("📧 PASSWORD RESET EMAIL (FALLBACK MODE)")
            print("=" * 60)
            print(f"📧 To: {to_email}")
            print(f"🔗 Reset URL: {reset_url}")
            print("=" * 60)
            return True

# Global email service instance
email_service = EmailService()


def send_trade_notification(to_email: str, symbol: str, side: str, price: float, quantity: float, order_id: Optional[str] = None) -> bool:
    """Basit trade bildirimi gönderir (SYNC). Prod'da SMTP ile, dev'de console'a.

    Args:
        to_email: Alıcı e-postası
        symbol: İşlem sembolü
        side: BUY/SELL
        price: Fiyat
        quantity: Miktar
        order_id: Opsiyonel borsa emri id'si
    """
    try:
        subject = f"✅ Trade Gerçekleşti: {side} {symbol}"
        html_content = f"""
        <html>
            <body>
                <h2>Trade Bilgisi</h2>
                <ul>
                    <li><strong>Sembol:</strong> {symbol}</li>
                    <li><strong>Yön:</strong> {side}</li>
                    <li><strong>Fiyat:</strong> {price}</li>
                    <li><strong>Miktar:</strong> {quantity}</li>
                    <li><strong>Order ID:</strong> {order_id or '-'}
                </ul>
                <p>Zaman: {__import__('datetime').datetime.utcnow().isoformat()}Z</p>
            </body>
        </html>
        """

        if email_service.development_mode:
            print("=" * 60)
            print("📧 TRADE EMAIL (DEVELOPMENT MODE)")
            print("=" * 60)
            print(f"To: {to_email}")
            print(f"Subject: {subject}")
            print(html_content)
            print("=" * 60)
            return True

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = email_service.from_email
        msg['To'] = to_email
        msg.attach(MIMEText(html_content, 'html', 'utf-8'))

        server = smtplib.SMTP(email_service.smtp_server, email_service.smtp_port)
        server.starttls()
        server.login(email_service.smtp_username, email_service.smtp_password)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"❌ Failed to send trade email: {e}")
        return False
