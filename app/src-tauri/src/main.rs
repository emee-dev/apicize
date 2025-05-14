// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod dragdrop;
pub mod error;
pub mod pkce;
pub mod sessions;
pub mod settings;
pub mod trace;
pub mod workspaces;

use apicize_lib::{
    editing::{
        execution_result_detail::ExecutionResultDetail,
        execution_result_summary::ExecutionResultSummary, execution_status::ExecutionStatus,
        indexed_entities::IndexedEntityPosition,
    },
    oauth2_client_tokens::{
        clear_all_oauth2_tokens, clear_oauth2_token, store_oauth2_token, CachedTokenInfo,
        PkceTokenResult,
    },
    ApicizeRunner, Authorization, ExternalData, TestRunnerContext, Warnings, Workspace,
};
use dragdrop::DroppedFile;
use error::ApicizeAppError;
use pkce::{OAuth2PkceInfo, OAuth2PkceRequest, OAuth2PkceService};
use serde::{Deserialize, Serialize};
use sessions::{Session, SessionInitialization, SessionSaveState, SessionStartupState, Sessions};
use settings::{ApicizeSettings, ColorScheme};
use std::{
    collections::HashMap,
    env,
    fs::{self, exists},
    io::{self},
    path::{Path, PathBuf},
    sync::{Arc, Mutex, OnceLock},
};
use tauri::{AppHandle, Emitter, Manager, State, WebviewWindow};
use tauri_plugin_clipboard::Clipboard;
use tokio_util::sync::CancellationToken;
use trace::{ReqwestEvent, ReqwestLogger};
use workspaces::{
    Entities, Entity, EntityType, Navigation, OpenWorkspaceResult, WorkspaceInfo,
    WorkspaceSaveStatus, Workspaces,
};

use tauri::async_runtime::RwLock;

struct AuthState {
    pkce: Mutex<OAuth2PkceService>,
}

struct SettingsState {
    settings: RwLock<ApicizeSettings>,
}

struct WorkspacesState {
    pub workspaces: RwLock<Workspaces>,
}

struct SessionsState {
    pub sessions: RwLock<Sessions>,
}

static REQWEST_LOGGER: OnceLock<ReqwestLogger> = OnceLock::new();

