(function() {
	'use strict';

	var colors = require('colors'); // for logging
	var fs = require('fs');
	var glob = require('glob');
	var Util = require('./Util');
	var _ = require('lodash');
	var EntityManager = require('./entityManager');

	/**
	 * A SnoozeJS Module
	 * @constructor
	 * @param {string} nm - The name of the module
	 * @param {array} modules - Array of module names to inject
	 */
	var Module = function(nm, modules, snooze) {
		this.snooze = snooze;

		if(nm === null || nm === undefined || nm.length < 1) {
			throw new Error('Module name note defined.');
		}

		this.name = nm;
		this.snoozeConfig = this.snooze.getConfig();
		this.runs = [];
		this.configs = [];
		this.modules = modules || [];
		this.EntityManager = new EntityManager(this, snooze);
		this.importedModules = {};
		this.importProcesses = [];
		this.configPreprocessors = [];

		this.importModuleConfigPreprocessors();
		this.importModuleImportProcesses();
		this.preprocessConfig();

		// TODO: move this to a better location
		var self = this;
		this.EntityManager.defineReservedInjectable('$config', function() {
			return self.getConfig();
		});

		this.importModules();
	};

	Module.prototype.snooze = null;
	Module.prototype.name = null;
	Module.prototype.logging = true;
	Module.prototype.isAwake = false;
	Module.prototype.snoozeConfig = null;
	Module.prototype.runs = null;
	Module.prototype.configs = null;
	Module.prototype.modules = null;
	Module.prototype.importedModules = null;
	Module.prototype.EntityManager = null;
	Module.prototype.importProcesses = null;

	// Modifiers

	Module.prototype.initEnv = function() {
		var mode = this.snoozeConfig.mode;
		var env = this.snoozeConfig.modes[mode].env;

		for(var key in env) {
			var val = env[key];
			process.env[key] = val;
		}

		return this;
	};

	Module.prototype.mergeStartingConfig = function(startingConfig) {
		for(var key in startingConfig) {
			this.snoozeConfig[key] = startingConfig[key];
		}

		return this;
	};

	Module.prototype.wakeup = function(startingConfig) {
		this.isAwake = true;
		this.mergeStartingConfig(startingConfig);
		this.EntityManager.compile();
		this.doConfigs();
		this.doRuns();

		return this;
	};

	Module.prototype.addModules = function(modules) {
		for(var i = 0; i < modules.length; i++) {
			this.modules.push(modules[i]);
		}

		return this;
	};

	Module.prototype.importProcess = function(processFunc) {
		var func = processFunc(this.importProcesses);
		if(func) {
			this.importProcesses.push(func);
		}

		return this;
	};

	Module.prototype.configPreprocessor = function(processFunc) {
		var func = processFunc(this.configPreprocessors);
		if(func) {
			this.configPreprocessors.push(func);
		}

		return this;
	};

	Module.prototype.importModuleConfigPreprocessors = function() {
		var configPreprocessors = this.configPreprocessors;
		var i, k;

		for(i = 0; i < this.modules.length; i++) {
			var mod = this.snooze.module(this.modules[i]);
			var processes = mod.getConfigPreprocessors();
			for(k = 0; k < processes.length; k++) {
				var process = processes[k];
				var duplicate = false;
				for(var j = 0; j < configPreprocessors.length; j++) {
					if(configPreprocessors[j]+'' === process+'') {
						duplicate = true;
						break;
					}
				}

				if(!duplicate) {
					configPreprocessors.push(process);
				}
			}
		}
	};

	Module.prototype.importModuleImportProcesses = function() {
		var importProcesses = this.importProcesses;
		var i, k;

		for(i = 0; i < this.modules.length; i++) {
			var mod = this.snooze.module(this.modules[i]);
			var processes = mod.getImportProcesses();
			for(k = 0; k < processes.length; k++) {
				var process = processes[k];
				var duplicate = false;
				for(var j = 0; j < importProcesses.length; j++) {
					if(importProcesses[j]+'' === process+'') {
						duplicate = true;
						break;
					}
				}

				if(!duplicate) {
					importProcesses.push(process);
				}
			}
		}
	};

	Module.prototype.preprocessConfig = function() {
		for(var i = 0; i < this.configPreprocessors.length; i++) {
			var configPreprocessor = this.configPreprocessors[i];
			configPreprocessor(this.snoozeConfig);
		}
	};

	Module.prototype.importModules = function() {
		var importProcesses = this.importProcesses;
		var i, k;

		for(i = 0; i < this.modules.length; i++) {
			var modName = this.modules[i];
			if(!this.importedModules[modName]) {
				var _mod = this.snooze.module(modName);
				this.log(('Importing ' + _mod.getName()).blue);

				for(k = 0; k < importProcesses.length; k++) {
					var importProcess = importProcesses[k];
					importProcess(_mod, this);
				}

				for(var key in _mod.importedModules) {
					this.importedModules[key] = true;
				}

				this.importedModules[modName] = true;
			}
		}

		return this;
	};

	Module.prototype.disableLogging = function() {
		this.logging = false;

		return this;
	};

	Module.prototype.enableLogging = function() {
		this.logging = true;

		return this;
	};

	Module.prototype.doConfigs = function() {
		for(var i = 0; i < this.configs.length; i++) {
			var run = this.configs[i];
			this.EntityManager.config(run);
		}

		return this;
	};

	Module.prototype.doRuns = function() {
		for(var i = 0; i < this.runs.length; i++) {
			var run = this.runs[i];
			this.EntityManager.run(run);
		}

		return this;
	};

	Module.prototype.run = function(fn) {
		this.runs.push(fn);

		return this;
	};

	Module.prototype.config = function(fn) {
		this.configs.push(fn);

		return this;
	};

	Module.prototype.registerEntityGroupsFromPath = function(patterns) {
		var path = process.cwd() + '/';
		if(this.snooze.modulePaths[this.name]) {
			path = this.snooze.modulePaths[this.name] + '/';
		}

		var files = this.glob(patterns, {cwd: path});
		for(var i = 0; i < files.length; i++) {
			var Ent = require(path + files[i]);
			this.EntityManager.registerEntityGroup(Ent);
		}

		return this;
	};

	Module.prototype.registerEntitiesFromPath = function(patterns) {
		var path = process.cwd() + '/';
		if(this.snooze.modulePaths[this.name]) {
			path = this.snooze.modulePaths[this.name] + '/';
		}
		
		var files = this.glob(patterns, {cwd: path});
		for(var i = 0; i < files.length; i++) {
			require(path + files[i]);
		}

		return this;
	};

	Module.prototype.registerImportProcessesFromPath = function(patterns) {
		var path = process.cwd() + '/';
		if(this.snooze.modulePaths[this.name]) {
			path = this.snooze.modulePaths[this.name] + '/';
		}

		var files = this.glob(patterns, {cwd: path});
		for(var i = 0; i < files.length; i++) {
			var proc = require(path + files[i]);
			this.importProcess(proc);
		}

		return this;
	};

	Module.prototype.registerConfigPreprocessorsFromPath = function(patterns) {
		var path = process.cwd() + '/';
		if(this.snooze.modulePaths[this.name]) {
			path = this.snooze.modulePaths[this.name] + '/';
		}

		var files = this.glob(patterns, {cwd: path});
		for(var i = 0; i < files.length; i++) {
			var proc = require(path + files[i]);
			this.configPreprocessor(proc);
		}

		return this;
	};

	// Accessors

	Module.prototype.getName = function() {
		return this.name;
	};

	Module.prototype.getConfig = function() {
		return this.snoozeConfig;
	};

	Module.prototype.getSnooze = function() {
		return this.snooze;
	};

	Module.prototype.getConfigPreprocessors = function() {
		return this.configPreprocessors;
	};

	Module.prototype.getImportProcesses = function() {
		return this.importProcesses;
	};

	// Helpers

	Module.prototype.log = function() {
		if(this.snoozeConfig.silent === false) {
			var log = Function.prototype.bind.call(console.log, console);
			if(this.logging === true) {
				log.apply(console, arguments);
			}
		}

		return this;
	};

	Module.prototype.warn = function() {
		arguments[0] = (arguments[0]+'').red;
		if(this.snoozeConfig.silent === false || this.snoozeConfig.silent === 'log') {
			var log = Function.prototype.bind.call(console.log, console);
			if(this.logging === true) {
				log.apply(console, arguments);
			}
		}

		return this;
	};

	Module.prototype.exit = function(code) {
		process.exit(code);
	};

	Module.prototype.glob = function(patterns, options) {
		if(!_.isArray(patterns)) {
			patterns = [patterns];
		}

		var res = [];
		for(var i = 0; i < patterns.length; i++) {
			var pattern = patterns[i];
			var results = glob.sync(pattern, options);
				
			for(var k = 0; k < results.length; k++) {
				var result = results[k];
				res.push(result);
			}
		}

		return res;
	};

	module.exports = Module;
})();