# :icon[apicize] Workspace :toolbar

## Overview

The Apicize Workspace consists of :

### :icon[request] [Requests](help:workspace/requests) and [Groups](workspace/groups)

Information about HTTP calls to send and how to test them

### :icon[scenario] [Scenarios](help:workspace/scenarios)]

Key-value pairs that can be substituted for Request URLs, headers, body content, etc. using `{{handlebars}}` placeholders for Keys

### :icon[authorization] [Authorizations](help:workspace/authorizations)

Information required to enable authorization based upon API keys, Basic Authentication, OAuth2 Client and OAuth2 PKCE flows

### :icon[certificate] [Certificates](help:workspace/certificates)

Client SSL certificates used for authentication

### :icon[proxy] [Proxies](help:workspace/proxies)

SOCKS5 or HTTP proxies used to connect to HTTP resources

### :icon[defaults] [Defaults](help:workspace/defaults)

Default Parameter values to use when testing Requests (which can be overriden on individual Requests or Groups)

## Storage

Organize your Parameters based upon whether you want to make them to other developers, and if want to reuse Parameters with multiple workbooks.

A Workspace is constructed from the following sources:

### :icon[public] Workbook (Public)

A list of Requests for testing and Parameters that can be shared via a Source Code Repository, email, etc.

### :icon[private] Workbook Vault (Private)

Parameters that are specific to a Workbook but not meant to be shared (optional)

### :icon[vault] Global Vault (Private, Global)

A local store of Parameters that are available to all opened Workspaces
