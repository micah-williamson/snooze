var snooze = require('snooze');
var sequelize = require('sequelize');

snooze.module('snooze-baselib').service('seq', function() {
	return sequelize;
});