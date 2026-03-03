use std::sync::atomic::{AtomicUsize, Ordering as AtomicOrdering};
use std::sync::{Mutex, Once};
use tauri::WebviewWindow;

// App handle stored so the ObjC space-change callback can reach Tauri.
static SPACE_HANDLE: Mutex<Option<tauri::AppHandle>> = Mutex::new(None);
static OBSERVER_ONCE: Once = Once::new();

// Stores the ZFNotchWindow subclass pointer (as usize — raw ptrs aren't Send).
static NOTCH_WIN_CLASS: AtomicUsize = AtomicUsize::new(0);
static NOTCH_WIN_CLASS_ONCE: Once = Once::new();

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
// kCGMaximumWindowLevelKey (15) returns the absolute max level the system supports (~2147483630).
// Note: key 14 is kCGScreenSaverWindowLevelKey (= 1000), which is NOT the maximum.
#[cfg(target_os = "macos")]
extern "C" {
    fn CGWindowLevelForKey(key: i32) -> i32;
}
#[cfg(target_os = "macos")]
const K_CG_MAXIMUM_WINDOW_LEVEL_KEY: i32 = 15;

/// Activate the app so its window can receive keyboard input.
///
/// Accessory-policy apps are never "active" in the normal sense, so
/// NSWindow.makeKeyAndOrderFront alone won't establish a key window and
/// keyboard events won't reach the WebView. Calling
/// activateIgnoringOtherApps:YES makes the app momentarily active so the
/// WebView input can accept typing.
///
/// Safe to call frequently — for Accessory-policy apps, activation is
/// ephemeral and doesn't steal focus from the current foreground app.
pub fn activate_app_for_input() {
    use cocoa::base::{id, YES};
    use objc::{class, msg_send, sel, sel_impl};
    unsafe {
        let ns_app: id = msg_send![class!(NSApplication), sharedApplication];
        let _: () = msg_send![ns_app, activateIgnoringOtherApps: YES];
    }
}

/// Override orderOut: on the notch window's NSWindow instance to a no-op,
/// so macOS can never hide it during Space transitions or full-screen changes.
///
/// IMPORTANT: Call this AFTER the window is fully initialized (e.g. with a
/// 1-second delay), not during setup — Tauri's own init calls orderOut:.
pub fn prevent_window_hiding(window: &WebviewWindow) {
    #[cfg(target_os = "macos")]
    unsafe {
        use cocoa::base::id;
        use objc::declare::ClassDecl;
        use objc::runtime::{Class, Object, Sel};
        use objc::{msg_send, sel, sel_impl};

        extern "C" {
            fn object_setClass(obj: id, cls: *const Class) -> *const Class;
        }

        let ns_win = match window.ns_window() {
            Ok(ptr) => ptr as id,
            Err(_) => return,
        };

        // Create the subclass exactly once; store as usize for thread-safety.
        NOTCH_WIN_CLASS_ONCE.call_once(|| {
            // Get the actual runtime class of this window instance so we
            // subclass it (not just NSWindow), preserving all Tauri overrides.
            let actual_class: *mut Class = msg_send![ns_win, class];

            let mut decl = match ClassDecl::new("ZFNotchWindow", &*actual_class) {
                Some(d) => d,
                None => return, // class already registered (shouldn't happen)
            };

            // Override orderOut: to be a no-op — the notch window is NEVER hidden.
            extern "C" fn no_op_order_out(_this: &Object, _cmd: Sel, _sender: id) {}
            decl.add_method(
                sel!(orderOut:),
                no_op_order_out as extern "C" fn(&Object, Sel, id),
            );

            let cls: &Class = decl.register();
            NOTCH_WIN_CLASS.store(cls as *const Class as usize, AtomicOrdering::SeqCst);
        });

        // ISA-swap the window instance into our subclass.
        let cls_ptr = NOTCH_WIN_CLASS.load(AtomicOrdering::SeqCst) as *const Class;
        if !cls_ptr.is_null() {
            object_setClass(ns_win, cls_ptr);
        }
    }
}

