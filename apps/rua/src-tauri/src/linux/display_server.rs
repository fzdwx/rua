use std::env;
use std::process::Command;

/// 显示服务器类型
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum DisplayServer {
    /// Hyprland (Wayland compositor with special features)
    Hyprland,
    /// Generic X11 display server
    X11,
    /// Unknown or unsupported display server
    Unknown,
}

impl DisplayServer {
    #[allow(dead_code)]
    pub fn as_str(&self) -> &'static str {
        match self {
            DisplayServer::Hyprland => "Hyprland",
            DisplayServer::X11 => "X11",
            DisplayServer::Unknown => "Unknown",
        }
    }
}

/// 检测当前显示服务器
///
/// 检测顺序：
/// 1. 检查 HYPRLAND_INSTANCE_SIGNATURE 环境变量（Hyprland 特有）
/// 2. 尝试执行 hyprctl version 命令
/// 3. 检查 DISPLAY 环境变量（X11）
/// 4. 都失败则返回 Unknown
pub fn detect_display_server() -> DisplayServer {
    // 1. 优先检测 Hyprland
    if env::var("HYPRLAND_INSTANCE_SIGNATURE").is_ok() {
        eprintln!("[DisplayServer] Detected Hyprland via HYPRLAND_INSTANCE_SIGNATURE");
        return DisplayServer::Hyprland;
    }

    if is_hyprctl_available() {
        eprintln!("[DisplayServer] Detected Hyprland via hyprctl command");
        return DisplayServer::Hyprland;
    }

    // 2. 检测 X11
    if let Ok(display) = env::var("DISPLAY") {
        if !display.is_empty() {
            eprintln!("[DisplayServer] Detected X11 via DISPLAY={}", display);
            return DisplayServer::X11;
        }
    }

    // 3. 未知显示服务器
    eprintln!("[DisplayServer] Unknown display server, will fallback to Tauri API");
    DisplayServer::Unknown
}

/// 检查 hyprctl 命令是否可用
fn is_hyprctl_available() -> bool {
    Command::new("hyprctl")
        .arg("version")
        .output()
        .map(|o| o.status.success())
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_display_server_detection() {
        let ds = detect_display_server();
        println!("Detected display server: {:?}", ds);
        // 不断言结果，因为测试环境可能不同
    }
}
