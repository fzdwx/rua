import * as React from "react";
import {Action, ActionId, Footer} from "@/command";
import {Icon} from "@iconify/react";
import {useWeatherConfig, WeatherConfig} from "@/hooks/useWeatherConfig";
import {
    fetchQWeatherNow,
    fetchQWeatherDaily,
    fetchQWeatherIndices,
    searchLocationId,
} from "./qweather";
import {WeatherSettings} from "./WeatherSettings";
import {Button} from "@/components/ui/button";
import {useKeyPress} from "ahooks";
import {Kbd, KbdGroup} from "@/components/ui/kbd";

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
    // Extended data for QWeather
    daily?: Array<{
        date: string;
        tempMax: string;
        tempMin: string;
        textDay: string;
        sunrise?: string;
        sunset?: string;
    }>;
    indices?: Array<{
        name: string;
        category: string;
        text: string;
    }>;
}

/**
 * Fetch weather data using wttr.in API
 * If location is empty, it will auto-detect location based on IP
 */
async function getWeatherFromWttr(location?: string): Promise<WeatherData> {
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
        console.error("Wttr.in fetch error:", error);
        throw new Error("Failed to fetch weather data from wttr.in");
    }
}

/**
 * Fetch weather data using QWeather API
 */
async function getWeatherFromQWeather(location: string, config: WeatherConfig): Promise<WeatherData> {
    try {
        if (!config.qweather) {
            throw new Error("QWeather configuration not found");
        }

        // Search for location ID
        const locationId = searchLocationId(location);
        if (!locationId) {
            throw new Error(`无法找到城市 "${location}" 的ID，请检查城市名称`);
        }

        // Fetch current weather, daily forecast, and indices in parallel
        const [nowData, dailyData, indicesData] = await Promise.all([
            fetchQWeatherNow(locationId, config.qweather),
            fetchQWeatherDaily(locationId, "7d", config.qweather).catch(() => null),
            fetchQWeatherIndices(locationId, "1d", "1,2,3,5,8,9", config.qweather).catch(() => null),
        ]);

        return {
            location: location,
            temperature: `${nowData.now.temp}°C`,
            condition: nowData.now.text,
            humidity: `${nowData.now.humidity}%`,
            windSpeed: `${nowData.now.windSpeed} km/h`,
            feelsLike: `${nowData.now.feelsLike}°C`,
            uvIndex: "-", // UV index is not available in now API
            daily: dailyData?.daily.slice(0, 5).map(day => ({
                date: day.fxDate,
                tempMax: day.tempMax,
                tempMin: day.tempMin,
                textDay: day.textDay,
                sunrise: day.sunrise,
                sunset: day.sunset,
            })),
            indices: indicesData?.daily.map(index => ({
                name: index.name,
                category: index.category,
                text: index.text,
            })),
        };
    } catch (error) {
        console.error("QWeather fetch error:", error);
        throw error;
    }
}

/**
 * Fetch weather data based on configuration
 */
async function getWeather(location?: string, config?: WeatherConfig): Promise<WeatherData> {
    if (config?.provider === "qweather" && config.qweather) {
        // QWeather requires a location
        if (!location) {
            throw new Error("和风天气需要输入城市名称");
        }
        return getWeatherFromQWeather(location, config);
    } else {
        // Default to wttr.in
        return getWeatherFromWttr(location);
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
        query: false,  // Enable query input for this action
        usageCount: weatherUsageCount,
        badge: "Command",
        perform: () => {
            incrementUsage(weatherId);
        },
    };
}

