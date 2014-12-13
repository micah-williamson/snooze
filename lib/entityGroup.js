var EntityGroup = function() {
	var self = this;

	self.compile = function(mixed) {};
	self.registerDependencies = function(mixed) {
		throw new Error(self.type + ' Has not defined a registerDependencies method');
	};
	self.getConfig = function(Entity) {
		throw new Error(self.type + ' Has not defined a getConfig method');
	};
	self.getInject = function(Entity) {
		throw new Error(self.type + ' Has not defined a getInject method');
	};

	self.getType = function() {
		return self.type;
	}
};

EntityGroup.prototype.type = '';
EntityGroup.prototype.compile = null;
EntityGroup.prototype.getType = null;
EntityGroup.prototype.getEntityConfig = null;
EntityGroup.prototype.getEntityInject = null;
EntityGroup.prototype.registerDependencies = null;

module.exports = EntityGroup;