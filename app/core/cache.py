import os
import json
import pandas as pd
from datetime import datetime, timedelta
from typing import Optional
import hashlib

class DataCache:
    def __init__(self, cache_dir: str = "cache/data"):
        self.cache_dir = cache_dir
        os.makedirs(cache_dir, exist_ok=True)

    def _get_cache_key(self, symbol: str, interval: str, start_date: str, end_date: str, market_type: str = "spot") -> str:
        """Generate a unique cache key for the data including market type (spot/futures)"""
        data_string = f"{symbol}_{interval}_{start_date}_{end_date}_{market_type.lower()}"
        return hashlib.md5(data_string.encode()).hexdigest()

    def _get_cache_path(self, cache_key: str) -> str:
        """Get the full path for a cache file"""
        return os.path.join(self.cache_dir, f"{cache_key}.csv")

    def _get_metadata_path(self, cache_key: str) -> str:
        """Get the full path for metadata file"""
        return os.path.join(self.cache_dir, f"{cache_key}_meta.json")

    def is_cached(self, symbol: str, interval: str, start_date: str, end_date: str, market_type: str = "spot") -> bool:
        """Check if data is already cached"""
        cache_key = self._get_cache_key(symbol, interval, start_date, end_date, market_type)
        cache_path = self._get_cache_path(cache_key)
        metadata_path = self._get_metadata_path(cache_key)

        print(f"🔍 Cache check for: {symbol} {interval} {start_date} to {end_date}")
        print(f"🔑 Cache key: {cache_key}")
        print(f"📁 Cache path: {cache_path}")
        print(f"📄 Metadata path: {metadata_path}")
        print(f"📂 Cache file exists: {os.path.exists(cache_path)}")
        print(f"📋 Metadata file exists: {os.path.exists(metadata_path)}")

        if not os.path.exists(cache_path) or not os.path.exists(metadata_path):
            print(f"❌ Cache files missing")
            return False

        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)

            print(f"📊 Cached metadata: {metadata}")

            # Check if cache is less than 24 hours old for recent data
            cache_time = datetime.fromisoformat(metadata['cached_at'])
            now = datetime.now()

            print(f"🕐 Cache time: {cache_time}")
            print(f"🕐 Current time: {now}")
            print(f"⏰ Cache age: {(now - cache_time).total_seconds() / 3600:.2f} hours")

            # If end_date is today or recent, check cache age
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            days_from_now = (now.date() - end_dt.date()).days
            print(f"📅 End date: {end_dt.date()}")
            print(f"📅 Days from now: {days_from_now}")

            if days_from_now <= 1:  # Recent data
                cache_valid = (now - cache_time).total_seconds() < 24 * 3600  # 24 hours in seconds
                print(f"🔄 Recent data - cache valid (< 24h): {cache_valid}")
                return cache_valid
            else:  # Historical data never expires
                print(f"📚 Historical data - cache valid: True")
                return True

        except Exception as e:
            print(f"❌ Cache metadata error: {e}")
            return False

    def get_cached_data(self, symbol: str, interval: str, start_date: str, end_date: str, market_type: str = "spot") -> Optional[pd.DataFrame]:
        """Get cached data if available"""
        if not self.is_cached(symbol, interval, start_date, end_date, market_type):
            return None

        try:
            cache_key = self._get_cache_key(symbol, interval, start_date, end_date, market_type)
            cache_path = self._get_cache_path(cache_key)

            df = pd.read_csv(cache_path)
            df['timestamp'] = pd.to_datetime(df['timestamp'])

            print(f"✅ Cache hit: {symbol} {interval} ({len(df)} rows)")
            return df

        except Exception as e:
            print(f"Error reading cached data: {e}")
            return None

    def cache_data(self, df: pd.DataFrame, symbol: str, interval: str, start_date: str, end_date: str, market_type: str = "spot"):
        """Cache the dataframe"""
        try:
            cache_key = self._get_cache_key(symbol, interval, start_date, end_date, market_type)
            cache_path = self._get_cache_path(cache_key)
            metadata_path = self._get_metadata_path(cache_key)

            # Save data
            df.to_csv(cache_path, index=False)

            # Save metadata
            metadata = {
                'symbol': symbol,
                'interval': interval,
                'start_date': start_date,
                'end_date': end_date,
                'market_type': market_type.lower(),
                'cached_at': datetime.now().isoformat(),
                'rows': len(df),
                'cache_key': cache_key
            }

            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2)

            print(f"✅ Data cached: {symbol} {interval} ({len(df)} rows)")

        except Exception as e:
            print(f"Error caching data: {e}")

    def clear_cache(self):
        """Clear all cached data"""
        try:
            for file in os.listdir(self.cache_dir):
                if file.endswith(('.csv', '.json')):
                    os.remove(os.path.join(self.cache_dir, file))
            print("✅ Cache cleared")
        except Exception as e:
            print(f"Error clearing cache: {e}")

    def get_cache_info(self) -> dict:
        """Get information about cached data"""
        info = {
            'total_files': 0,
            'cached_symbols': set(),
            'total_size_mb': 0,
            'cache_entries': []
        }

        try:
            print(f"🔍 Checking cache directory: {self.cache_dir}")

            if not os.path.exists(self.cache_dir):
                print(f"⚠️ Cache directory does not exist: {self.cache_dir}")
                return info

            files = os.listdir(self.cache_dir)
            print(f"📁 Found {len(files)} files in cache directory")

            for file in files:
                print(f"📄 Processing file: {file}")

                if file.endswith('_meta.json'):
                    info['total_files'] += 1
                    file_path = os.path.join(self.cache_dir, file)

                    try:
                        with open(file_path, 'r') as f:
                            metadata = json.load(f)
                            info['cached_symbols'].add(metadata['symbol'])
                            info['cache_entries'].append(metadata)
                            print(f"✅ Loaded metadata for {metadata['symbol']} {metadata['interval']}")
                    except Exception as meta_error:
                        print(f"❌ Error reading metadata file {file}: {meta_error}")

                # Calculate total size
                file_path = os.path.join(self.cache_dir, file)
                try:
                    file_size = os.path.getsize(file_path) / (1024 * 1024)
                    info['total_size_mb'] += file_size
                except Exception as size_error:
                    print(f"❌ Error getting size for {file}: {size_error}")

            info['cached_symbols'] = list(info['cached_symbols'])
            info['total_size_mb'] = round(info['total_size_mb'], 2)

            print(f"📊 Cache info summary:")
            print(f"   Total files: {info['total_files']}")
            print(f"   Cached symbols: {info['cached_symbols']}")
            print(f"   Total size: {info['total_size_mb']} MB")
            print(f"   Cache entries: {len(info['cache_entries'])}")

        except Exception as e:
            print(f"❌ Error getting cache info: {e}")
            import traceback
            traceback.print_exc()

        return info
