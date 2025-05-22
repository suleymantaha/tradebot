from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Numeric, Text, func
from sqlalchemy.orm import relationship
from app.database import Base

class BotState(Base):
    __tablename__ = "bot_states"

    id = Column(Integer, ForeignKey("bot_configs.id"), primary_key=True)
    status = Column(String, default="stopped")
    in_position = Column(Boolean, default=False)
    entry_price = Column(Numeric, nullable=True)
    current_position_size_coins = Column(Numeric, nullable=True)
    trailing_stop_price = Column(Numeric, nullable=True)
    max_price_since_entry = Column(Numeric, nullable=True)
    take_profit_price = Column(Numeric, nullable=True)
    stop_loss_price = Column(Numeric, nullable=True)
    daily_pnl = Column(Numeric, default=0.0)
    daily_trades_count = Column(Integer, default=0)
    last_run_at = Column(DateTime, nullable=True)
    last_error_message = Column(Text, nullable=True)
    last_updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    config = relationship("BotConfig", back_populates="state", uselist=False)
