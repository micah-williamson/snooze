module.exports = function(nm, key, type, value) {
	this.name = 'DTOUnsupportedTypeException';
	this.message = 'Fatal Error: DTO ' + nm + ' only supports ' + type + ' for ' + key + '. ' + value + ' ( ' + (typeof value) + ' ) found.';
};