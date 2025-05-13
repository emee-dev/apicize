use chrono::Local;
use log::{Metadata, Record};
// use parking_lot::RwLock;
use regex::Regex;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

pub struct ReqwestLogger {
    regex_readwrite: Regex,
    regex_connect: Regex,
    app: AppHandle,
    // pub logs: RwLock<Vec<ReqwestEvent>>,
}

#[derive(Serialize, Clone)]
pub struct ReqwestEventConnect {
    pub timestamp: String,
    pub host: String,
}

#[derive(Serialize, Clone)]
pub struct ReqwestEventRead {
    pub timestamp: String,
    pub id: String,
    pub data: String,
}

#[derive(Serialize, Clone)]
pub struct ReqwestEventWrite {
    pub timestamp: String,
    pub id: String,
    pub data: String,
}

#[derive(Serialize, Clone)]
#[serde(tag = "event")]
pub enum ReqwestEvent {
    Connect(ReqwestEventConnect),
    Read(ReqwestEventRead),
    Write(ReqwestEventWrite),
}

impl ReqwestLogger {
    pub fn new(app: AppHandle) -> Self {
        ReqwestLogger {
            regex_readwrite: Regex::new(r#"^([0-9a-f]+) (read|write): b"(.*)"$"#).unwrap(),
            regex_connect: Regex::new(r#"starting new connection: (.*)"#).unwrap(),
            app,
            // logs: RwLock::new(vec![]),
        }
    }
}

impl log::Log for ReqwestLogger {
    fn enabled(&self, _: &Metadata) -> bool {
        true
    }

    fn log(&self, record: &Record) {
        let target = record.target();
        if target == "reqwest::connect" {
            let args = record.args().to_string();
            if let Some(result) = self.regex_connect.captures(&args) {
                if let Some(host) = result.get(1) {
                    let event = ReqwestEvent::Connect(ReqwestEventConnect {
                        timestamp: Local::now().format("%H:%M:%S%.3f").to_string(),
                        host: host.as_str().to_string(),
                    });
                    self.app.emit("log", &event).unwrap();
                    // self.logs.write().push(event);
                }
            }
        } else if target == "reqwest::connect::verbose" {
            let args = record.args().to_string();
            if let Some(result) = self.regex_readwrite.captures(&args) {
                if let Some(request_id) = result.get(1) {
                    if let Some(operation) = result.get(2) {
                        if let Some(data) = result.get(3) {
                            match operation.as_str() {
                                "read" => {
                                    let event = ReqwestEvent::Read(ReqwestEventRead {
                                        timestamp: Local::now().format("%H:%M:%S%.3f").to_string(),
                                        id: request_id.as_str().to_string(),
                                        data: String::from(data.as_str())
                                            .replace("\\r\\n", "\r\n")
                                            .replace("\\n", "\n"),
                                    });
                                    self.app.emit("log", &event).unwrap();
                                    // self.logs.write().push(event);
                                }
                                "write" => {
                                    let event = ReqwestEvent::Write(ReqwestEventWrite {
                                        timestamp: Local::now().format("%H:%M:%S%.3f").to_string(),
                                        id: request_id.as_str().to_string(),
                                        data: String::from(data.as_str())
                                            .replace("\\r\\n", "\r\n")
                                            .replace("\\n", "\n"),
                                    });
                                    self.app.emit("log", &event).unwrap();
                                    // self.logs.write().push(event);
                                }
                                _ => {}
                            }
                        }
                    }
                }
            }
        }
    }

    fn flush(&self) {}
}
