var _ = require('lodash');

/**
 * A SnoozeJS DAO
 * @constructor
 * @param {string} nm - The name of the DAO
 * @param {object} module - The module the DAO will belong to
 */
var DAO = function(nm, module) {
	/**
	 * @access private
	 * @ignore
	 * The SnoozeJS NPM Module
	 */
	var snooze = require('./snooze');

	/**
	 * @access private
	 * @ignore
	 * The name of the DAO
	 */
	var _name = null;

	/**
	 * @access private
	 * @ignore
	 * The fields the DAO defines
	 */
	var _fields = {};

	/**
	 * @access private
	 * @ignore
	 * The options set for this DAO
	 */
	var _options = {};

	/**
	 * @access private
	 * @ignore
	 * The recorded injected dtos
	 */
	var _dtos = [];

	/**
	 * @access private
	 * @ignore
	 * The recorded injected services
	 */
	var _services = [];

	/**
	 * @access private
	 * @ignore
	 * The recorded injected daos
	 */
	var _daos = [];

	/**
	 * @access private
	 * @ignore
	 * The oneToMany relations
	 */
	var _oneToMany = {};

	/**
	 * @access private
	 * @ignore
	 * The oneToOne relations
	 */
	var _oneToOne = {};

	/**
	 * @access private
	 * @ignore
	 * The belongsTo relation
	 */
	var _belongsTo = null;

	/**
	 * @access private
	 * @ignore
	 * The actual Sequelize model
	 */
	var _SeqDAO = null;

	if(nm === null || nm === undefined || nm.length < 1) {
		snooze.fatal(new snooze.exceptions.DAONameNotDefinedException());
	} else {
		_name = nm;
	}

	/**
	 * Gets the name of the DAO
	 * @return {string} The name of the DAO
	 */
	var getName = function() {
		return _name;
	};

	/**
	 * Gets the fields of the DAO
	 * @return {array} Gets an array of defined fields
	 */
	var getFields = function() {
		return _fields;
	};

	/**
	 * Gets the options of the DAO
	 * @return {array} Gets an array of defined options
	 */
	var getOptions = function() {
		return _options;
	};

	/**
	 * Gets the name of the DAO this DAO belongs to
	 * @return {string} a DAO name (or null)
	 */
	var getBelongsTo = function() {
		return _belongsTo;
	};

	/**
	 * Gets the name of DAOs this DAO has a one-to-one connection with
	 * @return {array} an array of DAO names
	 */
	var getOneToOne = function() {
		return _oneToOne;
	};

	/**
	 * Gets the name of DAOs this DAO has a one-to-many connection with
	 * @return {array} an array of DAO names
	 */
	var getOneToMany = function() {
		return _oneToMany;
	};

	/**
	 * Gets the Sequelize Model this DAO is associated with
	 * @return {object} Sequelize Model
	 */
	var getSeqDAO = function() {
		return _SeqDAO;
	}

	/**
	 * Sets the Sequelize Model this DAO is associated with
	 * @param {object} DAO - A Sequelize Model
	 */
	var setSeqDAO = function(DAO) {
		_SeqDAO = DAO;
	};

	/**
	 * Sets the DAO this DAO belongs to
	 * @param {string} val - The name of a DAO
	 */
	var setBelongsTo = function(val) {
		_belongsTo = val;
	};

	/**
	 * Sets the DAOs this DAO has a one-to-one relation with
	 * @param {array} vals - An array of DAO names
	 */
	var setOneToOne = function(vals) {
		for(var key in vals) {

			var val = vals[key];
			if(!_.isArray(val)) {
				val = [val];
			}

			_oneToOne[key] = val;
		}
	};

	/**
	 * Sets the DAOs this DAO has a one-to-many relation with
	 * @param {array} vals - An array of DAO names
	 */
	var setOneToMany = function(vals) {
		for(var key in vals) {

			var val = vals[key];
			if(!_.isArray(val)) {
				val = [val];
			}

			_oneToMany[key] = val;
		}
	};

	/**
	 * Sets the fields for this DAO
	 * @param {array} fields - An array of field objects
	 */
	var setFields = function(fields) {
		_fields = fields;
	};

	/**
	 * Sets the options for this DAO
	 * Options can contain belongsTo, oneToOne, and oneToMany
	 * @param {object} options - an object of DAO options
	 */
	var setOptions = function(options) {
		_options = options;
	};

	/**
	 * Records an injected Service in the DAO
	 * @ignore
	 */
	var __addSrv = function(srv) {
		_services.push(srv);
	};

	/**
	 * Records an injected DTO in the DAO
	 * @ignore
	 */
	var __addDTO = function(dto) {
		_dtos.push(dto);
	};

	/**
	 * Records an injected DAO in the DAO
	 * @ignore
	 */
	var __addDAO = function(dao) {
		_daos.push(dao);
	};

	/**
	 * Gets the recorded Services for this DAO
	 * @ignore
	 * @return {array} An array of Services
	 */
	var __getServices = function() {
		return _services;
	};

	/**
	 * Gets the recorded DTOs for this DAO
	 * @ignore
	 * @return {array} An array of DTOs
	 */
	var __getDTOs = function() {
		return _dtos;
	};

	/**
	 * Gets the recorded DAOs for this DAO
	 * @ignore
	 * @return {array} An array of DAOs
	 */
	var __getDAOs = function() {
		return _daos;
	};

	/**
	 * Gets the injected version of the DAO
	 * @ignore
	 * @return {object} Sequelize Model
	 */
	var $get = function() {
		return this.getSeqDAO();
	};

	return {
		q: null,
		getName: getName,
		getFields: getFields,
		getOptions: getOptions,
		setFields: setFields,
		setOptions: setOptions,
		setOneToOne: setOneToOne,
		setOneToMany: setOneToMany,
		setBelongsTo: setBelongsTo,
		setSeqDAO: setSeqDAO,
		getOneToOne: getOneToOne,
		getOneToMany: getOneToMany,
		getBelongsTo: getBelongsTo,
		getSeqDAO: getSeqDAO,
		__getServices: __getServices,
		__getDTOs: __getDTOs,
		__getDAOs: __getDAOs,
		__addSrv: __addSrv,
		__addDTO: __addDTO,
		__addDAO: __addDAO,
		$get: $get
	}
}

module.exports = DAO;