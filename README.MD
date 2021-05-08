## Http Cache Playground
- setup a BE application with proxy server to help study the caching behaviour in each of the layers
- setup a nginx as proxy cache server to study caching in proxy (unfortunately nginx do not rewrite max-age offset based on the remainding cache age on a cache hit)

### Playground setup
Github Page ([link](https://blackjackyau.github.io/http-cache-playground/))

#### To test different kind of cache header
- [`localhost:8888|spa(vue)`] -> [`localhost:8080|proxy-with-cache(nginx)`] -> [`localhost:8888|BE-API(node)`]

#### To test external resource (use the proxy API)
- [`localhost:8888|spa(vue)`] -> [`localhost:8080|proxy-with-cache(nginx)`] -> [`localhost:8888|BE-Proxy(node)`] -> Your Resource
- E.g. `http://localhost:8888/api/proxy/https://abs.twimg.com/responsive-web/client-web/i18n/en-GB.b6107a15.js`

### Vary
- vary header is an important attribute when the resource response are derrived by the headers from the request
- without specifying those headers as Vary, both browser and proxy cache will not take the header value as part of the cache identifier
- Example shown in this playground is the `Accept-Language` Header. 
- Without the `Vary: Accept-Language` header, both browser can proxy cache will threat any following requests as cache hit even with different `Accept-Language` request. Resulting in wrong payload returned

### Reference Links:
- [Simple App using Vue + CDN](https://techformist.com/use-vue-from-url-simple-app/)
- [Assign temp value in template (vue)](https://stackoverflow.com/questions/43999618/how-to-define-a-temporary-variable-in-vue-js-template)
- [Vary to take care of different accept-encoding](https://www.fastly.com/blog/best-practices-using-vary-header)
- [Express precondition resource](https://github.com/richardschneider/express-conditional-request/blob/master/test/server.js)