/// Register for NSWorkspaceActiveSpaceDidChangeNotification.
///
/// macOS creates a brand-new Space whenever an app enters full-screen mode.
/// Polling (even every 480 ms) is too slow and unreliable to catch the
/// transition. This observer fires the instant the active Space changes and
/// immediately re-asserts the window level and ordering, so the notch widget
/// appears in the new Space before any animation completes.
pub fn register_space_observer(handle: tauri::AppHandle) {
    use cocoa::base::{id, nil};
    use cocoa::foundation::NSString;
    use objc::declare::ClassDecl;
    use objc::runtime::{Object, Sel};
    use objc::{class, msg_send, sel, sel_impl};

    *SPACE_HANDLE.lock().unwrap() = Some(handle);

    OBSERVER_ONCE.call_once(|| unsafe {
        // Called by Objective-C on the main thread whenever the active Space changes.
        extern "C" fn on_space_change(_this: &Object, _cmd: Sel, _notif: id) {
            use tauri::Manager;
            let h = SPACE_HANDLE.lock().unwrap().clone();
            if let Some(handle) = h {
                let h2 = handle.clone();
                let _ = handle.run_on_main_thread(move || {
                    // Activate the app so orderFrontRegardless works in the
                    // new Space. Accessory-policy apps don't steal focus.
                    activate_app_for_input();
                    if let Some(win) = h2.get_webview_window("popover") {
                        set_above_menu_bar(&win);
                    }
                });
            }
        }

        let mut decl = ClassDecl::new("ZFSpaceObserver", class!(NSObject))
            .expect("ZFSpaceObserver class declaration failed");
        decl.add_method(
            sel!(onSpaceChange:),
            on_space_change as extern "C" fn(&Object, Sel, id),
        );
        let cls = decl.register();

        let observer: id = msg_send![cls, new];
        let workspace: id = msg_send![class!(NSWorkspace), sharedWorkspace];
        let nc: id = msg_send![workspace, notificationCenter];
        let name = NSString::alloc(nil)
            .init_str("NSWorkspaceActiveSpaceDidChangeNotification");
        let _: () = msg_send![nc,
            addObserver: observer
            selector: sel!(onSpaceChange:)
            name: name
            object: nil
        ];
    });
}

/// Place the window above the menu bar so it overlaps the notch area,
/// and make it visible on all spaces including full-screen apps.
pub fn set_above_menu_bar(window: &WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        use cocoa::appkit::NSWindow;
        use cocoa::base::{id, NO};
        use objc::{msg_send, sel, sel_impl};

        if let Ok(ns_window) = window.ns_window() {
            unsafe {
                let ns_win = ns_window as id;

                // Absolute maximum window level — above full-screen apps, screen savers, etc.
                let max_level = CGWindowLevelForKey(K_CG_MAXIMUM_WINDOW_LEVEL_KEY);
                ns_win.setLevel_(max_level as i64);

                ns_win.setHidesOnDeactivate_(NO);

                // Collection behavior flags (raw bits to include macOS 13+ flags
                // not available in the cocoa crate):
                //
                // CanJoinAllSpaces    (1 << 0)  — window exists in ALL Spaces
                // IgnoresCycle        (1 << 6)  — skip Cmd-` cycling
                // FullScreenAuxiliary (1 << 8)  — allowed inside full-screen Spaces
                // Auxiliary           (1 << 17) — macOS 13+: auxiliary window, appears
                //                                 alongside any app (Stage Manager aware)
                // CanJoinAllApplications (1 << 18) — macOS 13+: window can appear
                //                                     with ANY active application
                let behavior: u64 =
                    (1 << 0) | (1 << 6) | (1 << 8) | (1 << 17) | (1 << 18);
                let _: () = msg_send![ns_win, setCollectionBehavior: behavior];

                ns_win.orderFrontRegardless();
            }
        }
    }
}
