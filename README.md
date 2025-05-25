# 🚀 TradeBot - Advanced Trading Platform

A sophisticated trading bot platform with backtesting capabilities, built with modern technologies for cryptocurrency trading automation.

![TradeBot](https://img.shields.io/badge/TradeBot-v1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Docker](https://img.shields.io/badge/docker-enabled-blue.svg)
![Python](https://img.shields.io/badge/python-3.13-blue.svg)
![React](https://img.shields.io/badge/react-18-blue.svg)

## ✨ Features

### 🤖 Trading Automation
- **Multiple Strategy Support**: EMA Cross, RSI, MACD, Bollinger Bands
- **Risk Management**: Stop loss, take profit, trailing stops
- **Position Management**: Configurable position sizing and capital management
- **Real-time Monitoring**: Live bot status and performance tracking

### 📊 Advanced Backtesting
- **Historical Data Analysis**: Test strategies on past market data
- **Technical Indicators**: 20+ built-in indicators
- **Performance Metrics**: Detailed profit/loss analysis
- **Smart Caching**: Efficient data storage and retrieval
- **Test Mode**: Works without API keys using sample data

### 🔐 Security & User Management
- **JWT Authentication**: Secure user sessions
- **Password Reset**: Email-based password recovery
- **API Key Encryption**: Secure storage of exchange credentials
- **Role-based Access**: User isolation and data protection

### 🎨 Modern UI/UX
- **Responsive Design**: Works on desktop and mobile
- **Dark/Light Mode**: Customizable theme preferences
- **Real-time Updates**: Live data and notifications
- **Intuitive Interface**: User-friendly design

## 🛠 Tech Stack

### Backend
- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: ORM with async support
- **PostgreSQL**: Robust relational database
- **Redis**: Caching and session storage
- **Alembic**: Database migrations
- **Celery**: Background task processing

### Frontend
- **React 18**: Modern UI library
- **Vite**: Fast build tool
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Client-side routing
- **Zustand**: Lightweight state management

### Infrastructure
- **Docker**: Containerization
- **Docker Compose**: Multi-container orchestration
- **Nginx**: Production web server
- **Health Checks**: Service monitoring

## 🚀 Quick Start

### Prerequisites
- **Docker** (20.10+)
- **Docker Compose** (2.0+)
- **8GB RAM** (recommended)
- **10GB Free Disk Space**

### One-Command Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tradebot.git
cd tradebot

# Run the installation script
chmod +x install.sh
./install.sh
```

That's it! The installation script will:
- ✅ Check system requirements
- ✅ Set up environment configuration
- ✅ Build Docker images
- ✅ Start all services
- ✅ Run database migrations
- ✅ Perform health checks

### Manual Installation

If you prefer manual setup:

```bash
# 1. Copy environment template
cp env.example .env

# 2. Edit configuration (optional)
nano .env

# 3. Create necessary directories
mkdir -p cache logs
chmod 755 cache logs

# 4. Build and start services
docker compose up -d

# 5. Check service health
docker compose logs -f
```

## 🌐 Access the Application

After successful installation:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: localhost:5432
- **Redis**: localhost:6379

## ⚙️ Configuration

### Environment Variables

Edit the `.env` file to customize your installation:

```bash
# Database
POSTGRES_PASSWORD=your_secure_password

# Security (IMPORTANT: Change in production!)
SECRET_KEY=your_super_secret_key_change_this

# Binance API (Optional - leave empty for test mode)
BINANCE_API_KEY=your_binance_api_key
BINANCE_SECRET_KEY=your_binance_secret_key

# Application
ENVIRONMENT=production
```

### API Keys Setup

1. **For Testing**: Leave API keys empty - the system will use sample data
2. **For Live Trading**:
   - Get Binance API keys from [Binance API Management](https://www.binance.com/en/my/settings/api-management)
   - Add them to your `.env` file
   - Restart the application: `docker compose restart`

## 📖 Usage Guide

### 1. User Registration
- Visit http://localhost:3000
- Click "Register" and create your account
- Verify your email (development mode shows link in console)

### 2. API Keys Management
- Go to "API Keys" section
- Add your Binance API credentials
- Test the connection

### 3. Create Trading Bots
- Navigate to "Bots" section
- Click "Create New Bot"
- Configure strategy parameters
- Set risk management rules
- Activate the bot

### 4. Backtesting
- Go to "Backtest" section
- Select trading pair and timeframe
- Configure strategy parameters
- Run historical analysis
- Review performance metrics

## 🔧 Development

### Local Development Setup

```bash
# Backend development
cd tradebot
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend development
cd frontend
npm install
npm run dev
```

### Database Migrations

```bash
# Create new migration
alembic revision -m "description" --autogenerate

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1
```

### Testing

```bash
# Run backend tests
pytest

# Run frontend tests
cd frontend && npm test

# Run integration tests
docker compose -f docker-compose.test.yml up --abort-on-container-exit
```

## 📊 Monitoring & Logs

### View Logs
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

### Health Checks
```bash
# Backend health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000/health

# Database health
docker compose exec postgres pg_isready -U tradebot_user
```

### Performance Monitoring
```bash
# Resource usage
docker stats

# Service status
docker compose ps
```

## 🛡️ Security

### Production Deployment

**Important security measures for production:**

1. **Change Default Passwords**
   ```bash
   # Generate secure passwords
   openssl rand -base64 32  # For SECRET_KEY
   openssl rand -base64 16  # For POSTGRES_PASSWORD
   ```

2. **Enable SSL/TLS**
   - Use reverse proxy (nginx/traefik)
   - Install SSL certificates
   - Force HTTPS redirects

3. **Network Security**
   - Close unnecessary ports
   - Use firewall rules
   - Enable fail2ban

4. **Database Security**
   - Restrict database access
   - Regular backups
   - Enable audit logging

### Backup & Recovery

```bash
# Database backup
docker compose exec postgres pg_dump -U tradebot_user tradebot_db > backup.sql

# Database restore
docker compose exec -T postgres psql -U tradebot_user tradebot_db < backup.sql

# Full system backup
docker compose down
tar -czf tradebot-backup.tar.gz .
```

## 🐛 Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Check which process is using the port
lsof -i :3000
lsof -i :8000

# Kill process or change ports in docker-compose.yml
```

#### Database Connection Issues
```bash
# Check database logs
docker compose logs postgres

# Reset database
docker compose down -v
docker compose up -d
```

#### Build Failures
```bash
# Clean rebuild
docker compose down
docker system prune -a
docker compose build --no-cache
docker compose up -d
```

#### Permission Issues
```bash
# Fix directory permissions
sudo chown -R $USER:$USER cache logs
chmod 755 cache logs
```

### Getting Help

- **GitHub Issues**: [Report bugs or request features](https://github.com/yourusername/tradebot/issues)
- **Documentation**: Check the `/docs` folder for detailed guides
- **Community**: Join our Discord/Telegram community

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Add tests for new functionality
5. Run the test suite: `npm test && pytest`
6. Commit your changes: `git commit -m 'Add amazing feature'`
7. Push to the branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

**Trading cryptocurrencies involves substantial risk and may result in significant financial losses. This software is provided for educational and research purposes only. The developers are not responsible for any financial losses incurred through the use of this platform. Always do your own research and never invest more than you can afford to lose.**

## 🙏 Acknowledgments

- [Binance API](https://binance-docs.github.io/apidocs/) for market data
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent web framework
- [React](https://reactjs.org/) for the frontend library
- [Docker](https://www.docker.com/) for containerization
- [PostgreSQL](https://www.postgresql.org/) for the database

---

**Happy Trading! 🚀📈**

Made with ❤️ by the TradeBot Team
