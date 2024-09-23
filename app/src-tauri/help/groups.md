# :toolbar :icon[request] Request Groups
In Apicize, a Request Group is a list of [Requests](help:requests) and/or child Groups that can be used to orchestrate sequence or load testing.  These can be executed in **Sequence**, in which case each Request or child Group will run one after the other, or **Concurrent**, where they will be launched simultaneously.  If any of your Requests and their tests rely upon a preceding result, you will want to run them in **Sequence**.  

Requests can optionally be *grouped*, which allows request tests to be run in sequence, and optionally pass values between them.  This can be useful, for example, when testing a sequence of API calls to create, retrieve, update and delete a record (i.e. CRUD).

### See Also

* [**Workbooks**](help:workbooks)
* [**Testing**](help:testing)
