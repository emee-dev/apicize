//! Apicize models submodule
//! 
//! This submodule defines models used to execute Apicize tests

use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_json::Value;
use serde_with::base64::{Base64, Standard};
use serde_with::formats::Unpadded;
use serde_with::serde_as;

use crate::workbook::WorkbookCertificate;

// use crate::WorkbookScenario;

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
    /// Certificate / key used to establish identity
    #[serde(skip_serializing_if = "Option::is_none")]
    pub certificate: Option<WorkbookCertificate>,
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

/// Response when executing an Apicize test
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeTestResponse {
    /// Results of test
    pub results: Option<Vec<ApicizeTestResult>>,
    /// Scenario values (if any)
    pub variables: HashMap<String, Value>,
}

/// Information about an executed Apicize test
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
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

/// Apicize run result
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeResult {
    /// Request ID
    pub request_id: String,
    /// Attempt run number (zero indexed)
    pub run: u32,
    /// Total number of run attempts
    pub total_runs: u32,
    /// Request sent as HTTP call
    pub request: Option<ApicizeRequest>,
    /// Response received from HTTP call
    pub response: Option<ApicizeResponse>,
    /// Test results
    pub tests: Option<Vec<ApicizeTestResult>>,
    /// Time-of-day of execution
    pub executed_at: u128,
    /// Duration of execution
    pub milliseconds: u128,
    /// Set to true if HTTP call succeeded (regardless of status code)
    pub success: bool,
    /// Number of executed tests
    pub test_count: Option<usize>,
    /// Number of failed tests
    pub failed_test_count: Option<usize>,
    /// Any error message generated during HTTP call
    pub error_message: Option<String>,
}

/// List of Apicize Result runs
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ApicizeExecutionResults {
    /// All test runs
    pub runs: Vec<Vec<ApicizeResult>>,
    /// Duration of all tests in milliseconds
    pub milliseconds: u128,
}
