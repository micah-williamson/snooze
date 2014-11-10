module.exports = function(path, method, dto) {
	this.name = 'RouteDTONotFoundException';
	this.message = 'DTO doesn\'t exist in route request for query: ' + method + ' => ' + path + ' : ' + dto;
};