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

// CGWindowLevelForKey: public CoreGraphics function to get system-defined window levels.
// kCGMaximumWindowLevelKey (14) returns the absolute max level the system supports.
#[cfg(target_os = "macos")]
extern "C" {
    fn CGWindowLevelForKey(key: i32) -> i32;
    fn CGSMainConnectionID() -> i32;
    fn CGSSetWindowTags(cid: i32, wid: i32, tags: *const i32, size: i32) -> i32;
}
#[cfg(target_os = "macos")]
const K_CG_MAXIMUM_WINDOW_LEVEL_KEY: i32 = 14;

/// Place the window above the menu bar so it overlaps the notch area,
/// and make it visible on all spaces including full-screen apps.
pub fn set_above_menu_bar(window: &WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::{NSWindow, NSWindowCollectionBehavior};
        use cocoa::base::{id, NO};
        use objc::{msg_send, sel, sel_impl};

        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let ns_win = ns_window as id;

                // Use the system's maximum window level (from CGWindowLevelForKey).
                // This is higher than NSPopUpMenuWindowLevel and puts the window
                // above full-screen app windows on macOS Sequoia.
                let max_level = CGWindowLevelForKey(K_CG_MAXIMUM_WINDOW_LEVEL_KEY);
                ns_win.setLevel_((max_level - 1) as i64);

                ns_win.setHidesOnDeactivate_(NO);
                ns_win.setCollectionBehavior_(
                    NSWindowCollectionBehavior::NSWindowCollectionBehaviorCanJoinAllSpaces
                        | NSWindowCollectionBehavior::NSWindowCollectionBehaviorStationary
                        | NSWindowCollectionBehavior::NSWindowCollectionBehaviorIgnoresCycle
                        | NSWindowCollectionBehavior::NSWindowCollectionBehaviorFullScreenAuxiliary,
                );

                // CGS private API: set the "sticky" tag (bit 11) so the window
                // server keeps this window on every space, including full-screen spaces.
                // This is more reliable than NSWindowCollectionBehavior alone on
                // macOS Sonoma / Sequoia where full-screen spaces may ignore AppKit flags.
                let window_number: i64 = msg_send![ns_win, windowNumber];
                let cid = CGSMainConnectionID();
                let tags: [i32; 2] = [0x800, 0]; // bit 11 = sticky
                CGSSetWindowTags(cid, window_number as i32, tags.as_ptr(), 32);

                ns_win.orderFrontRegardless();
            }
        }
    }
}
