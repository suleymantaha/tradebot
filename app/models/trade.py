from sqlalchemy import Column, Integer, String, Numeric, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.db_base import Base

class Trade(Base):
    __tablename__ = "trades"

    id = Column(Integer, primary_key=True, index=True)
    bot_config_id = Column(Integer, ForeignKey("bot_configs.id"), index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)
    binance_order_id = Column(String, unique=True, nullable=True)
    symbol = Column(String, nullable=False)
    side = Column(String, nullable=False)
    order_type = Column(String, nullable=False)
    price = Column(Numeric, nullable=False)
    quantity_filled = Column(Numeric, nullable=False)
    quote_quantity_filled = Column(Numeric, nullable=False)
    commission_amount = Column(Numeric, nullable=True)
    commission_asset = Column(String, nullable=True)
    pnl = Column(Numeric, nullable=True)
    # Realized PnL (gerçekleşen kar/zarar)
    realized_pnl = Column(Numeric, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())

    bot = relationship("BotConfig", back_populates="trades")
    user = relationship("User", back_populates="trades")
