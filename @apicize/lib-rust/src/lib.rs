#![warn(missing_docs)]
//! Apicize test routine persistence and execution.
//!
//! This library supports the opening, saving and dispatching Apicize functional web tests

#[macro_use]
extern crate lazy_static;

pub mod models;
pub mod oauth2_client_tokens;

use apicize::{
    ApicizeBody, ApicizeExecutionResults, ApicizeRequest, ApicizeResponse, ApicizeResult,
    ApicizeTestResponse,
};
use async_recursion::async_recursion;
use dirs::{config_dir, document_dir};
use encoding_rs::{Encoding, UTF_8};
use mime::Mime;
use reqwest::{Body, Client, ClientBuilder, Error, Identity, Proxy};
use serde_json::Value;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::{Arc, Once};
use std::time::{Duration, Instant};
use std::{collections::HashMap, path, vec};
use tokio::select;
use tokio::task::JoinSet;
use tokio_util::sync::CancellationToken;

use models::*;

use oauth2_client_tokens::get_oauth2_client_credentials;

static V8_INIT: Once = Once::new();

const NO_SELECTION_ID: &str = "\tNONE\t";

/// Cleanup V8 platform, should only be called once at end of application
pub fn cleanup_v8() {
    unsafe {
        v8::V8::dispose();
    }
    v8::V8::dispose_platform();
}

/// Return default workbooks directory
fn get_workbooks_directory() -> path::PathBuf {
    if let Some(directory) = document_dir() {
        directory.join("apicize")
    } else {
        panic!("Operating system did not provide document directory")
    }
}

impl Workbook {
    /// Save workbook
    pub fn save_workbook(
        file_name: PathBuf,
        requests: Vec<WorkbookRequestEntry>,
        scenarios: Vec<WorkbookScenario>,
        authorizations: Vec<WorkbookAuthorization>,
        certificates: Vec<WorkbookCertificate>,
        proxies: Vec<WorkbookProxy>,
        selected_scenario: Option<Selection>,
        selected_authorization: Option<Selection>,
        selected_certificate: Option<Selection>,
        selected_proxy: Option<Selection>,
    ) -> Result<SerializationSaveSuccess, SerializationFailure> {
        let save_scenarios = if scenarios.is_empty() {
            None
        } else {
            Some(scenarios.clone())
        };
        let save_authorizations = if authorizations.is_empty() {
            None
        } else {
            Some(authorizations.clone())
        };
        let save_certiificates = if certificates.is_empty() {
            None
        } else {
            Some(certificates.clone())
        };
        let save_proxies = if proxies.is_empty() {
            None
        } else {
            Some(proxies.clone())
        };

        let workbook = Workbook {
            version: 1.0,
            requests,
            scenarios: save_scenarios,
            authorizations: save_authorizations,
            certificates: save_certiificates,
            proxies: save_proxies,
            selected_scenario,
            selected_authorization,
            selected_certificate,
            selected_proxy,
        };

        save_data_file(&file_name, &workbook)
    }
}

impl Parameters {
    /// Return the file name for globals
    fn get_globals_filename() -> path::PathBuf {
        if let Some(directory) = config_dir() {
            directory.join("apicize").join("globals.json")
        } else {
            panic!("Operating system did not provide configuration directory")
        }
    }

    // Return the file name for private workbook options
    fn get_private_options_filename(workbook_path: &PathBuf) -> path::PathBuf {
        let mut private_path = workbook_path.clone();
        private_path.set_extension("apicize-priv");
        private_path
    }

    /// Return global parameters information
    pub fn open_global_parameters(
    ) -> Result<SerializationOpenSuccess<Parameters>, SerializationFailure> {
        Self::open(Self::get_globals_filename())
    }

    /// Return workbook private parameter information
    pub fn open_workbook_private_parameters(
        workbook_path: &PathBuf,
    ) -> Result<SerializationOpenSuccess<Parameters>, SerializationFailure> {
        Self::open(Self::get_private_options_filename(workbook_path))
    }

    /// Save global parameters information
    pub fn save_global_parameters(
        scenarios: &Vec<WorkbookScenario>,
        authorizations: &Vec<WorkbookAuthorization>,
        certificates: &Vec<WorkbookCertificate>,
        proxies: &Vec<WorkbookProxy>,
    ) -> Result<SerializationSaveSuccess, SerializationFailure> {
        Self::save(
            Self::get_globals_filename(),
            scenarios,
            authorizations,
            certificates,
            proxies,
        )
    }

    /// Save workbook parameters information
    pub fn save_workbook_private_parameters(
        workbook_path: &PathBuf,
        scenarios: &Vec<WorkbookScenario>,
        authorizations: &Vec<WorkbookAuthorization>,
        certificates: &Vec<WorkbookCertificate>,
        proxies: &Vec<WorkbookProxy>,
    ) -> Result<SerializationSaveSuccess, SerializationFailure> {
        Self::save(
            Self::get_private_options_filename(workbook_path),
            scenarios,
            authorizations,
            certificates,
            proxies,
        )
    }

    /// Return parameters information
    fn open(
        credential_file_name: PathBuf,
    ) -> Result<SerializationOpenSuccess<Parameters>, SerializationFailure> {
        if Path::new(&credential_file_name).is_file() {
            open_data_file::<Parameters>(&credential_file_name)
        } else {
            Ok(SerializationOpenSuccess {
                file_name: String::from(credential_file_name.to_string_lossy()),
                data: Parameters {
                    version: 1.0,
                    scenarios: None,
                    authorizations: None,
                    certificates: None,
                    proxies: None,
                },
            })
        }
    }

    /// Save credential information
    fn save(
        file_name_to_save: PathBuf,
        scenarios: &Vec<WorkbookScenario>,
        authorizations: &Vec<WorkbookAuthorization>,
        certificates: &Vec<WorkbookCertificate>,
        proxies: &Vec<WorkbookProxy>,
    ) -> Result<SerializationSaveSuccess, SerializationFailure> {
        let mut any = false;
        let save_scenarios = if scenarios.is_empty() {
            None
        } else {
            any = true;
            let mut cloned = scenarios.clone();
            cloned.iter_mut().for_each(|e| e.clear_persistence());
            Some(cloned)
        };
        let save_authorizations = if authorizations.is_empty() {
            None
        } else {
            any = true;
            let mut cloned = authorizations.clone();
            cloned.iter_mut().for_each(|e| e.clear_persistence());
            Some(cloned)
        };
        let save_certiificates = if certificates.is_empty() {
            None
        } else {
            any = true;
            let mut cloned = certificates.clone();
            cloned.iter_mut().for_each(|e| e.clear_persistence());
            Some(cloned)
        };
        let save_proxies = if proxies.is_empty() {
            None
        } else {
            any = true;
            let mut cloned = proxies.clone();
            cloned.iter_mut().for_each(|e| e.clear_persistence());
            Some(cloned)
        };

        if any {
            let globals = Parameters {
                version: 1.0,
                scenarios: save_scenarios,
                authorizations: save_authorizations,
                certificates: save_certiificates,
                proxies: save_proxies,
            };
            save_data_file(&file_name_to_save, &globals)
        } else {
            delete_data_file(&file_name_to_save)
        }
    }
}

impl ApicizeSettings {
    /// Return the file name for settings
    fn get_settings_filename() -> path::PathBuf {
        if let Some(directory) = config_dir() {
            directory.join("apicize").join("settings.json")
        } else {
            panic!("Operating system did not provide configuration directory")
        }
    }

    /// Open Apicize common environment from the specified name in the default path
    pub fn open() -> Result<SerializationOpenSuccess<ApicizeSettings>, SerializationFailure> {
        let file_name = &Self::get_settings_filename();
        if Path::new(&file_name).is_file() {
            open_data_file::<ApicizeSettings>(&Self::get_settings_filename())
        } else {
            // Return default settings if no existing settings file exists
            let settings = ApicizeSettings {
                last_workbook_file_name: None,
                workbook_directory: Some(String::from(get_workbooks_directory().to_string_lossy())),
            };
            Ok(SerializationOpenSuccess {
                file_name: String::from(""),
                data: settings,
            })
        }
    }

    /// Save Apicize common environment to the specified name in the default path
    pub fn save(&self) -> Result<SerializationSaveSuccess, SerializationFailure> {
        save_data_file(&Self::get_settings_filename(), self)
    }
}

