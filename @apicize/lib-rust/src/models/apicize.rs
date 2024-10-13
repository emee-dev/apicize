//! Apicize models submodule
//!
//! This submodule defines models used to execute Apicize tests

use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use serde_with::base64::{Base64, Standard};
use serde_with::formats::Unpadded;
use serde_with::serde_as;

/// Body information used when dispatching an Apicize Request
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeBody {
    /// Body as data (UTF-8 bytes)
    #[serde_as(as = "Option<Base64<Standard, Unpadded>>")]
    pub data: Option<Vec<u8>>,
    /// Reprsents body as text
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
}

/// Information used to dispatch an Apicize request
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeRequest {
    /// URL
    pub url: String,
    /// HTTP Method
    pub method: String,
    /// Headers
    pub headers: HashMap<String, String>,
    /// Body
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<ApicizeBody>,
    /// Variables passed into request
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variables: Option<HashMap<String, Value>>,
}

/// Information about the response to a dispatched Apicize request
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeResponse {
    /// HTTP status code
    pub status: u16,
    /// HTTP status text
    pub status_text: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Response headers
    pub headers: Option<HashMap<String, String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    /// Response body
    pub body: Option<ApicizeBody>,
    /// True if authorization token cached
    pub auth_token_cached: Option<bool>,
}

/// Response from V8 when executing a request's tests
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ExecutedTestResponse {
    /// Results of test
    pub results: Option<Vec<TestResult>>,
    /// Scenario values (if any)
    pub variables: HashMap<String, Value>,
}

/// Information about an executed Apicize test
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct TestResult {
    /// Human readable name of the test
    pub test_name: Vec<String>,
    /// Whether or not the test was successful
    pub success: bool,
    /// Error generated during the test
    pub error: Option<String>,
    /// Console I/O generated during the test
    pub logs: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
/// Totals of execution results
pub struct ApicizeExecutionTotals {
    /// Number of child requests/groups with successful requests and all tests passed
    pub requests_with_passed_tests_count: usize,
    /// Number of child requests/groups with successful requests and some tests failed
    pub requests_with_failed_tests_count: usize,
    /// Number of child requests/groups with errors executing requests and/or tests
    pub requests_with_errors: usize,
    /// Number of passed tests, if request and tests are succesfully run
    pub passed_test_count: usize,
    /// Number of failed tests, if request and tests are succesfully run
    pub failed_test_count: usize,
    /// If set, active variables should be updated to this value after execution
    pub variables: Option<HashMap<String, Value>>,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
/// Information about an application execution run
pub struct ApicizeExecutionRun {
    /// Execution start (millisecond offset from start)
    pub executed_at: u128,
    /// Duration of execution (milliseconds)
    pub duration: u128,
    /// Number of child requests/groups with successful requests and all tests passed
    pub requests_with_passed_tests_count: usize,
    /// Number of child requests/groups with successful requests and some tests failed
    pub requests_with_failed_tests_count: usize,
    /// Number of child requests/groups with errors executing requests and/or tests
    pub requests_with_errors: usize,
    /// Number of passed tests, if request and tests are succesfully run
    pub passed_test_count: usize,
    /// Number of failed tests, if request and tests are succesfully run
    pub failed_test_count: usize,
    /// Requests and groups executed during run
    pub items: Vec<ApicizeExecutionItem>,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
/// An appicize execution
pub struct ApicizeExecution {
    /// Duration of execution (milliseconds)
    pub duration: u128,
    /// Requests or groups that are executed
    pub runs: Vec<ApicizeExecutionRun>,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase", tag = "type")]
/// Request or group that was executed
pub enum ApicizeExecutionItem {
    /// Request group that is executed
    Group(Box<ApicizeExecutionGroup>),
    /// Request that is executed
    Request(Box<ApicizeExecutionRequest>),
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
/// Request or group that is executed, including run number
pub struct ApicizeExecutionRunItem {
    /// Run number of execution
    pub run: u32,
    /// Request or group that was executed
    pub item: ApicizeExecutionItem,
}

impl ApicizeExecutionItem {
    /// Retrieve totals for an execution item
    pub fn get_totals(&self) -> ApicizeExecutionTotals {
        match self {
            ApicizeExecutionItem::Group(group) => ApicizeExecutionTotals {
                requests_with_passed_tests_count: group.requests_with_passed_tests_count,
                requests_with_failed_tests_count: group.requests_with_failed_tests_count,
                requests_with_errors: group.requests_with_errors,
                passed_test_count: group.passed_test_count,
                failed_test_count: group.failed_test_count,
                variables: if let Some(last) = group.items.last() {
                    last.get_totals().variables
                } else {
                    None
                },
            },
            ApicizeExecutionItem::Request(request) => ApicizeExecutionTotals {
                requests_with_passed_tests_count: if request.passed_test_count.unwrap_or(0) > 0 {
                    1
                } else {
                    0
                },
                requests_with_failed_tests_count: if request.failed_test_count.unwrap_or(0) > 0 {
                    1
                } else {
                    0
                },
                requests_with_errors: if request.success { 0 } else { 1 },
                passed_test_count: request.passed_test_count.unwrap_or(0),
                failed_test_count: request.failed_test_count.unwrap_or(0),
                variables: request.tests.as_ref().map(|r| r.variables.clone()) 
            },
        }
    }
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
/// Group to test
pub struct ApicizeExecutionGroup {
    /// Request group ID
    pub id: String,
    /// Request group name
    pub name: String,
    /// Execution start (millisecond offset from start)
    pub executed_at: u128,
    /// Duration of execution (milliseconds)
    pub duration: u128,
    /// Number of child requests/groups with successful requests and all tests passed
    pub requests_with_passed_tests_count: usize,
    /// Number of child requests/groups with successful requests and some tests failed
    pub requests_with_failed_tests_count: usize,
    /// Number of child requests/groups with errors executing requests and/or tests
    pub requests_with_errors: usize,
    /// Number of passed tests, if request and tests are succesfully run
    pub passed_test_count: usize,
    /// Number of failed tests, if request and tests are succesfully run
    pub failed_test_count: usize,
    /// Requests or groups that are executed as children of the group
    pub items: Vec<ApicizeExecutionItem>,
}

#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
/// Request to test
pub struct ApicizeExecutionRequest {
    /// Request ID
    pub id: String,
    /// Request name
    pub name: String,
    /// Execution start (millisecond offset from start)
    pub executed_at: u128,
    /// Duration of execution (milliseconds)
    pub duration: u128,
    /// Request sent as HTTP call
    pub request: Option<ApicizeRequest>,
    /// Response received from HTTP call
    pub response: Option<ApicizeResponse>,
    /// Test results
    pub tests: Option<ExecutedTestResponse>,
    /// Set to true if HTTP call succeeded (regardless of status code)
    pub success: bool,
    /// Number of passed tests, if request and tests are succesfully run
    pub passed_test_count: Option<usize>,
    /// Number of failed tests, if request and tests are succesfully run
    pub failed_test_count: Option<usize>,
    /// Any error message generated during HTTP call or tests
    pub error_message: Option<String>,
}
