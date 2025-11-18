/**
 * QWeather (和风天气) API client
 */

import { cityLocationMap } from "./china-cities.ts";
import { getCachedData, setCachedData } from "./qweather-cache.ts";

export interface QWeatherNowResponse {
    code: string;
    now: {
        temp: string;
        feelsLike: string;
        text: string;
        windDir: string;
        windSpeed: string;
        humidity: string;
        vis: string;
        pressure: string;
        precip: string;
        cloud?: string;
        dew?: string;
    };
}

export interface QWeatherDailyResponse {
    code: string;
    daily: Array<{
        fxDate: string;
        sunrise: string;
        sunset: string;
        tempMax: string;
        tempMin: string;
        textDay: string;
        textNight: string;
        windDirDay: string;
        windScaleDay: string;
        windSpeedDay: string;
        humidity: string;
        precip: string;
        pressure: string;
        uvIndex: string;
    }>;
}

export interface QWeatherSunResponse {
    code: string;
    sunrise: string;
    sunset: string;
}

export interface QWeatherIndicesResponse {
    code: string;
    daily: Array<{
        date: string;
        type: string;
        name: string;
        level: string;
        category: string;
        text: string;
    }>;
}

export interface QWeatherConfig {
    apiKey: string;
    apiUrl: string;
}

/**
 * Fetch current weather from QWeather API
 * Uses cache to reduce API calls (10 min cache)
 */
export async function fetchQWeatherNow(
    locationId: string,
    config: QWeatherConfig
): Promise<QWeatherNowResponse> {
    // Check cache first
    const cached = getCachedData<QWeatherNowResponse>('now', locationId);
    if (cached) {
        return cached;
    }

    // Fetch from API
    const url = `${config.apiUrl}/v7/weather/now?location=${locationId}`;

    const response = await fetch(url, {
        headers: {
            'X-QW-Api-Key': config.apiKey,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "200") {
        throw new Error(`QWeather API error: ${data.code}`);
    }

    // Cache the result
    setCachedData('now', locationId, data);

    return data;
}

/**
 * Fetch daily weather forecast from QWeather API
 * Uses cache to reduce API calls (1 hour cache)
 * @param days - Number of days (3d, 7d, 10d, 15d, 30d)
 */
export async function fetchQWeatherDaily(
    locationId: string,
    days: "3d" | "7d" | "10d" | "15d" | "30d",
    config: QWeatherConfig
): Promise<QWeatherDailyResponse> {
    // Check cache first
    const cached = getCachedData<QWeatherDailyResponse>('daily', locationId, days);
    if (cached) {
        return cached;
    }

    // Fetch from API
    const url = `${config.apiUrl}/v7/weather/${days}?location=${locationId}`;

    const response = await fetch(url, {
        headers: {
            'X-QW-Api-Key': config.apiKey,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "200") {
        throw new Error(`QWeather API error: ${data.code}`);
    }

    // Cache the result
    setCachedData('daily', locationId, data, days);

    return data;
}

/**
 * Fetch sunrise and sunset times from QWeather API
 * @param date - Date in format yyyyMMdd
 */
export async function fetchQWeatherSun(
    locationId: string,
    date: string,
    config: QWeatherConfig
): Promise<QWeatherSunResponse> {
    const url = `${config.apiUrl}/v7/astronomy/sun?location=${locationId}&date=${date}`;

    const response = await fetch(url, {
        headers: {
            'X-QW-Api-Key': config.apiKey,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "200") {
        throw new Error(`QWeather API error: ${data.code}`);
    }

    return data;
}

/**
 * Fetch weather indices from QWeather API
 * Uses cache to reduce API calls (6 hour cache)
 * @param days - Number of days (1d, 3d)
 * @param types - Comma-separated list of index types (e.g., "1,2,3")
 */
export async function fetchQWeatherIndices(
    locationId: string,
    days: "1d" | "3d",
    types: string,
    config: QWeatherConfig
): Promise<QWeatherIndicesResponse> {
    // Check cache first
    const cacheKey = `${days}_${types}`;
    const cached = getCachedData<QWeatherIndicesResponse>('indices', locationId, cacheKey);
    if (cached) {
        return cached;
    }

    // Fetch from API
    const url = `${config.apiUrl}/v7/indices/${days}?location=${locationId}&type=${types}`;

    const response = await fetch(url, {
        headers: {
            'X-QW-Api-Key': config.apiKey,
        },
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.code !== "200") {
        throw new Error(`QWeather API error: ${data.code}`);
    }

    // Cache the result
    setCachedData('indices', locationId, data, cacheKey);

    return data;
}

/**
 * Get current date in yyyyMMdd format
 */
export function getTodayDate(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

/**
 * Search location ID by city name
 * Supports Chinese names, pinyin, and English names
 * Uses comprehensive china.csv data with 3578 cities and 6689 name mappings
 */
export function searchLocationId(cityName: string): string | null {
    const key = cityName.toLowerCase().trim();
    return cityLocationMap[key] || null;
}