impl WorkspaceEntity<WorkbookScenario> for WorkbookScenario {
    fn get_id_and_name(&self) -> (String, String) {
        (self.id.to_string(), self.name.to_string())
    }

    fn get_persistence(&self) -> Option<Persistence> {
        self.persistence
    }

    fn set_persistence(&mut self, persistence_to_set: Persistence) {
        self.persistence = Some(persistence_to_set);
    }

    fn clear_persistence(&mut self) {
        self.persistence = None
    }
}

impl WorkspaceEntity<WorkbookAuthorization> for WorkbookAuthorization {
    fn get_id_and_name(&self) -> (String, String) {
        match self {
            WorkbookAuthorization::Basic { id, name, .. } => (id.to_string(), name.to_string()),
            WorkbookAuthorization::OAuth2Client { id, name, .. } => {
                (id.to_string(), name.to_string())
            }
            WorkbookAuthorization::ApiKey { id, name, .. } => (id.to_string(), name.to_string()),
        }
    }

    fn get_persistence(&self) -> Option<Persistence> {
        match self {
            WorkbookAuthorization::Basic { persistence, .. } => *persistence,
            WorkbookAuthorization::OAuth2Client { persistence, .. } => *persistence,
            WorkbookAuthorization::ApiKey { persistence, .. } => *persistence,
        }
    }

    fn set_persistence(&mut self, persistence_to_set: Persistence) {
        match self {
            WorkbookAuthorization::Basic { persistence, .. } => {
                *persistence = Some(persistence_to_set)
            }
            WorkbookAuthorization::OAuth2Client { persistence, .. } => {
                *persistence = Some(persistence_to_set)
            }
            WorkbookAuthorization::ApiKey { persistence, .. } => {
                *persistence = Some(persistence_to_set)
            }
        }
    }

    fn clear_persistence(&mut self) {
        match self {
            WorkbookAuthorization::Basic { persistence, .. } => *persistence = None,
            WorkbookAuthorization::OAuth2Client { persistence, .. } => *persistence = None,
            WorkbookAuthorization::ApiKey { persistence, .. } => *persistence = None,
        }
    }
}

impl WorkspaceEntity<WorkbookCertificate> for WorkbookCertificate {
    fn get_id_and_name(&self) -> (String, String) {
        match self {
            WorkbookCertificate::PKCS8PEM { id, name, .. } => (id.to_string(), name.to_string()),
            WorkbookCertificate::PEM { id, name, .. } => (id.to_string(), name.to_string()),
            WorkbookCertificate::PKCS12 { id, name, .. } => (id.to_string(), name.to_string()),
        }
    }

    fn get_persistence(&self) -> Option<Persistence> {
        match self {
            WorkbookCertificate::PKCS8PEM { persistence, .. } => *persistence,
            WorkbookCertificate::PEM { persistence, .. } => *persistence,
            WorkbookCertificate::PKCS12 { persistence, .. } => *persistence,
        }
    }

    fn set_persistence(&mut self, persistence_to_set: Persistence) {
        match self {
            WorkbookCertificate::PKCS8PEM { persistence, .. } => {
                *persistence = Some(persistence_to_set)
            }
            WorkbookCertificate::PEM { persistence, .. } => *persistence = Some(persistence_to_set),
            WorkbookCertificate::PKCS12 { persistence, .. } => {
                *persistence = Some(persistence_to_set)
            }
        }
    }

    fn clear_persistence(&mut self) {
        match self {
            WorkbookCertificate::PKCS8PEM { persistence, .. } => *persistence = None,
            WorkbookCertificate::PEM { persistence, .. } => *persistence = None,
            WorkbookCertificate::PKCS12 { persistence, .. } => *persistence = None,
        }
    }
}

impl WorkspaceEntity<WorkbookProxy> for WorkbookProxy {
    fn get_id_and_name(&self) -> (String, String) {
        (self.id.to_string(), self.name.to_string())
    }

    fn get_persistence(&self) -> Option<Persistence> {
        self.persistence
    }

    fn set_persistence(&mut self, persistence_to_set: Persistence) {
        self.persistence = Some(persistence_to_set);
    }

    fn clear_persistence(&mut self) {
        self.persistence = None;
    }
}

impl Workspace {
    /// Validate default selections in Workspace
    fn validate_selection<T: WorkspaceEntity<T>>(
        &self,
        entity_type: SelectableOptionType,
        list: &IndexedEntities<T>,
        default_type: &SelectableOptionDefaultType,
        warnings: &mut Vec<String>,
    ) {
        let selection = match entity_type {
            SelectableOptionType::Scenario => self.get_selected_scenario(),
            SelectableOptionType::Authorization => self.get_selected_authorization(),
            SelectableOptionType::Certificate => self.get_selected_certificate(),
            SelectableOptionType::Proxy => self.get_selected_proxy(),
        };

        if let Some(s) = selection {
            if !s.id.is_empty() {
                let mut found = list.entities.keys().any(|id| id.eq(&s.id));
                if !found {
                    found = list.entities.values().any(|v| {
                        let (_, name) = v.get_id_and_name();
                        name.eq_ignore_ascii_case(&s.name)
                    });
                }

                if !found {
                    warnings.push(format!(
                        "Unable to locate {} (ID: {}, Name: {}), defaulting to {}",
                        entity_type.as_str(),
                        s.id,
                        s.name,
                        default_type.as_str(),
                    ));
                }
            }
        }
    }

    /// Populate indexes
    fn populate_indexes<T: Clone + WorkspaceEntity<T>>(
        entities: &mut Option<Vec<T>>,
        index: &mut IndexedEntities<T>,
        persistence: Persistence,
    ) {
        if let Some(existing) = entities {
            for e in existing {
                let mut cloned = e.clone();
                let (id, _) = cloned.get_id_and_name();
                if !index.top_level_ids.contains(&id) {
                    index.top_level_ids.push(id.clone());
                }
                cloned.set_persistence(persistence);
                index.entities.insert(id, cloned);
            }
        }
    }

    /// Populate the workspace request list
    fn populate_requests(
        entities: &mut Vec<WorkbookRequestEntry>,
        indexed_requests: &mut IndexedRequests,
        parent_id: Option<String>,
        scenarios: &IndexedEntities<WorkbookScenario>,
        authorizations: &IndexedEntities<WorkbookAuthorization>,
        certificates: &IndexedEntities<WorkbookCertificate>,
        proxies: &IndexedEntities<WorkbookProxy>,
        warnings: &mut Vec<String>,
    ) {
        let active_parent_id = parent_id.unwrap_or(String::from(""));
        for e in entities.iter_mut() {
            e.validate_selections(
                scenarios,
                authorizations,
                certificates,
                proxies,
                &SelectableOptionDefaultType::Parent,
            );

            match e {
                WorkbookRequestEntry::Info(info) => {
                    if active_parent_id.is_empty() {
                        indexed_requests.top_level_ids.push(info.id.clone());
                    } else {
                        match indexed_requests.child_ids.as_mut() {
                            Some(existing) => {
                                let updated_child_ids = match existing.get(&active_parent_id) {
                                    Some(matching_group) => {
                                        let mut updated = matching_group.to_vec();
                                        updated.push(info.id.clone());
                                        updated
                                    }
                                    None => Vec::from([info.id.clone()]),
                                };
                                existing.insert(active_parent_id.clone(), updated_child_ids);
                            }
                            None => {
                                indexed_requests.child_ids = Some(HashMap::from([(
                                    active_parent_id.clone(),
                                    Vec::from([info.id.clone()]),
                                )]));
                            }
                        }
                    }
                    indexed_requests
                        .entities
                        .insert(info.id.clone(), WorkbookRequestEntry::Info(info.clone()));
                }
                WorkbookRequestEntry::Group(group) => {
                    if active_parent_id.is_empty() {
                        indexed_requests.top_level_ids.push(group.id.clone());
                    } else {
                        match indexed_requests.child_ids.as_mut() {
                            Some(existing) => {
                                let updated_child_ids = match existing.get(&active_parent_id) {
                                    Some(matching_group) => {
                                        let mut updated = matching_group.to_vec();
                                        updated.push(group.id.clone());
                                        updated
                                    }
                                    None => Vec::from([group.id.clone()]),
                                };
                                existing.insert(active_parent_id.clone(), updated_child_ids);
                            }
                            None => {
                                indexed_requests.child_ids = Some(HashMap::from([(
                                    active_parent_id.clone(),
                                    Vec::from([group.id.clone()]),
                                )]));
                            }
                        }
                    }

                    let mut cloned_group = group.clone();
                    cloned_group.children = None;
                    indexed_requests
                        .entities
                        .insert(group.id.clone(), WorkbookRequestEntry::Group(cloned_group));

                    if let Some(children) = group.children.as_mut() {
                        Self::populate_requests(
                            children,
                            indexed_requests,
                            Some(group.id.clone()),
                            scenarios,
                            authorizations,
                            certificates,
                            proxies,
                            warnings,
                        );

                        group.children = None;
                    }
                }
            };
        }
    }

