//! Apicize models
//! 
//! This module defines models used to store and execute Apicize workbook requests
use apicize::{ApicizeExecution, ApicizeExecutionGroup, ApicizeExecutionGroupRun, ApicizeExecutionItem, ApicizeExecutionRequest, ApicizeExecutionRequestRun, ApicizeExecutionTotals, ExecutionTotals, ExecutionTotalsSource};
use oauth2::basic::BasicErrorResponseType;
use oauth2::{RequestTokenError, StandardErrorResponse};
use serde_json::Value;
use tokio::task::JoinError;
use std::collections::HashMap;
use std::fmt::Display;
use thiserror::Error;

pub mod apicize;
pub mod settings;
pub mod shared;
pub mod utility;
pub mod workbook;
pub mod workspace;
pub use settings::*;
pub use shared::*;
pub use utility::*;
pub use workbook::*;
pub use workspace::*;

/// Represents errors occuring during Workbook running, dispatching and testing
#[derive(Error, Debug)]
pub enum ExecutionError {
    /// HTTP errors
    #[error(transparent)]
    Reqwest(#[from] reqwest::Error),
    /// Join/async errors
    #[error(transparent)]
    Join(#[from] JoinError),
    /// OAuth2 authentication errors
    #[error(transparent)]
    OAuth2(#[from] RequestTokenError<oauth2::HttpClientError<oauth2::reqwest::Error>, StandardErrorResponse<BasicErrorResponseType>>),
    /// Failed test execution
    #[error("{0}")]
    FailedTest(String),
}

/// Represents errors occuring during Workbook running, dispatching and testing
#[derive(Error, Debug)]
pub enum RunError {
    /// Other error
    #[error("Other")]
    Other(String),
    /// Join error
    #[error("JoinError")]
    JoinError(JoinError),
    /// Execution cancelled
    #[error("Cancelled")]
    Cancelled,
}

/// HTTP methods for Apicize Requests
impl WorkbookRequestMethod {
    /// Returns Apicize Request method as string
    pub fn as_str(&self) -> &'static str {
        match self {
            WorkbookRequestMethod::Get => "GET",
            WorkbookRequestMethod::Post => "POST",
            WorkbookRequestMethod::Put => "PUT",
            WorkbookRequestMethod::Delete => "DELETE",
            WorkbookRequestMethod::Patch => "PATCH",
            WorkbookRequestMethod::Head => "HEAD",
            WorkbookRequestMethod::Options => "OPTIONS",
        }
    }
}

impl Display for WorkbookRequest {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}



impl Display for WorkbookRequestGroup {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.name)
    }
}


impl Display for WorkbookRequestEntry {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            WorkbookRequestEntry::Info(i) => write!(f, "{}", i.name),
            WorkbookRequestEntry::Group(g) => write!(f, "{}", g.name),
        }
    }
}

impl Warnings for Workspace {
    fn get_warnings(&self) -> &Option<Vec<String>> {
        &self.warnings
    }

    fn add_warning(&mut self, warning: String) {
        match &mut self.warnings {
            Some(warnings) => warnings.push(warning),
            None => self.warnings = Some(vec![warning])
        }
    }
}

/// Implement warnings trait for requests and groups
impl Warnings for WorkbookRequestEntry {
    /// Retrieve warnings
    fn get_warnings(&self) -> &Option<Vec<String>> {
        match self {
            WorkbookRequestEntry::Info(request) => &request.warnings,
            WorkbookRequestEntry::Group(group) => &group.warnings,
        }
    }

    fn add_warning(&mut self, warning: String) {
        match self {
            WorkbookRequestEntry::Info(request) => {
                match &mut request.warnings {
                    Some(warnings) => warnings.push(warning),
                    None => request.warnings = Some(vec![warning])
                }
            }
            WorkbookRequestEntry::Group(group) => {
                match &mut group.warnings {
                    Some(warnings) => warnings.push(warning),
                    None => group.warnings = Some(vec![warning])
                }
            }
        }
    }
}