fn copy_files(source: &Path, destination: &Path) -> io::Result<()> {
    let exists = fs::exists(destination)?;
    if !exists {
        fs::create_dir_all(destination)?;
    }

    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let path = entry.path();
        let dest = destination.join(entry.file_name());
        if path.is_dir() {
            copy_files(path.as_path(), &dest)?;
        } else {
            fs::copy(path.as_path(), &dest)?;
        }
    }

    Ok(())
}

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let settings = if let Ok(loaded_settings) = ApicizeSettings::open() {
                loaded_settings.data
            } else {
                // If unable to load settings, try and put into place some sensible defaults
                ApicizeSettings {
                    workbook_directory: Some(String::from(
                        app.path()
                            .document_dir()
                            .unwrap()
                            .join("apicize")
                            .to_string_lossy(),
                    )),
                    font_size: 12,
                    navigation_font_size: 12,
                    color_scheme: ColorScheme::Dark,
                    editor_panels: String::from(""),
                    last_workbook_file_name: None,
                    recent_workbook_file_names: None,
                    pkce_listener_port: 8080,
                    always_hide_nav_tree: false,
                }
            };

            if settings.last_workbook_file_name.is_none() {
                // If we have not loaded a workbook before, copy the demo
                if let Some(workbook_directory) = &settings.workbook_directory {
                    if let Ok(resources) = &app.path().resource_dir() {
                        let src_demo_directory = resources.join("help").join("demo");
                        let dest_demo_directory = Path::new(workbook_directory);

                        if let Err(err) = copy_files(&src_demo_directory, dest_demo_directory) {
                            eprintln!(
                                "Unable to copy demo files from {} to {}: {}",
                                src_demo_directory.to_string_lossy(),
                                dest_demo_directory.to_string_lossy(),
                                err
                            );
                        }
                    }
                }
            }

            // When first loading, we either:
            // 1. Load the named workbook if passed in as an argument
            // 2. Load the last workbook file name if stored in settings
            // 3. Open a new workbook

            let mut load_workbook: Option<String> = None;
            let mut show_workbook_error = false;
            let mut session_error: Option<String> = None;

            let args: Vec<String> = env::args().collect();
            if args.len() > 1 {
                if let Some(file_argument) = args.get(1) {
                    if let Ok(true) = fs::exists(file_argument) {
                        load_workbook = Some(file_argument.to_owned());
                        show_workbook_error = true;
                    }
                }
            }

            if load_workbook.is_none() {
                load_workbook = settings.last_workbook_file_name.clone();
            }

            let is_new: bool;
            let (workspace, file_name) = match load_workbook {
                Some(workbook_filename) => match exists(&workbook_filename) {
                    Ok(found) => {
                        if found {
                            match Workspace::open(&PathBuf::from(&workbook_filename)) {
                                Ok(w) => {
                                    is_new = false;
                                    (w, workbook_filename)
                                }
                                Err(err) => {
                                    session_error = Some(format!(
                                        "Unable to load workboook {}: {}",
                                        &workbook_filename, err.error,
                                    ));
                                    is_new = true;
                                    (
                                        Workspace::new().expect("Error creating new workspace"),
                                        "".to_string(),
                                    )
                                }
                            }
                        } else {
                            if show_workbook_error {
                                session_error =
                                    Some(format!("Workboook {} not found", &workbook_filename));
                            }
                            is_new = true;
                            (
                                Workspace::new().expect("Error creating new workspace"),
                                "".to_string(),
                            )
                        }
                    }
                    Err(err) => {
                        is_new = true;
                        session_error = Some(format!("{}", err));
                        (
                            Workspace::new().expect("Error creating new workspace"),
                            "".to_string(),
                        )
                    }
                },
                None => {
                    is_new = true;
                    (
                        Workspace::new().expect("Error creating new workspace"),
                        "".to_string(),
                    )
                }
            };

            // Set up the workspace store with the initially loaded workspace
            let mut workspaces = Workspaces::default();

            let result = workspaces.add_workspace(workspace, &file_name, is_new);

            let main_window = app.get_webview_window("main").unwrap();
            set_window_title(&main_window, &result.display_name, false);

            // Set up the session store and initial session
            let mut sessions = Sessions::default();
            let session_id = sessions.add_session(Session {
                workspace_id: result.workspace_id.clone(),
                startup_state: Some(result.startup_state),
                error: session_error,
            });

            log::trace!(
                "Opened workspace {} in session {}",
                &result.workspace_id,
                &session_id
            );

            workspaces.trace_all_workspaces();
            sessions.trace_all_sessions();

            // Initialize log hook to monitor Reqwest activity
            let reqwest_logger = REQWEST_LOGGER.get_or_init(|| {
                let handle = tokio::runtime::Handle::current();
                let _ = handle.enter();
                ReqwestLogger::new(app.handle().clone())
            });

            let _ = log::set_logger(reqwest_logger);

            log::set_max_level(log::LevelFilter::Trace);

            // Set up sessions
            app.manage(SessionsState {
                sessions: RwLock::new(sessions),
            });

            // Set up settings
            app.manage(SettingsState {
                settings: RwLock::new(settings),
            });

            // Set up PKCE service
            app.manage(AuthState {
                pkce: Mutex::new(OAuth2PkceService::new(app.handle().clone())),
            });

            // Set up workspaces
            app.manage(WorkspacesState {
                workspaces: RwLock::new(workspaces),
            });

            Ok(())
        })
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        // .plugin(
        //     tauri_plugin_log::Builder::new()
        //         .level(log::LevelFilter::Warn)
        //         .level_for("reqwest", log::LevelFilter::Trace)
        //         // .level_for("apicize", log::LevelFilter::Trace)
        //         // .level_for("apicize::workspaces", log::LevelFilter::Trace)
        //         // .level_for("apicize::sessions", log::LevelFilter::Trace)
        //         .targets([
        //             Target::new(TargetKind::Stdout),
        //             // Target::new(TargetKind::LogDir { file_name: None }),
        //             // Target::new(TargetKind::Webview),                ])
        //         ])
        //         .build(),
        // )
        // .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            app.webview_windows()
                .iter()
                .next()
                .unwrap()
                .1
                .set_focus()
                .unwrap()
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            initialize_session,
            new_workspace,
            open_workspace,
            save_workspace,
            close_workspace,
            clone_workspace,
            get_workspace_save_status,
            open_settings,
            save_settings,
            run_request,
            cancel_request,
            get_result_detail,
            store_token,
            clear_all_cached_authorizations,
            clear_cached_authorization,
            // get_environment_variables,
            is_release_mode,
            get_clipboard_image,
            set_pkce_port,
            generate_authorization_info,
            // launch_pkce_window,
            retrieve_access_token,
            refresh_token,
            get_clipboard_file_data,
            get,
            get_title,
            get_dirty,
            get_request_active_authorization,
            list,
            add,
            update,
            delete,
            move_entity,
            list_logs,
            clear_logs,
            get_entity_type,
            find_descendant_groups,
        ])
        .run(tauri::generate_context!())
        .expect("error running Apicize");
}

fn set_window_title(window: &WebviewWindow, display_name: &str, dirty: bool) {
    let title = format!(
        "{} - Apicize {}",
        if display_name.is_empty() {
            "(New)"
        } else {
            display_name
        },
        if dirty { "*" } else { "" }
    );
    window.set_title(&title).unwrap();
}

#[tauri::command]
async fn initialize_session(
    session_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    settings_state: State<'_, SettingsState>,
    session_id: &str,
) -> Result<SessionInitialization, ApicizeAppError> {
    let sessions = session_state.sessions.read().await;
    let workspaces = workspaces_state.workspaces.read().await;
    let settings = settings_state.settings.read().await;
    let session = sessions.get_session(session_id)?;
    let editor_count = sessions.get_workspace_session_count(&session.workspace_id);
    let info = workspaces.get_workspace_info(&session.workspace_id)?;

    let startup_state = session.startup_state.as_ref();

    let init = SessionInitialization {
        workspace_id: session.workspace_id.clone(),
        settings: settings.clone(),
        error: session.error.clone(),
        navigation: info.navigation.clone(),
        executing_request_ids: info.executing_request_ids.clone(),
        result_summaries: info.result_summaries.clone(),
        file_name: info.file_name.clone(),
        display_name: info.display_name.clone(),
        dirty: info.dirty,
        editor_count,
        defaults: info.workspace.defaults.clone(),
        expanded_items: startup_state.and_then(|s| s.expanded_items.clone()),
        mode: session.startup_state.as_ref().and_then(|s| s.mode),
        active_id: startup_state.and_then(|s| s.active_id.clone()),
        active_type: startup_state.and_then(|s| s.active_type.clone()),
        help_topic: startup_state.and_then(|s| s.help_topic.clone()),
    };

    Ok(init)
}

