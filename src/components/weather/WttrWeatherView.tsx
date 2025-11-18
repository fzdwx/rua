import {Icon} from "@iconify/react";
import {Footer} from "@/command";
import {Button} from "@/components/ui/button";
import {Kbd, KbdGroup} from "@/components/ui/kbd";

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
export function WttrWeatherView({weatherData, isCurrentLocation, onOpenSettings}: WttrWeatherViewProps) {
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
            </div>

            <Footer
                current={null}
                icon={<Icon icon="tabler:cloud" style={{fontSize: "20px"}}/>}
                actions={() => []}
                content={() => (
                    <div className="text-[11px] text-center" style={{color: 'var(--gray10)'}}>
                        Powered by wttr.in
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
                                <Kbd>,</Kbd>
                            </KbdGroup>
                        </Button>
                    </div>
                }
            />
        </>
    );
}
