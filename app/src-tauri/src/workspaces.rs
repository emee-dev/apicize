use apicize_lib::{
    editing::indexed_entities::IndexedEntityPosition, identifiable::CloneIdentifiable,
    indexed_entities::NO_SELECTION_ID, Authorization, Certificate, ExecutionConcurrency,
    ExecutionReportFormat, ExecutionResultDetail, ExecutionResultSummary, ExternalData,
    Identifiable, IndexedEntities, NameValuePair, Proxy, Request, RequestBody, RequestEntry,
    RequestGroup, RequestMethod, Scenario, SelectedParameters, Selection, ValidationErrors,
    Warnings, WorkbookDefaultParameters, Workspace,
};
use serde::{Deserialize, Serialize};
use serde_repr::{Deserialize_repr, Serialize_repr};
use std::{
    collections::{HashMap, HashSet, VecDeque},
    fmt::Display,
    path::PathBuf,
};
use uuid::Uuid;

use crate::{error::ApicizeAppError, sessions::SessionStartupState};

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]

pub struct NavigationRequestEntry {
    pub id: String,
    pub name: String,
    pub children: Option<Vec<NavigationRequestEntry>>,
    pub state: u8,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]

pub struct NavigationEntry {
    pub id: String,
    pub name: String,
    pub state: u8,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ParamNavigationSection {
    pub public: Vec<NavigationEntry>,
    pub private: Vec<NavigationEntry>,
    pub vault: Vec<NavigationEntry>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatedNavigationEntry {
    pub id: String,
    pub name: String,
    pub entity_type: EntityType,
    pub state: u8,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Navigation {
    pub requests: Vec<NavigationRequestEntry>,
    pub scenarios: ParamNavigationSection,
    pub authorizations: ParamNavigationSection,
    pub certificates: ParamNavigationSection,
    pub proxies: ParamNavigationSection,
}

#[derive(Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase", untagged)]
pub enum RequestEntryInfo {
    Request { request: RequestInfo },
    Group { group: RequestGroup },
}

#[derive(Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RequestHeaderInfo {
    /// Unique identifier (required to keep track of dispatches and test executions)
    pub id: String,
    /// HTTP headers
    #[serde(skip_serializing_if = "Option::is_none")]
    pub headers: Option<Vec<NameValuePair>>,
}

#[derive(Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RequestBodyInfo {
    /// Unique identifier (required to keep track of dispatches and test executions)
    pub id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<RequestBody>,
}

#[derive(Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "camelCase")]
pub struct RequestInfo {
    /// Unique identifier (required to keep track of dispatches and test executions)
    pub id: String,
    /// Human-readable name describing the Apicize Request
    pub name: String,
    /// URL to dispatch the HTTP request to
    pub url: String,
    /// HTTP method
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<RequestMethod>,
    /// Timeout, in milliseconds, to wait for a response
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timeout: Option<u32>,
    /// Keep HTTP connection alive
    #[serde(default = "bool::default", skip_serializing_if = "std::ops::Not::not")]
    pub keep_alive: bool,
    /// Allow invalid certificates (default is false)
    #[serde(default = "bool::default", skip_serializing_if = "std::ops::Not::not")]
    pub accept_invalid_certs: bool,
    /// Number redirects (default = 10)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub number_of_redirects: Option<usize>,
    /// Number of runs for the request to execute
    pub runs: usize,
    /// Execution of multiple runs
    pub multi_run_execution: ExecutionConcurrency,
    /// HTTP query string parameters
    #[serde(skip_serializing_if = "Option::is_none")]
    pub query_string_params: Option<Vec<NameValuePair>>,
    /// Test to execute after dispatching request and receiving response
    #[serde(skip_serializing_if = "Option::is_none")]
    pub test: Option<String>,
    /// Selected scenario, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_scenario: Option<Selection>,
    /// Selected authorization, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_authorization: Option<Selection>,
    /// Selected certificate, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_certificate: Option<Selection>,
    /// Selected proxy, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_proxy: Option<Selection>,
    /// Selected data, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_data: Option<Selection>,
    /// Populated with any warnings regarding how the request is set up
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warnings: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Validation errors
    pub validation_errors: Option<HashMap<String, String>>,
}

impl Identifiable for RequestInfo {
    fn get_id(&self) -> &str {
        &self.id
    }

    fn get_name(&self) -> &str {
        &self.name
    }

    fn get_title(&self) -> String {
        let name = self.get_name();
        if name.is_empty() {
            "(Unnamed)".to_string()
        } else {
            name.to_string()
        }
    }
}

impl Warnings for RequestInfo {
    fn get_warnings(&self) -> &Option<Vec<String>> {
        &self.warnings
    }
}

pub struct WorkspaceInfo {
    /// True if workspace has been modified since last open/save
    pub dirty: bool,
    /// True if user should be warned on public credentials or certificates
    pub warn_on_workspace_creds: bool,
    /// File name to save worksapce to, empty if new
    pub file_name: String,
    /// Display name for workspace, empty if new
    pub display_name: String,
    /// Actual workspace
    pub workspace: Workspace,
    /// Activation tree
    pub navigation: Navigation,
    /// Indicator which requests have executions running
    pub executing_request_ids: HashSet<String>,
    /// Execution summary results (if any)
    pub result_summaries: HashMap<String, Vec<ExecutionResultSummary>>,
    /// Execution detail results (if any)
    pub result_details: HashMap<String, Vec<ExecutionResultDetail>>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceSaveStatus {
    /// True if workspace has been modified since last open/save
    pub dirty: bool,
    /// True if user should be warned on public credentials or certificates
    pub warn_on_workspace_creds: bool,
    /// True if there are any invalid entities
    pub any_invalid: bool,
    /// File name
    pub file_name: String,
    /// Display name
    pub display_name: String,
}

impl RequestInfo {
    fn from_ref(request: &Request) -> Self {
        RequestInfo {
            id: request.id.clone(),
            name: request.name.clone(),
            url: request.url.clone(),
            method: request.method.clone(),
            timeout: request.timeout,
            keep_alive: request.keep_alive,
            accept_invalid_certs: false,
            number_of_redirects: None,
            runs: request.runs,
            multi_run_execution: request.multi_run_execution.clone(),
            query_string_params: request.query_string_params.clone(),
            test: request.test.clone(),
            selected_scenario: request.selected_scenario.clone(),
            selected_authorization: request.selected_authorization.clone(),
            selected_certificate: request.selected_certificate.clone(),
            selected_proxy: request.selected_proxy.clone(),
            selected_data: request.selected_data.clone(),
            warnings: request.warnings.clone(),
            validation_errors: request.validation_errors.clone(),
        }
    }
}

impl ParamNavigationSection {
    pub fn new<T: Identifiable + Warnings + ValidationErrors>(
        parameters: &IndexedEntities<T>,
    ) -> ParamNavigationSection {
        ParamNavigationSection {
            public: Self::map_entities(
                &parameters.entities,
                parameters.child_ids.get("W").map_or(&[], |e| e),
            ),
            private: Self::map_entities(
                &parameters.entities,
                parameters.child_ids.get("P").map_or(&[], |e| e),
            ),
            vault: Self::map_entities(
                &parameters.entities,
                parameters.child_ids.get("V").map_or(&[], |e| e),
            ),
        }
    }

