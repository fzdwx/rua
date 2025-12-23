import { Icon } from "@iconify/react";
import { Footer } from "@fzdwx/ruaui";
import { Kbd } from "@fzdwx/ruaui";
import { Card, CardContent, CardHeader, CardTitle } from "@fzdwx/ruaui";
import { Badge } from "@fzdwx/ruaui";
import { Separator } from "@fzdwx/ruaui";
import { WeatherConfig } from "@/hooks/useWeatherConfig.tsx";
import {
  fetchQWeatherDaily,
  fetchQWeatherIndices,
  fetchQWeatherNow,
  searchLocationId,
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
export async function getWeatherFromQWeather(
  location: string,
  config: WeatherConfig
): Promise<QWeatherData> {
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
      daily: dailyData?.daily.slice(0, 7).map((day) => ({
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
      indices: indicesData?.daily.map((index) => ({
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

  if (
    conditionLower.includes("sun") ||
    conditionLower.includes("clear") ||
    conditionLower.includes("晴")
  )
    return "☀️";
  if (
    conditionLower.includes("cloud") ||
    conditionLower.includes("云") ||
    conditionLower.includes("阴")
  )
    return "☁️";
  if (conditionLower.includes("rain") || conditionLower.includes("雨")) return "🌧️";
  if (conditionLower.includes("snow") || conditionLower.includes("雪")) return "❄️";
  if (
    conditionLower.includes("thunder") ||
    conditionLower.includes("storm") ||
    conditionLower.includes("雷")
  )
    return "⛈️";
  if (
    conditionLower.includes("fog") ||
    conditionLower.includes("mist") ||
    conditionLower.includes("雾") ||
    conditionLower.includes("霾")
  )
    return "🌫️";
  if (conditionLower.includes("wind") || conditionLower.includes("风")) return "💨";

  return "🌤️";
}

/**
 * Weather view for QWeather provider
 * Displays detailed weather information including daily forecast and life indices
 */
export function QWeatherView({ weatherData, isDefaultCity }: QWeatherViewProps) {
  return (
    <>
      <div className="p-2.5 space-y-2.5 overflow-y-auto flex-1">
        {/* Current weather card */}
        <Card className="border-0 bg-[var(--gray3)] hover:shadow-md transition-shadow">
          <CardContent className="p-3">
            {/* Main row: city (left), temperature (center), sunrise/sunset (right) */}
            <div className="flex items-center justify-between mb-3">
              {/* Left: City name and badge */}
              <div className="w-14 flex-none flex flex-col items-start min-w-0 flex-shrink-0">
                <h2 className="text-base font-bold truncate text-gray-12">
                  {weatherData.location}
                </h2>
                {isDefaultCity && (
                  <Badge variant="secondary" className="text-[9px] h-4 px-1.5 mt-0.5">
                    默认城市
                  </Badge>
                )}
              </div>

              {/* Center: Weather icon, temperature and condition */}
              <div className="w-14 flex-none flex items-center gap-2">
                <div className="text-3xl">{getWeatherIcon(weatherData.condition)}</div>
                <div className="flex flex-col items-center">
                  <div className="text-3xl font-bold text-gray-12">{weatherData.temperature}</div>
                  <p className="text-xs text-gray-11">{weatherData.condition}</p>
                </div>
              </div>

              {/* Right: Sunrise and Sunset Timeline */}
              {weatherData.daily &&
                weatherData.daily[0] &&
                weatherData.daily[0].sunrise &&
                weatherData.daily[0].sunset && (
                  <SunTimeline
                    sunrise={weatherData.daily[0].sunrise}
                    sunset={weatherData.daily[0].sunset}
                    condition={weatherData.condition}
                  />
                )}
            </div>

            <Separator className="my-2.5" />

            <div className="grid grid-cols-4 gap-2 text-sm">
              <WeatherStat icon="tabler:temperature" label="体感" value={weatherData.feelsLike} />
              <WeatherStat icon="tabler:droplet" label="湿度" value={weatherData.humidity} />
              <WeatherStat icon="tabler:wind" label="风速" value={weatherData.windSpeed} />
              <WeatherStat icon="tabler:navigation" label="风向" value={weatherData.windDir} />
              <WeatherStat icon="tabler:gauge" label="气压" value={weatherData.pressure} />
              <WeatherStat icon="tabler:eye" label="能见度" value={weatherData.vis} />
              <WeatherStat icon="tabler:umbrella" label="降水" value={weatherData.precip} />
              {weatherData.cloud && (
                <WeatherStat icon="tabler:cloud" label="云量" value={`${weatherData.cloud}%`} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Daily forecast */}
        {weatherData.daily && weatherData.daily.length > 0 && (
          <Card className="border-0 bg-[var(--gray3)] hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 pt-2.5 px-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon icon="tabler:calendar-week" className="size-4" />
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
          <Card className="border-0 bg-[var(--gray3)] hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Icon icon="tabler:bulb" className="size-4" />
                生活指数
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {weatherData.indices.map((index, i) => (
                <div key={i}>
                  {i > 0 && <Separator className="my-3" />}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-11">{index.name}</span>
                      <Badge variant="secondary" className="text-[10px] h-5 text-blue-11 bg-blue-4">
                        {index.category}
                      </Badge>
                    </div>
                    <p className="text-xs leading-relaxed text-gray-12">{index.text}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <Footer
        current={null}
        icon={<Icon icon="tabler:cloud" className="size-5" />}
        actions={() => []}
        content={() => (
          <div className="text-[11px] text-center text-gray-10">Powered by 和风天气</div>
        )}
        accessory={
          <div className="flex items-center gap-3 pr-6 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-gray-11">
              <Icon icon="tabler:settings" className="size-5" />
              <Kbd>Ctrl</Kbd>
              <Kbd>K</Kbd>
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
function WeatherStat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon icon={icon} className="text-gray-11 size-3.5" />
      <div className="flex flex-col">
        <span className="text-[10px] text-gray-10">{label}</span>
        <span className="text-xs font-medium text-gray-12">{value}</span>
      </div>
    </div>
  );
}

/**
 * Sun Timeline component - modern sunrise/sunset display with wave trajectory
 */
function SunTimeline({
  sunrise,
  sunset,
  condition,
}: {
  sunrise: string;
  sunset: string;
  condition: string;
}) {
  // Parse time strings (HH:mm format)
  const parseTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const sunriseMinutes = parseTime(sunrise);
  const sunsetMinutes = parseTime(sunset);
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Calculate sun position
  const dayLength = sunsetMinutes - sunriseMinutes;
  const sunProgress = Math.max(0, Math.min(1, (currentMinutes - sunriseMinutes) / dayLength));
  const isDaytime = currentMinutes >= sunriseMinutes && currentMinutes <= sunsetMinutes;

  // Determine weather-based styling for sky - lighter, more modern colors
  const getWeatherStyle = (condition: string) => {
    const conditionLower = condition.toLowerCase();

    // Sunny/Clear - soft warm gradient
    if (
      conditionLower.includes("sun") ||
      conditionLower.includes("clear") ||
      conditionLower.includes("晴")
    ) {
      return {
        skyGradient: ["#fef9c3", "#fef3c7", "#fed7aa"], // Soft yellow to peach
        textColor: "#78350f",
        labelColor: "#d97706",
        waveColor: "rgba(251, 191, 36, 0.3)",
        waveActiveColor: "#fbbf24",
        markerColor: "#f59e0b",
        sunColor: "#fbbf24",
        sunGlow: "#fef08a",
      };
    }

    // Cloudy - soft gray gradient
    if (
      conditionLower.includes("cloud") ||
      conditionLower.includes("云") ||
      conditionLower.includes("阴")
    ) {
      return {
        skyGradient: ["#f8fafc", "#f1f5f9", "#e2e8f0"],
        textColor: "#334155",
        labelColor: "#64748b",
        waveColor: "rgba(148, 163, 184, 0.3)",
        waveActiveColor: "#94a3b8",
        markerColor: "#64748b",
        sunColor: "#fbbf24",
        sunGlow: "#fef08a",
      };
    }

    // Rainy - soft blue-gray gradient
    if (conditionLower.includes("rain") || conditionLower.includes("雨")) {
      return {
        skyGradient: ["#f0f9ff", "#e0f2fe", "#bae6fd"],
        textColor: "#0c4a6e",
        labelColor: "#0284c7",
        waveColor: "rgba(56, 189, 248, 0.3)",
        waveActiveColor: "#38bdf8",
        markerColor: "#0ea5e9",
        sunColor: "#fbbf24",
        sunGlow: "#fef08a",
      };
    }

    // Default - soft amber gradient
    return {
      skyGradient: ["#fffbeb", "#fef3c7", "#fde68a"],
      textColor: "#78350f",
      labelColor: "#b45309",
      waveColor: "rgba(251, 191, 36, 0.3)",
      waveActiveColor: "#f59e0b",
      markerColor: "#d97706",
      sunColor: "#fbbf24",
      sunGlow: "#fef08a",
    };
  };

  const style = getWeatherStyle(condition);

  // SVG parameters
  const width = 120;
  const height = 65;
  const padding = 10;
  const startX = padding;
  const endX = width - padding;
  const horizonY = height - 22;
  const waveAmplitude = 20;
  const horizonExtension = 10; // Extend horizon line on both sides

  // Calculate sun position on wave
  const sunX = startX + (endX - startX) * sunProgress;
  const sunY = horizonY - Math.abs(Math.sin(sunProgress * Math.PI)) * waveAmplitude;

  // Generate wave path
  const generateWavePath = (progress: number) => {
    let path = `M ${startX} ${horizonY}`;
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      if (t > progress) break;
      const x = startX + (endX - startX) * t;
      const y = horizonY - Math.abs(Math.sin(t * Math.PI)) * waveAmplitude;
      path += ` L ${x} ${y}`;
    }
    return path;
  };

  return (
    <div className="rounded-xl overflow-hidden min-w-[140px]">
      <div className="flex items-center gap-2 px-2.5 py-2">
        {/* Left: Current phase and time */}
        <div className="flex flex-col min-w-[50px]">
          <span className="text-[10px] font-medium" style={{ color: style.labelColor }}>
            {isDaytime ? "日落" : "日出"}
          </span>
          <span className="text-sm font-bold tabular-nums" style={{ color: style.textColor }}>
            {isDaytime ? sunset : sunrise}
          </span>
        </div>

        {/* Right: Wave visualization */}
        <div className="flex-1">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: "65px" }}>
            {/* Background wave (full trajectory) */}
            <path
              d={generateWavePath(1)}
              fill="none"
              stroke={style.waveColor}
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Active wave (current progress - daytime only) */}
            {isDaytime && (
              <path
                d={generateWavePath(sunProgress)}
                fill="none"
                stroke={style.waveActiveColor}
                strokeWidth="2"
                strokeLinecap="round"
              />
            )}

            {/* Horizon line - extended on both sides */}
            <line
              x1={-horizonExtension}
              y1={horizonY}
              x2={width + horizonExtension}
              y2={horizonY}
              stroke="var(--gray8)"
              strokeWidth="1"
            />

            {/* Sunrise marker */}
            <g>
              <circle cx={startX} cy={horizonY} r="2.5" fill={style.markerColor} />
              <text
                x={startX + 2}
                y={horizonY + 11}
                fontSize="7"
                fill="var(--gray11)"
                textAnchor="start"
                fontFamily="system-ui"
                fontWeight="500"
              >
                {sunrise}
              </text>
            </g>

            {/* Sunset marker */}
            <g>
              <circle cx={endX} cy={horizonY} r="2.5" fill={style.markerColor} />
              <text
                x={endX - 2}
                y={horizonY + 11}
                fontSize="7"
                fill="var(--gray11)"
                textAnchor="end"
                fontFamily="system-ui"
                fontWeight="500"
              >
                {sunset}
              </text>
            </g>

            {/* Sun position (daytime) */}
            {isDaytime && (
              <g>
                {/* Outer glow */}
                <circle cx={sunX} cy={sunY} r="8" fill={style.sunGlow} opacity="0.3">
                  <animate attributeName="r" values="8;10;8" dur="3s" repeatCount="indefinite" />
                  <animate
                    attributeName="opacity"
                    values="0.3;0.5;0.3"
                    dur="3s"
                    repeatCount="indefinite"
                  />
                </circle>
                {/* Inner glow */}
                <circle cx={sunX} cy={sunY} r="5" fill={style.sunGlow} opacity="0.5" />
                {/* Sun core */}
                <circle cx={sunX} cy={sunY} r="3.5" fill={style.sunColor} />
              </g>
            )}
          </svg>
        </div>
      </div>
    </div>
  );
}

/**
 * Daily weather card component for displaying forecast day
 */
function DailyWeatherCard({
  day,
  index,
}: {
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
  const dayName =
    index === 0
      ? "今天"
      : index === 1
        ? "明天"
        : ["周日", "周一", "周二", "周三", "周四", "周五", "周六"][date.getDay()];
  const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;

  const getUVLevel = (uvIndex: string) => {
    const uv = parseInt(uvIndex);
    if (uv <= 2) return { text: "低", color: "var(--green11)" };
    if (uv <= 5) return { text: "中", color: "var(--yellow11)" };
    if (uv <= 7) return { text: "高", color: "var(--orange11)" };
    if (uv <= 10) return { text: "很高", color: "var(--red11)" };
    return { text: "极高", color: "var(--purple11)" };
  };

  const uvLevel = getUVLevel(day.uvIndex);

  return (
    <div className="flex flex-col items-center p-1.5 rounded border border-border/40 hover:border-border transition-colors bg-gray-2">
      {/* Date */}
      <div className="text-center mb-1">
        <div className="text-[10px] font-medium text-gray-12">{dayName}</div>
        <div className="text-[9px] text-gray-11">{dateStr}</div>
      </div>

      {/* Weather icon */}
      <div className="text-3xl mb-1">{getWeatherIcon(day.textDay)}</div>

      {/* Temperature */}
      <div className="text-center mb-1">
        <div className="text-sm font-bold tabular-nums text-gray-12">{day.tempMax}°</div>
        <div className="text-xs tabular-nums text-gray-11">{day.tempMin}°</div>
      </div>

      {/* Weather condition */}
      <div className="text-[10px] text-center mb-1 leading-tight px-0.5 text-gray-11">
        {day.textDay.length > 4 ? day.textDay.substring(0, 4) : day.textDay}
      </div>

      {/* Additional info */}
      <div className="w-full space-y-0.5 pt-1 border-t border-border/30">
        {/* UV Index */}
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-gray-10">紫外线</span>
          <span style={{ color: uvLevel.color }}>{uvLevel.text}</span>
        </div>

        {/* Precipitation - only if non-zero */}
        {parseFloat(day.precip) > 0 && (
          <div className="flex items-center justify-between text-[9px]">
            <span className="text-gray-10">降水</span>
            <span className="text-blue-11">{day.precip}mm</span>
          </div>
        )}

        {/* Humidity */}
        <div className="flex items-center justify-between text-[9px]">
          <span className="text-gray-10">湿度</span>
          <span className="text-gray-11">{day.humidity}%</span>
        </div>
      </div>
    </div>
  );
}
