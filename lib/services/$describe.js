var snooze = require('snooze');

snooze.module('snooze-baselib').service('$describe', function($it, $module) {
	var _assumptionSets = [];

	var AssumptionSet = function(description, fn) {
		this.description = description;
		this.fn = fn;
		this.failed, this.failMessage, this.failTrace, this.assumptions;
		var _assumptions = null;
		var _assumptionCount = 0;
		var _checkInterval;
		var self = this;
		var _finishFn = function(){};
		var _passedTests = 0;

		var _findAssumptionCount = function() {
			var assumption_pattern = new RegExp('\\$it\\s*\\(', 'g');
			var matches = (self.fn+'').match(assumption_pattern);
			if(matches !== null) {
				_assumptionCount = matches.length;
			} else {
				_assumptionCount = 0;
			}
		};

		var _print = function() {
			console.log('');
			if(self.failed) {
				_printFailure(self.description);
				if(self.failTrace !== undefined) {
					console.error(self.failTrace);
				} else {
					console.error(self.failMessage);
				}
			} else {
				_printSuccess(self.description);
			}

			for(var i = 0; i < _assumptions.length; i++) {
				var assumption = _assumptions[i];

				if(assumption.failed === true) {
					_printFailure('  it ' + assumption.description);
					console.log('    ' + assumption.failMessage);
				} else {
					_printSuccess('  it ' + assumption.description);
				}
			}
		};


		var _startInterval = function() {
			_checkInterval = setInterval(function() {
				_checkComplete();
			}, 1);
		};

		var _endInterval = function() {
			clearInterval(_checkInterval);
		};

		var _checkComplete = function() {
			var isComplete = true;
			var $it = $module.getService('$it');
			var assumptions = $it.getAssumptions();
			if((assumptions.length === _assumptionCount) && _assumptionCount > 0) {
				for(var i = 0; i < assumptions.length; i++) {
					var assumption = assumptions[i];
					assumption.start();

					if(assumption.failed === undefined) {
						isComplete = false;
					} else if(assumption.failed === true) {
						self.failed = true;
					}
				}
			} else if (_assumptionCount === 0) {
				isComplete = true;
			} else if (self.failed !== undefined) {
				isComplete = true;
			} else {
				isComplete = false;
			}

			if(isComplete === true) {
				_finish();
			}
		};

		var _finish = function() {
			_endInterval();

			var $it = $module.getService('$it');
			_assumptions = $it.getAssumptions().splice(0);
			$it.clearAssumptions();

			this.failed = false;

			for(var i = 0; i < _assumptions.length; i++) {
				var assumption = _assumptions[i];

				if(assumption.failed === true) {
					this.failed = true;
				} else {
					_passedTests++;
				}
			}

			_print();

			_finishFn();
		};

		var _printFailure = function(str) {
			console.log((str + ' ❌ ').red);
		};

		var _printSuccess = function(str) {
			console.log((str + ' ✔ ').green);
		};

		this.start = function() {
			snooze.onfatal(function(err) {
				if(err === undefined) {
					var err = new Error('Unkown Error');
				}

				self.failMessage = err.name + ': ' + err.message;
				self.failTrace = err.stack;			
	
				self.failed = true;
			});

			_findAssumptionCount();
			
			try {
				self.fn();
			} catch(e) {
				snooze.fatal(e);
			}

			_startInterval();
		};

		this.onfinish = function(fn) {
			_finishFn = fn;
		};

		this.getNumTests = function() {
			return _assumptionCount;
		};

		this.getNumPassedTests = function() {
			return _passedTests;
		};
	};

	var $get = function() {
		return function(description, fn) {
			var AS = new AssumptionSet(description, fn);
			_assumptionSets.push(AS);
		}
	};

	var getAssumptionSets = function() {
		return _assumptionSets;
	};

	var clearAssumptionSets = function() {
		_assumptionSets.splice(0);
	};

	return {
		$get: $get,
		getAssumptionSets: getAssumptionSets,
		clearAssumptionSets: clearAssumptionSets
	};
});