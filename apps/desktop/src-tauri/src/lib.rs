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
        ])
        .setup(|app| {
            // Hide from dock on macOS (menu-bar-only app)
            #[cfg(target_os = "macos")]
            app.set_activation_policy(tauri::ActivationPolicy::Accessory);

            // Position windows (created by tauri.conf.json)
            windows::setup_windows(app)?;

            // Set up tray icon
            tray::create_tray(app)?;

            // Register global shortcuts
            commands::register_shortcuts(app)?;

            // Start mouse tracking (notch hover + auto-hide)
            mouse_tracker::start(app.handle().clone());

            // Show popover on first launch after a short delay
            let handle = app.handle().clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(800));
                let _ = windows::show_popover(&handle, true);
            });

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
