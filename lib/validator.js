var _ = require('lodash');

var _new = function(nm, module) {
	var snooze = require('./snooze');
	var _name = null;
	var _services = [];
	var _dtos = [];
	var _daos = [];
	var _errors = null;
	var _deferred = null;

	if(nm === null || nm === undefined || nm.length < 1) {
		snooze.fatal(new snooze.exceptions.ValidatorNameNotDefinedException());
	} else {
		_name = nm;
	}

	var defer = function() {
		_deferred = module.getInjectable('$q').defer();
		return _deferred.promise;
	};

	var test = function(req) {
		if(typeof this['_test'] === 'function') {
			var check = this['_test'](_deferred, req);
		} else {
			var err = 'Validator ' + _name + ' does not define a test';
			_deferred.reject(err);
			snooze.fatal(new Error(err))
		}

		return _deferred.promise;
	};

	var setTest = function(func) {
		this['_test'] = func;
	};

	var setErrors = function(errors) {
		this['errors'] = errors;
	};

	var getTest = function() {
		return this['_test'];
	};

	var getErrors = function() {
		return this['errors'];
	};

	var getName = function() {
		return _name;
	};

	var __addSrv = function(srv) {
		_services.push(srv);
	};

	var __addDTO = function(dto) {
		_dtos.push(dto);
	};

	var __addDAO = function(dao) {
		_daos.push(dao);
	};

	var __getServices = function() {
		return _services;
	};

	var __getDTOs = function() {
		return _dtos;
	};

	var __getDAOs = function() {
		return _daos;
	};

	return {
		'getName': getName,
		'setTest': setTest,
		'setErrors': setErrors,
		'test': test,
		'getTest': getTest,
		'getErrors': getErrors,
		'defer': defer,
		'__getServices': __getServices,
		'__getDTOs': __getDTOs,
		'__getDAOs': __getDAOs,
		'__addSrv': __addSrv,
		'__addDTO': __addDTO,
		'__addDAO': __addDAO
	};
};

module.exports = _new;