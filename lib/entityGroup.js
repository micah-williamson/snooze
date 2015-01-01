(function() {
	'use strict';

	var EntityGroup = function() {};

	EntityGroup.prototype.type = '';
	EntityGroup.prototype.getType = function() {
		return this.type;
	};
	EntityGroup.prototype.compile = function(Entity, EntityManager) {
		throw new Error(this.type + ' Has not defined a compile method');
	};
	EntityGroup.prototype.getConfig = function(Entity, EntityManager) {
		throw new Error(this.type + ' Has not defined a getConfig method');
	};
	EntityGroup.prototype.getInject = function(Entity, EntityManager) {
		throw new Error(this.type + ' Has not defined a getInject method');
	};
	EntityGroup.prototype.registerDependencies = function(Entity, EntityManager) {
		throw new Error(this.type + ' Has not defined a registerDependencies method');
	};
	module.exports = EntityGroup;
})();