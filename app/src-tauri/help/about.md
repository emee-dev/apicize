# :toolbar-left

:logo
Apicize is yet another application to test HTTP calls.

## What differentiates Apicize?

### "All Local" Application

This application runs on your computer and the only external connection it makes are to the APIs you configure in your tests.  It does not store
information anywhere other than your drive.  It does not bombard you with marketing requests to upsell you on collaboration features,
cloud storage, etc.

### Test-Driven

Whenever you set up a Request, you get a default [test](help:requests/test) created which checks for an HTTP status 200.  Obviously,
meaningful tests may require more than this.  You may want to inspect the response and confirm data.  You may want to test for known
error conditions.  Apicize accomodates [BDD style testing](https://en.wikipedia.org/wiki/Behavior-driven_development) using the 
[Chai](https://www.chaijs.com/) library.  Apicize supports running Groups of Requests either in Sequence or in Parallel.  This lets
you test chains of dependent requests, or to perform load testing by making concurrent calls.

### Secure

When you execute tests in Apicize, the test code is executed in a [JavaScript V8 engine](https://v8.dev/) that is isolated
from your application and your system.  It does *not* include a NodeJS, Deno, Web Browser or any other supporting runtime, 
which means that your tests cannot access your file system or other resources.

Apicize runs on the [Tauri platform](https://tauri.app/) constructed with Rust.  This mitigates a lot of risk associated with
buffer overruns and other security vulnerabilities.

### CI/CD Friendly

A command-line test runner for Apicize workbooks, with minimal dependencies, is available which can be run in a CI/CD environment.

# Contents

* [**Requests**](help:requests)
    * [**Groups**](help:groups)
    * [**Information**](help:requests/info)
    * [**Headers**](help:requests/headers)
    * [**Query String Parameters**](help:requests/query)
    * [**Tests**](help:requests/test)
    * [**Parameters**](help:requests/parameters)
* [**Scenarios**](help:scenarios)
* [**Authorizations**](help:authorizations)
* [**Certificates**](help:certificates)
* [**Proxies**](help:proxies)
* [**Defaults**](help:settings/parameters)
    * [**Display Settings**](help:settings/display)
* [**Testing**](help:testing)
* [**Running Tests**](help:running-tests)