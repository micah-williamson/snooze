var Entity = function() {
	var self = this;
	
	self.getName = function() {
		return self.name;
	};
	
	self.getType = function() {
		return self.type;
	};

	self.getDependencies = function() {
		return self.dependencies;
	};

	self.dependencies = [];
};

Entity.prototype.name = '';
Entity.prototype.type = '';
Entity.prototype.compiled = false;
Entity.prototype.private = false;
Entity.prototype.injectable = true;
Entity.prototype.constructor = null;
Entity.prototype.instance = null;
Entity.prototype.dependencies = null;

Entity.prototype.getName = null;
Entity.prototype.getType = null;
Entity.prototype.getDependencies = null;

module.exports = Entity;