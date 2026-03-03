mod commands;
mod mouse_tracker;
mod tray;
mod windows;

#[cfg(target_os = "macos")]
mod platform;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::resize_window,
            commands::show_notification,
            commands::update_tray_title,
            commands::window_close,
            commands::focus_window,
        ])
        .setup(|app| {
            // Accessory policy: no dock icon, but windows can float above full-screen apps.
            // The tray icon is still available for accessing the app.
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Position windows (created by tauri.conf.json)
            windows::setup_windows(app)?;

            // Set up tray icon
            tray::create_tray(app)?;

            // Register global shortcuts
            commands::register_shortcuts(app)?;

            // Register for NSWorkspaceActiveSpaceDidChangeNotification so the
            // notch window is immediately re-asserted when any app enters or
            // exits full-screen (which creates / destroys a dedicated Space).
            #[cfg(target_os = "macos")]
            crate::platform::register_space_observer(app.handle().clone());

            // Start mouse tracking (auto-collapse when cursor leaves expanded popover)
            mouse_tracker::start(app.handle().clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
