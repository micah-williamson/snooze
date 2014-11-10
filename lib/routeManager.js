var _ = require('lodash');
var _route = require('./route');
var snooze = require('snooze');

var _new = function(module) {
	var _module = null;
	var _routes = []

	if(module === null || module === undefined) {
		snooze.fatal(new ModuleRequiredException('Route Manager'));
	} else {
		_module = module;
	}

	var routeExists = function(method, path) {
		var rt = _.find(_routes, function(route) {
			return route.getPath() === path && route.getMethod() === method;
		});

		if(rt !== undefined) {
			return true;
		}

		return false;
	};

	var createRoute = function(method, path, options) {
		var rt = _route(_module, method, path, options);
		_routes.push(rt);
	};

	var compileRoutes = function(_routes) {
		_.each(_routes, function(rt) {
			compileRoute(rt);
		});
	}

	var bindRoutes = function() {
		_.each(_routes, function(route) {
			route.bind(_module.getExpress());
		});
	};

	var compileRoute = function(rt) {
		createRoute(rt.method, rt.path, rt.options);
	};

	var getRoutes = function(type) {
		if(type !== undefined) {
			var ret = [];
			_.each(_routes, function(rt) {
				if(rt.getMethod() === type) {
					ret.push(rt);
				}
			});

			return ret;
		} else {
			return _routes;
		}
	}

	return {
		'routeExists': routeExists,
		'createRoute': createRoute,
		'compileRoutes': compileRoutes,
		'bindRoutes': bindRoutes,
		'getRoutes': getRoutes
	};
}


module.exports = _new;