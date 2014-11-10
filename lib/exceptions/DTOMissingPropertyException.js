module.exports = function(nm, key) {
	this.name = 'DTOMissingPropertyException';
	this.message = 'DTO ' + nm + ' missing required property - ' + key;
};