    /// Find entity (Scenario, Authorization, etc.)
    fn find_matching_selection<'a, T: WorkspaceEntity<T>>(
        selection: &Selection,
        list: &'a IndexedEntities<T>,
    ) -> Option<&'a T> {
        if let Some(found) = list.entities.get(&selection.id) {
            Some(&found)
        } else {
            list.entities.values().find(|v| {
                let (_, name) = v.get_id_and_name();
                name.eq_ignore_ascii_case(&selection.name)
            })
        }
    }

    /// Find matching scenario, if any
    pub fn find_scenario<'a>(&self, selection: &Selection) -> Option<&WorkbookScenario> {
        Workspace::find_matching_selection(selection, &self.scenarios)
    }

    /// Open a workspace using the specified workbook, taking into account private parameters file (if existing)
    /// and global settings
    pub fn open(
        workbook_file_name: &String,
    ) -> Result<(Workspace, Vec<String>), SerializationFailure> {
        let mut wkspc_requests = IndexedRequests {
            top_level_ids: vec![],
            child_ids: None,
            entities: HashMap::new(),
        };
        let mut wkspc_scenarios = IndexedEntities::<WorkbookScenario> {
            top_level_ids: vec![],
            entities: HashMap::new(),
        };
        let mut wkspc_authorizations = IndexedEntities::<WorkbookAuthorization> {
            top_level_ids: vec![],
            entities: HashMap::new(),
        };
        let mut wkspc_certificates = IndexedEntities::<WorkbookCertificate> {
            top_level_ids: vec![],
            entities: HashMap::new(),
        };
        let mut wkspc_proxies = IndexedEntities::<WorkbookProxy> {
            top_level_ids: vec![],
            entities: HashMap::new(),
        };

        // Populate entries from global storage
        let mut globals: Parameters;
        match Parameters::open_global_parameters() {
            Ok(success) => {
                globals = success.data;
            }
            Err(failure) => {
                return Err(failure);
            }
        }

        Self::populate_indexes(
            &mut globals.scenarios,
            &mut wkspc_scenarios,
            Persistence::Global,
        );
        Self::populate_indexes(
            &mut globals.authorizations,
            &mut wkspc_authorizations,
            Persistence::Global,
        );
        Self::populate_indexes(
            &mut globals.certificates,
            &mut wkspc_certificates,
            Persistence::Global,
        );
        Self::populate_indexes(
            &mut globals.proxies,
            &mut wkspc_proxies,
            Persistence::Global,
        );

        // Populate entries from private parameter files, if any
        let workbook_path = PathBuf::from(workbook_file_name);
        let mut private_path = workbook_path.clone();
        private_path.set_extension("apicize-priv");

        if Path::new(&private_path).is_file() {
            let mut private: Parameters;

            match Parameters::open_workbook_private_parameters(&private_path) {
                Ok(success) => {
                    private = success.data;
                }
                Err(error) => {
                    return Err(error);
                }
            }

            Self::populate_indexes(
                &mut private.scenarios,
                &mut wkspc_scenarios,
                Persistence::Private,
            );
            Self::populate_indexes(
                &mut private.authorizations,
                &mut wkspc_authorizations,
                Persistence::Private,
            );
            Self::populate_indexes(
                &mut private.certificates,
                &mut wkspc_certificates,
                Persistence::Private,
            );
            Self::populate_indexes(
                &mut private.proxies,
                &mut wkspc_proxies,
                Persistence::Private,
            );
        }

        // Populate from workbook
        let mut wkbk: Workbook;
        match open_data_file(&workbook_path) {
            Ok(success) => {
                wkbk = success.data;
            }
            Err(error) => {
                return Err(error);
            }
        }

        let mut warnings: Vec<String> = vec![];

        Self::populate_indexes(
            &mut wkbk.scenarios,
            &mut wkspc_scenarios,
            Persistence::Workbook,
        );

        Self::populate_indexes(
            &mut wkbk.authorizations,
            &mut wkspc_authorizations,
            Persistence::Workbook,
        );

        Self::populate_indexes(
            &mut wkbk.certificates,
            &mut wkspc_certificates,
            Persistence::Workbook,
        );

        Self::populate_indexes(&mut wkbk.proxies, &mut wkspc_proxies, Persistence::Workbook);

        Self::populate_indexes(&mut wkbk.proxies, &mut wkspc_proxies, Persistence::Workbook);

        Self::populate_requests(
            &mut wkbk.requests,
            &mut wkspc_requests,
            None,
            &wkspc_scenarios,
            &wkspc_authorizations,
            &wkspc_certificates,
            &wkspc_proxies,
            &mut warnings,
        );

        let mut workspace = Workspace {
            requests: wkspc_requests,
            scenarios: wkspc_scenarios,
            authorizations: wkspc_authorizations,
            certificates: wkspc_certificates,
            proxies: wkspc_proxies,
            selected_scenario: wkbk.selected_scenario,
            selected_authorization: wkbk.selected_authorization,
            selected_certificate: wkbk.selected_certificate,
            selected_proxy: wkbk.selected_proxy,
            warnings: None,
        };

        // Validate the default scenarios, etc. selected for testing
        workspace.warnings = workspace.validate_selections(
            &workspace.scenarios,
            &workspace.authorizations,
            &workspace.certificates,
            &workspace.proxies,
            &SelectableOptionDefaultType::None,
        );

        Ok((workspace, warnings))
    }

    /// Recursively add requests to the list to save
    fn build_requests(
        &self,
        ids: &Vec<String>,
        indexed_requests: &IndexedRequests,
        scenarios: &IndexedEntities<WorkbookScenario>,
        authorizations: &IndexedEntities<WorkbookAuthorization>,
        certificates: &IndexedEntities<WorkbookCertificate>,
        proxies: &IndexedEntities<WorkbookProxy>,
        warnings: &mut Vec<String>,
    ) -> Vec<WorkbookRequestEntry> {
        let mut results: Vec<WorkbookRequestEntry> = vec![];
        ids.iter().for_each(|id| {
            if let Some(entry) = indexed_requests.entities.get(id) {
                match entry {
                    WorkbookRequestEntry::Info(info) => {
                        results.push(WorkbookRequestEntry::Info(info.clone()));
                    }
                    WorkbookRequestEntry::Group(group) => {
                        let mut group_to_add = group.clone();
                        group_to_add.children = None;
                        if let Some(child_id_list) = indexed_requests.child_ids.as_ref() {
                            if let Some(child_ids) = child_id_list.get(id) {
                                let children = self.build_requests(
                                    child_ids,
                                    indexed_requests,
                                    scenarios,
                                    authorizations,
                                    certificates,
                                    proxies,
                                    warnings,
                                );
                                if children.len() > 0 {
                                    group_to_add.children = Some(children);
                                }
                            }
                        }
                        results.push(WorkbookRequestEntry::Group(group_to_add));
                    }
                }
            }
        });
        results
    }

    // Add entities to the global, private and workbook lists, depending upon persistence
    fn append_entities<T: WorkspaceEntity<T> + Clone>(
        ids: &Vec<String>,
        list: &IndexedEntities<T>,
        globals: &mut Vec<T>,
        private: &mut Vec<T>,
        workbook: &mut Vec<T>,
    ) {
        ids.iter().for_each(|id| {
            if let Some(entity) = list.entities.get(id) {
                let mut cloned_entity = entity.clone();
                // Clear the persistence value from the saved value, we don't need to save it
                cloned_entity.clear_persistence();
                match entity.get_persistence() {
                    Some(Persistence::Global) => globals.push(cloned_entity),
                    Some(Persistence::Private) => private.push(cloned_entity),
                    Some(Persistence::Workbook) => workbook.push(cloned_entity),
                    None => {}
                }
            }
        });
    }

    /// Save workspace to specified path, including workbook and global parameters
    pub fn save(
        &self,
        workbook_path: &PathBuf,
    ) -> Result<Vec<SerializationSaveSuccess>, SerializationFailure> {
        let mut global_scenarios: Vec<WorkbookScenario> = vec![];
        let mut global_authorizations: Vec<WorkbookAuthorization> = vec![];
        let mut global_certificates: Vec<WorkbookCertificate> = vec![];
        let mut global_proxies: Vec<WorkbookProxy> = vec![];

        let mut priv_scenarios: Vec<WorkbookScenario> = vec![];
        let mut priv_authorizations: Vec<WorkbookAuthorization> = vec![];
        let mut priv_certificates: Vec<WorkbookCertificate> = vec![];
        let mut priv_proxies: Vec<WorkbookProxy> = vec![];

        let mut wkbk_scenarios: Vec<WorkbookScenario> = vec![];
        let mut wkbk_authorizations: Vec<WorkbookAuthorization> = vec![];
        let mut wkbk_certificates: Vec<WorkbookCertificate> = vec![];
        let mut wkbk_proxies: Vec<WorkbookProxy> = vec![];

        let mut warnings: Vec<String> = vec![];

        let wkbk_requests = self.build_requests(
            &self.requests.top_level_ids,
            &self.requests,
            &self.scenarios,
            &self.authorizations,
            &self.certificates,
            &self.proxies,
            &mut warnings,
        );

        Self::append_entities(
            &self.scenarios.top_level_ids,
            &self.scenarios,
            &mut global_scenarios,
            &mut priv_scenarios,
            &mut wkbk_scenarios,
        );
        Self::append_entities(
            &self.authorizations.top_level_ids,
            &self.authorizations,
            &mut global_authorizations,
            &mut priv_authorizations,
            &mut wkbk_authorizations,
        );
        Self::append_entities(
            &self.certificates.top_level_ids,
            &self.certificates,
            &mut global_certificates,
            &mut priv_certificates,
            &mut wkbk_certificates,
        );
        Self::append_entities(
            &self.proxies.top_level_ids,
            &self.proxies,
            &mut global_proxies,
            &mut priv_proxies,
            &mut wkbk_proxies,
        );

        let mut successes: Vec<SerializationSaveSuccess> = vec![];

        match Workbook::save_workbook(
            PathBuf::from(workbook_path),
            wkbk_requests,
            wkbk_scenarios,
            wkbk_authorizations,
            wkbk_certificates,
            wkbk_proxies,
            self.selected_scenario.clone(),
            self.selected_authorization.clone(),
            self.selected_certificate.clone(),
            self.selected_proxy.clone(),
        ) {
            Ok(success) => successes.push(success),
            Err(error) => return Err(error),
        }

        match Parameters::save_workbook_private_parameters(
            &workbook_path,
            &priv_scenarios,
            &priv_authorizations,
            &priv_certificates,
            &priv_proxies,
        ) {
            Ok(success) => successes.push(success),
            Err(error) => return Err(error),
        }

        match Parameters::save_global_parameters(
            &global_scenarios,
            &global_authorizations,
            &global_certificates,
            &global_proxies,
        ) {
            Ok(success) => successes.push(success),
            Err(error) => return Err(error),
        }

        return Ok(successes);
    }

    // /// Returns variables to use from specified scenario (if any)
    // fn set_variables_from_scenario(
    //     &self,
    //     selected_scenario: &Option<Selection>,
    //     previous: &HashMap<String, Value>,
    // ) -> HashMap<String, Value> {
    //     match selected_scenario {
    //         Some(selected) => {
    //             if selected.id.is_empty() {
    //                 // A blank ID indicates that we want to clear all variables
    //                 return HashMap::new();
    //             } else {
    //                 // Merge in values from the specified scenario
    //                 let scenario = self.scenarios.entities.get(&selected.id).unwrap();
    //                 let mut result = previous.clone();
    //                 if let Some(vars) = &scenario.variables {
    //                     for pair in vars {
    //                         let enabled = if let Some(disabled) = pair.disabled {
    //                             !disabled
    //                         } else {
    //                             true
    //                         };
    //                         if enabled {
    //                             result.insert(pair.name.clone(), json!(&pair.value));
    //                         }
    //                     }
    //                 }
    //                 result
    //             }
    //         }
    //         None => {
    //             // If no scenario is specified, return previous values as-is
    //             previous.clone()
    //         }
    //     }
    // }

    fn execute_test(
        request: &WorkbookRequest,
        response: &ApicizeResponse,
        variables: &HashMap<String, Value>,
    ) -> Result<Option<ApicizeTestResponse>, ExecutionError> {
        // Create a new Isolate and make it the current one.
        let isolate = &mut v8::Isolate::new(v8::CreateParams::default());

        // Create a stack-allocated handle scope.
        let scope = &mut v8::HandleScope::new(isolate);
        let context = v8::Context::new(scope);
        let scope = &mut v8::ContextScope::new(scope, context);

        let mut init_code = String::new();
        init_code.push_str(include_str!("./static/framework.min.js"));
        init_code.push_str(include_str!("./static/routines.js"));

        // Compile the source code
        let v8_code = v8::String::new(scope, &init_code).unwrap();
        let script = v8::Script::compile(scope, v8_code, None).unwrap();
        script.run(scope).unwrap();

        let tc = &mut v8::TryCatch::new(scope);

        // Return empty test results if no test
        if let None = request.test {
            return Ok(None);
        }

        let mut init_code = String::new();
        init_code.push_str(&format!(
            "runTestSuite({}, {}, {}, () => {{{}}})",
            serde_json::to_string(request).unwrap(),
            serde_json::to_string(response).unwrap(),
            serde_json::to_string(variables).unwrap(),
            request.test.as_ref().unwrap()
        ));

        let v8_code = v8::String::new(tc, &init_code).unwrap();

        let Some(script) = v8::Script::compile(tc, v8_code, None) else {
            let message = tc.message().unwrap();
            let message = message.get(tc).to_rust_string_lossy(tc);
            return Err(ExecutionError::FailedTest(message));
        };

        let Some(value) = script.run(tc) else {
            let message = tc.message().unwrap();
            let message = message.get(tc).to_rust_string_lossy(tc);
            return Err(ExecutionError::FailedTest(message));
        };

        let result = value.to_string(tc);
        let s = result.unwrap().to_rust_string_lossy(tc);
        let test_response: ApicizeTestResponse = serde_json::from_str(&s).unwrap();

        Ok(Some(test_response))
    }

    fn retrieve_parameters(
        &self,
        request: &WorkbookRequestEntry,
        variables: &HashMap<String, Value>,
    ) -> (
        HashMap<String, Value>,
        Option<&WorkbookAuthorization>,
        Option<&WorkbookCertificate>,
        Option<&WorkbookProxy>,
        Option<&WorkbookCertificate>,
        Option<&WorkbookProxy>,
    ) {
        let mut done = false;

        let mut current = request;

        let mut scenario: Option<&WorkbookScenario> = None;
        let mut authorization: Option<&WorkbookAuthorization> = None;
        let mut certificate: Option<&WorkbookCertificate> = None;
        let mut proxy: Option<&WorkbookProxy> = None;

        let mut auth_certificate: Option<&WorkbookCertificate> = None;
        let mut auth_proxy: Option<&WorkbookProxy> = None;

        let mut allow_scenario = true;
        let mut allow_authorization = true;
        let mut allow_certificate = true;
        let mut allow_proxy = true;

        let mut encountered_ids = HashSet::<String>::new();

        while !done {
            // Set the credential values at the current request value
            if allow_scenario {
                if let Some(selected) = current.get_selected_scenario() {
                    if selected.id == NO_SELECTION_ID {
                        allow_scenario = false;
                    } else {
                        scenario = self.scenarios.entities.get(&selected.id);
                    }
                }
            }
            if allow_authorization {
                if let Some(selected) = current.get_selected_authorization() {
                    if selected.id == NO_SELECTION_ID {
                        allow_authorization = false
                    } else {
                        authorization = self.authorizations.entities.get(&selected.id);
                        if let Some(matching_auth) = authorization {
                            if let WorkbookAuthorization::OAuth2Client {
                                selected_certificate,
                                selected_proxy,
                                ..
                            } = matching_auth
                            {
                                if let Some(cert) = selected_certificate {
                                    auth_certificate = self.certificates.entities.get(&cert.id);
                                }
                                if let Some(proxy) = selected_proxy {
                                    auth_proxy = self.proxies.entities.get(&proxy.id);
                                }
                            }
                        }
                    }
                }
            }
            if allow_certificate {
                if let Some(selected) = current.get_selected_certificate() {
                    if selected.id == NO_SELECTION_ID {
                        allow_certificate = false
                    } else {
                        certificate = self.certificates.entities.get(&selected.id)
                    }
                }
            }
            if allow_proxy {
                if let Some(selected) = current.get_selected_proxy() {
                    if selected.id == NO_SELECTION_ID {
                        allow_proxy = false
                    } else {
                        proxy = self.proxies.entities.get(&selected.id)
                    }
                }
            }

            done = (scenario.is_some()
                && authorization.is_some()
                && certificate.is_some()
                && proxy.is_some()) ||
                (! (
                    allow_scenario && allow_authorization && allow_certificate && allow_proxy
                ));

            if !done {
                // Get the parent
                let id = current.get_id();
                encountered_ids.insert(id.clone());

                let mut parent: Option<&WorkbookRequestEntry> = None;
                if let Some(child_ids) = &self.requests.child_ids {
                    for (parent_id, children) in child_ids.iter() {
                        if children.contains(&id) {
                            parent = self.requests.entities.get(&parent_id.clone());
                            break;
                        }
                    }
                }

                if let Some(found_parent) = parent {
                    let parent_id = found_parent.get_id();
                    if encountered_ids.contains(parent_id) {
                        println!("Recursive parent found at {}, cancelling traversal", parent_id);
                        done = true
                    } else {
                        current = found_parent;
                    }
                } else {
                    done = true;
                }
            }
        }

        if ! allow_scenario {
            scenario = None
        }

        if ! allow_authorization {
            authorization = None
        }

        if ! allow_certificate {
            certificate = None
        }

        if ! allow_proxy {
            proxy = None
        }

        let mut result_variables = if let Some(active_scenario) = scenario {
            if let Some(variables) = &active_scenario.variables {
                HashMap::from_iter(
                    variables
                        .iter()
                        .map(|pair| (pair.name.clone(), Value::from(pair.value.clone()))),
                )
            } else {
                HashMap::new()
            }
        } else {
            HashMap::new()
        };

        variables.iter().for_each(|(key, value)| {
            result_variables.insert(key.clone(), value.clone());
        });

        return (
            result_variables,
            authorization,
            certificate,
            proxy,
            auth_certificate,
            auth_proxy,
        );
    }

    /// Run the specified request entry recursively
    #[async_recursion]
    async fn run_int(
        workspace: Arc<Workspace>,
        tests_started: Arc<Instant>,
        request_id: String,
        variables: Arc<HashMap<String, Value>>,
        parent_name: Arc<Option<Vec<String>>>,
        run: u32,
        total_runs: u32,
    ) -> (Vec<ApicizeResult>, HashMap<String, Value>) {
        let request = workspace.requests.entities.get(&request_id).unwrap();
        let request_name = Arc::new(if let Some(parent) = parent_name.as_ref() {
            let mut cloned = parent.clone();
            cloned.push(request.get_name().clone());
            Some(cloned)
        } else {
            Some(vec![request.get_name().clone()])
        });

        match request {
            WorkbookRequestEntry::Info(info) => {
                let now = Instant::now();

                let (variables, authorization, certificate, proxy, auth_certificate, auth_proxy) =
                    workspace.retrieve_parameters(request, &variables);

                let executed_at = tests_started.elapsed().as_millis();

                let dispatch_response = info
                    .dispatch(
                        &variables,
                        authorization,
                        certificate,
                        proxy,
                        auth_certificate,
                        auth_proxy,
                    )
                    .await;
                let milliseconds = now.elapsed().as_millis();

                match &dispatch_response {
                    Ok((request, response)) => {
                        let test_response = Workspace::execute_test(&info, response, &variables);
                        match test_response {
                            Ok(test_results) => {
                                let mut test_count = 0;
                                let mut failed_test_count = 0;
                                let (reported_test_results, reported_test_scenario) =
                                    match test_results {
                                        Some(results) => {
                                            if let Some(test_results) = &results.results {
                                                test_count = test_results.len();
                                                failed_test_count = failed_test_count
                                                    + test_results
                                                        .iter()
                                                        .filter(|r| !r.success)
                                                        .count();
                                            }
                                            (results.results, results.variables)
                                        }
                                        None => (None, HashMap::new()),
                                    };

                                let test_result = (
                                    vec![ApicizeResult {
                                        request_id: info.id.clone(),
                                        run: run.clone(),
                                        total_runs,
                                        request: Some(request.clone()),
                                        response: Some(response.clone()),
                                        tests: reported_test_results,
                                        executed_at,
                                        milliseconds,
                                        success: true,
                                        test_count: Some(test_count),
                                        failed_test_count: Some(failed_test_count),
                                        error_message: None,
                                    }],
                                    reported_test_scenario,
                                );
                                test_result
                            }
                            Err(err) => (
                                vec![ApicizeResult {
                                    request_id: info.id.clone(),
                                    run: run.clone(),
                                    total_runs,
                                    request: Some(request.clone()),
                                    response: Some(response.clone()),
                                    tests: None,
                                    executed_at,
                                    milliseconds,
                                    success: false,
                                    test_count: None,
                                    failed_test_count: None,
                                    error_message: Some(format!("{}", err)),
                                }],
                                HashMap::new(),
                            ),
                        }
                    }
                    Err(err) => (
                        vec![ApicizeResult {
                            request_id: info.id.clone(),
                            run: run.clone(),
                            total_runs,
                            request: None,
                            response: None,
                            tests: None,
                            executed_at,
                            milliseconds,
                            success: false,
                            test_count: None,
                            failed_test_count: None,
                            error_message: Some(format!("{}", err)),
                        }],
                        HashMap::new(),
                    ),
                }
            }
            WorkbookRequestEntry::Group(group) => {
                // Recursively run requests located in groups...
                let mut results: Vec<ApicizeResult> = Vec::new();

                let (variables, ..) = workspace.retrieve_parameters(request, &variables);

                let mut arc_variables = Arc::new(variables);

                let fake = Vec::<String>::new();
                let group_child_ids = workspace
                    .requests
                    .child_ids
                    .as_ref()
                    .unwrap()
                    .get(&group.id)
                    .unwrap_or(&fake)
                    .into_iter();

                if group.execution == WorkbookExecution::Concurrent {
                    let mut runs = JoinSet::new();

                    for id in group_child_ids {
                        let cloned_workspace = workspace.clone();
                        let cloned_started = tests_started.clone();
                        let cloned_id = id.clone();
                        let cloned_variables = arc_variables.clone();
                        let cloned_request_name = request_name.clone();

                        runs.spawn(Workspace::run_int(
                            cloned_workspace,
                            cloned_started,
                            cloned_id,
                            cloned_variables,
                            cloned_request_name,
                            run,
                            total_runs,
                        ));
                    }

                    while let Some(result) = runs.join_next().await {
                        if let Ok(r) = result {
                            results.extend(r.0);
                        }
                    }
                } else {
                    for id in group_child_ids {
                        let cloned_workspace = workspace.clone();
                        let cloned_started = tests_started.clone();
                        let cloned_id = id.clone();
                        let cloned_variables = arc_variables.clone();
                        let cloned_request_name = request_name.clone();

                        let (group_test_results, group_vars) = Workspace::run_int(
                            cloned_workspace,
                            cloned_started,
                            cloned_id,
                            cloned_variables,
                            cloned_request_name,
                            run,
                            total_runs,
                        )
                        .await;

                        results.extend(group_test_results);
                        arc_variables = Arc::new(group_vars.clone());
                    }
                }

                return (results, arc_variables.as_ref().clone());
            }
        }
    }

    /// Dispatch the request (info or group) and test results
    pub async fn run(
        workspace: Arc<Workspace>,
        request_id: &String,
        cancellation_token: Option<CancellationToken>,
    ) -> Result<ApicizeExecutionResults, RunError> {
        let request_entry: &WorkbookRequestEntry;
        match workspace.requests.entities.get(request_id) {
            Some(entry) => request_entry = entry,
            None => {
                return Err(RunError::Other(format!(
                    "Request ID \"{request_id}\" is invalid"
                )));
            }
        }

        let cancellation = match cancellation_token {
            Some(t) => t,
            None => CancellationToken::new(),
        };

        // Ensure V8 is initialized
        V8_INIT.call_once(|| {
            let platform = v8::new_unprotected_default_platform(0, false).make_shared();
            v8::V8::initialize_platform(platform);
            v8::V8::initialize();
        });

        // Set up defaults
        let total_runs = request_entry.get_runs();
        let mut runs: JoinSet<Option<(Vec<ApicizeResult>, HashMap<String, Value>)>> =
            JoinSet::new();

        let tests_started = Instant::now();
        let arc_tests_started = Arc::new(tests_started);

        let mut results: Vec<ApicizeResult> = Vec::new();
        for run in 0..total_runs {
            let cloned_tests_started = arc_tests_started.clone();
            let cloned_request_id = request_id.clone();
            let cloned_workspace = workspace.clone();

            let cloned_token = cancellation.clone();
            let no_name = Arc::new(None);

            runs.spawn(async move {
                select! {
                    _ = cloned_token.cancelled() => None,
                    result = Workspace::run_int(
                        cloned_workspace,
                        cloned_tests_started,
                        cloned_request_id,
                        Arc::new(HashMap::new()),
                        no_name,
                        run,
                        total_runs,
                    ) => {
                        Some(result)
                    }
                }
            });
        }

        let mut caught: Option<RunError> = None;

        while let Some(result) = runs.join_next().await {
            match result {
                Ok(result_or_cancel) => match result_or_cancel {
                    Some(mut result) => {
                        results.append(&mut result.0);
                    }
                    None => {
                        caught = Some(RunError::Cancelled);
                    }
                },
                Err(err) => {
                    Some(RunError::JoinError(err));
                }
            }
        }

        match caught {
            Some(caught_error) => Err(caught_error),
            None => {
                let mut results_by_run: Vec<Vec<ApicizeResult>> =
                    vec![vec![]; usize::try_from(total_runs).unwrap()];

                results.sort_by(|a, b| {
                    let mut ord = a.run.cmp(&b.run);
                    if ord.is_eq() {
                        ord = a.executed_at.cmp(&b.executed_at);
                    }
                    ord
                });

                results.drain(..).for_each(|r| {
                    results_by_run[usize::try_from(r.run).unwrap()].push(r);
                });

                Ok(ApicizeExecutionResults {
                    runs: results_by_run,
                    milliseconds: tests_started.elapsed().as_millis(),
                })
            }
        }
    }
}

