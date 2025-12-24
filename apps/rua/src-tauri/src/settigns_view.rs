use tauri::{App, WebviewUrl};

pub fn new_settings_view(app: &mut App) -> anyhow::Result<()> {
  let settings = tauri::WebviewWindowBuilder::new(
    app,
    "Settings",
    WebviewUrl::App("index.html?type=settings".into()),
  )
  .title("Rua Settings")
  .skip_taskbar(true)
  .decorations(false)
  .inner_size(1000f64, 800f64)
  .resizable(false)
  .build()?;

  settings.hide()?;
  Ok(())
}
