# :toolbar Authoring Apicize Tests

Your tests have access to the following variables:

* **[request](#request)**:  Information about the submitted request
* **[response](#response)**:  Information about the received response
* **scenario**:  Variables that are defined in your workbook's active [scenario](help:scenarios)

Generally speaking, you should structure your tests to **describe** something and what **it** should do.  By default, Apicize will create this test for each new request:

```js
describe('status', () => {
    it('equals 200', () => {
        expect(response.status).to.equal(200)
    })
})
```

## Using Scenario Values

When setting up your workbook, you can optionally set up one or more Scenarios, which is simply a list of key/value pairs that can be used to update values in the [request's](#request) 
URL, headers, query string and/or body values.  Scenario values can be read *and updated* from test scripts.

The value from writing scenario values manifests when using grouped requests.  For example, assume you have a RESTful API with CRUD operations.  The first rquest in your group creates a record, 
and returns the new `id` in the response.  

Your test after the create could look like this:

```js
describe('status', () => {
    it('equals 200', () => {
        expect(response.status).to.equal(200)
        const data = JSON.parse(response.body.text)
        scenario.id = data.lastID
        console.log(`New record ID is ${scenario.id}`)
    })
})
```

Subsequent requests (and their tests) in the same group can now access the scenario value **id** to include in the URL, headers, query string and/or body, using
handlebars syntax (i.e. `{{id}}`).  You can chain calls together.  

Keep in mind that you can test for anything, including error responses. For example, if your group includes a request that deletes a record, the next request could ensure that
it is deleted by attempting to retrieve the deleted record and checking for a 404 status.

> For scenario values updated in tests to be passed between requests in a group, you must execute the tests from the **group**.  Requests within a group are executed sequentially.

## Test Information Payloads

### Request

* **name**: Name of the request
* **url**:  URL of request (with scenario values substituted, if applicable)
* **method**: HTTP method (GET, POST, etc.)
* **timeout**: Number of seconds to wait for response
* **headers**: Headers submitted with request (with scenario values substituted, if applicable)
* **query_string_params**: Query string parameters, organized as array of key-value pairs (with scenario values substituted, if applicable)
* **body**: Body submitted with request, this is an object containing data and/or text
* **test**: Test script used to validate request response
* **variables**: Variables set based upon Scenario or previous test(s)

### Response

* **status**: Status code of response (200 = OK, 404 = Not Found, etc.)
* **status_text**:  Textual description of status code
* **headers**:  Headers received from response
* **body**:  Body recevied with response, may be Text, JSON, XML, Form or Raw (Base64 string)
* **auth_token_cached**:  Set to true if authorization is selected, and token was retrieved from cached

## How Apicize Tests are Run

Apicize uses an embedded version of the [V8](https://v8.dev/) engine to execute your JavaScript tests.  It does *not* include NodeJS or any other JavaScript library functionality, 
except for the [Chai JS Assertion Library](https://www.chaijs.com/).  This approach is meant to mitigate security risks that could materialize if somebody were to send out a 
malicious Apicize test suite.

### See Also

* [**Running Tests**](help:running-tests)
* [**Requests**](help:requests)
* [**Workbooks**](help:workbooks)

