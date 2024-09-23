//! Workbook models submodule
//! 
//! This submodule defines modules used to store Workbooks

use super::utility::*;
use serde::{Deserialize, Serialize};
use serde_with::serde_as;
use serde_with::base64::{Base64, Standard};
use serde_with::formats::Unpadded;
use serde_json::Value;

/// Enumeration of HTTP methods
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "UPPERCASE")]
pub enum WorkbookRequestMethod {
    /// HTTP GET
    Get,
    /// HTTP POST
    Post,
    /// HTTP PUT
    Put,
    /// HTTP DELETE
    Delete,
    /// HTTP PATCH
    Patch,
    /// HTTP HEAD
    Head,
    /// HTTP OPTIONS
    Options,
}

/// String name/value pairs used to store values like Apicize headers, query string parameters, etc.
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct WorkbookNameValuePair {
    /// Name of value
    pub name: String,
    /// Value
    pub value: String,
    /// If set to true, name/value pair should be ignored when dispatching Apicize Requests
    #[serde(skip_serializing_if = "Option::is_none")]
    pub disabled: Option<bool>,
}


/// Apicize Request body
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(tag = "type")]
pub enum WorkbookRequestBody {
    /// Text (UTF-8) body data
    Text {
        /// Text
        data: String,
    },
    /// JSON body data
    #[serde(rename = "JSON")]
    JSON {
        /// Text
        data: Value,
    },
    /// XML body data
    #[serde(rename = "XML")]
    XML {
        /// Text
        data: String,
    },
    /// Form (not multipart) body data
    Form {
        /// Name/value pairs of form data
        data: Vec<WorkbookNameValuePair>,
    },
    /// Binary body data serialized as Base64
    Raw {
        /// Base-64 encoded binary data
        #[serde_as(as = "Base64<Standard, Unpadded>")]
        data: Vec<u8>,
    }
}

/// Specifies persistence options for non-request entities
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone, Copy)]
#[serde(rename_all = "UPPERCASE")]
pub enum Persistence {
    /// Shared configuration file
    Global,
    /// Workbook private information file
    Private,
    /// Workbook file
    Workbook,
}

/// Information about a selected entity, include both ID and name
/// to give the maximum chance of finding a match
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Selection {
    /// ID of selected entity
    pub id: String,
    /// Name of selected entity
    pub name: String,
}

/// Indicator on workbook child execution order
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "UPPERCASE")]
pub enum WorkbookExecution {
    /// Group children execute sequentially
    Sequential,
    /// Group children execute concurrently
    Concurrent
}

/// Information required to dispatch and test an Apicize Request
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkbookRequest {
    /// Unique identifier (required to keep track of dispatches and test executions)
    #[serde(default = "generate_uuid")]
    pub id: String,
    /// Human-readable name describing the Apicize Request
    pub name: String,
    /// Test to execute after dispatching request and receiving response
    #[serde(skip_serializing_if = "Option::is_none")]
    pub test: Option<String>,
    /// URL to dispatch the HTTP request to
    pub url: String,
    /// HTTP method
    #[serde(skip_serializing_if = "Option::is_none")]
    pub method: Option<WorkbookRequestMethod>,
    /// Timeout, in seconds, to wait for a response
    #[serde(skip_serializing_if = "Option::is_none")]
    pub timeout: Option<u32>,
    /// HTTP headers
    #[serde(skip_serializing_if = "Option::is_none")]
    pub headers: Option<Vec<WorkbookNameValuePair>>,
    /// HTTP query string parameters
    #[serde(skip_serializing_if = "Option::is_none")]
    pub query_string_params: Option<Vec<WorkbookNameValuePair>>,
    /// HTTP body
    #[serde(skip_serializing_if = "Option::is_none")]
    pub body: Option<WorkbookRequestBody>,
    /// Keep HTTP connection alive
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keep_alive: Option<bool>,
    /// Number of runs for the group to execute
    #[serde(default = "one")]
    pub runs: u32,
    /// Selected scenario, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_scenario: Option<Selection>,
    /// Selected authorization, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_authorization: Option<Selection>,
    /// Selected certificate, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_certificate: Option<Selection>,
    /// Selected proxy, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_proxy: Option<Selection>,
    /// Populated with any warnings regarding how the request is set up
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warnings: Option<Vec<String>>,
}


