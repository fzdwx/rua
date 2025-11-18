/**
 * QWeather data cache management
 * Caches weather data to reduce API calls and improve performance
 */

interface CacheItem<T> {
    data: T;
    timestamp: number;
    locationId: string;
}

// Cache durations in milliseconds based on QWeather update frequency
const CACHE_DURATIONS = {
    now: 10 * 60 * 1000 * 6,        // 1 hours for real-time weather
    daily: 1 * 60 * 60 * 1000 * 8,  // 8 hour for daily forecast
    indices: 6 * 60 * 60 * 1000, // 6 hours for weather indices
};

const CACHE_PREFIX = 'qweather_cache_';

/**
 * Get cache key
 */
function getCacheKey(type: string, locationId: string, suffix?: string): string {
    const base = `${CACHE_PREFIX}${type}_${locationId}`;
    return suffix ? `${base}_${suffix}` : base;
}

/**
 * Get cached data if available and not expired
 */
export function getCachedData<T>(
    type: 'now' | 'daily' | 'indices',
    locationId: string,
    suffix?: string
): T | null {
    try {
        const key = getCacheKey(type, locationId, suffix);
        const cached = localStorage.getItem(key);

        if (!cached) {
            return null;
        }

        const item: CacheItem<T> = JSON.parse(cached);

        // Check if cache is expired
        const now = Date.now();
        const duration = CACHE_DURATIONS[type];

        if (now - item.timestamp > duration) {
            // Cache expired, remove it
            localStorage.removeItem(key);
            return null;
        }

        // Verify location ID matches
        if (item.locationId !== locationId) {
            return null;
        }

        return item.data;
    } catch (error) {
        console.error('Failed to get cached data:', error);
        return null;
    }
}

/**
 * Set cached data
 */
export function setCachedData<T>(
    type: 'now' | 'daily' | 'indices',
    locationId: string,
    data: T,
    suffix?: string
): void {
    try {
        const key = getCacheKey(type, locationId, suffix);
        const item: CacheItem<T> = {
            data,
            timestamp: Date.now(),
            locationId,
        };

        localStorage.setItem(key, JSON.stringify(item));
    } catch (error) {
        console.error('Failed to set cached data:', error);
    }
}

/**
 * Clear all QWeather cache
 */
export function clearQWeatherCache(): void {
    try {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    } catch (error) {
        console.error('Failed to clear cache:', error);
    }
}

/**
 * Clear cache for specific location
 */
export function clearLocationCache(locationId: string): void {
    try {
        ['now', 'daily', 'indices'].forEach(type => {
            const key = getCacheKey(type, locationId);
            localStorage.removeItem(key);
        });
    } catch (error) {
        console.error('Failed to clear location cache:', error);
    }
}