impl WorkbookRequest {
    /// Dispatch the specified request (via reqwest), returning either the repsonse or error
    async fn dispatch(
        &self,
        variables: &HashMap<String, Value>,
        // scenario: Option<&WorkbookScenario>,
        authorization: Option<&WorkbookAuthorization>,
        certificate: Option<&WorkbookCertificate>,
        proxy: Option<&WorkbookProxy>,
        auth_certificate: Option<&WorkbookCertificate>,
        auth_proxy: Option<&WorkbookProxy>,
    ) -> Result<(ApicizeRequest, ApicizeResponse), ExecutionError> {
        let method: reqwest::Method;
        match self.method {
            Some(WorkbookRequestMethod::Get) => method = reqwest::Method::GET,
            Some(WorkbookRequestMethod::Post) => method = reqwest::Method::POST,
            Some(WorkbookRequestMethod::Put) => method = reqwest::Method::PUT,
            Some(WorkbookRequestMethod::Delete) => method = reqwest::Method::DELETE,
            Some(WorkbookRequestMethod::Head) => method = reqwest::Method::HEAD,
            Some(WorkbookRequestMethod::Options) => method = reqwest::Method::OPTIONS,
            None => method = reqwest::Method::GET,
            _ => panic!("Invalid method \"{:?}\"", self.method),
        }

        let timeout: Duration;
        if let Some(t) = self.timeout {
            timeout = Duration::from_millis(t as u64);
        } else {
            timeout = Duration::from_secs(30);
        }

        // let keep_alive: bool;
        // if let Some(b) = request.keep_alive {
        //     keep_alive = b;
        // } else {
        //     keep_alive = true;
        // }

        let subs = &variables
            .iter()
            .map(|(name, value)| {
                let v = if let Some(s) = value.as_str() {
                    String::from(s)
                } else {
                    format!("{}", value)
                };

                // (pair.name.as_str(), pair.value.as_str())
                (format!("{{{{{}}}}}", name), v)
            })
            .collect();

        // Build the reqwest client and request
        let mut reqwest_builder = Client::builder()
            // .http2_keep_alive_while_idle(keep_alive)
            .timeout(timeout);

        // Add certificate to builder if configured
        let request_certificate: Option<WorkbookCertificate>;
        if let Some(active_cert) = certificate {
            request_certificate = Some(active_cert.clone());
            match active_cert.append_to_builder(reqwest_builder) {
                Ok(updated_builder) => reqwest_builder = updated_builder,
                Err(err) => return Err(err),
            }
        } else {
            request_certificate = None;
        }

        // Add proxy to builder if configured
        if let Some(active_proxy) = proxy {
            match active_proxy.append_to_builder(reqwest_builder) {
                Ok(updated_builder) => reqwest_builder = updated_builder,
                Err(err) => return Err(ExecutionError::Reqwest(err)),
            }
        }

        let builder_result = reqwest_builder.build();
        match builder_result {
            Ok(client) => {
                let mut request_builder = client.request(
                    method,
                    WorkbookRequestEntry::clone_and_sub(self.url.as_str(), &subs),
                );

                // Add headers, including authorization if applicable
                let mut headers = reqwest::header::HeaderMap::new();
                if let Some(h) = &self.headers {
                    for nvp in h {
                        if nvp.disabled != Some(true) {
                            headers.insert(
                                reqwest::header::HeaderName::try_from(
                                    WorkbookRequestEntry::clone_and_sub(&nvp.name, &subs),
                                )
                                .unwrap(),
                                reqwest::header::HeaderValue::try_from(
                                    WorkbookRequestEntry::clone_and_sub(&nvp.value, &subs),
                                )
                                .unwrap(),
                            );
                        }
                    }
                }

                let mut auth_token_cached: Option<bool> = None;
                match authorization {
                    Some(WorkbookAuthorization::Basic {
                        username, password, ..
                    }) => {
                        request_builder = request_builder.basic_auth(username, Some(password));
                    }
                    Some(WorkbookAuthorization::ApiKey { header, value, .. }) => {
                        headers.append(
                            reqwest::header::HeaderName::try_from(header).unwrap(),
                            reqwest::header::HeaderValue::try_from(value).unwrap(),
                        );
                    }
                    Some(WorkbookAuthorization::OAuth2Client {
                        id,
                        access_token_url,
                        client_id,
                        client_secret,
                        scope, // send_credentials_in_body: _,
                        ..
                    }) => {
                        match get_oauth2_client_credentials(
                            id,
                            access_token_url,
                            client_id,
                            client_secret,
                            scope,
                            auth_certificate,
                            auth_proxy,
                        )
                        .await
                        {
                            Ok((token, cached)) => {
                                auth_token_cached = Some(cached);
                                request_builder = request_builder.bearer_auth(token);
                            }
                            Err(err) => return Err(err),
                        }
                    }
                    None => {}
                }

                if !headers.is_empty() {
                    request_builder = request_builder.headers(headers);
                }

                // Add query string parameters, if applicable
                if let Some(q) = &self.query_string_params {
                    let mut query: Vec<(String, String)> = vec![];
                    for nvp in q {
                        if nvp.disabled != Some(true) {
                            query.push((
                                WorkbookRequestEntry::clone_and_sub(&nvp.name, &subs),
                                WorkbookRequestEntry::clone_and_sub(&nvp.value, &subs),
                            ));
                        }
                    }
                    request_builder = request_builder.query(&query);
                }

                // Add body, if applicable
                match &self.body {
                    Some(WorkbookRequestBody::Text { data }) => {
                        let s = WorkbookRequestEntry::clone_and_sub(&data, &subs);
                        request_builder = request_builder.body(Body::from(s.clone()));
                    }
                    Some(WorkbookRequestBody::JSON { data }) => {
                        let s = WorkbookRequestEntry::clone_and_sub(
                            serde_json::to_string(&data).unwrap().as_str(),
                            &subs,
                        );
                        request_builder = request_builder.body(Body::from(s.clone()));
                    }
                    Some(WorkbookRequestBody::XML { data }) => {
                        let s = WorkbookRequestEntry::clone_and_sub(&data, &subs);
                        request_builder = request_builder.body(Body::from(s.clone()));
                    }
                    Some(WorkbookRequestBody::Form { data }) => {
                        let form_data = data
                            .iter()
                            .map(|pair| {
                                (
                                    String::from(pair.name.as_str()),
                                    String::from(pair.value.as_str()),
                                )
                            })
                            .collect::<HashMap<String, String>>();
                        request_builder = request_builder.form(&form_data);
                    }
                    Some(WorkbookRequestBody::Raw { data }) => {
                        request_builder = request_builder.body(Body::from(data.clone()));
                    }
                    None => {}
                }

                let mut web_request = request_builder.build()?;

                // Copy value generated for the request so that we can include in the function results
                let request_url = web_request.url().to_string();
                let request_headers = web_request
                    .headers()
                    .iter()
                    .map(|(h, v)| {
                        (
                            String::from(h.as_str()),
                            String::from(v.to_str().unwrap_or("(Header Contains Non-ASCII Data)")),
                        )
                    })
                    .collect::<HashMap<String, String>>();
                let request_body: Option<ApicizeBody>;
                let ref_body = web_request.body_mut();
                match ref_body {
                    Some(data) => {
                        let bytes = data.as_bytes().unwrap();
                        if bytes.len() > 0 {
                            let request_encoding = UTF_8;

                            let data = bytes.to_vec();
                            let (decoded, _, malformed) = request_encoding.decode(&data);
                            request_body = Some(ApicizeBody {
                                data: Some(data.clone()),
                                text: if malformed {
                                    None
                                } else {
                                    Some(decoded.to_string())
                                },
                            })
                        } else {
                            request_body = None;
                        }
                    }
                    None => {
                        request_body = None;
                    }
                }

                // Execute the request
                let client_response = client.execute(web_request).await;
                match client_response {
                    Err(error) => return Err(ExecutionError::Reqwest(error)),
                    Ok(response) => {
                        // Collect headers for response
                        let response_headers = response.headers();
                        let headers: Option<HashMap<String, String>>;
                        if response_headers.is_empty() {
                            headers = None;
                        } else {
                            headers = Some(HashMap::from_iter(
                                response_headers
                                    .iter()
                                    .map(|(h, v)| {
                                        (
                                            String::from(h.as_str()),
                                            String::from(
                                                v.to_str()
                                                    .unwrap_or("(Header Contains Non-ASCII Data)"),
                                            ),
                                        )
                                    })
                                    .collect::<HashMap<String, String>>(),
                            ));
                        }

                        // Determine the default text encoding
                        let response_content_type = response_headers
                            .get(reqwest::header::CONTENT_TYPE)
                            .and_then(|value| value.to_str().ok())
                            .and_then(|value| value.parse::<Mime>().ok());

                        let response_encoding_name = response_content_type
                            .as_ref()
                            .and_then(|mime| {
                                mime.get_param("charset").map(|charset| charset.as_str())
                            })
                            .unwrap_or("utf-8");

                        let response_encoding =
                            Encoding::for_label(response_encoding_name.as_bytes()).unwrap_or(UTF_8);

                        // Collect status for response
                        let status = response.status();
                        let status_text =
                            String::from(status.canonical_reason().unwrap_or("Unknown"));

                        // Retrieve response bytes and convert raw data to string
                        let bytes = response.bytes().await?;

                        let response_body: Option<ApicizeBody>;
                        if bytes.len() > 0 {
                            let data = Vec::from(bytes.as_ref());
                            let (decoded, _, malformed) = response_encoding.decode(&data);

                            response_body = Some(ApicizeBody {
                                data: Some(data.clone()),
                                text: if malformed {
                                    None
                                } else {
                                    Some(decoded.to_string())
                                },
                            });
                        } else {
                            response_body = None;
                        }

                        return Ok((
                            ApicizeRequest {
                                url: request_url,
                                method: self.method.as_ref().unwrap().as_str().to_string(),
                                headers: request_headers,
                                body: request_body,
                                certificate: request_certificate,
                                variables: if variables.len() > 0 {
                                    Some(variables.clone())
                                } else {
                                    None
                                },
                            },
                            ApicizeResponse {
                                status: status.as_u16(),
                                status_text,
                                headers,
                                body: response_body,
                                auth_token_cached,
                            },
                        ));
                    }
                }
            }
            Err(err) => {
                println!("{}", &err);
                Err(ExecutionError::Reqwest(err))
            }
        }
    }
}

