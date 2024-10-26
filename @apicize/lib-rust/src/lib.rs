#![warn(missing_docs)]
//! Apicize test routine persistence and execution.
//!
//! This library supports the opening, saving and dispatching Apicize functional web tests

#[macro_use]
extern crate lazy_static;

pub mod models;
pub mod oauth2_client_tokens;
pub mod test_runner;

use core::panic;
use dirs::{config_dir, document_dir, home_dir};
use reqwest::{ClientBuilder, Error, Identity, Proxy};
use serde_json::Value;
use std::collections::HashSet;
use std::fs::create_dir_all;
use std::path::{Path, PathBuf};
use std::{collections::HashMap, path, vec};

use models::*;

const NO_SELECTION_ID: &str = "\tNONE\t";

/// State of a selected option
pub enum SelectedOption<T> {
    /// Use default parent selection (if available)
    UseDefault,
    /// Do not send a value for this selection
    Off,
    /// Use this value
    Some(T),
}

/// Return default workbooks directory
pub fn get_workbooks_directory() -> path::PathBuf {
    if let Some(directory) = document_dir() {
        directory.join("apicize")
    } else if let Some(directory) = home_dir() {
        directory.join("apicize")
    } else {
        panic!("Operating system did not provide document or home directory")
    }
}

struct ParameterResult<'a> {
    variables: HashMap<String, Value>,
    authorization: Option<&'a WorkbookAuthorization>,
    certificate: Option<&'a WorkbookCertificate>,
    proxy: Option<&'a WorkbookProxy>,
    auth_certificate: Option<&'a WorkbookCertificate>,
    auth_proxy: Option<&'a WorkbookProxy>,
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
        defaults: Option<WorkbookDefaults>,
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
            defaults,
        };

        save_data_file(&file_name, &workbook)
    }
}

impl Parameters {
    /// Return the file name for globals
    pub fn get_globals_filename() -> path::PathBuf {
        if let Some(directory) = config_dir() {
            directory.join("apicize").join("globals.json")
        } else {
            panic!("Operating system did not provide configuration directory")
        }
    }

    // Return the file name for private workbook options
    fn get_private_options_filename(workbook_path: &Path) -> path::PathBuf {
        let mut private_path = PathBuf::from(workbook_path);
        private_path.set_extension("apicize-priv");
        private_path
    }

    /// Return global parameters information
    pub fn open_global_parameters(
        global_parameters_filename: Option<PathBuf>,
    ) -> Result<SerializationOpenSuccess<Parameters>, SerializationFailure> {
        Self::open(if let Some(filename) = global_parameters_filename {
            filename.clone()
        } else {
            Self::get_globals_filename()
        })
    }

    /// Return workbook private parameter information
    pub fn open_workbook_private_parameters(
        workbook_path: &Path,
    ) -> Result<SerializationOpenSuccess<Parameters>, SerializationFailure> {
        Self::open(Self::get_private_options_filename(workbook_path))
    }

    /// Save global parameters information
    pub fn save_global_parameters(
        scenarios: &[WorkbookScenario],
        authorizations: &[WorkbookAuthorization],
        certificates: &[WorkbookCertificate],
        proxies: &[WorkbookProxy],
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
        workbook_path: &Path,
        scenarios: &[WorkbookScenario],
        authorizations: &[WorkbookAuthorization],
        certificates: &[WorkbookCertificate],
        proxies: &[WorkbookProxy],
    ) -> Result<SerializationSaveSuccess, SerializationFailure> {
        Self::save(
            Self::get_private_options_filename(workbook_path),
            scenarios,
            authorizations,
            certificates,
            proxies,
        )
    }