#[tauri::command]
async fn new_workspace(
    app: AppHandle,
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    open_in_session_id: Option<String>,
) -> Result<(), ApicizeAppError> {
    let mut workspaces = workspaces_state.workspaces.write().await;
    let mut sessions = sessions_state.sessions.write().await;

    let workspace = Workspace::new()?;
    let result = workspaces.add_workspace(workspace, "", true);

    clear_all_oauth2_tokens().await;

    let initialize_session_id: String;

    // Set up the session store and initial session
    match open_in_session_id {
        Some(active_session_id) => {
            let old_workspace_id = sessions
                .get_session(&active_session_id)?
                .workspace_id
                .clone();

            log::trace!(
                "New workspace {} in existing session {}",
                &result.workspace_id,
                &active_session_id
            );

            let session = sessions.change_workspace(&active_session_id, &result.workspace_id)?;
            session.startup_state = Some(result.startup_state);

            let window = app.get_webview_window(&active_session_id).unwrap();
            set_window_title(&window, &result.display_name, false);

            log::trace!(
                "Session count for workspace {} is {}",
                &old_workspace_id,
                sessions.get_workspace_session_count(&old_workspace_id)
            );

            if sessions.get_workspace_session_count(&old_workspace_id) == 0 {
                workspaces.remove_workspace(&old_workspace_id);
                log::trace!("Closed workspace {}", &old_workspace_id);
            }

            initialize_session_id = active_session_id.clone();
        }
        None => {
            let active_session_id = sessions.add_session(Session {
                workspace_id: result.workspace_id.clone(),
                startup_state: Some(result.startup_state),
                error: None,
            });

            log::trace!(
                "New workspace {} in new session {}",
                &result.workspace_id,
                &active_session_id
            );

            let webview_url = tauri::WebviewUrl::App("index.html".into());
            let window = tauri::WebviewWindowBuilder::new(
                &app,
                active_session_id.clone(),
                webview_url.clone(),
            )
            .title(active_session_id.clone())
            .build()
            .unwrap();

            set_window_title(&window, &result.display_name, false);
            window.set_focus().unwrap();

            initialize_session_id = active_session_id.clone();
        }
    }

    workspaces.trace_all_workspaces();
    sessions.trace_all_sessions();

    app.emit_to(initialize_session_id, "initialize", ())
        .unwrap();

    Ok(())
}

#[tauri::command]
async fn open_workspace(
    app: AppHandle,
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    settings_state: State<'_, SettingsState>,
    file_name: String,
    open_in_session_id: Option<String>,
) -> Result<(), ApicizeAppError> {
    let mut workspaces = workspaces_state.workspaces.write().await;
    let mut sessions = sessions_state.sessions.write().await;

    // Check to see if the workspace is already open
    let mut result: Option<OpenWorkspaceResult> =
        workspaces.workspaces.iter().find_map(|(id, info)| {
            if !info.file_name.is_empty() && file_name.eq(&info.file_name) {
                Some(OpenWorkspaceResult {
                    workspace_id: id.clone(),
                    display_name: info.file_name.clone(),
                    startup_state: SessionStartupState::default(),
                })
            } else {
                None
            }
        });

    // If the session we're opening has the last reference to its workspace,
    // then close that workspace
    let mut remove_old_workspace: Option<String> = None;
    if let Some(session_id) = &open_in_session_id {
        if let Ok(session) = sessions.get_session(session_id) {
            let workspace_session_count =
                sessions.get_workspace_session_count(&session.workspace_id);
            if workspace_session_count == 1 {
                remove_old_workspace = Some(session.workspace_id.clone());
                result = None;
            }
        }
    }

    let state = match result {
        Some(r) => r,
        None => match Workspace::open(&PathBuf::from(&file_name)) {
            Ok(workspace) => workspaces.add_workspace(workspace, &file_name, false),
            Err(err) => {
                return Err(ApicizeAppError::FileAccessError(err));
            }
        },
    };

    if let Some(old_workspace_id) = remove_old_workspace {
        workspaces.remove_workspace(&old_workspace_id);
    }

    clear_all_oauth2_tokens().await;

    let mut settings = settings_state.settings.write().await;

    let info = workspaces.get_workspace_info_mut(&state.workspace_id)?;

    let initialize_session_id: String;

    match open_in_session_id {
        Some(active_session_id) => {
            log::trace!(
                "Opening workspace {} in existing session {}",
                &state.workspace_id,
                &active_session_id
            );

            let old_workspace_id = sessions
                .get_session(&active_session_id)?
                .workspace_id
                .clone();

            sessions.change_workspace(&active_session_id, &state.workspace_id)?;

            let window = app.get_webview_window(&active_session_id).unwrap();
            set_window_title(&window, &state.display_name, info.dirty);

            if sessions.get_workspace_session_count(&old_workspace_id) == 0 {
                workspaces.remove_workspace(&old_workspace_id);
            }

            initialize_session_id = active_session_id.clone();
        }
        None => {
            let active_session_id = sessions.add_session(Session {
                workspace_id: state.workspace_id.clone(),
                startup_state: None,
                error: None,
            });

            log::trace!(
                "Opening workspace {} in new session {}",
                &state.workspace_id,
                &active_session_id
            );

            let webview_url = tauri::WebviewUrl::App("index.html".into());
            let window = tauri::WebviewWindowBuilder::new(
                &app,
                active_session_id.clone(),
                webview_url.clone(),
            )
            .title(active_session_id.clone())
            .build()
            .unwrap();

            set_window_title(&window, &state.display_name, info.dirty);
            window.set_focus().unwrap();

            initialize_session_id = active_session_id.clone();
        }
    }

    if settings.update_recent_workbook_file_name(&file_name) {
        settings.save()?;
        app.emit("update_settings", settings.clone()).unwrap();
    }

    let info1 = workspaces.get_workspace_info(&state.workspace_id)?;
    dispatch_save_state(&app, &sessions, &state.workspace_id, info1, false);

    workspaces.trace_all_workspaces();
    sessions.trace_all_sessions();

    app.emit_to(initialize_session_id, "initialize", ())
        .unwrap();

    Ok(())
}

