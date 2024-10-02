//! Settings models submodule
//! 
//! This submodule defines models used to store application settings

use serde::{Deserialize, Serialize};

fn default_font_size() -> i32 {
    return 12
}

fn default_color_scheme() -> ColorScheme {
    return ColorScheme::Dark
}

#[derive(Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
/// Color scheme for UI app
pub enum ColorScheme {
    /// Light mode
    Light, 
    /// Dark mode
    Dark
}

/// Apicize application settings
#[derive(Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeSettings {
    /// Default directory that workbooks are stored in
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workbook_directory: Option<String>,
    
    /// Last opened/saved workbook name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_workbook_file_name: Option<String>,

   /// Font Size
   #[serde(default = "default_font_size")]
   pub font_size: i32,

   /// Color scheme for UI app
   #[serde(default = "default_color_scheme")]
   pub color_scheme: ColorScheme,
}
