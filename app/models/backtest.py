from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db_base import Base

class Backtest(Base):
    __tablename__ = "backtests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True, nullable=False)

    # Backtest parameters
    symbol = Column(String, nullable=False)
    interval = Column(String, nullable=False)
    start_date = Column(String, nullable=False)
    end_date = Column(String, nullable=False)

    # Strategy parameters
    parameters = Column(JSON, nullable=False)

    # Results
    initial_capital = Column(Float, nullable=False)
    final_capital = Column(Float, nullable=False)
    total_return = Column(Float, nullable=False)
    total_trades = Column(Integer, nullable=False)
    winning_trades = Column(Integer, nullable=False)
    losing_trades = Column(Integer, nullable=False)
    win_rate = Column(Float, nullable=False)
    total_fees = Column(Float, nullable=False)
    avg_profit = Column(Float, nullable=False)

    # Detailed results (JSON)
    daily_results = Column(JSON, nullable=True)
    monthly_results = Column(JSON, nullable=True)

    # Metadata
    test_mode = Column(String, nullable=False, default="true")  # "true" or "false"
    market_type = Column(String, nullable=False, default="spot")  # 'spot' or 'futures'
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="backtests")