#[tauri::command]
async fn save_workspace(
    app: AppHandle,
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    settings_state: State<'_, SettingsState>,
    session_id: &str,
    file_name: Option<String>,
) -> Result<(), ApicizeAppError> {
    let mut workspaces = workspaces_state.workspaces.write().await;
    let sessions = sessions_state.sessions.write().await;

    let session = sessions.get_session(session_id)?;
    let info = workspaces.get_workspace_info_mut(&session.workspace_id)?;

    let save_as = match file_name {
        Some(n) => n,
        None => {
            if info.file_name.is_empty() {
                return Err(ApicizeAppError::FileNameRequired());
            } else {
                info.file_name.clone()
            }
        }
    };

    let save_to = PathBuf::from(&save_as);
    match info.workspace.save(&save_to) {
        Ok(..) => {
            let mut settings = settings_state.settings.write().await;
            if settings.update_recent_workbook_file_name(&save_as) {
                settings.save()?;
                app.emit("update_settings", settings.clone()).unwrap();
            }

            info.dirty = false;
            info.warn_on_workspace_creds = false;
            info.file_name = save_as.clone();
            info.display_name = save_to
                .file_stem()
                .unwrap_or_default()
                .to_string_lossy()
                .to_string();

            dispatch_save_state(&app, &sessions, &session.workspace_id, info, false);
            Ok(())
        }
        Err(err) => Err(ApicizeAppError::FileAccessError(err)),
    }
}

fn dispatch_save_state(
    app: &AppHandle,
    sessions: &Sessions,
    workspace_id: &str,
    info: &WorkspaceInfo,
    include_navigation: bool,
) {
    if let Some(session_ids) = get_workspace_sessions(workspace_id, sessions, None) {
        let state = SessionSaveState {
            file_name: info.file_name.clone(),
            display_name: info.display_name.clone(),
            dirty: info.dirty,
            editor_count: sessions.get_workspace_session_count(workspace_id),
        };

        for session_id in session_ids {
            app.emit_to(&session_id, "save_state", &state).unwrap();
            if include_navigation {
                app.emit_to(&session_id, "navigation", &info.navigation)
                    .unwrap();
            }
            if let Some(w) = app.get_webview_window(&session_id) {
                set_window_title(&w, &info.display_name, info.dirty);
            }
        }
    }
}

#[tauri::command]
async fn close_workspace(
    app: AppHandle,
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
) -> Result<(), ApicizeAppError> {
    let mut sessions = sessions_state.sessions.write().await;
    let session = sessions.get_session(session_id)?;
    let workspace_id = session.workspace_id.clone();

    log::trace!(
        "Closing session {} (workspace {})",
        &session_id,
        &workspace_id
    );

    sessions.remove_session(session_id)?;

    let editor_count = sessions.get_workspace_session_count(&workspace_id);
    if editor_count == 0 {
        let mut workspaces = workspaces_state.workspaces.write().await;
        workspaces.remove_workspace(&workspace_id);
    }

    let workspaces = workspaces_state.workspaces.read().await;
    let info = workspaces.get_workspace_info(&workspace_id)?;
    dispatch_save_state(&app, &sessions, &workspace_id, info, false);

    workspaces.trace_all_workspaces();
    sessions.trace_all_sessions();

    Ok(())
}

#[tauri::command]
async fn clone_workspace(
    app: AppHandle,
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    startup_state: Option<SessionStartupState>,
) -> Result<(), ApicizeAppError> {
    let workspaces = workspaces_state.workspaces.read().await;
    let mut sessions = sessions_state.sessions.write().await;
    let session = sessions.get_session(session_id)?;
    let workspace_id = session.workspace_id.clone();
    let info = workspaces.get_workspace_info(&workspace_id)?;

    let active_session_id = sessions.add_session(Session {
        workspace_id: workspace_id.clone(),
        startup_state,
        error: None,
    });

    log::trace!(
        "Cloning workspace {} in session {}",
        &workspace_id,
        &active_session_id
    );

    workspaces.trace_all_workspaces();
    sessions.trace_all_sessions();

    let webview_url = tauri::WebviewUrl::App("index.html".into());
    let window =
        tauri::WebviewWindowBuilder::new(&app, active_session_id.clone(), webview_url.clone())
            .title(active_session_id.clone())
            .build()
            .unwrap();

    set_window_title(&window, &info.display_name, info.dirty);
    window.set_focus().unwrap();

    Ok(())
}

#[tauri::command]
async fn get_workspace_save_status(
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
) -> Result<WorkspaceSaveStatus, ApicizeAppError> {
    let mut workspaces = workspaces_state.workspaces.write().await;
    let sessions = sessions_state.sessions.write().await;

    let session = sessions.get_session(session_id)?;
    let info = workspaces.get_workspace_info_mut(&session.workspace_id)?;

    let warn_on_workspace_creds = if info.warn_on_workspace_creds {
        info.workspace
            .authorizations
            .child_ids
            .get("W")
            .iter()
            .count()
            > 0
            || info
                .workspace
                .certificates
                .child_ids
                .get("W")
                .iter()
                .count()
                > 0
    } else {
        false
    };

    let any_invalid = info
        .workspace
        .requests
        .entities
        .values()
        .any(|e| (e.get_warnings().as_ref()).is_some_and(|w| !w.is_empty()));

    Ok(WorkspaceSaveStatus {
        dirty: info.dirty,
        warn_on_workspace_creds,
        any_invalid,
        file_name: info.file_name.clone(),
        display_name: info.display_name.clone(),
    })
}