impl WorkbookRequestEntry {
    /// Utility function to perform string substitution based upon search/replace values in "subs"
    pub fn clone_and_sub(text: &str, subs: &HashMap<String, String>) -> String {
        if subs.is_empty() {
            text.to_string()
        } else {
            let mut clone = text.to_string();
            let mut i = subs.iter();
            while let Some((find, value)) = i.next() {
                clone = str::replace(&clone, find, value)
            }
            clone
        }
    }

    /// Retrieve request entry ID
    pub fn get_id(&self) -> &String {
        match self {
            WorkbookRequestEntry::Info(info) => &info.id,
            WorkbookRequestEntry::Group(group) => &group.id,
        }
    }

    /// Retrieve request entry name
    pub fn get_name(&self) -> &String {
        match self {
            WorkbookRequestEntry::Info(info) => &info.name,
            WorkbookRequestEntry::Group(group) => &group.name,
        }
    }

    /// REtrieve request entry number of runs
    pub fn get_runs(&self) -> u32 {
        match self {
            WorkbookRequestEntry::Info(info) => info.runs,
            WorkbookRequestEntry::Group(group) => group.runs,
        }
    }

    fn validate_selection<T: WorkspaceEntity<T>>(
        &self,
        entity_type: SelectableOptionType,
        list: &IndexedEntities<T>,
        default_type: &SelectableOptionDefaultType,
        warnings: &mut Vec<String>,
    ) {
        let selection = match entity_type {
            SelectableOptionType::Scenario => self.get_selected_scenario(),
            SelectableOptionType::Authorization => self.get_selected_authorization(),
            SelectableOptionType::Certificate => self.get_selected_certificate(),
            SelectableOptionType::Proxy => self.get_selected_proxy(),
        };

        if let Some(s) = selection {
            if !s.id.is_empty() {
                let mut found = list.entities.keys().any(|id| id.eq(&s.id));
                if !found {
                    found = list.entities.values().any(|v| {
                        let (_, name) = v.get_id_and_name();
                        name.eq_ignore_ascii_case(&s.name)
                    });
                }

                if !found {
                    warnings.push(format!(
                        "Unable to locate {} (ID: {}, Name: {}), defaulting to {}",
                        entity_type.as_str(),
                        s.id,
                        s.name,
                        default_type.as_str(),
                    ));
                }
            }
        }
    }
}

