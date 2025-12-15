use x11rb::connection::Connection;
use x11rb::protocol::xproto::*;
use x11rb::rust_connection::RustConnection;
use x11rb::CURRENT_TIME;

/// X11 窗口管理器
pub struct X11WindowManager {
    conn: RustConnection,
    screen_num: usize,
}

impl X11WindowManager {
    /// 创建新的 X11 窗口管理器
    ///
    /// 返回 None 如果无法连接到 X11 显示服务器
    pub fn new() -> Option<Self> {
        match RustConnection::connect(None) {
            Ok((conn, screen_num)) => {
                eprintln!("[X11] Connected to X11 display server (screen: {})", screen_num);
                Some(Self { conn, screen_num })
            }
            Err(e) => {
                eprintln!("[X11] Failed to connect to X11 display server: {}", e);
                None
            }
        }
    }

    /// 通过窗口类名查找窗口
    ///
    /// 参数：
    /// - class_name: WM_CLASS 属性值（例如："rua"）
    ///
    /// 返回：
    /// - Some(window_id) 如果找到窗口
    /// - None 如果未找到
    pub fn find_window_by_class(&self, class_name: &str) -> Option<Window> {
        let screen = &self.conn.setup().roots[self.screen_num];
        let windows = get_all_windows(&self.conn, screen.root).ok()?;

        eprintln!("[X11] Searching for window with class '{}'", class_name);
        eprintln!("[X11] Total windows to search: {}", windows.len());

        for window in windows {
            if let Some((instance, class)) = get_window_class(&self.conn, window) {
                if instance == class_name || class == class_name {
                    eprintln!("[X11] Found window: {} (instance={}, class={})", window, instance, class);
                    return Some(window);
                }
            }
        }

        eprintln!("[X11] Window with class '{}' not found", class_name);
        None
    }

    /// 显示并激活窗口
    ///
    /// 操作：
    /// 1. 映射窗口 (map_window)
    /// 2. 提升窗口 (configure_window)
    /// 3. 设置焦点 (set_input_focus)
    /// 4. 刷新连接
    pub fn show_window(&self, window: Window) -> Result<(), String> {
        eprintln!("[X11] Showing window {}", window);

        // 1. 映射窗口（使其可见）
        self.conn.map_window(window).map_err(|e| format!("map_window failed: {}", e))?;

        // 2. 提升窗口到最前面
        let aux = ConfigureWindowAux::new().stack_mode(StackMode::ABOVE);
        self.conn
            .configure_window(window, &aux)
            .map_err(|e| format!("configure_window failed: {}", e))?;

        // 3. 设置输入焦点
        self.conn
            .set_input_focus(InputFocus::POINTER_ROOT, window, CURRENT_TIME)
            .map_err(|e| format!("set_input_focus failed: {}", e))?;

        // 4. 发送 _NET_ACTIVE_WINDOW 消息（EWMH 兼容）
        if let Err(e) = send_net_active_window(&self.conn, self.screen_num, window) {
            eprintln!("[X11] Warning: Failed to send _NET_ACTIVE_WINDOW: {}", e);
            // 不返回错误，因为这不是致命的
        }

        // 5. 刷新连接
        self.conn.flush().map_err(|e| format!("flush failed: {}", e))?;

        eprintln!("[X11] Window {} shown successfully", window);
        Ok(())
    }

    /// 隐藏窗口
    ///
    /// 操作：
    /// 1. 取消映射窗口 (unmap_window)
    /// 2. 刷新连接
    pub fn hide_window(&self, window: Window) -> Result<(), String> {
        eprintln!("[X11] Hiding window {}", window);

        // 取消映射窗口（隐藏但不销毁）
        self.conn.unmap_window(window).map_err(|e| format!("unmap_window failed: {}", e))?;

        // 刷新连接
        self.conn.flush().map_err(|e| format!("flush failed: {}", e))?;

        eprintln!("[X11] Window {} hidden successfully", window);
        Ok(())
    }
}

/// 获取窗口的 WM_CLASS 属性
///
/// WM_CLASS 是一个 STRING 类型的属性，包含两个空字符分隔的字符串
/// 格式：<instance>\0<class>\0
///
/// 返回 (instance, class) 元组
fn get_window_class(conn: &impl Connection, window: Window) -> Option<(String, String)> {
    let reply = conn
        .get_property(
            false,
            window,
            AtomEnum::WM_CLASS,
            AtomEnum::STRING,
            0,
            1024,
        )
        .ok()?
        .reply()
        .ok()?;

    let value = reply.value;
    let parts: Vec<&[u8]> = value.split(|&b| b == 0).filter(|p| !p.is_empty()).collect();

    if parts.len() >= 2 {
        let instance = String::from_utf8_lossy(parts[0]).to_string();
        let class = String::from_utf8_lossy(parts[1]).to_string();
        Some((instance, class))
    } else if parts.len() == 1 {
        // 某些窗口可能只有一个值
        let value = String::from_utf8_lossy(parts[0]).to_string();
        Some((value.clone(), value))
    } else {
        None
    }
}

/// 获取根窗口的所有子窗口（递归查询）
fn get_all_windows(conn: &impl Connection, root: Window) -> Result<Vec<Window>, String> {
    let mut windows = Vec::new();
    let mut queue = vec![root];

    while let Some(window) = queue.pop() {
        windows.push(window);

        match conn.query_tree(window) {
            Ok(cookie) => {
                if let Ok(reply) = cookie.reply() {
                    queue.extend(reply.children);
                }
            }
            Err(_) => {
                // Ignore errors for individual windows
                continue;
            }
        }
    }

    Ok(windows)
}

/// 发送 _NET_ACTIVE_WINDOW 客户端消息（EWMH 规范）
///
/// 这个消息告诉窗口管理器激活指定的窗口
fn send_net_active_window(
    conn: &impl Connection,
    screen_num: usize,
    window: Window,
) -> Result<(), String> {
    let screen = &conn.setup().roots[screen_num];

    // 获取 _NET_ACTIVE_WINDOW 原子
    let net_active_window = conn
        .intern_atom(false, b"_NET_ACTIVE_WINDOW")
        .map_err(|e| format!("intern_atom failed: {}", e))?
        .reply()
        .map_err(|e| format!("atom reply failed: {}", e))?
        .atom;

    // 构造客户端消息
    let client_message = ClientMessageEvent {
        response_type: CLIENT_MESSAGE_EVENT,
        format: 32,
        sequence: 0,
        window,
        type_: net_active_window,
        data: ClientMessageData::from([2, 0, 0, 0, 0]),
    };

    // 发送消息到根窗口
    conn.send_event(
        false,
        screen.root,
        EventMask::SUBSTRUCTURE_REDIRECT | EventMask::SUBSTRUCTURE_NOTIFY,
        client_message,
    )
    .map_err(|e| format!("send_event failed: {}", e))?;

    conn.flush()
        .map_err(|e| format!("flush failed: {}", e))?;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_x11_connection() {
        if let Some(wm) = X11WindowManager::new() {
            println!("Successfully connected to X11");

            // 尝试查找窗口
            if let Some(window) = wm.find_window_by_class("rua") {
                println!("Found rua window: {}", window);
            } else {
                println!("rua window not found (expected if not running)");
            }
        } else {
            println!("X11 not available (expected in non-X11 environment)");
        }
    }
}
