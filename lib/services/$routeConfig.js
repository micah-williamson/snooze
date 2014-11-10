var snooze = require('snooze');

snooze.module('snooze-baselib').service('$routeConfig', function() {
	// Set to true to complete routes in testing mode
	var _expectErrors = false;
	var _routeManager = null;
	var _allowOrigin = false;

	var originAllowed = function() {
		return _allowOrigin;
	};

	var expectErrors = function(bool) {
		if(bool === undefined) {
			bool = true;
		}

		_expectErrors = bool;
	};

	var expectingErrors = function() {
		return _expectErrors;
	};

	var getPaths = function(type) {
		var routes = _routeManager.getRoutes(type);

		var paths = [];
		for(var i = 0; i < routes.length; i++) {
			paths.push(routes[i].getPath());
		}

		return paths;
	};

	var getRoutes = function() {
		return _routeManager.getRoutes(type);
	};

	var $compile = function() {
		var _config = snooze.getConfig();
		var _module = snooze.module(_config.name);
		_routeManager = _module.getRouteManager();

		if(_config.modes[_config.mode].allowOrigin === true) {
			_allowOrigin = true;
		}
	};

	return {
		expectErrors: expectErrors,
		expectingErrors: expectingErrors,

		originAllowed: originAllowed,

		getPaths: getPaths,
		getRoutes: getRoutes,

		$compile: $compile
	}
});