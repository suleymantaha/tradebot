from binance.client import Client
from binance.exceptions import BinanceAPIException, BinanceOrderException
from typing import Dict, Any, Optional, List, cast
import logging
import requests
import os
import time
from decimal import Decimal, InvalidOperation

logger = logging.getLogger(__name__)

class BinanceClientWrapper:
    """Binance API ile etkileşim için wrapper sınıf"""

    def __init__(self, api_key: str, api_secret: str, testnet: bool = True):
        """
        Args:
            api_key: Binance API anahtarı
            api_secret: Binance API secret anahtarı
            testnet: Test ağı kullanılıp kullanılmayacağı
        """
        try:
            self.client = Client(
                api_key=api_key,
                api_secret=api_secret,
                testnet=testnet
            )
        except Exception as e:
            logger.error(f"Binance client oluşturulurken hata: {e}")
            raise

    def validate_api_credentials(self) -> Dict[str, Any]:
        """
        API kimlik bilgilerinin geçerliliğini kontrol eder

        Returns:
            Dict: {"valid": bool, "error": str|None, "account_info": dict|None}
        """
        try:
            account_info = self.client.get_account()
            return {
                "valid": True,
                "error": None,
                "account_info": account_info
            }
        except BinanceAPIException as e:
            logger.error(f"Binance API hatası: {e}")
            error_msg = f"API Hatası (Kod: {e.code}): {e.message}"
            if e.code == -2015:
                error_msg += " - Bu hata genellikle yanlış API anahtarı, IP kısıtlaması veya mainnet/testnet uyumsuzluğu nedeniyle oluşur."
            return {
                "valid": False,
                "error": error_msg,
                "account_info": None
            }
        except Exception as e:
            logger.error(f"Beklenmeyen hata: {e}")
            return {
                "valid": False,
                "error": f"Bağlantı hatası: {str(e)}",
                "account_info": None
            }

    # -------------------------------
    # Utilities & Retry
    # -------------------------------

    def _retry(self, func, *args, **kwargs):
        """Basit retry/backoff yardımcı fonksiyon."""
        max_attempts = kwargs.pop('_max_attempts', 3)
        backoff_base = kwargs.pop('_backoff_base', 0.5)
        for attempt in range(1, max_attempts + 1):
            try:
                return func(*args, **kwargs)
            except BinanceAPIException as e:
                # Rate limit veya saat senkronizasyonu gibi geçici hatalarda backoff uygula
                if e.code in (-1003, -1015, -1021):
                    time.sleep(backoff_base * attempt)
                    continue
                raise
            except Exception:
                if attempt == max_attempts:
                    raise
                time.sleep(backoff_base * attempt)
        return None

    def get_account_info(self) -> Optional[Dict[str, Any]]:
        """Hesap bilgilerini döndürür"""
        try:
            return self.client.get_account()
        except Exception as e:
            logger.error(f"Hesap bilgileri alınamadı: {e}")
            return None

    def get_current_price(self, symbol: str) -> Optional[float]:
        """Belirtilen sembolün güncel fiyatını döndürür"""
        try:
            ticker = self.client.get_symbol_ticker(symbol=symbol)
            return float(ticker['price'])
        except Exception as e:
            logger.error(f"{symbol} fiyatı alınamadı: {e}")
            return None

    def get_historical_klines(self, symbol: str, interval: str, limit: int = 100) -> Optional[List[Any]]:
        """Historik candlestick verilerini döndürür"""
        try:
            klines = cast(List[Any], self.client.get_klines(
                symbol=symbol,
                interval=interval,
                limit=limit
            ))
            return klines
        except Exception as e:
            logger.error(f"{symbol} historik veriler alınamadı: {e}")
            return None

    def get_symbol_filters_spot(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Spot için sembol filtrelerini döndürür (LOT_SIZE, MIN_NOTIONAL vb.)"""
        try:
            info = self.client.get_symbol_info(symbol)
            if not info:
                return None
            filters = {f['filterType']: f for f in info.get('filters', [])}
            return filters
        except Exception as e:
            logger.error(f"Spot sembol filtreleri alınamadı {symbol}: {e}")
            return None

    def get_symbol_filters_futures(self, symbol: str) -> Optional[Dict[str, Any]]:
        """Futures için sembol filtrelerini döndürür (LOT_SIZE, MIN_NOTIONAL vb.)"""
        try:
            info = self.client.futures_exchange_info()
            for s in info.get('symbols', []):
                if s.get('symbol') == symbol:
                    filters = {f['filterType']: f for f in s.get('filters', [])}
                    return filters
            return None
        except Exception as e:
            logger.error(f"Futures sembol filtreleri alınamadı {symbol}: {e}")
            return None

    # -------------------------------
    # Quantity Normalization
    # -------------------------------

    @staticmethod
    def _round_step(quantity: float, step_size: str) -> float:
        try:
            q = Decimal(str(quantity))
            step = Decimal(step_size)
            if step == 0:
                return float(q)
            # En yakın aşağı adım
            normalized = (q // step) * step
            return float(normalized.normalize())
        except (InvalidOperation, ZeroDivisionError):
            return quantity

    def normalize_spot_quantity(self, symbol: str, price: float, desired_qty: float) -> Optional[float]:
        filters = self.get_symbol_filters_spot(symbol)
        if not filters:
            return None
        lot = filters.get('LOT_SIZE') or {}
        min_qty = float(lot.get('minQty', 0) or 0)
        step_size = lot.get('stepSize', '0.00000001')
        min_notional_filter = filters.get('MIN_NOTIONAL') or {}
        min_notional = float(min_notional_filter.get('minNotional', 0) or 0)

        qty = max(desired_qty, min_qty)
        qty = self._round_step(qty, step_size)
        notional = qty * price
        if min_notional > 0 and notional < min_notional:
            needed_qty = (min_notional / price) * 1.001
            qty = self._round_step(max(qty, needed_qty), step_size)
            if qty * price < min_notional:
                return None
        return qty if qty >= min_qty and qty > 0 else None

    def normalize_futures_quantity(self, symbol: str, price: float, desired_qty: float) -> Optional[float]:
        filters = self.get_symbol_filters_futures(symbol)
        if not filters:
            return None
        lot = filters.get('MARKET_LOT_SIZE') or filters.get('LOT_SIZE') or {}
        min_qty = float(lot.get('minQty', 0) or 0)
        step_size = lot.get('stepSize', '0.001')
        min_notional_filter = filters.get('MIN_NOTIONAL') or filters.get('NOTIONAL') or {}
        min_notional = float(min_notional_filter.get('minNotional', min_notional_filter.get('notional', 0) or 0) or 0)

        qty = max(desired_qty, min_qty)
        qty = self._round_step(qty, step_size)
        notional = qty * price
        if min_notional > 0 and notional < min_notional:
            needed_qty = (min_notional / price) * 1.001
            qty = self._round_step(max(qty, needed_qty), step_size)
            if qty * price < min_notional:
                return None
        return qty if qty >= min_qty and qty > 0 else None

    # -------------------------------
    # Price Normalization (tick size)
    # -------------------------------

    @staticmethod
    def _round_price(price: float, tick_size: str) -> float:
        try:
            p = Decimal(str(price))
            step = Decimal(tick_size)
            if step == 0:
                return float(p)
            normalized = (p // step) * step
            return float(normalized.normalize())
        except (InvalidOperation, ZeroDivisionError):
            return price

    def normalize_spot_price(self, symbol: str, price: float) -> Optional[float]:
        filters = self.get_symbol_filters_spot(symbol)
        if not filters:
            return None
        pf = filters.get('PRICE_FILTER') or {}
        tick = pf.get('tickSize', '0.01')
        return self._round_price(price, tick)

    # -------------------------------
    # Spot OCO helper
    # -------------------------------

    def place_spot_oco_sell_order(self, symbol: str, quantity: float, take_profit_price: float, stop_price: float) -> Optional[Dict[str, Any]]:
        """Spot çıkış için OCO satış emri (limit + stop-limit)."""
        try:
            tp = self.normalize_spot_price(symbol, take_profit_price) or take_profit_price
            sp = self.normalize_spot_price(symbol, stop_price) or stop_price
            # stopLimitPrice'ı stop_price'tan biraz aşağı ayarla
            sl = sp * 0.999
            sl = self.normalize_spot_price(symbol, sl) or sl
            order = self._retry(
                self.client.create_oco_order,
                symbol=symbol,
                side='SELL',
                quantity=quantity,
                price=tp,
                stopPrice=sp,
                stopLimitPrice=sl,
                stopLimitTimeInForce='GTC'
            )
            logger.info(f"Spot OCO sell emri verildi: {order}")
            return order
        except Exception as e:
            logger.error(f"Spot OCO sell hatası {symbol}: {e}")
            return None

    def place_market_buy_order(self, symbol: str, quantity: float) -> Optional[Dict[str, Any]]:
        """Market alış emri verir"""
        try:
            order = self._retry(self.client.order_market_buy,
                symbol=symbol,
                quantity=quantity
            )
            logger.info(f"Market alış emri verildi: {order}")
            return order
        except BinanceOrderException as e:
            logger.error(f"Alış emri hatası: {e}")
            return None
        except Exception as e:
            logger.error(f"Beklenmeyen alış emri hatası: {e}")
            return None

    def place_market_sell_order(self, symbol: str, quantity: float) -> Optional[Dict[str, Any]]:
        """Market satış emri verir"""
        try:
            order = self._retry(self.client.order_market_sell,
                symbol=symbol,
                quantity=quantity
            )
            logger.info(f"Market satış emri verildi: {order}")
            return order
        except BinanceOrderException as e:
            logger.error(f"Satış emri hatası: {e}")
            return None
        except Exception as e:
            logger.error(f"Beklenmeyen satış emri hatası: {e}")
            return None

    def get_balance(self, asset: str = "USDT") -> Optional[float]:
        """Belirtilen varlığın bakiyesini döndürür"""
        try:
            account = self.client.get_account()
            for balance in account['balances']:
                if balance['asset'] == asset:
                    return float(balance['free'])
            return 0.0
        except Exception as e:
            logger.error(f"{asset} bakiyesi alınamadı: {e}")
            return None

    def get_all_symbols(self) -> Optional[list]:
        """Tüm aktif sembolleri döndürür"""
        try:
            exchange_info = self.client.get_exchange_info()
            symbols = []
            for symbol_info in exchange_info['symbols']:
                if symbol_info['status'] == 'TRADING':
                    symbols.append({
                        'symbol': symbol_info['symbol'],
                        'baseAsset': symbol_info['baseAsset'],
                        'quoteAsset': symbol_info['quoteAsset'],
                        'status': symbol_info['status']
                    })
            return symbols
        except Exception as e:
            logger.error(f"Sembol listesi alınamadı: {e}")
            return None

    @staticmethod
    def get_public_symbols() -> Optional[list]:
        """Public endpoint ile tüm aktif sembolleri döndürür (API key gerekmez)"""
        try:
            # Environment variable'dan testnet kontrolü
            testnet_env = os.getenv('TESTNET_URL', 'false').lower()
            if testnet_env in ['true', '1', 'yes']:  # Testnet
                url = "https://testnet.binance.vision/api/v3/exchangeInfo"
            else:  # Mainnet
                url = "https://api.binance.com/api/v3/exchangeInfo"

            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                symbols = []
                for symbol_info in data['symbols']:
                    if symbol_info['status'] == 'TRADING':
                        symbols.append({
                            'symbol': symbol_info['symbol'],
                            'baseAsset': symbol_info['baseAsset'],
                            'quoteAsset': symbol_info['quoteAsset'],
                            'status': symbol_info['status']
                        })
                return symbols
            else:
                logger.error(f"Public symbols API hatası: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Public symbols alınamadı: {e}")
            return None

    def get_futures_symbols(self) -> Optional[list]:
        """Futures sembolleri döndürür"""
        try:
            exchange_info = self.client.futures_exchange_info()
            symbols = []
            for symbol_info in exchange_info['symbols']:
                if symbol_info['status'] == 'TRADING':
                    symbols.append({
                        'symbol': symbol_info['symbol'],
                        'baseAsset': symbol_info['baseAsset'],
                        'quoteAsset': symbol_info['quoteAsset'],
                        'status': symbol_info['status']
                    })
            return symbols
        except Exception as e:
            logger.error(f"Futures sembol listesi alınamadı: {e}")
            return None

    @staticmethod
    def get_public_futures_symbols() -> Optional[list]:
        """Public endpoint ile futures sembolleri döndürür (API key gerekmez)"""
        try:
            # Environment variable'dan testnet kontrolü
            testnet_env = os.getenv('TESTNET_URL', 'false').lower()
            if testnet_env in ['true', '1', 'yes']:  # Testnet
                url = "https://testnet.binancefuture.com/fapi/v1/exchangeInfo"
            else:  # Mainnet
                url = "https://fapi.binance.com/fapi/v1/exchangeInfo"

            response = requests.get(url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                symbols = []
                for symbol_info in data['symbols']:
                    if symbol_info['status'] == 'TRADING':
                        symbols.append({
                            'symbol': symbol_info['symbol'],
                            'baseAsset': symbol_info['baseAsset'],
                            'quoteAsset': symbol_info['quoteAsset'],
                            'status': symbol_info['status']
                        })
                return symbols
            else:
                logger.error(f"Public futures symbols API hatası: {response.status_code}")
                return None
        except Exception as e:
            logger.error(f"Public futures symbols alınamadı: {e}")
            return None

    def transfer_to_futures(self, asset: str, amount: float) -> Optional[Dict[str, Any]]:
        """Spot'tan Futures'a fon transferi"""
        try:
            result = self._retry(self.client.futures_account_transfer,
                asset=asset,
                amount=amount,
                type=1  # 1: spot to futures, 2: futures to spot
            )
            logger.info(f"{amount} {asset} spot'tan futures'a transfer edildi")
            return result
        except Exception as e:
            logger.error(f"Futures transferi başarısız: {e}")
            return None

    def transfer_to_spot(self, asset: str, amount: float) -> Optional[Dict[str, Any]]:
        """Futures'tan Spot'a fon transferi"""
        try:
            result = self._retry(self.client.futures_account_transfer,
                asset=asset,
                amount=amount,
                type=2  # 1: spot to futures, 2: futures to spot
            )
            logger.info(f"{amount} {asset} futures'tan spot'a transfer edildi")
            return result
        except Exception as e:
            logger.error(f"Spot transferi başarısız: {e}")
            return None

    def get_futures_balance(self, asset: str = "USDT") -> Optional[float]:
        """Futures bakiyesini döndürür"""
        try:
            account = self.client.futures_account()
            for balance in account['assets']:
                if balance['asset'] == asset:
                    return float(balance['availableBalance'])
            return 0.0
        except Exception as e:
            logger.error(f"Futures {asset} bakiyesi alınamadı: {e}")
            return None

    def place_futures_market_buy_order(self, symbol: str, quantity: float) -> Optional[Dict[str, Any]]:
        """Futures market alış emri"""
        try:
            order = self._retry(self.client.futures_create_order,
                symbol=symbol,
                side='BUY',
                type='MARKET',
                quantity=quantity
            )
            logger.info(f"Futures market alış emri verildi: {order}")
            return order
        except Exception as e:
            logger.error(f"Futures alış emri hatası: {e}")
            return None

    def place_futures_market_sell_order(self, symbol: str, quantity: float) -> Optional[Dict[str, Any]]:
        """Futures market satış emri"""
        try:
            order = self._retry(self.client.futures_create_order,
                symbol=symbol,
                side='SELL',
                type='MARKET',
                quantity=quantity
            )
            logger.info(f"Futures market satış emri verildi: {order}")
            return order
        except Exception as e:
            logger.error(f"Futures satış emri hatası: {e}")
            return None

    def set_leverage(self, symbol: str, leverage: int) -> Optional[Dict[str, Any]]:
        """Futures trading için kaldıraç ayarlar"""
        try:
            # Leverage 1-125 arasında olmalı
            if leverage < 1 or leverage > 125:
                leverage = 10  # Default leverage

            result = self._retry(self.client.futures_change_leverage,
                symbol=symbol,
                leverage=leverage
            )
            logger.info(f"{symbol} için kaldıraç {leverage}x olarak ayarlandı")
            return result
        except Exception as e:
            logger.error(f"Kaldıraç ayarlama hatası {symbol} {leverage}x: {e}")
            return None

    def get_leverage(self, symbol: str) -> Optional[int]:
        """Belirtilen sembol için mevcut kaldıracı döndürür"""
        try:
            position_info = self._retry(self.client.futures_position_information, symbol=symbol)
            if position_info:
                return int(position_info[0].get('leverage', 1))
            return None
        except Exception as e:
            logger.error(f"Kaldıraç bilgisi alınamadı {symbol}: {e}")
            return None

    # -------------------------------
    # Futures margin/position mode & SL/TP helpers
    # -------------------------------

    def ensure_isolated_margin(self, symbol: str) -> bool:
        try:
            self._retry(self.client.futures_change_margin_type, symbol=symbol, marginType='ISOLATED')
            return True
        except BinanceAPIException as e:
            # -4046 zaten ISOLATED ise
            if e.code == -4046:
                return True
            logger.error(f"Margin type set failed {symbol}: {e}")
            return False
        except Exception as e:
            logger.error(f"Margin type set failed {symbol}: {e}")
            return False

    def ensure_one_way_mode(self) -> bool:
        try:
            mode = self._retry(self.client.futures_get_position_mode)
            dual = bool(mode.get('dualSidePosition', False)) if isinstance(mode, dict) else False
            if dual:
                self._retry(self.client.futures_change_position_mode, dualSidePosition=False)
            return True
        except Exception as e:
            logger.error(f"Position mode set failed: {e}")
            return False

    def place_futures_reduce_only_protections(self, symbol: str, side: str, stop_loss_price: Optional[float], take_profit_price: Optional[float], quantity: float) -> bool:
        """SL/TP için reduceOnly STOP_MARKET ve TAKE_PROFIT_MARKET emirleri yerleştirir."""
        try:
            close_side = 'SELL' if side.upper() == 'BUY' else 'BUY'
            if stop_loss_price is not None:
                self._retry(
                    self.client.futures_create_order,
                    symbol=symbol,
                    side=close_side,
                    type='STOP_MARKET',
                    stopPrice=float(stop_loss_price),
                    reduceOnly=True,
                    quantity=quantity
                )
            if take_profit_price is not None:
                self._retry(
                    self.client.futures_create_order,
                    symbol=symbol,
                    side=close_side,
                    type='TAKE_PROFIT_MARKET',
                    stopPrice=float(take_profit_price),
                    reduceOnly=True,
                    quantity=quantity
                )
            return True
        except Exception as e:
            logger.error(f"Futures SL/TP placement failed {symbol}: {e}")
            return False
