#[cfg(target_os = "macos")]
mod macos;

#[cfg(target_os = "macos")]
pub use macos::set_opacity;

#[cfg(target_os = "macos")]
pub use macos::set_above_menu_bar;