    fn map_entities<T: Identifiable + Warnings + ValidationErrors>(
        entities: &HashMap<String, T>,
        ids: &[String],
    ) -> Vec<NavigationEntry> {
        ids.iter()
            .map(|id| {
                let entity = &entities.get(id).unwrap();
                let state = if entity
                    .get_warnings()
                    .as_ref()
                    .is_some_and(|w| !w.is_empty())
                {
                    NAVIGATION_STATE_WARNING
                } else {
                    0
                } | if entity
                    .get_validation_errors()
                    .as_ref()
                    .is_some_and(|e| !e.is_empty())
                {
                    NAVIGATION_STATE_ERROR
                } else {
                    0
                };
                NavigationEntry {
                    id: id.clone(),
                    name: entity.get_title(),
                    state,
                }
            })
            .collect()
    }

    pub fn generate_selection_list(&self, include_off: bool) -> Vec<Selection> {
        let mut results: Vec<Selection> = if include_off {
            vec![Selection {
                id: NO_SELECTION_ID.to_string(),
                name: "Off".to_string(),
            }]
        } else {
            vec![]
        };
        let create_selection = |entry: &NavigationEntry| Selection {
            id: entry.id.clone(),
            name: entry.name.clone(),
        };
        results.extend(self.public.iter().map(create_selection));
        results.extend(self.private.iter().map(create_selection));
        results.extend(self.vault.iter().map(create_selection));
        results
    }
}

impl NavigationRequestEntry {
    fn from_requests(
        ids: &[String],
        requests: &IndexedEntities<RequestEntry>,
        executing_request_ids: &HashSet<String>,
    ) -> Option<Vec<NavigationRequestEntry>> {
        let results = ids
            .iter()
            .map(|id| {
                let entity = requests.entities.get(id).unwrap();
                // Groups will be differentiated from Requests by having a child list, even if empty
                let children = match &entity {
                    RequestEntry::Request(_) => None,
                    RequestEntry::Group(_) => match requests.child_ids.get(id) {
                        Some(child_ids) => {
                            Self::from_requests(child_ids, requests, executing_request_ids)
                        }
                        None => Some(vec![]),
                    },
                };
                let request = requests.entities.get(id).unwrap();

                let state = if request
                    .get_warnings()
                    .as_ref()
                    .is_some_and(|w| !w.is_empty())
                {
                    NAVIGATION_STATE_WARNING
                } else {
                    0
                } | if request
                    .get_validation_errors()
                    .as_ref()
                    .is_some_and(|e| !e.is_empty())
                {
                    NAVIGATION_STATE_ERROR
                } else {
                    0
                } | if executing_request_ids.contains(id) {
                    NAVIGATION_STATE_RUNNING
                } else {
                    0
                };

                NavigationRequestEntry {
                    id: id.clone(),
                    name: request.get_title(),
                    children,
                    state,
                }
            })
            .collect::<Vec<_>>();

        if results.is_empty() {
            None
        } else {
            Some(results)
        }
    }

    pub fn build(
        requests: &IndexedEntities<RequestEntry>,
        executing_request_ids: &HashSet<String>,
    ) -> Vec<NavigationRequestEntry> {
        Self::from_requests(&requests.top_level_ids, requests, executing_request_ids)
            .unwrap_or_default()
    }
}

impl Navigation {
    pub fn new(workspace: &Workspace, executing_request_ids: &HashSet<String>) -> Navigation {
        Navigation {
            requests: NavigationRequestEntry::build(&workspace.requests, executing_request_ids),
            scenarios: ParamNavigationSection::new(&workspace.scenarios),
            authorizations: ParamNavigationSection::new(&workspace.authorizations),
            certificates: ParamNavigationSection::new(&workspace.certificates),
            proxies: ParamNavigationSection::new(&workspace.proxies),
        }
    }
}

#[derive(Default)]
pub struct Workspaces {
    pub workspaces: HashMap<String, WorkspaceInfo>,
}

impl Workspaces {
    pub fn trace_all_workspaces(&self) {
        println!("   Workspaces:");
        for (id, info) in &self.workspaces {
            println!(
                "      ID: {}, Name: {}, Path: {}",
                id, info.display_name, info.file_name
            );
        }
    }

    /// Add workspace, return workspace ID and display name
    pub fn add_workspace(
        &mut self,
        workspace: Workspace,
        file_name: &str,
        is_new: bool,
    ) -> OpenWorkspaceResult {
        let workspace_id = Uuid::new_v4().to_string();
        let navigation = Navigation::new(&workspace, &HashSet::default());

        let display_name = if file_name.is_empty() {
            String::default()
        } else {
            PathBuf::from(&file_name)
                .file_stem()
                .unwrap()
                .to_string_lossy()
                .to_string()
        };

        self.workspaces.insert(
            workspace_id.clone(),
            WorkspaceInfo {
                dirty: false,
                warn_on_workspace_creds: true,
                workspace,
                navigation,
                executing_request_ids: HashSet::new(),
                result_summaries: HashMap::new(),
                result_details: HashMap::new(),
                file_name: file_name.to_string(),
                display_name: display_name.clone(),
            },
        );

        if is_new {
            let mut request = Request::default();
            let request_id = request.id.clone();
            request.name = "New Request".to_string();

            let info = self.workspaces.get_mut(&workspace_id).unwrap();
            info.workspace
                .requests
                .add_entity(RequestEntry::Request(request), None, None)
                .unwrap();

            info.navigation.requests.push(NavigationRequestEntry {
                id: request_id.clone(),
                name: "New Request".to_string(),
                children: None,
                state: 0,
            });

            OpenWorkspaceResult {
                workspace_id,
                display_name,
                startup_state: SessionStartupState {
                    expanded_items: None,
                    active_type: Some(EntityType::Request),
                    active_id: Some(request_id),
                    mode: Some(0),
                    help_topic: None,
                    error: None,
                },
            }
        } else {
            OpenWorkspaceResult {
                workspace_id,
                display_name,
                startup_state: SessionStartupState::default(),
            }
        }
    }

    pub fn remove_workspace(&mut self, workspace_id: &str) {
        // log::trace!("Removing workspace {}", &workspace_id);
        self.workspaces.remove(workspace_id);
    }

    pub fn find_workspace_by_filename(
        &self,
        file_name: &str,
        skip_workspace_id: Option<&String>,
    ) -> Vec<String> {
        self.workspaces
            .iter()
            .filter_map(|(id, w)| {
                if Some(id) == skip_workspace_id {
                    None
                } else {
                    match w.file_name == file_name {
                        true => Some(id.clone()),
                        false => None,
                    }
                }
            })
            .collect()
    }

