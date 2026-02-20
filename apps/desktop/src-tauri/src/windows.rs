use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

/// Tracks whether the popover is EXPANDED (not whether the window is visible).
/// The window is always visible as a notch pill; this just tracks expand/collapse.
pub static POPOVER_VISIBLE: AtomicBool = AtomicBool::new(false);
static OUTSIDE_COUNT: Mutex<u32> = Mutex::new(0);
const OUTSIDE_THRESHOLD: u32 = 3; // ~300ms before auto-collapse

/// Position the always-visible notch pill at startup.
pub fn setup_windows(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    if let Some(win) = app.get_webview_window("popover") {
        let monitor = app.primary_monitor()?.ok_or("no primary monitor")?;
        let scale = monitor.scale_factor();
        let sw = monitor.size().width as f64 / scale;
        let ww = win.inner_size()?.width as f64 / scale;
        win.set_position(tauri::LogicalPosition::new(sw / 2.0 - ww / 2.0, 0.0))?;
    }
    Ok(())
}

/// Re-center the popover window horizontally.
fn position_popover(handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let win = handle.get_webview_window("popover").ok_or("popover not found")?;
    let monitor = handle.primary_monitor()?.ok_or("no primary monitor")?;
    let scale = monitor.scale_factor();
    let sw = monitor.size().width as f64 / scale;
    let ww = win.inner_size()?.width as f64 / scale;
    win.set_position(tauri::LogicalPosition::new(sw / 2.0 - ww / 2.0, 0.0))?;
    Ok(())
}

/// Expand the popover card. Emits "popover-expand" to the frontend.
pub fn show_popover(handle: &AppHandle, focus: bool) -> Result<(), Box<dyn std::error::Error>> {
    reset_outside_count();
    position_popover(handle)?;

    if let Some(win) = handle.get_webview_window("popover") {
        let _ = win.emit("popover-expand", ());
        if focus {
            let _ = win.set_focus();
        }
        POPOVER_VISIBLE.store(true, Ordering::SeqCst);
    }
    Ok(())
}

/// Collapse back to the notch pill. Emits "popover-collapse" to the frontend.
pub fn hide_popover(handle: &AppHandle, _immediate: bool) -> Result<(), Box<dyn std::error::Error>> {
    reset_outside_count();

    if !POPOVER_VISIBLE.load(Ordering::SeqCst) {
        return Ok(());
    }

    if let Some(win) = handle.get_webview_window("popover") {
        let _ = win.emit("popover-collapse", ());
        POPOVER_VISIBLE.store(false, Ordering::SeqCst);
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
