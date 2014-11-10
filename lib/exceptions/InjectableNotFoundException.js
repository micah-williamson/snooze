module.exports = function(entity, injectable, parent) {
	this.name = 'InjectableNotFoundException';
	this.message = 'Injectable ' + entity + ' ' + injectable + ' Not Found in ' + parent;
};