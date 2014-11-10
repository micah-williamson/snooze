module.exports = function(path, method) {
	this.name = 'UnsupportedRouteValidatorTypeException';
	this.message = 'Validator option expected to be a string or array of string on route: ' + method + ' => ' + path;	
};