(function() {
	'use strict';

	var Util = require('./Util');

	/**
	 * A SnoozeJS Entity Manager
	 * @constructor
	 * @param {object} module - The module the EntityManager will belong to
	 * 
	 */

	var EntityManager = function(module, snooze) {
		this.snooze = snooze;
		this.module = module;
		this.entities = [];
		this.entityGroups = [];
	};

	EntityManager.prototype.snooze = null;
	EntityManager.prototype.module = null;
	EntityManager.prototype.entities = null;
	EntityManager.prototype.entityGroups = null;

	EntityManager.prototype.registerEntityGroup = function(group) {
		if(group instanceof this.snooze.EntityGroup) {
			if(!this.entityGroupExists(group)) {
				this.createEntityRegisterMethod(group);
				this.entityGroups.push(group);
			} else {
				throw new Error('Entity Type Already Exists For: ' + group.getType());
			}
		} else {
			throw new Error('Unable to register non entity group');
		}
	};

	EntityManager.prototype.registerEntity = function(entity) {
		if(entity instanceof this.snooze.Entity) {
			if(this.entityGroupExists(entity.type)) {
				this.module.log(('+ Entity: ' + entity.getName() + ' (' + entity.getType() + ')').yellow);
				this.entities.push(entity);
			} else {
				throw new Error('Unknown Entity Type: ' + entity.getType() + ' (' + entity.getName() + ')');
			}
		} else {
			throw new Error('Unable to register non entity');
		}
	};

	EntityManager.prototype.createEntityRegisterMethod = function(type) {
		var self = this;
		this.module[type.getType()] = this[type.getType()] = function(nm, constructor) {
			var entity = new this.snooze.Entity();
			entity.name = nm;
			entity.type = type.getType();
			entity.constructor = constructor;

			var group = self.getEntityGroup(entity.getType());
			group.registerDependencies(entity, this);

			self.registerEntity(entity);
		};
	};

	// Accessors

	EntityManager.prototype.getEntityGroups = function() {
		return this.entityGroups;
	};

	EntityManager.prototype.getEntities = function(type) {
		var entities = this.entities;

		if(type) {
			if(type instanceof this.snooze.EntityGroup) {
				type = type.getName();
			}

			entities = [];
			for(var i = 0; i < this.entities.length; i++) {
				var entity = this.entities[i];
				if(entity.getType() === type) {
					this.entities.push(entity);
				}
			}
		}

		return this.entities;
	};

	EntityManager.prototype.getEntity = function(nm) {
		var entities = this.entities;

		for(var i = 0; i < this.entities.length; i++) {
			var entity = this.entities[i];
			if(entity.getName() === nm) {
				return entity;
			}
		}

		return undefined;
	};

	EntityManager.prototype.removeEntity = function(nm, type) {
		var entities = this.entities;
		var newEntities = [];

		if(type) {
			if(type instanceof this.snooze.EntityGroup) {
				type = type.getName();
			}

			entities = this.getEntities(type);
		}

		for(var i = 0; i < this.entities.length; i++) {
			var entity = this.entities[i];
			if(entity.getName() !== nm) {
				newEntities.push(entity);
			}
		}

		this.entities = newEntities;
	};

	EntityManager.prototype.entityExists = function(nm, type) {
		if(nm instanceof this.snooze.Entity) {
			nm = nm.getName();
		}

		var entity = this.getEntity(nm, type);

		if(entity) {
			return true;
		}

		return false;
	};

	EntityManager.prototype.getEntityGroup = function(type) {
		if(type) {
			if(type instanceof this.snooze.EntityGroup) {
				type = type.getType();
			}
		}

		for(var i = 0; i < this.entityGroups.length; i++) {
			var group = this.entityGroups[i];
			if(group.getType() === type) {
				return group;
			}
		}

		return undefined;
	};

	EntityManager.prototype.entityGroupExists = function(type) {
		var group = this.getEntityGroup(type);

		if(group) {
			return true;
		}

		return false;
	};

	EntityManager.prototype.run = function(_func) {
		var args = this.getInjectables(_func);
		return _func.apply(null, args);
	};

	EntityManager.prototype.getInjectables = function(_func) {
		var parameters = Util.getParams(_func);

		var args = [];
		for(var i = 0; i < parameters.length; i++) {
			var parameter = parameters[i];
			var inj = this.getInjectable(parameter);

			args.push(inj);
		}

		return args;
	};

	EntityManager.prototype.getInjectable = function(name) {
		var entity = this.getEntity(name);
		if(entity instanceof this.snooze.Entity) {
			var group = this.getEntityGroup(entity.getType());
			return group.getInject(entity);
		} else {
			throw new Error('Unkown entity cannot be injected: ' + name);
		}
	};

	// Modifiers

	/**
	 * Checks that there are no circular dependencies
	 */
	EntityManager.prototype.ensureNoCircularDependencies = function() {
		var self = this;
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
							self.snooze.fatal('Circular Dependency Found: ' + circleString);
						}
					}
				}

				var EObj = self.getEntity(E);
				var dependencies = EObj.getDependencies();

				var subEntities = Util.getParams(EObj.constructor);
				_runTree(dependencies, subtree);
			}
		};

		var treeEntities = [];

		for(var i = 0; i < this.entities.length; i++) {
			var entity = this.entities[i];
			if(entity.injectable) {
				treeEntities.push(entity.getName());
			}
		}

		_runTree(treeEntities, []);
	};

	/**
	 * Compiles all Entities for this EntityManager
	 */
	EntityManager.prototype.compile = function() {
		var self = this;
		this.ensureNoCircularDependencies();

		var _isCompiled = function(E) {
			return E.compiled;
		};

		var _canCompile = function(E) {
			var dependencies = E.getDependencies();

			for(var i = 0; i < dependencies.length; i++) {
				var dep = dependencies[i];
				var D = self.getEntity(dep);

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
			for(var i = 0; i < this.entities.length; i++) {
				var E = this.entities[i];
				if(!_isCompiled(E)) {
					if(_canCompile(E)) {
						var group = this.getEntityGroup(E.getType());
						group.compile(E, this);
						E.compiled = true;
					} else {
						uncompiledFound = true;
					}
				}
			}
		}
	};

	module.exports = EntityManager;
})();