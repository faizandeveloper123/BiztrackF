import time
import json
from typing import Any, Optional, Dict
from functools import wraps
import logging

logger = logging.getLogger(__name__)

class SimpleCache:
    def __init__(self, default_ttl: int = 300):
        self.cache: Dict[str, Dict[str, Any]] = {}
        self.default_ttl = default_ttl
    
    def get(self, key: str) -> Optional[Any]:
        if key not in self.cache:
            return None
        
        entry = self.cache[key]
        if time.time() > entry['expires_at']:
            del self.cache[key]
            return None
        
        return entry['value']
    
    def set(self, key: str, value: Any, ttl: Optional[int] = None) -> None:
        ttl = ttl or self.default_ttl
        self.cache[key] = {
            'value': value,
            'expires_at': time.time() + ttl
        }
    
    def delete(self, key: str) -> None:
        if key in self.cache:
            del self.cache[key]
    
    def clear(self) -> None:
        self.cache.clear()
    
    def get_stats(self) -> Dict[str, Any]:
        return {
            'size': len(self.cache),
            'keys': list(self.cache.keys())
        }

cache = SimpleCache(default_ttl=300)

def cached(ttl: int = 300, key_prefix: str = ""):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{key_prefix}{func.__name__}_{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # Try to get from cache first
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result
            
            # Execute function and cache result
            logger.debug(f"Cache miss for {cache_key}, executing function")
            result = await func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

def cached_sync(ttl: int = 300, key_prefix: str = ""):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key from function name and arguments
            cache_key = f"{key_prefix}{func.__name__}_{hash(str(args) + str(sorted(kwargs.items())))}"
            
            # Try to get from cache first
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_result
            
            # Execute function and cache result
            logger.debug(f"Cache miss for {cache_key}, executing function")
            result = func(*args, **kwargs)
            cache.set(cache_key, result, ttl)
            
            return result
        return wrapper
    return decorator

def invalidate_cache(pattern: str) -> None:
    """Invalidate cache entries matching a pattern"""
    keys_to_delete = [key for key in cache.cache.keys() if pattern in key]
    for key in keys_to_delete:
        cache.delete(key)
    logger.info(f"Invalidated {len(keys_to_delete)} cache entries matching pattern: {pattern}")
