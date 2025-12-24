use tauri::{
  menu::{Menu, MenuItem},
  tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
  App, Manager,
};

pub fn setup_tray(app: &App) -> anyhow::Result<()> {
  let show_item = MenuItem::with_id(app, "show", "Show", true, None::<&str>)?;
  let devtools_item = MenuItem::with_id(app, "devtools", "DevTools", true, None::<&str>)?;
  let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
  let settings_view = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)?;
  let menu = Menu::with_items(app, &[&show_item,&settings_view, &devtools_item, &quit_item])?;

  let _tray = TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&menu)
    .show_menu_on_left_click(false)
    .on_menu_event(|app, event| match event.id.as_ref() {
      "show" => {
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.show();
          let _ = window.set_focus();
        }
      }
      "settings" => {
        if let Some(window) = app.get_webview_window("Settings") {
          let _ = window.show();
          let _ = window.set_focus();
        }
      }
      "devtools" => {
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.open_devtools();
        }
      }
      "quit" => {
        app.exit(0);
      }
      _ => {}
    })
    .on_tray_icon_event(|tray, event| {
      if let TrayIconEvent::Click {
        button: MouseButton::Left,
        button_state: MouseButtonState::Up,
        ..
      } = event
      {
        let app = tray.app_handle();
        if let Some(window) = app.get_webview_window("main") {
          let _ = window.show();
          let _ = window.set_focus();
        }
      }
    })
    .build(app)?;

  Ok(())
}
