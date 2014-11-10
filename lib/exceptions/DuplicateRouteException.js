module.exports = function(method, path) {
	this.name = 'DuplicateRouteException';
	this.message = 'Duplicate route exists for: ' + method + ' => ' + path;
};