impl ExecutionTotalsSource for ApicizeExecutionItem {
    /// Retrieve totals for an execution item
    fn get_totals(&self) -> ApicizeExecutionTotals {
        match self {
            ApicizeExecutionItem::Group(group) => ApicizeExecutionTotals {
                success: group.success,
                requests_with_passed_tests_count: group.requests_with_passed_tests_count,
                requests_with_failed_tests_count: group.requests_with_failed_tests_count,
                requests_with_errors: group.requests_with_errors,
                passed_test_count: group.passed_test_count,
                failed_test_count: group.failed_test_count,
            },
            ApicizeExecutionItem::Request(request) => ApicizeExecutionTotals {
                success: request.success,
                requests_with_passed_tests_count: if request.passed_test_count > 0 { 1 } else { 0 },
                requests_with_failed_tests_count: if request.failed_test_count > 0 { 1 } else { 0 },
                requests_with_errors: if request.success { 0 } else { 1 },
                passed_test_count: request.passed_test_count,
                failed_test_count: request.failed_test_count,
            },
        }
    }

    /// Retrieve variables for item execution
    fn get_variables(&self) -> &Option<HashMap<String, Value>> {
        match self {
            ApicizeExecutionItem::Group(group) => {
                if let Some(last_run) = group.runs.last() {
                    if let Some(last_item) = last_run.items.last() {
                        last_item.get_variables()
                    } else {
                        &None
                    }
                } else {
                    &None
                }
            }
            ApicizeExecutionItem::Request(request) => {
                if let Some(last_run) = request.runs.last() {
                    &last_run.variables
                } else {
                    &None
                }
            }
        }
    }
}

impl ExecutionTotals for ApicizeExecutionItem {
    fn add_totals(&mut self, other: &dyn ExecutionTotalsSource) {
        let other_totals = other.get_totals();

        match self {
            ApicizeExecutionItem::Group(group) => {
                group.requests_with_passed_tests_count +=
                    other_totals.requests_with_passed_tests_count;
                group.requests_with_failed_tests_count +=
                    other_totals.requests_with_failed_tests_count;
                group.requests_with_errors += other_totals.requests_with_errors;
                group.passed_test_count += other_totals.passed_test_count;
                group.failed_test_count += other_totals.failed_test_count;
            }
            ApicizeExecutionItem::Request(request) => {
                request.requests_with_passed_tests_count +=
                    other_totals.requests_with_passed_tests_count;
                request.requests_with_failed_tests_count +=
                    other_totals.requests_with_failed_tests_count;
                request.requests_with_errors += other_totals.requests_with_errors;
                request.passed_test_count += other_totals.passed_test_count;
                request.failed_test_count += other_totals.failed_test_count;
            }
        }
    }
}

impl ExecutionTotals for ApicizeExecutionGroup {
    fn add_totals(&mut self, other: &dyn ExecutionTotalsSource) {
        let other_totals = other.get_totals();

        self.requests_with_passed_tests_count += other_totals.requests_with_passed_tests_count;
        self.requests_with_failed_tests_count += other_totals.requests_with_failed_tests_count;
        self.requests_with_errors += other_totals.requests_with_errors;
        self.passed_test_count += other_totals.passed_test_count;
        self.failed_test_count += other_totals.failed_test_count;
    }
}

impl ExecutionTotals for ApicizeExecutionRequest {
    fn add_totals(&mut self, other: &dyn ExecutionTotalsSource) {
        let other_totals = other.get_totals();
        self.success = self.success && other_totals.success;
        self.requests_with_passed_tests_count += other_totals.requests_with_passed_tests_count;
        self.requests_with_failed_tests_count += other_totals.requests_with_failed_tests_count;
        self.requests_with_errors += other_totals.requests_with_errors;
        self.passed_test_count += other_totals.passed_test_count;
        self.failed_test_count += other_totals.failed_test_count;
    }
}

impl ExecutionTotalsSource for ApicizeExecutionRequestRun {
    /// Retrieve totals for an execution run
    fn get_totals(&self) -> ApicizeExecutionTotals {
        ApicizeExecutionTotals {
            success: self.success,
            requests_with_passed_tests_count: self.requests_with_passed_tests_count,
            requests_with_failed_tests_count: self.requests_with_failed_tests_count,
            requests_with_errors: self.requests_with_errors,
            passed_test_count: self.passed_test_count,
            failed_test_count: self.failed_test_count,
        }
    }

    fn get_variables(&self) -> &Option<HashMap<String, Value>> {
        return &self.variables;
    }
}

