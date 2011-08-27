var util = require('util'),
    EventEmitter = require('events').EventEmitter;

function QueryCache(mysqlClient) {
  // Ensure that there is always an object created
  if (!this instanceof QueryCache) {
    return new QueryCache(mysqlClient);
  }
  
  // There might be a lot of listeners waiting for a query to be ready,
  // so set it to a fairly high number.
  this.setMaxListeners(5000);
  
  this._client = mysqlClient;
  this._queryIndex = 0;
  this._queries = {};
  
  this.registerQuery = function(query, invalidator) {
    if (query != null) {
    
      var queryId = this.getQueryIndex(query);
      if (queryId != null) {
        // If the query is already registered, just hand back the ID to it
        return queryId;
      } else {
        queryId = "query" + this._queryIndex++;
      }
      
      // Set up the invalidator
      if (invalidator != null && 
          typeof invalidator === "object" &&
          typeof invalidator.initialize === "function") {
        
        // The invalidator is OK so use and initialize it
        this._queries[queryId] = {
          query: query,
          results: [],
          invalidator: invalidator,
          ready: false
        };
        invalidator.initialize(this, queryId);
      } else {
        // There is no invalidator that can be used, so set
        // it to null. This means that the cache is never
        // invalidated and the results are fetched only once
        // unless the cache is manually invalidated.
        this._queries[queryId] = {
          query: query,
          results: [],
          invalidator: null,
          ready: false
        };
      }
      // Load the results for the first time by invalidating the cache
      this.invalidate(queryId);
      
      // All done, return the query ID for further reference to the cache
      return queryId;
    } else {
      throw new Error("Query is null or undefined");
    }
  };
  
  this.invalidate = function(queryId) {
    var query = this._queries[queryId];
    if (query != null) {
      var self = this;
      this._client.query(query.query, function(err, results, fields) {
        if (err) {
          query.results = [];
          query.ready = true;
          throw err;
        }
        query.results = results;
        
        // if the query hasn't been ready before, see if the ready event
        // should be emitted now
        if (!query.ready) {
          query.ready = true;

          // Loop through all queries and see if they're ready
          var allReady = true;
          for (var q in self._queries) {
            if (!self._queries[q].ready) {
              allReady = false;
            }
          }
          if (allReady) {
            self.emit('ready');
          }
        }
      });
    }
  };
  
  this.getQueryIndex = function(query) {
    for (var queryId in this._queries) {
      if (this._queries[queryId].query == query) {
        return queryId;
      }
    }
    return null;
  };
  
  this.isQueryReady = function(queryId) {
    return this._queries[queryId].ready;
  };
  
  this.getResults = function(queryId) {
    var query = this._queries[queryId];
    if (query != null) {
      return query.results;
    } else {
      return null;
    }
  };
  
  this.removeQuery = function(queryId) {
    var query = this._queries[queryId];
    if (query != null &&
        query.invalidator != null &&
        typeof query.invalidator.removeQuery === "function") {
      this._queries[queryId].invalidator.removeQuery(queryId);
      delete this._queries[queryId];
    }
  };
  
  this.removeAllQueries = function() {
    for (var queryId in this._queries) {
      this.removeQuery(queryId);
    }
  };
  
  this.end = function() {
    for (var queryId in this._queries) {
      var query = this._queries[queryId];
      if (query.invalidator != null &&
          typeof query.invalidator.stop === "function") {
        query.invalidator.stop();
      }
    }
    this.removeAllQueries();
    this.removeAllListeners('ready');
  };
}

util.inherits(QueryCache, EventEmitter);
module.exports = QueryCache;

QueryCache.prototype.defaultInvalidator = function(milliseconds) {
  if (milliseconds != null) {
    return new IntervalInvalidator(milliseconds);
  } else {
    return new IntervalInvalidator(60000); // Default to 1 minute
  }
};

QueryCache.prototype.getResultAsArray = function(result, fields) {
  var arr = [];
  for (var f in fields) {
    arr.push(result[f]);
  }
  return arr;
};

