// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

pub mod pkce;
pub mod settings;
pub mod trace;

use apicize_lib::{
    oauth2_client_tokens::{clear_all_oauth2_tokens, clear_oauth2_token, PkceTokenResult},
    ApicizeResult, ApicizeRunner, TestRunnerContext, Workspace,
};
use pkce::{OAuth2PkceInfo, OAuth2PkceRequest, OAuth2PkceService};
use settings::{ApicizeSettings, ColorScheme};
use std::{
    collections::HashMap,
    env, fs, io,
    path::{Path, PathBuf},
    sync::Arc,
};
use tauri::{Manager, State};
use tauri_plugin_clipboard::Clipboard;
use tokio_util::sync::CancellationToken;
use trace::ReqwestLogger;

use std::sync::{Mutex, OnceLock};

struct AppState {
    pkce: Mutex<OAuth2PkceService>,
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

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let main_window = app.get_webview_window("main").unwrap();
            let mut settings = if let Ok(loaded_settings) = ApicizeSettings::open() {
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
                    color_scheme: ColorScheme::Dark,
                    editor_panels: String::from(""),
                    last_workbook_file_name: None,
                    recent_workbook_file_names: None,
                    pkce_listener_port: 8080,
                    always_hide_nav_tree: false,
                }
            };

            let args: Vec<String> = env::args().collect();
            if args.len() > 1 {
                if let Some(file_argument) = args.get(1) {
                    if let Ok(true) = fs::exists(file_argument) {
                        settings.last_workbook_file_name = Some(file_argument.to_owned());
                    }
                }
            }

            if settings.last_workbook_file_name.is_none() {
                if let Some(last_file) = &settings.last_workbook_file_name {
                    if let Ok(true) = fs::exists(last_file) {
                        settings.last_workbook_file_name = Some(last_file.to_owned());
                    }
                } else if let Some(workbook_directory) = &settings.workbook_directory {
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

            // Initialize log hook to monitor Reqwest activity
            let _ = log::set_logger(
                REQWEST_LOGGER.get_or_init(|| ReqwestLogger::new(app.handle().clone())),
            );
            log::set_max_level(log::LevelFilter::Trace);

            main_window
                .eval(&format!(
                    "let loadedSettings={};",
                    serde_json::to_string(&settings).unwrap()
                ))
                .unwrap();

            // Set up PKCE service
            app.manage(AppState {
                pkce: Mutex::new(OAuth2PkceService::new(app.handle().clone())),
            });

            Ok(())
        })
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_clipboard::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        // .plugin(
        //     tauri_plugin_log::Builder::new()
        //         .targets([
        //             Target::new(TargetKind::Stdout),
        //             // Target::new(TargetKind::LogDir { file_name: None }),
        //             // Target::new(TargetKind::Webview),                ])
        //         ])
        //         .build(),
        // )
        // .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
            // let ctr = &COUNTER.fetch_add(1, Ordering::Relaxed);
            // let window_name = format!("main-{}", ctr);

            // let mut config = app.config().app.windows.get(0).unwrap().clone();
            // config.label = window_name;
            // tauri::WebviewWindowBuilder::from_config(app, &config)
            //     .unwrap()
            //     .build()
            //     .unwrap()
            //     .set_focus()
            //     .unwrap();

            // let webview_url = tauri::WebviewUrl::App("index.html".into());
            // tauri::WebviewWindowBuilder::new(app, "main1", webview_url.clone())
            //     .title(window_name)
            //     .build()
            //     .unwrap()
            //     .set_focus()
            //     .unwrap();

            app.get_webview_window("main")
                .expect("no main window")
                .set_focus()
                .unwrap()
        }))
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .invoke_handler(tauri::generate_handler![
            new_workspace,
            open_workspace,
            save_workspace,
            open_settings,
            save_settings,
            run_request,
            cancel_request,
            clear_cached_authorization,
            // get_environment_variables,
            is_release_mode,
            get_clipboard_image_base64,
            set_pkce_port,
            generate_authorization_info,
            // launch_pkce_window,
            retrieve_access_token,
            refresh_token,
        ])
        .run(tauri::generate_context!())
        .expect("error running Apicize");
}

#[tauri::command]
async fn new_workspace() -> Result<Workspace, String> {
    match Workspace::new() {
        Ok(workspace) => {
            clear_all_oauth2_tokens().await;
            Ok(workspace)
        }
        Err(err) => Err(format!("{}", err.error)),
    }
}

#[tauri::command]
async fn open_workspace(path: String) -> Result<Workspace, String> {
    match Workspace::open(&PathBuf::from(path)) {
        Ok(workspace) => {
            clear_all_oauth2_tokens().await;
            Ok(workspace)
        }
        Err(err) => Err(format!("{}", err.error)),
    }
}

#[tauri::command]
fn save_workspace(workspace: Workspace, path: String) -> Result<(), String> {
    match workspace.save(&PathBuf::from(path)) {
        Ok(..) => Ok(()),
        Err(err) => Err(format!("{}", err.error)),
    }
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
async fn save_settings(settings: ApicizeSettings) -> Result<(), String> {
    match settings.save() {
        Ok(..) => Ok(()),
        Err(err) => Err(format!("{}", err.error)),
    }
}

fn cancellation_tokens() -> &'static Mutex<HashMap<String, CancellationToken>> {
    static TOKENS: OnceLock<Mutex<HashMap<String, CancellationToken>>> = OnceLock::new();
    TOKENS.get_or_init(|| Mutex::new(HashMap::new()))
}

#[tauri::command]
async fn run_request(
    workspace: Workspace,
    request_id: String,
    workbook_full_name: String,
) -> Result<ApicizeResult, String> {
    let cancellation = CancellationToken::new();
    {
        cancellation_tokens()
            .lock()
            .unwrap()
            .insert(request_id.clone(), cancellation.clone());
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

    let runner = Arc::new(TestRunnerContext::new(
        workspace,
        None,
        None,
        &allowed_data_path,
        true,
    ));

    let response = runner.run(&[request_id.clone()]).await;

    cancellation_tokens().lock().unwrap().remove(&request_id);

    match response {
        Ok(result) => Ok(result),
        Err(err) => Err(err.to_string()),
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
async fn clear_cached_authorization(authorization_id: String) -> bool {
    clear_oauth2_token(authorization_id.as_str()).await
}

#[tauri::command]
fn get_clipboard_image_base64(clipboard: State<Clipboard>) -> Result<String, String> {
    match clipboard.has_image() {
        Ok(has_image) => {
            if has_image {
                clipboard.read_image_base64()
            } else {
                Err(String::from("Clipboard does not contain an image"))
            }
        }
        Err(msg) => Err(msg),
    }
}

#[tauri::command]
fn set_pkce_port(state: State<'_, AppState>, port: u16) {
    let mut pkce = state.pkce.lock().unwrap();
    pkce.activate_listener(port);
}

#[tauri::command]
fn generate_authorization_info(
    state: State<'_, AppState>,
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

// #[tauri::command]
// fn get_environment_variables() -> Vec<(String, String)> {
//     std::env::vars().into_iter().map1(|e| e).collect()
// }

#[tauri::command]
fn is_release_mode() -> bool {
    !cfg!(debug_assertions)
}
