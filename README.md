# Apicize

## Overview

Apicize is a testing platform that facilitates webservice testing both via GUI and CLI.  It utilizes Rust and V8 to execute the testing, and Tauri, React and Redux for the UI.

In reality, this effort is very much a *My First Tauri, React, Mobx and V8 project*.  It is a work-in-progress of somebody who bit off more than they could chew.  People who actually know these technologies will probably need to fight back nausea as they look at this project. There are anti-patterns and abuse of techniques that have been replaced by something better, but unknown by the author whose eyes no longer function properly after countless hours on Stack Overflow, Reddit, who has sometimes resorted to purchasing Rust and React hints from a guy selling them from the back of a van.

All that said, there may be something useful here to build upon.  I'm looking forward to working with folks to create something cool.

### Design Objectives

#### Testing as a *First-Class* Concept

You can create flexible BDD-style JavaScript tests that can optionally be grouped.  Checking for "200" status codes are only the beginning.  You can analyze resopnse data and update scenario variables used in the next test in a group.  This lets you easily do test stuff like CRUD functionality.

![Apicize Testing](./docs/screenshot-test.jpg)

#### Cross-Platform (Linux, Windows and Mac)

Apicize uses [Tauri](https://tauri.app/), [NextJS](https://nextjs.org/) and [React](https://react.dev/) to run on major desktop OSs.  Along with the user application, there is a CLI test runner, writtin in Rust, designed to run as part of CI/CD workflows.

![Apicize CLI](./docs/screenshot-terminal.jpg)

#### Simple Data Interoperability

The Apicize file format is simple JSON, making it straightforward to integrate with other systems.

### Contents

* [Getting Started](#getting-started)
* [Apicize Terminology](#apicize-terminology)
* [Testing in Apicize](#testing-in-apicize)
* [Project Organization](#project-organization)
* [License and Attributions](#license-and-attributions)
* [Technology Choices](#technology-choices)
* [To-Do List](./TODOs.md)

### Getting Started

To get this thing running, you'll need yarn and Rust (1.6 or greater)

On Linux, you will need to install the following dependencies to build:

* libssl-dev
* libglib2.0-dev 
* libpango1.0-dev
* libatk1.0-dev
* libgdk-pixbuf-2.0-dev
* libgtk-3-dev
* libjavascriptcoregtk-4.1-dev
* libwebkit2gtk-4.1-dev

From the project directory, run `yarn` which will pull in all of the NodeJS dependencies.  Then run `yarn start` which will build and launch the Tauri app.

If you want to run the CLI, navigate to the `@apicize/@cli` directory and execute `cargo build` and then `cargo run (workbookFileName)`

The default workbook contains some tests that depend on a local service running (prefixed with "[Dev]" ).  You can run `docker compose up` from the `sample-api` directory to activate the demonostration web services.

## Apicize Terminology

The following are terms used in Apicize

* *Request*:  Information required to make a webservice call *and* evaluate its succesful completion.  Success may be defined as a 200 status, it may involve evaluating the response body, or it may be a negative test (i.e. you expect to get a 404 Not Found)
* *Authorization*:  Webservices often enforce authorization of the caller.  Currently supported authorizations include Basic Authentication, API Key Authentication, and OAuth2 Client Authentication
* *Scenarios*:  A list of variables that can be substituted in a Request.  For example, you may have a set of calls that you want to test against different products.  Rather than having to create a copy of those requests, you can just execute the same tests against different scenarios.
* *Workbook*:  Contains a set of Requests, Authorizations and Scenarios
* *Test*: A block of JavaScript that either runs to completion (success) or throws an error (failure)

## Testing in Apicize

Tests in Apicize are designed to indicate a request call is successful.  By default, this test is created for you when defining a new request:

```js
describe('status', () => {
  it('equals 200', () => {
    expect(response.status).to.equal(200)
  })
})
```

This test simply indicates that you received a 200 response.  You can test for much more though...

The `expect` assertion is imported from the [Chai](https://www.chaijs.com/) library.

You will have access to the `request`, `response` and `scenario` used when executing a test.

**request** properties include:

* `url` (including query string parameters)
* `method`
* `headers`
* `body`

**response** properties include:

* `status`
* `status_text`
* `headers`
* `body`
* `auth_token_cached` (set to true if previously generated OAuth token was used)

The body properties mentioned above have two properties:  `data` which is a Base64 representation of data and `text` which, if the Base64 data could be converted to UTF8, 
will contain textual content

The **scenario** property is a name/value set of scenario variables passed into the test. If you are testing a group, you can update values in **scenario** and they will
be available for the next test.  For example, if you have a group of tests that create, update and delete a record using a REST API, you can store the ID in a scenario 
variable called `id` and use it in subsequent calls *in that group*.  Example:

```js
describe('status', () => {
  it('equals 200', () => {
    expect(response.status).to.equal(200)
    // Assuming id is a property returned in the response...
    scenario.id = JSON.parse(response.body.text).id
  })
})

```

## Project Organization

These are the components in this monorepo that comprise Apicize:

* [**app**](./@apicize/app/README.md): Tauri user application to interactively edit and execute tests
* [**@apicize/cli**](./@apicize/cli/README.md): Rust CLI application to execute tests
* [**@apicize/lib-rust**](./@apicize/lib-rust/README.md): Rust crate for executing tests
* [**@apicize/lib-typescript**](./@apicize/lib-typescript/README.md): TypeScript definitions for Apicize test workbook data structures
* [**@apicize/toolkit**](./@apicize/toolkit/README.md):  React/redux UI component toolkit for view and editing Apicize workbooks

Ideally, you could reuse these components to build things like a Visual Studio Code extension, a hosted solution to execute Apicize tests, etc. 

There are no unit or integration tests yet.  This is primarly because this project has been built and rebuilt at least thfourree times (a couple of times in Electron, then Tauri v1 and most recently, Tauri v2 beta).  You can read more about this trail-of-tears [here](#technology-choices).

As things begin to stabilize, I'll build unit and integraiton testing.  Currently, the project is a monorepo but with decent integration testing, there is no reason why each of these components can't be its own repo, triggering upstream builds upon update, etc.  Assuming this project gets that far...

## Development

### Requirements

You'll need Rust (1.6 or greater).  For editing, I've been using Visual Studio Code with the rust-analyzer and CodeLLDB extensions for debugging.

The project uses [yarn](https://yarnpkg.com/migration/overview).  Yarn's workspace functionality works better for me than NPMs.

### Building and Debugging

From the project's main directory, run `yarn ui` to build and run the app using development configuration.  Run `yarn ui:watch` do the same thing, but with
rebuild if the either the **lib-typescript** or **toolkit** are updated.  When using watch mode, you'll have to Ctrl-C in the terminal window to completely 
shut things down.

VSCode debugging launch configurations are included.  For some reason, two copies of the app will be launched, have not been able to figure out why yet...

### Running the GUI

To launch the GUI, run 

## License and Attributions

Apicize's applications, libraries and components are licensed under the [MIT](./LICENSE.md) license.  

Apicize would not be possible without the excellent work of the following projects:

* [Tauri](https://tauri.app/)
* [Rust](https://www.rust-lang.org/)
* [React](https://react.dev/)
* [Mobx](https://mobx.js.org/)
* [V8](https://v8.dev/)
* Tons of other libraries, crates, etc. that hold it all together

Thanks to everybody.  It's amazing that all of this technology is available to freeloaders like me.
