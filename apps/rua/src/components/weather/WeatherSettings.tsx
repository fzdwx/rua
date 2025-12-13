import * as React from "react";
import {useWeatherConfig} from "@/hooks/useWeatherConfig";
import {Label} from "@/components/ui/label";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useKeyPress} from "ahooks";
import {clearQWeatherCache} from "./hefeng/qweather-cache.ts";
import {Footer} from "@/command";
import {Icon} from "@iconify/react";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";

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
    const apiUrlInputRef = React.useRef<HTMLInputElement>(null);

    // Auto-focus on mount
    React.useEffect(() => {
        if (provider === "qweather" && apiUrlInputRef.current) {
            apiUrlInputRef.current.focus();
        }
    }, [provider]);

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

    // Add Ctrl+K shortcut to close and return to weather view
    useKeyPress(['ctrl.k', 'meta.k'], (e) => {
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
        <>
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
                {/* Provider selection card */}
                <Card className="border-0 bg-[var(--gray3)] hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Icon icon="tabler:cloud-cog" className="size-4" />
                            数据来源
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Select
                            value={provider}
                            onValueChange={(value) => setLocalProvider(value as "wttr" | "qweather")}
                        >
                            <SelectTrigger className="w-full">
                                <SelectValue placeholder="选择数据来源" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="wttr">
                                    wttr.in (默认) - 免费，无需配置，支持全球城市和IP自动定位
                                </SelectItem>
                                <SelectItem value="qweather">
                                    和风天气 - 需要配置 API Key，支持中国城市，提供更详细的天气数据
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>

                {/* QWeather configuration card */}
                {provider === "qweather" && (
                    <Card className="border-0 bg-[var(--gray3)] hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Icon icon="tabler:key" className="size-4" />
                                和风天气配置
                            </CardTitle>
                            <CardDescription>
                                在{' '}
                                <a
                                    href="https://dev.qweather.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline text-blue-11"
                                >
                                    和风天气开发平台
                                </a>
                                {' '}获取 API Key
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                <p className="text-xs text-gray-11">
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
                                <p className="text-xs text-gray-11">
                                    当不输入城市名称时，将使用此默认城市查询天气（可选）
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Cache management card */}
                {provider === "qweather" && (
                    <Card className="border-0 bg-[var(--gray3)] hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2">
                                <Icon icon="tabler:database" className="size-4" />
                                缓存管理
                            </CardTitle>
                            <CardDescription>
                                和风天气数据会被缓存以减少 API 调用。如需强制刷新，可清除缓存。
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button
                                onClick={handleClearCache}
                                variant="outline"
                                size="sm"
                                className="w-full"
                            >
                                <Icon icon="tabler:trash" className="mr-2 size-3.5" />
                                清除缓存
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Error message */}
                {error && (
                    <Alert variant="destructive">
                        <Icon icon="tabler:alert-circle" className="h-4 w-4" />
                        <AlertTitle>错误</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* Success message */}
                {successMessage && (
                    <Alert>
                        <Icon icon="tabler:check" className="h-4 w-4" />
                        <AlertTitle>成功</AlertTitle>
                        <AlertDescription>{successMessage}</AlertDescription>
                    </Alert>
                )}
            </div>

            <Footer
                current={null}
                icon={<Icon icon="tabler:settings" className="size-5" />}
                actions={() => []}
                content={() => (
                    <div className="text-[11px] text-gray-10">
                        天气设置
                    </div>
                )}
                rightElement={
                    <div className='flex items-center gap-3 pr-4 flex-shrink-0'>
                        <Button
                            onClick={handleSave}
                            variant="outline"
                            size="sm"
                            className="whitespace-nowrap"
                        >
                            <Icon icon="tabler:device-floppy" className="mr-1.5 size-3.5" />
                            保存
                        </Button>
                        {onClose && (
                            <Button
                                onClick={onClose}
                                variant="outline"
                                size="sm"
                                className="whitespace-nowrap"
                            >
                                <Icon icon="tabler:x" className="mr-1.5 size-3.5" />
                                取消
                            </Button>
                        )}
                    </div>
                }
            />
        </>
    );
}
