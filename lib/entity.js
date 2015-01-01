(function() {
	'use strict';
	
	var Entity = function() {
		this.dependencies = [];
	};

	Entity.prototype.name = '';
	Entity.prototype.type = '';
	Entity.prototype.compiled = false;
	Entity.prototype.private = false;
	Entity.prototype.injectable = true;
	Entity.prototype.constructor = null;
	Entity.prototype.instance = null;
	Entity.prototype.dependencies = null;

	Entity.prototype.getName = function() {
		return this.name;
	};

	Entity.prototype.getType = function() {
		return this.type;
	};

	Entity.prototype.getDependencies = function() {
		return this.dependencies;
	};

	module.exports = Entity;
})();