impl WorkbookCertificate {
    /// Append certificate to builder
    pub fn append_to_builder(
        &self,
        builder: ClientBuilder,
    ) -> Result<ClientBuilder, ExecutionError> {
        let identity_result: Result<Identity, Error>;
        match self {
            WorkbookCertificate::PKCS12 { pfx, password, .. } => {
                identity_result = Identity::from_pkcs12_der(
                    pfx,
                    password.clone().unwrap_or(String::from("")).as_str(),
                );
            }
            WorkbookCertificate::PKCS8PEM { pem, key, .. } => {
                identity_result = Identity::from_pkcs8_pem(pem, key);
            }
            WorkbookCertificate::PEM { pem, .. } => {
                identity_result = Identity::from_pem(pem);
            }
        }

        match identity_result {
            Ok(identity) => {
                // request_certificate = Some(cert.clone());
                Ok(
                    builder
                        .identity(identity)
                        // .connection_verbose(true)
                        .use_native_tls(), // .tls_info(true)
                )
            }
            Err(err) => Err(ExecutionError::Reqwest(err)),
        }
    }
}

impl WorkbookProxy {
    /// Append proxy to builder
    pub fn append_to_builder(&self, builder: ClientBuilder) -> Result<ClientBuilder, Error> {
        match Proxy::all(&self.url) {
            Ok(proxy) => Ok(builder.proxy(proxy)),
            Err(err) => Err(err),
        }
    }
}