impl ExecutionTotals for ApicizeExecutionRequestRun {
    fn add_totals(&mut self, other: &dyn ExecutionTotalsSource) {
        let other_totals = other.get_totals();
        self.success = self.success && other_totals.success;
        self.requests_with_passed_tests_count += other_totals.requests_with_passed_tests_count;
        self.requests_with_failed_tests_count += other_totals.requests_with_failed_tests_count;
        self.requests_with_errors += other_totals.requests_with_errors;
        self.passed_test_count += other_totals.passed_test_count;
        self.failed_test_count += other_totals.failed_test_count;
    }
}

impl ExecutionTotalsSource for ApicizeExecutionGroupRun {
    /// Retrieve totals for an execution run
    fn get_totals(&self) -> ApicizeExecutionTotals {
        ApicizeExecutionTotals {
            success: self.success,
            requests_with_passed_tests_count: self.requests_with_passed_tests_count,
            requests_with_failed_tests_count: self.requests_with_failed_tests_count,
            requests_with_errors: self.requests_with_errors,
            passed_test_count: self.passed_test_count,
            failed_test_count: self.failed_test_count,
        }
    }

    fn get_variables(&self) -> &Option<HashMap<String, Value>> {
        return &self.variables;
    }
}

impl ExecutionTotals for ApicizeExecutionGroupRun {
    fn add_totals(&mut self, other: &dyn ExecutionTotalsSource) {
        let other_totals = other.get_totals();
        self.success = self.success && other_totals.success;
        self.requests_with_passed_tests_count += other_totals.requests_with_passed_tests_count;
        self.requests_with_failed_tests_count += other_totals.requests_with_failed_tests_count;
        self.requests_with_errors += other_totals.requests_with_errors;
        self.passed_test_count += other_totals.passed_test_count;
        self.failed_test_count += other_totals.failed_test_count;
    }
}
impl ExecutionTotals for ApicizeExecution {
    fn add_totals(&mut self, other: &dyn ExecutionTotalsSource) {
        let other_totals = other.get_totals();
        self.success = self.success && other_totals.success;
        self.requests_with_passed_tests_count += other_totals.requests_with_passed_tests_count;
        self.requests_with_failed_tests_count += other_totals.requests_with_failed_tests_count;
        self.requests_with_errors += other_totals.requests_with_errors;
        self.passed_test_count += other_totals.passed_test_count;
        self.failed_test_count += other_totals.failed_test_count;
    }
}

