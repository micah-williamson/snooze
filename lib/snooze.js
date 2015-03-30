(function() {
  'use strict';

  var Module = require('./module');
  var fs = require('fs');
  var _ = require('lodash');
  var glob = require('glob');

  var Snooze = function() {
    this.modules = [];
    this.pathToSelf = __dirname;
    this.modulePaths = {};
    this.EntityGroup = require('./entityGroup');
    this.Entity = require('./entity');
    this.Util = require('./util');

    // Check if project json exists

    if (fs.existsSync(process.cwd() + '/snooze.json')) {
      try {
        this.config = JSON.parse(fs.readFileSync(process.cwd() +
          '/snooze.json'));
      } catch (e) {
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

    if (mod === undefined) {
      return false;
    }

    return true;
  };

  Snooze.prototype.getModule = function(nm) {
    for (var i = 0; i < this.modules.length; i++) {
      var module = this.modules[i];
      if (module.getName() === nm) {
        return module;
      }
    }
  };

  Snooze.prototype.createModule = function(nm, modules) {
    var module = new Module(nm, modules, this);
    var __directory;
    module.registerImportProcessesFromPath(
      'importProcesses/importEntityGroups.js', this.pathToSelf + '/');
    module.registerImportProcessesFromPath(
      'importProcesses/importEntities.js', this.pathToSelf + '/');

    module.importModuleConfigPreprocessors();
    module.importModuleImportProcesses();
    module.preprocessConfig();
    module.importModules();

    this.modules.push(module);
    return module;
  };

  Snooze.prototype.module = function(nm, modules) {
    if (this.moduleExists(nm)) {
      return this.getModule(nm);
    } else {
      if (typeof modules === 'object' && modules.length > 0) {
        for (var i = 0; i < modules.length; i++) {
          var submod = modules[i];

          if (!this.moduleExists(submod)) {
            var path = this.findSubmodPath(submod);

            if (path) {
              var parts = path.split('/');
              parts.pop();
              var regPath = parts.join('/');
              this.registerModulePath(submod, regPath);

              require(path);
            } else {
              throw new Error(
                'Unable to find submodule in node_modules (recursively): ' +
                submod);
            }
          }
        }
      }

      return this.createModule(nm, modules);
    }
  };

  Snooze.prototype.findSubmodPath = function(submod) {
    var packagePaths = this.glob('**/node_modules/' + submod +
      '/package.json', {
        cwd: process.cwd()
      });
    var packagePath = packagePaths[0];

    if (packagePath) {
      var packageJSON = JSON.parse(fs.readFileSync(packagePath));
      var mainScript = packageJSON.main || "index.js";
      var mainPaths = this.glob('**/node_modules/' + submod + '/' +
        mainScript, {
          cwd: process.cwd()
        });
      var mainPath = mainPaths[0];

      if (mainPath) {
        return process.cwd() + '/' + mainPath;
      }
    }

    return undefined;
  };

  Snooze.prototype.fatal = function(err) {
    this.fatalCallback(err);
  };

  Snooze.prototype.fatal.toString = function() {
    return fatalCallback + '';
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
    for (var key in this.modulePaths) {
      delete this.modulePaths[key];
    }
  };

  Snooze.prototype.glob = function(patterns, options) {
    if (!_.isArray(patterns)) {
      patterns = [patterns];
    }

    var res = [];
    for (var i = 0; i < patterns.length; i++) {
      var pattern = patterns[i];
      var results = glob.sync(pattern, options);

      for (var k = 0; k < results.length; k++) {
        var result = results[k];
        res.push(result);
      }
    }

    return res;
  };

  module.exports = new Snooze();
})();
