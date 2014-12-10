var _ = require('lodash');
var _controller = require('./controller');
var _validator = require('./validator');
var _service = require('./service');
var _dto = require('./dto');
var _dao = require('./dao');
var _unitTest = require('./unit');

/**
 * A SnoozeJS Entity Manager
 * @constructor
 * @param {object} module - The module the EntityManager will belong to
 * 
 */

var EntityManager = function(module) {
	/**
	 * @access private
	 * @ignore
	 * SnoozeJS NPM Module
	 */
	var snooze = require('./snooze');

	/**
	 * @access private
	 * @ignore
	 * SnoozeJS Module
	 */
	var _module = module;

	/**
	 * @access private
	 * @ignore
	 * Managed Controllers
	 */
	var _controllers = [];

	/**
	 * @access private
	 * @ignore
	 * Managed Validators
	 */
	var _validators = [];

	/**
	 * @access private
	 * @ignore
	 * Managed Services
	 */
	var _services = [];

	/**
	 * @access private
	 * @ignore
	 * Managed DTOs
	 */
	var _dtos = [];

	/**
	 * @access private
	 * @ignore
	 * Managed DAOs
	 */
	var _daos = [];

	/**
	 * @access private
	 * @ignore
	 * Managed Unit Tests
	 */
	var _units = [];

	// Accessors

	/**
	 * Checks if the entity exists in the supplied array
	 * @access private
	 * @ignore
	 * @param {array} arr - An array of entities
	 * @param {string} nm - The name of the entity
	 * @return {boolean}
	 */
	var entityExists = function(arr, nm) {
		var ent = _.find(arr, function(entity) {
			return entity.getName() === nm;
		});

		if(ent === undefined) {
			return false;
		}

		return true;
	};

	/**
	 * Gets the entity from the supplied array
	 * @access private
	 * @ignore
	 * @param {array} arr - An array of entities
	 * @param {string} nm - The name of the entity
	 * @return {object} The entity searched for
	 */
	var getEntity = function(arr, nm) {
		return _.find(arr, function(entity) {
			return entity.getName() === nm;
		});
	};

	/**
	 * Checks if the Service exists
	 * @param {string} nm - The name of the Service
	 * @return {boolean}
	 */
	var serviceExists = function(nm) {
		return entityExists(_services, nm);
	};

	/**
	 * Checks if the DAO exists
	 * @param {string} nm - The name of the DAO
	 * @return {boolean}
	 */
	var daoExists = function(nm) {
		return entityExists(_daos, nm);
	};

	/**
	 * Checks if the DTO exists
	 * @param {string} nm - The name of the DTO
	 * @return {boolean}
	 */
	var dtoExists = function(nm) {
		return entityExists(_dtos, nm);
	};

	/**
	 * Checks if the Controller exists
	 * @param {string} nm - The name of the Controller
	 * @return {boolean}
	 */
	var controllerExists = function(nm) {
		return entityExists(_controllers, nm);
	};

	/**
	 * Checks if the Validator exists
	 * @param {string} nm - The name of the Validator
	 * @return {boolean}
	 */
	var validatorExists = function(nm) {
		return entityExists(_validators, nm);
	};

	/**
	 * Gets the Validator with the supplied name
	 * @param {string} nm - The name of the Validator
	 * @return {object} Validator
	 */
	var getValidator = function(nm) {
		return getEntity(_validators, nm);
	};

	/**
	 * Gets the Controller with the supplied name
	 * @param {string} nm - The name of the Controller
	 * @return {object} Controller
	 */
	var getController = function(nm) {
		return getEntity(_controllers, nm);
	};

	/**
	 * Gets the Service with the supplied name
	 * @param {string} nm - The name of the Service
	 * @return {object} Service
	 */
	var getService = function(nm) {
		return getEntity(_services, nm);
	};

	/**
	 * Gets the DAO with the supplied name
	 * @param {string} nm - The name of the DAO
	 * @return {object} DAO
	 */
	var getDAO = function(nm) {
		return getEntity(_daos, nm);
	};

	/**
	 * Gets the DTO with the supplied name
	 * @param {string} nm - The name of the DTO
	 * @return {object} DTO
	 */
	var getDTO = function(nm) {
		return getEntity(_dtos, nm);
	};

	/**
	 * Gets the Controllers managed by this EntityManager
	 * @return {array} Array of Controllers
	 */
	var getControllers = function() {
		return _controllers;
	};

	/**
	 * Gets the Services managed by this EntityManager
	 * @return {array} Array of Services
	 */
	var getServices = function() {
		return _services;
	};

	/**
	 * Gets the Validators managed by this EntityManager
	 * @return {array} Array of Validators
	 */
	var getValidators = function() {
		return _validators;
	};

	/**
	 * Gets the DTOs managed by this EntityManager
	 * @return {array} Array of DTOs
	 */
	var getDTOs = function() {
		return _dtos;
	};

	/**
	 * Gets the DAOs managed by this EntityManager
	 * @return {array} Array of DAOs
	 */
	var getDAOs = function() {
		return _daos;
	};

	/**
	 * Gets the Unit Tests managed by this EntityManager
	 * @return {array} Array of Unit Tests
	 */
	var getUnits = function() {
		return _units;
	};

	// Modifiers

	/**
	 * Creates a Controller and returns the Module this Entity
	 * Manager belongs to.
	 *
	 * @param {string} nm - The name of the Controller
	 * @param {function} func - The Injection Function to build this Controller on
	 * @return {object} The Module 
	 */
	var controller = function(nm, func) {
		removeController(nm);

		var ctrl = _controller(nm, _module);
		_controllers.push(ctrl);

		ctrl._func = func;

		return _module;
	};

	/**
	 * Creates a DAO and returns the Module this Entity
	 * Manager belongs to.
	 *
	 * @param {string} nm - The name of the DAO
	 * @param {function} func - The Injection Function to build this DAO on
	 * @return {object} The Module 
	 */
	var dao = function(nm, func) {
		removeDAO(nm);

		var dao = _dao(nm + 'DAO', _module);
		_daos.push(dao);

		dao._func = func;

		return _module;
	};

	/**
	 * Creates a DTO and returns the Module this Entity
	 * Manager belongs to.
	 *
	 * @param {string} nm - The name of the DTO
	 * @param {object} json - The DTO Properties
	 * @return {object} The Module 
	 */
	var dto = function(nm, json) {
		removeDTO(nm);
		var dto = _dto(nm + 'DTO', _module);
		dto.__json = json;

		_dtos.push(dto);

		return _module;
	};

	/**
	 * Creates a Service and returns the Module this Entity
	 * Manager belongs to.
	 *
	 * @param {string} nm - The name of the Service
	 * @param {function} func - The Injection Function to build this Service on
	 * @return {object} The Module 
	 */
	var service = function(nm, func) {
		removeService(nm);

		var srv = _service(nm, _module);
		_services.push(srv);

		srv._func = func;

		return _module;
	};

	/**
	 * Creates a Validator and returns the Module this Entity
	 * Manager belongs to.
	 *
	 * @param {string} nm - The name of the DAO
	 * @param {function} func - The Injection Function to build this Validator on
	 * @return {object} The Module 
	 */
	var validator = function(nm, func) {
		removeValidator(nm);
		
		var vd = _validator(nm, _module);
		_validators.push(vd);
		
		vd._func = func;

		return _module;
	};

	/**
	 * Creates a Unit Test and returns the Module this Entity
	 * Manager belongs to.
	 *
	 * @param {function} fn - The Injection Function to build this Unit Test on
	 * @return {object} The Module 
	 */
	var unit = function(fn) {
		var _unit = new _unitTest(_module);
		_units.push(_unit);

		_unit._func = fn;

		return _module;
	};

	/**
	 * Removes the Entity from the supplied array
	 * @access private
	 * @ignore
	 * @param {array} arr - The array of entities
	 * @param {string} nm - The name of the Entity
	 */
	var removeEntity = function(arr, nm) {
		var index = -1;
		for(var i = 0; i < arr.length; i++) {
			var entity = arr[i];
			if(entity !== undefined) {
				if(entity.getName() === nm) {
					index = i;
					break;
				}
			} else {
				snooze.fatal(new Error('undefined entity comparing to ' + nm));
			}
		}

		if(index !== -1) {
			console.log(index);
			console.log(arr[index].getName());
			arr.splice(arr, index, 1);
		}
	};

	/**
	 * Adds the Entity from the supplied array
	 * @access private
	 * @ignore
	 * @param {array} arr - The array of entities
	 * @param {object} item - The Entity
	 */
	var addEntity = function(arr, item) {
		removeEntity(arr, item.getName());
		arr.push(item);
	};

	/**
	 * Clears all entities from the entity arrays
	 * @access private
	 * @ignore
	 */
	var clearEntities = function() {
		_services.splice(0);
		_controllers.splice(0);
		_validators.splice(0);
		_dtos.splice(0);
		_daos.splice(0);
	};

	/**
	 * Adds the Controller to this Entity Manager
	 * @param {object} ctrl - The Controller to Add
	 */
	var addController = function(ctrl) {
		addEntity(_controllers, ctrl);
	};

	/**
	 * Adds the Service to this Entity Manager
	 * @param {object} srv - The Service to Add
	 */
	var addService = function(srv) {
		addEntity(_services, srv);
	};

	/**
	 * Adds the Validator to this Entity Manager
	 * @param {object} vd - The Validator to Add
	 */
	var addValidator = function(vd) {
		addEntity(_validators, vd);
	};

	/**
	 * Adds the DTO to this Entity Manager
	 * @param {object} dto - The DTO to Add
	 */
	var addDTO = function(dto) {
		addEntity(_dtos, dto);
	};

	/**
	 * Adds the DAO to this Entity Manager
	 * @param {object} dao - The DAO to Add
	 */
	var addDAO = function(dao) {
		addEntity(_dao, dao);
	};

	/**
	 * Removes the Controller from this Entity Manager
	 * @param {string} nm - The name of the Controller
	 */
	var removeController = function(nm) {
		removeEntity(_controllers, nm);
	};

	/**
	 * Removes the Service from this Entity Manager
	 * @param {string} nm - The name of the Service
	 */
	var removeService = function(nm) {
		removeEntity(_services, nm);
	};

	/**
	 * Removes the Validator from this Entity Manager
	 * @param {string} nm - The name of the Validator
	 */
	var removeValidator = function(nm) {
		removeEntity(_validators, nm);
	};

	/**
	 * Removes the DTO from this Entity Manager
	 * @param {string} nm - The name of the DTO
	 */
	var removeDTO = function(nm) {
		removeEntity(_dtos, nm);
	};

	/**
	 * Removes the DAO from this Entity Manager
	 * @param {string} nm - The name of the DAO
	 */
	var removeDAO = function(nm) {
		removeEntity(_daos, nm);
	};

	/**
	 * Runs an Injection Function and returns it's output
	 * @param {function} _func - The Injection Function
	 * @return {mixed}
	 */
	var run = function(_func) {
		var args = getInjectables(_func);
		return _func.apply(null, args);
	};

	var getInjectables = function(_func) {
		var parameters = _module.getParams(_func);

		var args = [];
		for(var i = 0; i < parameters.length; i++) {
			var parameter = parameters[i];
			var inj = _module.getInjectable(parameter);

			args.push(inj);
		}

		return args;
	};

	/**
	 * Compiles a Unit by running it's Injection Function and setting
	 * the returned function as the Unit's Test Function
	 *
	 * @param {object} unit - The Unit Test
	 */
	var compileUnit = function(unit) {
		var test = run(unit._func);
		unit.setTest(test);
	}

	/**
	 * Compiles a Controller by running it's Injection Function
	 * and adding the returned object to the Controller
	 *
	 * @param {object} ctrl - The Controller
	 */
	var compileController = function(ctrl) {
		var methods = run(ctrl._func);
		for(var key in methods) {
			(function(key) {
				if(typeof methods[key] === 'function') {
					ctrl[key] = function() {
						try {
							return methods[key].apply(null, arguments);
						} catch(e) {
							snooze.fatal(e);
						}
					};

					ctrl[key].toString = function() {
						return methods[key]+'';
					};
				} else {
					ctrl[key] = methods[key];
				}
			})(key);

			// ctrl[key] = methods[key];
		}
	};

	/**
	 * Compiles a Service by running it's Injection Function
	 * and adding the returned object to the Service
	 *
	 * @param {object} srv - The Service
	 */
	var compileService = function(srv) {
		var methods = run(srv._func);

		for(var key in methods) {
			srv[key] = methods[key];
		}

		if(srv.$compile) {
			srv.$compile();
		}

		srv.isCompiled = true;
	};

	/**
	 * Compiles a Validator by running it's Injection Function
	 * and adding the returned object to the Validator
	 *
	 * @param {object} vd - The Validator
	 */
	var compileValidator = function(vd) {
		var func = run(vd._func);

		vd.setTest(func.test);
		vd.setErrors(func.errors);
	};

	/**
	 * Compiles a DTO by running it's Injection Function
	 * and defining the DTO from the returned JSON
	 *
	 * @param {object} dto - The DTO
	 */
	var compileDTO = function(dto) {
		var json = dto.__json;
		defineDTOFromJSON(dto, json);

		dto.isCompiled = true;
	};

	/**
	 * Compiles a DAO by running it's Injection Function
	 * and settings the fields, and options of the DAO from the
	 * returned object. Additionally records DAO relationships
	 *
	 * @param {object} dao - The DAO
	 */
	var compileDAO = function(dao) {
		var $conn = getService('$conn');
		if($conn !== undefined) {
			var parameters = _module.getParams(dao._func);

			var args = [];
			for(var i = 0; i < parameters.length; i++) {
				var parameter = parameters[i];
				var inj = _module.getInjectable(parameter, dao);

				args.push(inj);
			}

			var res = dao._func.apply(null, args);
			dao.setFields(res.fields);
			dao.setOptions(res.options);

			if(res._hasOne !== undefined) {
				dao.setOneToOne(res._hasOne);
			}

			if(res._hasMany !== undefined) {
				dao.setOneToMany(res._hasMany);
			}

			if(res._belongsTo !== undefined) {
				dao.setBelongsTo(res._belongsTo);
			}

			var SeqDAO = $conn.$get().define(dao.getName().replace('DAO', ''), dao.getFields(), dao.getOptions);
			dao.setSeqDAO(SeqDAO);
		} else {
			snooze.fatal(new snooze.exceptions.SequelizeNotFoundException());
		}
	};

	/**
	 * Applies DAO relationships. This occurs after all
	 * DAOs have been compiled.
	 *
	 * @param {object} dao - The DAO
	 */
	var associateDAO = function(dao) {
		var oneToOnes = dao.getOneToOne();
		var oneToManys = dao.getOneToMany();
		var belongs = dao.getBelongsTo();

		var SeqDAO = dao.getSeqDAO();

		for(var key in oneToOnes) {
			var oneToOne = oneToOnes[key];
			
			for(var i = 0; i < oneToOne.length; i++) {
				var foreign = oneToOne[i];
				var AssocDAO = getDAO(key + 'DAO');

				if(foreign.through) {
					var ThroughDAO = getDAO(foreign.through + 'DAO');
					if(ThroughDAO !== undefined) {
						foreign.through = ThroughDAO.getSeqDAO();
					}
				}

				if(AssocDAO !== undefined) {
					SeqDAO.hasOne(AssocDAO.getSeqDAO(), foreign);
				} else {
					snooze.fatal(new snooze.exceptions.DAOAssociationException(dao.getName(), key));
				}
			}
		}

		for(var key in oneToManys) {
			var oneToMany = oneToManys[key];

			for(var i = 0; i < oneToMany.length; i++) {
				var foreign = oneToMany[i];
				var AssocDAO = getDAO(key + 'DAO');

				if(foreign.through) {
					var ThroughDAO = getDAO(foreign.through + 'DAO');
					if(ThroughDAO !== undefined) {
						foreign.through = ThroughDAO.getSeqDAO();
					}
				}

				if(AssocDAO !== undefined) {
					SeqDAO.hasMany(AssocDAO.getSeqDAO(), foreign);
				} else {
					snooze.fatal(new snooze.exceptions.DAOAssociationException(dao.getName(), key));
				}
			}
		}

		for(var key in belongs) {
			var bt = belongs[key];

			for(var i = 0; i < bt.length; i++) {
				var foreign = bt[i];
				var AssocDAO = getDAO(key + 'DAO');

				if(foreign.through) {
					var ThroughDAO = getDAO(foreign.through + 'DAO');
					if(ThroughDAO !== undefined) {
						foreign.through = ThroughDAO.getSeqDAO();
					}
				}

				if(AssocDAO !== undefined) {
					SeqDAO.belongsTo(AssocDAO.getSeqDAO());
				} else {
					snooze.fatal(new snooze.exceptions.DAOAssociationException(dao.getName(), key));
				}
			}
		}
	};

	/**
	 * Checks that there are no circular dependencies
	 */
	var ensureNoCircularDependencies = function() {
		var _runTree = function(treeEntities, tree) {
			for(var i = 0; i < treeEntities.length; i++) {
				var E = treeEntities[i];
				var subtree = JSON.parse(JSON.stringify(tree));
				
				subtree.push(E);

				for(var k = subtree.length-1; k > -1; k--) {
					var subitem = subtree[k];
					for(var j = k-1; j > -1; j--) {
						if(subitem === subtree[j]) {
							var circleString = subtree.join(' -> ');
							snooze.fatal('Circular Dependency Found: ' + circleString);
						}
					}
				}

				var services = getServices();
				var dtos = getDTOs();
				var entities = [];

				for(var k = 0; k < services.length; k++) {
					entities.push(services[k]);
				}

				for(var k = 0; k < dtos.length; k++) {
					entities.push(dtos[k]);
				}

				var EObj = getEntity(entities, E);
				if(EObj && EObj._func) {
					var subEntities = _module.getParams(EObj._func);
					_runTree(subEntities, subtree);
				} else if(EObj && EObj.__json) {
					var methods = EObj.__json.__methods;
					for(var name in EObj.__json.__methods) {
						var method = EObj.__json.__methods[name];
						var subEntities = _module.getParams(method);
						_runTree(subEntities, subtree);
					}
				}
			}
		};

		var services = getServices();
		var dtos = getDTOs();
		var treeEntities = [];

		for(var i = 0; i < services.length; i++) {
			treeEntities.push(services[i].getName());
		}

		for(var i = 0; i < dtos.length; i++) {
			treeEntities.push(dtos[i].getName());
		}

		_runTree(treeEntities, []);
	};

	/**
	 * Compiles all Entities for this EntityManager
	 */
	var compile = function() {
		ensureNoCircularDependencies();

		var _baseServices = ['$module', '$conn', 'seq'];
		_.each(_services, function(srv) {
			if(_.contains(_baseServices, srv.getName())) {
				compileService(srv);
			}
		});

		compileDAOs();
		associateDAOs();

		var services = getServices();
		var dtos = getDTOs();
		var entities = [].concat(services, dtos);

		var _isCompiled = function(E) {
			return E.isCompiled;
		};

		var _canCompile = function(E) {
			if(E && E._func) {
				subEntities = _module.getParams(E._func);
			} else if(E && E.__json) {
				var methods = E.__json.__methods;
				for(var name in E.__json.__methods) {
					var method = E.__json.__methods[name];
					subEntities = _module.getParams(method);
				}
			}

			for(var i = 0; i < subEntities.length; i++) {
				var E = getService(subEntities[i]);
				if(E === undefined) {
					E = getDTO(subEntities[i]);
				}

				if(E && !_isCompiled(E)) {
					return false;
				}
			}

			return true;
		};

		var uncompiledFound = true;
		while(uncompiledFound) {
			uncompiledFound = false;
			for(var i = 0; i < entities.length; i++) {
				var E = entities[i];
				if(!_isCompiled(E)) {
					if(_canCompile(E)) {
						if(E.toType() === 'Service') {
							compileService(E);
						} else if(E.toType() === 'DTO') {
							compileDTO(E);
							E.completeDTOInjection();
						}
					} else {
						uncompiledFound = true;
					}
				}
			}
		}
		
		compileValidators();
		compileControllers();
		compileUnits();
	};

	/**
	 * Compiles all Units for this EntityManager
	 */
	var compileUnits = function() {
		_.each(_units, function(unit) {
			compileUnit(unit);
		});
	};

	/**
	 * Compiles all Validators for this EntityManager
	 */
	var compileValidators = function() {
		_.each(_validators, function(vd) {
			compileValidator(vd);
		});
	};

	/**
	 * Compiles all Services for this EntityManager
	 */
	var compileServices = function() {
		_.each(_services, function(srv) {
			compileService(srv);
		});
	};

	/**
	 * Compiles all Controllers for this EntityManager
	 */
	var compileControllers = function() {
		_.each(_controllers, function(ctrl) {
			compileController(ctrl);
		});
	};

	/**
	 * Compiles all DTOs for this EntityManager
	 */
	var compileDTOs = function() {
		_.each(_dtos, function(dto) {
			compileDTO(dto);
		});

		// Allows injecting DTOs into DTOs asynchronously
		_.each(_dtos, function(dto) {
			dto.completeDTOInjection();
		});
	};

	/**
	 * Compiles all DAOs for this EntityManager
	 */
	var compileDAOs = function() {
		_.each(_daos, function(dao) {
			compileDAO(dao);
		});
	};

	/**
	 * Associates all DAOs for this EntityManager
	 */
	var associateDAOs = function() {
		_.each(_daos, function(dao) {
			associateDAO(dao);
		});
	};

	// Helpers

	/**
	 * Defines a DTO from a DTO Property JSON Object
	 * @param {object} dto - The DTO to define
	 * @param {object} json - The DTO Property JSON
	 */
	var defineDTOFromJSON = function(dto, json) {
		for(var key in json) {
			if(key.substr(0, 2) !== '__') {
				var type = json[key].type || null;
				var def = json[key].default || null;
				var description = json[key].description || null;
				var example = json[key].example || null;
				var required = json[key].required || false;

				dto.addProperty(key, type, def, description, example, required);
			}
		}

		var methods = json.__methods;
		var newMethods = {};
		for(var key in methods) {
			newMethods[key] = run(methods[key]);
		}
		var strict = json.__strict || false;
		dto.isStrict(strict);
		dto.setMethods(newMethods);
	};

	return {
		compileControllers: compileControllers,
		compileServices: compileServices,
		compileValidators: compileValidators,
		compileDTOs: compileDTOs,
		compileDAOs: compileDAOs,
		associateDAOs: associateDAOs,

		controller: controller,
		controllerExists: controllerExists,
		getControllers: getControllers,
		getController: getController,
		compileController: compileController,
		addController: addController,
		
		service: service,
		serviceExists: serviceExists,
		getServices: getServices,
		getService: getService,
		compileService: compileService,
		addService: addService,

		validator: validator,
		validatorExists: validatorExists,
		getValidators: getValidators,
		getValidator: getValidator,
		compileValidator: compileValidator,
		addValidator: addValidator,

		dto: dto,
		dtoExists: dtoExists,
		getDTOs: getDTOs,
		getDTO: getDTO,
		compileDTO: compileDTO,
		addDTO: addDTO,

		dao: dao,
		daoExists: daoExists,
		getDAOs: getDAOs,
		getDAO: getDAO,
		compileDAO: compileDAO,
		associateDAO: associateDAO,
		addDAO: addDAO,

		unit: unit,
		getUnits: getUnits,
		compileUnit: compileUnit,

		defineDTOFromJSON: defineDTOFromJSON,
		compile: compile,
		clearEntities: clearEntities,
		run: run
	}
}

module.exports = EntityManager;