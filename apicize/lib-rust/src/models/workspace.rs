//! Workspace models submodule
//!
//! This submodule defines modules used to manage workspaces

use super::{workbook::*, Identifable};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

/// Trait representing parameter entity with a unique identifier
pub trait WorkspaceParameter<T> {
    /// Get persistence
    fn get_persistence(&self) -> Option<Persistence>;

    /// Set persistence
    fn set_persistence(&mut self, persistence_to_set: Persistence);

    /// Set persistence
    fn clear_persistence(&mut self);
}

/// Entity that has warnings that should be shown to user upon access
pub trait Warnings {
    /// Retrieve warnings
    fn get_warnings(&self) -> &Option<Vec<String>>;

    /// Set warnings
    fn add_warning(&mut self, warning: String);
}

/// Generic for indexed, ordered entities, optionally with children
#[derive(Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct IndexedRequests {
    /// Top level entity IDs
    pub top_level_ids: Vec<String>,

    /// Map of parent to child entity IDs
    pub child_ids: Option<HashMap<String, Vec<String>>>,

    /// Entities indexed by ID
    pub entities: HashMap<String, WorkbookRequestEntry>,
}

/// Generic for indexed, ordered entities
#[derive(Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct IndexedEntities<T> {
    /// Top level entity IDs
    pub top_level_ids: Vec<String>,

    /// Entities indexed by ID
    pub entities: HashMap<String, T>,
}

/// Implemented IndexEntry methods
impl<T: Identifable> IndexedEntities<T> {
    /// Find a match based upon ID or name
    pub fn find_match(&self, selection: &Selection) -> bool {
        self.entities.contains_key(&selection.id)
            || self
                .entities
                .values()
                .any(|e| e.get_id_and_name().1.to_lowercase() == selection.name.to_lowercase())
    }
}

/// Data type for entities used by Apicize during testing and editing.  This will be
/// the combination of workbook, workbook credential and global settings values
#[derive(Serialize, Deserialize, PartialEq)]
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

    /// Default values for requests and groups
    pub defaults: Option<WorkbookDefaults>,

    /// Warnings regarding workspace
    pub warnings: Option<Vec<String>>,
}
