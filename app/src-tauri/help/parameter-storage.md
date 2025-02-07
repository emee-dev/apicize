# Parameter Storage in Apicize :toolbar

[Requests](help:requests) and [Groups](help:groups) are always stored in Workbooks.  Parameters including
[Authorizations](help:authorizations), [Scenarios](help:scenarios), [Certificates](help:certificates) and [Proxies](help:proxies)
can be stored in Workbooks but also in Workbook private parameter files or the Local Vault.

Where you store Parameters depends upon how you want to use these values and who you want to share them with, if anybody.

## Types of Storage

### :icon[public] Workbook Files

Store parameters in Workbooks along with your Requests when you want to share those values with other developers.  When you distribute
your Workbook, the parameters will be included.  This is useful for demonstration or test values.  You should *not* store production 
credentials or sensitive information in Workbooks.  You should use one of the following two methods.

### :icon[private] Workbook Private Parameter Files

These files are stored along with Workbook files with the extension `.apicize-priv`.   These files can be used to store parameters
that you want to keep with your Workbooks but you do not want to share with others.

> Note: You should exclude `*.apicize-priv` in your source control configuration (such as `.gitignore`) to ensure they do not end up in
shared code repositories.

### :icon[vault] Local Vault Parameter Storage

Any parameters stored in the Local Vault will be available for use by any Apicize workbook loaded into a workspace.  This storage
is tied to the user logged into the operating system, and is located user's home directory under `.config/apicize`.  This is a useful
mechanism if you work in an enterprise and need to share credentials amongst multiple workbook.

Workbooks include both IDs and Names of parameters configured for Requests and Groups.  If you open a Workbook copied from another system,
Apicize will look for parameters with matching names in the Local Vault for any configured paraemters, and select them if they match.