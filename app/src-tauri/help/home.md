# :toolbar 

:logo 
Apicize is yet another application to test HTTP calls.  The UI consists of two parts.  On the left, the Navigation Pane is how you manage the information
you will use to perform your testing.  On the right will be where you edit information or view results and help information.

In Apicize, information is divided into [Requests](help:requests), [Request Groups](help:groups) and Parameters 
(i.e. "everything else" used to facilitate testing those requests). Parameters include:

* [**Scenarios**](help:scenarios): Optional variable information that can be injected into a Request during testing
* [**Authorizations**](help:authorizations):  Optional authorization information used to authenticate to an API
* [**Certificates**](help:certificates):  Optional client certificates used for authentication
* [**Proxies**](help:proxies): Optional proxies to use when making API calls

## What differentiates Apicize?

### "All Local" Application

This application runs on your computer and the only external connection it makes are to the APIs you configure in your tests.  It does not store
information anywhere other than your drive.  It does not bombard you with marketing requests to upsell you on collaboration features,
cloud storage, etc.

### Test-Driven

Whenever you set up a Request, you get a default [test](help:requests/test) created which checks for an HTTP status 200.  Obviously,
meaningful tests may require more than this.  You may want to inspect the response and confirm data.  You may wanto test to ensure for known
error conditions.  Apicize accomodates [BDD style testing](https://en.wikipedia.org/wiki/Behavior-driven_development) using the 
[Chai](https://www.chaijs.com/) library.  Apicize supports running Groups of Requests either in Sequence or in Parallel.  This lets
you test chains of dependent requests, or to load test with concurrent calls.

### Secure

When you execute tests in Apicize, the test code is executed in a [JavaScript V8 engine](https://v8.dev/) that is isolated
from your application and your system.  It does *not* include NodeJS, Deno, Web Browser or any other supporting runtime, 
which means that your tests cannot access your file system or other resources.

Apicize runs on the [Tauri platform](https://tauri.app/) constructed with Rust.  This also mitigates a lot of risk associated with
buffer overruns and other security vulnerabilities.

### CI/CD Friendly

A command-line test runner for Apicize workbooks, with minimal dependencies, is available which can be run in a CI/CD environment.

# Contents

* [**Requests**](help:requests)
* [**Request Groups**](help:groups)
* [**Scenarios**](help:scenarios)
* [**Authorizations**](help:authorizations)
* [**Certificates**](help:certificates)
* [**Proxies**](help:proxies)

