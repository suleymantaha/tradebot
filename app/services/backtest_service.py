import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from binance.client import Client as BinanceClient
from ta.trend import SMAIndicator, EMAIndicator, MACD
from ta.momentum import RSIIndicator
from ta.volatility import BollingerBands
from ta.utils import dropna
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import requests
import time
from fastapi import HTTPException
from sqlalchemy import desc
import json

from app.core.cache import DataCache
from app.models.api_key import ApiKey
from app.core.crypto import decrypt_value
from app.models.backtest import Backtest

class BacktestService:
    def __init__(self, user_id: Optional[int] = None, db_session: Optional[AsyncSession] = None):
        # Use absolute path for cache directory
        cache_dir = os.path.join(os.getcwd(), "cache", "data")
        self.cache = DataCache(cache_dir=cache_dir)
        self.user_id = user_id
        self.db_session = db_session

        # Initialize with no client (will be set up when needed)
        self.client = None
        self.test_mode = True

        print(f"🔧 BacktestService initialized with cache dir: {cache_dir}")

    async def setup_binance_client(self):
        """Setup Binance client using user's API keys from database"""
        if not self.user_id or not self.db_session:
            print("⚠️ No user or database session - Running in TEST MODE")
            self.test_mode = True
            return

        try:
            # Get user's API key from database
            result = await self.db_session.execute(
                select(ApiKey).where(ApiKey.user_id == self.user_id)
            )
            api_key_record = result.scalars().first()

            if not api_key_record:
                print("⚠️ No API key found for user - Running in TEST MODE")
                self.test_mode = True
                return

            # Decrypt API keys
            api_key_plain = decrypt_value(api_key_record.encrypted_api_key)
            secret_key_plain = decrypt_value(api_key_record.encrypted_secret_key)

            if api_key_plain and secret_key_plain:
                self.client = BinanceClient(api_key=api_key_plain, api_secret=secret_key_plain)
                self.test_mode = False
                print("✅ Binance API connected using user's keys")
            else:
                print("⚠️ Failed to decrypt API keys - Running in TEST MODE")
                self.test_mode = True

        except Exception as e:
            print(f"❌ Error setting up Binance client: {e}")
            print("⚠️ Falling back to TEST MODE")
            self.test_mode = True

    async def get_current_price(self, symbol: str) -> float:
        """Get current price for symbol (even in test mode for realistic base price)"""
        try:
            if self.client:
                # Get real current price from Binance
                ticker = self.client.get_symbol_ticker(symbol=symbol)
                current_price = float(ticker['price'])
                print(f"💰 Current {symbol} price: ${current_price}")
                return current_price
            else:
                # Try to get price without API key (public endpoint)
                url = f"https://api.binance.com/api/v3/ticker/price?symbol={symbol}"
                response = requests.get(url, timeout=5)
                if response.status_code == 200:
                    data = response.json()
                    current_price = float(data['price'])
                    print(f"💰 Current {symbol} price (public): ${current_price}")
                    return current_price

        except Exception as e:
            print(f"⚠️ Could not get current price for {symbol}: {e}")

        # Fallback to base prices if API fails
        fallback_prices = {
            'BNBUSDT': 300, 'BTCUSDT': 45000, 'ETHUSDT': 3000,
            'ADAUSDT': 0.5, 'DOTUSDT': 8, 'XRPUSDT': 0.6,
            'LTCUSDT': 100, 'BCHUSDT': 250, 'LINKUSDT': 15, 'XLMUSDT': 0.12
        }
        fallback_price = fallback_prices.get(symbol, 100)
        print(f"📊 Using fallback price for {symbol}: ${fallback_price}")
        return fallback_price

    async def generate_sample_data(self, symbol: str, interval: str, start_date: str, end_date: str) -> pd.DataFrame:
        """Generate sample data for testing when API keys are not available"""
        print(f"📊 Generating sample data for {symbol} {interval}")

        start_dt = datetime.strptime(start_date, "%Y-%m-%d")
        end_dt = datetime.strptime(end_date, "%Y-%m-%d")

        # Calculate number of candles based on interval
        interval_minutes = {
            '5m': 5, '15m': 15, '30m': 30,
            '1h': 60, '4h': 240, '1d': 1440
        }

        minutes = interval_minutes.get(interval, 15)
        total_minutes = int((end_dt - start_dt).total_seconds() / 60)
        num_candles = total_minutes // minutes

        # Generate realistic price data starting from current price
        np.random.seed(42)  # For reproducible results

        # Get current/realistic base price dynamically
        base_price = await self.get_current_price(symbol)
        print(f"🚀 Starting simulation from ${base_price} for {num_candles} candles")

        # Generate price series with trend and volatility
        timestamps = []
        prices = []
        volumes = []

        current_time = start_dt
        current_price = base_price

        for i in range(num_candles):
            # Add some trend and random walk
            trend = 0.0001 * np.sin(i * 0.01)  # Slight trending
            noise = np.random.normal(0, 0.02)  # 2% volatility
            price_change = trend + noise
            current_price *= (1 + price_change)

            # Generate OHLC
            volatility = abs(np.random.normal(0, 0.01))
            high = current_price * (1 + volatility)
            low = current_price * (1 - volatility)
            open_price = current_price + np.random.normal(0, 0.005) * current_price
            close_price = current_price

            # Ensure OHLC logic
            high = max(high, open_price, close_price)
            low = min(low, open_price, close_price)

            # Generate volume
            volume = np.random.uniform(1000, 10000)

            timestamps.append(current_time)
            prices.append([open_price, high, low, close_price, volume])

            # Increment time
            current_time += timedelta(minutes=minutes)

        # Create DataFrame
        df = pd.DataFrame(prices, columns=['open', 'high', 'low', 'close', 'volume'])
        df['timestamp'] = timestamps

        # Add additional columns to match Binance format
        df['close_time'] = df['timestamp'] + timedelta(minutes=minutes-1)
        df['quote_volume'] = df['volume'] * df['close']
        df['trades'] = np.random.randint(100, 1000, len(df))
        df['taker_base'] = df['volume'] * 0.6
        df['taker_quote'] = df['quote_volume'] * 0.6
        df['ignore'] = 0

        return df

    async def get_historical_data_public(self, symbol: str, interval: str, start_date: str, end_date: str) -> pd.DataFrame:
        """Get historical data using public Binance API (no auth required)"""
        try:
            print(f"📥 Downloading public data: {symbol} {interval} from {start_date} to {end_date}")

            start_time = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp() * 1000)
            end_time = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp() * 1000)

            all_klines = []
            current_time = start_time

            while current_time < end_time:
                # Public Binance API endpoint
                url = "https://api.binance.com/api/v3/klines"
                params = {
                    'symbol': symbol,
                    'interval': interval,
                    'startTime': current_time,
                    'limit': 1000
                }

                response = requests.get(url, params=params, timeout=10)
                if response.status_code != 200:
                    print(f"❌ API error: {response.status_code}")
                    break

                klines = response.json()
                if not klines:
                    break

                all_klines.extend(klines)
                current_time = klines[-1][0] + 1

                print(f"📊 Progress: {datetime.fromtimestamp(current_time/1000).strftime('%Y-%m-%d')} ({len(all_klines)} candles)")

                # Rate limiting
                time.sleep(0.1)  # 100ms delay

            if not all_klines:
                print("⚠️ No data received, falling back to sample data")
                return await self.generate_sample_data(symbol, interval, start_date, end_date)

            # Create DataFrame
            df = pd.DataFrame(all_klines, columns=[
                'timestamp', 'open', 'high', 'low', 'close', 'volume',
                'close_time', 'quote_volume', 'trades', 'taker_base', 'taker_quote', 'ignore'
            ])

            # Convert timestamp to datetime
            df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')

            # Convert numeric columns to float
            numeric_columns = ['open', 'high', 'low', 'close', 'volume']
            df[numeric_columns] = df[numeric_columns].astype(float)

            print(f"✅ Public data downloaded: {len(df)} rows")
            return df

        except Exception as e:
            print(f"❌ Error downloading public data: {e}")
            print("🔄 Falling back to sample data...")
            return await self.generate_sample_data(symbol, interval, start_date, end_date)

    async def get_historical_data(self, symbol: str = "BNBUSDT", interval: str = "15m",
                          start_date: str = None, end_date: str = None) -> pd.DataFrame:
        """Get historical data with caching"""

        # If no dates provided, use dynamic defaults
        if end_date is None:
            end_date = datetime.now().strftime("%Y-%m-%d")

        if start_date is None:
            # Default to 6 months ago
            start_dt = datetime.now() - timedelta(days=180)
            start_date = start_dt.strftime("%Y-%m-%d")

        print(f"📅 Using date range: {start_date} to {end_date}")

        # Check cache first
        cached_data = self.cache.get_cached_data(symbol, interval, start_date, end_date)
        if cached_data is not None:
            print(f"📦 Using cached data: {len(cached_data)} rows")
            return cached_data

        # Try public API first (no auth required)
        try:
            df = await self.get_historical_data_public(symbol, interval, start_date, end_date)
            # Cache the real data
            self.cache.cache_data(df, symbol, interval, start_date, end_date)
            return df
        except Exception as e:
            print(f"❌ Public API failed: {e}")

        # Setup Binance client if available
        if self.client is None and not self.test_mode:
            await self.setup_binance_client()

        # Try with authenticated client if available
        if not self.test_mode and self.client:
            try:
                print(f"📥 Using authenticated API: {symbol} {interval} from {start_date} to {end_date}")

                start_time = int(datetime.strptime(start_date, "%Y-%m-%d").timestamp() * 1000)
                end_time = int(datetime.strptime(end_date, "%Y-%m-%d").timestamp() * 1000)

                all_klines = []
                current_time = start_time

                while current_time < end_time:
                    klines = self.client.get_klines(
                        symbol=symbol,
                        interval=interval,
                        startTime=current_time,
                        limit=1000
                    )

                    if not klines:
                        break

                    all_klines.extend(klines)
                    current_time = klines[-1][0] + 1

                    print(f"📊 Progress: {datetime.fromtimestamp(current_time/1000).strftime('%Y-%m-%d')}")

                df = pd.DataFrame(all_klines, columns=[
                    'timestamp', 'open', 'high', 'low', 'close', 'volume',
                    'close_time', 'quote_volume', 'trades', 'taker_base', 'taker_quote', 'ignore'
                ])

                # Convert timestamp to datetime
                df['timestamp'] = pd.to_datetime(df['timestamp'], unit='ms')

                # Convert numeric columns to float
                numeric_columns = ['open', 'high', 'low', 'close', 'volume']
                df[numeric_columns] = df[numeric_columns].astype(float)

                # Cache the data
                self.cache.cache_data(df, symbol, interval, start_date, end_date)

                print(f"✅ Authenticated data downloaded: {len(df)} rows")
                return df

            except Exception as e:
                print(f"❌ Authenticated API failed: {e}")

        # Final fallback to sample data
        print("🔄 Using sample data as final fallback...")
        df = await self.generate_sample_data(symbol, interval, start_date, end_date)
        self.cache.cache_data(df, symbol, interval, start_date, end_date)
        return df

    def prepare_indicators(self, df: pd.DataFrame, ema_fast: int = 8, ema_slow: int = 21,
                          rsi_period: int = 7) -> pd.DataFrame:
        """Add technical indicators to DataFrame"""
        try:
            print(f"📊 Preparing indicators for {len(df)} rows")

            # Create a copy to avoid modifying original data
            df_indicators = df.copy()

            # EMA indicators
            df_indicators['EMA_fast'] = EMAIndicator(df_indicators['close'], ema_fast).ema_indicator()
            df_indicators['EMA_slow'] = EMAIndicator(df_indicators['close'], ema_slow).ema_indicator()

            # RSI
            df_indicators['RSI'] = RSIIndicator(df_indicators['close'], rsi_period).rsi()

            # MACD
            macd = MACD(df_indicators['close'])
            df_indicators['MACD'] = macd.macd_diff()

            # Bollinger Bands
            bb = BollingerBands(df_indicators['close'])
            df_indicators['BB_upper'] = bb.bollinger_hband()
            df_indicators['BB_middle'] = bb.bollinger_mavg()
            df_indicators['BB_lower'] = bb.bollinger_lband()

            # Volume analysis (check if volume exists and has non-zero values)
            if 'volume' in df_indicators.columns and df_indicators['volume'].sum() > 0:
                df_indicators['volume_ma'] = df_indicators['volume'].rolling(window=20).mean()
                df_indicators['volume_ratio'] = df_indicators['volume'] / df_indicators['volume_ma']
                # Fill division by zero or NaN with 1.0
                df_indicators['volume_ratio'] = df_indicators['volume_ratio'].fillna(1.0)
                df_indicators['volume_ratio'] = df_indicators['volume_ratio'].replace([np.inf, -np.inf], 1.0)
            else:
                df_indicators['volume_ma'] = 1000.0  # Default volume
                df_indicators['volume_ratio'] = 1.0

            # Volatility
            df_indicators['volatility'] = df_indicators['close'].pct_change().rolling(window=10).std()
            df_indicators['volatility_ma'] = df_indicators['volatility'].rolling(window=20).mean()

            # Trend strength
            df_indicators['trend_strength'] = abs(df_indicators['EMA_fast'] - df_indicators['EMA_slow']) / df_indicators['EMA_slow'] * 100

            # Fill any remaining NaN or inf values
            df_indicators = df_indicators.replace([np.inf, -np.inf], np.nan)

            # Fill NaN values with appropriate defaults
            numeric_columns = ['EMA_fast', 'EMA_slow', 'RSI', 'MACD', 'BB_upper', 'BB_middle', 'BB_lower',
                             'volume_ma', 'volume_ratio', 'volatility', 'volatility_ma', 'trend_strength']

            for col in numeric_columns:
                if col in df_indicators.columns:
                    # For price-based indicators, use the close price as fallback
                    if col.startswith(('EMA_', 'BB_')):
                        df_indicators[col] = df_indicators[col].fillna(df_indicators['close'])
                    # For RSI, use neutral value of 50
                    elif col == 'RSI':
                        df_indicators[col] = df_indicators[col].fillna(50.0)
                    # For others, use 0 or appropriate default
                    else:
                        default_value = 1.0 if col in ['volume_ratio'] else 0.0
                        df_indicators[col] = df_indicators[col].fillna(default_value)

            # Ensure we have minimum required rows after indicator calculation
            min_rows_needed = max(ema_slow, rsi_period, 20) + 10  # Add some buffer

            if len(df_indicators) < min_rows_needed:
                print(f"⚠️ Warning: Only {len(df_indicators)} rows available, minimum {min_rows_needed} recommended")

            # Drop rows where critical indicators are still NaN (typically the first few rows)
            critical_indicators = ['EMA_fast', 'EMA_slow', 'RSI']
            df_clean = df_indicators.dropna(subset=critical_indicators)

            print(f"✅ Indicators prepared: {len(df_clean)} clean rows from {len(df)} original rows")
            print(f"📈 Sample indicators - EMA_fast: {df_clean['EMA_fast'].iloc[-1]:.4f}, RSI: {df_clean['RSI'].iloc[-1]:.2f}")

            return df_clean

        except Exception as e:
            print(f"❌ Error preparing indicators: {e}")
            # Return DataFrame with basic columns to prevent crash
            print("🔧 Returning basic DataFrame to prevent crash")
            df_basic = df.copy()
            df_basic['EMA_fast'] = df_basic['close']
            df_basic['EMA_slow'] = df_basic['close']
            df_basic['RSI'] = 50.0
            df_basic['MACD'] = 0.0
            df_basic['BB_upper'] = df_basic['close'] * 1.02
            df_basic['BB_middle'] = df_basic['close']
            df_basic['BB_lower'] = df_basic['close'] * 0.98
            df_basic['volume_ma'] = 1000.0
            df_basic['volume_ratio'] = 1.0
            df_basic['volatility'] = 0.01
            df_basic['volatility_ma'] = 0.01
            df_basic['trend_strength'] = 0.1
            return df_basic

    def check_entry_signal(self, current: pd.Series, previous: pd.Series,
                          rsi_oversold: float = 35, rsi_overbought: float = 65) -> bool:
        """Check if entry conditions are met"""
        try:
            # Safety check for NaN values
            required_columns = ['close', 'EMA_fast', 'EMA_slow', 'RSI', 'MACD', 'BB_middle', 'BB_upper', 'BB_lower']
            for col in required_columns:
                if col not in current.index or col not in previous.index:
                    print(f"⚠️ Missing column {col} in signal check")
                    return False
                if pd.isna(current[col]) or pd.isna(previous[col]):
                    print(f"⚠️ NaN value in {col} - skipping signal")
                    return False

            # Trend analysis
            trend_up = current['close'] > current['EMA_fast'] > current['EMA_slow']
            trend_accelerating = (current['EMA_fast'] - current['EMA_slow']) > (previous['EMA_fast'] - previous['EMA_slow'])

            # RSI analysis
            rsi_signal = rsi_oversold <= current['RSI'] <= rsi_overbought
            rsi_rising = current['RSI'] > previous['RSI']

            # MACD analysis
            macd_positive = current['MACD'] > 0
            macd_rising = current['MACD'] > previous['MACD']

            # Bollinger Band analysis
            bb_signal = (current['close'] > current['BB_middle']) and (current['close'] < current['BB_upper'])
            bb_expanding = (current['BB_upper'] - current['BB_lower']) > (previous['BB_upper'] - previous['BB_lower'])

            # Volume analysis - with safety check
            volume_surge = False
            if 'volume_ratio' in current.index and not pd.isna(current['volume_ratio']):
                volume_surge = current['volume_ratio'] > 1.2

            # Momentum and trend strength
            momentum = current['close'] > previous['close'] * 1.0005  # 0.05% minimum increase

            # Trend strength with safety check
            strong_trend = False
            if 'trend_strength' in current.index and not pd.isna(current['trend_strength']):
                strong_trend = current['trend_strength'] > 0.2

            # Volatility control with safety check
            volatility_ok = True
            if ('volatility' in current.index and 'volatility_ma' in current.index and
                not pd.isna(current['volatility']) and not pd.isna(current['volatility_ma'])):
                volatility_ok = current['volatility'] < current['volatility_ma']

            # Primary signals (at least 3 required)
            primary_signals = sum([
                trend_up, rsi_signal, macd_positive, bb_signal, volume_surge
            ]) >= 3

            # Confirmation signals (at least 2 required)
            confirmation_signals = sum([
                trend_accelerating, rsi_rising, macd_rising, bb_expanding,
                momentum, strong_trend, volatility_ok
            ]) >= 2

            return primary_signals and confirmation_signals

        except Exception as e:
            print(f"❌ Error checking entry signal: {e}")
            return False

    def calculate_fees(self, position_size: float, is_entry: bool = True) -> float:
        """Calculate trading fees"""
        maker_fee = 0.0002  # 0.02% maker fee
        taker_fee = 0.0004  # 0.04% taker fee
        slippage = 0.0001   # 0.01% slippage

        if is_entry:
            commission = position_size * taker_fee
        else:
            commission = position_size * maker_fee

        slippage_cost = position_size * slippage
        return commission + slippage_cost

    async def run_backtest(self, symbol: str, interval: str, start_date: str, end_date: str,
                    parameters: Dict[str, Any]) -> Dict[str, Any]:
        """Run complete backtest"""
        try:
            print(f"🚀 Starting backtest for {symbol} {interval}")
            print(f"📅 Date range: {start_date} to {end_date}")
            if self.test_mode:
                print("🧪 Running in TEST MODE with sample data")

            # Get parameters
            initial_capital = parameters.get('initial_capital', 1000)
            daily_target = parameters.get('daily_target', 3.0)
            max_daily_loss = parameters.get('max_daily_loss', 1.0)
            stop_loss = parameters.get('stop_loss', 0.5)
            take_profit = parameters.get('take_profit', 1.5)
            trailing_stop = parameters.get('trailing_stop', 0.3)

            # Technical indicator parameters
            ema_fast = int(parameters.get('ema_fast', 8))
            ema_slow = int(parameters.get('ema_slow', 21))
            rsi_period = int(parameters.get('rsi_period', 7))
            rsi_oversold = parameters.get('rsi_oversold', 35)
            rsi_overbought = parameters.get('rsi_overbought', 65)

            # Initialize variables
            current_capital = initial_capital
            total_trades = 0
            winning_trades = 0
            losing_trades = 0
            total_fees = 0.0
            daily_results = []
            monthly_results = {}

            # Get and prepare data
            df = await self.get_historical_data(symbol, interval, start_date, end_date)
            df = self.prepare_indicators(df, ema_fast, ema_slow, rsi_period)

            print(f"📊 Data prepared: {len(df)} candles")
            print(f"⚙️ Strategy parameters:")
            print(f"   EMA: {ema_fast}/{ema_slow}, RSI: {rsi_period} ({rsi_oversold}-{rsi_overbought})")
            print(f"   Risk: SL={stop_loss}%, TP={take_profit}%, Trailing={trailing_stop}%")
            print(f"💰 Starting capital: ${current_capital:.2f}")

            # Group by day for daily trading limits
            daily_groups = df.groupby(df['timestamp'].dt.date)

            for date, day_data in daily_groups:
                daily_pnl = 0
                daily_trades = 0
                max_daily_trades = 5

                day_data = day_data.reset_index(drop=True)

                for i in range(1, len(day_data)):
                    if daily_trades >= max_daily_trades or daily_pnl <= -max_daily_loss:
                        break

                    current = day_data.iloc[i]
                    previous = day_data.iloc[i-1]

                    if self.check_entry_signal(current, previous, rsi_oversold, rsi_overbought):
                        # Risk management: Only risk a percentage of capital per trade
                        risk_per_trade = parameters.get('risk_per_trade', 2.0)  # Default 2% per trade
                        max_position_size = current_capital * (risk_per_trade / 100)

                        entry_price = current['close']

                        # Calculate position size based on stop loss
                        stop_loss_price = entry_price * (1 - stop_loss/100)
                        risk_per_unit = entry_price - stop_loss_price
                        position_units = max_position_size / risk_per_unit if risk_per_unit > 0 else 0
                        position_value = position_units * entry_price

                        # Don't exceed available capital
                        if position_value > current_capital * 0.95:  # Leave some buffer
                            position_value = current_capital * 0.95
                            position_units = position_value / entry_price

                        # Calculate entry fees
                        entry_fee = self.calculate_fees(position_value, is_entry=True)
                        total_entry_cost = position_value + entry_fee

                        # Skip if not enough capital
                        if total_entry_cost > current_capital:
                            continue

                        # Execute entry: Deduct full cost from capital
                        current_capital -= total_entry_cost
                        total_fees += entry_fee

                        print(f"📈 Entry: {position_units:.6f} {symbol} @ ${entry_price:.4f}, Cost: ${total_entry_cost:.2f}, Remaining Capital: ${current_capital:.2f}")

                        # Set stops
                        trailing_stop_price = entry_price * (1 - trailing_stop/100)
                        max_price = entry_price
                        take_profit_price = entry_price * (1 + take_profit/100)
                        stop_loss_price = entry_price * (1 - stop_loss/100)

                        # Check remaining candles for exit
                        remaining_data = day_data.iloc[i+1:]
                        exit_price = entry_price
                        trade_successful = False

                        for _, check_price in remaining_data.iterrows():
                            # Update trailing stop
                            if check_price['high'] > max_price:
                                max_price = check_price['high']
                                trailing_stop_price = max_price * (1 - trailing_stop/100)

                            # Check take profit
                            if check_price['high'] >= take_profit_price:
                                exit_price = take_profit_price
                                trade_successful = True
                                break

                            # Check stop loss
                            elif check_price['low'] <= min(stop_loss_price, trailing_stop_price):
                                exit_price = max(stop_loss_price, trailing_stop_price)
                                trade_successful = True
                                break

                        # If no exit signal found, close at last price
                        if not trade_successful:
                            exit_price = day_data.iloc[-1]['close']

                        # Calculate exit proceeds
                        position_exit_value = position_units * exit_price
                        exit_fee = self.calculate_fees(position_exit_value, is_entry=False)
                        net_proceeds = position_exit_value - exit_fee

                        # Execute exit: Add net proceeds to capital
                        current_capital += net_proceeds
                        total_fees += exit_fee

                        # Calculate trade P&L in USDT
                        trade_pnl_usdt = net_proceeds - position_value  # Net proceeds minus original position value
                        trade_pnl_percentage = ((exit_price - entry_price) / entry_price) * 100

                        # Update trade counters
                        if trade_pnl_usdt > 0:
                            winning_trades += 1
                        else:
                            losing_trades += 1

                        daily_pnl += trade_pnl_percentage  # Track daily P&L in percentage
                        daily_trades += 1
                        total_trades += 1

                        print(f"📉 Exit: ${exit_price:.4f}, Proceeds: ${net_proceeds:.2f}, P&L: ${trade_pnl_usdt:.2f} ({trade_pnl_percentage:.2f}%), Capital: ${current_capital:.2f}")

                        # Check daily target
                        if daily_pnl >= daily_target:
                            break

                # Record daily results
                if daily_trades > 0:
                    daily_results.append({
                        'date': str(date),
                        'pnl': daily_pnl,
                        'trades': daily_trades,
                        'capital': current_capital
                    })

                    # Monthly aggregation
                    month = pd.to_datetime(date).strftime('%Y-%m')
                    if month not in monthly_results:
                        monthly_results[month] = {'pnl': 0, 'trades': 0}
                    monthly_results[month]['pnl'] += daily_pnl
                    monthly_results[month]['trades'] += daily_trades

            # Calculate final results
            total_return = (current_capital - initial_capital) / initial_capital * 100
            win_rate = (winning_trades / total_trades * 100) if total_trades > 0 else 0
            avg_profit = (current_capital - initial_capital) / total_trades if total_trades > 0 else 0

            print(f"🔍 Final Calculations:")
            print(f"   Initial Capital: ${initial_capital:.2f}")
            print(f"   Final Capital: ${current_capital:.2f}")
            print(f"   Net P&L: ${current_capital - initial_capital:.2f}")
            print(f"   Total Trades: {total_trades}")
            print(f"   Winning: {winning_trades}, Losing: {losing_trades}")
            print(f"   Total Fees: ${total_fees:.2f}")
            print(f"   Win Rate: {win_rate:.2f}%")
            print(f"   Total Return: {total_return:.2f}%")

            results = {
                'initial_capital': initial_capital,
                'final_capital': current_capital,
                'total_return': total_return,
                'total_trades': total_trades,
                'winning_trades': winning_trades,
                'losing_trades': losing_trades,
                'win_rate': win_rate,
                'total_fees': total_fees,
                'avg_profit': avg_profit,
                'daily_results': daily_results,
                'monthly_results': monthly_results,
                'symbol': symbol,
                'interval': interval,
                'start_date': start_date,
                'end_date': end_date,
                'parameters': parameters,
                'test_mode': self.test_mode
            }

            # Clean NaN values before returning
            results = self.clean_nan_values(results)

            print(f"✅ Backtest completed!")
            print(f"📊 Total Return: {total_return:.2f}%")
            print(f"🎯 Win Rate: {win_rate:.2f}%")
            print(f"💰 Final Capital: {current_capital:.2f} USDT")

            return results

        except Exception as e:
            print(f"❌ Backtest error: {e}")
            raise

    async def save_backtest_result(self, results: Dict[str, Any]) -> int:
        """Save backtest results to database"""
        if not self.user_id or not self.db_session:
            print("⚠️ Cannot save backtest - no user or database session")
            return None

        try:
            backtest = Backtest(
                user_id=self.user_id,
                symbol=results['symbol'],
                interval=results['interval'],
                start_date=results['start_date'],
                end_date=results['end_date'],
                parameters=results['parameters'],
                initial_capital=results['initial_capital'],
                final_capital=results['final_capital'],
                total_return=results['total_return'],
                total_trades=results['total_trades'],
                winning_trades=results['winning_trades'],
                losing_trades=results['losing_trades'],
                win_rate=results['win_rate'],
                total_fees=results['total_fees'],
                avg_profit=results['avg_profit'],
                daily_results=results.get('daily_results'),
                monthly_results=results.get('monthly_results'),
                test_mode=str(results['test_mode']).lower()
            )

            self.db_session.add(backtest)
            await self.db_session.commit()
            await self.db_session.refresh(backtest)

            print(f"✅ Backtest saved with ID: {backtest.id}")
            return backtest.id

        except Exception as e:
            print(f"❌ Error saving backtest: {e}")
            await self.db_session.rollback()
            return None

    async def get_backtest_list(self, user_id: int, db_session: AsyncSession) -> List[Dict]:
        """Get list of user's backtests"""
        try:
            result = await db_session.execute(
                select(Backtest)
                .where(Backtest.user_id == user_id)
                .order_by(desc(Backtest.created_at))
                .limit(50)
            )
            backtests = result.scalars().all()

            return [
                {
                    "id": bt.id,
                    "symbol": bt.symbol,
                    "interval": bt.interval,
                    "start_date": bt.start_date,
                    "end_date": bt.end_date,
                    "total_return": round(bt.total_return, 2),
                    "win_rate": round(bt.win_rate, 2),
                    "total_trades": bt.total_trades,
                    "test_mode": bt.test_mode,
                    "created_at": bt.created_at
                } for bt in backtests
            ]

        except Exception as e:
            print(f"❌ Error getting backtest list: {e}")
            return []

    async def get_backtest_detail(self, backtest_id: int, user_id: int, db_session: AsyncSession) -> Dict:
        """Get detailed backtest results"""
        try:
            result = await db_session.execute(
                select(Backtest)
                .where(Backtest.id == backtest_id, Backtest.user_id == user_id)
            )
            backtest = result.scalars().first()

            if not backtest:
                raise HTTPException(status_code=404, detail="Backtest not found")

            return {
                "id": backtest.id,
                "symbol": backtest.symbol,
                "interval": backtest.interval,
                "start_date": backtest.start_date,
                "end_date": backtest.end_date,
                "parameters": backtest.parameters,
                "initial_capital": backtest.initial_capital,
                "final_capital": backtest.final_capital,
                "total_return": round(backtest.total_return, 2),
                "total_trades": backtest.total_trades,
                "winning_trades": backtest.winning_trades,
                "losing_trades": backtest.losing_trades,
                "win_rate": round(backtest.win_rate, 2),
                "total_fees": backtest.total_fees,
                "avg_profit": backtest.avg_profit,
                "daily_results": backtest.daily_results,
                "monthly_results": backtest.monthly_results,
                "test_mode": backtest.test_mode,
                "created_at": backtest.created_at
            }

        except Exception as e:
            print(f"❌ Error getting backtest detail: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to get backtest: {str(e)}")

    async def delete_backtest(self, backtest_id: int, user_id: int, db_session: AsyncSession):
        """Delete a backtest"""
        try:
            result = await db_session.execute(
                select(Backtest)
                .where(Backtest.id == backtest_id, Backtest.user_id == user_id)
            )
            backtest = result.scalars().first()

            if not backtest:
                raise HTTPException(status_code=404, detail="Backtest not found")

            await db_session.delete(backtest)
            await db_session.commit()

            print(f"✅ Backtest {backtest_id} deleted")

        except Exception as e:
            print(f"❌ Error deleting backtest: {e}")
            await db_session.rollback()
            raise HTTPException(status_code=500, detail=f"Failed to delete backtest: {str(e)}")

    def clean_nan_values(self, obj):
        """Recursively clean NaN values from any data structure for JSON serialization"""
        if isinstance(obj, dict):
            return {key: self.clean_nan_values(value) for key, value in obj.items()}
        elif isinstance(obj, list):
            return [self.clean_nan_values(item) for item in obj]
        elif isinstance(obj, (np.floating, float)) and (np.isnan(obj) or np.isinf(obj)):
            return 0.0
        elif isinstance(obj, np.integer):
            return int(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        elif hasattr(obj, 'item'):  # numpy scalars
            return obj.item()
        else:
            return obj
