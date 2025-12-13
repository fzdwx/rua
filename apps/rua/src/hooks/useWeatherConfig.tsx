import { useState, useCallback, useEffect, createContext, useContext, ReactNode } from "react";

const WEATHER_CONFIG_KEY = "rua_weather_config";

export interface WeatherConfig {
    provider: "wttr" | "qweather"; // Weather provider
    qweather?: {
        apiKey: string;
        apiUrl: string;
        defaultCity?: string; // Default city for QWeather (optional)
    };
}

interface WeatherConfigContextType {
    config: WeatherConfig;
    setProvider: (provider: "wttr" | "qweather") => void;
    setQWeatherConfig: (qweather: { apiKey: string; apiUrl: string; defaultCity?: string }) => void;
}

/**
 * Load weather config from localStorage
 */
function loadWeatherConfig(): WeatherConfig {
    try {
        const data = localStorage.getItem(WEATHER_CONFIG_KEY);
        if (data) {
            return JSON.parse(data);
        }
    } catch (error) {
        console.error("Failed to load weather config:", error);
    }
    // Default to wttr.in
    return {
        provider: "wttr",
    };
}

/**
 * Save weather config to localStorage
 */
function saveWeatherConfig(config: WeatherConfig): void {
    try {
        localStorage.setItem(WEATHER_CONFIG_KEY, JSON.stringify(config));
    } catch (error) {
        console.error("Failed to save weather config:", error);
    }
}

// Create context
const WeatherConfigContext = createContext<WeatherConfigContextType | null>(null);

/**
 * Provider component for weather configuration
 */
export function WeatherConfigProvider({ children }: { children: ReactNode }) {
    const [config, setConfig] = useState<WeatherConfig>(() => loadWeatherConfig());

    // Save to localStorage whenever config changes
    useEffect(() => {
        saveWeatherConfig(config);
    }, [config]);

    // Update weather provider
    const setProvider = useCallback((provider: "wttr" | "qweather") => {
        setConfig((prev) => ({
            ...prev,
            provider,
        }));
    }, []);

    // Update QWeather configuration
    const setQWeatherConfig = useCallback((qweather: { apiKey: string; apiUrl: string; defaultCity?: string }) => {
        setConfig((prev) => ({
            ...prev,
            provider: "qweather",
            qweather,
        }));
    }, []);

    return (
        <WeatherConfigContext.Provider value={{ config, setProvider, setQWeatherConfig }}>
            {children}
        </WeatherConfigContext.Provider>
    );
}

/**
 * Custom hook to access weather configuration
 */
export function useWeatherConfig() {
    const context = useContext(WeatherConfigContext);
    if (!context) {
        throw new Error("useWeatherConfig must be used within WeatherConfigProvider");
    }
    return context;
}
