use tauri::{AppHandle, Manager};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, Modifiers, Shortcut};
use tauri_plugin_notification::NotificationExt;

/// Resize the popover window height (clamped 45-600).
#[tauri::command]
pub async fn resize_window(app: AppHandle, height: f64) -> Result<(), String> {
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

/// Give the popover window keyboard focus so text inputs work.
///
/// Accessory-policy apps are never "active" in the macOS sense, so
/// makeKeyAndOrderFront alone doesn't establish a key window. This command
/// activates the app (ignoring other apps) and then focuses the window so
/// the WebView's <input> elements can receive typing.
#[tauri::command]
pub async fn focus_window(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    crate::platform::activate_app_for_input();
    if let Some(win) = app.get_webview_window("popover") {
        win.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Get the path to the history JSON file in the app's data directory.
fn history_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("history.json"))
}

/// Read session history from disk.
#[tauri::command]
pub async fn get_history(app: AppHandle) -> Result<String, String> {
    let path = history_path(&app)?;
    match std::fs::read_to_string(&path) {
        Ok(data) => Ok(data),
        Err(_) => Ok("[]".to_string()),
    }
}

/// Save session history to disk.
#[tauri::command]
pub async fn save_history(app: AppHandle, data: String) -> Result<(), String> {
    let path = history_path(&app)?;
    std::fs::write(&path, data).map_err(|e| e.to_string())
}

/// Clear session history.
#[tauri::command]
pub async fn clear_history(app: AppHandle) -> Result<(), String> {
    let path = history_path(&app)?;
    std::fs::write(&path, "[]").map_err(|e| e.to_string())
}

/// Register the global Cmd+Shift+F shortcut to toggle the popover.
pub fn register_shortcuts(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = Shortcut::new(Some(Modifiers::SUPER | Modifiers::SHIFT), Code::KeyF);
    app.global_shortcut().on_shortcut(shortcut, |app, _shortcut, _event| {
        let _ = crate::windows::toggle_popover(app);
    })?;
    Ok(())
}
