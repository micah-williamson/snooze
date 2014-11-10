module.exports = function() {
	this.name = 'RouteActionNotDefinedException';
	this.message = 'Action required for route: ' + method + ' => ' + path;
};