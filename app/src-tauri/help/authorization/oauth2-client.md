# :toolbar :icon[authorization] Authorizations

## OAuth2 Client Flow Authentication

When authorizing using OAuth2 Client Flow, a call is made othe specified Access Token URL with the Client ID and Secret to receive a token.
Optionally, you can specify a Scope.  When associating a OAuth2 Client Authorization parameter, Apicize will automatically retrieve the token,
and reuse it until either it expires, or you click on "CLEAR ANY CACHED TOKEN" in the Authorization's configuration.

You can optionaly specify a [Certificate](help:certificates) and/or [Proxy](help:proxies) to use when retrieving a token. If you specify
these settings for the Authorization, they do not automatically apply to [Requests](help:requests) or [Request Groups](help:groups), you 
must configure those separately.

:image[authentication/oauth2-client.jpg]

### See Also

* [**Authorizations**](help:authorizations)
* [**Certificates**](help:certificates)
* [**Proxies**](help:proxies)

