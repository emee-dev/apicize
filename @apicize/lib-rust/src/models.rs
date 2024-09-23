//! Apicize models
//! 
//! This module defines models used to store and execute Apicize workbook requests
use oauth2::basic::BasicErrorResponseType;
use oauth2::{RequestTokenError, StandardErrorResponse};
use tokio::task::JoinError;
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