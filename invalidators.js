function IntervalInvalidator(milliseconds) {
  if (!this instanceof IntervalInvalidator) {
    return new IntervalInvalidator(milliseconds);
  }
  
  this._interval = milliseconds;
  this._intervalId = null;
  this._queryCache = null;
  this._queryIds = [];

  this.initialize = function(queryCache, queryId) {
    this._queryCache = queryCache;
    this._queryIds.push(queryId);
    var self = this;
    this._intervalId = setInterval(function(){self.invalidate()}, this._interval);
  };

  this.invalidate = function() {
    if (this._queryCache != null && this._queryIds.length > 0) {
      for (var i = 0; i < this._queryIds.length; i++) {
        this._queryCache.invalidate(this._queryIds[i]);
      }
    }
  };
  
  this.removeQuery = function(queryId) {
    this._queryIds.splice(this._queryIds.indexOf(queryId), 1);
  };
  
  this.stop = function() {
    clearInterval(this._intervalId);
  };
}

function DatabaseTimestampInvalidator(timestampQuery, mysqlClient, milliseconds) {
  if (!this instanceof DatabaseTimestampInvalidator) {
    return new DatabaseTimestampInvalidator(milliseconds);
  }
  
  this._tsQuery = timestampQuery;
  this._ts = new Date(0);
  this._client = mysqlClient;
  this._interval = milliseconds;
  this._intervalId = null;
  this._queryCache = null;
  this._queryIds = [];
  this._running = true;
  
  this.initialize = function(queryCache, queryId) {
    this._queryCache = queryCache;
    this._queryIds.push(queryId);
    var self = this;
    this._intervalId = setInterval(function(){self.checkDatabaseTimestamp()}, this._interval);
  };
  
  this.checkDatabaseTimestamp = function() {
    var self = this;
    // Because clearInterval does not clear the initial interval
    if (!this._running) {
      return;
    }
    this._client.query(this._tsQuery, function(err, results, fields) {
      if (err) {
        throw err;
      }
      var row = self._queryCache.getResultAsArray(results[0], fields);
      var newTimestamp = row[0];
      if (newTimestamp > self._ts) {
        self._ts = newTimestamp;
        self.invalidate();
      }
    });
  };
  
  this.invalidate = function() {
    if (this._queryCache != null && this._queryIds.length > 0) {
      for (var i = 0; i < this._queryIds.length; i++) {
        this._queryCache.invalidate(this._queryIds[i]);
      }
    }
  };
  
  this.removeQuery = function(queryId) {
    this._queryIds.splice(this._queryIds.indexOf(queryId), 1);
  };
  
  this.stop = function() {
    if (this._running) {
      this._running = false;
      clearInterval(this._intervalId);
    }
  };
}

module.exports.IntervalInvalidator = IntervalInvalidator;
module.exports.DatabaseTimestampInvalidator = DatabaseTimestampInvalidator;
