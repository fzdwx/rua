import * as React from "react";
import { QuickLink, QuickLinkOpenType, useQuickLinks } from "@/hooks/useQuickLinks";
import { Footer } from "@rua/ui";
import { Icon } from "@iconify/react";
import { useKeyPress, useDebounceFn } from "ahooks";
import { Label } from "../../../../../packages/rua-ui/src/components/ui/label";
import { Input } from "../../../../../packages/rua-ui/src/components/ui/input";
import { Kbd, KbdGroup } from "../../../../../packages/rua-ui/src/components/ui/kbd";
import { Button } from "../../../../../packages/rua-ui/src/components/ui/button";
import { Switch } from "../../../../../packages/rua-ui/src/components/ui/switch";
import { invoke } from "@tauri-apps/api/core";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../../packages/rua-ui/src/components/ui/select";

interface QuickLinkCreatorProps {
  onLoadingChange?: (loading: boolean) => void;
  onReturn?: () => void;
  editQuickLink?: QuickLink;
}

export function QuickLinkCreator({
  onLoadingChange,
  onReturn,
  editQuickLink,
}: QuickLinkCreatorProps) {
  const { addQuickLink, updateQuickLink } = useQuickLinks();
  const [editingId, setEditingId] = React.useState<string | null>(editQuickLink?.id || null);

  const [name, setName] = React.useState(editQuickLink?.name || "");
  const [url, setUrl] = React.useState(editQuickLink?.url || "");
  const [openType, setOpenType] = React.useState<QuickLinkOpenType>(
    editQuickLink?.openType || "url"
  );
  const [waitForCompletion, setWaitForCompletion] = React.useState(
    editQuickLink?.waitForCompletion ?? true
  );
  const [customIcon, setCustomIcon] = React.useState(editQuickLink?.icon || "");
  const [iconUrl, setIconUrl] = React.useState<string | null>(editQuickLink?.iconUrl || null);
  const [showVariableMenu, setShowVariableMenu] = React.useState(false);
  const [variableMenuPosition, setVariableMenuPosition] = React.useState(0);
  const [activeMenuIndex, setActiveMenuIndex] = React.useState(0);
  const [urlError, setUrlError] = React.useState("");
  const [nameError, setNameError] = React.useState("");
  const [iconLoadError, setIconLoadError] = React.useState(false);
  const [fetchingPageInfo, setFetchingPageInfo] = React.useState(false);

  const urlInputRef = React.useRef<HTMLInputElement>(null);
  const nameInputRef = React.useRef<HTMLInputElement>(null);

  // Page info type from Rust backend
  interface PageInfo {
    title?: string;
    description?: string;
    icon?: string;
    image?: string;
  }

  // Fetch page info using webpage-rs backend
  const fetchPageInfo = async (targetUrl: string) => {
    // Skip if URL contains variables
    if (targetUrl.includes("{") || targetUrl.includes("}")) {
      return;
    }

    try {
      new URL(targetUrl);
    } catch {
      return;
    }

    setFetchingPageInfo(true);
    console.log("[QuickLinkCreator] Fetching page info for:", targetUrl);
    try {
      const info = await invoke<PageInfo>("fetch_page_info", { url: targetUrl });
      console.log("[QuickLinkCreator] Page info:", info);

      // Only set if user hasn't manually entered values
      if (info.title && !name) {
        console.log("[QuickLinkCreator] Setting name to:", info.title);
        setName(info.title);
      }
      if (info.icon && !customIcon) {
        console.log("[QuickLinkCreator] Setting icon to:", info.icon);
        setCustomIcon(info.icon);
      }
    } catch (err) {
      console.error("[QuickLinkCreator] Failed to fetch page info:", err);
    } finally {
      setFetchingPageInfo(false);
    }
  };

  // Debounced fetch page info
  const { run: debouncedFetchPageInfo } = useDebounceFn(
    (targetUrl: string) => {
      if (openType === "url" && targetUrl) {
        fetchPageInfo(targetUrl);
      }
    },
    { wait: 800 }
  );

  const variables = [
    { name: "query", description: "代表查询内容" },
    { name: "selection", description: "代表选中的文本（粘贴板内容）" },
  ];

  // Check if a string is a URL
  const isUrl = (str: string): boolean => {
    if (!str) return false;
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  // Reset icon load error when customIcon changes
  React.useEffect(() => {
    setIconLoadError(false);
  }, [customIcon]);

  // Auto-focus on mount
  React.useEffect(() => {
    const timer = setTimeout(() => {
      urlInputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, []);

  // Add Ctrl+Enter shortcut
  useKeyPress("ctrl.enter", (e) => {
    e.preventDefault();
    handleSubmit();
  });

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    const cursorPosition = e.target.selectionStart || 0;

    setUrl(newValue);
    setUrlError("");

    if (newValue[cursorPosition - 1] === "{") {
      setShowVariableMenu(true);
      setVariableMenuPosition(cursorPosition);
      setActiveMenuIndex(0);
    } else {
      setShowVariableMenu(false);
    }

    // Trigger debounced fetch for page info
    debouncedFetchPageInfo(newValue);
  };

  const handleUrlKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showVariableMenu) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveMenuIndex((prev) => (prev + 1) % variables.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveMenuIndex((prev) => (prev - 1 + variables.length) % variables.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      insertVariable(variables[activeMenuIndex].name);
    }
  };

  const insertVariable = (variableName: string) => {
    const input = urlInputRef.current;
    if (!input) return;

    const cursorPosition = variableMenuPosition;
    const beforeCursor = url.substring(0, cursorPosition);
    const afterCursor = url.substring(cursorPosition);

    const newUrl = beforeCursor + variableName + "}" + afterCursor;
    setUrl(newUrl);
    setShowVariableMenu(false);
    setActiveMenuIndex(0);

    setTimeout(() => {
      const newCursorPos = cursorPosition + variableName.length + 1;
      input.focus();
      input.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  useKeyPress("esc", () => {
    if (showVariableMenu) {
      setShowVariableMenu(false);
      setActiveMenuIndex(0);
    } else {
      onReturn?.();
    }
  });

  const resetForm = () => {
    setName("");
    setUrl("");
    setOpenType("url");
    setWaitForCompletion(true);
    setCustomIcon("");
    setIconUrl(null);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    setUrlError("");
    setNameError("");

    let hasError = false;

    if (!url.trim()) {
      setUrlError(openType === "url" ? "请输入链接地址" : "请输入命令");
      urlInputRef.current?.focus();
      hasError = true;
    } else if (openType === "url") {
      try {
        new URL(url);
      } catch {
        setUrlError("请输入有效的 URL 格式");
        urlInputRef.current?.focus();
        hasError = true;
      }
    }

    if (!name.trim()) {
      setNameError("请输入名称");
      if (!hasError) {
        nameInputRef.current?.focus();
      }
      hasError = true;
    }

    if (hasError) {
      return;
    }

    onLoadingChange?.(true);
    try {
      if (editingId) {
        updateQuickLink(editingId, {
          name: name.trim(),
          url: url.trim(),
          openType,
          waitForCompletion: openType === "shell" ? waitForCompletion : undefined,
          icon: customIcon.trim() || undefined,
          iconUrl: iconUrl || undefined,
        });
      } else {
        addQuickLink({
          name: name.trim(),
          url: url.trim(),
          openType,
          waitForCompletion: openType === "shell" ? waitForCompletion : undefined,
          icon: customIcon.trim() || undefined,
          iconUrl: iconUrl || undefined,
        });
      }

      resetForm();
      await new Promise((resolve) => setTimeout(resolve, 100));
      onReturn?.();
    } catch (err) {
      console.error("Failed to save quick link:", err);
    } finally {
      onLoadingChange?.(false);
    }
  };

  return (
    <>
      <div className="w-full max-w-2xl mx-auto px-12 py-6 overflow-y-auto flex-1">
        <div className="space-y-6 pt-8">
          {/* URL/Command input */}
          <div className="flex items-start gap-4">
            <Label
              htmlFor="url-input"
              className="w-16 pt-2.5 text-right flex-shrink-0 text-muted-foreground text-sm"
            >
              {openType === "url" ? "链接地址" : "Shell 命令"}
            </Label>
            <div className="flex-1 relative">
              <Input
                id="url-input"
                ref={urlInputRef}
                type="text"
                value={url}
                onChange={handleUrlChange}
                onKeyDown={handleUrlKeyDown}
                placeholder={
                  openType === "url"
                    ? "https://google.com/search?q={query}"
                    : "notify-send 'Hello' '{query}'"
                }
                className={`${urlError ? "border-destructive" : ""} font-mono`}
              />
              {urlError && <p className="text-xs text-destructive mt-1.5">{urlError}</p>}
              {!urlError && (
                <p className="text-xs text-muted-foreground/70 pt-1 leading-relaxed">
                  可以通过【<span className="text-foreground font-medium">动态替换方式</span>
                  】占位符的方式动态组装 url，如{" "}
                  <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px] text-foreground font-medium">
                    {"{selection}"}
                  </code>
                  <br />
                  表示通过选择文本替换掉{" "}
                  <code className="px-1 py-0.5 rounded bg-muted font-mono text-[11px] text-foreground font-medium">
                    {"{selection}"}
                  </code>{" "}
                  的方式拼接 url，大大提高灵活性。
                </p>
              )}

              {/* Variable selection menu */}
              {showVariableMenu && (
                <div className="absolute z-50 w-72 mt-1 rounded-lg border border-border/50 bg-popover/95 backdrop-blur-sm shadow-lg overflow-hidden">
                  {variables.map((variable, index) => (
                    <div
                      key={variable.name}
                      className={`px-3 py-2.5 cursor-pointer transition-colors ${
                        activeMenuIndex === index ? "bg-accent/80" : "hover:bg-accent/40"
                      }`}
                      onMouseEnter={() => setActiveMenuIndex(index)}
                      onClick={() => insertVariable(variable.name)}
                    >
                      <div className="flex items-center gap-3">
                        <code className="px-2 py-1 rounded-md bg-muted border border-border/50 text-foreground font-mono text-xs">
                          {`{${variable.name}}`}
                        </code>
                        <span className="text-muted-foreground text-xs">
                          {variable.description}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="px-3 py-1.5 border-t border-border/30 bg-muted/20">
                    <span className="text-[10px] text-muted-foreground">
                      ↑↓ 选择 · Enter 确认 · Esc 取消
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Name input */}
          <div className="flex items-start gap-4">
            <Label
              htmlFor="name-input"
              className="w-16 pt-2.5 text-right flex-shrink-0 text-muted-foreground text-sm"
            >
              指令名
            </Label>
            <div className="flex-1">
              <div className="relative">
                <Input
                  id="name-input"
                  ref={nameInputRef}
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setNameError("");
                  }}
                  placeholder={fetchingPageInfo ? "正在获取..." : "快捷链接名字"}
                  className={nameError ? "border-destructive" : ""}
                />
                {fetchingPageInfo && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Icon
                      icon="tabler:loader-2"
                      className="size-4 text-muted-foreground animate-spin"
                    />
                  </div>
                )}
              </div>
              {nameError && <p className="text-xs text-destructive mt-1.5">{nameError}</p>}
            </div>
          </div>

          {/* Open Type selector - hidden by default, only show for advanced users */}
          <div className="flex items-start gap-4">
            <Label
              htmlFor="open-type-select"
              className="w-16 pt-2.5 text-right flex-shrink-0 text-muted-foreground text-sm"
            >
              类型
            </Label>
            <div className="flex-1">
              <Select
                value={openType}
                onValueChange={(value) => setOpenType(value as QuickLinkOpenType)}
              >
                <SelectTrigger id="open-type-select" className="bg-background w-48">
                  <SelectValue placeholder="选择打开方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="url">浏览器打开 URL</SelectItem>
                  <SelectItem value="shell">Shell 命令执行</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Wait for completion option (only for shell commands) */}
          {openType === "shell" && (
            <div className="flex items-start gap-4">
              <Label
                htmlFor="wait-completion"
                className="w-16 pt-0.5 text-right flex-shrink-0 text-muted-foreground text-sm"
              >
                执行
              </Label>
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <Switch
                    id="wait-completion"
                    checked={waitForCompletion}
                    onCheckedChange={setWaitForCompletion}
                  />
                  <Label htmlFor="wait-completion" className="cursor-pointer font-normal text-sm">
                    等待命令执行完成
                  </Label>
                </div>
              </div>
            </div>
          )}

          {/* Custom Icon input - simplified */}
          <div className="flex items-start gap-4">
            <Label
              htmlFor="icon-input"
              className="w-16 pt-2.5 text-right flex-shrink-0 text-muted-foreground text-sm"
            >
              图标
            </Label>
            <div className="flex-1">
              <div className="flex gap-2 items-center">
                <div className="flex-shrink-0 w-9 h-9 flex items-center justify-center text-xl border rounded-md bg-muted overflow-hidden">
                  {(() => {
                    if (customIcon) {
                      if (isUrl(customIcon)) {
                        if (iconLoadError) {
                          return iconUrl ? (
                            <img src={iconUrl} alt="icon" className="w-6 h-6" onError={() => {}} />
                          ) : (
                            "🔗"
                          );
                        }
                        return (
                          <img
                            src={customIcon}
                            alt="icon"
                            className="w-6 h-6"
                            onError={() => setIconLoadError(true)}
                          />
                        );
                      }
                      const displayText =
                        customIcon.length > 2 ? customIcon.substring(0, 1) : customIcon;
                      return <span className="select-none">{displayText}</span>;
                    }
                    if (iconUrl) {
                      return (
                        <img src={iconUrl} alt="icon" className="w-6 h-6" onError={() => {}} />
                      );
                    }
                    return "🔗";
                  })()}
                </div>
                <Input
                  id="icon-input"
                  type="text"
                  value={customIcon}
                  onChange={(e) => setCustomIcon(e.target.value)}
                  placeholder="emoji 或图标 URL(可选), 支持 data uri"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer
        current={null}
        icon={<Icon icon="tabler:link-plus" className="size-5" />}
        actions={() => []}
        content={() => <div />}
        rightElement={
          <div className="flex items-center gap-3 pr-6">
            <Button onClick={handleSubmit} size="sm" variant="outline" className="">
              {editingId ? "更新" : "创建"}
            </Button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <KbdGroup className="gap-1">
                <Kbd>Ctrl</Kbd>
                <Kbd>⏎</Kbd>
              </KbdGroup>
            </div>
          </div>
        }
      />
    </>
  );
}