    /// Return parameters information or default if parameters file does not exist
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
        scenarios: &[WorkbookScenario],
        authorizations: &[WorkbookAuthorization],
        certificates: &[WorkbookCertificate],
        proxies: &[WorkbookProxy],
    ) -> Result<SerializationSaveSuccess, SerializationFailure> {
        let mut any = false;
        let save_scenarios = if scenarios.is_empty() {
            None
        } else {
            any = true;
            Some(
                scenarios
                    .iter()
                    .map(|e| {
                        let mut cloned = e.clone();
                        cloned.clear_persistence();
                        cloned
                    })
                    .collect(),
            )
        };
        let save_authorizations = if authorizations.is_empty() {
            None
        } else {
            any = true;
            Some(
                authorizations
                    .iter()
                    .map(|e| {
                        let mut cloned = e.clone();
                        cloned.clear_persistence();
                        cloned
                    })
                    .collect(),
            )
        };
        let save_certiificates = if certificates.is_empty() {
            None
        } else {
            any = true;
            Some(
                certificates
                    .iter()
                    .map(|e| {
                        let mut cloned = e.clone();
                        cloned.clear_persistence();
                        cloned
                    })
                    .collect(),
            )
        };
        let save_proxies = if proxies.is_empty() {
            None
        } else {
            any = true;
            Some(
                proxies
                    .iter()
                    .map(|e| {
                        let mut cloned = e.clone();
                        cloned.clear_persistence();
                        cloned
                    })
                    .collect(),
            )
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
    fn get_settings_directory() -> path::PathBuf {
        if let Some(directory) = config_dir() {
            directory.join("apicize")
        } else {
            panic!("Operating system did not provide configuration directory")
        }
    }

    /// Return the file name for settings
    fn get_settings_filename() -> path::PathBuf {
        Self::get_settings_directory().join("settings.json")
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
                font_size: 12,
                color_scheme: ColorScheme::Dark,
                editor_panels: String::from(""),
            };
            Ok(SerializationOpenSuccess {
                file_name: String::from(""),
                data: settings,
            })
        }
    }

    /// Save Apicize common environment to the specified name in the default path
    pub fn save(&self) -> Result<SerializationSaveSuccess, SerializationFailure> {
        let dir = Self::get_settings_directory();
        if !Path::new(&dir).is_dir() {
            if let Err(err) = create_dir_all(&dir) {
                panic!("Unable to create {} - {}", &dir.to_string_lossy(), err);
            }
        }
        save_data_file(&Self::get_settings_filename(), self)
    }
}

impl Identifable for WorkbookScenario {
    fn get_id_and_name(&self) -> (&String, &String) {
        (&self.id, &self.name)
    }
}

impl WorkspaceParameter<WorkbookScenario> for WorkbookScenario {
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

impl Identifable for WorkbookAuthorization {
    fn get_id_and_name(&self) -> (&String, &String) {
        match self {
            WorkbookAuthorization::Basic { id, name, .. } => (id, name),
            WorkbookAuthorization::OAuth2Client { id, name, .. } => (id, name),
            WorkbookAuthorization::ApiKey { id, name, .. } => (id, name),
        }
    }
}

impl WorkspaceParameter<WorkbookAuthorization> for WorkbookAuthorization {
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

impl Identifable for WorkbookCertificate {
    fn get_id_and_name(&self) -> (&String, &String) {
        match self {
            WorkbookCertificate::PKCS8PEM { id, name, .. } => (id, name),
            WorkbookCertificate::PEM { id, name, .. } => (id, name),
            WorkbookCertificate::PKCS12 { id, name, .. } => (id, name),
        }
    }
}

impl WorkspaceParameter<WorkbookCertificate> for WorkbookCertificate {
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

impl Identifable for WorkbookProxy {
    fn get_id_and_name(&self) -> (&String, &String) {
        (&self.id, &self.name)
    }
}

impl WorkspaceParameter<WorkbookProxy> for WorkbookProxy {
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
    fn validate_workbook_defaults(&mut self) {
        if self.defaults.is_none() {
            return;
        }

        if let Some(selection) = self.get_selected_scenario() {
            let ok = self.scenarios.find_match(selection);
            if !ok {
                self.add_warning(format!(
                    "Default selected scenario {} not found, defaulting to Off",
                    get_title(selection),
                ));
                self.set_selected_scenario(Some(Selection {
                    id: String::from(NO_SELECTION_ID),
                    name: String::from("Off"),
                }));
            }
        }

        if let Some(selection) = self.get_selected_authorization() {
            let ok = self.authorizations.find_match(selection);
            if !ok {
                self.add_warning(format!(
                    "Default authorization scenario {} not found, defaulting to Off",
                    get_title(selection),
                ));
                self.set_selected_authorization(Some(Selection {
                    id: String::from(NO_SELECTION_ID),
                    name: String::from("Off"),
                }));
            }
        }

        if let Some(selection) = self.get_selected_certificate() {
            let ok = self.scenarios.find_match(selection);
            if !ok {
                self.add_warning(format!(
                    "Default selected certificate {} not found, defaulting to Off",
                    get_title(selection),
                ));
                self.set_selected_certificate(Some(Selection {
                    id: String::from(NO_SELECTION_ID),
                    name: String::from("Off"),
                }));
            }
        }

        if let Some(selection) = self.get_selected_proxy() {
            let ok = self.scenarios.find_match(selection);
            if !ok {
                self.add_warning(format!(
                    "Default selected proxy {} not found, defaulting to Off",
                    get_title(selection),
                ));
                self.set_selected_proxy(Some(Selection {
                    id: String::from(NO_SELECTION_ID),
                    name: String::from("Off"),
                }));
            }
        }
    }

