var snooze = require('snooze');
var tls = require('tls');

snooze.module('snooze-baselib').service('$tls', function() {
	return tls;
});