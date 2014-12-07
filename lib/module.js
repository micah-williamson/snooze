var colors = require('colors'); // for logging
var express = require('express');
var _ = require('lodash');
var fs = require('fs');
var http = require('http');
var https = require('https');

var bodyParser = require('body-parser');
var multer = require('multer');

var routeManager = require('./routeManager');

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
	 * Express App
	 */
	var _app = null;

	/**
	 * @access private
	 * @ignore
	 * The name of the module
	 */
	var _name = null;

	/**
	 * @access private
	 * @ignore
	 * The port to start the server on
	 */
	var _port = null;

	/**
	 * @access private
	 * @ignore
	 * HTTP Post Limit
	 */
	var _postLimit = '50mb';

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
	 * snooze.json SSL Config
	 */
	var _ssl = null;

	/**
	 * @access private
	 * @ignore
	 * Is true of SSL is configured
	 */
	var _isHTTPs = false;

	/**
	 * @access private
	 * @ignore
	 * Options to start express on
	 */
	var expressOptions = {};

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
	 * Server routes
	 */
	var _routes = [];

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
	 * A Mock Entity Manager assigned to this module
	 */
	var MockEntityManager = require('./entityManager')(ret);

	/**
	 * @access private
	 * @ignore
	 * A Route Manager assigned to this module
	 */
	var _routeManager = routeManager(ret);

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
	 * Loads key/cert files from paths defined in snooze.json
	 */
	var initSSL = function() {
		var mode = _config.mode;
		var _ssl = _config.modes[mode].ssl;

		if(_ssl !== undefined) {
			_isHTTPs = true;
			expressOptions.key = fs.readFileSync(process.cwd() + '/' + _ssl.key);
			expressOptions.cert =  fs.readFileSync(process.cwd() + '/' +  _ssl.cert);
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

		_.each(_libs, function(lib) {
			loadLibs.push(lib);
		});

		if(_isAwake === true) {
			_.each(_config.libs, function(lib) {
				loadLibs.push(lib);
			});
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
	 * Sets allow origin headers if allowOrigin is set in the snooze.json config
	 */
	var initOrigin = function() {
		if(_config.allowOrigin === true) {
			_app.use(function(req, res, next) {
				res.setHeader('Access-Control-Allow-Origin', '*');
	    		res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
	    		res.setHeader('Access-Control-Allow-Credentials', false);
	    		res.setHeader('Access-Control-Max-Age', '86400');
	    		res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept, Authorization');
	    		next();
			});
		}
	};

	/**
	 * Sets express middlewares to use
	 */
	var initMiddleWare = function() {
		_app.use(bodyParser.urlencoded({size: _postLimit, extended: true}));
		_app.use(bodyParser.json({size: _postLimit}));
		_app.use(multer({dest: './.tmp'}));
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

	/**
	 * Sets the port to 8000 if port has not already been defined and
	 * isn't defined in the config.
	 */
	var initPort = function() {
		if(_port === null) {
			_port = _config.port;
		}

		if(_port === undefined) {
			_port = 8000;
		}
	};

	/**
	 * Starts the express server with the express options.
	 */
	var startExpress = function() {
		if(_isHTTPs === true) {
			https.createServer(expressOptions, _app).listen(_port);
		} else {
			http.createServer(_app).listen(_port);
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

		mergeStartingConfig(startingConfig);
		mergeModeConfig(_config.mode);

		initEnv();
		initSSL();
		initPort();

		_app = express(expressOptions);

		initMiddleWare();
		initOrigin();
		importModules();
		requireLibs();

		EntityManager.compile();

		_routeManager.compileRoutes(_routes);
		_routeManager.bindRoutes();
		
		startExpress();

		if(!startingConfig.skipRuns) {
			doRuns();
		}

		log('Is it morning already?'.red);
		log(('snooze started on port ' + _port).green);
	};

	// Accessors

	/**
	 * Gets an injectable. When getting injectables,
	 * MockEntityManager will be checked first. With the exception to DAOs.
	 *
	 * @param {string} parameter - The name of the injectable to get
	 * @param {object} obj - Optionally an object that is requesting the injectable.
	 * This will be added to the objects recorded injectables list.
	 */
	var getInjectable = function(parameter, obj) {
		if(parameter.substr(-3) === 'DTO') {
			// Mock
			inj = MockEntityManager.getDTO(parameter);
			if(inj !== undefined) {
				if(obj !== undefined) {
					obj.__addDTO(parameter);
				}
			} else {
				// Actual
				inj = EntityManager.getDTO(parameter);

				if(inj !== undefined) {
					if(obj !== undefined) {
						obj.__addDTO(parameter);
					}
				} else {
					if(obj) {
						snooze.fatal(new snooze.exceptions.InjectableNotFoundException('DTO', parameter, obj.getName()));
					} else {
						snooze.fatal(new snooze.exceptions.InjectableNotFoundException('DTO', parameter, 'undefined'));
					}
				}
			}
		} else if(parameter.substr(-3) === 'DAO') {
			// There is no such thing as a mock DAO
			inj = EntityManager.getDAO(parameter);
			if(inj !== undefined) {
				if(obj !== undefined) {
					obj.__addDAO(parameter);
				}
			} else {
				if(obj) {
					snooze.fatal(new snooze.exceptions.InjectableNotFoundException('DAO', parameter, obj.getName()));
				} else {
					snooze.fatal(new snooze.exceptions.InjectableNotFoundException('DAO', parameter, 'undefined'));
				}
			}
		} else {
			// Mock
			var inj = MockEntityManager.getService(parameter);
			if(inj !== undefined) {
				if(obj !== undefined) {
					obj.__addSrv(parameter);
				}
			} else {
				// Actual
				var inj = EntityManager.getService(parameter);
				if(inj !== undefined) {
					if(obj !== undefined) {
						obj.__addSrv(parameter);
					}
				} else {
					var name = 'undefined';
					if(obj !== undefined) {
						name = obj.getName();
					}

					snooze.fatal(new snooze.exceptions.InjectableNotFoundException('Service', parameter, name));
				}
			}
		}
	

		if(inj.$get !== undefined) {
			return inj.$get();
		} else {
			return inj;
		}
	};

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
	 * Gets the SnoozeJS Express
	 * @return {object} ExpressJS App
	 */
	var getExpress = function() {
		return _app;
	};

	/**
	 * Gets the SnoozeJS routes from the routeManager
	 * @return {array} Array of routes
	 */
	var getRoutes = function(type) {
		return _routeManager.getRoutes(type);
	};

	/**
	 * Gets the SnoozeJS RouteManager
	 * @return {object} RouteManager
	 */
	var getRouteManager = function() {
		return _routeManager;
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
	 * Creates the $module service
	 * @access private
	 * @ignore
	 */
	var _createModuleService = function() {
		EntityManager.service('$module', function() {
			return {
				$get: function() {
					return self;
				}
			};
		});
	};

	/**
	 * Includes the snooze-baselib services
	 * @access private
	 * @ignore
	 */
	var _importBaseServices = function() {
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
	 * Records a route in the Module. These will be compiled by
	 * the RouteManager when wakeup() is called.
	 *
	 * @param {string} method - HTTP Method (GET, POST, PUT, DELETE)
	 * @param {string} path - HTTP Path (ex: /users)
	 * @param {object} options - Route options
	 * @return {object} Module
	 */
	var route = function(method, path, options) {
		if(_routeManager.routeExists(method, path)) {
			snooze.fatal(new snooze.exceptions.DuplicateRouteException(method, path));
		} else {
			_routes.push({
				method: method,
				path: path,
				options: options
			});
		}

		return self;
	};

	/**
	 * Alias to setPort
	 */
	var port = function(port) {
		return setPort(port);
	};

	/**
	 * Sets the server port
	 *
	 * @param {int} port - The port to use
	 * @return {object} Module
	 */
	var setPort = function(prt) {
		_port = prt;
		return self;
	};

	/**
	 * Sets the ssl config
	 *
	 * @param {object} ssl - SSL Config
	 * @return {object} Module
	 */
	var ssl = function(ssl) {
		_ssl = ssl;
		return self;
	};

	/**
	 * Sets the post limit of http requests
	 *
	 * @param {string} postLimit - Post limit string (default: '50mb')
	 * @return {object} Module
	 */
	var setPostLimit = function(postLimit) {
		_postLimit = postLimit;
		return self;
	};

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
	 * For each injected module imports the controllers, services,
	 * validators, dtos, and daos
	 *
	 * @ignore
	 * @return {object} Module
	 */
	var importModules = function() {
		for(var i = 0; i < _modules.length; i++) {
			var _mod = snooze.module(_modules[i]);

			log(('Importing ' + _mod.getName()).blue);

			var controllers = _mod.getControllers();
			var services = _mod.getServices();
			var validators = _mod.getValidators();
			var dtos = _mod.getDTOs();
			var daos = _mod.getDAOs();


			for(var k = 0; k < controllers.length; k++) {
				var controller = controllers[k];
				if(EntityManager.controllerExists(controller.getName()) === false) {
					log(('+ ' + controller.getName()).blue);
					EntityManager.addController(controller);
				}
			}

			for(var k = 0; k < services.length; k++) {
				var service = services[k];
				if(EntityManager.serviceExists(service.getName()) === false) {
					log(('+ ' + service.getName()).blue);
					EntityManager.addService(service);
				}
			}

			for(var k = 0; k < validators.length; k++) {
				var validator = validators[k];
				if(EntityManager.validatorExists(validator.getName()) === false) {
					log(('+ ' + validator.getName()).blue);
					EntityManager.addValidator(validator);
				}
			}

			for(var k = 0; k < dtos.length; k++) {
				var dto = dtos[k];
				if(EntityManager.dtoExists(dto.getName()) === false) {
					log(('+ ' + dto.getName()).blue);
					EntityManager.addDTO(dto);
				}
			}

			for(var k = 0; k < daos.length; k++) {
				var dao = daos[k];
				if(EntityManager.daoExists(dao.getName()) === false) {
					log(('+ ' + dao.getName()).blue);
					EntityManager.addDAO(dao);
				}
			}
		}
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
		var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
		var ARGUMENT_NAMES = /([^\s,]+)/g;
		var fnStr = func.toString().replace(STRIP_COMMENTS, '');
		var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
		if(result === null) {
			result = [];
		}
			
		return result
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
		getExpress: getExpress,
		route: route,
		port: port,
		setPort: setPort,
		ssl: ssl,
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
		getRoutes: getRoutes,
		getRouteManager: getRouteManager,
		getInjectable: getInjectable,
		getParams: getParams,
		getConfig: getConfig,
		inTestMode: inTestMode,
		run: run,

		requireLibs: requireLibs,

		EntityManager: EntityManager,
		getController: EntityManager.getController,
		getValidator: EntityManager.getValidator,
		getService: EntityManager.getService,
		getDTO: EntityManager.getDTO,
		getDAO: EntityManager.getDAO,
		controller: EntityManager.controller,
		validator: EntityManager.validator,
		service: EntityManager.service,
		dto: EntityManager.dto,
		dao: EntityManager.dao,
		getControllers: EntityManager.getControllers,
		getServices: EntityManager.getServices,
		getValidators: EntityManager.getValidators,
		getDTOs: EntityManager.getDTOs,
		getDAOs: EntityManager.getDAOs,
		unit: EntityManager.unit,
		getUnitTests: EntityManager.getUnits,
		defineDTOFromJSON: EntityManager.defineDTOFromJSON,

		MockEntityManager: MockEntityManager,
		getMockController: MockEntityManager.getController,
		getMockValidator: MockEntityManager.getValidator,
		getMockService: MockEntityManager.getService,
		getMockDTO: MockEntityManager.getDTO,
		getMockDAO: MockEntityManager.getDAO,
		mockController: MockEntityManager.controller,
		mockValidator: MockEntityManager.validator,
		mockService: MockEntityManager.service,
		mockDto: MockEntityManager.dto,
		mockDao: MockEntityManager.dao,
		getMockControllers: MockEntityManager.getControllers,
		getMockServices: MockEntityManager.getServices,
		getMockValidators: MockEntityManager.getValidators,
		getMockDTOs: MockEntityManager.getDTOs,
		getMockDAOs: MockEntityManager.getDTOs
	};

	for(var key in addToRet) {
		ret[key] = addToRet[key];
	}

	return ret;
}

module.exports = Module;