impl SelectableOptions for WorkbookRequestEntry {
    fn validate_selections(
        &self,
        scenarios: &IndexedEntities<WorkbookScenario>,
        authorizations: &IndexedEntities<WorkbookAuthorization>,
        certificates: &IndexedEntities<WorkbookCertificate>,
        proxies: &IndexedEntities<WorkbookProxy>,
        default_type: &SelectableOptionDefaultType,
    ) -> Option<Vec<String>> {
        let mut warnings: Vec<String> = Vec::new();
        self.validate_selection(
            SelectableOptionType::Scenario,
            scenarios,
            default_type,
            &mut warnings,
        );
        self.validate_selection(
            SelectableOptionType::Authorization,
            authorizations,
            default_type,
            &mut warnings,
        );
        self.validate_selection(
            SelectableOptionType::Certificate,
            certificates,
            default_type,
            &mut warnings,
        );
        self.validate_selection(
            SelectableOptionType::Proxy,
            proxies,
            default_type,
            &mut warnings,
        );
        if warnings.is_empty() {
            None
        } else {
            Some(warnings)
        }
    }

    fn get_selected_scenario(&self) -> &Option<Selection> {
        match self {
            WorkbookRequestEntry::Info(info) => &info.selected_scenario,
            WorkbookRequestEntry::Group(group) => &group.selected_scenario,
        }
    }