#[tauri::command]
async fn open_settings() -> Result<ApicizeSettings, String> {
    match ApicizeSettings::open() {
        Ok(result) => {
            clear_all_oauth2_tokens().await;
            Ok(result.data)
        }
        Err(err) => Err(format!("{}", err.error)),
    }
}

#[tauri::command]
async fn save_settings(app: AppHandle, settings: ApicizeSettings) -> Result<(), String> {
    match settings.save() {
        Ok(..) => {
            app.emit("update_settings", settings).unwrap();
            Ok(())
        }
        Err(err) => Err(format!("{}", err.error)),
    }
}

fn cancellation_tokens() -> &'static Mutex<HashMap<String, CancellationToken>> {
    static TOKENS: OnceLock<Mutex<HashMap<String, CancellationToken>>> = OnceLock::new();
    TOKENS.get_or_init(|| Mutex::new(HashMap::new()))
}

#[tauri::command]
async fn run_request(
    app: AppHandle,
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    request_or_group_id: &str,
    workbook_full_name: String,
    single_run: bool,
) -> Result<Vec<ExecutionResultSummary>, ApicizeAppError> {
    let workspace_id: String;
    let runner: Arc<TestRunnerContext>;
    let mut other_sessions: Option<Vec<String>>;

    let cancellation = CancellationToken::new();
    {
        cancellation_tokens()
            .lock()
            .unwrap()
            .insert(request_or_group_id.to_owned(), cancellation.clone());
    }

    let allowed_data_path: Option<PathBuf> = if workbook_full_name.is_empty() {
        None
    } else {
        Some(
            std::path::absolute(&workbook_full_name)
                .unwrap()
                .parent()
                .unwrap()
                .to_path_buf(),
        )
    };

    {
        let sessions = sessions_state.sessions.read().await;
        let session = sessions.get_session(session_id)?;
        workspace_id = session.workspace_id.to_string();

        let cloned_workspace: Workspace;
        {
            let mut workspaces = workspaces_state.workspaces.write().await;
            let info = workspaces.get_workspace_info_mut(&workspace_id)?;
            info.executing_request_ids
                .insert(request_or_group_id.to_string());
            cloned_workspace = info.workspace.clone();
        }

        other_sessions = get_workspace_sessions(&workspace_id, &sessions, Some(session_id));
        if let Some(other_session_ids) = &other_sessions {
            let status = ExecutionStatus {
                request_or_group_id: request_or_group_id.to_string(),
                running: true,
                results: None,
            };
            for session_id in other_session_ids {
                app.emit_to(session_id, "update_execution", &status)
                    .unwrap();
            }
        }

        runner = Arc::new(TestRunnerContext::new(
            cloned_workspace,
            Some(cancellation),
            if single_run { Some(1) } else { None },
            &allowed_data_path,
            true, // enable detailed trace capture to get read/write data
        ));
    }

    let response = runner.run(&[request_or_group_id.to_string()]).await;
    cancellation_tokens()
        .lock()
        .unwrap()
        .remove(request_or_group_id);

    {
        let sessions = sessions_state.sessions.read().await;
        let mut workspaces = workspaces_state.workspaces.write().await;
        let info = workspaces.get_workspace_info_mut(&workspace_id)?;

        other_sessions = get_workspace_sessions(&workspace_id, &sessions, Some(session_id));

        match response {
            Ok(result) => {
                let (summaries, details) = result.assemble_results(request_or_group_id);

                info.result_summaries
                    .insert(request_or_group_id.to_string(), summaries.clone());

                info.result_details
                    .insert(request_or_group_id.to_string(), details);

                if let Some(other_session_ids) = &other_sessions {
                    let status = ExecutionStatus {
                        request_or_group_id: request_or_group_id.to_string(),
                        running: false,
                        results: Some(summaries.clone()),
                    };
                    for session_id in other_session_ids {
                        app.emit_to(session_id, "update_execution", &status)
                            .unwrap();
                    }
                }

                info.executing_request_ids.remove(request_or_group_id);
                Ok(summaries)
            }
            Err(err) => {
                if let Some(other_session_ids) = &other_sessions {
                    let status = ExecutionStatus {
                        request_or_group_id: request_or_group_id.to_string(),
                        running: false,
                        results: None,
                    };
                    for session_id in other_session_ids {
                        app.emit_to(session_id, "update_execution", &status)
                            .unwrap();
                    }
                }
                info.executing_request_ids.remove(request_or_group_id);
                Err(ApicizeAppError::ApicizeError(err))
            }
        }
    }
}

#[tauri::command]
async fn cancel_request(request_id: String) {
    let tokens = cancellation_tokens().lock().unwrap();
    if let Some(token) = tokens.get(&request_id) {
        token.cancel()
    }
}

#[tauri::command]
async fn get_result_detail(
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    request_id: &str,
    index: usize,
) -> Result<ExecutionResultDetail, ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let workspaces = workspaces_state.workspaces.read().await;
    workspaces.get_result_detail(&session.workspace_id, request_id, index)
}

#[tauri::command]
async fn store_token(authorization_id: String, token_info: CachedTokenInfo) {
    store_oauth2_token(&authorization_id, token_info).await
}

#[tauri::command]
async fn clear_all_cached_authorizations() -> usize {
    clear_all_oauth2_tokens().await
}

#[tauri::command]
async fn clear_cached_authorization(authorization_id: String) -> bool {
    clear_oauth2_token(authorization_id.as_str()).await
}

#[tauri::command]
fn get_clipboard_image(clipboard: State<Clipboard>) -> Result<Vec<u8>, String> {
    match clipboard.has_image() {
        Ok(has_image) => {
            if has_image {
                clipboard.read_image_binary()
            } else {
                Err(String::from("Clipboard does not contain an image"))
            }
        }
        Err(msg) => Err(msg),
    }
}

