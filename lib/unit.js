var _ = require('lodash');
var q = require('q');

var _new = function(module) {
	var snooze = require('./snooze');
	var _test = null;
	var _module = module;
	var _assumptionSets = null;
	var _defer = null;
	var _numTests = 0;
	var _passedTests = 0;

	var _testNextAssumption = function() {
		var assumptionSet = _assumptionSets.splice(0, 1)[0];
		if(assumptionSet !== undefined) {
			assumptionSet.onfinish(function() {
				_numTests += assumptionSet.getNumTests();
				_passedTests += assumptionSet.getNumPassedTests();

				_testNextAssumption();
			});

			assumptionSet.start();
		} else {
			_defer.resolve();
		}
	};

	var test = function() {
		_defer = q.defer();

		$describe = _module.getService('$describe');
		
		_test();

		_assumptionSets = $describe.getAssumptionSets().splice(0);
		_testNextAssumption();

		return _defer.promise;
	};

	var getAssumptionSets = function() {
		return _assumptionSets;
	};

	var setTest = function(fn) {
		_test = fn;
	};

	var getNumTests = function() {
		return _numTests;
	};

	var getNumPassedTests = function() {
		return _passedTests;
	};

	return {
		getNumTests: getNumTests,
		getNumPassedTests: getNumPassedTests,
		setTest: setTest,
		test: test,
		getAssumptionSets: getAssumptionSets
	};
};

module.exports = _new;