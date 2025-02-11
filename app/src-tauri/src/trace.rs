use chrono::Local;
use log::{Metadata, Record};
use regex::Regex;
use serde::Serialize;
use tauri::{AppHandle, Emitter};

pub struct ReqwestLogger {
    regex_readwrite: Regex,
    regex_connect: Regex,
    app: AppHandle,
}

#[derive(Serialize)]
pub struct ReqwestEventConnect<'a> {
    pub timestamp: &'a str,
    pub host: &'a str,
}

#[derive(Serialize)]
pub struct ReqwestEventRead<'a> {
    pub timestamp: &'a str,
    pub id: &'a str,
    pub data: &'a str,
}

#[derive(Serialize)]
pub struct ReqwestEventWrite<'a> {
    pub timestamp: &'a str,
    pub id: &'a str,
    pub data: &'a str,
}

#[derive(Serialize)]
#[serde(tag = "event")]
pub enum ReqwestEvent<'a> {
    Connect(ReqwestEventConnect<'a>),
    Read(ReqwestEventRead<'a>),
    Write(ReqwestEventWrite<'a>),
}

impl ReqwestLogger {
    pub fn new(app: AppHandle) -> Self {
        ReqwestLogger {
            regex_readwrite: Regex::new(r#"^([0-9a-f]+) (read|write): b"(.*)"$"#).unwrap(),
            regex_connect: Regex::new(r#"starting new connection: (.*)"#).unwrap(),
            app,
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
                    self.app
                        .emit(
                            "log",
                            &ReqwestEvent::Connect(ReqwestEventConnect {
                                timestamp: Local::now().format("%H:%M:%S%.3f").to_string().as_str(),
                                host: host.as_str(),
                            }),
                        )
                        .unwrap();
                }
            }
        } else if target == "reqwest::connect::verbose" {
            let args = record.args().to_string();
            if let Some(result) = self.regex_readwrite.captures(&args) {
                if let Some(request_id) = result.get(1) {
                    if let Some(operation) = result.get(2) {
                        if let Some(data) = result.get(3) {
                            if operation.as_str() == "read" {
                                self.app
                                    .emit(
                                        "log",
                                        &ReqwestEvent::Read(ReqwestEventRead {
                                            timestamp: Local::now()
                                                .format("%H:%M:%S%.3f")
                                                .to_string()
                                                .as_str(),
                                            id: request_id.as_str(),
                                            data: String::from(data.as_str())
                                                .replace("\\r\\n", "\r\n")
                                                .replace("\\n", "\n")
                                                .as_str(),
                                        }),
                                    )
                                    .unwrap();
                            } else {
                                self.app
                                    .emit(
                                        "log",
                                        &ReqwestEvent::Write(ReqwestEventWrite {
                                            timestamp: Local::now()
                                                .format("%H:%M:%S%.3f")
                                                .to_string()
                                                .as_str(),
                                            id: request_id.as_str(),
                                            data: String::from(data.as_str())
                                                .replace("\\r\\n", "\r\n")
                                                .replace("\\n", "\n")
                                                .as_str(),
                                        }),
                                    )
                                    .unwrap();
                            }
                        }
                    }
                }
            }
        }
    }

    fn flush(&self) {}
}