    pub fn get_workspace_info(
        &self,
        workspace_id: &str,
    ) -> Result<&WorkspaceInfo, ApicizeAppError> {
        match self.workspaces.get(workspace_id) {
            Some(w) => Ok(w),
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    pub fn get_workspace_info_mut(
        &mut self,
        workspace_id: &str,
    ) -> Result<&mut WorkspaceInfo, ApicizeAppError> {
        match self.workspaces.get_mut(workspace_id) {
            Some(w) => Ok(w),
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    pub fn get_workspace(&self, workspace_id: &str) -> Result<&Workspace, ApicizeAppError> {
        match self.workspaces.get(workspace_id) {
            Some(w) => Ok(&w.workspace),
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    pub fn get_navigation(&self, workspace_id: &str) -> Result<&Navigation, ApicizeAppError> {
        match self.workspaces.get(workspace_id) {
            Some(w) => Ok(&w.navigation),
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    pub fn get_dirty(&self, workspace_id: &str) -> Result<bool, ApicizeAppError> {
        match self.workspaces.get(workspace_id) {
            Some(info) => Ok(info.dirty),
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    pub fn get_workspace_mut(
        &mut self,
        workspace_id: &str,
    ) -> Result<&mut Workspace, ApicizeAppError> {
        match self.workspaces.get_mut(workspace_id) {
            Some(w) => Ok(&mut w.workspace),
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    pub fn get_result_detail(
        &self,
        workspace_id: &str,
        request_or_group_id: &str,
        index: usize,
    ) -> Result<ExecutionResultDetail, ApicizeAppError> {
        let info = self.get_workspace_info(workspace_id)?;
        match info.result_details.get(request_or_group_id) {
            Some(results) => match results.get(index) {
                Some(details) => Ok(details.clone()),
                None => Err(ApicizeAppError::InvalidResult(
                    request_or_group_id.to_string(),
                    index,
                )),
            },
            None => Err(ApicizeAppError::InvalidRequest(
                request_or_group_id.to_string(),
            )),
        }
    }

    pub fn generate_report(
        &self,
        workspace_id: &str,
        request_or_group_id: &str,
        index: usize,
        format: ExecutionReportFormat,
    ) -> Result<String, ApicizeAppError> {
        let info = self.get_workspace_info(workspace_id)?;
        match info.result_summaries.get(request_or_group_id) {
            Some(results) => Ok(Workspace::geneate_report(index, results, format)?),
            None => Err(ApicizeAppError::InvalidRequest(
                request_or_group_id.to_string(),
            )),
        }
    }

    pub fn get_request_entry(
        &self,
        workspace_id: &str,
        request_id: &str,
    ) -> Result<RequestEntryInfo, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.requests.entities.get(request_id) {
            Some(entry) => match entry {
                RequestEntry::Request(request) => Ok(RequestEntryInfo::Request {
                    request: RequestInfo::from_ref(request),
                }),
                RequestEntry::Group(group) => Ok(RequestEntryInfo::Group {
                    group: group.clone(),
                }),
            },
            None => Err(ApicizeAppError::InvalidRequest(request_id.into())),
        }
    }

    pub fn add_request(
        &mut self,
        workspace_id: &str,
        relative_to: Option<&str>,
        relative_position: Option<IndexedEntityPosition>,
        clone_from_id: Option<&str>,
    ) -> Result<String, ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        let request = match clone_from_id {
            Some(other_id) => match info.workspace.requests.entities.get(other_id) {
                Some(RequestEntry::Request(request)) => {
                    request.clone_as_new(format!("{} (Copy)", request.get_name()))
                }
                _ => return Err(ApicizeAppError::InvalidRequest(other_id.into())),
            },
            None => Request::default(),
        };
        let id = request.id.clone();
        info.workspace.requests.add_entity(
            RequestEntry::Request(request),
            relative_to,
            relative_position,
        )?;
        Ok(id)
    }

    pub fn add_request_group(
        &mut self,
        workspace_id: &str,
        relative_to: Option<&str>,
        relative_position: Option<IndexedEntityPosition>,
        clone_from_id: Option<&str>,
    ) -> Result<String, ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;

        let group = match clone_from_id {
            Some(other_id) => match info.workspace.requests.entities.get(other_id) {
                Some(RequestEntry::Group(group)) => {
                    group.clone_as_new(format!("{} (Copy)", &group.get_name()))
                }
                _ => return Err(ApicizeAppError::InvalidGroup(other_id.into())),
            },
            None => RequestGroup::default(),
        };

        let id = group.id.clone();
        info.workspace.requests.add_entity(
            RequestEntry::Group(group),
            relative_to,
            relative_position,
        )?;

        if let Some(other_id) = clone_from_id {
            let mut cloned_group_ids = HashMap::<String, String>::new();
            cloned_group_ids.insert(other_id.to_string(), id.to_string());

            // Build lists of new entities and child mappings
            let mut new_entries = Vec::<RequestEntry>::new();
            let mut new_child_mappings = HashMap::<String, Vec<String>>::new();

            // Get the initial list of children to process
            let mut to_process = VecDeque::new();
            to_process.push_back(other_id.to_string());

            // Keep track of what we have processed, we should *not* have to worry about recursive nested IDs
            // but best to make sure
            let mut processed = HashSet::<String>::new();

            while let Some(parent_id) = to_process.pop_front() {
                if processed.contains(&parent_id) {
                    continue;
                }

                if let Some(child_ids) = info.workspace.requests.child_ids.get(&parent_id) {
                    let new_group_id = cloned_group_ids
                        .get(parent_id.as_str())
                        .unwrap()
                        .to_string();
                    let mut new_group_child_ids = vec![];

                    for child_id in child_ids {
                        if let Some(child) = info.workspace.requests.get(child_id) {
                            let cloned_child = child.clone_as_new(child.get_name().to_owned());
                            let cloned_child_id = cloned_child.get_id().to_string();
                            let is_group = match &cloned_child {
                                RequestEntry::Request(_) => false,
                                RequestEntry::Group(_) => true,
                            };

                            new_group_child_ids.push(cloned_child_id.to_string());
                            new_entries.push(cloned_child);

                            if is_group {
                                cloned_group_ids
                                    .insert(child_id.to_string(), cloned_child_id.to_string());
                                to_process.push_back(child_id.to_string());
                            }
                        }
                    }

                    new_child_mappings.insert(new_group_id, new_group_child_ids);
                }

                processed.insert(parent_id);
            }

            // Add all the new entries we made
            for entry in new_entries {
                info.workspace
                    .requests
                    .entities
                    .insert(entry.get_id().to_string(), entry);
            }

            // Add all of the new child mappings
            for (parent_id, child_ids) in new_child_mappings {
                info.workspace
                    .requests
                    .child_ids
                    .insert(parent_id, child_ids);
            }
        }
        Ok(id)
    }

    pub fn delete_request_entry(
        &mut self,
        workspace_id: &str,
        request_or_group_id: &str,
    ) -> Result<(), ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        info.workspace.requests.remove_entity(request_or_group_id)?;
        info.workspace.validate_selections();
        Ok(())
    }

    pub fn move_request_entry(
        &mut self,
        workspace_id: &str,
        request_or_group_id: &str,
        relative_to: &str,
        relative_position: IndexedEntityPosition,
    ) -> Result<bool, ApicizeAppError> {
        let workspace = self.get_workspace_mut(workspace_id)?;
        Ok(workspace
            .requests
            .move_entity(request_or_group_id, relative_to, relative_position)?)
    }

    pub fn update_request(
        &mut self,
        workspace_id: &str,
        request: RequestInfo,
    ) -> Result<Option<UpdatedNavigationEntry>, ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;

        let (name, state) = match info.workspace.requests.entities.get_mut(&request.id) {
            Some(RequestEntry::Request(existing_request)) => {
                existing_request.name = request.name;
                existing_request.test = request.test;
                existing_request.url = request.url;
                existing_request.method = request.method;
                existing_request.query_string_params = request.query_string_params;
                existing_request.timeout = request.timeout;
                existing_request.keep_alive = request.keep_alive;
                existing_request.runs = request.runs;
                existing_request.multi_run_execution = request.multi_run_execution;
                existing_request.selected_scenario = request.selected_scenario;
                existing_request.selected_authorization = request.selected_authorization;
                existing_request.selected_certificate = request.selected_certificate;
                existing_request.selected_proxy = request.selected_proxy;
                existing_request.selected_data = request.selected_data;
                existing_request.warnings = request.warnings;
                existing_request.validation_errors = request.validation_errors;
                (
                    existing_request.get_title().to_string(),
                    if existing_request
                        .warnings
                        .as_ref()
                        .is_some_and(|w| !w.is_empty())
                    {
                        NAVIGATION_STATE_WARNING
                    } else {
                        0
                    } | if existing_request
                        .validation_errors
                        .as_ref()
                        .is_some_and(|w| !w.is_empty())
                    {
                        NAVIGATION_STATE_ERROR
                    } else {
                        0
                    } | {
                        if info.executing_request_ids.contains(&request.id) {
                            NAVIGATION_STATE_RUNNING
                        } else {
                            0
                        }
                    },
                )
            }
            _ => {
                return Err(ApicizeAppError::InvalidRequest(
                    format!("Mismatch request ID: {}", request.id).to_string(),
                ));
            }
        };

        info.check_request_navigation_update(&request.id, &name, state)
    }

    pub fn update_group(
        &mut self,
        workspace_id: &str,
        group: RequestGroup,
    ) -> Result<Option<UpdatedNavigationEntry>, ApicizeAppError> {
        match self.workspaces.get_mut(workspace_id) {
            Some(info) => {
                info.dirty = true;
                let id = &group.id;
                let result = info.check_request_navigation_update(
                    &group.id,
                    &group.get_title().to_string(),
                    if group.warnings.as_ref().is_some_and(|w| !w.is_empty()) {
                        NAVIGATION_STATE_WARNING
                    } else {
                        0
                    } | if group
                        .validation_errors
                        .as_ref()
                        .is_some_and(|w| !w.is_empty())
                    {
                        NAVIGATION_STATE_ERROR
                    } else {
                        0
                    } | if info.executing_request_ids.contains(&group.id) {
                        NAVIGATION_STATE_RUNNING
                    } else {
                        0
                    },
                );
                info.workspace
                    .requests
                    .entities
                    .insert(id.clone(), RequestEntry::Group(group));

                result
            }
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    pub fn get_request_title(
        &self,
        workspace_id: &str,
        request_id: &str,
    ) -> Result<String, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.requests.entities.get(request_id) {
            Some(entry) => Ok(entry.get_title()),
            None => Err(ApicizeAppError::InvalidRequest(request_id.into())),
        }
    }

    pub fn get_request_headers(
        &self,
        workspace_id: &str,
        request_id: &str,
    ) -> Result<RequestHeaderInfo, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.requests.entities.get(request_id) {
            Some(s) => match s {
                RequestEntry::Request(request) => Ok(RequestHeaderInfo {
                    id: request.id.clone(),
                    headers: request.headers.clone(),
                }),
                RequestEntry::Group(_) => Err(ApicizeAppError::InvalidRequest(request_id.into())),
            },
            None => Err(ApicizeAppError::InvalidRequest(request_id.into())),
        }
    }

    pub fn get_request_body(
        &self,
        workspace_id: &str,
        request_id: &str,
    ) -> Result<RequestBodyInfo, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.requests.entities.get(request_id) {
            Some(s) => match s {
                RequestEntry::Request(request) => Ok(RequestBodyInfo {
                    id: request.id.clone(),
                    body: request.body.clone(),
                }),
                RequestEntry::Group(_) => Err(ApicizeAppError::InvalidRequest(request_id.into())),
            },
            None => Err(ApicizeAppError::InvalidRequest(request_id.into())),
        }
    }

    pub fn get_request_active_authorization(
        &self,
        workspace_id: &str,
        request_id: &str,
    ) -> Result<Option<Authorization>, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;

        let mut result: Option<Authorization> = None;
        let mut id_to_check = request_id.to_string();

        while let Some(entry) = workspace.requests.entities.get(&id_to_check) {
            if let Some(auth) = entry.selected_authorization() {
                if auth.id == NO_SELECTION_ID {
                    result = None;
                    break;
                } else {
                    match workspace.authorizations.get(&auth.id) {
                        Some(a) => {
                            result = Some(a.clone());
                        }
                        None => {
                            return Err(ApicizeAppError::InvalidAuthorization(auth.id.to_owned()))
                        }
                    }
                }
            }

            match Self::get_request_parent_id(entry.get_id(), workspace) {
                Some(parent_id) => {
                    id_to_check = parent_id.to_string();
                }
                None => {
                    break;
                }
            }
        }

        if result.is_none() {
            if let Some(selection) = &workspace.defaults.selected_authorization {
                match workspace.authorizations.get(selection.id.as_str()) {
                    Some(auth) => {
                        result = Some(auth.clone());
                    }
                    None => {
                        return Err(ApicizeAppError::InvalidAuthorization(
                            selection.id.to_owned(),
                        ))
                    }
                }
            }
        }

        Ok(result)
    }

    pub fn get_request_active_data(
        &self,
        workspace_id: &str,
        request_id: &str,
    ) -> Result<Option<ExternalData>, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;

        let mut result: Option<ExternalData> = None;
        let mut id_to_check = request_id.to_string();

        while let Some(entry) = workspace.requests.entities.get(&id_to_check) {
            if let Some(data) = entry.selected_data() {
                if data.id == NO_SELECTION_ID {
                    result = None;
                    break;
                } else {
                    match workspace.data.iter().find(|d| d.id == data.id) {
                        Some(ed) => {
                            result = Some(ed.clone());
                        }
                        None => {
                            return Err(ApicizeAppError::InvalidExternalData(data.id.to_owned()))
                        }
                    }
                }
            }

            match Self::get_request_parent_id(entry.get_id(), workspace) {
                Some(parent_id) => {
                    id_to_check = parent_id.to_string();
                }
                None => {
                    break;
                }
            }
        }

        if result.is_none() {
            if let Some(selection) = &workspace.defaults.selected_data {
                match workspace.data.iter().find(|d| d.id == selection.id) {
                    Some(ed) => {
                        result = Some(ed.clone());
                    }
                    None => {
                        return Err(ApicizeAppError::InvalidExternalData(
                            selection.id.to_owned(),
                        ))
                    }
                }
            }
        }

        Ok(result)
    }

    /// Update request headers and return reference to request info so it can be resent
    pub fn update_request_headers(
        &mut self,
        workspace_id: &str,
        header_info: RequestHeaderInfo,
    ) -> Result<RequestInfo, ApicizeAppError> {
        match self.workspaces.get_mut(workspace_id) {
            Some(info) => {
                info.dirty = true;
                let id = &header_info.id;
                if let Some(RequestEntry::Request(existing_request)) =
                    info.workspace.requests.entities.get_mut(id)
                {
                    existing_request.headers = header_info.headers;
                    Ok(RequestInfo::from_ref(existing_request))
                } else {
                    Err(ApicizeAppError::InvalidRequest(header_info.id))
                }
            }
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    /// Update request body and return reference to request info so it can be resent
    pub fn update_request_body(
        &mut self,
        workspace_id: &str,
        body_info: RequestBodyInfo,
    ) -> Result<RequestInfo, ApicizeAppError> {
        match self.workspaces.get_mut(workspace_id) {
            Some(info) => {
                info.dirty = true;
                let id = &body_info.id;
                if let Some(RequestEntry::Request(existing_request)) =
                    info.workspace.requests.entities.get_mut(id)
                {
                    if body_info.body.is_some() {
                        existing_request.body = body_info.body;
                    }
                    Ok(RequestInfo::from_ref(existing_request))
                } else {
                    Err(ApicizeAppError::InvalidRequest(body_info.id))
                }
            }
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    /// Locate specified ID and return its type, if it exists
    pub fn get_entity_type(
        &self,
        workspace_id: &str,
        entity_id: &str,
    ) -> Result<Option<EntityType>, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        if workspace.requests.entities.contains_key(entity_id) {
            Ok(Some(EntityType::RequestEntry))
        } else if workspace.scenarios.entities.contains_key(entity_id) {
            Ok(Some(EntityType::Scenario))
        } else if workspace.authorizations.entities.contains_key(entity_id) {
            Ok(Some(EntityType::Authorization))
        } else if workspace.certificates.entities.contains_key(entity_id) {
            Ok(Some(EntityType::Certificate))
        } else if workspace.proxies.entities.contains_key(entity_id) {
            Ok(Some(EntityType::Proxy))
        } else {
            Ok(None)
        }
    }

    /// Return a list of any IDs that are parents to the specified ID
    pub fn find_parent_ids(
        &self,
        workspace_id: &str,
        entity_type: EntityType,
        entity_id: &str,
    ) -> Result<Vec<String>, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;

        let child_id_assigments = match entity_type {
            EntityType::RequestEntry => &workspace.requests.child_ids,
            EntityType::Request => &workspace.requests.child_ids,
            EntityType::Group => &workspace.requests.child_ids,
            EntityType::Scenario => &workspace.scenarios.child_ids,
            EntityType::Authorization => &workspace.authorizations.child_ids,
            EntityType::Certificate => &workspace.certificates.child_ids,
            EntityType::Proxy => &workspace.proxies.child_ids,
            _ => {
                return Err(ApicizeAppError::InvalidOperation(format!(
                    "Invalid list type {}",
                    entity_type
                )));
            }
        };

        let mut results = vec![];
        let mut check_id: Option<&str> = Some(entity_id);

        while let Some(id) = check_id {
            if let Some(assignment) = child_id_assigments
                .iter()
                .find(|(_, child_ids)| child_ids.iter().any(|child_id| *child_id == id))
            {
                results.push(assignment.0.to_string());
                check_id = Some(assignment.0);
            } else {
                check_id = None;
            }
        }

        Ok(results)
    }

    /// Return a list of all group and descendant group IDs
    pub fn find_descendent_groups(
        &self,
        workspace_id: &str,
        group_id: &str,
    ) -> Result<Vec<String>, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        let mut results = Vec::<String>::new();

        let mut to_process = vec![group_id.to_string()];
        let mut processed = HashSet::<String>::new();

        while let Some(id) = to_process.pop() {
            if processed.contains(&id) {
                continue;
            }
            if let Some(child_ids) = workspace.requests.child_ids.get(&id) {
                results.push(id.clone());
                to_process.extend(child_ids.to_vec());
            }
            processed.insert(id);
        }

        Ok(results)
    }

    pub fn get_scenario(
        &self,
        workspace_id: &str,
        scenario_id: &str,
    ) -> Result<&Scenario, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.scenarios.entities.get(scenario_id) {
            Some(s) => Ok(s),
            None => Err(ApicizeAppError::InvalidScenario(scenario_id.into())),
        }
    }

    pub fn get_scenario_title(
        &self,
        workspace_id: &str,
        scenario_id: &str,
    ) -> Result<String, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.scenarios.entities.get(scenario_id) {
            Some(entry) => Ok(entry.get_title()),
            None => Err(ApicizeAppError::InvalidRequest(scenario_id.into())),
        }
    }

    pub fn add_scenario(
        &mut self,
        workspace_id: &str,
        relative_to: Option<&str>,
        relative_position: Option<IndexedEntityPosition>,
        clone_from_id: Option<&str>,
    ) -> Result<String, ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        let scenario = match clone_from_id {
            Some(other_id) => match info.workspace.scenarios.get(other_id) {
                Some(other) => other.clone_as_new(format!("{} (Copy)", other.name)),
                None => return Err(ApicizeAppError::InvalidScenario(other_id.to_owned())),
            },
            None => Scenario::default(),
        };
        let id = scenario.id.clone();
        info.workspace
            .scenarios
            .add_entity(scenario, relative_to, relative_position)?;
        Ok(id)
    }

    pub fn delete_scenario(
        &mut self,
        workspace_id: &str,
        scenario_id: &str,
    ) -> Result<(), ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        info.workspace.scenarios.remove_entity(scenario_id)?;
        info.workspace.validate_selections();
        Ok(())
    }

    pub fn move_scenario(
        &mut self,
        workspace_id: &str,
        scenario_id: &str,
        relative_to: &str,
        relative_position: IndexedEntityPosition,
    ) -> Result<bool, ApicizeAppError> {
        let workspace = self.get_workspace_mut(workspace_id)?;
        Ok(workspace
            .scenarios
            .move_entity(scenario_id, relative_to, relative_position)?)
    }

    pub fn update_scenario(
        &mut self,
        workspace_id: &str,
        scenario: Scenario,
    ) -> Result<Option<UpdatedNavigationEntry>, ApicizeAppError> {
        match self.workspaces.get_mut(workspace_id) {
            Some(info) => {
                info.dirty = true;
                let id = scenario.get_id();
                let result =
                    info.check_parameter_navigation_update(&scenario, EntityType::Scenario);

                info.workspace
                    .scenarios
                    .entities
                    .insert(id.to_string(), scenario);

                Ok(result)
            }
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    pub fn get_authorization(
        &self,
        workspace_id: &str,
        authorization_id: &str,
    ) -> Result<Authorization, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.authorizations.entities.get(authorization_id) {
            Some(a) => Ok(a.clone()),
            None => Err(ApicizeAppError::InvalidAuthorization(
                authorization_id.into(),
            )),
        }
    }

    pub fn get_authorization_title(
        &self,
        workspace_id: &str,
        authorization_id: &str,
    ) -> Result<String, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.authorizations.entities.get(authorization_id) {
            Some(entry) => Ok(entry.get_title()),
            None => Err(ApicizeAppError::InvalidRequest(authorization_id.into())),
        }
    }

    pub fn add_authorization(
        &mut self,
        workspace_id: &str,
        relative_to: Option<&str>,
        relative_position: Option<IndexedEntityPosition>,
        clone_from_id: Option<&str>,
    ) -> Result<String, ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        let authorization = match clone_from_id {
            Some(other_id) => match info.workspace.authorizations.get(other_id) {
                Some(other) => other.clone_as_new(format!("{} (Copy)", other.get_name())),
                None => return Err(ApicizeAppError::InvalidAuthorization(other_id.to_owned())),
            },
            None => Authorization::default(),
        };
        let id = authorization.get_id().to_string();
        info.workspace
            .authorizations
            .add_entity(authorization, relative_to, relative_position)?;
        Ok(id)
    }

