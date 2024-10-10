# :toolbar :icon[request] Requests

## Body Pane :icon[body]

When perfomring a POST or PUT, you can optionally include body payload of text (incl. JSON or XML), form data or "raw" (byte array) data.  Multipart form is not yet supported.
You will have th eoption of updating the Content-Type header based upon the body conten type.

When editing text data, selecting JSON or XML as the type will provide syntax highlighting.  Other than that, there is no difference in selecting thexe.

:image[requests/body-text.webp]

When specifying "Raw" data, you can either open a data file or paste an image from the clipboard.  Clipboard images must be stored to the clipboard in .png format.  File drop is not yet supported.  

:image[requests/body-data.webp]

### See Also

* [**Requests**](help:requests)
* [**Workbooks**](help:workbooks)
