import * as React from "react";
import {useWeatherConfig} from "@/hooks/useWeatherConfig";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useKeyPress} from "ahooks";
import {Kbd, KbdGroup} from "@/components/ui/kbd";
import {clearQWeatherCache} from "./hefeng/qweather-cache.ts";

interface WeatherSettingsProps {
    onClose?: () => void;
}

/**
 * Weather settings component for configuring weather API provider
 */
export function WeatherSettings({onClose}: WeatherSettingsProps) {
    const {config, setProvider, setQWeatherConfig} = useWeatherConfig();
    const [provider, setLocalProvider] = React.useState<"wttr" | "qweather">(config.provider);
    const [apiKey, setApiKey] = React.useState(config.qweather?.apiKey || "");
    const [apiUrl, setApiUrl] = React.useState(config.qweather?.apiUrl || "");
    const [defaultCity, setDefaultCity] = React.useState(config.qweather?.defaultCity || "");
    const [error, setError] = React.useState("");
    const [successMessage, setSuccessMessage] = React.useState("");

    // Refs for auto-focus
    const providerSelectRef = React.useRef<HTMLSelectElement>(null);
    const apiUrlInputRef = React.useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    React.useEffect(() => {
        if (provider === "qweather" && apiUrlInputRef.current) {
            apiUrlInputRef.current.focus();
        } else {
            providerSelectRef.current?.focus();
        }
    }, []);

    // Add Ctrl+Enter shortcut to save
    useKeyPress('ctrl.enter', (e) => {
        e.preventDefault();
        handleSave();
    });

    // Add Esc shortcut to close
    useKeyPress('esc', (e) => {
        e.preventDefault();
        onClose?.();
    });

    const handleSave = () => {
        setError("");
        setSuccessMessage("");

        if (provider === "qweather") {
            if (!apiKey.trim()) {
                setError("请输入 API Key");
                return;
            }
            if (!apiUrl.trim()) {
                setError("请输入 API URL");
                return;
            }

            setQWeatherConfig({
                apiKey: apiKey.trim(),
                apiUrl: apiUrl.trim(),
                defaultCity: defaultCity.trim() || undefined,
            });
        } else {
            setProvider(provider);
        }

        onClose?.();
    };

    const handleClearCache = () => {
        clearQWeatherCache();
        setSuccessMessage("缓存已清除");
        // Auto-hide success message after 2 seconds
        setTimeout(() => setSuccessMessage(""), 2000);
    };

    return (
        <div className="w-full max-w-2xl mx-auto px-4 py-2 overflow-y-auto max-h-[calc(100vh-120px)]">
            <div className="rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6">
                {/* Provider selection */}
                <div className="space-y-2">
                    <Label htmlFor="provider">数据来源</Label>
                    <select
                        id="provider"
                        ref={providerSelectRef}
                        value={provider}
                        onChange={(e) => setLocalProvider(e.target.value as "wttr" | "qweather")}
                        className="w-full px-3 py-2 rounded-lg border text-sm"
                        style={{
                            borderColor: 'var(--gray6)',
                            background: 'var(--gray3)',
                            color: 'var(--gray12)',
                        }}
                    >
                        <option value="wttr">wttr.in (默认) - 免费，无需配置，支持全球城市和IP自动定位</option>
                        <option value="qweather">和风天气 - 需要配置 API Key，支持中国城市，提供更详细的天气数据</option>
                    </select>
                </div>

                {/* QWeather configuration */}
                {provider === "qweather" && (
                    <div className="space-y-4 p-4 rounded-lg" style={{background: 'var(--gray3)'}}>
                        <div className="space-y-2">
                            <Label htmlFor="api-url">
                                API URL <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="api-url"
                                ref={apiUrlInputRef}
                                type="text"
                                value={apiUrl}
                                onChange={(e) => setApiUrl(e.target.value)}
                                placeholder="https://devapi.qweather.com"
                            />
                            <p className="text-xs" style={{color: 'var(--gray11)'}}>
                                例如：https://devapi.qweather.com 或您的自定义域名
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="api-key">
                                API Key <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="api-key"
                                type="password"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="请输入和风天气 API Key"
                            />
                            <p className="text-xs" style={{color: 'var(--gray11)'}}>
                                在{' '}
                                <a
                                    href="https://dev.qweather.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                    style={{color: 'var(--blue11)'}}
                                >
                                    和风天气开发平台
                                </a>
                                {' '}获取 API Key
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="default-city">
                                默认城市
                            </Label>
                            <Input
                                id="default-city"
                                type="text"
                                value={defaultCity}
                                onChange={(e) => setDefaultCity(e.target.value)}
                                placeholder="北京"
                            />
                            <p className="text-xs" style={{color: 'var(--gray11)'}}>
                                当不输入城市名称时，将使用此默认城市查询天气（可选）
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="p-3 rounded-lg" style={{background: 'var(--red3)', color: 'var(--red11)'}}>
                        {error}
                    </div>
                )}

                {successMessage && (
                    <div className="p-3 rounded-lg" style={{background: 'var(--green3)', color: 'var(--green11)'}}>
                        {successMessage}
                    </div>
                )}

                {provider === "qweather" && (
                    <div className="flex items-center justify-between p-3 rounded-lg" style={{background: 'var(--gray3)'}}>
                        <div className="flex-1">
                            <div className="text-sm font-medium" style={{color: 'var(--gray12)'}}>清除缓存</div>
                            <p className="text-xs mt-1" style={{color: 'var(--gray11)'}}>
                                和风天气数据会被缓存以减少 API 调用。如需强制刷新，可清除缓存。
                            </p>
                        </div>
                        <Button
                            onClick={handleClearCache}
                            variant="outline"
                            size="sm"
                        >
                            清除
                        </Button>
                    </div>
                )}

                <div className="flex gap-3">
                    <Button
                        onClick={handleSave}
                        variant="outline"
                        className="flex-1"
                    >
                        保存设置
                        <KbdGroup>
                            <Kbd>Ctrl</Kbd>
                            <Kbd>⏎</Kbd>
                        </KbdGroup>
                    </Button>
                    {onClose && (
                        <Button
                            onClick={onClose}
                            variant="outline"
                            className="flex-1"
                        >
                            取消
                            <KbdGroup>
                                <Kbd>Esc</Kbd>
                            </KbdGroup>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
