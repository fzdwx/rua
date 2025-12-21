import * as React from "react";
import { Action, ActionId, Footer } from "@rua/ui";
import { Icon } from "@iconify/react";
import { useWeatherConfig, WeatherConfig } from "@/hooks/useWeatherConfig";
import { WeatherSettings } from "./WeatherSettings";
import { getWeatherFromWttr, WttrWeatherView } from "./WttrWeatherView";
import { getWeatherFromQWeather, QWeatherView } from "./QWeatherView";
import { Kbd, KbdGroup } from "../../../../../packages/rua-ui/src/components/ui/kbd";
import { Alert, AlertDescription, AlertTitle } from "../../../../../packages/rua-ui/src/components/ui/alert";
import { useKeyPress } from "ahooks";
import { motion } from "motion/react";

interface WeatherViewProps {
  search: string;
  onLoadingChange?: (loading: boolean) => void;
  onRequestFocusInput?: () => void; // Request to focus main input
  onReturn?: () => void; // Return to home
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

export function getWeatherAction(
  getUsageCount: (actionId: ActionId) => number,
  incrementUsage: (actionId: ActionId) => void
): Action {
  const weatherUsageCount = getUsageCount(weatherId);
  return {
    id: weatherId,
    name: "天气",
    subtitle: "查看当前位置天气，或输入城市名查询",
    keywords: "weather,天气,climate,temperature,tianqi",
    icon: <div className="text-xl">🌤️</div>,
    kind: "built-in",
    query: false, // Enable query input for this action
    usageCount: weatherUsageCount,
    badge: "Command",
    perform: () => {
      incrementUsage(weatherId);
    },
  };
}

export function WeatherView({
  search,
  onLoadingChange,
  onRequestFocusInput,
  onReturn,
}: WeatherViewProps) {
  const [weatherData, setWeatherData] = React.useState<WeatherData | null>(null);
  const [isCurrentLocation, setIsCurrentLocation] = React.useState(false);
  const [showSettings, setShowSettings] = React.useState(false);
  const { config } = useWeatherConfig();

  // Add keyboard shortcut to open settings (Ctrl+k)
  useKeyPress(["ctrl.k"], (e) => {
    e.preventDefault();
    setShowSettings(true);
  });

  // ESC key to close settings or return to home
  useKeyPress("esc", () => {
    if (showSettings) {
      setShowSettings(false);
    } else {
      onReturn?.();
    }
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
            error:
              error.message ||
              (location
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

  // Show settings view
  if (showSettings) {
    return (
      <WeatherSettings
        onClose={() => {
          setShowSettings(false);
          onRequestFocusInput?.();
        }}
      />
    );
  }

  if (!weatherData) {
    return (
      <>
        <div className="py-10 px-5 text-center text-sm overflow-y-auto flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="text-4xl mb-2 animate-pulse">🌤️</div>
            <div className="text-gray-11 font-medium">Loading weather data...</div>
            <div className="w-32 h-1 bg-[var(--gray4)] rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </div>
          </motion.div>
        </div>
        <Footer
          current={null}
          icon={<Icon icon="tabler:cloud" className="size-5" />}
          actions={() => []}
          content={() => (
            <div className="text-[11px] text-center text-gray-10">Powered by wttr.in</div>
          )}
          accessory={
            <div className="flex items-center gap-3 pr-6 flex-shrink-0">
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

  // Show error if weather fetch failed
  if (weatherData.error) {
    return (
      <>
        <div className="p-3 overflow-y-auto flex-1">
          <Alert variant="destructive" className="my-2">
            <Icon icon="tabler:alert-circle" className="h-4 w-4" />
            <AlertTitle>Weather Error</AlertTitle>
            <AlertDescription>
              <div className="font-semibold mb-2">{weatherData.error}</div>
              <div className="text-xs mt-2">Location: {weatherData.location}</div>
            </AlertDescription>
          </Alert>
        </div>

        <Footer
          current={null}
          icon={<Icon icon="tabler:cloud" className="size-5" />}
          actions={() => []}
          content={() => <div />}
          accessory={
            <div className="flex items-center gap-3 pr-6">
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

  // Render appropriate view based on provider
  if (config.provider === "qweather") {
    // Type guard to check if weatherData is QWeatherData
    if ("windDir" in weatherData && "pressure" in weatherData) {
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
  if ("uvIndex" in weatherData) {
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
