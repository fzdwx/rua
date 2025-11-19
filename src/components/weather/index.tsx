import * as React from "react";
import {Action, ActionId, Footer} from "@/command";
import {Icon} from "@iconify/react";
import {useWeatherConfig, WeatherConfig} from "@/hooks/useWeatherConfig";
import {WeatherSettings} from "./WeatherSettings";
import {getWeatherFromWttr, WttrWeatherView} from "./WttrWeatherView";
import {getWeatherFromQWeather, QWeatherView} from "./QWeatherView";
import {Kbd, KbdGroup} from "@/components/ui/kbd";
import {useKeyPress} from "ahooks";

interface WeatherViewProps {
    search: string;
    onLoadingChange?: (loading: boolean) => void;
    onRequestFocusInput?: () => void;  // Request to focus main input
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
        textNight: string;
        sunrise?: string;
        sunset?: string;
        windDirDay: string;
        windScaleDay: string;
        humidity: string;
        precip: string;
        uvIndex: string;
    }>;
    indices?: Array<{
        name: string;
        category: string;
        text: string;
    }>;
}

export type WeatherData = WttrWeatherData | QWeatherData;

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

export function WeatherView({search, onLoadingChange, onRequestFocusInput}: WeatherViewProps) {
    const [weatherData, setWeatherData] = React.useState<WeatherData | null>(null);
    const [isCurrentLocation, setIsCurrentLocation] = React.useState(false);
    const [showSettings, setShowSettings] = React.useState(false);
    const {config} = useWeatherConfig();

    // Add keyboard shortcut to open settings (Ctrl+k)
    useKeyPress(['ctrl.k'], (e) => {
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
        return <WeatherSettings onClose={() => {
            setShowSettings(false);
            onRequestFocusInput?.();
        }} />;
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
                            <div className="flex items-center gap-1.5 text-xs" style={{color: 'var(--gray11)'}}>
                                <span>设置</span>
                                <KbdGroup className="gap-1">
                                    <Kbd>Ctrl</Kbd>
                                    <Kbd>K</Kbd>
                                </KbdGroup>
                            </div>
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
