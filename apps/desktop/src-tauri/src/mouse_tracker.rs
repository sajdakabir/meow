use crate::windows;
use mouse_position::mouse_position::Mouse;
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Manager};

/// Start the background thread that polls cursor position for:
/// - Notch hover detection (show popover when cursor near top-center)
/// - Auto-hide (hide popover when cursor leaves its area)
pub fn start(handle: AppHandle) {
    std::thread::spawn(move || {
        let mut tick: u64 = 0;
        loop {
            std::thread::sleep(std::time::Duration::from_millis(50));
            tick += 1;

            let (cx, cy) = match Mouse::get_mouse_position() {
                Mouse::Position { x, y } => (x as f64, y as f64),
                Mouse::Error => continue,
            };

            let monitor = match handle.primary_monitor() {
                Ok(Some(m)) => m,
                _ => continue,
            };
            let scale = monitor.scale_factor();
            let screen_w = monitor.size().width as f64 / scale;
            let is_visible = windows::POPOVER_VISIBLE.load(Ordering::SeqCst);
            let center_x = screen_w / 2.0;

            // ── Notch detection (~every 150ms = every 3rd tick) ──
            if tick % 3 == 0 && !is_visible {
                let in_notch = cy <= 10.0 && (cx - center_x).abs() < 150.0;
                if in_notch {
                    let _ = windows::show_popover(&handle, false);
                    continue;
                }
            }

            // ── Auto-hide check (~every 100ms = every 2nd tick) ──
            if tick % 2 == 0 && is_visible {
                let in_popover =
                    if let Some(win) = handle.get_webview_window("popover") {
                        match (win.outer_position(), win.inner_size()) {
                            (Ok(pos), Ok(size)) => {
                                let wx = pos.x as f64 / scale;
                                let wy = pos.y as f64 / scale;
                                let ww = size.width as f64 / scale;
                                let wh = size.height as f64 / scale;
                                let m = 15.0; // grace margin
                                cx >= wx - m && cx <= wx + ww + m && cy >= wy - m && cy <= wy + wh + m
                            }
                            _ => false,
                        }
                    } else {
                        false
                    };

                let in_trigger = cy < 25.0 && (cx - center_x).abs() < 200.0;

                if in_popover || in_trigger {
                    windows::reset_outside_count();
                } else if windows::increment_outside() {
                    let _ = windows::hide_popover(&handle, false);
                }
            }
        }
    });
}
