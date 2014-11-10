module.exports = function(errStr, method, path) {
	this.name = 'RouteRuntimeException';

	if(method && path) {
		this.message = errStr + ' in ' + method + ' => ' + path;
	} else {
		this.message = errStr;
	}
};