    /// Populate indexes
    fn populate_indexes<T: Clone + Identifable + WorkspaceParameter<T>>(
        entities: &Option<Vec<T>>,
        index: &mut IndexedEntities<T>,
        persistence: Persistence,
    ) {
        if let Some(existing) = entities {
            for e in existing {
                let (id, _) = e.get_id_and_name();
                let mut cloned = e.clone();
                if !index.top_level_ids.contains(id) {
                    index.top_level_ids.push(id.to_string());
                }
                cloned.set_persistence(persistence);
                index.entities.insert(id.to_string(), cloned);
            }
        }
    }

    /// Populate the workspace request list
    fn populate_requests(
        entities: &mut [WorkbookRequestEntry],
        indexed_requests: &mut IndexedRequests,
        parent_id: Option<String>,
        scenarios: &IndexedEntities<WorkbookScenario>,
        authorizations: &IndexedEntities<WorkbookAuthorization>,
        certificates: &IndexedEntities<WorkbookCertificate>,
        proxies: &IndexedEntities<WorkbookProxy>,
    ) {
        let active_parent_id = parent_id.unwrap_or(String::from(""));
        for e in entities.iter_mut() {
            e.validate_parameters(scenarios, authorizations, certificates, proxies);

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
                        );

                        group.children = None;
                    }
                }
            };
        }
    }

    /// Find entity (Scenario, Authorization, etc.)
    pub fn find_matching_selection<'a, T: WorkspaceParameter<T> + Identifable>(
        selection: &Option<Selection>,
        list: &'a IndexedEntities<T>,
    ) -> SelectedOption<&'a T> {
        match selection {
            Some(s) => {
                if s.id == NO_SELECTION_ID {
                    SelectedOption::Off
                } else if let Some(found) = list.entities.get(&s.id) {
                    SelectedOption::Some(found)
                } else {
                    match list.entities.values().find(|v| {
                        let (_, name) = v.get_id_and_name();
                        name.eq_ignore_ascii_case(&s.name)
                    }) {
                        Some(found_by_name) => SelectedOption::Some(found_by_name),
                        None => SelectedOption::UseDefault,
                    }
                }
            }
            None => SelectedOption::UseDefault,
        }
    }

    /// Find matching scenario, if any
    pub fn find_scenario(
        &self,
        selection: &Option<Selection>,
    ) -> SelectedOption<&WorkbookScenario> {
        Workspace::find_matching_selection(selection, &self.scenarios)
    }

    /// Open the specified workbook and globals file names
    pub fn open_from_file(
        workbook_file_name: &PathBuf,
        globals_filename: Option<PathBuf>,
    ) -> Result<Workspace, SerializationFailure> {
        // Open workbook
        let mut wkbk: Workbook;
        match open_data_file(workbook_file_name) {
            Ok(success) => {
                wkbk = success.data;
            }
            Err(error) => {
                return Err(error);
            }
        }

        // Load private parameters if file exists
        let privates: Option<Parameters>;
        let mut private_path = workbook_file_name.clone();
        private_path.set_extension("apicize-priv");
        if Path::new(&private_path).is_file() {
            match Parameters::open_workbook_private_parameters(&private_path) {
                Ok(success) => {
                    privates = Some(success.data);
                }
                Err(error) => {
                    return Err(error);
                }
            }
        } else {
            privates = None;
        }

        Self::open_from_workbook(&mut wkbk, privates, globals_filename)
    }

    /// Open a workspace using the specified workbook, taking into account private parameters file (if existing)
    /// and global settings
    pub fn open_from_workbook(
        wkbk: &mut Workbook,
        privates: Option<Parameters>,
        globals_filename: Option<PathBuf>,
    ) -> Result<Workspace, SerializationFailure> {
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

        // Open globals using either the specified file name or falling back to the default name,
        match Parameters::open_global_parameters(globals_filename) {
            Ok(success) => {
                let globals = success.data;
                // Populate entries from global storage
                Self::populate_indexes(
                    &globals.scenarios,
                    &mut wkspc_scenarios,
                    Persistence::Global,
                );
                Self::populate_indexes(
                    &globals.authorizations,
                    &mut wkspc_authorizations,
                    Persistence::Global,
                );
                Self::populate_indexes(
                    &globals.certificates,
                    &mut wkspc_certificates,
                    Persistence::Global,
                );
                Self::populate_indexes(&globals.proxies, &mut wkspc_proxies, Persistence::Global);

                // Populate entries from private parameter files, if any
                if let Some(private) = privates {
                    Self::populate_indexes(
                        &private.scenarios,
                        &mut wkspc_scenarios,
                        Persistence::Private,
                    );
                    Self::populate_indexes(
                        &private.authorizations,
                        &mut wkspc_authorizations,
                        Persistence::Private,
                    );
                    Self::populate_indexes(
                        &private.certificates,
                        &mut wkspc_certificates,
                        Persistence::Private,
                    );
                    Self::populate_indexes(
                        &private.proxies,
                        &mut wkspc_proxies,
                        Persistence::Private,
                    );
                }

                Self::populate_indexes(
                    &wkbk.scenarios,
                    &mut wkspc_scenarios,
                    Persistence::Workbook,
                );

                Self::populate_indexes(
                    &wkbk.authorizations,
                    &mut wkspc_authorizations,
                    Persistence::Workbook,
                );

                Self::populate_indexes(
                    &wkbk.certificates,
                    &mut wkspc_certificates,
                    Persistence::Workbook,
                );

                Self::populate_indexes(&wkbk.proxies, &mut wkspc_proxies, Persistence::Workbook);

                Self::populate_requests(
                    &mut wkbk.requests,
                    &mut wkspc_requests,
                    None,
                    &wkspc_scenarios,
                    &wkspc_authorizations,
                    &wkspc_certificates,
                    &wkspc_proxies,
                );

                let mut workspace = Workspace {
                    requests: wkspc_requests,
                    scenarios: wkspc_scenarios,
                    authorizations: wkspc_authorizations,
                    certificates: wkspc_certificates,
                    proxies: wkspc_proxies,
                    defaults: wkbk.defaults.clone(),
                    warnings: None,
                };

                // Validate the default workbook scenarios, etc. selected for testing
                workspace.validate_workbook_defaults();

                // for request in wkspc_requests.entities.values() {
                // }

                Ok(workspace)
            }
            Err(failure) => Err(failure),
        }
    }

    /// Recursively add requests to the list to save
    fn build_requests(
        ids: &[String],
        indexed_requests: &IndexedRequests,
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
                                let children = Self::build_requests(child_ids, indexed_requests);
                                if !children.is_empty() {
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
    fn append_entities<T: WorkspaceParameter<T> + Clone + Identifable>(
        ids: &[String],
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

        let wkbk_requests = Self::build_requests(&self.requests.top_level_ids, &self.requests);

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

        let defaults = self.defaults.clone();

        let mut successes: Vec<SerializationSaveSuccess> = vec![];

        match Workbook::save_workbook(
            PathBuf::from(workbook_path),
            wkbk_requests,
            wkbk_scenarios,
            wkbk_authorizations,
            wkbk_certificates,
            wkbk_proxies,
            defaults,
        ) {
            Ok(success) => successes.push(success),
            Err(error) => return Err(error),
        }

        match Parameters::save_workbook_private_parameters(
            workbook_path,
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

        Ok(successes)
    }

    fn retrieve_parameters(
        &self,
        request: &WorkbookRequestEntry,
        variables: &HashMap<String, Value>,
    ) -> ParameterResult {
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
            if allow_scenario && scenario.is_none() {
                match Self::find_matching_selection(
                    current.get_selected_scenario(),
                    &self.scenarios,
                ) {
                    SelectedOption::UseDefault => {}
                    SelectedOption::Off => {
                        scenario = None;
                        allow_scenario = false;
                    }
                    SelectedOption::Some(s) => {
                        scenario = Some(s);
                    }
                }
            }
            if allow_authorization && authorization.is_none() {
                match Self::find_matching_selection(
                    current.get_selected_authorization(),
                    &self.authorizations,
                ) {
                    SelectedOption::UseDefault => {}
                    SelectedOption::Off => {
                        authorization = None;
                        allow_authorization = false;
                    }
                    SelectedOption::Some(s) => {
                        authorization = Some(s);
                    }
                }
            }
            if allow_certificate && certificate.is_none() {
                match Self::find_matching_selection(
                    current.get_selected_certificate(),
                    &self.certificates,
                ) {
                    SelectedOption::UseDefault => {}
                    SelectedOption::Off => {
                        certificate = None;
                        allow_certificate = false;
                    }
                    SelectedOption::Some(s) => {
                        certificate = Some(s);
                    }
                }
            }
            if allow_proxy && proxy.is_none() {
                match Self::find_matching_selection(current.get_selected_proxy(), &self.proxies) {
                    SelectedOption::UseDefault => {}
                    SelectedOption::Off => {
                        proxy = None;
                        allow_proxy = false;
                    }
                    SelectedOption::Some(s) => {
                        proxy = Some(s);
                    }
                }
            }

            done = ((scenario.is_some() || !allow_scenario)
                && (authorization.is_some() || !allow_authorization)
                && (certificate.is_some())
                || !allow_certificate)
                && (proxy.is_some() || !allow_proxy);

            if !done {
                // Get the parent
                let id = current.get_id();
                encountered_ids.insert(id.clone());

                let mut parent: Option<&WorkbookRequestEntry> = None;
                if let Some(child_ids) = &self.requests.child_ids {
                    for (parent_id, children) in child_ids.iter() {
                        if children.contains(id) {
                            parent = self.requests.entities.get(&parent_id.clone());
                            break;
                        }
                    }
                }

                if let Some(found_parent) = parent {
                    let parent_id = found_parent.get_id();
                    if encountered_ids.contains(parent_id) {
                        println!(
                            "Recursive parent found at {}, cancelling traversal",
                            parent_id
                        );
                        done = true
                    } else {
                        current = found_parent;
                    }
                } else {
                    done = true;
                }
            }
        }

        // Load from workbook defaults if required
        if let Some(defaults) = &self.defaults {
            if scenario.is_none() && allow_scenario {
                if let SelectedOption::Some(v) =
                    Self::find_matching_selection(&defaults.selected_scenario, &self.scenarios)
                {
                    scenario = Some(v);
                }
            }
            if authorization.is_none() && allow_authorization {
                if let SelectedOption::Some(v) = Self::find_matching_selection(
                    &defaults.selected_authorization,
                    &self.authorizations,
                ) {
                    authorization = Some(v);
                }
            }
            if certificate.is_none() && allow_certificate {
                if let SelectedOption::Some(v) = Self::find_matching_selection(
                    &defaults.selected_certificate,
                    &self.certificates,
                ) {
                    certificate = Some(v);
                }
            }
            if proxy.is_none() && allow_proxy {
                if let SelectedOption::Some(v) =
                    Self::find_matching_selection(&defaults.selected_proxy, &self.proxies)
                {
                    proxy = Some(v);
                }
            }
        }

        // Set up OAuth2 cert/proxy if specified
        if let Some(WorkbookAuthorization::OAuth2Client {
            selected_certificate,
            selected_proxy,
            ..
        }) = authorization
        {
            if let Some(cert) = selected_certificate {
                auth_certificate = self.certificates.entities.get(&cert.id);
            }
            if let Some(proxy) = selected_proxy {
                auth_proxy = self.proxies.entities.get(&proxy.id);
            }
        }

        let mut result_variables = variables.clone();
        if let Some(active_scenario) = scenario {
            if let Some(variables) = &active_scenario.variables {
                for pair in variables {
                    result_variables.insert(pair.name.clone(), Value::from(pair.value.clone()));
                }
            }
        };

        ParameterResult {
            variables: result_variables,
            authorization,
            certificate,
            proxy,
            auth_certificate,
            auth_proxy,
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
            for (find, value) in subs.iter() {
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

    /// Retrieve request entry number of runs
    pub fn get_runs(&self) -> usize {
        match self {
            WorkbookRequestEntry::Info(info) => info.runs,
            WorkbookRequestEntry::Group(group) => group.runs,
        }
    }

    fn validate_parameters(
        &mut self,
        scenarios: &IndexedEntities<WorkbookScenario>,
        authorizations: &IndexedEntities<WorkbookAuthorization>,
        certificates: &IndexedEntities<WorkbookCertificate>,
        proxies: &IndexedEntities<WorkbookProxy>,
    ) {
        if let Some(selection) = self.get_selected_scenario() {
            let ok = scenarios.find_match(selection);
            if !ok {
                self.add_warning(format!(
                    "Request {} scenario {} not found, defaulting to Parent",
                    get_title(self),
                    get_title(selection),
                ));
                self.set_selected_scenario(None);
            }
        }

        if let Some(selection) = self.get_selected_authorization() {
            let ok = authorizations.find_match(selection);
            if !ok {
                self.add_warning(format!(
                    "Request {} authorization {} not found, defaulting to Parent",
                    get_title(self),
                    get_title(selection)
                ));
                self.set_selected_authorization(None);
            }
        }

        if let Some(selection) = self.get_selected_certificate() {
            let ok = certificates.find_match(selection);
            if !ok {
                self.add_warning(format!(
                    "Request {} certificate {} not found, defaulting to Parent",
                    get_title(self),
                    get_title(selection)
                ));
                self.set_selected_certificate(None);
            }
        }

        if let Some(selection) = self.get_selected_proxy() {
            let ok = proxies.find_match(selection);
            if !ok {
                self.add_warning(format!(
                    "Request {} selected proxy {} not found, defaulting to Parent",
                    get_title(self),
                    get_title(selection)
                ));
                self.set_selected_proxy(None);
            }
        }
    }
}

impl Identifable for WorkbookRequestEntry {
    fn get_id_and_name(&self) -> (&String, &String) {
        (self.get_id(), self.get_name())
    }
}

impl WorkbookCertificate {
    /// Append certificate to builder
    pub fn append_to_builder(
        &self,
        builder: ClientBuilder,
    ) -> Result<ClientBuilder, ExecutionError> {
        let identity_result = match self {
            WorkbookCertificate::PKCS12 { pfx, password, .. } => Identity::from_pkcs12_der(
                pfx,
                password.clone().unwrap_or(String::from("")).as_str(),
            ),
            WorkbookCertificate::PKCS8PEM { pem, key, .. } => Identity::from_pkcs8_pem(pem, key),
            WorkbookCertificate::PEM { pem, .. } => Identity::from_pem(pem),
        };

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

fn get_title(entity: &dyn Identifable) -> String {
    let (id, name) = entity.get_id_and_name();
    if name.is_empty() {
        format!("{} (Unnamed)", id)
    } else {
        name.to_string()
    }
}

impl SelectableOptions for WorkbookRequestEntry {
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

    fn set_selected_scenario(&mut self, value: Option<Selection>) {
        match self {
            WorkbookRequestEntry::Info(info) => info.selected_scenario = value,
            WorkbookRequestEntry::Group(group) => group.selected_scenario = value,
        }
    }

    fn set_selected_authorization(&mut self, value: Option<Selection>) {
        match self {
            WorkbookRequestEntry::Info(info) => info.selected_authorization = value,
            WorkbookRequestEntry::Group(group) => group.selected_authorization = value,
        }
    }

    fn set_selected_certificate(&mut self, value: Option<Selection>) {
        match self {
            WorkbookRequestEntry::Info(info) => info.selected_certificate = value,
            WorkbookRequestEntry::Group(group) => group.selected_certificate = value,
        }
    }

    fn set_selected_proxy(&mut self, value: Option<Selection>) {
        match self {
            WorkbookRequestEntry::Info(info) => info.selected_proxy = value,
            WorkbookRequestEntry::Group(group) => group.selected_proxy = value,
        }
    }
}

impl SelectableOptions for Workspace {
    fn get_selected_scenario(&self) -> &Option<Selection> {
        if let Some(defaults) = &self.defaults {
            &defaults.selected_scenario
        } else {
            &None
        }
    }

    fn get_selected_authorization(&self) -> &Option<Selection> {
        if let Some(defaults) = &self.defaults {
            &defaults.selected_authorization
        } else {
            &None
        }
    }

    fn get_selected_certificate(&self) -> &Option<Selection> {
        if let Some(defaults) = &self.defaults {
            &defaults.selected_certificate
        } else {
            &None
        }
    }

    fn get_selected_proxy(&self) -> &Option<Selection> {
        if let Some(defaults) = &self.defaults {
            &defaults.selected_proxy
        } else {
            &None
        }
    }

    fn set_selected_scenario(&mut self, value: Option<Selection>) {
        if let Some(defaults) = self.defaults.as_mut() {
            defaults.selected_scenario = value;
        } else {
            self.defaults = Some(WorkbookDefaults {
                selected_scenario: value,
                selected_authorization: None,
                selected_certificate: None,
                selected_proxy: None,
            });
        }
    }

    fn set_selected_authorization(&mut self, value: Option<Selection>) {
        if let Some(defaults) = self.defaults.as_mut() {
            defaults.selected_authorization = value;
        } else {
            self.defaults = Some(WorkbookDefaults {
                selected_scenario: None,
                selected_authorization: value,
                selected_certificate: None,
                selected_proxy: None,
            });
        }
    }

    fn set_selected_certificate(&mut self, value: Option<Selection>) {
        if let Some(defaults) = self.defaults.as_mut() {
            defaults.selected_certificate = value;
        } else {
            self.defaults = Some(WorkbookDefaults {
                selected_scenario: None,
                selected_authorization: None,
                selected_certificate: value,
                selected_proxy: None,
            });
        }
    }

    fn set_selected_proxy(&mut self, value: Option<Selection>) {
        if let Some(defaults) = self.defaults.as_mut() {
            defaults.selected_proxy = value;
        } else {
            self.defaults = Some(WorkbookDefaults {
                selected_scenario: None,
                selected_authorization: None,
                selected_certificate: None,
                selected_proxy: value,
            });
        }
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