/// A group of Apicize Requests
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkbookRequestGroup {
    /// Uniquely identifies group of Apicize requests
    #[serde(default = "generate_uuid")]
    pub id: String,
    /// Human-readable name of group
    pub name: String,
    /// Child items
    pub children: Option<Vec<WorkbookRequestEntry>>,
    /// Number of runs for the group to execute
    #[serde(default = "one")]
    pub runs: u32,
    /// Execution of children
    #[serde(default = "sequential")]
    pub execution: WorkbookExecution,
    /// Selected scenario, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_scenario: Option<Selection>,
    /// Selected authorization, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_authorization: Option<Selection>,
    /// Selected certificate, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_certificate: Option<Selection>,
    /// Selected proxy, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_proxy: Option<Selection>,
    /// Populated with any warnings regarding how the group is set up
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warnings: Option<Vec<String>>,
}

/// Apcize Request that is either a specific request to run (Info)
/// or a group of requests (Group)
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(untagged)]
pub enum WorkbookRequestEntry {
    /// Request to run
    Info(WorkbookRequest),
    /// Group of Apicize Requests
    Group(WorkbookRequestGroup),
}

/// A set of variables that can be injected into templated values
/// when submitting an Apicize Request
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct WorkbookScenario {
    /// Uniquely identifies scenario
    #[serde(default = "generate_uuid")]
    pub id: String,
    /// Name of variable to substitute (avoid using curly braces)
    pub name: String,
    /// Specifies how authorization will be saved
    #[serde(skip_serializing_if = "Option::is_none")]
    pub persistence: Option<Persistence>,
    /// Value of variable to substitute
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variables: Option<Vec<WorkbookNameValuePair>>,
}

/// Authorization information used when dispatching an Apicize Request
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(tag = "type")]
pub enum WorkbookAuthorization {
    /// Basic authentication (basic authorization header)
    #[serde(rename_all = "camelCase")]
    Basic {
        /// Uniquely identifies authorization configuration
        #[serde(default = "generate_uuid")]
        id: String,
        /// Human-readable name of authorization configuration
        name: String,
        /// Specifies how authorization will be saved
        #[serde(skip_serializing_if = "Option::is_none")]
        persistence: Option<Persistence>,
        /// User name
        username: String,
        /// Password
        password: String,
    },
    /// OAuth2 client flow (bearer authorization header)
    #[serde(rename_all = "camelCase")]
    OAuth2Client {
        /// Uniquely identifies authorization configuration
        #[serde(default = "generate_uuid")]
        id: String,
        /// Indicates if/how authorization will be persisted
        /// Human-readable name of authorization configuration
        name: String,
        /// Specifies how authorization will be saved
        #[serde(skip_serializing_if = "Option::is_none")]
        persistence: Option<Persistence>,
        /// URL to retrieve access token from
        access_token_url: String,
        /// Client ID
        client_id: String,
        /// Client secret (allowed to be blank)
        client_secret: String,
        #[serde(skip_serializing_if = "Option::is_none")]
        /// Scope to add to token (multiple scopes should be space-delimited)
        scope: Option<String>,
        /// Selected certificate, if applicable
        #[serde(skip_serializing_if = "Option::is_none")]
        selected_certificate: Option<Selection>,
        /// Selected proxy, if applicable
        #[serde(skip_serializing_if = "Option::is_none")]
        selected_proxy: Option<Selection>,
        // #[serde(skip_serializing_if="Option::is_none")]
        // send_credentials_in_body: Option<bool>,
    },
    /// API key authentication (sent in HTTP header)
    #[serde(rename_all = "camelCase")]
    ApiKey {
        /// Uniquely identifies authorization configuration
        #[serde(default = "generate_uuid")]
        id: String,
        /// Indicates if/how authorization will be persisted
        /// Human-readable name of authorization configuration
        name: String,
        /// Specifies how authorization will be saved
        #[serde(skip_serializing_if = "Option::is_none")]
        persistence: Option<Persistence>,
        /// Name of header (ex. "x-api-key")
        header: String,
        /// Value of key to include as header value
        value: String,
        /// Selected certificate, if applicable
        #[serde(skip_serializing_if = "Option::is_none")]
        selected_certificate: Option<Selection>,
    },
}

