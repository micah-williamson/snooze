(function() {
	'use strict';

	var Module = require('./module');
	var fs = require('fs');

	var Snooze = function() {
		this.modules = [];
		this.pathToSelf = __dirname;
		this.modulePaths = {};
		this.EntityGroup = require('./entityGroup');
		this.Entity = require('./entity');
		this.Util = require('./util');

		// Check if project json exists

		if(fs.existsSync(process.cwd() + '/snooze.json')) {
			try {
				this.config = JSON.parse(fs.readFileSync(process.cwd() + '/snooze.json'));
			} catch(e) {
				throw new Error('Unable to process project JSON.');
			}
		} else {
			this.config = {};
		}
	};

	Snooze.prototype.modules = null;
	Snooze.prototype.config = null;
	Snooze.prototype.modulePaths = null;
	Snooze.prototype.EntityGroup = null;
	Snooze.prototype.Entity = null;
	Snooze.prototype.Util = null;

	Snooze.prototype.moduleExists = function(nm) {
		var mod = this.getModule(nm);

		if(mod === undefined) {
			return false;
		}

		return true;
	};

	Snooze.prototype.getModule = function(nm) {
		for(var i = 0 ; i < this.modules.length; i++) {
			var module = this.modules[i];
			if(module.getName() === nm) {
				return module;
			}
		}
	};

	Snooze.prototype.createModule = function(nm, modules) {
		var module = new Module(nm, modules, this);
		var __directory;
		module.registerImportProcessesFromPath('importProcesses/importEntityGroups.js', this.pathToSelf + '/');
		module.registerImportProcessesFromPath('importProcesses/importEntities.js', this.pathToSelf + '/');

		module.importModuleConfigPreprocessors();
		module.importModuleImportProcesses();
		module.preprocessConfig();
		module.importModules();
		
		this.modules.push(module);
		return module;
	};

	Snooze.prototype.module = function(nm, modules) {
		if(this.moduleExists(nm)) {
			return this.getModule(nm);
		} else {
			if(typeof modules === 'object' && modules.length > 0) {
				for(var i = 0; i < modules.length; i++) {
					var submod = modules[i];

					if(!this.moduleExists(submod)) {

						var path = require.resolve(submod);
						var parts = path.split('/');
						parts.pop();
						path = parts.join('/');
						this.registerModulePath(submod, path);

						require(submod);
					}
				}
			}

			return this.createModule(nm, modules);
		}
	};

	Snooze.prototype.fatal = function(err) {
		this.fatalCallback(err);
	};

	Snooze.prototype.fatal.toString = function() {
		return fatalCallback+'';
	};

	Snooze.prototype.fatalCallback = function(err) {
		throw err;
	};

	Snooze.prototype.onfatal = function(fn) {
		this.fatalCallback = fn;
	};

	Snooze.prototype.getConfig = function() {
		return JSON.parse(JSON.stringify(this.config));
	};

	Snooze.prototype.registerModulePath = function(module, path) {
		this.modulePaths[module] = path;
	};

	Snooze.prototype.clear = function() {
		this.modules.splice(0);
		for(var key in this.modulePaths) {
			delete this.modulePaths[key];
		}
	};

	module.exports = new Snooze();
})();