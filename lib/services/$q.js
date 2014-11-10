var snooze = require('snooze');
var q = require('q');

snooze.module('snooze-baselib').service('$q', function($module) {
	var ret = {};
	for(var key in q) {
		ret[key] = q[key];
	};

	q.onerror = function() {
		console.log('hello');
	};

	var defer = q.defer;
	q.defer = function() {
		var def = defer.apply(q, arguments);
		var _then = def.promise.then;
		var _fail = def.promise.fail;

		var overloadFail = function(p) {
			var failSet = false;

			var defaultFail = function(err) {
				if(failSet === false) {
					snooze.fatal(err);
				}
			};

			var fail = p.fail;
			fail.apply(p, [defaultFail]);

			p.fail = function() {
				failSet = true;
				fail.apply(p, arguments);
			};
		};

		def.promise.then = function() {
			var p = _then.apply(def.promise, arguments);
			overloadFail(p);
			return p;
		};

		def.promise.fail = function() {
			var p = _fail.apply(def.promise, arguments);
			return p;
		};

		return def;
	};

	return ret;
});