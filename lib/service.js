var _ = require('lodash');

var _new = function(nm, module) {
	var snooze = require('./snooze');
	var _name = null;
	var _services = [];
	var _dtos = [];
	var _daos = [];

	if(nm === null || nm === undefined || nm.length < 1) {
		snooze.fatal(new snooze.exceptions.ServiceNameNotDefinedException());
	} else {
		_name = nm;
	}

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

	var $get = function() {
		return this;
	};

	return {
		getName: getName,
		__getServices: __getServices,
		__getDTOs: __getDTOs,
		__getDAOs: __getDAOs,
		__addSrv: __addSrv,
		__addDTO: __addDTO,
		__addDAO: __addDAO,
		$get: $get,
		toType: function() {
			return 'Service';
		},
		compiled: false,
	};
};

module.exports = _new;