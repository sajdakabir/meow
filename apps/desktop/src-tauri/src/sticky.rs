//! A sticky note that floats over everything.
//!
//! The note reuses the same window treatment as the notch pill
//! (`set_above_menu_bar`): maximum window level plus a collection behavior
//! that joins every Space, so it stays put over full-screen apps and Stage
//! Manager rather than being left behind on one desktop.
//!
//! Text and geometry live in `sticky.json` in the app data dir. The frontend
//! autosaves the text as you type, and each save also captures where the
//! window currently sits, so a note comes back exactly where it was left.

use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager, WebviewWindow};

pub const WINDOW_LABEL: &str = "sticky";

const DEFAULT_WIDTH: f64 = 240.0;
const DEFAULT_HEIGHT: f64 = 250.0;
const MIN_WIDTH: f64 = 180.0;
const MIN_HEIGHT: f64 = 150.0;
/// Inset from the top-right of the screen when a note has no saved position.
const DEFAULT_INSET: f64 = 40.0;

#[derive(Serialize, Deserialize, Clone)]
#[serde(default)]
pub struct StickyNote {
    pub text: String,
    /// Absolute screen position; `None` until the note has been placed once.
    pub x: Option<f64>,
    pub y: Option<f64>,
    pub width: f64,
    pub height: f64,
}

impl Default for StickyNote {
    fn default() -> Self {
        Self {
            text: String::new(),
            x: None,
            y: None,
            width: DEFAULT_WIDTH,
            height: DEFAULT_HEIGHT,
        }
    }
}

fn note_path(app: &AppHandle) -> Result<std::path::PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("sticky.json"))
}