    pub fn delete_authorization(
        &mut self,
        workspace_id: &str,
        authorization_id: &str,
    ) -> Result<(), ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        info.workspace
            .authorizations
            .remove_entity(authorization_id)?;

        Ok(())
    }

    pub fn move_authorization(
        &mut self,
        workspace_id: &str,
        authorization_id: &str,
        relative_to: &str,
        relative_position: IndexedEntityPosition,
    ) -> Result<bool, ApicizeAppError> {
        let workspace = self.get_workspace_mut(workspace_id)?;
        Ok(workspace.authorizations.move_entity(
            authorization_id,
            relative_to,
            relative_position,
        )?)
    }

    pub fn update_authorization(
        &mut self,
        workspace_id: &str,
        authorization: Authorization,
    ) -> Result<Option<UpdatedNavigationEntry>, ApicizeAppError> {
        match self.workspaces.get_mut(workspace_id) {
            Some(info) => {
                info.dirty = true;
                let id = authorization.get_id();
                let result = info
                    .check_parameter_navigation_update(&authorization, EntityType::Authorization);
                info.workspace
                    .authorizations
                    .entities
                    .insert(id.to_string(), authorization);

                Ok(result)
            }
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    pub fn get_certificate(
        &self,
        workspace_id: &str,
        certificate_id: &str,
    ) -> Result<Certificate, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.certificates.entities.get(certificate_id) {
            Some(c) => Ok(c.clone()),
            None => Err(ApicizeAppError::InvalidCertificate(certificate_id.into())),
        }
    }

    pub fn get_certificate_title(
        &self,
        workspace_id: &str,
        certificate_id: &str,
    ) -> Result<String, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.certificates.entities.get(certificate_id) {
            Some(entry) => Ok(entry.get_title()),
            None => Err(ApicizeAppError::InvalidRequest(certificate_id.into())),
        }
    }