#[tauri::command]
fn get_clipboard_file_data(paths: Vec<String>) -> Result<DroppedFile, String> {
    for file_path in paths {
        match exists(&file_path) {
            Ok(found) => {
                if found {
                    match fs::read(&file_path) {
                        Ok(data) => {
                            return Ok(DroppedFile::from_data(&file_path, data));
                        }
                        Err(err) => {
                            return Err(err.to_string());
                        }
                    }
                }
            }
            Err(err) => {
                return Err(err.to_string());
            }
        }
    }
    Err("Unable to locate dropped paths".to_string())
}

#[tauri::command]
fn set_pkce_port(state: State<'_, AuthState>, port: u16) {
    let mut pkce = state.pkce.lock().unwrap();
    pkce.activate_listener(port);
}

#[tauri::command]
fn generate_authorization_info(
    state: State<'_, AuthState>,
    auth: OAuth2PkceInfo,
    port: u16,
) -> Result<OAuth2PkceRequest, String> {
    let pkce = state.pkce.lock().unwrap();
    pkce.generate_authorization_info(auth, port)
}

// #[tauri::command]
// fn launch_pkce_window(
//     state: State<'_, AppState>,
//     auth: OAuth2PkceInfo,
//     port: u16,
// ) -> Result<OAuth2PkceRequest, String> {
//     let mut pkce = state.pkce.lock().unwrap();
//     pkce.launch_pkce_window(auth, port)
// }

#[tauri::command]
async fn retrieve_access_token(
    token_url: &str,
    redirect_url: &str,
    code: &str,
    client_id: &str,
    verifier: &str,
) -> Result<PkceTokenResult, String> {
    OAuth2PkceService::retrieve_access_token(token_url, redirect_url, code, client_id, verifier)
        .await
}

#[tauri::command]
async fn refresh_token(
    token_url: &str,
    refresh_token: &str,
    client_id: &str,
) -> Result<PkceTokenResult, String> {
    OAuth2PkceService::refresh_token(token_url, refresh_token, client_id).await
}

#[tauri::command]
fn is_release_mode() -> bool {
    !cfg!(debug_assertions)
}

/// Retrieve other sessions for the updated workspace
fn get_workspace_sessions(
    workspace_id: &str,
    sessions: &Sessions,
    skip_session_id: Option<&str>,
) -> Option<Vec<String>> {
    let results = sessions
        .sessions
        .iter()
        .filter_map(|(sid, s)| {
            if let Some(skip) = skip_session_id {
                if skip == sid.as_str() {
                    return None;
                }
            }
            if workspace_id != s.workspace_id {
                None
            } else {
                Some(sid.clone())
            }
        })
        .collect::<Vec<String>>();
    match results.is_empty() {
        true => None,
        false => Some(results),
    }
}

#[tauri::command]
async fn get_request_active_authorization(
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    request_id: &str,
) -> Result<Option<Authorization>, ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let workspaces = workspaces_state.workspaces.read().await;
    Ok(workspaces
        .get_request_active_authorization(&session.workspace_id, request_id)?
        .clone())
}

#[tauri::command]
async fn list(
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    entity_type: EntityType,
    request_id: Option<&str>,
) -> Result<Entities, ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let workspaces = workspaces_state.workspaces.read().await;
    let result = match entity_type {
        EntityType::Parameters => {
            Entities::Parameters(workspaces.list_parameters(&session.workspace_id, request_id)?)
        }
        EntityType::Data => Entities::Data {
            data: workspaces.list_data(&session.workspace_id)?,
        },
        _ => {
            return Err(ApicizeAppError::InvalidTypeForOperation(entity_type));
        }
    };
    Ok(result)
}

#[tauri::command]
async fn get(
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    entity_type: EntityType,
    entity_id: &str,
) -> Result<Entity, ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let workspaces = workspaces_state.workspaces.read().await;
    Ok(match entity_type {
        EntityType::RequestEntry => {
            Entity::RequestEntry(workspaces.get_request_entry(&session.workspace_id, entity_id)?)
        }
        EntityType::Headers => {
            Entity::Headers(workspaces.get_request_headers(&session.workspace_id, entity_id)?)
        }
        EntityType::Body => {
            Entity::Body(workspaces.get_request_body(&session.workspace_id, entity_id)?)
        }
        EntityType::Scenario => Entity::Scenario(
            workspaces
                .get_scenario(&session.workspace_id, entity_id)?
                .clone(),
        ),
        EntityType::Authorization => {
            Entity::Authorization(workspaces.get_authorization(&session.workspace_id, entity_id)?)
        }
        EntityType::Certificate => {
            Entity::Certificate(workspaces.get_certificate(&session.workspace_id, entity_id)?)
        }
        EntityType::Proxy => Entity::Proxy(
            workspaces
                .get_proxy(&session.workspace_id, entity_id)?
                .clone(),
        ),
        EntityType::Data => Entity::Data(workspaces.get_data(&session.workspace_id, entity_id)?),
        _ => {
            return Err(ApicizeAppError::InvalidTypeForOperation(entity_type));
        }
    })
}

#[tauri::command]
async fn get_title(
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    entity_type: EntityType,
    entity_id: &str,
) -> Result<String, ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let workspaces = workspaces_state.workspaces.read().await;
    Ok(match entity_type {
        EntityType::RequestEntry => {
            workspaces.get_request_title(&session.workspace_id, entity_id)?
        }
        EntityType::Scenario => workspaces.get_scenario_title(&session.workspace_id, entity_id)?,
        EntityType::Authorization => {
            workspaces.get_authorization_title(&session.workspace_id, entity_id)?
        }
        EntityType::Certificate => {
            workspaces.get_certificate_title(&session.workspace_id, entity_id)?
        }
        EntityType::Proxy => workspaces.get_proxy_title(&session.workspace_id, entity_id)?,
        EntityType::Data => workspaces.get_data_title(&session.workspace_id, entity_id)?,
        _ => {
            return Err(ApicizeAppError::InvalidTypeForOperation(entity_type));
        }
    })
}

