use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use tauri_plugin_notification::NotificationExt;

/// Resize the popover window height (clamped 45-600).
/// Also resets the outside-count so a resize doesn't trigger auto-collapse.
#[tauri::command]
pub async fn resize_window(app: AppHandle, height: f64) -> Result<(), String> {
    crate::windows::reset_outside_count();
    if let Some(win) = app.get_webview_window("popover") {
        let clamped = height.max(45.0).min(600.0);
        let scale = win.scale_factor().map_err(|e| e.to_string())?;
        let cur = win.inner_size().map_err(|e| e.to_string())?;
        win.set_size(tauri::LogicalSize::new(cur.width as f64 / scale, clamped))
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Show a native desktop notification.
#[tauri::command]
pub async fn show_notification(app: AppHandle, title: String, body: String) -> Result<(), String> {
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())?;
    Ok(())
}

/// Update the tray icon title (shows timer countdown in menu bar).
#[tauri::command]
pub async fn update_tray_title(app: AppHandle, title: String) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id("main-tray") {
        tray.set_title(if title.is_empty() {
            None
        } else {
            Some(&title)
        })
        .map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Hide the popover window.
#[tauri::command]
pub async fn window_close(app: AppHandle) -> Result<(), String> {
    crate::windows::hide_popover(&app, true).map_err(|e| e.to_string())
}

/// Register the global Cmd+Shift+F shortcut to toggle the popover.
pub fn register_shortcuts(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyF);
    app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, _event| {
        let _ = crate::windows::toggle_popover(app);
    })?;
    Ok(())
}
