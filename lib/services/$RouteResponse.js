var snooze = require('snooze');

snooze.module('snooze-baselib').service('$RouteResponse', function() {
	var RouteResponse = function(code, msg) {
		this.code = code;
		this.msg = msg;
		this.isRouteResponse = true;
	};

	var $get = function() {
		return function(code, msg) {
			return new RouteResponse(code, msg);
		};
	};

	return {
		$get: $get,
		$class: RouteResponse
	};
});