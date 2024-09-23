//! Workspace models submodule
//! 
//! This submodule defines modules used to manage workspaces

use std::collections::HashMap;
use super::workbook::*;
use serde::{Deserialize, Serialize};

/// Entity with a unique identifier
pub trait WorkspaceEntity<T> {
    /// Return ID and name of object
    fn get_id_and_name(&self) -> (String, String);

    /// Get persistence
    fn get_persistence(&self) -> Option<Persistence>;

    /// Set persistence
    fn set_persistence(&mut self, persistence_to_set: Persistence);

    /// Set persistence
    fn clear_persistence(&mut self);
}

/// Generic for indexed, ordered entities, optionally with children
#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct IndexedRequests {
    /// Top level entity IDs
    pub top_level_ids: Vec<String>,

    /// Map of parent to child entity IDs
    pub child_ids: Option<HashMap<String, Vec<String>>>,

    /// Entities indexed by ID
    pub entities: HashMap<String, WorkbookRequestEntry>
}

/// Generic for indexed, ordered entities
#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct IndexedEntities<T> {
    /// Top level entity IDs
    pub top_level_ids: Vec<String>,

    /// Entities indexed by ID
    pub entities: HashMap<String, T>
}

/// Data type for entities used by Apicize during testing and editing.  This will be
/// the combination of workbook, workbook credential and global settings values
#[derive(Serialize, Deserialize, PartialEq, Debug)]
#[serde(rename_all = "camelCase")]
pub struct Workspace {
    /// Requests for the workspace
    pub requests: IndexedRequests,

    /// Scenarios for the workspace
    pub scenarios: IndexedEntities<WorkbookScenario>,

    /// Authorizations for the workspace
    pub authorizations: IndexedEntities<WorkbookAuthorization>,

    /// Certificates for the workspace
    pub certificates: IndexedEntities<WorkbookCertificate>,

    /// Proxies for the workspace
    pub proxies: IndexedEntities<WorkbookProxy>,

    /// Default selected scenario to use for testing
    pub selected_scenario: Option<Selection>,

    /// Default selected authorization to use for testing
    pub selected_authorization: Option<Selection>,

    /// Default selected certificate to use for testing
    pub selected_certificate: Option<Selection>,

    /// Default selected proxy to use for testing
    pub selected_proxy: Option<Selection>,

    /// Warnigns retarding workspace
    pub warnings: Option<Vec<String>>,
}
