import os
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from binance.client import Client as BinanceClient
from ta.trend import SMAIndicator, EMAIndicator, MACD
from ta.momentum import RSIIndicator
from ta.volatility import BollingerBands
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import requests
import time

from app.core.cache import DataCache
from app.models.api_key import ApiKey
from app.core.crypto import decrypt_value

class BacktestService:
    def __init__(self, user_id: Optional[int] = None, db_session: Optional[AsyncSession] = None):
        self.cache = DataCache()
        self.user_id = user_id
        self.db_session = db_session

        # Initialize with no client (will be set up when needed)
        self.client = None
        self.test_mode = True

        print("🔧 BacktestService initialized")

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
                          start_date: str = "2025-01-01", end_date: str = "2025-04-04") -> pd.DataFrame:
        """Get historical data with caching"""

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
            # EMA indicators
            df['EMA_fast'] = EMAIndicator(df['close'], ema_fast).ema_indicator()
            df['EMA_slow'] = EMAIndicator(df['close'], ema_slow).ema_indicator()

            # RSI
            df['RSI'] = RSIIndicator(df['close'], rsi_period).rsi()

            # MACD
            macd = MACD(df['close'])
            df['MACD'] = macd.macd_diff()

            # Bollinger Bands
            bb = BollingerBands(df['close'])
            df['BB_upper'] = bb.bollinger_hband()
            df['BB_middle'] = bb.bollinger_mavg()
            df['BB_lower'] = bb.bollinger_lband()

            # Volume analysis
            df['volume_ma'] = df['volume'].rolling(window=20).mean()
            df['volume_ratio'] = df['volume'] / df['volume_ma']

            # Volatility
            df['volatility'] = df['close'].pct_change().rolling(window=10).std()
            df['volatility_ma'] = df['volatility'].rolling(window=20).mean()

            # Trend strength
            df['trend_strength'] = abs(df['EMA_fast'] - df['EMA_slow']) / df['EMA_slow'] * 100

            # Drop NaN values
            df.dropna(inplace=True)

            return df

        except Exception as e:
            print(f"❌ Error preparing indicators: {e}")
            raise

    def check_entry_signal(self, current: pd.Series, previous: pd.Series,
                          rsi_oversold: float = 35, rsi_overbought: float = 65) -> bool:
        """Check if entry conditions are met"""
        try:
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

            # Volume analysis
            volume_surge = current['volume_ratio'] > 1.2

            # Momentum and trend strength
            momentum = current['close'] > previous['close'] * 1.0005  # 0.05% minimum increase
            strong_trend = current['trend_strength'] > 0.2

            # Volatility control
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
                        position_size = current_capital * 1.0  # Full capital
                        entry_price = current['close']

                        # Entry fees
                        entry_fee = self.calculate_fees(position_size, is_entry=True)
                        position_size -= entry_fee
                        total_fees += entry_fee

                        # Set stops
                        trailing_stop_price = entry_price * (1 - trailing_stop/100)
                        max_price = entry_price
                        take_profit_price = entry_price * (1 + take_profit/100)
                        stop_loss_price = entry_price * (1 - stop_loss/100)

                        # Check remaining candles for exit
                        remaining_data = day_data.iloc[i+1:]
                        trade_result = 0
                        exit_fee = 0

                        for _, check_price in remaining_data.iterrows():
                            # Update trailing stop
                            if check_price['high'] > max_price:
                                max_price = check_price['high']
                                trailing_stop_price = max_price * (1 - trailing_stop/100)

                            # Check take profit
                            if check_price['high'] >= take_profit_price:
                                trade_result = take_profit
                                winning_trades += 1
                                exit_fee = self.calculate_fees(position_size * (1 + trade_result/100), is_entry=False)
                                total_fees += exit_fee
                                trade_result = trade_result - (exit_fee/position_size * 100)
                                break

                            # Check stop loss
                            elif check_price['low'] <= min(stop_loss_price, trailing_stop_price):
                                loss_price = max(stop_loss_price, trailing_stop_price)
                                trade_result = -((entry_price - loss_price) / entry_price * 100)
                                losing_trades += 1
                                exit_fee = self.calculate_fees(position_size * (1 + trade_result/100), is_entry=False)
                                total_fees += exit_fee
                                trade_result = trade_result - (exit_fee/position_size * 100)
                                break

                        # Update capital
                        trade_pnl = position_size * (trade_result/100)
                        current_capital += trade_pnl
                        daily_pnl += trade_result
                        daily_trades += 1
                        total_trades += 1

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

            print(f"✅ Backtest completed!")
            print(f"📊 Total Return: {total_return:.2f}%")
            print(f"🎯 Win Rate: {win_rate:.2f}%")
            print(f"💰 Final Capital: {current_capital:.2f} USDT")

            return results

        except Exception as e:
            print(f"❌ Backtest error: {e}")
            raise