    fn get_selected_authorization(&self) -> &Option<Selection> {
        match self {
            WorkbookRequestEntry::Info(info) => &info.selected_authorization,
            WorkbookRequestEntry::Group(group) => &group.selected_authorization,
        }
    }

    fn get_selected_certificate(&self) -> &Option<Selection> {
        match self {
            WorkbookRequestEntry::Info(info) => &info.selected_certificate,
            WorkbookRequestEntry::Group(group) => &group.selected_certificate,
        }
    }

    fn get_selected_proxy(&self) -> &Option<Selection> {
        match self {
            WorkbookRequestEntry::Info(info) => &info.selected_proxy,
            WorkbookRequestEntry::Group(group) => &group.selected_proxy,
        }
    }

    fn set_scenario(&mut self, value: Option<Selection>) {
        match self {
            WorkbookRequestEntry::Info(info) => info.selected_scenario = value,
            WorkbookRequestEntry::Group(group) => group.selected_scenario = value,
        }
    }

    fn set_authorization(&mut self, value: Option<Selection>) {
        match self {
            WorkbookRequestEntry::Info(info) => info.selected_authorization = value,
            WorkbookRequestEntry::Group(group) => group.selected_authorization = value,
        }
    }

    fn set_certificate(&mut self, value: Option<Selection>) {
        match self {
            WorkbookRequestEntry::Info(info) => info.selected_certificate = value,
            WorkbookRequestEntry::Group(group) => group.selected_certificate = value,
        }
    }

    fn set_proxy(&mut self, value: Option<Selection>) {
        match self {
            WorkbookRequestEntry::Info(info) => info.selected_proxy = value,
            WorkbookRequestEntry::Group(group) => group.selected_proxy = value,
        }
    }
}

impl SelectableOptions for Workspace {
    fn validate_selections(
        &self,
        scenarios: &IndexedEntities<WorkbookScenario>,
        authorizations: &IndexedEntities<WorkbookAuthorization>,
        certificates: &IndexedEntities<WorkbookCertificate>,
        proxies: &IndexedEntities<WorkbookProxy>,
        default_type: &SelectableOptionDefaultType,
    ) -> Option<Vec<String>> {
        let mut warnings: Vec<String> = Vec::new();
        self.validate_selection(
            SelectableOptionType::Scenario,
            scenarios,
            default_type,
            &mut warnings,
        );
        self.validate_selection(
            SelectableOptionType::Authorization,
            authorizations,
            default_type,
            &mut warnings,
        );
        self.validate_selection(
            SelectableOptionType::Certificate,
            certificates,
            default_type,
            &mut warnings,
        );
        self.validate_selection(
            SelectableOptionType::Proxy,
            proxies,
            default_type,
            &mut warnings,
        );
        if warnings.is_empty() {
            None
        } else {
            Some(warnings)
        }
    }

    fn get_selected_scenario(&self) -> &Option<Selection> {
        &self.selected_scenario
    }

    fn get_selected_authorization(&self) -> &Option<Selection> {
        &self.selected_authorization
    }

    fn get_selected_certificate(&self) -> &Option<Selection> {
        &self.selected_certificate
    }

    fn get_selected_proxy(&self) -> &Option<Selection> {
        &self.selected_proxy
    }

    fn set_scenario(&mut self, value: Option<Selection>) {
        self.selected_scenario = value;
    }

    fn set_authorization(&mut self, value: Option<Selection>) {
        self.selected_authorization = value;
    }

    fn set_certificate(&mut self, value: Option<Selection>) {
        self.selected_certificate = value;
    }

    fn set_proxy(&mut self, value: Option<Selection>) {
        self.selected_proxy = value;
    }
}

// #[cfg(test)]
// mod lib_tests {

//     use super::models::{WorkbookRequest, WorkbookRequestMethod};
//     use crate::{ExecutionError, WorkbookRequestEntry};

//     #[tokio::test]
//     async fn test_dispatch_success() -> Result<(), ExecutionError> {
//         let mut server = mockito::Server::new();

//         // Use one of these addresses to configure your client
//         let url = server.url();

//         // Create a mock
//         let mock = server
//             .mock("GET", "/")
//             .with_status(200)
//             .with_header("content-type", "text/plain")
//             .with_header("x-api-key", "1234")
//             .with_body("ok")
//             .create();

//         let request = WorkbookRequest {
//             id: String::from(""),
//             name: String::from("test"),
//             url,
//             method: Some(WorkbookRequestMethod::Get),
//             timeout: None,
//             keep_alive: None,
//             runs: 1,
//             headers: None,
//             query_string_params: None,
//             body: None,
//             test: None,
//             selected_scenario: None,
//             selected_authorization: None,
//             selected_certificate: None,
//             selected_proxy: None,
//         };

//         let result = WorkbookRequestEntry::dispatch(&request, &None, &None, &None).await;
//         mock.assert();

//         match result {
//             Ok((_, response)) => {
//                 assert_eq!(response.status, 200);
//                 assert_eq!(response.body.unwrap().text.unwrap(), String::from("ok"));
//                 Ok(())
//             }
//             Err(err) => Err(err),
//         }
//     }

//     // #[test]
//     // fn test_perform_test_success() {
//     //     let request = WorkbookRequest {
//     //         id: String::from(""),
//     //         name: String::from("Test #1"),
//     //         url: String::from("https://foo"),
//     //         method: Some(WorkbookRequestMethod::Get),
//     //         timeout: None,
//     //         body: None,
//     //         headers: None,
//     //         query_string_params: None,
//     //         keep_alive: None,
//     //         test: Some(String::from("describe(\"Status\", () => it(\"equals 200\", () => expect(response.status).to.equal(200)))"))
//     //     };
//     //     let response = ApicizeResponse {
//     //         status: 200,
//     //         status_text: String::from("Ok"),
//     //         headers: None,
//     //         body: None,
//     //         auth_token_cached: None,
//     //     };

//     //     let result = request.execute(&response).unwrap();

//     //     assert_eq!(
//     //         result,
//     //         vec!(ApicizeTestResult {
//     //             test_name: vec![String::from("Status"), String::from("equals 200")],
//     //             success: true,
//     //             error: None,
//     //             logs: None
//     //         })
//     //     );
//     // }

//     // #[test]
//     // fn test_perform_test_fail() {
//     //     let request = WorkbookRequest {
//     //         id: String::from(""),
//     //         name: String::from("Test #1"),
//     //         url: String::from("https://foo"),
//     //         method: Some(WorkbookRequestMethod::Get),
//     //         timeout: None,
//     //         body: None,
//     //         headers: None,
//     //         query_string_params: None,
//     //         keep_alive: None,
//     //         test: Some(String::from("describe(\"Status\", () => it(\"equals 200\", () => expect(response.status).to.equal(200)))"))
//     //     };

//     //     let response = ApicizeResponse {
//     //         status: 404,
//     //         status_text: String::from("Not Found"),
//     //         headers: None,
//     //         body: None,
//     //         auth_token_cached: None,
//     //     };

//     //     let result = request.execute(&response).unwrap();

//     //     assert_eq!(
//     //         result,
//     //         vec!(ApicizeTestResult {
//     //             test_name: vec![String::from("Status"), String::from("equals 200")],
//     //             success: false,
//     //             error: Some(String::from("expected 404 to equal 200")),
//     //             logs: None
//     //         })
//     //     );
//     // }
// }
