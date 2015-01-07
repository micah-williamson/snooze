(function() {
	'use strict';

	module.exports = function(processes) {
		return function(source, dest) {
			var entities = source.EntityManager.getEntityGroups();

			for(var i = 0; i < entities.length; i++) {
				var entity = entities[i];
				dest.log(('+ ' + entity.getType()).blue);
				if(!dest.EntityManager.entityGroupExists(entity.getType())) {
					dest.EntityManager.registerEntityGroup(entity);
				}
			}
		};
	};
})();