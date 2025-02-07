# Running Tests :toolbar

To run a test, select the [Request](help:requests) or [Group](help:groups) you want to test, and then, in the Test panel (under the Request pane), and then click on the Test button (with the round "play" icon).  
Apicize will dispatch your request, execute test scripts (if any) and display the results.  After a request is processed, the test flask icon will be colored:

* Green:  A response was received for request(s) and all tests pass
* Yellow:  A response was received for request(s) but one or more tests failed
* Red:  A response was not received

## Group Results

If you are testing from a group, the Test panel will include up to two drop downs after the group's requests and tests are run.  If your group specified a multiple number of runs, you can specify which 
run sequence to view.  By default, a summary of all request and test results in the group will is displayed.  You can see the details of a specific request and its test by selecting the test from the 
**Results** dropdown.

:image[requests/summary-results.webp]

## Request Results

Each request includes the following information panels:

* **Headers**: displays the headers returned with the response
* **Raw**:  Displays the response body (if any) as text if the content type does not appear to be binary.  If the content type does appear to be binary, then the body's 
content encoded as Base64 will be displayed
* **Preview**:  For recognized content types, textual will be displayed "pretty-fied" and images will be displayed as images
* **Request**:  Information about how the request was dispatched, including any values substituted based upon the selected scenario

:image[requests/request-results.webp]

:image[requests/request-results-preview.webp]

### See Also

* [**Testing**](help:testing)
* [**Requests**](help:requests)
* [**Workbooks**](help:workbooks)