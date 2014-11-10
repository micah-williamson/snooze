var _ = require('lodash');
var q = require('q');
var fs = require('fs');
var mmm = require('mmmagic');
var Magic = mmm.Magic;
var _Magic = new Magic(mmm.MAGIC_MIME_TYPE);
var colors = require('colors');
var _dto = require('./dto');
var VTB = require('./validatorTreeBuilder.js');
var ValidatorTreeBuilder = null;

var _new = function(module, method, path, options) {
	var snooze = require('./snooze');
	// Route Class
	var _module = module;

	var _method = null;
	var mthd = null;
	var _path = null;
	var _controller = null;
	var _action = null;
	var _validators = [];
	var _injectedValidators = [];
	var _validatorTree = null;
	var _description = '';
	var _contentType = null;
	var $q = null;
	var isResource = false;
	var $routeConfig = module.getInjectable('$routeConfig');

	// Expectations
	var _request = null;
	var _requestParams = null;
	var _requestBody = null;
	var _requestQuery = null;
	var _response = null;
	var _responseOrig = null;
	var _requestOrig = null;
	var $RouteResponse = _module.getService('$RouteResponse').$get();

	ValidatorTreeBuilder = new VTB(module);

	// Parent and children are set by the routeManager
	var _parent = null;
	var _children = [];

	// Check to see if the path is defined
	if(path === null || path === undefined || path.length < 1) {
		snooze.fatal(new snooze.exceptions.UndefinedRoutePathException());
	} else {
		_path = path;
	}

	// Check to see if the method is defined and in the list of known methods
	switch(method.toLowerCase()) {
		case 'get':
			_method = 'get';
			break;
		case 'post':
			_method = 'post';
			break;
		case 'put':
			_method = 'put';
			break;
		case 'delete':
			_method = 'delete';
			break;
		case 'resource':
			_method = 'resource';
			break;
		default:
			snooze.fatal(new snooze.exception.UnkownRouteMethodException(path, method));
	}

	// Check to see if options is defined and is an object
	if(typeof options === 'object') {

		// Set description
		_description = options.description;

		// Check for validators
		if(options.validators) {
			var auth = options.validators;

			// If the validator is a string add it to an array of string
			if(typeof auth === 'string') {
				_validators = [auth];
			} else if (_.isArray(auth)) {
				_validators = auth;

			// If validators is not a string or an array throw an exception
			} else {
				snooze.fatal(new snooze.exceptions.UnsupportedRouteValidatorTypeException(path, method));
			}
		}

		var _injectValidators = function(_validators) {
			var _injectedValidators = [];
			for(var i = 0; i < _validators.length; i++) {
				var _vd = _validators[i];
				if(_vd !== 'OR') {
					if(typeof _vd === 'object' && _vd.length !== undefined) {
						_injectedValidators.push(_injectValidators(_vd));
					} else {
						_validator = _module.getValidator(_vd);
						if(_validator === undefined) {
							snooze.fatal(new snooze.exceptions.ValidatorNotFoundException(_vd, _method, _path));
						}
					}
				} else {
					_validator = _vd;
				}
				_injectedValidators.push(_validator);
			}
			return _injectedValidators;
		}

		if(_validators.length > 0) {
			_injectedValidators = _injectValidators(_validators);
			_validatorTree = ValidatorTreeBuilder.buildTree(_injectedValidators);
		}

		// If the route is not a resource make sure it has a controller and action
		if(_method !== 'resource') {
			if(options.controller) {
				_controller = options.controller;
			} else {
				snooze.fatal(new snooze.exceptions.RouteControllerNotDefinedException(path, method));
			}

			if(options.action) {
				_action = options.action;
			} else {
				snooze.fatal(new snooze.exceptions.RouteActionNotDefinedException(path, method));
			}
		}

		// If the route defines it's expected request find/generate the request DTOs
		if(options.request !== undefined) {

			// Save the original unaltered request for API generation
			_requestOrig = JSON.parse(JSON.stringify(options.request));

			var req = options.request;
			_request = req;

			var body = req.body;
			var params = req.params;
			var query = req.query;

			var dtoList = [
				{
					src: body,
					name: 'body',
					res: '_requestBody',
					dtoNameType: 'RouteBody'
				},
				{
					src: params,
					name: 'params',
					res: '_requestParams',
					dtoNameType: 'RouteParams'
				},
				{
					src: query,
					name: 'query',
					res: '_requestQuery',
					dtoNameType: 'RouteQuery'
				}
			];

			for(var i = 0; i < dtoList.length; i++) {
				var dtoItem = dtoList[i];

				if(dtoItem.src !== undefined) {

					// If the DTO is a string find the DTO
					if(typeof dtoItem.src === 'string') {
						var _DTO = module.getDTO(dtoItem.src);

						if(_DTO !== undefined) {

							// Sets it to the local _requestBody, _requestParams, or _requestQuery variable
							switch(dtoItem.res) {
								case '_requestBody':
									_requestBody = _DTO.$get();
									break;
								case '_requestParams':
									_requestParams = _DTO.$get();
									break;
								case '_requestQuery':
									_requestQuery = _DTO.$get();
									break;
							}
						} else {
							snooze.fatal(new snooze.exceptions.RouteDTONotFoundException(path, method, dtoItem.src));
						}

					// If the DTO is an object create a on-the-fly DTO
					} else {
						var dto = _dto(method+':'+path+':'+dtoItem.dtoNameType, module);
						var json = dtoItem.src;

						module.defineDTOFromJSON(dto, json);

						switch(dtoItem.res) {
							case '_requestBody':
								_requestBody = dto.$get();
								break;
							case '_requestParams':
								_requestParams = dto.$get();
								break;
							case '_requestQuery':
								_requestQuery = dto.$get();
								break;
						}
					}
				}
			}
		}

		// If the route defines it's expected response find/generate the response DTOs
		if(options.response) {

			// Save the original unaltered response for API generation
			_responseOrig = JSON.parse(JSON.stringify(options.response));

			var newSet = {};
			for(var code in options.response) {
				try {
					code = JSON.parse(code);
				} catch(e){}

				// If the code is set to a string representing an array of numbers e.g. [200,201,204]
				// 		then loop through the array and process each response code
				if(_.isArray(code)) {
					for(var i = 0; i < code.length; i++) {
						var _code = code[i];

						// We want each code to have a reference to it's own object
						newSet[_code] = JSON.parse(JSON.stringify(options.response[code]));
					}
				} else {
					newSet[code] = options.response[code];
				}
			}

			options.response = newSet;
			_response = options.response;

			for(var code in options.response) {
				var res = options.response[code];

				// If the DTO is a string find the DTO
				if(typeof res === 'string') {
					var _DTO = module.getDTO(res);

					if(_DTO !== undefined) {

						// Sets it to the local _requestBody, _requestParams, or _requestQuery variable
						options.response[code] = _DTO.$get();
					} else {
						snooze.fatal(new snooze.exceptions.RouteDTONotFoundException(path, method, res));
					}

				// If the DTO is an object create a on-the-fly DTO
				} else {
					var json = res;
					if(json !== null) {
						var dto = _dto(method+':'+path+':'+code, module);
						module.defineDTOFromJSON(dto, json);

						options.response[code] = dto.$get();
					}
				}
			}
		}
	}

	// Create the bind method used to compile the route
	var bind = function(app) {
		var _res = null;

		$q = _module.getService('$q');
		
		var resource = false;
		mthd = _method;

		// If the method is a resource set the literal method to get
		if(_method === 'resource') {
			isResource = true;
			mthd = 'get';
		} else {
			var ctrl = _module.getController(_controller);
			if(ctrl !== undefined) {
				var act = ctrl[_action];
				if(act === undefined) {
					var errStr = 'Cannot call ' + _action + ' on ' + _controller + '. Route ' + _path + ' method ' + _method + '.';
					snooze.fatal(new snooze.exceptions.RouteRuntimeException(errStr));
				}
			} else {
				var errStr = 'Controller ' + _controller + ' does not exist for route ' + _path + '.';
				snooze.fatal(new snooze.exceptions.RouteRuntimeException(errStr));
			}
		}

		app[mthd](_path, function(req, res) {

			if($routeConfig.originAllowed() === true) {
				res.setHeader('Access-Control-Allow-Origin', '*');
			    res.setHeader('Access-Control-Allow-Methods', mthd.toUpperCase());
			    res.setHeader('Access-Control-Max-Age', 1728000);
			    res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
			}

			// Wrap the res object so we can modify send
			_res = {
				this: res,
				status: res.status,
				set: res.set,
				get: res.get,
				cookie: res.cookie,
				clearCookie: res.clearCookie,
				redirect: res.redirect,
				location: res.location,
				send: function(code, msg) {
					if(typeof msg === 'string') {
						msg = {message:msg};
					}

					var result = null;
					var _respDTO = null;
					var files = {};

					// If the defined responses is not null
					if(_response != null && _response !== undefined) {
						var _respDTO = _response[code];

						// Test the msg with the defined response DTO
						if(_respDTO !== undefined && _respDTO !== null) {
							result = _respDTO.$test(msg);
						}
					}

					// if _respDTO is not null and result is null (no error returned) send the response
					if(_respDTO !== null && _respDTO !== undefined && result === null) {
						files = req.files || {};

						// create the DTO off the message
						msg = _respDTO.$create(msg);
						res.status(code).send(msg);

					// if _respDTO is not null and the result is not null then an error was returned
					} else if(_respDTO !== null && _respDTO !== undefined && _respDTO !== undefined) {
						res.status(500).send({message: 'SERVER ERROR in Route ' + _method + ' => ' + _path + ' : ' + result});

					// if _respDTO is null then no response DTO was defined and we can send the response as is
					} else {
						res.status(code).send(msg);
					}

					// Remove temporary files created by this request
					_cleanupTmp(files);
				},
				type: res.type,
				format: res.format,
				attachment: res.attachment,
				sendfile: res.sendfile,
				download: res.download,
				links: res.links,
				locals: res.locals,
				render: res.render
			};

			_testRequestDTO(req).then(function() {
				_testValidators(req).then(function() {
					_runReq(_res, req);
				}).fail(function(msg) {
					_rejectReq(_res, msg);
				});
			}).fail(function(result) {
				if(result) {
					if(result.stack) {
						_rejectReq(_res, $RouteResponse(400, {message: result.stack}));
					} else {
						if(result.message) {
							_rejectReq(_res, $RouteResponse(400, {message: result.message+''}));
						} else {
							_rejectReq(_res, $RouteResponse(400, {message: result+''}));
						}
					}
				} else {
					_rejectReq(_res, $RouteResponse(500, {message: new snooze.exceptions.RouteRuntimeException('unknown').stack}));
				}
			});
		});
	}

	// Runs after validators
	var _runReq = function(_res, req) {
		// If the request was a resource read the file and return it with the correct MIME-Type
		if(isResource) {
			var filepath = process.cwd() + req.url;

			// If the file does not exist return 404 not found.
			if(fs.existsSync(filepath)) {
				var stats = fs.statSync(filepath);

				// If the 'file' requested is a directory return Forbidden
				if(stats.isDirectory(filepath)) {
					_res.set.apply(_res.this, ['content-type', 'text/html']);
					_res.send(403, 'Forbidden');

				// If all goes well detect the MIME-Type and return the file
				} else {
					_Magic.detectFile(filepath, function(err, result) {
						_res.set.apply(_res.this, ['content-type', result])
						_res.send(200, fs.readFileSync(process.cwd() + req.url));
					})
				}
			} else {
				_res.set.apply(_res.this, ['content-type', 'text/html']);
				_res.send(404, 'Not Found');
			}

		// Handle the request
		} else {
			if(_contentType) {
				_res.set.apply(_res,this, ['content-type', _contentType]);
			} else {
				_res.set.apply(_res.this, ['content-type', 'application/json']);
			}

			// Cleanup request and send request data
			var params = req.params || {};
			var query = req.query || {};
			var body = req.body || {};
			var files = req.files || {};
			var basicAuth = {
				username: '',
				password: ''
			};

			// Pass basicauth- because we're nice
			var header = req.headers['authorization'] || null;
			if(header !== null) {
				token = header.split(/\s+/).pop()||'';
				auth = new Buffer(token, 'base64').toString();
				parts = auth.split(/:/);

				username = parts[0];
				password = parts[1];

				basicAuth.username = username;
				basicAuth.password = password;
			}

			// Get the controller to process this request
			ctrl = _module.getController(_controller);
			if(ctrl !== undefined) {

				// If the controller and method (action) are found run the controller's method
				if(ctrl[_action] !== undefined) {
					var defer = $q.defer();
					
					// Call the controller's method
					ctrl[_action](defer, {'params': params, 'query': query, 'body': body, 'files': files, 'basicAuth': basicAuth});

					// If the controller resolves the defer send the resolved data
					defer.promise.then(function() {
						if(arguments[0] !== undefined && arguments[1] !== undefined) {
							methodResp = $RouteResponse(arguments[0], arguments[1]);
						} else {
							methodResp = arguments[0];
						}

						var code = 200;
						var msg = {};

						// if the response is an array the first index is the code
						//		the second is the message
						if(_.isArray(methodResp)) {
							code = methodResp[0];
							msg = methodResp[1];

						// If the response is a $RouteResponse instance send it's contents
						} else if(methodResp.isRouteResponse) {
							code = methodResp.code;
							msg = methodResp.msg;

						// The methodResp is the message. Try to guess the response code
						} else {
							switch(mthd) {
								case 'get':
									code = 200;
									break;
								case 'post':
									code = 201;
									break;
								case 'put':
									code = 204;
									break;
								case 'delete':
									code = 204;
									break;
							}

							msg = methodResp;
						}

						_res.send(code, msg);
					// If the controller rejects the defer send an error
					}).fail(function() {
						if(arguments[0] !== undefined && arguments[1] !== undefined) {
							methodResp = $RouteResponse(arguments[0], arguments[1]);
						} else {
							methodResp = arguments[0];
						}

						var code = 500;
						var msg = {};

						// if the response is an array the first index is the code
						//		the second is the message
						if(_.isArray(methodResp)) {
							code = methodResp[0];
							msg = methodResp[1];

						// If the response is a $RouteResponse instance send it's contents
						} else if(methodResp.isRouteResponse) {
							code = methodResp.code;
							msg = methodResp.msg;

						// Send the methodResp as the message. 500 is the default status
						} else {
							msg = methodResp;
						}

						_res.send(code, msg);
					})

				// Controller found but the method (action) was not
				} else {
					var errStr = 'Cannot call ' + _action + ' on ' + _controller + '. Route ' + _path + ' method ' + _method + '.';
					_res.send(500, errStr);
				}

			// Controller was not found
			} else {
				var errStr = 'Controller ' + _controller + ' does not exist for route ' + _path + '.';
				_res.send(500, errStr);
			}
		}
	};

	// Validators should handle this..
	var _rejectReq = function(_res, methodResp) {
		if(methodResp !== undefined) {
			var code = 500;
			var msg = {};

			// if the response is an array the first index is the code
			//		the second is the message
			if(_.isArray(methodResp)) {
				code = methodResp[0];
				msg = methodResp[1];

			// If the response is a $RouteResponse instance send it's contents
			} else if(methodResp.isRouteResponse) {
				code = methodResp.code;
				msg = methodResp.msg;

			// Send the methodResp as the message. 500 is the default status
			} else {
				msg = methodResp;
			}

			if(_module.inTestMode() && $routeConfig.expectingErrors() === false) {
				snooze.fatal(new snooze.exceptions.RouteRuntimeException(msg.message, _method, _path));
			}

			_res.send(code, msg);
		} else {
			var errStr = 'Validation failed for ' + _method + ' => ' + _path + ' but no rejection process defined. Validation should reject with a string, array, or RouteResponse';
			_res.send(500, errStr);
		}
	};

	// Test the params, body, and query against and DTO defined
	// @param req 	The express request object
	// Returns a promise
	var _testRequestDTO = function(req) {
		var defer = $q.defer();

		var dtoTesters = [
			{
				src: _requestParams,
				data: req.params
			},
			{
				src: _requestBody,
				data: req.body
			},
			{
				src: _requestQuery,
				data: req.query
			}
		];

		for(var i = 0; i < dtoTesters.length; i++) {
			var tester = dtoTesters[i];

			// If the DTO is defined it can be tested
			if(tester.src !== null) {
				// Set default if not exists
				tester.src.$defaults(tester.data);

				// Test the data against the DTO
				var result = tester.src.$test(tester.data);

				// If a result is returned there is an error
				if(result !== null) {
					defer.reject(result);
				}
			}
		}

		defer.resolve();

		return defer.promise;
	}

	// Test the request against the defined validators.
	// @param req 	The express request object
	// Returns a promise
	var _testValidators = function(req) {
		var defer = $q.defer();

		// Validators

		if(_validatorTree !== null) {
			if(_validatorTree[0].defer !== undefined) {
				_validatorTree[0].defer();
			}

			_validatorTree[0].test(req).then(function() {
				defer.resolve();
			}).fail(function(e) {
				var response = e;
		        if(response.response) {
		          response = response.response;
		        }

				defer.reject(response);
			});
		} else {
			defer.resolve();
		}

		return defer.promise;
	}

	// Removes temporary files created by the request
	var _cleanupTmp = function(filesObj) {
		for(var key in filesObj) {
			var img = filesObj[key];
			var path = img.path;

			var path = process.cwd() + '/' + path;

			if(fs.existsSync(path)) {
				fs.unlink(path, function(err) {
					snooze.fatal(new snooze.exceptions.RouteRuntimeException(err));
				});
			}
		}
	};

	var getPath = function() {
		return _path;
	};

	var getMethod = function() {
		return _method;
	};

	var getController = function() {
		return _controller;
	};

	var getAction = function() {
		return _action;
	};

	var getRequest = function() {
		return _requestOrig;
	};

	var getResponse = function() {
		return _responseOrig;
	};

	var getDescription = function() {
		return _description;
	};

	var getValidators = function() {
		return _validators;
	};

	return {
		getRequest: getRequest,
		getResponse: getResponse,
		getPath: getPath,
		getMethod: getMethod,
		getController: getController,
		getAction: getAction,
		getDescription: getDescription,
		getValidators: getValidators,
		bind: bind
	}
}

module.exports = _new;