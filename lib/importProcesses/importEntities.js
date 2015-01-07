(function() {
	'use strict';

	module.exports = function(processes) {
		return function(source, dest) {

			var entities = source.EntityManager.getEntities();

			for(var i = 0; i < entities.length; i++) {
				var entity = entities[i];
				dest.log(('+ ' + entity.getName()).blue);
				dest.EntityManager.registerEntity(entity);
			}
		};
	};
})();