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

/// Auto-collapse the expanded popover when the cursor leaves its bounds.
pub fn start(handle: AppHandle) {
    std::thread::spawn(move || {
        loop {
            std::thread::sleep(std::time::Duration::from_millis(100));

            // Only check when expanded
            if !windows::POPOVER_VISIBLE.load(Ordering::SeqCst) {
                windows::reset_outside_count();
                continue;
            }

            let (cx, cy) = match cursor_position() {
                Some(pos) => pos,
                None => continue,
            };

            let monitor = match handle.primary_monitor() {
                Ok(Some(m)) => m,
                _ => continue,
            };
            let scale = monitor.scale_factor();

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
    });
}