    pub fn add_certificate(
        &mut self,
        workspace_id: &str,
        relative_to: Option<&str>,
        relative_position: Option<IndexedEntityPosition>,
        clone_from_id: Option<&str>,
    ) -> Result<String, ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        let certificate = match clone_from_id {
            Some(other_id) => match info.workspace.certificates.get(other_id) {
                Some(other) => other.clone_as_new(format!("{} (Copy)", other.get_name())),
                None => return Err(ApicizeAppError::InvalidCertificate(other_id.to_owned())),
            },
            None => Certificate::default(),
        };
        let id = certificate.get_id().to_string();
        info.workspace
            .certificates
            .add_entity(certificate, relative_to, relative_position)?;
        Ok(id)
    }

    pub fn delete_certificate(
        &mut self,
        workspace_id: &str,
        certificate_id: &str,
    ) -> Result<(), ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        info.workspace.certificates.remove_entity(certificate_id)?;
        info.workspace.validate_selections();
        Ok(())
    }

    pub fn move_certificate(
        &mut self,
        workspace_id: &str,
        certificate_id: &str,
        relative_to: &str,
        relative_position: IndexedEntityPosition,
    ) -> Result<bool, ApicizeAppError> {
        let workspace = self.get_workspace_mut(workspace_id)?;
        Ok(workspace
            .certificates
            .move_entity(certificate_id, relative_to, relative_position)?)
    }

    pub fn update_certificate(
        &mut self,
        workspace_id: &str,
        certificate: Certificate,
    ) -> Result<Option<UpdatedNavigationEntry>, ApicizeAppError> {
        match self.workspaces.get_mut(workspace_id) {
            Some(info) => {
                info.dirty = true;
                let id = certificate.get_id();
                let result =
                    info.check_parameter_navigation_update(&certificate, EntityType::Certificate);
                info.workspace
                    .certificates
                    .entities
                    .insert(id.to_string(), certificate);
                Ok(result)
            }
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    pub fn get_proxy(&self, workspace_id: &str, proxy_id: &str) -> Result<&Proxy, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.proxies.entities.get(proxy_id) {
            Some(p) => Ok(p),
            None => Err(ApicizeAppError::InvalidCertificate(proxy_id.into())),
        }
    }

    pub fn get_proxy_title(
        &self,
        workspace_id: &str,
        proxy_id: &str,
    ) -> Result<String, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.proxies.entities.get(proxy_id) {
            Some(entry) => Ok(entry.get_title()),
            None => Err(ApicizeAppError::InvalidRequest(proxy_id.into())),
        }
    }

    pub fn add_proxy(
        &mut self,
        workspace_id: &str,
        relative_to: Option<&str>,
        relative_position: Option<IndexedEntityPosition>,
        clone_from_id: Option<&str>,
    ) -> Result<String, ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        let proxy = match clone_from_id {
            Some(other_id) => match info.workspace.proxies.get(other_id) {
                Some(other) => other.clone_as_new(format!("{} (Copy)", other.name)),
                None => return Err(ApicizeAppError::InvalidProxy(other_id.to_owned())),
            },
            None => Proxy::default(),
        };
        let id = proxy.id.clone();
        info.workspace
            .proxies
            .add_entity(proxy, relative_to, relative_position)?;
        Ok(id)
    }

    pub fn delete_proxy(
        &mut self,
        workspace_id: &str,
        proxy_id: &str,
    ) -> Result<(), ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        info.workspace.proxies.remove_entity(proxy_id)?;
        info.workspace.validate_selections();
        Ok(())
    }

    pub fn move_proxy(
        &mut self,
        workspace_id: &str,
        proxy_id: &str,
        relative_to: &str,
        relative_position: IndexedEntityPosition,
    ) -> Result<bool, ApicizeAppError> {
        let workspace = self.get_workspace_mut(workspace_id)?;
        let result = workspace
            .proxies
            .move_entity(proxy_id, relative_to, relative_position)?;
        Ok(result)
    }

    pub fn update_proxy(
        &mut self,
        workspace_id: &str,
        proxy: Proxy,
    ) -> Result<Option<UpdatedNavigationEntry>, ApicizeAppError> {
        match self.workspaces.get_mut(workspace_id) {
            Some(info) => {
                info.dirty = true;
                let id = proxy.get_id();
                let result = info.check_parameter_navigation_update(&proxy, EntityType::Proxy);
                info.workspace
                    .proxies
                    .entities
                    .insert(id.to_string(), proxy);
                Ok(result)
            }
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    pub fn update_defaults(
        &mut self,
        workspace_id: &str,
        defaults: WorkbookDefaultParameters,
    ) -> Result<(), ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        info.workspace.defaults = defaults.clone();
        info.workspace.validate_selections();
        Ok(())
    }

    fn insert_default_selection(selection: &Option<Selection>, results: &mut Vec<Selection>) {
        results.insert(
            0,
            Selection {
                id: "\tDEFAULT\t".to_string(),
                name: match selection {
                    Some(s) => {
                        if s.id == NO_SELECTION_ID {
                            "Default (None Configured)".to_string()
                        } else {
                            format!("Default ({})", s.name)
                        }
                    }
                    None => "Default (None Configured)".to_string(),
                },
            },
        );
    }

    /// Find the parent ID for the specified request
    fn get_request_parent_id(request_id: &str, workspace: &Workspace) -> Option<String> {
        let request_id_as_string = request_id.to_string();
        workspace
            .requests
            .child_ids
            .iter()
            .find_map(|(parent_id, child_ids)| {
                if child_ids.contains(&request_id_as_string) {
                    Some(parent_id.to_owned())
                } else {
                    None
                }
            })
    }

    pub fn add_data(
        &mut self,
        workspace_id: &str,
        clone_from_id: Option<&str>,
    ) -> Result<String, ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        let data = match clone_from_id {
            Some(other_id) => match info.workspace.data.iter().find(|data| data.id == other_id) {
                Some(other) => other.clone_as_new(format!("{} (Copy)", other.name)),
                None => return Err(ApicizeAppError::InvalidExternalData(other_id.to_owned())),
            },
            None => ExternalData::default(),
        };
        let id = data.id.clone();
        info.workspace.data.push(data);
        Ok(id)
    }

    pub fn delete_data(
        &mut self,
        workspace_id: &str,
        data_id: &str,
    ) -> Result<(), ApicizeAppError> {
        let info = self.get_workspace_info_mut(workspace_id)?;
        info.dirty = true;
        if let Some(index) = info.workspace.data.iter().position(|d| d.id == data_id) {
            info.workspace.data.remove(index);
        }
        info.workspace.validate_selections();
        Ok(())
    }

    pub fn update_data(
        &mut self,
        workspace_id: &str,
        data: ExternalData,
    ) -> Result<Option<UpdatedNavigationEntry>, ApicizeAppError> {
        match self.workspaces.get_mut(workspace_id) {
            Some(info) => {
                info.dirty = true;
                if let Some(index) = info.workspace.data.iter().position(|d| d.id == data.id) {
                    let _ = std::mem::replace(&mut info.workspace.data[index], data);
                }
                Ok(None)
            }
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
    }

    /// Return a list of all external data elements
    pub fn list_data(&self, workspace_id: &str) -> Result<Vec<ExternalData>, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        Ok(workspace.data.clone())
    }

    /// Return specified external data element
    pub fn get_data(
        &self,
        workspace_id: &str,
        data_id: &str,
    ) -> Result<ExternalData, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.data.iter().find(|d| d.id == data_id) {
            Some(data) => Ok(data.clone()),
            None => Err(ApicizeAppError::InvalidExternalData(data_id.into())),
        }
    }

    pub fn get_data_title(
        &self,
        workspace_id: &str,
        data_id: &str,
    ) -> Result<String, ApicizeAppError> {
        let workspace = self.get_workspace(workspace_id)?;
        match workspace.data.iter().find(|d| d.id == data_id) {
            Some(entry) => Ok(entry.get_title()),
            None => Err(ApicizeAppError::InvalidRequest(data_id.into())),
        }
    }

    /// Build a list of parameters, optionally including the default selections
    /// for a specified request
    pub fn list_parameters(
        &self,
        workspace_id: &str,
        active_request_id: Option<&str>,
    ) -> Result<WorkspaceParameters, ApicizeAppError> {
        let info = self.get_workspace_info(workspace_id)?;

        let include_off = true; // active_request_id.is_some();

        let mut scenarios = info
            .navigation
            .scenarios
            .generate_selection_list(include_off);
        let mut authorizations = info
            .navigation
            .authorizations
            .generate_selection_list(include_off);
        let mut certificates = info
            .navigation
            .certificates
            .generate_selection_list(include_off);
        let mut proxies = info.navigation.proxies.generate_selection_list(include_off);
        let mut data = vec![Selection {
            id: NO_SELECTION_ID.to_string(),
            name: "Off".to_string(),
        }];
        data.extend(
            info.workspace
                .data
                .iter()
                .map(|data| Selection {
                    id: data.id.clone(),
                    name: data.name.clone(),
                })
                .collect::<Vec<Selection>>(),
        );

        if let Some(request_id) = active_request_id {
            let mut default_scenario: Option<Selection> = None;
            let mut default_authorization: Option<Selection> = None;
            let mut default_certificate: Option<Selection> = None;
            let mut default_proxy: Option<Selection> = None;
            let mut default_data: Option<Selection> = None;

            let mut id = request_id.to_string();

            loop {
                match info.workspace.requests.entities.get(&id) {
                    Some(request) => {
                        if let Some(e) = request.selected_scenario() {
                            if default_scenario.is_none() {
                                default_scenario =
                                    if let Some(m) = scenarios.iter().find(|s| s.id == e.id) {
                                        Some(m.clone())
                                    } else {
                                        Some(e.clone())
                                    };
                            }
                        }
                        if let Some(e) = request.selected_authorization() {
                            if default_authorization.is_none() {
                                default_authorization =
                                    if let Some(m) = authorizations.iter().find(|s| s.id == e.id) {
                                        Some(m.clone())
                                    } else {
                                        Some(e.clone())
                                    };
                            }
                        }
                        if let Some(e) = request.selected_certificate() {
                            if default_certificate.is_none() {
                                default_certificate =
                                    if let Some(m) = certificates.iter().find(|s| s.id == e.id) {
                                        Some(m.clone())
                                    } else {
                                        Some(e.clone())
                                    };
                            }
                        }
                        if let Some(e) = request.selected_proxy() {
                            if default_proxy.is_none() {
                                default_proxy =
                                    if let Some(m) = proxies.iter().find(|s| s.id == e.id) {
                                        Some(m.clone())
                                    } else {
                                        Some(e.clone())
                                    };
                            }
                        }
                        if let Some(e) = request.selected_data() {
                            if default_data.is_none() {
                                default_data = if let Some(m) = data.iter().find(|s| s.id == e.id) {
                                    Some(m.clone())
                                } else {
                                    Some(e.clone())
                                };
                            }
                        }
                    }
                    None => return Err(ApicizeAppError::InvalidRequest(id.to_string())),
                }

                // If we have assigned all then exit loop
                if default_scenario.is_some()
                    && default_authorization.is_some()
                    && default_certificate.is_some()
                    && default_proxy.is_some()
                    && default_data.is_some()
                {
                    break;
                }

                // Get the next parent ID, if there is one
                match Self::get_request_parent_id(&id, &info.workspace) {
                    Some(parent_id) => id = parent_id,
                    None => {
                        break;
                    }
                }
            }

            if default_scenario.is_none() {
                default_scenario = match &info.workspace.defaults.selected_scenario {
                    Some(s) => info
                        .workspace
                        .scenarios
                        .entities
                        .get(&s.id)
                        .map(|e| Selection {
                            id: e.id.to_string(),
                            name: e.name.to_string(),
                        }),
                    None => None,
                }
            }
            if default_authorization.is_none() {
                default_authorization = match &info.workspace.defaults.selected_authorization {
                    Some(s) => {
                        info.workspace
                            .authorizations
                            .entities
                            .get(&s.id)
                            .map(|e| Selection {
                                id: e.get_id().to_string(),
                                name: e.get_name().to_string(),
                            })
                    }
                    None => None,
                }
            }
            if default_certificate.is_none() {
                default_certificate = match &info.workspace.defaults.selected_certificate {
                    Some(s) => info
                        .workspace
                        .certificates
                        .entities
                        .get(&s.id)
                        .map(|e| Selection {
                            id: e.get_id().to_string(),
                            name: e.get_name().to_string(),
                        }),
                    None => None,
                }
            }
            if default_proxy.is_none() {
                default_proxy = match &info.workspace.defaults.selected_proxy {
                    Some(s) => info
                        .workspace
                        .proxies
                        .entities
                        .get(&s.id)
                        .map(|e| Selection {
                            id: e.get_id().to_string(),
                            name: e.name.to_string(),
                        }),
                    None => None,
                }
            }
            if default_data.is_none() {
                default_data = match &info.workspace.defaults.selected_data {
                    Some(s) => {
                        info.workspace
                            .data
                            .iter()
                            .find(|d| d.id == s.id)
                            .map(|e| Selection {
                                id: e.get_id().to_string(),
                                name: e.name.to_string(),
                            })
                    }
                    None => None,
                }
            }

            Self::insert_default_selection(&default_scenario, &mut scenarios);
            Self::insert_default_selection(&default_authorization, &mut authorizations);
            Self::insert_default_selection(&default_certificate, &mut certificates);
            Self::insert_default_selection(&default_proxy, &mut proxies);
            Self::insert_default_selection(&default_data, &mut data);
        }

        Ok(WorkspaceParameters {
            scenarios,
            authorizations,
            certificates,
            proxies,
            data,
        })
    }
}

