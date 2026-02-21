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

/// Place the window above the menu bar so it overlaps the notch area,
/// and make it visible on all spaces including full-screen apps.
/// NSStatusWindowLevel (25) sits above the menu bar (24).
pub fn set_above_menu_bar(window: &WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
        use cocoa::base::{id, NO};

        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let ns_win = ns_window as id;
                // Level 100: above full-screen app windows but below entitlement-restricted levels
                ns_win.setLevel_(100);
                // Prevent the window from hiding when the app loses focus (critical for
                // full-screen: without this, the window disappears when another app activates)
                ns_win.setHidesOnDeactivate_(NO);
                // canJoinAllSpaces:    appear on every Space / desktop
                // fullScreenAuxiliary: coexist with full-screen windows on their Space
                ns_win.setCollectionBehavior_(
                    NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                        | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary,
                );
            }
        }
    }
}
