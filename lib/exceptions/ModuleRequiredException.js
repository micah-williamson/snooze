module.exports = function(nm) {
	this.name = 'ModuleRequiredException';
	this.message = 'module is required for ' + nm + ' but was not provided.';
};