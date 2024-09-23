# :toolbar Parameter Storage in Apicize

[Requests](help:requests) and [Groups](help:groups) are always stored in Workbooks.  Parameters including
[Authorizations](help:authorizations), [Scenarios](help:scenarios), [Certificates](help:certificates) and [Proxies](help:proxies)
can be stored in Workbooks but also in Workbook private parameter files or Local Global storage.

Where you store Parameters depends upon how you want to use these values and who you want to share them with, if anybody.

## Types of Storage

### Workbook Files

Store parameters in Workbooks along with your Requests when you want to share those values with other developers.  When you distribute
your Workbook, the parameters will be included.  This is useful for demonstration or test values.  You should *not* store production 
credentials or sensitive information in Workbooks.  You should use one of the following two methods.

### Workbook Private Parameter Files

These files are stored along with Workbook files with the extension `.apicize-priv`.   These files can be used to store parameters
that you want to keep with your Workbooks but you do not want to share with others.

> You should exclude `*.apicize-priv` in your source control configuration (such as `.gitignore`) to ensure they do not end up in
shared code repositories.

### Local Global Storage

When storing parameters in Local Global Storage, they will be available for use by an Workbook loaded in Apicize.  This storage
is tied to the user logged into the operating system, and is located user's home directory under `.config/apicize`.  This is a useful
mechanism if you work in an enterprise and need to share credentials amongst multiple workbooks.

Workbooks include both IDs and Names of parameters configured for Requests and Groups.  If you open a Workbook copied from another system,
Apicize will look for matching names in Local Global Storage for any configured paraemters, and select them if they match.