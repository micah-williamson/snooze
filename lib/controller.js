var _ = require('lodash');

/**
 * ## Controllers
 * Controllers in SnoozeJS are defined like Controllers in AngularJS. 
 */

/**
 * A SnoozeJS Controller
 * @constructor
 * @param {string} nm - The name of the Controller
 * @param {object} module - The module the Controller will belong to
 * 
 */
var Controller = function(nm, module) {
	/**
	 * @access private
	 * @ignore
	 * SnoozeJS NPM Module
	 */
	var snooze = require('./snooze');

	/**
	 * @access private
	 * @ignore
	 * Name of the Controller
	 */
	var _name = null;

	/**
	 * @access private
	 * @ignore
	 * Recorded injected Services
	 */
	var _services = [];

	/**
	 * @access private
	 * @ignore
	 * Recorded injected DTOs
	 */
	var _dtos = [];

	/**
	 * @access private
	 * @ignore
	 * Recorded injected DAOs
	 */
	var _daos = [];

	if(nm === null || nm === undefined || nm.length < 1) {
		snooze.fatal(new snooze.exceptions.ControllerNameNotDefinedException());
	} else {
		_name = nm;
	}

	/**
	 * Gets the name of the Controller
	 * @return {string} The name of the Controller
	 */
	var getName = function() {
		return _name;
	};

	/**
	 * Records an injected Service in the Controller
	 * @ignore
	 */
	var __addSrv = function(srv) {
		_services.push(srv);
	};

	/**
	 * Records an injected DTO in the Controller
	 * @ignore
	 */
	var __addDTO = function(dto) {
		_dtos.push(dto);
	};

	/**
	 * Records an injected DAO in the Controller
	 * @ignore
	 */
	var __addDAO = function(dao) {
		_daos.push(dao);
	};

	/**
	 * Gets the recorded Services for this Controller
	 * @ignore
	 * @return {array} An array of Services
	 */
	var __getServices = function() {
		return _services;
	};

	/**
	 * Gets the recorded DTOs for this Controller
	 * @ignore
	 * @return {array} An array of DTOs
	 */
	var __getDTOs = function() {
		return _dtos;
	};

	/**
	 * Gets the recorded DAOs for this Controller
	 * @ignore
	 * @return {array} An array of DAOs
	 */
	var __getDAOs = function() {
		return _daos;
	};

	return {
		getName: getName,
		__getServices: __getServices,
		__getDTOs: __getDTOs,
		__getDAOs: __getDAOs,
		__addSrv: __addSrv,
		__addDTO: __addDTO,
		__addDAO: __addDAO
	}
}

module.exports = Controller;