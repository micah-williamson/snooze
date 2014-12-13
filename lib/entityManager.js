var Entity = require('./entity');
var EntityGroup = require('./entityGroup');
var Util = require('./Util');

/**
 * A SnoozeJS Entity Manager
 * @constructor
 * @param {object} module - The module the EntityManager will belong to
 * 
 */

var EntityManager = function(module) {
	var self = this;

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

	var _entityGroups = [];

	var _entities = [];

	self.registerEntityGroup = function(group) {
		if(group instanceof EntityGroup) {
			if(!self.entityGroupExists(group)) {
				self.createEntityRegisterMethod(group);
				_entityGroups.push(group);
			} else {
				throw new Error('Entity Type Already Exists For: ' + group.getType());
			}
		} else {
			throw new Error('Unable to register non entity group');
		}
	};

	self.registerEntity = function(entity) {
		if(entity instanceof Entity) {
			if(entityGroupExists(entity.type)) {
				_entities.push(entity);
			} else {
				throw new Error('Unknown Entity Type: ' + entity.getType() + ' (' + entity.getName() + ')');
			}
		} else {
			throw new Error('Unable to register non entity');
		}
	};

	self.createEntityRegisterMethod = function(type) {
		module[type.getType()] = self[type.getType()] = function(nm, constructor) {
			var entity = new Entity();
			entity.name = nm;
			entity.type = type.getType();
			entity.constructor = constructor;

			var group = self.getEntityGroup(entity.getType());
			group.registerDependencies(entity);

			self.registerEntity(entity);
		};
	};

	// Accessors

	self.getEntities = function(type) {
		var entities = _entities;

		if(type) {
			if(type instanceof EntityGroup) {
				type = type.getName();
			}

			entities = [];
			for(var i = 0; i < _entities.length; i++) {
				var entity = _entities[i];
				if(entity.getType() === type) {
					entities.push(entity);
				}
			}
		}

		return entities;
	};

	self.getEntity = function(nm, type) {
		var entities = _entities;

		if(type) {
			if(type instanceof EntityGroup) {
				type = type.getName();
			}

			entities = getEntities(type);
		}

		for(var i = 0; i < entities.length; i++) {
			var entity = entities[i];
			if(entity.getName() === nm) {
				return entity;
			}
		}

		return undefined;
	};

	self.removeEntity = function(nm, type) {
		var entities = _entities;
		var newEntities = [];

		if(type) {
			if(type instanceof EntityGroup) {
				type = type.getName();
			}

			entities = getEntities(type);
		}

		for(var i = 0; i < entities.length; i++) {
			var entity = entities[i];
			if(entity.getName() !== nm) {
				newEntities.push(entity);
			}
		}

		_entities = newEntities;
	}

	self.entityExists = function(nm, type) {
		if(nm instanceof Entity) {
			nm = nm.getName();
		}

		var entity = getEntity(nm, type);

		if(entity) {
			return true;
		}

		return false;
	};

	self.getEntityGroup = function(type) {
		if(type) {
			if(type instanceof EntityGroup) {
				type = type.getType();
			}
		}

		for(var i = 0; i < _entityGroups.length; i++) {
			var group = _entityGroups[i];
			if(group.getType() === type) {
				return group;
			}
		}

		return undefined;
	};

	self.entityGroupExists = function(type) {
		var group = self.getEntityGroup(type);

		if(group) {
			return true;
		}

		return false;
	};

	self.run = function(_func) {
		var args = self.getInjectables(_func);
		return _func.apply(null, args);
	};

	self.getInjectables = function(_func) {
		var parameters = Util.getParams(_func);

		var args = [];
		for(var i = 0; i < parameters.length; i++) {
			var parameter = parameters[i];
			var inj = self.getInjectable(parameter);

			args.push(inj);
		}

		return args;
	};

	self.getInjectable = function(name) {
		var entity = self.getEntity(name);
		if(entity instanceof Entity) {
			var group = self.getEntityGroup(entity.getType());
			return group.getInject(entity);
		} else {
			throw new Error('Unkown entity cannot be injected: ' + name);
		}
	};

	// Modifiers

	/**
	 * Checks that there are no circular dependencies
	 */
	self.ensureNoCircularDependencies = function() {
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

				var EObj = getEntity(E);
				var dependencies = EObj.getDependencies();

				var subEntities = _module.getParams(EObj.constructor);
				_runTree(dependencies, subtree);
			}
		};

		var treeEntities = [];

		for(var i = 0; i < _entities.length; i++) {
			var entity = _entities[i];
			if(entity.injectable) {
				treeEntities.push(entity.getName());
			}
		}

		_runTree(treeEntities, []);
	};

	/**
	 * Compiles all Entities for this EntityManager
	 */
	self.compile = function() {
		self.ensureNoCircularDependencies();

		var _isCompiled = function(E) {
			return E.compiled;
		};

		var _canCompile = function(E) {
			var dependencies = E.getDependencies();

			for(var i = 0; i < dependencies.length; i++) {
				var dep = dependencies[i];
				var D = getEntity(dep);

				if(D) {
					if(!_isCompiled(D)) {
						return false;
					}
				} else {
					throw new Error(E.getName() + ' depends on an unknown entity: ' + dep);
				}
			}

			return true;
		};

		var uncompiledFound = true;
		while(uncompiledFound) {
			uncompiledFound = false;
			for(var i = 0; i < _entities.length; i++) {
				var E = _entities[i];
				if(!_isCompiled(E)) {
					if(_canCompile(E)) {
						var group = self.getEntityGroup(E.getType());
						group.compile(E, E.constructor);
					} else {
						uncompiledFound = true;
					}
				}
			}
		}
	};

	return self;
}

module.exports = EntityManager;