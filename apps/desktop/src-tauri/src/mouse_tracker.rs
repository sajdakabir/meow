use crate::windows;
use core_graphics::event::{CGEvent, CGEventType};
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Manager};

/// Get cursor position using CoreGraphics (top-left origin, logical points).
fn cursor_position() -> Option<(f64, f64)> {
    let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState).ok()?;
    let event = CGEvent::new(source).ok()?;
    let pt = event.location();
    Some((pt.x, pt.y))
}

/// Start the background thread that polls cursor position for:
/// - Notch hover detection (show popover when cursor near top-center)
/// - Auto-hide (hide popover when cursor leaves its area)
pub fn start(handle: AppHandle) {
    std::thread::spawn(move || {
        let mut tick: u64 = 0;
        let mut miss_streak: u32 = 0;
        loop {
            std::thread::sleep(std::time::Duration::from_millis(50));
            tick += 1;

            let (cx, cy) = match cursor_position() {
                Some(pos) => {
                    miss_streak = 0;
                    pos
                }
                None => {
                    miss_streak += 1;
                    if miss_streak > 20
                        && windows::POPOVER_VISIBLE.load(Ordering::SeqCst)
                    {
                        let _ = windows::hide_popover(&handle, true);
                    }
                    continue;
                }
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
                                // CoreGraphics returns logical points (top-left origin).
                                // Tauri returns physical pixels — divide by scale.
                                let m = 30.0;
                                let wx = pos.x as f64 / scale;
                                let wy = pos.y as f64 / scale;
                                let ww = size.width as f64 / scale;
                                let wh = size.height as f64 / scale;
                                cx >= wx - m && cx <= wx + ww + m
                                    && cy >= wy - m && cy <= wy + wh + m
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
