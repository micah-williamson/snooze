module.exports = function(nm, key, type) {
	this.name = 'DTOTypeNotFoundException';
	this.message = 'Fatal Error: DTO ' + nm + ' defines an unknown (' + type + ') type for ' + key;
};