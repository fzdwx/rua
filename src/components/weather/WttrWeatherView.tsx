import {Icon} from "@iconify/react";
import {Footer} from "@/command";
import {Kbd, KbdGroup} from "@/components/ui/kbd";
import {Card, CardContent} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Separator} from "@/components/ui/separator";
import {WeatherData} from "@/components/weather/index.tsx";

interface WttrWeatherData {
    location: string;
    temperature: string;
    condition: string;
    humidity: string;
    windSpeed: string;
    feelsLike: string;
    uvIndex: string;
}

interface WttrWeatherViewProps {
    weatherData: WttrWeatherData;
    isCurrentLocation: boolean;
    onOpenSettings: () => void;
}

/**
 * Fetch weather data using wttr.in API
 * If location is empty, it will auto-detect location based on IP
 */
export async function getWeatherFromWttr(location?: string): Promise<WeatherData> {
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

/**
 * Weather view for wttr.in provider
 * Displays basic weather information
 */
export function WttrWeatherView({weatherData, isCurrentLocation}: WttrWeatherViewProps) {
    return (
        <>
            <div className="p-3 space-y-3 overflow-y-auto flex-1">
                {/* Weather card */}
                <Card className="border-0 bg-gray-3">
                    <CardContent className="p-4">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="text-5xl">{getWeatherIcon(weatherData.condition)}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-xl font-bold truncate text-gray-12">
                                        {weatherData.location}
                                    </h2>
                                    {isCurrentLocation && (
                                        <Badge variant="secondary" className="text-[10px] h-5">
                                            当前位置
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-11">
                                    {weatherData.condition}
                                </p>
                            </div>
                        </div>

                        <div className="text-4xl font-bold mb-4 text-gray-12">
                            {weatherData.temperature}
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <WeatherStat
                                icon="tabler:droplet"
                                label="Humidity"
                                value={weatherData.humidity}
                            />
                            <WeatherStat
                                icon="tabler:wind"
                                label="Wind"
                                value={weatherData.windSpeed}
                            />
                            <WeatherStat
                                icon="tabler:temperature"
                                label="Feels like"
                                value={weatherData.feelsLike}
                            />
                            <WeatherStat
                                icon="tabler:sun"
                                label="UV Index"
                                value={weatherData.uvIndex}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Footer
                current={null}
                icon={<Icon icon="tabler:cloud" style={{fontSize: "20px"}}/>}
                actions={() => []}
                content={() => (
                    <div className="text-[11px] text-center text-gray-10">
                        Powered by wttr.in
                    </div>
                )}
                rightElement={
                    <div className='flex items-center gap-3 pr-6 flex-shrink-0'>
                        <div className="flex items-center gap-1.5 text-xs text-gray-11">
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

/**
 * Weather stat component for displaying individual weather metrics
 */
function WeatherStat({icon, label, value}: {icon: string, label: string, value: string}) {
    return (
        <div className="flex items-center gap-2">
            <Icon icon={icon} className="text-gray-11" style={{fontSize: "16px"}} />
            <span className="text-xs text-gray-11">{label}</span>
            <span className="text-xs font-medium ml-auto text-gray-12">{value}</span>
        </div>
    );
}
