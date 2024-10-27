//! Apicize models submodule
//!
//! This submodule defines models used to execute Apicize tests

use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use serde_with::base64::{Base64, Standard};
use serde_with::formats::Unpadded;
use serde_with::serde_as;

/// Trait to expose functionality for retrieving totals and variables
pub trait ExecutionTotalsSource {
    /// Retrieve totals
    fn get_totals(&self) -> ApicizeExecutionTotals;

    /// Retrieve variables
    fn get_variables(&self) -> &Option<HashMap<String, Value>>;
}

/// Trait to expose functionality for incrementing totals
pub trait ExecutionTotals {
    /// Add totals
    fn add_totals(&mut self, other: &dyn ExecutionTotalsSource);
}

/// Information used to dispatch an Apicize request
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Clone)]
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

/// Body information used when dispatching an Apicize Request
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeBody {
    /// Body as data (UTF-8 bytes)
    #[serde_as(as = "Option<Base64<Standard, Unpadded>>")]
    pub data: Option<Vec<u8>>,
    /// Reprsents body as text
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
}

#[derive(Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
/// An appicize execution
pub struct ApicizeExecution {
    /// Duration of execution (milliseconds)
    pub duration: u128,
    /// Requests or groups that are executed
    pub items: Vec<ApicizeExecutionItem>,
    /// True if all requests and tests are successful
    pub success: bool,
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
}

#[derive(Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase", tag = "type")]
/// Request or group that was executed
pub enum ApicizeExecutionItem {
    /// Request group that is executed
    Group(Box<ApicizeExecutionGroup>),
    /// Request that is executed
    Request(Box<ApicizeExecutionRequest>),
}

#[derive(Serialize, Deserialize, PartialEq, Clone)]
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
    /// Executed request and test executions
    pub runs: Vec<ApicizeExecutionRequestRun>,
    /// Variables to update at the end of the request
    pub variables: Option<HashMap<String, Value>>,
    /// Success is true if all runs are successful
    pub success: bool,
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
}

#[derive(Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
/// Information about an application execution run
pub struct ApicizeExecutionRequestRun {
    /// Run number (index)
    pub run_number: usize,
    /// Execution start (millisecond offset from start)
    pub executed_at: u128,
    /// Duration of execution (milliseconds)
    pub duration: u128,
    /// Request sent as HTTP call
    pub request: Option<ApicizeRequest>,
    /// Response received during exexecuted run
    pub response: Option<ApicizeHttpResponse>,
    /// Set to true if HTTP call succeeded (regardless of status code)
    pub success: bool,
    /// Set if there was an error in execution
    pub error: Option<String>,
    /// Tests executed during run
    pub tests: Option<Vec<ApicizeTestResult>>,
    /// If set, active variables should be updated to this value after execution
    pub variables: Option<HashMap<String, Value>>,
    // True if run is successful
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
}

/// Information about the response to a dispatched Apicize request
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeHttpResponse {
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
#[derive(Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeTestResponse {
    /// Results of test
    pub results: Option<Vec<ApicizeTestResult>>,
    /// Scenario values (if any)
    pub variables: HashMap<String, Value>,
}

/// Information about an executed Apicize test
#[derive(Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeTestResult {
    /// Human readable name of the test
    pub test_name: Vec<String>,
    /// Whether or not the test was successful
    pub success: bool,
    /// Error generated during the test
    pub error: Option<String>,
    /// Console I/O generated during the test
    pub logs: Option<Vec<String>>,
}

#[derive(Serialize, Deserialize, PartialEq, Clone)]
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
    /// Child requests/groups
    pub runs: Vec<ApicizeExecutionGroupRun>,
    /// True if all requests and tests in group passed for all runs
    pub success: bool,
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
}

#[derive(Serialize, Deserialize, PartialEq, Clone)]
#[serde(rename_all = "camelCase")]
/// Group to test
pub struct ApicizeExecutionGroupRun {
    /// Run number (index)
    pub run_number: usize,
    /// Execution start (millisecond offset from start)
    pub executed_at: u128,
    /// Duration of execution (milliseconds)
    pub duration: u128,
    /// Child requests/groups
    pub items: Vec<ApicizeExecutionItem>,
    /// Variables to update at the end of the group
    pub variables: Option<HashMap<String, Value>>,
    /// Success if requests in run are successful
    pub success: bool,
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
}

/// Tallies of execution results
pub struct ApicizeExecutionTotals {
    /// True if tests pass and (when applicable) child tests pass
    pub success: bool,
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
}
