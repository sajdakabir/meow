use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, Manager};

pub static POPOVER_VISIBLE: AtomicBool = AtomicBool::new(false);
static OUTSIDE_COUNT: Mutex<u32> = Mutex::new(0);
const OUTSIDE_THRESHOLD: u32 = 2;

/// Initial window setup.
pub fn setup_windows(_app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
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

/// Show the popover with a smooth fade-in.
pub fn show_popover(handle: &AppHandle, focus: bool) -> Result<(), Box<dyn std::error::Error>> {
    reset_outside_count();
    position_popover(handle)?;

    if let Some(win) = handle.get_webview_window("popover") {
        // Start transparent, then fade in
        #[cfg(target_os = "macos")]
        crate::platform::set_opacity(&win, 0.0);

        win.show()?;
        if focus {
            win.set_focus()?;
        }
        POPOVER_VISIBLE.store(true, Ordering::SeqCst);

        // Tell the frontend it's being shown
        let _ = win.emit("popover-shown", ());

        // Smooth fade in
        #[cfg(target_os = "macos")]
        {
            let h = handle.clone();
            std::thread::spawn(move || {
                let steps = 8;
                for i in 1..=steps {
                    let opacity = i as f64 / steps as f64;
                    if let Some(w) = h.get_webview_window("popover") {
                        crate::platform::set_opacity(&w, opacity);
                    }
                    std::thread::sleep(std::time::Duration::from_millis(20));
                }
            });
        }
    }
    Ok(())
}

/// Hide the popover with a smooth fade-out.
pub fn hide_popover(handle: &AppHandle, immediate: bool) -> Result<(), Box<dyn std::error::Error>> {
    reset_outside_count();

    let win = match handle.get_webview_window("popover") {
        Some(w) if w.is_visible().unwrap_or(false) => w,
        _ => return Ok(()),
    };

    // Tell the frontend it's being hidden
    let _ = win.emit("popover-hidden", ());

    if immediate {
        win.hide()?;
        #[cfg(target_os = "macos")]
        crate::platform::set_opacity(&win, 1.0);
        POPOVER_VISIBLE.store(false, Ordering::SeqCst);
    } else {
        let h = handle.clone();
        std::thread::spawn(move || {
            let steps = 8;
            for i in 1..=steps {
                let opacity = 1.0 - (i as f64 / steps as f64);
                if let Some(w) = h.get_webview_window("popover") {
                    #[cfg(target_os = "macos")]
                    crate::platform::set_opacity(&w, opacity.max(0.0));
                }
                std::thread::sleep(std::time::Duration::from_millis(20));
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
        hide_popover(handle, false)
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
