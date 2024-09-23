//! Settings models submodule
//! 
//! This submodule defines models used to store application settings

use serde::{Deserialize, Serialize};

/// Apicize application settings
#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeSettings {
    /// Default directory that workbooks are stored in
    #[serde(skip_serializing_if = "Option::is_none")]
    pub workbook_directory: Option<String>,
    
    /// Last opened/saved workbook name
    #[serde(skip_serializing_if = "Option::is_none")]
    pub last_workbook_file_name: Option<String>,
}
