module.exports = function(path, method) {
	this.name = 'RouteControllerNotDefinedException';
	this.message = 'Controller required for route: ' + method + ' => ' + path;
};