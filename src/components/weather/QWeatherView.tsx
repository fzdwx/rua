import {Icon} from "@iconify/react";
import {Footer} from "@/command";
import {Button} from "@/components/ui/button";
import {Kbd, KbdGroup} from "@/components/ui/kbd";
import {WeatherConfig} from "@/hooks/useWeatherConfig.tsx";
import {
    fetchQWeatherDaily,
    fetchQWeatherIndices,
    fetchQWeatherNow,
    searchLocationId
} from "@/components/weather/hefeng/qweather.ts";

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

interface QWeatherViewProps {
    weatherData: QWeatherData;
    isDefaultCity?: boolean;
    onOpenSettings: () => void;
}

/**
 * Fetch weather data using QWeather API
 */
export async function getWeatherFromQWeather(location: string, config: WeatherConfig): Promise<QWeatherData> {
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
 * Get weather icon based on condition
 */
function getWeatherIcon(condition: string): string {
    const conditionLower = condition.toLowerCase();

    if (conditionLower.includes('sun') || conditionLower.includes('clear') || conditionLower.includes('晴')) return '☀️';
    if (conditionLower.includes('cloud') || conditionLower.includes('云') || conditionLower.includes('阴')) return '☁️';
    if (conditionLower.includes('rain') || conditionLower.includes('雨')) return '🌧️';
    if (conditionLower.includes('snow') || conditionLower.includes('雪')) return '❄️';
    if (conditionLower.includes('thunder') || conditionLower.includes('storm') || conditionLower.includes('雷')) return '⛈️';
    if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('雾') || conditionLower.includes('霾')) return '🌫️';
    if (conditionLower.includes('wind') || conditionLower.includes('风')) return '💨';

    return '🌤️';
}

/**
 * Weather view for QWeather provider
 * Displays detailed weather information including daily forecast and life indices
 */
export function QWeatherView({weatherData, isDefaultCity, onOpenSettings}: QWeatherViewProps) {
    return (
        <>
            <div className="p-3 overflow-y-auto">
                {/* Current weather card */}
                <div
                    className="p-4 rounded-lg border"
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
                                {isDefaultCity && (
                                    <div className="text-[10px] px-1.5 py-0.5 rounded" style={{
                                        color: 'var(--gray11)',
                                        background: 'var(--gray5)',
                                    }}>
                                        默认城市
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
                            <div style={{color: 'var(--gray11)'}}>湿度</div>
                            <div style={{color: 'var(--gray12)'}}>{weatherData.humidity}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Icon icon="tabler:temperature" style={{fontSize: "16px", color: 'var(--gray11)'}}/>
                            <div style={{color: 'var(--gray11)'}}>体感温度</div>
                            <div style={{color: 'var(--gray12)'}}>{weatherData.feelsLike}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Icon icon="tabler:wind" style={{fontSize: "16px", color: 'var(--gray11)'}}/>
                            <div style={{color: 'var(--gray11)'}}>风速</div>
                            <div style={{color: 'var(--gray12)'}}>{weatherData.windSpeed}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Icon icon="tabler:navigation" style={{fontSize: "16px", color: 'var(--gray11)'}}/>
                            <div style={{color: 'var(--gray11)'}}>风向</div>
                            <div style={{color: 'var(--gray12)'}}>{weatherData.windDir}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Icon icon="tabler:gauge" style={{fontSize: "16px", color: 'var(--gray11)'}}/>
                            <div style={{color: 'var(--gray11)'}}>气压</div>
                            <div style={{color: 'var(--gray12)'}}>{weatherData.pressure}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Icon icon="tabler:eye" style={{fontSize: "16px", color: 'var(--gray11)'}}/>
                            <div style={{color: 'var(--gray11)'}}>能见度</div>
                            <div style={{color: 'var(--gray12)'}}>{weatherData.vis}</div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Icon icon="tabler:umbrella" style={{fontSize: "16px", color: 'var(--gray11)'}}/>
                            <div style={{color: 'var(--gray11)'}}>降水量</div>
                            <div style={{color: 'var(--gray12)'}}>{weatherData.precip}</div>
                        </div>

                        {weatherData.cloud && (
                            <div className="flex items-center gap-2">
                                <Icon icon="tabler:cloud" style={{fontSize: "16px", color: 'var(--gray11)'}}/>
                                <div style={{color: 'var(--gray11)'}}>云量</div>
                                <div style={{color: 'var(--gray12)'}}>{weatherData.cloud}%</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Daily forecast */}
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
                                        {index === 0 ? '今天' : new Date(day.date).toLocaleDateString('zh-CN', {
                                            month: 'short',
                                            day: 'numeric'
                                        })}
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

                {/* Life indices */}
                {weatherData.indices && weatherData.indices.length > 0 && (
                    <div
                        className="p-4 my-2 rounded-lg border"
                        style={{
                            background: 'var(--gray3)',
                            borderColor: 'var(--gray6)',
                        }}
                    >
                        <div className="text-sm font-bold mb-3" style={{color: 'var(--gray12)'}}>
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
                        Powered by 和风天气
                    </div>
                )}
                rightElement={
                    <div className='flex items-center gap-3 pr-6'>
                        <Button
                            onClick={onOpenSettings}
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
