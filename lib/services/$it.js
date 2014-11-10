var snooze = require('snooze');

snooze.module('snooze-baselib').service('$it', function() {
	var _assumptions = [];

	var Assumption = function(description, fn) {
		this.description = description;
		this.failed, this.failMessage;

		this.start = function() {
			try {
				fn();
				this.failed = false;
			} catch(e) {
				this.failMessage = e.name + ': ' + e.message;
				this.failed = true;
			}
		};
	};

	var $get = function() {
		return function(description, fn) {
			var A = new Assumption(description, fn);
			_assumptions.push(A);

			return A;
		};
	};

	var getAssumptions = function() {
		return _assumptions;
	};

	var clearAssumptions = function() {
		_assumptions.splice(0);
	};

	return {
		$get: $get,
		getAssumptions: getAssumptions,
		clearAssumptions: clearAssumptions
	};
});