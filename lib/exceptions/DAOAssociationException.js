module.exports = function(name, key) {
	this.name = 'DAOAssociationException';
	this.message = 'Fatal Error: DAO ' + name + ' cannot be associated with non-existant DAO ' + key;
};