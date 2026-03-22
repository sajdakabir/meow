#[cfg(target_os = "macos")]
mod macos;

#[cfg(target_os = "macos")]
pub use macos::set_opacity;

#[cfg(target_os = "macos")]
pub use macos::set_above_menu_bar;

#[cfg(target_os = "macos")]
pub use macos::register_space_observer;

#[cfg(target_os = "macos")]
pub use macos::activate_app_for_input;

#[cfg(target_os = "macos")]
pub use macos::prevent_window_hiding;

#[cfg(target_os = "macos")]
pub use macos::hide_zoom_button;