export function WeatherView({search, onLoadingChange}: WeatherViewProps) {
    const [weatherData, setWeatherData] = React.useState<WeatherData | null>(null);
    const [isCurrentLocation, setIsCurrentLocation] = React.useState(false);
    const [showSettings, setShowSettings] = React.useState(false);
    const {config} = useWeatherConfig();

    // Add keyboard shortcut to open settings (Ctrl+,)
    useKeyPress('ctrl.,', (e) => {
        e.preventDefault();
        setShowSettings(true);
    });

    // Fetch weather data
    React.useEffect(() => {
        // Start loading
        onLoadingChange?.(true);

        // If search is empty and it's initial load, get weather based on IP
        // Otherwise, get weather for the specified location
        const location = search.trim() || undefined;
        const isAutoDetect = !location;

        let cancelled = false;
        getWeather(location, config)
            .then((data) => {
                if (!cancelled) {
                    setWeatherData(data);
                    setIsCurrentLocation(isAutoDetect);
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
                        error: error.message || (location
                            ? "Failed to fetch weather data. Please check the location name."
                            : "Failed to auto-detect your location. Please enter a city name."),
                    });
                    setIsCurrentLocation(false);
                    onLoadingChange?.(false);
                }
            });

        return () => {
            cancelled = true;
            onLoadingChange?.(false);
        };
    }, [search, onLoadingChange, config]);

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
            <>
                <div className="p-3 overflow-y-auto max-h-[calc(100vh-120px)]">
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

                <Footer
                    current={null}
                    icon={<Icon icon="tabler:cloud" style={{fontSize: "20px"}}/>}
                    actions={() => []}
                    content={() => <div/>}
                    rightElement={
                        <div className='flex items-center gap-3 pr-6'>
                            <Button
                                onClick={() => setShowSettings(true)}
                                variant="outline"
                                size="sm"
                            >
                                <Icon icon="tabler:settings" className="mr-1" style={{fontSize: "14px"}}/>
                                设置
                                <KbdGroup>
                                    <Kbd>Ctrl</Kbd>
                                    <Kbd>,</Kbd>
                                </KbdGroup>
                            </Button>
                        </div>
                    }
                />
            </>
        );
    }

    // Show settings view
    if (showSettings) {
        return <WeatherSettings onClose={() => setShowSettings(false)} />;
    }

    return (
        <>
            <div className="p-3 overflow-y-auto max-h-[calc(100vh-120px)]">
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
                                {isCurrentLocation && (
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

            {/* Daily forecast (QWeather only) */}
            {weatherData.daily && weatherData.daily.length > 0 && (
                <div
                    className="p-4 my-2 rounded-lg border"
                    style={{
                        background: 'var(--gray3)',
                        borderColor: 'var(--gray6)',
                    }}
                >
                    <div className="text-sm font-bold mb-3" style={{color: 'var(--gray12)'}}>
                        未来天气
                    </div>
                    <div className="space-y-2">
                        {weatherData.daily.map((day, index) => (
                            <div key={index} className="flex items-center justify-between text-xs">
                                <div style={{color: 'var(--gray11)', minWidth: '80px'}}>
                                    {index === 0 ? '今天' : new Date(day.date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
                                </div>
                                <div className="flex-1 px-2" style={{color: 'var(--gray12)'}}>
                                    {day.textDay}
                                </div>
                                <div style={{color: 'var(--gray12)', fontWeight: '500'}}>
                                    {day.tempMin}° - {day.tempMax}°
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Life indices (QWeather only) */}
            {weatherData.indices && weatherData.indices.length > 0 && (
                <div
                    className="p-4 my-2 rounded-lg border"
                    style={{
                        background: 'var(--gray3)',
                        borderColor: 'var(--gray6)',
                    }}
                >
                    <div className="text-sm font-bold " style={{color: 'var(--gray12)'}}>
                        生活指数
                    </div>
                    <div className="space-y-3">
                        {weatherData.indices.map((index, i) => (
                            <div key={i} className="text-xs">
                                <div className="flex items-center justify-between mb-1">
                                    <div style={{color: 'var(--gray11)'}}>{index.name}</div>
                                    <div
                                        className="px-2 py-0.5 rounded text-[10px]"
                                        style={{
                                            color: 'var(--blue11)',
                                            background: 'var(--blue4)',
                                        }}
                                    >
                                        {index.category}
                                    </div>
                                </div>
                                <div style={{color: 'var(--gray12)', lineHeight: '1.4'}}>
                                    {index.text}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>

        <Footer
            current={null}
            icon={<Icon icon="tabler:cloud" style={{fontSize: "20px"}}/>}
            actions={() => []}
            content={() => (
                <div className="text-[11px] text-center" style={{color: 'var(--gray10)'}}>
                    Powered by {config.provider === "qweather" ? "和风天气" : "wttr.in"}
                </div>
            )}
            rightElement={
                <div className='flex items-center gap-3 pr-6'>
                    <Button
                        onClick={() => setShowSettings(true)}
                        variant="outline"
                        size="sm"
                    >
                        <Icon icon="tabler:settings" className="mr-1" style={{fontSize: "14px"}}/>
                        设置
                        <KbdGroup>
                            <Kbd>Ctrl</Kbd>
                            <Kbd>,</Kbd>
                        </KbdGroup>
                    </Button>
                </div>
            }
        />
    </>
    );
}
