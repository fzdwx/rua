import {Icon} from "@iconify/react";
import {Footer} from "@/command";
import {Kbd, KbdGroup} from "@/components/ui/kbd";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
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
export function QWeatherView({weatherData, isDefaultCity}: QWeatherViewProps) {
    return (
        <>
            <div className="p-3 space-y-3 overflow-y-auto">
                {/* Current weather card */}
                <Card className="border-0" style={{background: 'var(--gray3)'}}>
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4 mb-4">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="text-5xl">{getWeatherIcon(weatherData.condition)}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h2 className="text-xl font-bold truncate" style={{color: 'var(--gray12)'}}>
                                            {weatherData.location}
                                        </h2>
                                        {isDefaultCity && (
                                            <Badge variant="secondary" className="text-[10px] h-5">
                                                默认城市
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-sm" style={{color: 'var(--gray11)'}}>
                                        {weatherData.condition}
                                    </p>
                                </div>
                            </div>

                            {/* Sunrise and Sunset */}
                            {weatherData.daily && weatherData.daily[0] && (
                                <div className="flex flex-col gap-2">
                                    {weatherData.daily[0].sunrise && (
                                        <div className="flex items-center gap-2">
                                            <Icon icon="tabler:sunrise" style={{fontSize: "16px", color: 'var(--orange11)'}} />
                                            <span className="text-xs tabular-nums" style={{color: 'var(--gray11)'}}>
                                                {weatherData.daily[0].sunrise}
                                            </span>
                                        </div>
                                    )}
                                    {weatherData.daily[0].sunset && (
                                        <div className="flex items-center gap-2">
                                            <Icon icon="tabler:sunset" style={{fontSize: "16px", color: 'var(--orange11)'}} />
                                            <span className="text-xs tabular-nums" style={{color: 'var(--gray11)'}}>
                                                {weatherData.daily[0].sunset}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="text-4xl font-bold mb-4" style={{color: 'var(--gray12)'}}>
                            {weatherData.temperature}
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <WeatherStat
                                icon="tabler:temperature"
                                label="体感温度"
                                value={weatherData.feelsLike}
                            />
                            <WeatherStat
                                icon="tabler:droplet"
                                label="湿度"
                                value={weatherData.humidity}
                            />
                            <WeatherStat
                                icon="tabler:wind"
                                label="风速"
                                value={weatherData.windSpeed}
                            />
                            <WeatherStat
                                icon="tabler:navigation"
                                label="风向"
                                value={weatherData.windDir}
                            />
                            <WeatherStat
                                icon="tabler:gauge"
                                label="气压"
                                value={weatherData.pressure}
                            />
                            <WeatherStat
                                icon="tabler:eye"
                                label="能见度"
                                value={weatherData.vis}
                            />
                            <WeatherStat
                                icon="tabler:umbrella"
                                label="降水量"
                                value={weatherData.precip}
                            />
                            {weatherData.cloud && (
                                <WeatherStat
                                    icon="tabler:cloud"
                                    label="云量"
                                    value={`${weatherData.cloud}%`}
                                />
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Daily forecast */}
                {weatherData.daily && weatherData.daily.length > 0 && (
                    <Card className="border-0" style={{background: 'var(--gray3)'}}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Icon icon="tabler:calendar" style={{fontSize: "16px"}} />
                                未来天气
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {weatherData.daily.map((day, index) => (
                                <div key={index}>
                                    {index > 0 && <Separator className="my-2" />}
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-xs min-w-[80px]" style={{color: 'var(--gray11)'}}>
                                            {index === 0 ? '今天' : new Date(day.date).toLocaleDateString('zh-CN', {
                                                month: 'short',
                                                day: 'numeric'
                                            })}
                                        </span>
                                        <span className="flex-1 px-3 text-xs" style={{color: 'var(--gray12)'}}>
                                            {day.textDay}
                                        </span>
                                        <span className="text-xs font-medium tabular-nums" style={{color: 'var(--gray12)'}}>
                                            {day.tempMin}° - {day.tempMax}°
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Life indices */}
                {weatherData.indices && weatherData.indices.length > 0 && (
                    <Card className="border-0" style={{background: 'var(--gray3)'}}>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Icon icon="tabler:bulb" style={{fontSize: "16px"}} />
                                生活指数
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {weatherData.indices.map((index, i) => (
                                <div key={i}>
                                    {i > 0 && <Separator className="my-3" />}
                                    <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium" style={{color: 'var(--gray11)'}}>
                                                {index.name}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] h-5"
                                                style={{
                                                    color: 'var(--blue11)',
                                                    background: 'var(--blue4)',
                                                }}
                                            >
                                                {index.category}
                                            </Badge>
                                        </div>
                                        <p className="text-xs leading-relaxed" style={{color: 'var(--gray12)'}}>
                                            {index.text}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
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
                    <div className='flex items-center gap-3 pr-6 flex-shrink-0'>
                        <div className="flex items-center gap-1.5 text-xs" style={{color: 'var(--gray11)'}}>
                            <Icon icon="tabler:settings" style={{fontSize: "20px"}}/>
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

/**
 * Weather stat component for displaying individual weather metrics
 */
function WeatherStat({icon, label, value}: {icon: string, label: string, value: string}) {
    return (
        <div className="flex items-center gap-2">
            <Icon icon={icon} style={{fontSize: "16px", color: 'var(--gray11)'}} />
            <span className="text-xs" style={{color: 'var(--gray11)'}}>{label}</span>
            <span className="text-xs font-medium ml-auto" style={{color: 'var(--gray12)'}}>{value}</span>
        </div>
    );
}
