use std::collections::HashSet;
use rustc_hash::FxHashMap;

use apicize_lib::{ExecutionResultSummary, WorkbookDefaultParameters};
use serde::{Deserialize, Serialize};

use crate::{
    error::ApicizeAppError,
    settings::ApicizeSettings,
    workspaces::{EntityType, Navigation},
};

#[derive(Default, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionStartupState {
    pub expanded_items: Option<Vec<String>>,
    pub active_type: Option<EntityType>,
    pub active_id: Option<String>,
    pub mode: Option<u32>,
    pub help_topic: Option<String>,
    pub error: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Session {
    pub workspace_id: String,
    pub startup_state: Option<SessionStartupState>,
}

#[derive(Default)]
pub struct Sessions {
    pub sessions: FxHashMap<String, Session>,
    pub counter: u64,
    session_lookup_cache: FxHashMap<u64, String>, // Cache numeric ID to string mapping
}

impl Sessions {
    pub fn trace_all_sessions(&self) {
        println!("   Sessions:");
        for (id, info) in &self.sessions {
            println!("      ID: {}, Workspace: {}", id, info.workspace_id);
        }
    }

    pub fn add_session(&mut self, session: Session) -> String {
        let session_id = if self.counter == 0 {
            "main".to_string()
        } else {
            let mut id = String::with_capacity(8); // "main-" + digits
            id.push_str("main-");
            use std::fmt::Write;
            write!(&mut id, "{}", self.counter).unwrap();
            id
        };

        // Cache the lookup for faster access
        self.session_lookup_cache.insert(self.counter, session_id.clone());
        self.counter += 1;
        self.sessions.insert(session_id.clone(), session);
        session_id
    }

    pub fn remove_session(&mut self, session_id: &str) -> Result<(), ApicizeAppError> {
        // log::trace!("Removing session {}", &session_id);
        match self.sessions.remove(session_id) {
            Some(_) => {
                // Clean up lookup cache - find and remove the entry
                if let Some(counter_key) = self.session_lookup_cache
                    .iter()
                    .find_map(|(k, v)| if v == session_id { Some(*k) } else { None }) 
                {
                    self.session_lookup_cache.remove(&counter_key);
                }
                Ok(())
            },
            None => Err(ApicizeAppError::InvaliedSession(session_id.into())),
        }
    }

    pub fn get_session(&self, session_id: &str) -> Result<&Session, ApicizeAppError> {
        match self.sessions.get(session_id) {
            Some(session) => Ok(session),
            None => Err(ApicizeAppError::InvaliedSession(session_id.into())),
        }
    }

    pub fn get_workspace_session_ids(&self, workspace_id: &str) -> Vec<String> {
        self.sessions
            .iter()
            .filter(|(_, s)| s.workspace_id == workspace_id)
            .map(|(id, _)| id.clone())
            .collect()
    }

    pub fn count(&self) -> usize {
        self.sessions.len()
    }

    pub fn change_workspace(
        &mut self,
        session_id: &str,
        workspace_id: &str,
    ) -> Result<&mut Session, ApicizeAppError> {
        match self.sessions.get_mut(session_id) {
            Some(session) => {
                session.workspace_id = workspace_id.to_string();
                session.startup_state = None;
                Ok(session)
            }
            None => Err(ApicizeAppError::InvaliedSession(session_id.into())),
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionInitialization {
    pub workspace_id: String,
    pub settings: ApicizeSettings,
    pub error: Option<String>,
    pub navigation: Navigation,
    pub executing_request_ids: HashSet<String>,
    pub result_summaries: FxHashMap<String, Vec<ExecutionResultSummary>>,
    pub file_name: String,
    pub display_name: String,
    pub dirty: bool,
    pub editor_count: usize,
    pub defaults: WorkbookDefaultParameters,
    pub expanded_items: Option<Vec<String>>,
    pub active_type: Option<EntityType>,
    pub active_id: Option<String>,
    pub mode: Option<u32>,
    pub help_topic: Option<String>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionSaveState {
    pub file_name: String,
    pub display_name: String,
    pub dirty: bool,
    pub editor_count: usize,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SessionState {
    pub dirty: bool,
}
