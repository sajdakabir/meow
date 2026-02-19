use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Manager};

pub static POPOVER_VISIBLE: AtomicBool = AtomicBool::new(false);
static OUTSIDE_COUNT: Mutex<u32> = Mutex::new(0);
const OUTSIDE_THRESHOLD: u32 = 2;

/// Position the companion at bottom-center and set it click-through.
pub fn setup_windows(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let monitor = app.primary_monitor()?.ok_or("no primary monitor")?;
    let scale = monitor.scale_factor();
    let sw = monitor.size().width as f64 / scale;
    let sh = monitor.size().height as f64 / scale;

    if let Some(companion) = app.get_webview_window("companion") {
        let cw = 160.0;
        let ch = 100.0;
        companion.set_position(tauri::LogicalPosition::new(sw / 2.0 - cw / 2.0, sh - ch))?;
        companion.set_ignore_cursor_events(true)?;
        companion.show()?;
    }

    Ok(())
}

/// Position popover at top-center of primary display.
fn position_popover(handle: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    let win = handle.get_webview_window("popover").ok_or("popover not found")?;
    let monitor = handle.primary_monitor()?.ok_or("no primary monitor")?;
    let scale = monitor.scale_factor();
    let sw = monitor.size().width as f64 / scale;
    let ww = win.inner_size()?.width as f64 / scale;
    win.set_position(tauri::LogicalPosition::new(sw / 2.0 - ww / 2.0, 0.0))?;
    Ok(())
}

/// Show the popover (optionally with focus).
pub fn show_popover(handle: &AppHandle, focus: bool) -> Result<(), Box<dyn std::error::Error>> {
    reset_outside_count();
    position_popover(handle)?;

    if let Some(win) = handle.get_webview_window("popover") {
        #[cfg(target_os = "macos")]
        crate::platform::set_opacity(&win, 1.0);

        win.show()?;
        if focus {
            win.set_focus()?;
        }
        POPOVER_VISIBLE.store(true, Ordering::SeqCst);
    }
    Ok(())
}

/// Hide the popover. If `immediate`, hide instantly; otherwise fade out.
pub fn hide_popover(handle: &AppHandle, immediate: bool) -> Result<(), Box<dyn std::error::Error>> {
    reset_outside_count();

    let win = match handle.get_webview_window("popover") {
        Some(w) if w.is_visible().unwrap_or(false) => w,
        _ => return Ok(()),
    };

    if immediate {
        win.hide()?;
        #[cfg(target_os = "macos")]
        crate::platform::set_opacity(&win, 1.0);
        POPOVER_VISIBLE.store(false, Ordering::SeqCst);
    } else {
        let h = handle.clone();
        std::thread::spawn(move || {
            for i in 1..=5 {
                let opacity = 1.0 - (i as f64 * 0.2);
                if let Some(w) = h.get_webview_window("popover") {
                    #[cfg(target_os = "macos")]
                    crate::platform::set_opacity(&w, opacity.max(0.0));
                }
                std::thread::sleep(std::time::Duration::from_millis(16));
            }
            if let Some(w) = h.get_webview_window("popover") {
                let _ = w.hide();
                #[cfg(target_os = "macos")]
                crate::platform::set_opacity(&w, 1.0);
            }
            POPOVER_VISIBLE.store(false, Ordering::SeqCst);
        });
    }
    Ok(())
}

/// Toggle popover visibility.
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
