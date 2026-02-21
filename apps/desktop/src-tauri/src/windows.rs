use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

/// Tracks whether the popover is EXPANDED (not whether the window is visible).
/// The window is always visible as a notch pill; this just tracks expand/collapse.
pub static POPOVER_VISIBLE: AtomicBool = AtomicBool::new(false);
static OUTSIDE_COUNT: Mutex<u32> = Mutex::new(0);
const OUTSIDE_THRESHOLD: u32 = 3; // ~240ms detect + 200ms animation = snappy collapse

const COLLAPSED_WIDTH: f64 = 300.0; // wider than notch so content sits on both wings
const EXPANDED_WIDTH: f64 = 350.0;

/// Position the always-visible notch pill at startup and set it above the menu bar.
pub fn setup_windows(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(win) = app.get_webview_window("popover") {
        #[cfg(target_os = "macos")]
        crate::platform::set_above_menu_bar(&win);

        // Start collapsed at notch width
        let _ = win.set_size(tauri::LogicalSize::new(COLLAPSED_WIDTH, 37.0));

        let monitor = app.primary_monitor()?.ok_or("no primary monitor")?;
        let scale = monitor.scale_factor();
        let sw = monitor.size().width as f64 / scale;
        win.set_position(tauri::LogicalPosition::new(sw / 2.0 - COLLAPSED_WIDTH / 2.0, 0.0))?;
    }

    // Re-apply NSWindow settings after 1s on the main thread, to override
    // any Tauri post-setup config processing that may strip our flags
    let h = app.handle().clone();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(1000));
        let h2 = h.clone();
        let _ = h.run_on_main_thread(move || {
            if let Some(win) = h2.get_webview_window("popover") {
                #[cfg(target_os = "macos")]
                crate::platform::set_above_menu_bar(&win);
            }
        });
    });

    Ok(())
}

/// Re-center the popover window horizontally at the given width.
fn center_popover(handle: &AppHandle, width: f64) -> Result<(), Box<dyn std::error::Error>> {
    let win = handle.get_webview_window("popover").ok_or("popover not found")?;
    let monitor = handle.primary_monitor()?.ok_or("no primary monitor")?;
    let scale = monitor.scale_factor();
    let sw = monitor.size().width as f64 / scale;
    win.set_position(tauri::LogicalPosition::new(sw / 2.0 - width / 2.0, 0.0))?;
    Ok(())
}

/// Expand the popover card. Emits "popover-expand" to the frontend.
pub fn show_popover(handle: &AppHandle, focus: bool) -> Result<(), Box<dyn std::error::Error>> {
    reset_outside_count();

    if let Some(win) = handle.get_webview_window("popover") {
        // Widen to expanded size and re-center
        let _ = win.set_size(tauri::LogicalSize::new(EXPANDED_WIDTH, 50.0));
        center_popover(handle, EXPANDED_WIDTH)?;

        let _ = win.emit("popover-expand", ());
        if focus {
            let _ = win.set_focus();
        }
        POPOVER_VISIBLE.store(true, Ordering::SeqCst);
    }
    Ok(())
}

/// Collapse back to the notch pill. Emits "popover-collapse" to the frontend.
/// The native window resize is delayed to let the frontend animation play.
pub fn hide_popover(handle: &AppHandle, _immediate: bool) -> Result<(), Box<dyn std::error::Error>> {
    reset_outside_count();

    if !POPOVER_VISIBLE.load(Ordering::SeqCst) {
        return Ok(());
    }

    if let Some(win) = handle.get_webview_window("popover") {
        let _ = win.emit("popover-collapse", ());
        POPOVER_VISIBLE.store(false, Ordering::SeqCst);

        // Delay window resize to allow frontend collapse animation to complete
        let h = handle.clone();
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(200));
            // Only shrink if still collapsed (user might have re-expanded)
            if !POPOVER_VISIBLE.load(Ordering::SeqCst) {
                if let Some(w) = h.get_webview_window("popover") {
                    let _ = w.set_size(tauri::LogicalSize::new(COLLAPSED_WIDTH, 37.0));
                }
                let _ = center_popover(&h, COLLAPSED_WIDTH);
            }
        });
    }
    Ok(())
}

/// Toggle between expanded and collapsed.
pub fn toggle_popover(handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    if POPOVER_VISIBLE.load(Ordering::SeqCst) {
        hide_popover(handle, true)
    } else {
        show_popover(handle, true)
    }
}

pub fn increment_outside() -> bool {
    let mut count = OUTSIDE_COUNT.lock().unwrap();
    *count += 1;
    *count >= OUTSIDE_THRESHOLD
}

pub fn reset_outside_count() {
    *OUTSIDE_COUNT.lock().unwrap() = 0;
}
