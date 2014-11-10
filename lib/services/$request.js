var snooze = require('snooze');
var request = require('request');

snooze.module('snooze-baselib').service('$request', function() {
	_request = request;

	_request.postAll = function() {
		_doAll(_request.post, arguments);
	};

	_request.getAll = function() {
		_doAll(_request.get, arguments);
	};

	_request.putAll = function() {
		_doAll(_request.put, arguments);
	};

	_request.delAll = function() {
		_doAll(_request.del, arguments);
	};

	var _doAll = function(method, arguments) {
		var _numCalls = arguments[0].length;
		var _callsCompleted = 0;
		var _errors = [];
		var _responses = [];
		var _bodies = [];
		var _running = {};
		var _callback = function(){}

		var _checkComplete = function() {
			if(_callsCompleted === _numCalls) {
				_callback(_errors, _responses, _bodies);
			}
		}

		for(var i = 0; i < arguments[0].length; i++) {
			var _args = arguments;
			var path = _args[0][i];

			var _newArgs = [];
			_newArgs.push(path);
			for(var k = 1; k < _args.length; k++) {
				if(typeof _args[k] !== 'function') {
					_newArgs.push(_args[k]);
				} else {
					_callback = _args[k];
				}
			}

			_newArgs.push(function(err, response, body) {
				_errors.push(err);
				_responses.push(response);
				_bodies.push(body);
				_callsCompleted++;
				_checkComplete();
			});

			method.apply(_request, _newArgs);
		}
	};

	return {
		$get: function() {
			return request;
		}
	}
});