/*
#[cfg(test)]
mod model_tests {
    use serde_json::{json, Value};

    use super::{
        Workbook, WorkbookAuthorization, WorkbookNameValuePair, WorkbookRequest, WorkbookRequestBody, WorkbookRequestEntry, WorkbookRequestGroup, WorkbookRequestMethod, WorkbookScenario
    };

    fn default_requests() -> Vec<WorkbookRequestEntry> {
        Vec::from([
            WorkbookRequestEntry::Group(WorkbookRequestGroup {
                id: String::from("group-1"),
                name: String::from("test-1"),
                runs: 1,
                children: Box::new(Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                    id: String::from("XXX"),
                    name: String::from("test-1a"),
                    url: String::from("https://foo"),
                    method: None,
                    timeout: None,
                    keep_alive: None,
                    runs: 1,
                    headers: None,
                    query_string_params: None,
                    body: None,
                    test: None,
                })]))
            }),
            WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("YYY"),
                name: String::from("test-2"),
                url: String::from("https://bar"),
                method: None,
                timeout: None,
                keep_alive: None,
                runs: 1,
                headers: None,
                query_string_params: None,
                body: None,
                test: None,
            }),
        ])
    }

    fn default_requests_json() -> Value {
        json!([
            {
                "id": "group-1",
                "name": "test-1",
                "runs": 1,
                "children": [{
                    "id": "XXX",
                    "name": "test-1a",
                    "url": "https://foo"
                }]
            }, {
                "id": "YYY",
                "name": "test-2",
                "url": "https://bar"
            }
        ])
    }

    #[test]
    fn test_req_method() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "method": "POST"
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: Some(WorkbookRequestMethod::Post),
                timeout: None,
                keep_alive: None,
                runs: 1,
                headers: None,
                query_string_params: None,
                body: None,
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_timeout() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "timeout": 100
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: Some(100),
                keep_alive: None,
                runs: 1,
                headers: None,
                query_string_params: None,
                body: None,
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_keep_alive() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "keepAlive": true
            }]
        });
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                let expected = Workbook {
                    version: 0.1,
                    requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                        id: String::from("XXX"),
                        name: String::from("test"),
                        url: String::from("https://foo"),
                        method: None,
                        timeout: None,
                        keep_alive: Some(true),
                        runs: 1,
                        headers: None,
                        query_string_params: None,
                        body: None,
                        test: None,
                    })]),
                    authorizations: None,
                    scenarios: None,
                    proxies: None,
                    settings: None,
                };
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_headers() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "headers": [
                    {
                        "name": "foo",
                        "value": "bar"
                    }
                ]
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                runs: 1,
                headers: Some(vec![WorkbookNameValuePair {
                    name: String::from("foo"),
                    value: String::from("bar"),
                    disabled: None,
                }]),
                query_string_params: None,
                body: None,
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_query_string_params() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "queryStringParams": [{
                    "name": "foo",
                    "value": "bar"
                }]
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                runs: 1,
                headers: None,
                query_string_params: Some(vec![WorkbookNameValuePair {
                    name: String::from("foo"),
                    value: String::from("bar"),
                    disabled: None,
                }]),
                body: None,
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_body_as_text() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "body": {
                    "type": "Text",
                    "data": "test123"
                }
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                runs: 1,
                headers: None,
                query_string_params: None,
                body: Some(WorkbookRequestBody::Text {
                    data: String::from("test123"),
                }),
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_body_as_json() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "body": {
                    "type": "JSON",
                    "data": {
                        "foo": "bar",
                        "aaa": [1, 2, 3]
                    }
                }
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                runs: 1,
                headers: None,
                query_string_params: None,
                body: Some(WorkbookRequestBody::JSON {
                    data: json!({"foo": "bar", "aaa": [1, 2, 3]}),
                }),
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_body_as_xml() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "body": {
                    "type": "XML",
                    "data": "<foo></foo>"
                }
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                runs: 1,
                headers: None,
                query_string_params: None,
                body: Some(WorkbookRequestBody::XML {
                    data: String::from("<foo></foo>"),
                }),
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_body_as_base64() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "body": {
                    "type": "Base64",
                    "data": "VGVzdGluZyAxMjM="
                }
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                runs: 1,
                headers: None,
                query_string_params: None,
                body: Some(WorkbookRequestBody::Raw { 
                    data: Vec::from([84, 101, 115, 116, 105, 110, 103, 32, 49, 50, 51]),
                }),
                test: None,
            })]),
            authorizations: None,
            scenarios: None,
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_req_test4() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": [{
                "id": "XXX",
                "name": "test",
                "url": "https://foo",
                "test": "foo()"
            }]
        });
        let expected = Workbook {
            version: 0.1,
            requests: Vec::from([WorkbookRequestEntry::Info(WorkbookRequest {
                id: String::from("XXX"),
                name: String::from("test"),
                url: String::from("https://foo"),
                method: None,
                timeout: None,
                keep_alive: None,
                headers: None,
                runs: 1,
                query_string_params: None,
                body: None,
                test: Some(String::from("foo()")),
            })]),
            authorizations: None,
            scenarios: None,
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_no_auths_or_scenarios() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json()
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            authorizations: None,
            scenarios: None,
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_auth_basic_deserialize() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json(),
            "authorizations": [
                {
                    "type": "Basic",
                    "name": "test-basic",
                    "userName": "foo",
                    "password": "bar"
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            scenarios: None,
            authorizations: Some(vec![WorkbookAuthorization::Basic {
                id: String::from("100"),
                name: String::from("test-basic"),
                username: String::from("foo"),
                password: String::from("bar"),
            }]),
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_auth_oauth2_no_opts_deserialize() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json(),
            "authorizations": [
                {
                    "type": "OAuth2Client",
                    "name": "test-oauth2-client",
                    "accessTokenUrl": "https://foo",
                    "clientId": "me",
                    "clientSecret": "shhh"
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            scenarios: None,
            authorizations: Some(vec![WorkbookAuthorization::OAuth2Client {
                id: String::from("100"),
                name: String::from("test-oauth2-client"),
                access_token_url: String::from("https://foo"),
                client_id: String::from("me"),
                client_secret: String::from("shhh"),
                scope: None,
                // send_credentials_in_body: None,
            }]),
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_auth_oauth2_with_opts_deserialize() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json(),
            "authorizations": [
                {
                    "type": "OAuth2Client",
                    "name": "test-oauth2-client",
                    "accessTokenUrl": "https://foo",
                    "clientId": "me",
                    "clientSecret": "shhh",
                    "scope": "abc def",
                    // "sendCredentialsInBody": true
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            scenarios: None,
            authorizations: Some(vec![WorkbookAuthorization::OAuth2Client {
                id: String::from("100"),
                access_token_url: String::from("https://foo"),
                name: String::from("test-oauth2-client"),
                client_id: String::from("me"),
                client_secret: String::from("shhh"),
                scope: Some(String::from("abc def")),
                // send_credentials_in_body: Some(true),
            }]),
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_auth_apikey_deserialize() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json(),
            "authorizations": [
                {
                    "type": "ApiKey",
                    "id": "auth-1",
                    "name": "test-api-key",
                    "header": "foo",
                    "value": "bar"
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            scenarios: None,
            authorizations: Some(vec![WorkbookAuthorization::ApiKey {
                id: String::from("auth-1"),
                name: String::from("test-api-key"),
                header: String::from("foo"),
                value: String::from("bar"),
            }]),
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    #[test]
    fn test_deserialize() -> Result<(), serde_json::Error> {
        let data = json!({
            "version": 0.1,
            "requests": default_requests_json(),
            "scenarios": [
                {
                    "name": "foo",
                    "variables": {
                        "abc": "xxx",
                        "def": "yyy"
                    }
                }
            ]
        });
        let expected = Workbook {
            version: 0.1,
            requests: self::default_requests(),
            authorizations: None,
            scenarios: Some(vec![WorkbookScenario {
                id: String::from("100"),
                name: String::from("foo"),
                variables: Some(vec![
                    WorkbookNameValuePair {
                        name: String::from("abc"),
                        value: String::from("xxx"),
                        disabled: None,
                    },
                    WorkbookNameValuePair {
                        name: String::from("def"),
                        value: String::from("yyy"),
                        disabled: None,
                    },
                ]),
            }]),
            proxies: None,
            settings: None,
        };
        let result: Result<Workbook, serde_json::Error> = serde_json::from_value(data);

        match result {
            Ok(w) => {
                assert_eq!(expected, w);
                Ok(())
            }
            Err(err) => Err(err),
        }
    }

    // #[test]
    // fn test_deserialize_run_request -> Result<(), serde_json::Error> {

    //     let json = "{\"request\":{\"id\":\"740c1e49-24b7-4c88-9e3a-9ad0a8fc1e79\",\"name\":\"Get original quote\",\"test\":\"const data = JSON.parse(response.body.text)\\nscenario.original_author = data.author\\n\\ndescribe('status', () => {\\n   it('equals 200', () => {\\n      console.log('Test!')\\n      expect(response.status).to.equal(200)\\n   })\\n})\",\"url\":\"http://localhost:8080/quote/1\",\"method\":\"GET\",\"timeout\":5000},\"authorizaztion\":{\"type\":\"ApiKey\",\"id\":\"cbcaa934-6fe6-47f7-b0fe-ef1db66f5baf\",\"name\":\"Sample API Key\",\"header\":\"x-api-key\",\"value\":\"12345\"},\"scenario\":{\"id\":\"1faeaabc-b348-4cd5-a8ee-78c8b0c838d8\",\"name\":\"Scenario #1\",\"variables\":[{\"name\":\"author\",\"value\":\"Samuel Clemmons\",\"id\":\"03e9bb03-dd98-42cc-bc28-8630c9761d7d\"}]}}";
    //     let result = {
    //         request: WorkbookRequest {
    //                 id: String::from("YYY"),
    //                 name: String::from("test-2"),
    //                 url: String::from("https://bar"),
    //                 method: None,
    //                 timeout: None,
    //                 keep_alive: None,
    //                 headers: None,
    //                 query_string_params: None,
    //                 body: None,
    //                 test: None,
    //             }),
    //         ])
    
    //     }
    // }

}
*/