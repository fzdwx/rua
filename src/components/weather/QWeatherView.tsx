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
            daily: dailyData?.daily.slice(0, 7).map(day => ({
                date: day.fxDate,
                tempMax: day.tempMax,
                tempMin: day.tempMin,
                textDay: day.textDay,
                textNight: day.textNight,
                sunrise: day.sunrise,
                sunset: day.sunset,
                windDirDay: day.windDirDay,
                windScaleDay: day.windScaleDay,
                humidity: day.humidity,
                precip: day.precip,
                uvIndex: day.uvIndex,
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
            <div className="p-2.5 space-y-2.5 overflow-y-auto max-h-[calc(100vh-80px)]">
                {/* Current weather card */}
                <Card className="border-0" style={{background: 'var(--gray3)'}}>
                    <CardContent className="p-3">
                        {/* Header with location */}
                        <div className="flex items-center gap-2 mb-3">
                            <h2 className="text-lg font-bold" style={{color: 'var(--gray12)'}}>
                                {weatherData.location}
                            </h2>
                            {isDefaultCity && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                                    默认城市
                                </Badge>
                            )}
                        </div>

                        {/* Center section: icon, temperature, condition, sunrise/sunset */}
                        <div className="flex items-center justify-between mb-3">
                            {/* Left: Weather icon */}
                            <div className="text-5xl">
                                {getWeatherIcon(weatherData.condition)}
                            </div>

                            {/* Center: Temperature and condition */}
                            <div className="flex flex-col items-center">
                                <div className="text-4xl font-bold" style={{color: 'var(--gray12)'}}>
                                    {weatherData.temperature}
                                </div>
                                <p className="text-sm" style={{color: 'var(--gray11)'}}>
                                    {weatherData.condition}
                                </p>
                            </div>

                            {/* Right: Sunrise and Sunset */}
                            {weatherData.daily && weatherData.daily[0] && (
                                <div className="flex flex-col gap-1.5">
                                    {weatherData.daily[0].sunrise && (
                                        <div className="flex items-center gap-1.5">
                                            <Icon icon="tabler:sunrise" style={{fontSize: "14px", color: 'var(--orange11)'}} />
                                            <span className="text-[10px] tabular-nums" style={{color: 'var(--gray11)'}}>
                                                {weatherData.daily[0].sunrise}
                                            </span>
                                        </div>
                                    )}
                                    {weatherData.daily[0].sunset && (
                                        <div className="flex items-center gap-1.5">
                                            <Icon icon="tabler:sunset" style={{fontSize: "14px", color: 'var(--orange11)'}} />
                                            <span className="text-[10px] tabular-nums" style={{color: 'var(--gray11)'}}>
                                                {weatherData.daily[0].sunset}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <Separator className="my-2.5" />

                        <div className="grid grid-cols-4 gap-2 text-sm">
                            <WeatherStat
                                icon="tabler:temperature"
                                label="体感"
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
                                label="降水"
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
                        <CardHeader className="pb-2 pt-2.5 px-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Icon icon="tabler:calendar-week" style={{fontSize: "16px"}} />
                                7日天气预报
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="px-3 pb-2.5">
                            <div className="grid grid-cols-7 gap-1.5">
                                {weatherData.daily.map((day, index) => (
                                    <DailyWeatherCard key={index} day={day} index={index} />
                                ))}
                            </div>
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
        <div className="flex items-center gap-1.5">
            <Icon icon={icon} style={{fontSize: "14px", color: 'var(--gray11)'}} />
            <div className="flex flex-col">
                <span className="text-[10px]" style={{color: 'var(--gray10)'}}>{label}</span>
                <span className="text-xs font-medium" style={{color: 'var(--gray12)'}}>{value}</span>
            </div>
        </div>
    );
}

/**
 * Daily weather card component for displaying forecast day
 */
function DailyWeatherCard({day, index}: {
    day: {
        date: string;
        tempMax: string;
        tempMin: string;
        textDay: string;
        textNight: string;
        windDirDay: string;
        windScaleDay: string;
        humidity: string;
        precip: string;
        uvIndex: string;
    };
    index: number;
}) {
    const date = new Date(day.date);
    const dayName = index === 0 ? '今天' :
                    index === 1 ? '明天' :
                    ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];
    const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

    const getUVLevel = (uvIndex: string) => {
        const uv = parseInt(uvIndex);
        if (uv <= 2) return { text: '低', color: 'var(--green11)' };
        if (uv <= 5) return { text: '中', color: 'var(--yellow11)' };
        if (uv <= 7) return { text: '高', color: 'var(--orange11)' };
        if (uv <= 10) return { text: '很高', color: 'var(--red11)' };
        return { text: '极高', color: 'var(--purple11)' };
    };

    const uvLevel = getUVLevel(day.uvIndex);

    return (
        <div
            className="flex flex-col items-center p-1.5 rounded border border-border/40 hover:border-border transition-colors"
            style={{background: 'var(--gray2)'}}
        >
            {/* Date */}
            <div className="text-center mb-1">
                <div className="text-[10px] font-medium" style={{color: 'var(--gray12)'}}>
                    {dayName}
                </div>
                <div className="text-[9px]" style={{color: 'var(--gray11)'}}>
                    {dateStr}
                </div>
            </div>

            {/* Weather icon */}
            <div className="text-3xl mb-1">
                {getWeatherIcon(day.textDay)}
            </div>

            {/* Temperature */}
            <div className="text-center mb-1">
                <div className="text-sm font-bold tabular-nums" style={{color: 'var(--gray12)'}}>
                    {day.tempMax}°
                </div>
                <div className="text-xs tabular-nums" style={{color: 'var(--gray11)'}}>
                    {day.tempMin}°
                </div>
            </div>

            {/* Weather condition */}
            <div className="text-[10px] text-center mb-1 leading-tight px-0.5" style={{color: 'var(--gray11)'}}>
                {day.textDay.length > 4 ? day.textDay.substring(0, 4) : day.textDay}
            </div>

            {/* Additional info */}
            <div className="w-full space-y-0.5 pt-1 border-t border-border/30">
                {/* UV Index */}
                <div className="flex items-center justify-between text-[9px]">
                    <span style={{color: 'var(--gray10)'}}>紫外线</span>
                    <span style={{color: uvLevel.color}}>{uvLevel.text}</span>
                </div>

                {/* Precipitation - only if non-zero */}
                {parseFloat(day.precip) > 0 && (
                    <div className="flex items-center justify-between text-[9px]">
                        <span style={{color: 'var(--gray10)'}}>降水</span>
                        <span style={{color: 'var(--blue11)'}}>{day.precip}mm</span>
                    </div>
                )}

                {/* Humidity */}
                <div className="flex items-center justify-between text-[9px]">
                    <span style={{color: 'var(--gray10)'}}>湿度</span>
                    <span style={{color: 'var(--gray11)'}}>{day.humidity}%</span>
                </div>
            </div>
        </div>
    );
}
