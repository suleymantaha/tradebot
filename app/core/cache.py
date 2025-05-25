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

    def _get_cache_key(self, symbol: str, interval: str, start_date: str, end_date: str) -> str:
        """Generate a unique cache key for the data"""
        data_string = f"{symbol}_{interval}_{start_date}_{end_date}"
        return hashlib.md5(data_string.encode()).hexdigest()

    def _get_cache_path(self, cache_key: str) -> str:
        """Get the full path for a cache file"""
        return os.path.join(self.cache_dir, f"{cache_key}.csv")

    def _get_metadata_path(self, cache_key: str) -> str:
        """Get the full path for metadata file"""
        return os.path.join(self.cache_dir, f"{cache_key}_meta.json")

    def is_cached(self, symbol: str, interval: str, start_date: str, end_date: str) -> bool:
        """Check if data is already cached"""
        cache_key = self._get_cache_key(symbol, interval, start_date, end_date)
        cache_path = self._get_cache_path(cache_key)
        metadata_path = self._get_metadata_path(cache_key)

        if not os.path.exists(cache_path) or not os.path.exists(metadata_path):
            return False

        try:
            with open(metadata_path, 'r') as f:
                metadata = json.load(f)

            # Check if cache is less than 24 hours old for recent data
            cache_time = datetime.fromisoformat(metadata['cached_at'])
            now = datetime.now()

            # If end_date is today or recent, check cache age
            end_dt = datetime.strptime(end_date, "%Y-%m-%d")
            if (now - end_dt).days <= 1:  # Recent data
                return (now - cache_time).hours < 24
            else:  # Historical data never expires
                return True

        except Exception as e:
            print(f"Cache metadata error: {e}")
            return False

    def get_cached_data(self, symbol: str, interval: str, start_date: str, end_date: str) -> Optional[pd.DataFrame]:
        """Get cached data if available"""
        if not self.is_cached(symbol, interval, start_date, end_date):
            return None

        try:
            cache_key = self._get_cache_key(symbol, interval, start_date, end_date)
            cache_path = self._get_cache_path(cache_key)

            df = pd.read_csv(cache_path)
            df['timestamp'] = pd.to_datetime(df['timestamp'])

            print(f"✅ Cache hit: {symbol} {interval} ({len(df)} rows)")
            return df

        except Exception as e:
            print(f"Error reading cached data: {e}")
            return None

    def cache_data(self, df: pd.DataFrame, symbol: str, interval: str, start_date: str, end_date: str):
        """Cache the dataframe"""
        try:
            cache_key = self._get_cache_key(symbol, interval, start_date, end_date)
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