impl WorkspaceInfo {
    // Check parameter and returns update to navigation if required
    pub fn check_parameter_navigation_update<T: Identifiable + Warnings + ValidationErrors>(
        &mut self,
        parameter: &T,
        entity_type: EntityType,
    ) -> Option<UpdatedNavigationEntry> {
        let section = match entity_type {
            EntityType::Scenario => &mut self.navigation.scenarios,
            EntityType::Authorization => &mut self.navigation.authorizations,
            EntityType::Certificate => &mut self.navigation.certificates,
            EntityType::Proxy => &mut self.navigation.proxies,
            _ => {
                return None;
            }
        };

        let id = parameter.get_id();
        let nav_name = parameter.get_title();
        let nav_state = if parameter
            .get_warnings()
            .as_ref()
            .is_some_and(|w| !w.is_empty())
        {
            NAVIGATION_STATE_WARNING
        } else {
            0
        } | if parameter
            .get_validation_errors()
            .as_ref()
            .is_some_and(|w| !w.is_empty())
        {
            NAVIGATION_STATE_ERROR
        } else {
            0
        };

        let mut entry = section.public.iter_mut().find(|e| e.id == id);
        if entry.is_none() {
            entry = section.private.iter_mut().find(|e| e.id == id);
        }
        if entry.is_none() {
            entry = section.vault.iter_mut().find(|e| e.id == id);
        }

        if let Some(e) = entry {
            if e.name.eq(&nav_name) && (e.state & nav_state == 0) {
                None
            } else {
                e.name = nav_name.to_string();
                e.state = nav_state;
                Some(UpdatedNavigationEntry {
                    id: id.to_string(),
                    name: nav_name.to_string(),
                    entity_type,
                    state: nav_state,
                })
            }
        } else {
            None
        }
    }

