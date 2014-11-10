module.exports = function(nm, key) {
	this.name = 'DTOUndefinedKeyException';
	this.message = 'Fatal Error: DTO ' + nm + ' doesn\'t define the key ' + key;
};