var Module = require('./module');
var fs = require('fs');

var _new = function() {
	var _modules = [];
	var _config = null;
	var _exceptions = {};

	var moduleExists = function(nm) {
		var mod = getModule(nm);

		if(mod === undefined) {
			return false;
		}

		return true;
	}

	var getModule = function(nm) {
		for(var i = 0 ; i < _modules.length; i++) {
			var module = _modules[i];
			if(module.getName() === nm) {
				return module;
			}
		}
	};

	var createModule = function(nm, modules) {
		var module = Module(nm, modules);
		module.init();
		
		_modules.push(module);
		return module;
	};

	var module = function(nm, modules) {
		if(moduleExists(nm)) {
			var mod = getModule(nm);
			
			if(typeof modules === 'object' && modules.length > 0) {
				mod.addModules(modules);
			}

			return mod;
		} else {
			var mod = createModule(nm, modules);
			mod.importBaseServices();

			return mod;
		}
	};

	var fatal = function(err) {
		fatalCallback(err);
	};

	fatal.toString = function() {
		return fatalCallback+'';
	};

	var fatalCallback = function(err) {
		throw err;
	}

	var onfatal = function(fn) {
		fatalCallback = fn;
	};

	var getConfig = function() {
		return JSON.parse(JSON.stringify(_config));
	};

	// Load exceptions

	var files = fs.readdirSync(__dirname + '/exceptions');
	for(var i = 0; i < files.length; i++) {
		var file = files[i];
		var nm = file.replace('.js', '');

		eval(nm + " = require('./exceptions/' + files[i]);");
		eval('_exceptions.' + nm + " = require('./exceptions/' + files[i]);");
	}

	// Check if project json exists

	if(fs.existsSync(process.cwd() + '/snooze.json')) {
		try {
			_config = JSON.parse(fs.readFileSync(process.cwd() + '/snooze.json'));
		} catch(e) {
			fatal(new UnparsableProjectJSONException());
		}
	} else {
		fatal(new ProjectJSONNotFoundException());
	}

	return {
		'exceptions': _exceptions,
		'fatal': fatal,
		'onfatal': onfatal,
		'module': module,
		'getConfig': getConfig,
		'moduleExists': moduleExists
	};
}

module.exports = _new();