#[tauri::command]
async fn get_dirty(
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
) -> Result<bool, ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let workspaces = workspaces_state.workspaces.read().await;
    workspaces.get_dirty(&session.workspace_id)
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
async fn add(
    app: AppHandle,
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    entity_type: EntityType,
    relative_to_id: Option<&str>,
    relative_position: Option<IndexedEntityPosition>,
    clone_from_id: Option<&str>,
) -> Result<String, ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let workspace_id = session.workspace_id.clone();
    let mut workspaces = workspaces_state.workspaces.write().await;

    let id = match entity_type {
        EntityType::Request => workspaces.add_request(
            &workspace_id,
            relative_to_id,
            relative_position,
            clone_from_id,
        ),
        EntityType::Group => workspaces.add_request_group(
            &workspace_id,
            relative_to_id,
            relative_position,
            clone_from_id,
        ),
        EntityType::Scenario => workspaces.add_scenario(
            &workspace_id,
            relative_to_id,
            relative_position,
            clone_from_id,
        ),
        EntityType::Authorization => workspaces.add_authorization(
            &workspace_id,
            relative_to_id,
            relative_position,
            clone_from_id,
        ),
        EntityType::Certificate => workspaces.add_certificate(
            &workspace_id,
            relative_to_id,
            relative_position,
            clone_from_id,
        ),
        EntityType::Proxy => workspaces.add_proxy(
            &workspace_id,
            relative_to_id,
            relative_position,
            clone_from_id,
        ),
        EntityType::Data => {
            let result = workspaces.add_data(&workspace_id, clone_from_id)?;
            dispatch_data_list_notification(
                &app,
                &sessions,
                &workspace_id,
                workspaces.list_data(&workspace_id)?,
            );
            Ok(result)
        }
        _ => Err(ApicizeAppError::InvalidOperation(format!(
            "Unable to add {}",
            entity_type
        ))),
    }?;

    let info = workspaces.get_workspace_info_mut(&workspace_id)?;
    info.navigation = Navigation::new(&info.workspace);

    dispatch_save_state(&app, &sessions, &workspace_id, info, true);

    Ok(id)
}

#[tauri::command]
async fn update(
    app: AppHandle,
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    entity: Entity,
) -> Result<(), ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let mut workspaces = workspaces_state.workspaces.write().await;

    let other_sessions = get_workspace_sessions(&session.workspace_id, &sessions, Some(session_id));

    let event = if other_sessions.is_some() {
        Some(entity.clone())
    } else {
        None
    };

    let mut extra_event: Option<Entity> = None;

    // Perform updates and, when applicable, navigation updates
    let result = match entity {
        Entity::Request(request) => workspaces.update_request(&session.workspace_id, request),
        Entity::Group(group) => workspaces.update_group(&session.workspace_id, group),
        Entity::Headers(header_info) => {
            let request_info =
                workspaces.update_request_headers(&session.workspace_id, header_info)?;
            extra_event = Some(Entity::Request(request_info));
            Ok(None)
        }
        Entity::Body(body_info) => {
            let request_info = workspaces.update_request_body(&session.workspace_id, body_info)?;
            extra_event = Some(Entity::Request(request_info));
            Ok(None)
        }
        Entity::Scenario(scenario) => workspaces.update_scenario(&session.workspace_id, scenario),
        Entity::Authorization(authorization) => {
            workspaces.update_authorization(&session.workspace_id, authorization)
        }
        Entity::Certificate(certificate) => {
            workspaces.update_certificate(&session.workspace_id, certificate)
        }
        Entity::Proxy(proxy) => workspaces.update_proxy(&session.workspace_id, proxy),
        Entity::Data(data) => workspaces.update_data(&session.workspace_id, data),
        Entity::Defaults(defaults) => {
            workspaces.update_defaults(&session.workspace_id, defaults)?;
            Ok(None)
        }
        _ => {
            return Err(ApicizeAppError::InvalidOperation(
                "Unable to perform update on entity".to_owned(),
            ));
        }
    }?;

    let info = &workspaces.get_workspace_info(&session.workspace_id)?;

    let display_name = &info.display_name;

    // Publish any navigation updates to all sessions/windows for this workspace
    if let Some(session_ids) = get_workspace_sessions(&session.workspace_id, &sessions, None) {
        for session_id in session_ids {
            if let Some(updated_navigation) = &result {
                app.emit_to(&session_id, "navigation_entry", updated_navigation)
                    .unwrap();
            }
            app.emit_to(&session_id, "dirty", true).unwrap();
            if let Some(w) = app.get_webview_window(&session_id) {
                set_window_title(&w, display_name, true);
            }
        }
    }

    // Publish updates on all other sessions than the one sending the update
    // so they can update themselves
    if let Some(other_session_ids) = other_sessions {
        if let Some(event_to_send) = event {
            for other_session_id in other_session_ids {
                app.emit_to(&other_session_id, "update", &event_to_send)
                    .unwrap();
                if let Some(extra_event_to_send) = &extra_event {
                    app.emit_to(&other_session_id, "update", extra_event_to_send)
                        .unwrap();
                }
            }
        }
    }

    dispatch_save_state(&app, &sessions, &session.workspace_id, info, false);

    Ok(())
}

