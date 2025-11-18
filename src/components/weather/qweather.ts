/**
 * QWeather (和风天气) API client
 */

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
 */
export async function fetchQWeatherNow(
    locationId: string,
    config: QWeatherConfig
): Promise<QWeatherNowResponse> {
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

    return data;
}

/**
 * Fetch daily weather forecast from QWeather API
 * @param days - Number of days (3d, 7d, 10d, 15d, 30d)
 */
export async function fetchQWeatherDaily(
    locationId: string,
    days: "3d" | "7d" | "10d" | "15d" | "30d",
    config: QWeatherConfig
): Promise<QWeatherDailyResponse> {
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
 * @param days - Number of days (1d, 3d)
 * @param types - Comma-separated list of index types (e.g., "1,2,3")
 */
export async function fetchQWeatherIndices(
    locationId: string,
    days: "1d" | "3d",
    types: string,
    config: QWeatherConfig
): Promise<QWeatherIndicesResponse> {
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
 * Search location in china.csv data
 * For now, we'll use a simple search approach
 * TODO: Load and parse china.csv for accurate location matching
 */
export function searchLocationId(cityName: string): string | null {
    // Common city mappings
    const cityMap: Record<string, string> = {
        "北京": "101010100",
        "beijing": "101010100",
        "上海": "101020100",
        "shanghai": "101020100",
        "广州": "101280101",
        "guangzhou": "101280101",
        "深圳": "101280601",
        "shenzhen": "101280601",
        "成都": "101270101",
        "chengdu": "101270101",
        "杭州": "101210101",
        "hangzhou": "101210101",
        "武汉": "101200101",
        "wuhan": "101200101",
        "西安": "101110101",
        "xian": "101110101",
        "重庆": "101040100",
        "chongqing": "101040100",
        "青岛": "101120201",
        "qingdao": "101120201",
        "南京": "101190101",
        "nanjing": "101190101",
        "天津": "101030100",
        "tianjin": "101030100",
        "苏州": "101190401",
        "suzhou": "101190401",
        "郑州": "101180101",
        "zhengzhou": "101180101",
        "长沙": "101250101",
        "changsha": "101250101",
        "沈阳": "101070101",
        "shenyang": "101070101",
        "大连": "101070201",
        "dalian": "101070201",
        "厦门": "101230201",
        "xiamen": "101230201",
        "济南": "101120101",
        "jinan": "101120101",
        "哈尔滨": "101050101",
        "harbin": "101050101",
    };

    const key = cityName.toLowerCase().trim();
    return cityMap[key] || null;
}
