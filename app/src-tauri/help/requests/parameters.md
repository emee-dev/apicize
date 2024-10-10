# :toolbar :icon[request] Requests

## Parameters Pane :icon[parameters]

This is pane to set parameters when testing your Request or Group.  These can include:

* [**Scenario**](help:scenarios): Name/value pairs injected in place of `{{handlebars}}` text
* [**Authorization**](help:authorizations): Authorization sent with request
* [**Certificate**](help:certificates):  Client certificate sent with request
* [**Proxy**](help:proxies):  Proxy used to send request

These values are set hierchically, and default to the level above them, all the way "up" to the workbook's [defaults](help:defaults-and-settings).
If you set any of these to a value, that value will be used regardless of any parent values set.  If you set any of these to "Off", then
no value will be used for that parameter, regardless of parent values.

:image[requests/parameters.webp]

### See Also

* [**Running Tests**](help:running-tests)
* [**Requests**](help:requests)
* [**Workbooks**](help:workbooks)
