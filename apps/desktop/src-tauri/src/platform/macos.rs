use tauri::WebviewWindow;

/// Set the alpha value (opacity) of a window on macOS.
pub fn set_opacity(window: &WebviewWindow, opacity: f64) {
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::NSWindow;
        use cocoa::base::id;

        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let ns_win = ns_window as id;
                ns_win.setAlphaValue_(opacity);
            }
        }
    }
}

/// Place the window above the menu bar so it overlaps the notch area.
/// NSStatusWindowLevel (25) sits above the menu bar (24).
pub fn set_above_menu_bar(window: &WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::NSWindow;
        use cocoa::base::id;

        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let ns_win = ns_window as id;
                // NSStatusWindowLevel = 25
                ns_win.setLevel_(25);
            }
        }
    }
}
