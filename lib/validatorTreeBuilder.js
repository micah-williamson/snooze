var TestBlock = function(q) {
  this._defer = null;
  this.resolved = undefined;
  this.blockType = 'AND';
  this.tests = [];
  this.errors = [];

  // For OR tests
  this.firstErr = null;
  this.lastErr = null;
  
  var self = this;
  
  this.test = function(req) {
    this._defer = q.defer();
    this.firstErr = null;
    if(this.blockType === 'AND') {
      this.runAND(req, this.tests, 0);
    } else if(this.blockType === 'OR') {
      this.runOR(req, this.tests, 0);
    }
    return this._defer.promise;
  };

  this.runAND = function(req, tests, idx) {
    var test = tests[idx];

    if(typeof test === 'object' && test.length === 1) {
      test = test[0];
    }

    if(test === undefined) {
      self._defer.resolve();
    } else {
      if(test.defer !== undefined) {
        var promise = test.defer();
      } else {
        var promise = test.test(req);
      }

      promise.then(function() {
        self.runAND(req, tests, idx+1);
      }).fail(function(e) {
        var response = e;
        if(response.response) {
          response = response.response;
        }

        self._defer.reject(response);
      });

      if(test.defer !== undefined) {
        test.test(req);
      }
    }
  };
  
  this.runOR = function(req, tests, idx) {
    var test = this.tests[idx];

    if(test === undefined) {
      self._defer.reject(self.firstErr);
    } else {
      if(test.defer !== undefined) {
        var promise = test.defer();
      } else {
        var promise = test.test(req);
      }

      promise.then(function() {
        self._defer.resolve();
      }).fail(function(e) {

        var response = e;
        if(response.response) {
          response = response.response;
        }

        if(self.firstErr === null) {
          self.firstErr = response;
        }

        self.lastErr = response;

        if(e.last === true) {
          self._defer.reject(response);
        } else {
          self.runOR(req, tests, idx+1);
        }
      });

      if(test.defer !== undefined) {
        test.test(req);
      }
    }
  };
}

var _new = function(module) {
  var _module = module;

  this.buildTree = function(arr) {
    return this.getBranch(arr);
  };
  
  this.getBranch = function(arr) {
    var result = [];
    for(var i = 0; i < arr.length; i++) {
      var item = arr[i];
      if(typeof item === 'object' && item.length !== undefined) {
        item = this.getBranch(item);
      }
      result.push(item);
    }
    arr = result;
    
    arr = this.combineANDs(arr);
    arr = this.collapseSingleGroups(arr);
    arr = this.createANDTestBlocks(arr);
    arr = this.createORTestBlocks(arr);
    arr = this.collapseSingleGroups(arr);
    arr = this.createTests(arr);
    
    return arr;
  };
  
  this.createORTestBlocks = function(arr) {
    var result = [];
    if(arr.length === 1) {
      return arr;
    } else {
      for(var i = 0; i < arr.length; i++) {
        var item = arr[i];
      
        if(item !== 'OR') {
          result.push(item);
        }
      }

      var TB = new TestBlock(_module.getInjectable('$q'));
      TB.blockType = 'OR';
      TB.tests = result;
      
      return [TB];
    }
  };
  
  this.combineANDs = function(arr) {
    var result = [];
    var combination = [];
    var last = null;
    for(var i = 0; i < arr.length; i++) {
      var item = arr[i];
      
      if(item === 'OR' || last === 'OR') {
        result.push(combination);
        combination = [];
      }
      
      combination.push(item);
      
      if(i === arr.length-1) {
        result.push(combination);
      }
      
      last = item;
    }
    
    return result;
  };
  
  this.collapseSingleGroups = function(arr) {
    var result = [];
    for(var i = 0; i < arr.length; i++) {
      var item = arr[i];

      if(item.length === 1) {
        result.push(item[0]);
      } else if(item.tests && item.tests.length === 1) {
        result.push(item.tests[0]);
      } else {
        result.push(item);
      }
    }
    
    return result;
  };
  
  this.createANDTestBlocks = function(arr) {
    var result = [];
    for(var i = 0; i < arr.length; i++) {
      var item = arr[i];
      if(typeof item === 'object' && item.length !== undefined) {
        var TB = new TestBlock(_module.getInjectable('$q'));
        TB.tests = item;
        result.push(TB);
      } else {
        result.push(item);
      }
    }
    
    return result;
  };
  
  this.createTests = function(arr) {
    var result = [];
    for(var i = 0; i < arr.length; i++) {
      var item = arr[i];
      if(typeof item === 'string') {
        var T = new Test(item);
        result.push(T);
      } else {
        result.push(item);
      }
    }
    
    return result;
  }
}

module.exports = _new;