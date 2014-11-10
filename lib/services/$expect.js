var snooze = require('snooze');
var expect = require('expect.js');

snooze.module('snooze-baselib').service('$expect', function() {
	return {
		$get: function() {
			return expect;
		}
	};
});