/// Client certificate used to identify caller
#[serde_as]
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
#[serde(tag = "type")]
pub enum WorkbookCertificate {
    /// PKCS 12 certificate and and password (.p12 or .pfx)
    #[serde(rename = "PKCS12")]
    PKCS12 {
        /// Uniquely identifies certificate
        #[serde(default = "generate_uuid")]
        id: String,
        /// Human-readable name of certificate
        name: String,
        /// Specifies how cetificate will be saved
        #[serde(skip_serializing_if = "Option::is_none")]
        persistence: Option<Persistence>,
        /// Certificate
        #[serde_as(as = "Base64<Standard, Unpadded>")]
        pfx: Vec<u8>,
        /// Password
        #[serde(skip_serializing_if = "Option::is_none")]
        password: Option<String>,
    },
    /// PEM-encoded certificate and PKCS8 encoded private key files
    #[serde(rename = "PKCS8_PEM")]
    PKCS8PEM {
        /// Uniquely identifies certificate
        #[serde(default = "generate_uuid")]
        id: String,
        /// Human-readable name of certificate
        name: String,
        /// Specifies how cetificate will be saved
        #[serde(skip_serializing_if = "Option::is_none")]
        persistence: Option<Persistence>,
        /// Certificate information
        #[serde_as(as = "Base64<Standard, Unpadded>")]
        pem: Vec<u8>,
        /// Optional key file, if not combining in PKCS8 format
        #[serde_as(as = "Base64<Standard, Unpadded>")]
        key: Vec<u8>,
    },    
    /// PEM encoded certificate and key file
    #[serde(rename = "PEM")]
    PEM {
        /// Uniquely identifies certificate
        #[serde(default = "generate_uuid")]
        id: String,
        /// Human-readable name of certificate
        name: String,
        /// Specifies how cetificate will be saved
        #[serde(skip_serializing_if = "Option::is_none")]
        persistence: Option<Persistence>,
        /// Certificate information
        #[serde_as(as = "Base64<Standard, Unpadded>")]
        pem: Vec<u8>,
    },        
}

/// An HTTP or SOCKS5 proxy that can be used to tunnel requests
#[derive(Serialize, Deserialize, PartialEq, Debug, Clone)]
pub struct WorkbookProxy {
    /// Uniquely identify proxy
    #[serde(default = "generate_uuid")]
    pub id: String,
    /// Name of proxy
    pub name: String,
    /// Specifies how proxy will be saved
    #[serde(skip_serializing_if = "Option::is_none")]
    pub persistence: Option<Persistence>,
    /// Location of proxy (URL for HTTP proxy, IP for SOCKS)
    pub url: String,
}

/// Persisted Apcizize requests and scenario definitions
#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct Workbook {
    /// Version of workbook format (should not be changed manually)
    pub version: f32,
    /// List of requests/request groups
    pub requests: Vec<WorkbookRequestEntry>,
    /// List of scenarios
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scenarios: Option<Vec<WorkbookScenario>>,
    /// Workbook Authorizations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub authorizations: Option<Vec<WorkbookAuthorization>>,
    /// Workbook certificates
    #[serde(skip_serializing_if = "Option::is_none")]
    pub certificates: Option<Vec<WorkbookCertificate>>,
    /// Workbook proxy servers
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proxies: Option<Vec<WorkbookProxy>>,
    /// Selected scenario, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_scenario: Option<Selection>,
    /// Selected authorization, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_authorization: Option<Selection>,
    /// Selected certificate, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_certificate: Option<Selection>,
    /// Selected proxy, if applicable
    #[serde(skip_serializing_if = "Option::is_none")]
    pub selected_proxy: Option<Selection>,
}

/// Persisted Apicize authorization, client certificate and other parameter
#[derive(Serialize, Deserialize, PartialEq, Debug)]
pub struct Parameters {
    /// Version of workbook format (should not be changed manually)
    pub version: f32,

    /// Workbook credential authorizations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub authorizations: Option<Vec<WorkbookAuthorization>>,

    /// Workbook credential scenarios
    #[serde(skip_serializing_if = "Option::is_none")]
    pub scenarios: Option<Vec<WorkbookScenario>>,

    /// Workbook credential certificates
    #[serde(skip_serializing_if = "Option::is_none")]
    pub certificates: Option<Vec<WorkbookCertificate>>,

    /// Workbook credential proxy servers
    #[serde(skip_serializing_if = "Option::is_none")]
    pub proxies: Option<Vec<WorkbookProxy>>,
}
