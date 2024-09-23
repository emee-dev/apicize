# :toolbar :icon[scenario] Scenarios

A Scenario is a set of variables that are available for when testing [requests](help:requests).  These can be set for any request](help:requests) or group.  If they are set for a Group, they will apply to any Requests or child Groups.  At the simplest level, you can use this capability to inject different values into the same request(s), without having to modify them.

Scenario variables can be used to dynamically set URLs and posted body content.  Assume you have a Scenario variables called `author` and `quote`.  You can inject those into a 
[requests's body](help:requests/body) by using handlebar syntax:

```json
{"author":"{{author}}","quote":"{{quote}}"}
```

You can also update or create new variables within your [requests' tests](help:requests/test).  For example, assume that a web request to create a record returns a JSON payload with a property
called `id`.  You can create a new variable called `id` as follows:

```js
describe('status', () => {
    it('equals 200', () => {
        expect(response.status).to.equal(200)
        const data = JSON.parse(response.body.text)
        variables.id = data.id
        console.log(`New record ID is ${variables.id}`)
    })
})
```

In this test, we make sure we had success, and then parse the body text to get `id`, and then assign that to a new variable called `id`.  Subsequent requests in the group will have access to
`id`.  For exmaple, we can set a subsequent request's URL to use that variable like this:

```
http://localhost:8080/quote/{{id}}
```

Scenario variables are maintained and saved as name/string value pairs, but in scripts, they can be updated to any value that can be serialized as JSON.  

:image[scenarios.jpg]