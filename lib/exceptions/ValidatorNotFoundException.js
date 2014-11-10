module.exports = function(vd, mthd, path) {
	this.name = 'ValidatorNotFoundException';
	if(mthd && path) {
		this.message = 'Validator ' + vd + ' Not Found in route ' + mthd + ' => ' + path + '';
	} else {
		this.message = 'Validator ' + vd + ' Not Found';
	}
};