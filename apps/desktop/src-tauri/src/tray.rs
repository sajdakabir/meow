use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Emitter, Manager,
};

pub fn create_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let icon_bytes = include_bytes!("../icons/tray-icon.png");
    let icon = Image::from_bytes(icon_bytes)?;

    let start_timer = MenuItemBuilder::with_id("start_focus", "Start Timer (25 min)")
        .accelerator("CommandOrControl+T")
        .build(app)?;
    let settings = MenuItemBuilder::with_id("settings", "Settings...")
        .accelerator("CommandOrControl+,")
        .build(app)?;
    let check_updates = MenuItemBuilder::with_id("check_updates", "Check for Updates...")
        .build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit meow")
        .accelerator("CommandOrControl+Q")
        .build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&start_timer)
        .separator()
        .item(&settings)
        .separator()
        .item(&check_updates)
        .separator()
        .item(&quit)
        .build()?;

    let _tray = TrayIconBuilder::with_id("main-tray")
        .icon(icon)
        .icon_as_template(true)
        .tooltip("meow")
        .menu(&menu)
        .show_menu_on_left_click(true)
        .on_menu_event(|app, event| match event.id().as_ref() {
            "start_focus" => {
                let _ = crate::windows::show_popover(app, true);
                if let Some(w) = app.get_webview_window("popover") {
                    let _ = w.emit("tray-start-focus", ());
                }
            }
            "settings" => {
                let _ = crate::windows::show_popover(app, true);
                if let Some(w) = app.get_webview_window("popover") {
                    let _ = w.emit("open-settings", ());
                }
            }
            "check_updates" => {
                // TODO: implement update check
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
