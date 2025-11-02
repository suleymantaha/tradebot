#!/bin/bash

# ========================================
# TradeBot Otomatik Kurulum Script'i
# ========================================
# Version: 2.0
# Bu script TradeBot'u tek komutla kurar ve çalıştırır

set -e  # Hata durumunda script'i durdur

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fancy banner
print_banner() {
    echo -e "${PURPLE}"
    echo "████████╗██████╗  █████╗ ██████╗ ███████╗██████╗  ██████╗ ████████╗"
    echo "╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██╔════╝██╔══██╗██╔═══██╗╚══██╔══╝"
    echo "   ██║   ██████╔╝███████║██║  ██║█████╗  ██████╔╝██║   ██║   ██║   "
    echo "   ██║   ██╔══██╗██╔══██║██║  ██║██╔══╝  ██╔══██╗██║   ██║   ██║   "
    echo "   ██║   ██║  ██║██║  ██║██████╔╝███████╗██████╔╝╚██████╔╝   ██║   "
    echo "   ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝╚═════╝  ╚═════╝    ╚═╝   "
    echo -e "${NC}"
    echo -e "${CYAN}🚀 Professional Trading Bot - Kurulum Script'i v2.0${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Print status messages
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_step() {
    echo ""
    echo -e "${PURPLE}🔹 $1${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_requirements() {
    print_step "Sistem Gereksinimlerini Kontrol Ediliyor"

    local missing_requirements=()

    # Check Docker
    if ! command_exists docker; then
        missing_requirements+=("Docker")
    else
        print_success "Docker kurulu ✓"
    fi

    # Check Docker Compose
    if ! command_exists docker-compose && ! docker compose version >/dev/null 2>&1; then
        missing_requirements+=("Docker Compose")
    else
        print_success "Docker Compose kurulu ✓"
    fi

    # Check curl
    if ! command_exists curl; then
        missing_requirements+=("curl")
    else
        print_success "curl kurulu ✓"
    fi

    # Check git
    if ! command_exists git; then
        missing_requirements+=("git")
    else
        print_success "git kurulu ✓"
    fi

    # If any requirements are missing, show install instructions
    if [ ${#missing_requirements[@]} -ne 0 ]; then
        print_error "Eksik gereksinimler bulundu: ${missing_requirements[*]}"
        echo ""
        print_status "Kurulum talimatları:"
        echo ""
        echo "🐧 Ubuntu/Debian için:"
        echo "  sudo apt update"
        echo "  sudo apt install -y docker.io docker-compose curl git"
        echo "  sudo systemctl start docker"
        echo "  sudo systemctl enable docker"
        echo "  sudo usermod -aG docker \$USER"
        echo ""
        echo "🎩 Arch Linux için:"
        echo "  sudo pacman -S docker docker-compose curl git"
        echo "  sudo systemctl start docker"
        echo "  sudo systemctl enable docker"
        echo "  sudo usermod -aG docker \$USER"
        echo ""
        echo "🍎 macOS için:"
        echo "  brew install docker docker-compose curl git"
        echo ""
        print_warning "Gereksinimler kurulduktan sonra terminal'i yeniden başlatın ve script'i tekrar çalıştırın."
        exit 1
    fi

    print_success "Tüm gereksinimler karşılanıyor!"
}

# Generate FERNET_KEY
generate_fernet_key() {
    print_step "Encryption Anahtarı Oluşturuluyor"

    if command_exists python3; then
        FERNET_KEY=$(python3 -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())" 2>/dev/null)
        if [ $? -eq 0 ] && [ ! -z "$FERNET_KEY" ]; then
            print_success "FERNET_KEY başarıyla oluşturuldu"
            return 0
        fi
    fi

    # Fallback: Use openssl
    if command_exists openssl; then
        FERNET_KEY=$(openssl rand -base64 32)
        print_success "FERNET_KEY openssl ile oluşturuldu"
        return 0
    fi

    # Last resort: Use /dev/urandom
    FERNET_KEY=$(head -c 32 /dev/urandom | base64)
    print_warning "FERNET_KEY urandom ile oluşturuldu (güvenlik için python3 önerilir)"
}

# Setup environment file
setup_environment() {
    print_step "Environment Dosyası Hazırlanıyor"

    if [ -f .env ]; then
        print_warning ".env dosyası zaten mevcut"
        read -p "Mevcut .env dosyasını yedekleyip yenisini oluşturmak istiyor musunuz? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
            print_status "Mevcut .env dosyası yedeklendi"
        else
            print_status "Mevcut .env dosyası korunuyor"
            return 0
        fi
    fi

    # Copy example file
    cp env.example .env

    # Generate FERNET_KEY
    generate_fernet_key

    # Update .env file with generated FERNET_KEY
    if [ ! -z "$FERNET_KEY" ]; then
        sed -i "s/FERNET_KEY=/FERNET_KEY=$FERNET_KEY/" .env
        print_success "FERNET_KEY .env dosyasına eklendi"
    fi

    # Generate random SECRET_KEY
    SECRET_KEY=$(openssl rand -hex 32)
    sed -i "s/SECRET_KEY=super_secret_key_change_in_production_12345/SECRET_KEY=$SECRET_KEY/" .env
    print_success "SECRET_KEY oluşturuldu ve .env dosyasına eklendi"

    # Generate random PostgreSQL password
    POSTGRES_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-16)
    sed -i "s/POSTGRES_PASSWORD=tradebot_secure_pass_123/POSTGRES_PASSWORD=$POSTGRES_PASSWORD/" .env
    print_success "PostgreSQL şifresi oluşturuldu"

    # Generate random pgAdmin password
    PGADMIN_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-12)
    sed -i "s/PGADMIN_DEFAULT_PASSWORD=admin123/PGADMIN_DEFAULT_PASSWORD=$PGADMIN_PASSWORD/" .env
    print_success "pgAdmin şifresi oluşturuldu"

    # Generate random Redis password and update URLs
    REDIS_PASSWORD=$(openssl rand -base64 24 | tr -d "=+/" | cut -c1-24)
    sed -i "s/^REDIS_PASSWORD=.*/REDIS_PASSWORD=$REDIS_PASSWORD/" .env
    sed -i "s|^REDIS_URL=.*|REDIS_URL=redis://:$REDIS_PASSWORD@redis:6379/0|" .env
    sed -i "s|^CELERY_BROKER_URL=.*|CELERY_BROKER_URL=redis://:$REDIS_PASSWORD@redis:6379/0|" .env
    sed -i "s|^CELERY_RESULT_BACKEND=.*|CELERY_RESULT_BACKEND=redis://:$REDIS_PASSWORD@redis:6379/0|" .env
    print_success "Redis şifresi ve URL'ler güncellendi"

    # Update DATABASE_URL with new password
    sed -i "s|\${POSTGRES_PASSWORD}|$POSTGRES_PASSWORD|g" .env

    # Enforce strong JWT settings
    sed -i "s/^ALGORITHM=.*/ALGORITHM=HS512/" .env
    sed -i "s/^ACCESS_TOKEN_EXPIRE_MINUTES=.*/ACCESS_TOKEN_EXPIRE_MINUTES=10080/" .env
    print_success "Environment dosyası hazırlandı"
}

# Create necessary directories
setup_directories() {
    print_step "Gerekli Klasörler Oluşturuluyor"

    directories=("logs" "cache" "cache/data" "nginx" "nginx/ssl")

    for dir in "${directories[@]}"; do
        if [ ! -d "$dir" ]; then
            mkdir -p "$dir"
            print_status "Klasör oluşturuldu: $dir"
        fi
    done

    # Set permissions
    chmod 755 logs cache
    print_success "Klasörler hazırlandı"
}

# Create nginx config for reverse proxy
setup_nginx() {
    print_step "Nginx Konfigürasyonu Hazırlanıyor"

    cat > nginx/nginx.conf << 'EOF'
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
EOF

    print_success "Nginx konfigürasyonu oluşturuldu"
}

# Check Docker service
check_docker_service() {
    print_step "Docker Servisi Kontrol Ediliyor"

    if ! docker info >/dev/null 2>&1; then
        print_error "Docker servisi çalışmıyor"
        print_status "Docker'ı başlatmaya çalışıyor..."

        if command_exists systemctl; then
            sudo systemctl start docker
            sleep 3
            if docker info >/dev/null 2>&1; then
                print_success "Docker servisi başlatıldı"
            else
                print_error "Docker servisi başlatılamadı. Manuel olarak başlatmayı deneyin:"
                echo "  sudo systemctl start docker"
                exit 1
            fi
        else
            print_error "Docker servisini manuel olarak başlatın"
            exit 1
        fi
    else
        print_success "Docker servisi çalışıyor"
    fi
}

# Clean up existing containers
cleanup_containers() {
    print_step "Mevcut Container'lar Temizleniyor"

    # Stop and remove existing containers
    docker-compose down --remove-orphans >/dev/null 2>&1 || true

    # Remove dangling images
    docker image prune -f >/dev/null 2>&1 || true

    print_success "Container'lar temizlendi"
}

# Build and start services
start_services() {
    print_step "Servisler Başlatılıyor"

    print_status "Docker images build ediliyor... (Bu işlem birkaç dakika sürebilir)"
    docker-compose build --no-cache

    print_status "Servisler başlatılıyor..."
    docker-compose up -d

    print_success "Servisler başlatıldı!"
}

# Wait for services to be ready
wait_for_services() {
    print_step "Servisler Ayağa Kalkması Bekleniyor"

    local max_attempts=60
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if curl -sf http://localhost:8000/health >/dev/null 2>&1; then
            print_success "Backend servisi hazır!"
            break
        fi

        echo -n "."
        sleep 5
        attempt=$((attempt + 1))
    done

    if [ $attempt -gt $max_attempts ]; then
        print_error "Backend servisi belirtilen sürede başlamadı"
        print_status "Logları kontrol edin: docker-compose logs backend"
        exit 1
    fi

    # Check frontend
    sleep 5
    if curl -sf http://localhost:3000 >/dev/null 2>&1; then
        print_success "Frontend servisi hazır!"
    else
        print_warning "Frontend servisi henüz hazır değil, ancak devam edebilirsiniz"
    fi
}

# Show final information
show_final_info() {
    echo ""
    echo -e "${GREEN}🎉 TradeBot Başarıyla Kuruldu! 🎉${NC}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${CYAN}📋 ERİŞİM BİLGİLERİ:${NC}"
    echo -e "   🌐 Frontend (Ana Sayfa): ${GREEN}http://localhost:3000${NC}"
    echo -e "   🔧 Backend API:          ${GREEN}http://localhost:8000${NC}"
    echo -e "   📚 API Docs:             ${GREEN}http://localhost:8000/docs${NC}"
    echo ""
    echo -e "${CYAN}🔧 GELIŞTIRME ARAÇLARI:${NC}"
    echo -e "   🗃️  pgAdmin (Veritabanı):  ${GREEN}http://localhost:5050${NC}"
    echo -e "   📧 pgAdmin Email:         ${YELLOW}$(grep PGADMIN_DEFAULT_EMAIL .env | cut -d= -f2)${NC}"
    echo -e "   🔐 pgAdmin Şifre:         ${YELLOW}$(grep PGADMIN_DEFAULT_PASSWORD .env | cut -d= -f2)${NC}"
    echo ""
    echo -e "${CYAN}🗄️  POSTGRESQL BAĞLANTI BİLGİLERİ:${NC}"
    echo -e "   🏠 Host:                 ${YELLOW}localhost${NC} (host.docker.internal)"
    echo -e "   🚪 Port:                 ${YELLOW}5432${NC}"
    echo -e "   🗂️  Database:             ${YELLOW}tradebot_db${NC}"
    echo -e "   👤 Username:             ${YELLOW}tradebot_user${NC}"
    echo -e "   🔐 Password:             ${YELLOW}$(grep POSTGRES_PASSWORD .env | cut -d= -f2)${NC}"
    echo ""
    echo -e "${CYAN}🚀 SONRAKİ ADIMLAR:${NC}"
    echo -e "   1️⃣  Tarayıcınızda ${GREEN}http://localhost:3000${NC} adresine gidin"
    echo -e "   2️⃣  Hesap oluşturun veya giriş yapın"
    echo -e "   3️⃣  Dashboard'da Binance API anahtarınızı ekleyin"
    echo -e "   4️⃣  İlk trading botunuzu oluşturun!"
    echo ""
    echo -e "${CYAN}🛠️  FAYDALII KOMUTLAR:${NC}"
    echo -e "   📊 Logları görmek için:        ${YELLOW}docker-compose logs -f${NC}"
    echo -e "   ⏹️  Servisleri durdurmak için:  ${YELLOW}docker-compose down${NC}"
    echo -e "   🔄 Servisleri yeniden başlatmak: ${YELLOW}docker-compose restart${NC}"
    echo -e "   🗑️  Tümünü temizlemek için:     ${YELLOW}docker-compose down -v${NC}"
    echo -e "   💾 pgAdmin başlatmak için:     ${YELLOW}docker-compose --profile development up -d pgadmin${NC}"
    echo ""
    echo -e "${PURPLE}🔗 YARDIM VE DESTEK:${NC}"
    echo -e "   📖 README.md dosyasını okuyun"
    echo -e "   🐛 Sorun bildirimi için GitHub Issues kullanın"
    echo -e "   📋 .env dosyasında tüm şifreler ve ayarlar bulunur"
    echo ""
    echo -e "${GREEN}İyi Trading'ler! 💰📈${NC}"
    echo ""
}

# Main installation process
main() {
    print_banner

    check_requirements
    check_docker_service
    setup_environment
    setup_directories
    setup_nginx
    cleanup_containers
    start_services
    wait_for_services
    show_final_info
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${RED}Kurulum iptal edildi${NC}"; exit 1' INT

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    print_warning "Bu script'i root olarak çalıştırmanız önerilmez"
    read -p "Devam etmek istiyor musunuz? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Run main function
main