#[tauri::command]
async fn delete(
    app: AppHandle,
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    entity_type: EntityType,
    entity_id: &str,
) -> Result<(), ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let mut workspaces = workspaces_state.workspaces.write().await;

    let workspace_id = &session.workspace_id;

    match entity_type {
        EntityType::RequestEntry => workspaces.delete_request_entry(workspace_id, entity_id),
        EntityType::Request => workspaces.delete_request_entry(workspace_id, entity_id),
        EntityType::Group => workspaces.delete_request_entry(workspace_id, entity_id),
        EntityType::Body => workspaces.delete_request_entry(workspace_id, entity_id),
        EntityType::Scenario => workspaces.delete_scenario(workspace_id, entity_id),
        EntityType::Authorization => workspaces.delete_authorization(workspace_id, entity_id),
        EntityType::Certificate => workspaces.delete_certificate(workspace_id, entity_id),
        EntityType::Proxy => workspaces.delete_proxy(workspace_id, entity_id),
        EntityType::Data => {
            workspaces.delete_data(workspace_id, entity_id)?;
            dispatch_data_list_notification(
                &app,
                &sessions,
                workspace_id,
                workspaces.list_data(workspace_id)?,
            );
            Ok(())
        }
        _ => Err(ApicizeAppError::InvalidOperation(
            "Unable to perform delete on entity".to_owned(),
        )),
    }?;

    let info = workspaces.get_workspace_info_mut(workspace_id)?;
    info.navigation = Navigation::new(&info.workspace);
    dispatch_save_state(&app, &sessions, workspace_id, info, true);
    Ok(())
}

#[allow(clippy::too_many_arguments)]
#[tauri::command]
async fn move_entity(
    app: AppHandle,
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    entity_type: EntityType,
    entity_id: &str,
    relative_to_id: &str,
    relative_position: IndexedEntityPosition,
) -> Result<Vec<String>, ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let workspace_id = session.workspace_id.clone();
    let mut workspaces = workspaces_state.workspaces.write().await;

    let was_moved = match entity_type {
        EntityType::RequestEntry => workspaces.move_request_entry(
            &workspace_id,
            entity_id,
            relative_to_id,
            relative_position,
        ),
        EntityType::Request => workspaces.move_request_entry(
            &workspace_id,
            entity_id,
            relative_to_id,
            relative_position,
        ),
        EntityType::Group => workspaces.move_request_entry(
            &workspace_id,
            entity_id,
            relative_to_id,
            relative_position,
        ),
        EntityType::Scenario => {
            workspaces.move_scenario(&workspace_id, entity_id, relative_to_id, relative_position)
        }
        EntityType::Authorization => workspaces.move_authorization(
            &workspace_id,
            entity_id,
            relative_to_id,
            relative_position,
        ),
        EntityType::Certificate => {
            workspaces.move_certificate(&workspace_id, entity_id, relative_to_id, relative_position)
        }
        EntityType::Proxy => {
            workspaces.move_proxy(&workspace_id, entity_id, relative_to_id, relative_position)
        }
        _ => Err(ApicizeAppError::InvalidOperation(format!(
            "Unable to move {}",
            entity_type
        ))),
    }?;

    let results = if was_moved {
        let info = workspaces.get_workspace_info_mut(&workspace_id)?;
        info.navigation = Navigation::new(&info.workspace);

        dispatch_save_state(&app, &sessions, &workspace_id, info, true);

        workspaces.find_parent_ids(&workspace_id, entity_type, entity_id)?
    } else {
        vec![]
    };

    Ok(results)
}

#[tauri::command]
async fn list_logs() -> Result<Vec<ReqwestEvent>, ApicizeAppError> {
    match REQWEST_LOGGER.get() {
        Some(logger) => logger.get_logs(),
        None => Err(ApicizeAppError::ConcurrencyError(
            "Unable to access Reqwest logger".to_string(),
        )),
    }
}

#[tauri::command]
async fn clear_logs() -> Result<(), ApicizeAppError> {
    match REQWEST_LOGGER.get() {
        Some(logger) => logger.clear_logs(),
        None => Err(ApicizeAppError::ConcurrencyError(
            "Unable to access Reqwest logger".to_string(),
        )),
    }
}

#[tauri::command]
async fn get_entity_type(
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    entity_id: &str,
) -> Result<Option<EntityType>, ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let workspaces = workspaces_state.workspaces.read().await;
    workspaces.get_entity_type(&session.workspace_id, entity_id)
}

#[tauri::command]
async fn find_descendant_groups(
    sessions_state: State<'_, SessionsState>,
    workspaces_state: State<'_, WorkspacesState>,
    session_id: &str,
    group_id: &str,
) -> Result<Vec<String>, ApicizeAppError> {
    let sessions = sessions_state.sessions.read().await;
    let session = sessions.get_session(session_id)?;
    let workspaces = workspaces_state.workspaces.read().await;
    workspaces.find_descendent_groups(&session.workspace_id, group_id)
}

/// Dispatch notification of data list being updated (add or delete)
fn dispatch_data_list_notification(
    app: &AppHandle,
    sessions: &Sessions,
    workspace_id: &str,
    data: Vec<ExternalData>,
) {
    if let Some(session_ids) = get_workspace_sessions(workspace_id, sessions, None) {
        let event = Entity::DataList { list: data };
        for send_to_session_id in session_ids {
            app.emit_to(send_to_session_id, "update", &event).unwrap();
        }
    }
}

#[derive(Clone, Serialize, Deserialize)]
struct UpdateEvent {
    session_id: String,
    entity: Entity,
}

#[derive(Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct UpdatedNavigationEntry {
    entity_type: EntityType,
    id: String,
    name: String,
}
