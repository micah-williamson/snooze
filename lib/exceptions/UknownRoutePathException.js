module.exports = function(method, path) {
	this.name = 'UnkownRoutePathException';
	this.message = 'Unknown Method: `' + method + '` on path: ' + path;
};