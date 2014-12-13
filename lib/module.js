var colors = require('colors'); // for logging
var fs = require('fs');

var Util = require('./Util');

/**
 * A SnoozeJS Module
 * @constructor
 * @param {string} nm - The name of the module
 * @param {array} modules - Array of module names to inject
 */
var Module = function(nm, modules) {
	/**
	 * @access private
	 * @ignore
	 * SnoozeJS NPM Module
	 */
	var snooze = require('./snooze');

	/**
	 * @access private
	 * @ignore
	 * The return object of the constructor.
	 */
	var ret = {};

	/**
	 * @access private
	 * @ignore
	 * A reference to the module
	 */
	var self = null;

	/**
	 * @access private
	 * @ignore
	 * The name of the module
	 */
	var _name = null;

	/**
	 * @access private
	 * @ignore
	 * Enable/Disable Logging
	 */
	var _logging = true;

	/**
	 * @access private
	 * @ignore
	 * True if wakeup() has been called
	 */
	var _isAwake = false;

	/**
	 * @access private
	 * @ignore
	 * snooze.json config
	 */
	var _config = snooze.getConfig();

	/**
	 * @access private
	 * @ignore
	 * Run functions defined by the run() method
	 */
	var _runs = [];

	/**
	 * @access private
	 * @ignore
	 * Injected modules
	 */
	var _modules = [];

	/**
	 * @access private
	 * @ignore
	 * Map of imported modules
	 */
	var _importedModules = {};

	/**
	 * @access private
	 * @ignore
	 * Lib paths to import files from
	 */
	var _libs = [];

	/**
	 * @access private
	 * @ignore
	 * An Entity Manager assigned to this module
	 */
	var EntityManager = require('./entityManager')(ret);

	/**
	 * @access private
	 * @ignore
	 * An array of import processes- AKA middlewares
	 */
	var _importProcesses = [];

	if(modules !== undefined) {
		var _modules = modules;
	}

	_name = nm;

	/**
	 * Creates the $module service
	 */
	var init = function() {
		self = this;

		if(_name === null || _name === undefined || _name.length < 1) {
			snooze.fatal(new snooze.exceptions.ModuleNameNotDefinedException());
		}

		_createModuleService();
	};

	/**
	 * Sets process env vars from the snooze.json env config
	 */
	var initEnv = function() {
		var mode = _config.mode;
		var env = _config.modes[mode].env;

		for(var key in env) {
			var val = env[key];
			process.env[key] = val;
		}
	};

	/**
	 * Requires files found in lib paths
	 * @param {string} bp - Set the base path to search from (defaults to cwd)
	 */
	var requireLibs = function(bp) {
		var basePath = process.cwd();
		if(bp !== undefined) {
			basePath = bp;
		}

		var loadLibs = [];

		for(var i = 0; i < _libs.length; i++) {
			var lib = _libs[i];
			loadLibs.push(lib);
		}

		if(_isAwake === true) {
			for(var i = 0; i < _config.libs.length; i++) {
				var lib = _config.libs[i];
				loadLibs.push(lib);
			}
		}

		for(var i = 0; i < loadLibs.length; i++) {
			var path = basePath + '/' + loadLibs[i];
			log(('opening lib path ' + path).yellow);

			require('fs').readdirSync(path).forEach(function(file) {
			  log(('+ ' + file).yellow);
			  require(path + '/' + file);
			});
		}
	};

	/**
	 * Merges startingConfig (if defined in wakeup()) into the runtime config
	 */
	var mergeStartingConfig = function(startingConfig) {
		for(var key in startingConfig) {
			_config[key] = startingConfig[key];
		}
	};

	/**
	 * Merges modeConfig (like production or dev) into the runtime config
	 */
	var mergeModeConfig = function(mode) {
		for(var key in _config.modes[mode]) {
			_config[key] = _config.modes[mode][key];
		}
	};

	// Start

	/**
	 * Starts the SnoozeJS server
	 * @param {object} startingConfig - Additional config (see snooze.json) that
	 * will merge into the snooze.json at runtime
	 */
	var wakeup = function(startingConfig) {
		_isAwake = true;

		console.log(_name);

		mergeStartingConfig(startingConfig);
		mergeModeConfig(_config.mode);

		importModules();
		requireLibs();
	};

	// Accessors

	/**
	 * Gets the name of the Module
	 * @return {string} The name of the Module
	 */
	var getName = function() {
		return _name;
	};

	/**
	 * Gets the config of the Module
	 * @return {module} The config for Module
	 */
	var getConfig = function() {
		return _config;
	};

	/**
	 * Returns true if in testing mode
	 * @return {boolean} True if in testing mode
	 */
	var inTestMode = function() {
		if(_config.unitTesting && _config.unitTesting.mode) {
			if(_config.mode === _config.unitTesting.mode) {
				return true;
			}
		}

		return false;
	};

	/**
	 * Returns true of wakeup() has been called
	 * @return {boolean}
	 */
	var isAwake = function() {
		return _isAwake;
	};

	/**
	 * Gets the SnoozeJS NPM Module
	 * @return {object} SnoozeJS NPM Module
	 */
	var getSnooze = function() {
		return snooze;
	};

	// Modifiers

	/**
	 * Includes the snooze-baselib services
	 * @access private
	 * @ignore
	 */
	var _importBaseServices = function() {
		var mod = snooze.module('snooze-baselib', []);

		var files = fs.readdirSync(__dirname + '/services');
		for(var i = 0; i < files.length; i++) {
			require(__dirname + '/services/' + files[i]);
		}

		_modules.unshift('snooze-baselib');
	};

	/**
	 * Sets the lib directories to load
	 * @param {array} loadLibs - Array of directories
	 * @return {object} Module
	 */
	var libs = function(loadLibs) {
		for(var i = 0; i < loadLibs.length; i++) {
			_libs.push(loadLibs[i]);
		}

		return self;
	}

	/**
	 * Adds inject modules
	 * @ignore
	 * @param {array} modules - Array of module names
	 * @return {object} Module
	 */
	var addModules = function(modules) {
		for(var i = 0; i < modules.length; i++) {
			_modules.push(modules[i]);
		}
	};

	/**
	 * Creates an import process
	 * @ignore
	 * @param {function} processFunc - A import process function
	 *
	 * The import process function should return the function that will be injected into other modules
	 * process functions. If a function is not returned it will be ignored. This may be useful
	 * in changing the modules current import processes.
	 */
	var importProcess = function(processFunc) {
		var func = processFunc(_importProcesses);
		if(func) {
			_importProcesses.push(func);
		}
	};

	/**
	 * For each injected module imports the controllers, services,
	 * validators, dtos, and daos
	 *
	 * @ignore
	 * @return {object} Module
	 */
	var importModules = function() {
		var importProcesses = _importProcesses;

		for(var i = 0; i < _modules.length; i++) {
			var _mod = snooze.module(_modules[i]);
			_mod.wakeup();
			var processes = _mod.getImportProcesses();
			for(var k = 0; k < processes.length; k++) {
				var process = processes[k];
				for(var j = 0; j < _importProcesses.length; j++) {
					if(importProcesses[j]+'' !== process+'') {
						importProcesses.push(process);
					}
				}
			}
		}

		for(var i = 0; i < _modules.length; i++) {
			var modName = _modules[i];
			if(!_importedModule[modName]) {
				var _mod = snooze.module(modName);
				self.log(('Importing ' + _mod.getName()).blue);

				for(var k = 0; k < importProcesses.length; k++) {
					var importProcess = importProcesses[k];
					importProcess(_mod, self);
				}
			}
		}
	};

	var getImportProcesses = function() {
		return _importProcesses;
	};

	/**
	 * Disables logging
	 */
	var disableLogging = function() {
		_logging = false;
	};

	/**
	 * Enables logging (enabled by default)
	 */
	var enableLogging = function() {
		_logging = true;
	};

	/**
	 * Runs each of the run functions defined
	 * @ignore
	 */
	var doRuns = function() {
		for(var i = 0; i < _runs.length; i++) {
			var _run = _runs[i];
			EntityManager.run(_run);
		}
	};

	// Helpers

	/**
	 * Gets the parameter from a function
	 *
	 * @param {function} func - A function
	 * @return {array} Array of parameters
	 */
	var getParams = function(func) {
		return Util.getParams(func);
	};

	/**
	 * Logs a message. Logs will not be printed when logging is disabled.
	 *
	 * @param {string} msg - The message to log
	 */
	var log = function() {
		if(_config.silent === false) {
			var log = Function.prototype.bind.call(console.log, console);
			if(_logging === true) {
				log.apply(console, arguments);
			}
		}
	};

	/**
	 * Logs a warning. Logs will not be printed when logging is disabled.
	 *
	 * @param {string} msg - The warning to log
	 */
	var warn = function() {
		arguments[0] = (arguments[0]+'').red;
		if(_config.silent === false || _config.silent === 'log') {
			var log = Function.prototype.bind.call(console.log, console);
			if(_logging === true) {
				log.apply(console, arguments);
			}
		}
	};

	/**
	 * Kills the node process
	 *
	 * @param {int} code - What code to exit the process with
	 */
	var exit = function(code) {
		process.exit(code);
	};

	/**
	 * Creates a run function to run after wakeup() has been called.
	 *
	 * @param {function} fn - An injection function to run.
	 * @return {object} Module - The SnoozeJS Module
	 */
	var run = function(fn) {
		_runs.push(fn);
	};

	var addToRet = {
		getName: getName,
		wakeup: wakeup,
		addModules: addModules,
		libs: libs,
		log: log,
		warn: warn,
		disableLogging: disableLogging,
		enableLogging: enableLogging,
		exit: exit,
		init: init,
		importBaseServices: _importBaseServices,
		isAwake: isAwake,
		getInjectable: getInjectable,
		getConfig: getConfig,
		getImportProcesses: getImportProcesses,
		inTestMode: inTestMode,
		run: run,

		requireLibs: requireLibs,

		EntityManager: EntityManager,
	};

	for(var key in addToRet) {
		ret[key] = addToRet[key];
	}

	return ret;
}

module.exports = Module;