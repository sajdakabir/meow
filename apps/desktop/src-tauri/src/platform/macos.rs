use tauri::WebviewWindow;

/// Set the alpha value (opacity) of a window on macOS.
/// Uses the raw NSWindow handle since Tauri v2 doesn't expose setOpacity natively.
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