    pub fn check_request_navigation_update(
        &mut self,
        id: &str,
        name: &str,
        state: u8,
    ) -> Result<Option<UpdatedNavigationEntry>, ApicizeAppError> {
        Self::check_request_navigation_update_int(id, name, state, &mut self.navigation.requests)
    }

    /// Check request navigation name and returns update to navigation if required
    fn check_request_navigation_update_int(
        id: &str,
        name: &str,
        state: u8,
        entries: &mut Vec<NavigationRequestEntry>,
    ) -> Result<Option<UpdatedNavigationEntry>, ApicizeAppError> {
        for entry in entries {
            if id == entry.id && (entry.name != name || (entry.state & state == 0)) {
                entry.name = name.to_string();
                entry.state = state;
                return Ok(Some(UpdatedNavigationEntry {
                    id: id.to_string(),
                    name: name.to_string(),
                    entity_type: EntityType::RequestEntry,
                    state,
                }));
            }

            if let Some(children) = &mut entry.children {
                let result = Self::check_request_navigation_update_int(id, name, state, children)?;
                if result.is_some() {
                    return Ok(result);
                }
            }
        }
        Ok(None)
    }
}

#[derive(Serialize_repr, Deserialize_repr, Clone, Debug)]
#[repr(u8)]
pub enum EntityType {
    RequestEntry = 1,
    Request = 2,
    Group = 3,
    Body = 4,
    Headers = 5,
    Scenario = 6,
    Authorization = 7,
    Certificate = 8,
    Proxy = 9,
    Data = 10,
    Parameters = 11,
    Defaults = 12,
    // Warnings = 13,
}

