var _ = require('lodash');

/**
 * A SnoozeJS DTO
 * @constructor
 * @param {string} nm - The name of the DTO
 * @param {object} module - The module the DTO will belong to
 */
var DTO = function(nm, module) {
	/**
	 * @access private
	 * @ignore
	 * The SnoozeJS NPM Module
	 */
	var snooze = require('./snooze');

	/**
	 * @access private
	 * @ignore
	 * The name of the DTO
	 */
	var _name = null;

	/**
	 * @access private
	 * @ignore
	 * The properties of the DTO
	 */
	var _properties = [];

	/**
	 * @access private
	 * @ignore
	 * The custom methods for the DTO
	 */
	var _methods = {};

	/**
	 * @access private
	 * @ignore
	 * The recorded injected services
	 */
	var _services = [];

	/**
	 * @access private
	 * @ignore
	 * The recorded injected dtos
	 */
	var _dtos = [];

	/**
	 * @access private
	 * @ignore
	 * The recorded injected daos
	 */
	var _daos = [];

	/**
	 * @access private
	 * @ignore
	 * Boolean if the DTO is in strict mode
	 */
	var _strict = false;

	/**
	 * @access private
	 * @ignore
	 * Boolean if the DTO is should practice delayed injection
	 */
	var _delayMethodInjection = true;

	/**
	 * @access private
	 * @ignore
	 * Array of delayed injectable DTOs
	 */
	var _delayedDTOs = [];

	if(nm === null || nm === undefined || nm.length < 1) {
		snooze.fatal(new snooze.exceptions.DTONameNotDefinedException());
	} else {
		_name = nm;
	}

	/**
	 * DTOInstance
	 * An instance of the defined DTO
	 * @constructor
	 * @alias DTOInstance
	 */
	var _DTOInstance = function() {
		/**
		 * @access private
		 * @ignore
		 * The actual values of the instance
		 */
		var _values = {};

		/**
		 * Initializes instance values to an empty object
		 */
		var $startNewInstance = function() {
			_values = {};
		};

		/**
		 * Creates a new DTO instance from the supplied JSON object.
		 * @param {object} obj - A JSON object
		 * return {object} A JSON Object.
		 */
		var $create = function(obj) {
			$startNewInstance();

			for(var key in obj) {
				_set(key, obj[key]);
			}

			$defaults(_values);

			for(var i = 0; i < _properties.length; i++) {
				var Prop = _properties[i];
				var name = Prop.name;

				if(Prop.required === true) {
					if(obj[name] === undefined) {
						snooze.fatal(new snooze.exceptions.DTOMissingPropertyException(nm, key));
					}
				}
			}

			return _get();
		};

		/**
		 * Runs the provided data through the DTO applying the defaults.
		 * If the JSON object supplied has values for the defaults the
		 * defaults will not overwrite the existing values. Does not manipulate
		 * the instance itself.
		 *
		 * @param {object} obj - A JSON object
		 */
		var $defaults = function(obj) {
			for(var i = 0; i < _properties.length; i++) {
				var property = _properties[i];
				var key = property.name;
				var val = obj[key];
				if(val === undefined) {
					var defVal = property.default;
					if(defVal !== undefined && defVal !== null) {
						obj[key] = defVal;
					}
				}
			}
		}

		/**
		 * Initializes the instance _values with defaults
		 */
		var $init = function() {
			for(var i = 0; i < _properties.length; i++) {
				var property = _properties[i];

				var def = property.default;
				var key = property.name;

				if(def) {
					_set(key);
				}
			}
		};

		/**
		 * @access private
		 * @ignore
		 * Sets a key of the instance to value
		 * @param {string} key - The key of the instance to set
		 * @param {string} value - The value of the key
		 */
		var _set = function(key, value) {
			if(value === undefined) {
				value = _getDefValue(key);
			}

			value = _normalizeType(key, value);
			
			if(_keyExists(key) && value !== undefined) {
				if(_typeSupported(key, value)) {
					_values[key] = value;
				} else {
					snooze.fatal(new snooze.exceptions.DTOUnsupportedTypeException(nm, key, _getType(key), value));
				}
			} else {
				if(_strict === true) {
					snooze.fatal(new snooze.exceptions.DTOUndefinedKeyException(nm, key));
				}
			}
		};

		/**
		 * @access private
		 * @ignore
		 * Gets the default value of the supplied key
		 * @param {string} key - The key
		 * @return {string} The default value (or undefined)
		 */
		var _getDefValue = function(key) {
			for(var i = 0; i < _properties.length; i++) {
				var prop = _properties[i];

				if(prop.name === key) {
					return prop.default;
				}
			}

			return undefined;
		};

		/**
		 * @access private
		 * @ignore
		 * Gets the _values
		 * @return {object} The JSON object of the instance
		 */
		var _get = function() {
			return _values;
		};

		/**
		 * Tests if the JSON object is valid for the DTO.
		 * Returns an exception if unable to conver the JSON object
		 * to a DTO or null if no problems are found.
		 *
		 * @param {object} obj - The JSON Objecct
		 * @return {object} The exception (or null)
		 */
		var $test = function(obj) {
			for(var key in obj) {
				var value = obj[key];
				value = _normalizeType(key, value);

				if(_keyExists(key) && value !== undefined) {
					if(_typeSupported(key, value) === false) {
						return new snooze.exceptions.DTOUnsupportedTypeException(nm, key, _getType(key), value);
					}
				} else {
					if(_strict === true) {
						return new snooze.exceptions.DTOUndefinedKeyException(nm, key);
					}
				}
			}

			for(var i = 0; i < _properties.length; i++) {
				var Prop = _properties[i];
				var name = Prop.name;

				if(Prop.required === true) {
					if(obj[name] === undefined) {
						return new snooze.exceptions.DTOMissingPropertyException(nm, key);
					}
				}
			}

			return null;
		};

		/**
		 * @access private
		 * @ignore
		 *
		 * Attempts to normalize the value to the correct type.
		 * Ex: If Age is an int and '30' is supplied it will be converted
		 * to the int value 30. If the value can be normalized the
		 * normalized value is return. Otherwise the original value
		 * is returned.
		 *
		 * @param {string} key - The key of the value
		 * @param {string} value - The value you want to normalize
		 * @return {mixed} The normalized value
		 */
		var _normalizeType = function(key, value) {
			if(_keyExists(key)) {
				var type = _getType(key);

				switch(type) {
					case 'string':
						if(_.isString(value)) {
							return value;
						} else if(_.isNumber(value)) {
							return value + '';
						} else {
							return value;
						}
					case 'int':
						if(_.isString(value)) {
							if(_.isNaN(parseInt(value)) === false) {
								return parseInt(value);
							}
						} else if(_.isNumber(value)) {
							return value;
						} else {
							return value;
						}
					case 'number':
						if(_.isString(value)) {
							if(_.isNaN(parseFloat(value)) === false) {
								return parseFloat(value);
							}
						} else if(_.isNumber(value)) {
							return value;
						} else {
							return value;
						}
					case 'boolean':
						return Boolean(value);
					case 'array':
						return value;
					case 'object':
						return value;
				}
			}
			return value;
		};

		this.$defaults = $defaults;
		this.$create = $create;
		this.$test = $test;
		this.$init = $init;
		this.$startNewInstance = $startNewInstance;
	};

	/**
	 * DTOProperty
	 * @constructor
	 * @alias DTOProperty
	 */
	var _DTOProperty = function() {
		/**
		 * The name of the property
		 */
		this.name = '';
		/**
		 * The type of the property
		 */
		this.type = '';
		/**
		 * The description of the property
		 */
		this.description = '';
		/**
		 * The example of the property
		 */
		this.example = '';
		/**
		 * The default value of the property
		 */
		this.default = '';
		/**
		 * Boolean if the property is required or not
		 */
		this.required = false;
	};

	/**
	 * Gets the name of the Controller
	 * @return {string} The name of the Controller
	 */
	var getName = function() {
		return _name;
	};

	/**
	 * Adds a new property to the DTO
	 * @param {string} name - The name (or key) of the property
	 * @params {string} type - The type of the property
	 * @params {mixed} def - The default value of the property
	 * @params {string} description - The description of the property
	 * @params {mixed} example - An exmple of the property
	 * @params {boolean} required - If the property is required
	 */
	var addProperty = function(name, type, def, description, example, required) {
		var Prop = new _DTOProperty();
		
		if(_typeExists(type)) {
			Prop.name = name;
			Prop.type = type;
			Prop.default = def;
			Prop.description = description;
			Prop.example = example;
			Prop.required = required;

			_properties.push(Prop);

			if(!_typeSupported(name, def)) {
				snooze.fatal(new snooze.exceptions.DTOUnsupportedTypeException(nm, name, type, def));
			}
		} else {
			snooze.fatal(new snooze.exceptions.DTOTypeNotFoundException(nm, name, type));
		}
	};

	/**
	 * Gets the defined properties
	 * @return {array} Properties
	 */
	var getProperties = function() {
		return _properties;
	};

	/**
	 * Inject function gets a DTO Instance
	 * @return {object} A DTO Instance
	 */
	var $get = function() {
		var _DTO = new _DTOInstance();

		if(_delayMethodInjection === true) {
			_delayedDTOs.push(_DTO);
		} else {
			_injectMethods(_DTO);
			_DTO.$init();
		}

		return _DTO;
	};

	/**
	 * @access private
     * @ignore
	 * Injects custom methods for the DTO in a DTO Instance
	 * @param {object} _DTO - The DTO Instance
	 */
	var _injectMethods = function(_DTO) {
		for(var method in _methods) {
			_DTO[method] = function() {
				return _DTO.$create(_methods[method].apply(null, arguments));
			};

			_DTO[method].toString = function() {
				return _methods[method]+'';
			};
		}
	};

	/**
	 * @access private
     * @ignore
	 * Checks if the key exists
	 * @param {string} nm - The name of the key
	 * @return {boolean} Returns true if the key exists
	 */
	var _keyExists = function(nm) {
		for(var i = 0; i < _properties.length; i++) {
			if(_properties[i].name === nm) {
				return true;
			}
		}

		return false;
	};

	/**
	 * @access private
     * @ignore
	 * Gets the property definition of the supplied key
	 * @param {string} nm - The key of the property to get
	 * @return {object} The property definition JSON
	 */
	var _getProperty = function(nm) {
		for(var i = 0; i < _properties.length; i++) {
			if(_properties[i].name === nm) {
				return _properties[i];
			}
		}

		snooze.fatal(new Error('unkown property ' + nm + ' in DTO ' + _name));
	};

	/**
	 * @access private
     * @ignore
	 * Checks if the type is a DTO (noted by @)
	 * @param {string} type - The string type Ex: 'int', 'string', '@UserDTO'
	 * @return {boolean} Returns true if the type is a DTO
	 */
	var _isDTO = function(type) {
		if(typeof type === 'string') {
			if(type[0] === '@') {
				var DTO = module.getDTO(type.substr(1));
				if(DTO !== undefined) {
					return true;
				}
			}
		}

		return false;
	}

	/**
	 * @access private
     * @ignore
	 * Checks if the type is a valid type
	 * @param {string} type - The string type Ex: 'int', 'string', '@UserDTO'
	 * @return {boolean} Returns true if the type is valid
	 */
	var _typeExists = function(type) {
		if(_isDTO(type)) {
			return true;
		}

		switch(type) {
			case 'string':
				return true;
			case 'int':
				return true;
			case 'number':
				return true;
			case 'array':
				return true;
			case 'object':
				return true;
			case 'boolean':
				return true;
		}

		return false;
	}

	/**
	 * @access private
     * @ignore
	 * Checks if the type of the key and its value is valid
	 * @param {string} key - The key of the property to check
	 * @param {mixed} value - The value to test
	 * @return {boolean} Returns true if the value is valid for the key
	 */
	var _typeSupported = function(key, value) {
		var property = _getProperty(key);

		if(value === null) {
			return true;
		}

		if(property !== undefined) {
			switch(property.type) {
				case 'string':
					if(_.isString(value)) {
						return true;
					}

					return false;
				case 'int':
					if(_.isNumber(value)) {
						if((value + '').indexOf('.') === -1) {
							return true;
						}
					}

					return false;
				case 'number':
					if(_.isNumber(value)) {
						return true;
					}

					return false;
				case 'array':
					if(_.isArray(value)) {
						return true;
					}

					return false;
				case 'object':
					if(_.isObject(value)) {
						return true;
					}

					return false;
				case 'boolean':
					if(_.isBoolean(value)) {
						return true;
					}

					return false;
				default:
					if(_isDTO(property.type)) {
						if(_.isObject(value)) {
							return true;
						}
					}
			}
		}

		return false;
	};

	/**
	 * @access private
     * @ignore
	 * Gets the type defined for the key
	 * @param {string} nm - The key of the property to check
	 * @return {string} The type of the property
	 */
	var _getType = function(nm) {
		return _getProperty(nm).type;
	};

	/**
	 * Sets the custom methods for all DTO instances created
	 * from this DTO
	 *
	 * @param {array} methods - An array of methods (post injection)
	 */
	var setMethods = function(methods) {
		for(var key in methods) {
			_methods[key] = function() {
				try {
					return methods[key].apply(null, arguments);
				} catch(e) {
					snooze.fatal(e);
				}
			};

			_methods[key].toString = function() {
				return methods[key]+'';
			};
		}
	};

	/**
	 * Returns an object of custom methods
	 *
	 * @return {object} methods - An object of named functions
	 *
	 */

	 var getMethods = function() {
	 	return _methods;
	 };

	/**
     * @ignore
	 * Records an injected Service in the DTO
	 */
	var __addSrv = function(srv) {
		_services.push(srv);
	};

	/**
	 * @ignore
	 * Records an injected DTO in the DTO
	 */
	var __addDTO = function(dto) {
		_dtos.push(dto);
	};

	/**
	 * @ignore
	 * Records an injected DAO in the DTO
	 */
	var __addDAO = function(dao) {
		_daos.push(dao);
	};

	/**
	 * @ignore
	 * Gets the recorded Services for this DTO
	 * @return {array} An array of Services
	 */
	var __getServices = function() {
		return _services;
	};

	/**
	 * @ignore
	 * Gets the recorded DTOs for this DTO
	 * @return {array} An array of DTOs
	 */
	var __getDTOs = function() {
		return _dtos;
	};

	/**
	 * @ignore
	 * Gets the recorded DAOs for this DTO
	 * @return {array} An array of DAOs
	 */
	var __getDAOs = function() {
		return _daos;
	};

	/**
	 * Sets or returns the strict mode of the DTO
	 * @param {boolean} [bool] - Optional boolean
	 *
	 * @return {boolean} If no bool param is defined
	 * returns true if the DTO is in strict mode
	 */
	var isStrict = function(bool) {
		if(bool !== undefined) {
			_strict = bool;
		} else {
			return _strict;
		}
	};

	/**
	 * @ignore
	 * If compilation hasn't completed delay method injection
	 */
	var delayMethodInjection = function(bool) {
		_delayedDTOs.splice(0);
		_delayMethodInjection = bool;
	};

	/**
	 * @ignore
	 * Complete method injection
	 */
	var completeDTOInjection = function() {
		_.each(_delayedDTOs, function(_DTO) {
			_injectMethods(_DTO);
		});
		delayMethodInjection(false);
	}

	return {
		getName: getName,
		getProperties: getProperties,
		addProperty: addProperty,
		setMethods: setMethods,
		getMethods: getMethods,
		isStrict: isStrict,
		delayMethodInjection: delayMethodInjection,
		completeDTOInjection: completeDTOInjection,
		__getServices: __getServices,
		__getDTOs: __getDTOs,
		__getDAOs: __getDAOs,
		__addSrv: __addSrv,
		__addDTO: __addDTO,
		__addDAO: __addDAO,
		$get: $get,
		toType: function() {
			return 'DTO';
		},
		compiled: false,
	}
}

module.exports = DTO;