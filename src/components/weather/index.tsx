import * as React from "react";
import {Action, ActionId, Footer} from "@/command";
import {Icon} from "@iconify/react";
import {useWeatherConfig, WeatherConfig} from "@/hooks/useWeatherConfig";
import {
    fetchQWeatherNow,
    fetchQWeatherDaily,
    fetchQWeatherIndices,
    searchLocationId,
} from "./hefeng/qweather.ts";
import {WeatherSettings} from "./WeatherSettings";
import {WttrWeatherView} from "./WttrWeatherView";
import {QWeatherView} from "./QWeatherView";
import {Button} from "@/components/ui/button";
import {Kbd, KbdGroup} from "@/components/ui/kbd";
import {useKeyPress} from "ahooks";

interface WeatherViewProps {
    search: string;
    onLoadingChange?: (loading: boolean) => void;
}

// Weather data for wttr.in provider
interface WttrWeatherData {
    location: string;
    temperature: string;
    condition: string;
    humidity: string;
    windSpeed: string;
    feelsLike: string;
    uvIndex: string;
    error?: string;
}

// Weather data for QWeather provider
interface QWeatherData {
    location: string;
    temperature: string;
    condition: string;
    humidity: string;
    windSpeed: string;
    windDir: string;
    feelsLike: string;
    pressure: string;
    vis: string;
    precip: string;
    cloud?: string;
    error?: string;
    // Extended data
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

type WeatherData = WttrWeatherData | QWeatherData;

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
async function getWeatherFromQWeather(location: string, config: WeatherConfig): Promise<QWeatherData> {
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
            windDir: nowData.now.windDir,
            feelsLike: `${nowData.now.feelsLike}°C`,
            pressure: `${nowData.now.pressure} hPa`,
            vis: `${nowData.now.vis} km`,
            precip: `${nowData.now.precip} mm`,
            cloud: nowData.now.cloud,
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
    useKeyPress(['ctrl.,', 'meta.,'], (e) => {
        e.preventDefault();
        setShowSettings(true);
    });

    // Fetch weather data
    React.useEffect(() => {
        // Start loading
        onLoadingChange?.(true);

        // Determine location to query
        let location = search.trim() || undefined;
        let isAutoDetect = false;

        // If no location specified and using QWeather, use default city
        if (!location && config.provider === "qweather" && config.qweather?.defaultCity) {
            location = config.qweather.defaultCity;
            isAutoDetect = true;
        } else if (!location && config.provider === "wttr") {
            // For wttr.in, undefined means auto-detect by IP
            isAutoDetect = true;
        }

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

    // Show settings view
    if (showSettings) {
        return <WeatherSettings onClose={() => setShowSettings(false)} />;
    }

    // Show error if weather fetch failed
    if (weatherData.error) {
        return (
            <>
                <div className="p-3 overflow-y-auto ">
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
                                    <Kbd>k</Kbd>
                                </KbdGroup>
                            </Button>
                        </div>
                    }
                />
            </>
        );
    }

    // Render appropriate view based on provider
    if (config.provider === "qweather") {
        // Type guard to check if weatherData is QWeatherData
        if ('windDir' in weatherData && 'pressure' in weatherData) {
            return (
                <QWeatherView
                    weatherData={weatherData}
                    isDefaultCity={isCurrentLocation}
                    onOpenSettings={() => setShowSettings(true)}
                />
            );
        }
    }

    // Default to wttr view (or if type guard fails)
    if ('uvIndex' in weatherData) {
        return (
            <WttrWeatherView
                weatherData={weatherData}
                isCurrentLocation={isCurrentLocation}
                onOpenSettings={() => setShowSettings(true)}
            />
        );
    }

    // Fallback - should not happen
    return null;
}
