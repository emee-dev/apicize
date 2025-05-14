use apicize_lib::{
    editing::{
        execution_result_detail::ExecutionResultDetail,
        execution_result_summary::ExecutionResultSummary, indexed_entities::IndexedEntityPosition,
        validated_selected_parameters::ValidatedSelectedParameters,
    },
    indexed_entities::NO_SELECTION_ID,
    Authorization, Certificate, ExecutionConcurrency, ExternalData, Identifiable, IndexedEntities,
    NameValuePair, Proxy, Request, RequestBody, RequestEntry, RequestGroup, RequestMethod,
    Scenario, SelectedParameters, Selection, WorkbookDefaultParameters, Workspace,
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
pub struct NavigationHierarchicalEntry {
    pub id: String,
    pub name: String,
    pub children: Option<Vec<NavigationHierarchicalEntry>>,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct ParamNavigationSection {
    pub public: Vec<Selection>,
    pub private: Vec<Selection>,
    pub vault: Vec<Selection>,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdatedNavigationEntry {
    pub id: String,
    pub name: String,
    pub entity_type: EntityType,
}

#[derive(Clone, Serialize, Deserialize)]
pub struct Navigation {
    pub requests: Vec<NavigationHierarchicalEntry>,
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
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keep_alive: Option<bool>,
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
        }
    }
}

impl ParamNavigationSection {
    pub fn new<T: Identifiable>(parameters: &IndexedEntities<T>) -> ParamNavigationSection {
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

    fn map_entities<T: Identifiable>(
        entities: &HashMap<String, T>,
        ids: &[String],
    ) -> Vec<Selection> {
        ids.iter()
            .map(|id| Selection {
                id: id.clone(),
                name: entities.get(id).unwrap().get_title(),
            })
            .collect()
    }

    pub fn check_navigation_update(
        &mut self,
        id: &str,
        name: &str,
        entity_type: EntityType,
    ) -> Option<UpdatedNavigationEntry> {
        let mut entry = self.public.iter_mut().find(|e| e.id == id);
        if entry.is_none() {
            entry = self.private.iter_mut().find(|e| e.id == id);
        }
        if entry.is_none() {
            entry = self.vault.iter_mut().find(|e| e.id == id);
        }
        let nav_name = if name.is_empty() { "(Unnamed)" } else { name };
        if let Some(e) = entry {
            if e.name.eq(nav_name) {
                None
            } else {
                e.name = nav_name.to_string();
                Some(UpdatedNavigationEntry {
                    id: id.to_string(),
                    name: nav_name.to_string(),
                    entity_type,
                })
            }
        } else {
            None
        }
    }

    pub fn consolidate_list(&self, include_off: bool) -> Vec<Selection> {
        let mut results: Vec<Selection> = if include_off {
            vec![Selection {
                id: NO_SELECTION_ID.to_string(),
                name: "Off".to_string(),
            }]
        } else {
            vec![]
        };
        results.extend(self.public.clone());
        results.extend(self.private.clone());
        results.extend(self.vault.clone());
        results
    }
}

impl NavigationHierarchicalEntry {
    fn from_requests(
        ids: &[String],
        requests: &IndexedEntities<RequestEntry>,
    ) -> Option<Vec<NavigationHierarchicalEntry>> {
        let results = ids
            .iter()
            .map(|id| {
                let entity = requests.entities.get(id).unwrap();
                // Groups will be differentiated from Requests by having a child list, even if empty
                let children = match &entity {
                    RequestEntry::Request(_) => None,
                    RequestEntry::Group(_) => match requests.child_ids.get(id) {
                        Some(child_ids) => Self::from_requests(child_ids, requests),
                        None => Some(vec![]),
                    },
                };
                NavigationHierarchicalEntry {
                    id: id.clone(),
                    name: requests.entities.get(id).unwrap().get_title(),
                    children,
                }
            })
            .collect::<Vec<_>>();

        if results.is_empty() {
            None
        } else {
            Some(results)
        }
    }

    pub fn build(requests: &IndexedEntities<RequestEntry>) -> Vec<NavigationHierarchicalEntry> {
        Self::from_requests(&requests.top_level_ids, requests).unwrap_or_default()
    }

    /// Check navigation name and return updated value if changed
    pub fn check_navigation_update(
        &mut self,
        id: &str,
        name: &str,
        entity_type: &EntityType,
    ) -> Option<UpdatedNavigationEntry> {
        let nav_name = if name.is_empty() { "(Unnamed)" } else { name };

        if self.id == id {
            if self.name.eq(nav_name) {
                return None;
            } else {
                self.name = nav_name.to_string();
                return Some(UpdatedNavigationEntry {
                    id: id.to_string(),
                    name: nav_name.to_string(),
                    entity_type: entity_type.clone(),
                });
            };
        }

        if let Some(children) = self.children.as_mut() {
            for child in children.iter_mut() {
                if let Some(result) = child.check_navigation_update(id, name, entity_type) {
                    return Some(result);
                }
            }
        }

        None
    }
}

impl Navigation {
    pub fn new(workspace: &Workspace) -> Navigation {
        Navigation {
            requests: NavigationHierarchicalEntry::build(&workspace.requests),
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
        log::trace!("*** Workspaces ***");
        for (id, info) in &self.workspaces {
            log::trace!("   ID: {}, Name: {}", id, info.display_name);
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
        let navigation = Navigation::new(&workspace);

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

            info.navigation.requests.push(NavigationHierarchicalEntry {
                id: request_id.clone(),
                name: "New Request".to_string(),
                children: None,
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
        log::trace!("Removing workspace {}", &workspace_id);
        self.workspaces.remove(workspace_id);
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
                    .insert(entry.get_id().clone(), entry);
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
        Self::clear_invalid_parameters(&mut info.workspace);
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
        match self.workspaces.get_mut(workspace_id) {
            Some(info) => {
                info.dirty = true;
                let id = &request.id;
                let mut result: Option<UpdatedNavigationEntry> = None;
                for req in info.navigation.requests.iter_mut() {
                    result = req.check_navigation_update(id, &request.name, &EntityType::Request);
                    if result.is_some() {
                        break;
                    }
                }
                if let Some(RequestEntry::Request(existing_request)) =
                    info.workspace.requests.entities.get_mut(id)
                {
                    existing_request.name = request.name.clone();
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

                    Ok(result)
                } else {
                    Err(ApicizeAppError::InvalidRequest(request.id))
                }
            }
            None => Err(ApicizeAppError::InvalidWorkspace(workspace_id.into())),
        }
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
                let mut result: Option<UpdatedNavigationEntry> = None;
                for req in info.navigation.requests.iter_mut() {
                    result = req.check_navigation_update(id, &group.name, &EntityType::Group);
                    if result.is_some() {
                        break;
                    }
                }
                info.workspace
                    .requests
                    .entities
                    .insert(id.clone(), RequestEntry::Group(group));

                Ok(result)
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

        Self::clear_invalid_parameters(&mut info.workspace);
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
                let result = info.navigation.scenarios.check_navigation_update(
                    id,
                    &scenario.name,
                    EntityType::Scenario,
                );
                info.workspace
                    .scenarios
                    .entities
                    .insert(id.clone(), scenario);

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
        let id = authorization.get_id().clone();
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
                let result = info.navigation.authorizations.check_navigation_update(
                    id,
                    authorization.get_name(),
                    EntityType::Authorization,
                );
                info.workspace
                    .authorizations
                    .entities
                    .insert(id.clone(), authorization);

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
        let id = certificate.get_id().clone();
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
        Self::clear_invalid_parameters(&mut info.workspace);
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
                let result = info.navigation.certificates.check_navigation_update(
                    id,
                    certificate.get_name(),
                    EntityType::Certificate,
                );
                info.workspace
                    .certificates
                    .entities
                    .insert(id.clone(), certificate);
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
        Self::clear_invalid_parameters(&mut info.workspace);
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
                let result = info.navigation.proxies.check_navigation_update(
                    id,
                    &proxy.name,
                    EntityType::Proxy,
                );
                info.workspace.proxies.entities.insert(id.clone(), proxy);
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
    fn get_request_parent_id(request_id: &String, workspace: &Workspace) -> Option<String> {
        workspace
            .requests
            .child_ids
            .iter()
            .find_map(|(parent_id, child_ids)| {
                if child_ids.contains(request_id) {
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
        Self::clear_invalid_parameters(&mut info.workspace);
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

    /// This should be called after updating any parameter type value (scenario, authorization, etc.)
    /// to ensure workspace items still have valid parameters after an update; if a default has
    /// a parameter that no longer exists, that parameter will be cleared (set to Default)
    fn clear_invalid_parameters(workspace: &mut Workspace) {
        let scenario_ids = workspace
            .scenarios
            .entities
            .keys()
            .cloned()
            .collect::<HashSet<String>>();
        let auth_ids = workspace
            .authorizations
            .entities
            .keys()
            .cloned()
            .collect::<HashSet<String>>();
        let cert_ids = workspace
            .certificates
            .entities
            .keys()
            .cloned()
            .collect::<HashSet<String>>();
        let proxy_ids = workspace
            .proxies
            .entities
            .keys()
            .cloned()
            .collect::<HashSet<String>>();
        let data_ids = workspace
            .data
            .iter()
            .map(|d| d.id.to_string())
            .collect::<HashSet<String>>();

        for (_, entry) in workspace.requests.entities.iter_mut() {
            entry.validate_scenario(&scenario_ids);
            entry.validate_authorization(&auth_ids);
            entry.validate_certificate(&cert_ids);
            entry.validate_proxy(&proxy_ids);
            entry.validate_data(&data_ids);
        }

        workspace.defaults.validate_scenario(&scenario_ids);
        workspace.defaults.validate_authorization(&auth_ids);
        workspace.defaults.validate_certificate(&cert_ids);
        workspace.defaults.validate_proxy(&proxy_ids);
        workspace.defaults.validate_data(&data_ids);
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

        let mut scenarios = info.navigation.scenarios.consolidate_list(include_off);
        let mut authorizations = info.navigation.authorizations.consolidate_list(include_off);
        let mut certificates = info.navigation.certificates.consolidate_list(include_off);
        let mut proxies = info.navigation.proxies.consolidate_list(include_off);
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

            let mut id = request_id.to_string();

            loop {
                match info.workspace.requests.entities.get(&id) {
                    Some(request) => {
                        if let Some(e) = request.selected_scenario() {
                            if default_scenario.is_none() {
                                default_scenario = Some(e.clone());
                            }
                        }
                        if let Some(e) = request.selected_authorization() {
                            if default_authorization.is_none() {
                                default_authorization = Some(e.clone());
                            }
                        }
                        if let Some(e) = request.selected_certificate() {
                            if default_certificate.is_none() {
                                default_certificate = Some(e.clone());
                            }
                        }
                        if let Some(e) = request.selected_proxy() {
                            if default_proxy.is_none() {
                                default_proxy = Some(e.clone());
                            }
                        }
                    }
                    None => return Err(ApicizeAppError::InvalidRequest(id.to_string())),
                }

                // If we have assigned all then exit loop
                if default_scenario.is_some()
                    && default_authorization.is_some()
                    && default_certificate.is_some()
                    || default_proxy.is_some()
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
                    Some(s) => match info.workspace.scenarios.entities.get(&s.id) {
                        Some(e) => Some(Selection {
                            id: e.id.clone(),
                            name: e.name.clone(),
                        }),
                        None => todo!(),
                    },
                    None => None,
                }
            }
            if default_authorization.is_none() {
                default_authorization = match &info.workspace.defaults.selected_authorization {
                    Some(s) => match info.workspace.authorizations.entities.get(&s.id) {
                        Some(e) => Some(Selection {
                            id: e.get_id().clone(),
                            name: e.get_name().clone(),
                        }),
                        None => todo!(),
                    },
                    None => None,
                }
            }
            if default_certificate.is_none() {
                default_certificate = match &info.workspace.defaults.selected_certificate {
                    Some(s) => match info.workspace.certificates.entities.get(&s.id) {
                        Some(e) => Some(Selection {
                            id: e.get_id().clone(),
                            name: e.get_name().clone(),
                        }),
                        None => todo!(),
                    },
                    None => None,
                }
            }
            if default_proxy.is_none() {
                default_proxy = match &info.workspace.defaults.selected_proxy {
                    Some(s) => match info.workspace.proxies.entities.get(&s.id) {
                        Some(e) => Some(Selection {
                            id: e.get_id().clone(),
                            name: e.name.clone(),
                        }),
                        None => todo!(),
                    },
                    None => None,
                }
            }

            Self::insert_default_selection(&default_scenario, &mut scenarios);
            Self::insert_default_selection(&default_authorization, &mut authorizations);
            Self::insert_default_selection(&default_certificate, &mut certificates);
            Self::insert_default_selection(&default_proxy, &mut proxies);
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
    Warnings = 13,
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
            EntityType::Warnings => "Warnings",
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
