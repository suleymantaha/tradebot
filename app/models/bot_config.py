from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, func
from sqlalchemy.orm import relationship
from app.database import Base

class BotConfig(Base):
    __tablename__ = "bot_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    name = Column(String, nullable=False)
    symbol = Column(String, nullable=False)
    timeframe = Column(String, nullable=False)
    is_active = Column(Boolean, default=False)
    initial_capital = Column(Numeric, nullable=True)
    daily_target_perc = Column(Numeric, nullable=True)
    max_daily_loss_perc = Column(Numeric, nullable=True)
    position_size_perc = Column(Numeric, nullable=True)
    position_size_fixed = Column(Numeric, nullable=True)
    stop_loss_perc = Column(Numeric, nullable=False)
    take_profit_perc = Column(Numeric, nullable=False)
    trailing_stop_perc = Column(Numeric, nullable=True)
    trailing_stop_active = Column(Boolean, default=False)
    ema_fast = Column(Integer, nullable=False)
    ema_slow = Column(Integer, nullable=False)
    rsi_period = Column(Integer, nullable=False)
    rsi_oversold = Column(Integer, nullable=False)
    rsi_overbought = Column(Integer, nullable=False)
    max_daily_trades = Column(Integer, nullable=True)
    check_interval_seconds = Column(Integer, default=60)
    api_key_id = Column(Integer, ForeignKey("api_keys.id"), nullable=True)
    strategy = Column(String, nullable=False, default="simple")
    ema_period = Column(Integer, nullable=True)

    # İleri seviye teknik indikatör parametreleri
    custom_ema_fast = Column(Integer, nullable=True, default=8)
    custom_ema_slow = Column(Integer, nullable=True, default=21)
    custom_rsi_period = Column(Integer, nullable=True, default=7)
    custom_rsi_oversold = Column(Integer, nullable=True, default=35)
    custom_rsi_overbought = Column(Integer, nullable=True, default=65)

    # İleri seviye risk yönetimi
    custom_stop_loss = Column(Numeric, nullable=True, default=0.5)
    custom_take_profit = Column(Numeric, nullable=True, default=1.5)
    custom_trailing_stop = Column(Numeric, nullable=True, default=0.3)

    # Pozisyon ve fon yönetimi
    position_type = Column(String, nullable=True, default="spot")  # "spot" veya "futures"
    transfer_amount = Column(Numeric, nullable=True)  # Belirli miktar, None ise tüm bakiye
    auto_transfer_funds = Column(Boolean, default=True)  # Otomatik fon transferi

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    owner = relationship("User", back_populates="bot_configs")
    state = relationship("BotState", back_populates="config", uselist=False, cascade="all, delete-orphan")
    trades = relationship("Trade", back_populates="bot", cascade="all, delete-orphan")
    api_key = relationship("ApiKey")
