<a name="Readme"></a>
<h1>node-mysql-cache</h1>

<a name="Purpose"></a>
<h2>Purpose</h2>

node-mysql-cache is a MySQL [query cache](http://en.wikipedia.org/wiki/Database_caching)
for [node.js](http://nodejs.org/) on top of Felix Geisendörfer's MySQL client
[node-mysql](https://github.com/felixge/node-mysql).

The goal of this implementation is to reduce the load on the MySQL server and serve a large number
of clients simultaniously without querying the database for every request.

It was first implemented to very quickly serve data from a large table (>5M records) which was only updated every
few minutes. The concept to use a [cache invalidator](http://en.wikipedia.org/wiki/Cache_invalidation) was created
because of this use case.

<a name="TOC"></a>
<h2>TOC</h2>

* [Tutorial](#Tutorial)
* [Current status](#Status)
* [Contributors](#Contributors)
* [Compatibility](#Compatibility)
* [Installation](#Installation)
* [API](#API)
    * [Creation of a new pool](#NewPool)
    * [Options](#Options)
    * [Methods affecting all connections](#AllConnections)
    * [Methods invoked on a single connection](#SingleConnection)
    * [Methods unrelated to connections](#NoConnection)
    * [event: 'error' \(err\)](#EventError)
* [Todo](#Todo)
* [Licence](#Licence)

<a name="Tutorial"></a>
<h2>Tutorial</h2>

```
var Client = require('mysql').Client,
    client = new Client(),
    querycache = require('node-mysql-cache');

// Prepare and connect MySQL
client.user = "john";
client.password = "doe";
client.connect();
client.query("USE mydatabase");


var intInvalidator = new querycache.IntervalInvalidator(60000);           // invalidates cache every minute
var dbInvalidator = new querycache.DatabaseTimestampInvalidator(
                                  "SELECT some_timestamp FROM sometable", // if the timestamp changes, the query is invalidated
                                  client,                                 // the MySQL client with an established connection
                                  5000);                                  // check the timestamp every 5 seconds

  var queryId = cache.registerQuery("SELECT data FROM largetable", intInvalidator);
  var queryId2 = cache.registerQuery("SELECT moredata FROM hugetable", dbInvalidator);
  
  // the ready event fires as soon as all queries have fetched their data for the first time
  cache.once('ready', function() {
    // start the webserver or whatever...
    
    // ...
    
    // get the data from cache
    var results = cache.getResults(queryId);
    response.writeHead(200, {'Content-Type': 'application/json; encoding=utf-8'});
    response.end(JSON.stringify(results));
  });
```

<a name="Status"></a>
<h2>Current status</h2>

This module is in a development stage. I use it for a small server already but that does not mean
it's bug free.

If you find an error, please file an [issue](https://github.com/guggero/node-mysql-cache)!

<a name="Contributors"></a>
<h2>Contributors</h2>

* [Oliver Gugger](https://github.com/guggero)

Since this is my first github project, I used some files from [René Kijewski](https://github.com/Kijewski) as templates.
Thank you, I hope you don't mind!

<a name="Compatibility"></a>
<h2>Compatibility</h2>

This module was only tested using node >= 0.5.x.

Otherwise the requirements are the same as for
[node-mysql](https://github.com/felixge/node-mysql/blob/master/Readme.md).

<a name="API"></a>
<h2>API</h2>

* TODO

<a name="Licence"></a>
<h2>Licence</h2>

node-mysql-cache is licensed under the
[MIT license](https://github.com/guggero/node-mysql-cache/blob/master/License).
