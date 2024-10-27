# :toolbar :icon[request] Request Groups

In Apicize, a Request Group is a list of [Requests](help:requests) and/or child Groups. Request Groups do more than organize requests, they can be used to orchestrate tests with dependencies and/or load testing.  

When executing **Sequential** requests, each Request or child Group will run one after the other.  If any of your Requests and their tests rely upon a preceding result, you will want to run them sequentially.  This can be useful, for example, when testing a sequence of API calls to create, retrieve, update and delete a record (i.e. CRUD). More information about running tests with dependencies can be found in the [testing](help:testing) topic.

When executing **Concurrent** requests, each Request or child Group will by launched concurrently.  This can be used to load test an API.

## Managing Execution

Set the **Request Execution Mode** value to either **Sequential** or **Concurrent** to control how requests are executed *within a run*.

Set the **Multiple Run Execution Mode** value to either **Sequential** or **Concurrent** to control how multiple runs of a group are executed.  Within each run,
requests will be executed based upon the **Request Execution Mode** value

For example, assume you have a Group with two requests ("Request A" and "Request B"), and that you will launch 2 runs.  Here are how Execution Mode values control execution:

| Request Execution | Multiple Run Execution | Execuution Order |
|-|-|-|
| Sequential | Sequential | Request A *then* Request B,<br>*then*  Request A *then* Request B |
| Concurrent | Sequential | Request A *and* Request B,<br>*then* Request A *and* Request B | |
| Sequential | Concurrent | Request A *then* Request B,<br>*and* Request A *then* Request B | |
| Concurrent | Sequential | Request A *and* Request B,<br> *thenand* Request A *and* Request B|

In the configuration shown below, requests within the group will execute sequeuntially, but multiple runs will be run concurrently.  This will allow the ID generated when "Create quote" is called to be passed to the remaining requests, and to make sure that create, read, update and delete operations happen in the correct order.

:image[requests/groups.webp]

### See Also

* [**Workbooks**](help:workbooks)
* [**Testing**](help:testing)
