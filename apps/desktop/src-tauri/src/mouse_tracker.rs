use crate::windows;
use core_graphics::event::CGEvent;
use core_graphics::event_source::{CGEventSource, CGEventSourceStateID};
use std::sync::atomic::Ordering;
use tauri::{AppHandle, Manager};

/// Get cursor position via CoreGraphics (logical points, top-left origin).
fn cursor_position() -> Option<(f64, f64)> {
    let source = CGEventSource::new(CGEventSourceStateID::HIDSystemState).ok()?;
    let event = CGEvent::new(source).ok()?;
    let pt = event.location();
    Some((pt.x, pt.y))
}

/// Polls cursor position for:
/// - Notch hover: expand popover when cursor enters the notch area
/// - Auto-collapse: collapse popover when cursor leaves the expanded area
pub fn start(handle: AppHandle) {
    std::thread::spawn(move || {
        let mut tick: u64 = 0;
        loop {
            std::thread::sleep(std::time::Duration::from_millis(80));
            tick += 1;

            let (cx, cy) = match cursor_position() {
                Some(pos) => pos,
                None => continue,
            };

            let monitor = match handle.primary_monitor() {
                Ok(Some(m)) => m,
                _ => continue,
            };
            let scale = monitor.scale_factor();
            let screen_w = monitor.size().width as f64 / scale;
            let center_x = screen_w / 2.0;
            let is_expanded = windows::POPOVER_VISIBLE.load(Ordering::SeqCst);

            // ── Notch hover: expand when cursor enters notch area ──
            if !is_expanded && tick % 2 == 0 {
                // Notch zone: within ~170px of screen center, y < 10px (very top)
                let in_notch = cy <= 10.0 && (cx - center_x).abs() < 170.0;
                if in_notch {
                    let _ = windows::show_popover(&handle, false);
                    continue;
                }
            }

            // ── Auto-collapse when cursor leaves expanded popover ──
            if is_expanded {
                let in_popover = if let Some(win) = handle.get_webview_window("popover") {
                    match (win.outer_position(), win.inner_size()) {
                        (Ok(pos), Ok(size)) => {
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

                if in_popover {
                    windows::reset_outside_count();
                } else if windows::increment_outside() {
                    let _ = windows::hide_popover(&handle, false);
                }
            }
        }
    });
}
