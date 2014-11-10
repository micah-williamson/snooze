module.exports = function(entity, nm) {
	this.name = 'DuplicateEntityException';
	this.message = 'Duplicate ' + entity + ' exists: ' + nm;
};