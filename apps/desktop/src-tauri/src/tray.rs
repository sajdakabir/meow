use tauri::{
    image::Image,
    menu::{MenuBuilder, MenuItemBuilder},
    tray::TrayIconBuilder,
    Emitter, Manager,
};

pub fn create_tray(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let icon_bytes = include_bytes!("../icons/tray-icon.png");
    let icon = Image::from_bytes(icon_bytes)?;

    let about = MenuItemBuilder::with_id("about", "About meow")
        .build(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit meow")
        .accelerator("CommandOrControl+Q")
        .build(app)?;

    let menu = MenuBuilder::new(app)
        .item(&about)
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
            "about" => {
                let _ = crate::windows::show_popover(app, true);
                if let Some(w) = app.get_webview_window("popover") {
                    let _ = w.emit("open-about", ());
                }
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)?;

    Ok(())
}
