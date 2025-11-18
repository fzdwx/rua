import * as React from "react";
import {Action, ActionId} from "@/command";
import {Icon} from "@iconify/react";

interface WeatherViewProps {
    search: string;
    onLoadingChange?: (loading: boolean) => void;
}

interface WeatherData {
    location: string;
    temperature: string;
    condition: string;
    humidity: string;
    windSpeed: string;
    feelsLike: string;
    uvIndex: string;
    error?: string;
}

/**
 * Fetch weather data using wttr.in API
 * If location is empty, it will auto-detect location based on IP
 */
async function getWeather(location?: string): Promise<WeatherData> {
    try {
        // Use wttr.in API which doesn't require API key
        // If no location provided, wttr.in will auto-detect based on IP
        const url = location
            ? `https://wttr.in/${encodeURIComponent(location)}?format=j1`
            : `https://wttr.in/?format=j1`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        const current = data.current_condition[0];
        const nearest = data.nearest_area[0];

        return {
            location: `${nearest.areaName[0].value}, ${nearest.country[0].value}`,
            temperature: `${current.temp_C}°C / ${current.temp_F}°F`,
            condition: current.weatherDesc[0].value,
            humidity: `${current.humidity}%`,
            windSpeed: `${current.windspeedKmph} km/h`,
            feelsLike: `${current.FeelsLikeC}°C / ${current.FeelsLikeF}°F`,
            uvIndex: current.uvIndex,
        };
    } catch (error) {
        console.error("Weather fetch error:", error);
        throw new Error("Failed to fetch weather data");
    }
}

/**
 * Get weather icon based on condition
 */
function getWeatherIcon(condition: string): string {
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('sun') || conditionLower.includes('clear')) return '☀️';
    if (conditionLower.includes('cloud')) return '☁️';
    if (conditionLower.includes('rain')) return '🌧️';
    if (conditionLower.includes('snow')) return '❄️';
    if (conditionLower.includes('thunder') || conditionLower.includes('storm')) return '⛈️';
    if (conditionLower.includes('fog') || conditionLower.includes('mist')) return '🌫️';
    if (conditionLower.includes('wind')) return '💨';

    return '🌤️';
}

export const weatherId = "built-in-weather";

export function getWeatherAction(getUsageCount: (actionId: ActionId) => number, incrementUsage: (actionId: ActionId) => void): Action {
    const weatherUsageCount = getUsageCount(weatherId);
    return {
        id: weatherId,
        name: "天气",
        subtitle: "查看当前位置天气，或输入城市名查询",
        keywords: "weather,天气,climate,temperature,tianqi",
        icon: <div style={{fontSize: "20px"}}>🌤️</div>,
        kind: "built-in",
        query: true,  // Enable query input for this action
        usageCount: weatherUsageCount,
        badge: "Command",
        perform: () => {
            incrementUsage(weatherId);
        },
    };
}

export function WeatherView({search, onLoadingChange}: WeatherViewProps) {
    const [weatherData, setWeatherData] = React.useState<WeatherData | null>(null);

    // Fetch weather data
    React.useEffect(() => {
        // Start loading
        onLoadingChange?.(true);

        // If search is empty and it's initial load, get weather based on IP
        // Otherwise, get weather for the specified location
        const location = search.trim() || undefined;

        let cancelled = false;
        getWeather(location)
            .then((data) => {
                if (!cancelled) {
                    setWeatherData(data);
                    onLoadingChange?.(false);
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    console.error("Weather fetch failed:", error);
                    setWeatherData({
                        location: location || "Unknown",
                        temperature: "",
                        condition: "",
                        humidity: "",
                        windSpeed: "",
                        feelsLike: "",
                        uvIndex: "",
                        error: location
                            ? "Failed to fetch weather data. Please check the location name."
                            : "Failed to auto-detect your location. Please enter a city name.",
                    });
                    onLoadingChange?.(false);
                }
            });

        return () => {
            cancelled = true;
            onLoadingChange?.(false);
        };
    }, [search, onLoadingChange]);

    if (!weatherData) {
        return (
            <div className="py-10 px-5 text-center text-sm" style={{color: 'var(--gray11)'}}>
                <div className="text-2xl mb-2">🌤️</div>
                <div>Loading weather data...</div>
            </div>
        );
    }

    // Show error if weather fetch failed
    if (weatherData.error) {
        return (
            <div className="p-3">
                <div
                    className="p-4 my-2 rounded-lg border"
                    style={{
                        background: 'var(--gray3)',
                        borderColor: 'var(--gray6)',
                    }}
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="text-2xl">⚠️</div>
                        <div className="text-xs" style={{color: 'var(--gray11)'}}>
                            Weather Error
                        </div>
                    </div>

                    <div className="text-sm font-semibold mb-2" style={{color: 'var(--gray12)'}}>
                        {weatherData.error}
                    </div>

                    <div className="text-[13px] mt-2" style={{color: 'var(--gray11)'}}>
                        Location: {weatherData.location}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-3">
            {/* Weather card */}
            <div
                className="p-4 my-2 rounded-lg border"
                style={{
                    background: 'var(--gray3)',
                    borderColor: 'var(--gray6)',
                }}
            >
                <div className="flex items-center gap-3 mb-3">
                    <div className="text-3xl">{getWeatherIcon(weatherData.condition)}</div>
                    <div className="flex-1">
                        <div className="text-lg font-bold" style={{color: 'var(--gray12)'}}>
                            {weatherData.location}
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="text-xs" style={{color: 'var(--gray11)'}}>
                                {weatherData.condition}
                            </div>
                            {!search.trim() && (
                                <div className="text-[10px] px-1.5 py-0.5 rounded" style={{
                                    color: 'var(--gray11)',
                                    background: 'var(--gray5)',
                                }}>
                                    当前位置
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-3xl font-bold mb-4" style={{color: 'var(--gray12)'}}>
                    {weatherData.temperature}
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                        <Icon icon="tabler:droplet" style={{fontSize: "16px", color: 'var(--gray11)'}}/>
                        <div style={{color: 'var(--gray11)'}}>Humidity</div>
                        <div style={{color: 'var(--gray12)'}}>{weatherData.humidity}</div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Icon icon="tabler:wind" style={{fontSize: "16px", color: 'var(--gray11)'}}/>
                        <div style={{color: 'var(--gray11)'}}>Wind</div>
                        <div style={{color: 'var(--gray12)'}}>{weatherData.windSpeed}</div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Icon icon="tabler:temperature" style={{fontSize: "16px", color: 'var(--gray11)'}}/>
                        <div style={{color: 'var(--gray11)'}}>Feels like</div>
                        <div style={{color: 'var(--gray12)'}}>{weatherData.feelsLike}</div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Icon icon="tabler:sun" style={{fontSize: "16px", color: 'var(--gray11)'}}/>
                        <div style={{color: 'var(--gray11)'}}>UV Index</div>
                        <div style={{color: 'var(--gray12)'}}>{weatherData.uvIndex}</div>
                    </div>
                </div>
            </div>

            <div
                className="text-[11px] mt-2 text-center"
                style={{color: 'var(--gray10)'}}
            >
                Powered by wttr.in
            </div>
        </div>
    );
}