impl Display for EntityType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let desc = match self {
            EntityType::RequestEntry => "RequestEntry",
            EntityType::Request => "Request",
            EntityType::Group => "Group",
            EntityType::Headers => "Headers",
            EntityType::Body => "Body",
            EntityType::Scenario => "Scenario",
            EntityType::Authorization => "Authorization",
            EntityType::Certificate => "Certificate",
            EntityType::Proxy => "Proxy",
            EntityType::Data => "Data",
            EntityType::Parameters => "Parameters",
            EntityType::Defaults => "Defaults",
            // EntityType::Warnings => "Warnings",
        };
        write!(f, "{}", desc)
    }
}

#[derive(Serialize, Deserialize, PartialEq, Clone)]
#[serde(tag = "entityType")]
pub enum Entity {
    RequestEntry(RequestEntryInfo),
    Request(RequestInfo),
    Group(RequestGroup),
    Body(RequestBodyInfo),
    Headers(RequestHeaderInfo),
    Scenario(Scenario),
    Authorization(Authorization),
    Certificate(Certificate),
    Proxy(Proxy),
    Data(ExternalData),
    DataList { list: Vec<ExternalData> },
    Defaults(WorkbookDefaultParameters),
}

#[derive(Serialize, Deserialize, PartialEq, Clone)]
#[serde(tag = "entityType")]
pub enum Entities {
    Parameters(WorkspaceParameters),
    Data { data: Vec<ExternalData> },
    Defaults(WorkbookDefaultParameters),
}

#[derive(Serialize, Deserialize, PartialEq, Clone)]
pub struct WorkspaceParameters {
    pub scenarios: Vec<Selection>,
    pub authorizations: Vec<Selection>,
    pub certificates: Vec<Selection>,
    pub proxies: Vec<Selection>,
    pub data: Vec<Selection>,
}

pub struct OpenWorkspaceResult {
    pub workspace_id: String,
    pub display_name: String,
    pub startup_state: SessionStartupState,
}

// Note:  These need to match NavigationEntryState values
// defined in @apicize/lib-typescript
pub const NAVIGATION_STATE_DIRTY: u8 = 1;
pub const NAVIGATION_STATE_WARNING: u8 = 2;
pub const NAVIGATION_STATE_ERROR: u8 = 4;
pub const NAVIGATION_STATE_RUNNING: u8 = 8;