fn read_note(app: &AppHandle) -> StickyNote {
    note_path(app)
        .ok()
        .and_then(|p| std::fs::read_to_string(p).ok())
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

fn write_note(app: &AppHandle, note: &StickyNote) -> Result<(), String> {
    let path = note_path(app)?;
    let data = serde_json::to_string(note).map_err(|e| e.to_string())?;
    std::fs::write(path, data).map_err(|e| e.to_string())
}

/// Current on-screen geometry, in logical points.
fn window_geometry(win: &WebviewWindow) -> Option<(f64, f64, f64, f64)> {
    let scale = win.scale_factor().ok()?;
    let pos = win.outer_position().ok()?;
    let size = win.inner_size().ok()?;
    Some((
        pos.x as f64 / scale,
        pos.y as f64 / scale,
        size.width as f64 / scale,
        size.height as f64 / scale,
    ))
}

/// Fold the window's current position and size into the stored note.
fn capture_geometry(app: &AppHandle, note: &mut StickyNote) {
    if let Some(win) = app.get_webview_window(WINDOW_LABEL) {
        if let Some((x, y, w, h)) = window_geometry(&win) {
            note.x = Some(x);
            note.y = Some(y);
            note.width = w;
            note.height = h;
        }
    }
}

/// Keep a restored position on screen — a note saved on a monitor that is no
/// longer attached would otherwise open somewhere unreachable.
fn clamp_to_screen(app: &AppHandle, x: f64, y: f64, w: f64) -> Option<(f64, f64)> {
    let monitor = app.primary_monitor().ok()??;
    let scale = monitor.scale_factor();
    let sw = monitor.size().width as f64 / scale;
    let sh = monitor.size().height as f64 / scale;
    // Leave a sliver on screen in each direction so the note can be grabbed.
    Some((
        x.min(sw - 60.0).max(-(w - 60.0)),
        y.min(sh - 40.0).max(0.0),
    ))
}

/// Show the sticky note, creating the window the first time.
#[tauri::command]
pub async fn open_sticky_note(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(WINDOW_LABEL) {
        let _ = win.show();
        apply_floating(&app, &win);
        return Ok(());
    }

    let note = read_note(&app);

    let mut builder = tauri::webview::WebviewWindowBuilder::new(
        &app,
        WINDOW_LABEL,
        tauri::WebviewUrl::App("sticky".into()),
    )
    .title("meow — Sticky Note")
    .inner_size(note.width, note.height)
    .min_inner_size(MIN_WIDTH, MIN_HEIGHT)
    .decorations(false)
    .transparent(true)
    .resizable(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .shadow(true)
    .focused(true);

    builder = match (note.x, note.y) {
        (Some(x), Some(y)) => {
            let (x, y) = clamp_to_screen(&app, x, y, note.width).unwrap_or((x, y));
            builder.position(x, y)
        }
        // First open: tuck it under the top-right corner, clear of the notch.
        _ => {
            let pos = app
                .primary_monitor()
                .ok()
                .flatten()
                .map(|m| {
                    let scale = m.scale_factor();
                    let sw = m.size().width as f64 / scale;
                    (sw - note.width - DEFAULT_INSET, DEFAULT_INSET)
                })
                .unwrap_or((DEFAULT_INSET, DEFAULT_INSET));
            builder.position(pos.0, pos.1)
        }
    };

    let win = builder.build().map_err(|e| {
        eprintln!("[sticky] open: build failed: {e}");
        e.to_string()
    })?;
    apply_floating(&app, &win);

    // Save where the note ended up before it goes away, so text-only saves
    // aren't the only thing that persists a drag.
    let handle = app.clone();
    win.on_window_event(move |event| {
        if matches!(
            event,
            tauri::WindowEvent::CloseRequested { .. } | tauri::WindowEvent::Destroyed
        ) {
            let mut note = read_note(&handle);
            capture_geometry(&handle, &mut note);
            let _ = write_note(&handle, &note);
        }
    });

    Ok(())
}

/// Raise the note above everything and make it follow the user across Spaces.
///
/// The macOS path touches AppKit (`ns_window`, `setLevel:`), which is only
/// safe on the main thread — commands run off it, so hop across first.
fn apply_floating(app: &AppHandle, win: &WebviewWindow) {
    #[cfg(target_os = "macos")]
    {
        let _ = win;
        let handle = app.clone();
        let _ = app.run_on_main_thread(move || {
            if let Some(win) = handle.get_webview_window(WINDOW_LABEL) {
                crate::platform::set_above_menu_bar(&win);
                // Without this the first click on the note only activates meow.
                crate::platform::accept_first_mouse(&win);
            }
        });
    }
    #[cfg(not(target_os = "macos"))]
    {
        let _ = app;
        let _ = win.set_always_on_top(true);
    }
}

/// Hide the note, remembering where it was.
#[tauri::command]
pub async fn close_sticky_note(app: AppHandle) -> Result<(), String> {
    if let Some(win) = app.get_webview_window(WINDOW_LABEL) {
        let mut note = read_note(&app);
        capture_geometry(&app, &mut note);
        let _ = write_note(&app, &note);
        win.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}

/// Toggle the note. Returns true when it is now showing.
#[tauri::command]
pub async fn toggle_sticky_note(app: AppHandle) -> Result<bool, String> {
    if app.get_webview_window(WINDOW_LABEL).is_some() {
        close_sticky_note(app).await?;
        Ok(false)
    } else {
        open_sticky_note(app).await?;
        Ok(true)
    }
}

/// The stored note, as JSON.
#[tauri::command]
pub async fn get_sticky_note(app: AppHandle) -> Result<String, String> {
    serde_json::to_string(&read_note(&app)).map_err(|e| e.to_string())
}

/// Save the note's text, capturing the window's current geometry alongside it.
#[tauri::command]
pub async fn save_sticky_note(app: AppHandle, text: String) -> Result<(), String> {
    let mut note = read_note(&app);
    note.text = text;
    capture_geometry(&app, &mut note);
    write_note(&app, &note)
}

/// Give the note keyboard focus so its textarea can accept typing.
///
/// meow runs under the Accessory activation policy, so it is never "active"
/// in the macOS sense and a plain set_focus leaves the WebView unable to
/// receive key events.
#[tauri::command]
pub async fn focus_sticky_note(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    crate::platform::activate_app_for_input();
    if let Some(win) = app.get_webview_window(WINDOW_LABEL) {
        win.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}
