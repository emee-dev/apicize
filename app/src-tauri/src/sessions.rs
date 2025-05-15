use std::collections::{HashMap, HashSet};

use apicize_lib::{
    editing::execution_result_summary::ExecutionResultSummary, WorkbookDefaultParameters,
};
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
    pub sessions: HashMap<String, Session>,
    pub counter: u64,
}

impl Sessions {
    pub fn trace_all_sessions(&self) {
        println!("*** Sessions ***");
        for (id, info) in &self.sessions {
            println!("   ID: {}, Workspace: {}", id, info.workspace_id);
        }
    }

    pub fn add_session(&mut self, session: Session) -> String {
        let session_id = if self.counter == 0 {
            "main".to_string()
        } else {
            format!("main-{}", &self.counter)
        };

        self.counter += 1;
        self.sessions.insert(session_id.clone(), session);
        session_id
    }

    pub fn remove_session(&mut self, session_id: &str) -> Result<(), ApicizeAppError> {
        log::trace!("Removing session {}", &session_id);
        match self.sessions.remove(session_id) {
            Some(_) => Ok(()),
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

    pub fn get_workspace_session_count(&self, workspace_id: &str) -> usize {
        self.sessions
            .values()
            .filter(|s| s.workspace_id == workspace_id)
            .count()
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
    pub result_summaries: HashMap<String, Vec<ExecutionResultSummary>>,
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
